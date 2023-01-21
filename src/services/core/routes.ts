import { Request, Response } from 'express';
import * as path from 'path';

export default [
    {
        path: '/game/',
        method: 'get',
        handler: async (req: Request, res: Response) => {
            res.sendFile(path.join('public', 'game', 'index.html'), {
                root: './dist',
            });
        },
    }
];
