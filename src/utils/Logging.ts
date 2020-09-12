// const winston = require('winston');
import * as winston from 'winston';
import * as options from '../config/winston.json';
// instantiate a new Winston Logger with the settings defined above
const logger: winston.Logger = winston.createLogger({
    transports: [new winston.transports.File(options.file), new winston.transports.Console(options.console)],
    exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
// logger.stream = {
//  write(message: string, encoding: string) {
//    // use the 'info' log level so the output will be picked up by both transports (file and console)
//    logger.info(message);
//  },
// };

// module.exports = logger;
//export logger;
export default logger;
