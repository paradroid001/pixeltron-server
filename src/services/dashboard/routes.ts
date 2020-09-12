import { Request, Response } from 'express';
import * as path from 'path';

export default [
    {
        path: '/status/',
        method: 'get',
        handler: async (req: Request, res: Response) => {
            res.sendFile(path.join('public', 'server.html'), { root: './dist' });
        },
    },
];
