// src/utils/logger.js
const winston = require('winston');
const { format } = winston;

// Custom format for logging
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Write logs to console
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }),
        // Write important logs to file
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to another file
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add stream for Morgan middleware
logger.stream = {
    write: (message) => logger.info(message.trim())
};

module.exports = logger;

// Example usage:

// Info level logging
// logger.info('Server started on port 3000');

// Error level logging with metadata
// logger.error('Database connection failed', { 
//     error: err.message,
//     stack: err.stack 
// });

// Debug level logging
// logger.debug('Processing request', { 
//     requestId: 'abc123',
//     method: 'GET',
//     path: '/api/users' 
// });

// Warning level logging
// logger.warn('Rate limit reached', { 
//     ip: '192.168.1.1',
//     endpoint: '/api/auth' 
// });