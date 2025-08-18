/**
 * Bulletproof Logging Configuration
 * Comprehensive logging with rotation, levels, and structured output
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const appConfig = require('./app-config');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '..', appConfig.logging.logsDirectory);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format for better readability
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: appConfig.logging.datePattern === 'YYYY-MM-DD' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || appConfig.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'school-erp',
    version: require('../package.json').version
  },
  transports: [
    // Error log file - only errors
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: appConfig.logging.datePattern,
      level: 'error',
      maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
      maxFiles: appConfig.logging.maxFiles,
      zippedArchive: appConfig.logging.zippedArchive
    }),
    
    // Warning log file - warnings and above
    new DailyRotateFile({
      filename: path.join(logsDir, 'warning-%DATE%.log'),
      datePattern: appConfig.logging.datePattern,
      level: 'warn',
      maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
      maxFiles: appConfig.logging.maxFiles,
      zippedArchive: appConfig.logging.zippedArchive
    }),
    
    // Info log file - info and above
    new DailyRotateFile({
      filename: path.join(logsDir, 'info-%DATE%.log'),
      datePattern: appConfig.logging.datePattern,
      level: 'info',
      maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
      maxFiles: appConfig.logging.maxFiles,
      zippedArchive: appConfig.logging.zippedArchive
    }),
    
    // Debug log file - all levels (only in development)
    ...(process.env.NODE_ENV !== 'production' ? [
      new DailyRotateFile({
        filename: path.join(logsDir, 'debug-%DATE%.log'),
        datePattern: appConfig.logging.datePattern,
        level: 'debug',
        maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
        maxFiles: `${appConfig.logging.debugRetentionDays}d`,
        zippedArchive: appConfig.logging.zippedArchive
      })
    ] : []),
    
    // Combined log file - all levels
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: appConfig.logging.datePattern,
      maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
      maxFiles: appConfig.logging.maxFiles,
      zippedArchive: appConfig.logging.zippedArchive
    }),
    
    // Audit log file - for security and compliance
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: appConfig.logging.datePattern,
      level: 'warn',
      maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
      maxFiles: `${appConfig.logging.auditRetentionDays}d`,
      zippedArchive: appConfig.logging.zippedArchive
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Add specialized logging methods for different contexts
logger.auth = (action, userId, email, meta = {}) => {
  logger.info(`AUTH: ${action}`, {
    userId,
    email: email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : null, // Mask email
    ip: meta.ip,
    userAgent: meta.userAgent,
    ...meta,
    category: 'authentication'
  });
};

logger.business = (action, entity, entityId, meta = {}) => {
  logger.info(`BUSINESS: ${action}`, {
    entity,
    entityId,
    ...meta,
    category: 'business'
  });
};

logger.security = (threat, level, meta = {}) => {
  logger.warn(`SECURITY: ${threat}`, {
    threatLevel: level,
    ...meta,
    category: 'security'
  });
};

logger.performance = (operation, duration, meta = {}) => {
  const level = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug';
  logger[level](`PERFORMANCE: ${operation}`, {
    duration: `${duration}ms`,
    ...meta,
    category: 'performance'
  });
};

logger.database = (operation, table, meta = {}) => {
  logger.debug(`DATABASE: ${operation}`, {
    table,
    ...meta,
    category: 'database'
  });
};

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: appConfig.logging.datePattern,
    maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
    maxFiles: appConfig.logging.maxFiles,
    zippedArchive: appConfig.logging.zippedArchive
  })
);

logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: appConfig.logging.datePattern,
    maxSize: process.env.LOG_MAX_SIZE || appConfig.logging.maxSize,
    maxFiles: appConfig.logging.maxFiles,
    zippedArchive: appConfig.logging.zippedArchive
  })
);

// Log startup information
logger.info('Logger initialized', {
  logLevel: logger.level,
  nodeEnv: process.env.NODE_ENV,
  logDirectory: logsDir
});

module.exports = logger;