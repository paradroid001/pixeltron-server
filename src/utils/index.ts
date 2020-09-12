import { Router, Request, Response, NextFunction } from 'express';

type Wrapper = (router: Router) => void;

// accepts the list of middleware wrappers we define in
// ./middleware/index.ts and express.Router.
export const applyMiddleware = (middleware: Wrapper[], router: Router) => {
    for (const f of middleware) {
        f(router);
    }
};

// Set up route handlers here.
type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

type Route = {
    path: string;
    method: string;
    handler: Handler | Handler[];
};

export const applyRoutes = (routes: Route[], router: Router) => {
    for (const route of routes) {
        const { method, path, handler } = route;
        (router as any)[method](path, handler);
    }
};
