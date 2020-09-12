// const logger = require("../utils/Logging");
import logger from './Logging';
import { Request, Response, NextFunction } from 'express';
import { HTTPClientError, HTTP404Error } from '../utils/httpErrors';

export const notFoundError = (req: Request) => {
    throw new HTTP404Error('Method not found. : ' + req.originalUrl);
};

export const clientError = (err: Error, res: Response, next: NextFunction) => {
    if (err instanceof HTTPClientError) {
        logger.warn(err);
        res.status(err.statusCode).send(err.message);
    } else {
        next(err);
    }
};

export const serverError = (err: Error, res: Response, next: NextFunction) => {
    logger.error(err);
    if (process.env.NODE_ENV === 'production') {
        res.status(500).send('Internal Server Error');
    } else {
        res.status(500).send(err.stack);
    }
};
