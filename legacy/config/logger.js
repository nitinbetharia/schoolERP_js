/**
 * Q&A Compliant Logger Implementation
 * Following Q9 (Winston + centralized error handler + structured logging)
 * Following Q25 (Multiple transports + daily file rotation)
 * Following Q29 (JSON config files + .env for secrets only)
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Q29 Compliant: Use config index, not direct app-config
const config = require('./index');

// Get logging configuration from Q29 compliant config
const loggingConfig = config.get('logging');
const appConfig = config.get('app');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', loggingConfig.logsDirectory);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Q25 Compliant: Winston with multiple transports + daily file rotation
// Custom log format for structured logging (Q9)
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format:
      loggingConfig.datePattern === 'YYYY-MM-DD' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss'
  }),
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

// Console format for development (Q9: structured logging)
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

// Q25 Compliant: Multiple transports with daily rotation
const transports = [];

// Error transport (Q25: multiple transports)
if (loggingConfig.categories.error.enabled) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, loggingConfig.categories.error.filename),
      datePattern: loggingConfig.datePattern,
      level: 'error',
      maxSize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles,
      zippedArchive: true // Q25: file rotation
    })
  );
}

// Auth transport (Q25: multiple transports)
if (loggingConfig.categories.auth.enabled) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, loggingConfig.categories.auth.filename),
      datePattern: loggingConfig.datePattern,
      level: 'info',
      maxSize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles,
      zippedArchive: true
    })
  );
}

// Security transport (Q25: multiple transports)
if (loggingConfig.categories.security.enabled) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, loggingConfig.categories.security.filename),
      datePattern: loggingConfig.datePattern,
      level: 'warn',
      maxSize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles,
      zippedArchive: true
    })
  );
}

// App transport (Q25: multiple transports)
if (loggingConfig.categories.app.enabled) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, loggingConfig.categories.app.filename),
      datePattern: loggingConfig.datePattern,
      maxSize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles,
      zippedArchive: true
    })
  );
}

// Combined log file - all levels (Q25: daily rotation)
transports.push(
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: loggingConfig.datePattern,
    maxSize: loggingConfig.maxSize,
    maxFiles: loggingConfig.maxFiles,
    zippedArchive: true
  })
);

// Debug transport for non-production (Q25: conditional transports)
if (appConfig.environment !== 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'debug-%DATE%.log'),
      datePattern: loggingConfig.datePattern,
      level: 'debug',
      maxSize: loggingConfig.maxSize,
      maxFiles: '7d', // Shorter retention for debug
      zippedArchive: true
    })
  );
}

// Q9 Compliant: Winston.createLogger() with centralized configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || loggingConfig.level,
  format: logFormat,
  defaultMeta: {
    service: appConfig.name.toLowerCase().replace(/\s+/g, '-'),
    version: appConfig.version,
    environment: appConfig.environment
  },
  transports: transports
});

// Console transport for non-production (Q9: structured logging)
if (appConfig.environment !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
}

// Q9 Compliant: Centralized error handler with specialized logging methods
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

// Q9 Compliant: Centralized error handler for uncaught exceptions
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'exceptions-%DATE%.log'),
    datePattern: loggingConfig.datePattern,
    maxSize: loggingConfig.maxSize,
    maxFiles: loggingConfig.maxFiles,
    zippedArchive: true
  })
);

// Q9 Compliant: Centralized error handler for unhandled rejections
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logsDir, 'rejections-%DATE%.log'),
    datePattern: loggingConfig.datePattern,
    maxSize: loggingConfig.maxSize,
    maxFiles: loggingConfig.maxFiles,
    zippedArchive: true
  })
);

// Q9 Compliant: Log startup information with structured logging
logger.info('Logger initialized', {
  logLevel: logger.level,
  nodeEnv: appConfig.environment,
  logDirectory: logsDir,
  transportsCount: transports.length,
  categories: Object.keys(loggingConfig.categories).filter(
    cat => loggingConfig.categories[cat].enabled
  )
});

module.exports = logger;
