// const logger = require("../../utils/Logging");
import logger from '../../utils/Logging';
import * as SocketIO from 'socket.io';
import * as express from 'express';

import { Server } from 'http';

import { NetEntityStore } from './NetEntityStore';
import { GameClientEvent, GameServerEvent, GameServerEventField } from './Protocol';
import { Action } from './Action';
import { ActionStore } from './ActionStore';
import { NetPlayer } from './NetPlayer';
import { PlayerConnections } from './PlayerConnection';
import { GameServerStats } from '../dashboard/GameServerStats';
import { MonitorServer } from '../dashboard/MonitorServer';
import { Messaging } from './Message';
import { debug } from 'winston';

export class GameServer {
    protected port: string | number;
    protected app: express.Application;
    protected server: Server;

    protected io: SocketIO.Server;
    protected players: PlayerConnections;
    protected actions: ActionStore;
    protected messaging: Messaging;

    protected stats: GameServerStats;
    public monitor: MonitorServer; // i don't like coupling them like this.

    protected configdata: any = {};

    private createPlayerCallback: () => NetPlayer;

    constructor(router: express.Application, server: Server, port: string | number) {
        this.app = router;
        this.port = port;
        this.server = server;
        this.initSocket(this.server);
        logger.info('Socket IO interface enabled');
        this.stats = new GameServerStats();

        // Actionstore is actually a singleton but someone
        // has to init it because it's a bad singleton.
        this.actions = new ActionStore();
        this.players = new PlayerConnections();
        this.messaging = new Messaging(this.io, this.players);

        this.init();
    }

    protected init(): void {
        this.stats.timeslice = +process.env.SERVERTICKRATE;
        // Tick the server main loop.
        // TODO This may need to be done at a faster
        // rate for processing, but then changes
        // are only sent out at SERVERTICKRATE.
        // not sure yet.
        setInterval(() => {
            this.update();
        }, +process.env.SERVERTICKRATE);
    }

    protected createPlayer(playerdata: any): NetPlayer {
        return new NetPlayer(playerdata);
    }

    private initSocket(server: Server): void {
        // let io: SocketIO.Server = socketIO(server);

        // I am assigning this.io right now (instead of returning it at
        // the end of this function) so that the callback chain which happens
        // DURING initial connect can use this.io.emit, rather than
        // not have access to it until this chain ends.

        this.io = require('socket.io')(server, {
            pingInterval: process.env.WS_INTERVAL,
            pingTimeout: process.env.WS_TIMEOUT,
            //cors: {
            //    origin: 'http://127.0.0.1:3002',
            //    methods: ["GET", "POST"],
            //    transports: ['websocket', 'polling'],
            //    credentials: false
            //},
            allowEIO3: true
        });

        let thisobj = this;

        this.io.on(GameClientEvent.SOCKETCONNECT, (socket: any) => {
            logger.info('User connected on port ' + thisobj.port);
            // Set up auth response handler
            socket.on(GameClientEvent.AUTHRESPONSE, (data: any) => {
                thisobj.authenticate(socket, data);
            });
            // Ask the client to auth
            socket.emit(GameServerEvent.AUTHREQUEST, '');
        });
    }

    // Checks player authentication
    // if valid, goes to the next step which is setting up handlers
    // and responding to player with initial server condiguration.
    // if not valid, ???
    protected authenticate(socket: SocketIO.Socket, data: any): void {
        const authsuccess = true; // TODO: auto approving auth
        logger.info('Player authed with username ' + data.username + ' with result Success=' + authsuccess);

        if (authsuccess) {
            //TODO: here you'd be pulling player data out of the database.
            const playerData = { name: 'Baconator' };
            this.initialisePlayerConnection(socket, playerData);
        } else {
            // I don't actually know what would happen here
            logger.error('Auth success fail not implemented');
        }
    }

    protected initialisePlayerConnection(socket: SocketIO.Socket, playerdata: any): void {
        const player: NetPlayer = this.createPlayer(playerdata);

        this.players.createPlayerConnection(socket, player);

        // Set up handlers.
        socket.on(GameClientEvent.MESSAGE, (message: any) => {
            logger.info(`message from ${player.name} was ${message}`);
            this.messaging.onMessage({ msg: message, type: 0, args: [player.nid] });
        });

        socket.on(GameClientEvent.PLAYERINIT, () => {
            this.playerInit(player);
        });

        socket.on(GameClientEvent.CLIENT_DISCONNECT, (info: any) => {
            this.playerDisconnect(player, info);
        });

        socket.on(GameClientEvent.DISCONNECT, (info: any) => {
            this.socketDisconnect(player, info);
        });

        socket.on(GameClientEvent.ACTION, (actiondata: any) => {
            this.playerAction(player, actiondata);
        });

        socket.on(GameClientEvent.PING1, () => {
            logger.debug('Server recieved Ping1');
            player.connection.pinged(1); //message);
        });
        socket.on(GameClientEvent.PING2, () => {
            logger.debug('Server recieved Ping2');
            player.connection.pinged(2); //message);
        });

        // respond to player with initial configuration.
        // important to tell player which nid belongs to them
        this.configdata[GameServerEventField.CONFIGURE_PLAYERNID] = player.nid;
        socket.emit(GameServerEvent.CONFIGURE, this.configdata);
    }

    playerInit(player: NetPlayer): void {
        logger.info('Player requested init, name was : ' + player.name);
        // const player = this.players.createPlayer(socket);
        // send everything through as a create.
        // We want to omit anything that's currently new
        // (like ourselves), otherwise we will get those twice.
        const omit: string[] = NetEntityStore.instance.getNewEntities();
        // console.log("Omitting: " + omit);
        const c: {
            [key: number]: [string, any];
        } = NetEntityStore.instance.completeStore(omit);

        /*
        //So this can cause problems sending when it's a lot of data,
        //mainly for web. Instead, we chunk it up!
        let keys = Object.keys(c);
        let chunksize = 4;
        let fullchunks = Math.floor(keys.length / 4);

        for (let chunknum: number = 0; chunknum < fullchunks; chunknum++ )
        {
            let tempObj : { [key: number] : [string, any]} = {};
            for (let offset: number = 0; offset < chunksize; offset++)
            {
                tempObj[keys[(chunknum*chunksize)+offset]] = c[keys[(chunknum*chunksize)+offset]];
            }
            console.log("Send chunk" + chunknum);
            player.connection.socket.emit(GameServerEvent.CREATE, tempObj);
        }
        //So that will have done all but the remainder
        let lastObj : { [key: number] : [string, any]} = {};
        for ( let index: number = fullchunks*chunksize; index < keys.length; index++)
        {
            lastObj[keys[index]] = c[keys[index]];
        }
        console.log("Send final chunk");
        player.connection.socket.emit(GameServerEvent.CREATE, lastObj)
        */
        player.connection.socket.emit(GameServerEvent.CREATE, c);
    }

    playerDisconnect(player: NetPlayer, info: any): void {
        logger.info('Process player requested disconnection / deletion from world here');
        this.players.remove(player.connection);
        NetEntityStore.instance.destroyEntity(player);
    }

    socketDisconnect(player: NetPlayer, info: any): void {
        logger.info('Player was forcibly disconnected');
        this.players.remove(player.connection);
        NetEntityStore.instance.destroyEntity(player);
    }

    playerAction(player: NetPlayer, actiondata: any) {
        // TODO process the action into the action store to be run.
        logger.info(`Player action recieved from ${player.nid}: ${actiondata}`);

        // work out what action it is...
        const actiontype: string = actiondata[GameServerEventField.ACTION_TYPE];
        // console.log("actiontype: " + actiontype);

        if (player.handlesAction(actiontype)) {
            // create an action with the right nid and aid
            const action = new Action(player.nid, actiondata.aid);
            action.type = actiontype;
            action.args = actiondata.args;
            player.getHandler(actiontype).apply(player, [action]);
        } else logger.warn(`No action type defined for recieved action type ${actiontype} from ${player.nid}`);
    }

    update(): void {
        if (!this.io) return;
        logger.debug('' + Date.now());

        // Player actions are probably all in the astore by now
        // So simulate all simulatable npcs.

        // ACTION STATUS
        this.stats.queuedActions = ActionStore.instance.numQueuedActions;
        this.stats.actions = ActionStore.instance.numActions;
        ActionStore.instance.processActions(+process.env.SERVERTICKRATE);

        // TODO: so this will continually emit statuses that are in the list,
        // even when they haven't changed. We only want to emit statuses that have
        // changed. So this is like the NetEntity problem all over again.
        // may need to abstract out the 'detect change' functionality from
        // netentity
        if (ActionStore.instance.actionStatuses.length > 0) {
            logger.info(`action statuses to send: ${ActionStore.instance.actionStatuses.length}`);
            //can't seem to use GameServerEventField.ACTION_STATUS_SET as the string here...
            this.io.emit(GameServerEvent.ACTIONSTATUS, {
                actions: ActionStore.instance.actionStatuses,
            });
            // this.io.emit(GameServerEvent.ACTIONSTATUS, "Hello");
        }

        // Tick all the entities.
        // they can react to the action statuses.
        NetEntityStore.instance.tickEntities();

        // Now remove all actions with complete action statuses.
        // And all action statuses.
        ActionStore.instance.removeFinishedActions();

        // CREATE, UPDATE, DESTROY
        NetEntityStore.instance.collectChanges();
        // now we have sets of creations, updates, and destructions
        const creations = NetEntityStore.instance.creations;
        const updates = NetEntityStore.instance.updates;
        const destructions = NetEntityStore.instance.destructions;
        if (Object.keys(creations).length > 0) {
            // console.log("creations should be sent: " + JSON.stringify(Object.values(creations) ) );
            logger.info('creations to be sent: ' + Object.keys(creations).length);
            this.io.emit(GameServerEvent.CREATE, creations); // JSON.stringify(creations));
        }
        if (Object.keys(updates).length > 0) {
            logger.info('updates to be sent: ' + Object.keys(updates).length);
            this.io.emit(GameServerEvent.UPDATE, updates);
        }
        if (destructions.length > 0) {
            logger.info('destructions to be sent: ' + destructions.length);
            this.io.emit(GameServerEvent.DESTROY, destructions);
        }

        this.stats.playerCount = this.players.size;
        this.stats.entCount = Object.keys(NetEntityStore.instance.entities).length;
        this.stats.creates = Object.keys(creations).length;
        this.stats.updates = Object.keys(updates).length;
        this.stats.destroys = Object.keys(destructions).length;

        this.monitor.data = this.stats;

        NetEntityStore.instance.clearChanges();
    }
}
