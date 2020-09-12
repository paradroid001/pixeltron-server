// require('dotenv').config( { path: "./src/config/.env" }); // env vars
import { Router } from 'express';
import express from 'express';
import cors from 'cors';
import parser from 'body-parser';
import compression from 'compression';
const monitor = require('pm2-server-monitor');

export const handleCors = (router: Router) => router.use(cors({ credentials: true, origin: true }));

export const handleBodyRequestParsing = (router: Router) => {
    router.use(parser.urlencoded({ extended: true }));
    router.use(parser.json());
};

export const handleCompression = (router: Router) => {
    router.use(compression());
};

export const handlePM2Monitor = (router: Router) => {
    // set static route
    router.use('/cluster', express.static('./node_modules/pm2-server-monitor/webUI/'));
    // Monitor setup for PM2
    monitor({
        name: 'local', // your server name, as a flag
        port: process.env.PORT, // your server listening port
    });
};
