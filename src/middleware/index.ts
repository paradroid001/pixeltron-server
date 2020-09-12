import { handleCors, handleBodyRequestParsing, handleCompression, handlePM2Monitor } from './common';

import { handleAPIDocs } from './apiDocs';

export default [
    handleCors,
    handleBodyRequestParsing,
    handleCompression,
    handleAPIDocs,
    // handlePM2Monitor
];
