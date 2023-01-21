import 'reflect-metadata'; //only for typeorm?

//This stuff shouldn't be needed any more.
//import dotenv from 'dotenv';
//dotenv.config({ path: './src/config/.env' }); // env vars
//const { PORT = 3000 } = process.env;
//const { MONITORPORT = 4000 } = process.env;

import logger from './utils/Logging';

import http from 'http';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import middleware from './middleware';
import errorHandlers from './middleware/errorHandlers';
import routes from './services';
//import * as path from 'path'; //don't need this anymore?

// ds.createAccount("test1", "password", "test1@test.com", false);

//ds.login("test1", "fdsd"); // should fail
//ds.login("test1", "password"); // should succeed

// ds.logout("test1"); No logout on ds...

export { Action } from './services/core/Action';
export { ActionMove } from './services/core/ActionMove';
export { ActionStatus } from './services/core/ActionStatus';
export { ActionStore } from './services/core/ActionStore';
export { Vector2, randomChoice, randomInt } from './services/core/Base';
export { GameServer } from './services/core/GameServer';
export { Message, Messaging } from './services/core/Message';
export { sync, SyncAccess, NetEntity } from './services/core/NetEntity';
export { NetEntityStore } from './services/core/NetEntityStore';
export { NetObject } from './services/core/NetObject';
export { NetPlayer } from './services/core/NetPlayer';
export { PlayerConnection, PlayerConnections } from './services/core/PlayerConnection';
export { GameServerEvent, GameServerEventField, GameClientEvent } from './services/core/Protocol';
export { GameServerStats } from './services/dashboard/GameServerStats';
export { MonitorServer } from './services/dashboard/MonitorServer';
export { DataService } from "./services/data/DataService";
export { PlayerAccount } from "./services/data/entities/PlayerAccount";
//export * from "./utils/Logging";
//export logger; 
export { copyResources } from './utils/copyResources';
export { ServerConfig } from './config/config';
import { MonitorServer } from './services/dashboard/MonitorServer';
import { GameServer } from './services/core/GameServer';
import { DataService } from './services/data/DataService';
const ds: DataService = new DataService();


// Error Handling
process.on('uncaughtException', (e) => {
    logger.error(e);
    process.exit(1);
});
process.on('unhandledRejection', (e) => {
    logger.error(e);
    process.exit(1);
});

export class PixeltronServer {
    public gamerouter;
    public gamehttp;
    public gameServer: GameServer;
    public monitorrouter;
    public monitorhttp;
    public monitorServer;

    constructor(gamepaths: any, monitorpaths:any ) 
    {
        this.gamerouter = express();
        for (let key in gamepaths)
        {
            this.gamerouter.use(key, express.static(gamepaths[key]));
        }
        //this.gamerouter.use('/game', express.static(path.join(__dirname, 'public', 'game')));
        //this.gamerouter.use('/public', express.static(path.join(__dirname, 'public')));
        //this.gamerouter.use('/tests', express.static(path.join(__dirname, 'tests')));
        //this.gamerouter.use('/tests/coverage/', express.static(path.join(__dirname, 'tests', 'lcov-report')));
        applyMiddleware(middleware, this.gamerouter);
        applyRoutes(routes, this.gamerouter);
        applyMiddleware(errorHandlers, this.gamerouter);

        this.monitorrouter = express();
        this.monitorrouter.set('views', monitorpaths['views']);
        this.monitorrouter.set('view engine', 'ejs');
        this.monitorrouter.use('/js', express.static(monitorpaths['/js']) );
        this.monitorrouter.get('/', (req, res) => {
            // render server template
            res.render('status');
        });
    }

    public start(gaddr: string, gport: string | number, maddr: string, mport: string | number, fn: (router: any, httpserver: any, port: number|string) => GameServer)
    {
        this.gamehttp = http.createServer(this.gamerouter);
        this.gamehttp.listen(gport, gaddr, () => {
            logger.info(`Server is running http://${gaddr}:${gport} in ${process.env.NODE_ENV} mode...`);
            //this.gameServer = new GameServer(router, this.gamehttp, gport);
            this.gameServer = fn(this.gamerouter, this.gamehttp, gport);
            
            this.monitorhttp = http.createServer(this.monitorrouter);
            this.monitorhttp.listen(mport, maddr, () => {
                this.monitorServer = new MonitorServer(this.monitorrouter, this.monitorhttp, mport);
                this.gameServer.monitor = this.monitorServer;
                logger.info(`Monitor is running http://${maddr}:${mport} in ${process.env.NODE_ENV} mode...`);
            });

        });
    }
}

/*
// Router setup
const router = express();
// to allow the use of pm server monitor

// really I want this put somewhere else.
router.use("/game", express.static(path.join(__dirname, "public", "game") ) );
router.use("/public", express.static(path.join(__dirname, "public") ) );
router.use("/tests", express.static(path.join(__dirname, "tests")));
router.use("/tests/coverage/", express.static(path.join(__dirname, "tests", "lcov-report")));

// logger.info(`Express Mapping /assets to ${path.join(__dirname, "assets") }`);

applyMiddleware(middleware, router);
applyRoutes(routes, router);
applyMiddleware(errorHandlers, router);


// Server Setup
const server = http.createServer(router);
let gameserver: GameServer;
server.listen( PORT, () =>
  {
    logger.info(`Server is running http://localhost:${PORT} in ${process.env.NODE_ENV} mode...` );
    gameserver = new GameServer(router, server, PORT);
  }
);

const monitor = express();
monitor.set("views", path.join(__dirname, "public"));
monitor.set("view engine", "ejs");
monitor.use("/js", express.static(path.join(__dirname, "public", "js")));
monitor.get("/", (req, res) => {
    // render server template
    res.render( "status" );
});
const monitorhttp = http.createServer(monitor);
let monitorServer: MonitorServer;
// start express server
monitorhttp.listen( MONITORPORT, () =>
{
    monitorServer = new MonitorServer(monitor, monitorhttp, MONITORPORT);
    gameserver.monitor = monitorServer;
    logger.info(`Monitor is running http://localhost:${MONITORPORT} in ${process.env.NODE_ENV} mode...`);
});

*/


