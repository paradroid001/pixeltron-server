// const logger = require("../../utils/Logging");
import logger from '../../utils/Logging';
import * as SocketIO from 'socket.io';

import { NetPlayer } from './NetPlayer';
import { NetEntity } from './NetEntity';
import { GameServer } from './GameServer';
import { GameServerEvent } from './Protocol';

export class PlayerConnection {
    private _player: NetPlayer;
    private connectionID: number;
    private socketio: SocketIO.Socket;
    private lastPing: number;
    private latency: number;
    private rtt: number;

    constructor(id: number, socket: SocketIO.Socket) {
        this.connectionID = id;
        this.socketio = socket;
        this.lastPing = Date.now();
    }

    get player(): NetPlayer {
        return this._player;
    }
    get cid(): number {
        return this.connectionID;
    }

    get socket(): SocketIO.Socket {
        return this.socketio;
    }

    public associate(player: NetPlayer) {
        this._player = player;
        player.connection = this;
    }

    public destroy(): void {
        logger.info('TODO: clean up playerconnection.player here');
        this._player.connection = null;
        this._player = null;
    }

    public pinged(phase: number): void {
        logger.info('THERE WAS A PING');
        const now: number = Date.now();
        if (phase == 1) {
            this.lastPing = now;
            this.socketio.emit(GameServerEvent.PONG1, '{}');
        } else if (phase == 2) {
            this.rtt = now - this.lastPing;
            this.latency = this.rtt / 2;
            this.socketio.emit(GameServerEvent.PONG2, '' + this.latency);
        }
    }
}

export class PlayerConnections {
    private pdict: { [index: number]: PlayerConnection } = {};
    private playeridCounter: number;
    constructor() {
        this.playeridCounter = 100;
    }

    get nextID(): number {
        return ++this.playeridCounter;
    }

    public exists(id: number): boolean {
        return this.pdict.hasOwnProperty(id);
    }

    public get(id: number): PlayerConnection {
        const pc: PlayerConnection = this.pdict[id];
        return pc;
    }

    public get size(): number {
        return Object.keys(this.pdict).length;
    }

    // true if add worked.
    // false if player already existed
    public add(pc: PlayerConnection): boolean {
        let retval = false;
        if (!this.exists(pc.cid)) {
            this.pdict[pc.cid] = pc;
            retval = true;
        }
        return retval;
    }

    public remove(pc: PlayerConnection): boolean {
        let retval = false;
        if (this.exists(pc.cid)) {
            pc.destroy();
            delete this.pdict[pc.cid];
            retval = true;
        }
        return retval;
    }

    // Create a new playerconnection and add it to the player dict.
    // also create the player and associate them with the connection.
    // socket is the soccet they're connected on
    // playerdata is database info / saved player info (potentially)
    // THIS FUNCTION RETURNS THE PLAYER, not PLAYERCONNECTION
    // public createPlayer<T extends NetPlayer>(socket: socketIO.Socket, playerdata: any, PlayerClassCreator: new() => T) : T
    public createPlayerConnection(socket: SocketIO.Socket, player: NetPlayer): NetPlayer {
        const pc = new PlayerConnection(this.nextID, socket);
        pc.associate(player);
        this.add(pc);
        return player;
    }
}
