const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
   fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
   winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
   winston.format.errors({ stack: true }),
   winston.format.json(),
   winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = {
         timestamp,
         level: level.toUpperCase(),
         message,
         ...meta,
      };

      if (stack) {
         log.stack = stack;
      }

      return JSON.stringify(log);
   })
);

// Create daily rotate file transport for general logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
   filename: path.join(logsDir, 'app-%DATE%.log'),
   datePattern: 'YYYY-MM-DD',
   maxSize: '20m',
   maxFiles: '14d',
   format: logFormat,
});

// Create daily rotate file transport for error logs
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
   filename: path.join(logsDir, 'error-%DATE%.log'),
   datePattern: 'YYYY-MM-DD',
   level: 'error',
   maxSize: '20m',
   maxFiles: '30d',
   format: logFormat,
});

// Create daily rotate file transport for audit logs
const auditFileRotateTransport = new winston.transports.DailyRotateFile({
   filename: path.join(logsDir, 'audit-%DATE%.log'),
   datePattern: 'YYYY-MM-DD',
   maxSize: '50m',
   maxFiles: '365d',
   format: logFormat,
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
   format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
         const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
         return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
   ),
});

// Main application logger
const logger = winston.createLogger({
   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
   format: logFormat,
   defaultMeta: { service: 'school-erp' },
   transports: [fileRotateTransport, errorFileRotateTransport],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
   logger.add(consoleTransport);
}

// Audit logger (separate from main logger)
const auditLogger = winston.createLogger({
   level: 'info',
   format: logFormat,
   defaultMeta: { service: 'school-erp-audit' },
   transports: [auditFileRotateTransport],
});

// Database query logger
const dbLogger = winston.createLogger({
   level: 'debug',
   format: logFormat,
   defaultMeta: { service: 'school-erp-db' },
   transports: [
      new winston.transports.DailyRotateFile({
         filename: path.join(logsDir, 'database-%DATE%.log'),
         datePattern: 'YYYY-MM-DD',
         maxSize: '10m',
         maxFiles: '7d',
         format: logFormat,
      }),
   ],
});

// Helper functions for structured logging
const logHelpers = {
   // Log authentication events
   logAuth: (action, userId, tenantId, meta = {}) => {
      auditLogger.info('Authentication Event', {
         category: 'AUTH',
         action,
         userId,
         tenantId,
         timestamp: new Date().toISOString(),
         ...meta,
      });
   },

   // Log business operations
   logBusiness: (action, userId, tenantId, entity, entityId, changes = {}) => {
      auditLogger.info('Business Operation', {
         category: 'BUSINESS',
         action,
         userId,
         tenantId,
         entity,
         entityId,
         changes,
         timestamp: new Date().toISOString(),
      });
   },

   // Log system events
   logSystem: (event, meta = {}) => {
      logger.info('System Event', {
         category: 'SYSTEM',
         event,
         timestamp: new Date().toISOString(),
         ...meta,
      });
   },

   // Log errors with context
   logError: (error, context = {}) => {
      logger.error('Application Error', {
         category: 'ERROR',
         message: error.message,
         stack: error.stack,
         context,
         timestamp: new Date().toISOString(),
      });
   },

   // Log database operations
   logDB: (operation, query, executionTime, meta = {}) => {
      dbLogger.debug('Database Operation', {
         category: 'DATABASE',
         operation,
         query: query.substring(0, 500), // Truncate long queries
         executionTime,
         timestamp: new Date().toISOString(),
         ...meta,
      });
   },

   // Log API requests
   logAPI: (method, url, statusCode, responseTime, userId, tenantId) => {
      logger.info('API Request', {
         category: 'API',
         method,
         url,
         statusCode,
         responseTime,
         userId,
         tenantId,
         timestamp: new Date().toISOString(),
      });
   },
};

module.exports = {
   logger,
   auditLogger,
   dbLogger,
   ...logHelpers,
};
