// require('dotenv').config( { path: "./src/config/.env" }); // env vars
// import * as socketIO from "socket.io";
import * as express from 'express';
import { Server } from 'http';
// const logger = require("../../utils/Logging");
import logger from '../../utils/Logging';

export class MonitorServer {
    public port: string | number;
    public app: express.Application;
    public server: Server;
    private io: SocketIO.Server;

    public data: { [index: string]: any };

    constructor(router: express.Application, server: Server, port: string | number) {
        this.app = router;
        this.port = port;
        this.server = server;
        this.io = this.initSocket(this.server);
        logger.info('Monitor server socker interface enabled');
        this.data = {};
        this.data.players = [];
        this.data.cpu = [];
        this.data.memory = [];
        this.io = this.initSocket(this.server);
        setInterval(() => {
            this.update();
        }, 1000);
    }

    private initSocket(server: Server): SocketIO.Server {
        const io: SocketIO.Server = require('socket.io')(server);

        io.on('connection', (socket: any) => {
            logger.info('Monitor: user connected on port ' + this.port);
            socket.emit('connected', {});
        });

        return io;
    }

    private update() {
        // console.log("Stats update emit");
        const mem: NodeJS.MemoryUsage = process.memoryUsage();
        const cpu: NodeJS.CpuUsage = process.cpuUsage();

        this.data.cpu_user = cpu.user; // time in microseconds
        this.data.cpu_system = cpu.system; // time in microseconds
        this.data.mem_used = mem.heapUsed; // total used from allocated
        this.data.mem_alloc = mem.heapTotal; // total allocated

        this.io.emit('update', this.data);
    }
}
