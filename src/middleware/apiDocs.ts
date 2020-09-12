import { Router } from 'express';
import express from 'express';
import * as path from 'path';

export const handleAPIDocs = (router: Router) =>
    router.use('/docs', express.static(path.join(__dirname, 'public', 'doc')));
