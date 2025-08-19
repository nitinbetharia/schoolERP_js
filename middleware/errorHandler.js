const { logger, logError, formatErrorResponse } = require('../utils/logger');
const { formatErrorResponse: formatError } = require('../utils/errors');

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
const errorHandler = (err, req, res, next) => {
   // Log the error
   logError(err, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      tenantCode: req.tenantCode,
   });

   // Handle different error types
   let statusCode = err.statusCode || 500;
   let errorResponse;

   if (err.isOperational) {
      // Operational errors (expected errors)
      errorResponse = formatError(err);
   } else if (err.name === 'SequelizeValidationError') {
      // Sequelize validation errors
      statusCode = 400;
      errorResponse = {
         success: false,
         error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: err.errors.map((error) => ({
               field: error.path,
               message: error.message,
               value: error.value,
            })),
            timestamp: new Date().toISOString(),
         },
      };
   } else if (err.name === 'SequelizeUniqueConstraintError') {
      // Sequelize unique constraint errors
      statusCode = 409;
      errorResponse = {
         success: false,
         error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Duplicate entry found',
            details: err.errors.map((error) => ({
               field: error.path,
               message: `${error.path} already exists`,
               value: error.value,
            })),
            timestamp: new Date().toISOString(),
         },
      };
   } else if (err.name === 'SequelizeForeignKeyConstraintError') {
      // Foreign key constraint errors
      statusCode = 422;
      errorResponse = {
         success: false,
         error: {
            code: 'FOREIGN_KEY_CONSTRAINT',
            message: 'Referenced record not found',
            details: { field: err.field, value: err.value },
            timestamp: new Date().toISOString(),
         },
      };
   } else if (err.name === 'JsonWebTokenError') {
      // JWT errors
      statusCode = 401;
      errorResponse = {
         success: false,
         error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
            timestamp: new Date().toISOString(),
         },
      };
   } else {
      // Unexpected errors
      errorResponse = {
         success: false,
         error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
            timestamp: new Date().toISOString(),
         },
      };

      // Log stack trace for unexpected errors
      logger.error('Unexpected Error', {
         message: err.message,
         stack: err.stack,
         url: req.originalUrl,
         method: req.method,
      });
   }

   res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found middleware
 */
const notFoundHandler = (req, res) => {
   const errorResponse = {
      success: false,
      error: {
         code: 'NOT_FOUND',
         message: `Route ${req.originalUrl} not found`,
         timestamp: new Date().toISOString(),
      },
   };

   res.status(404).json(errorResponse);
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
   const startTime = Date.now();

   // Log request
   logger.info('API Request Started', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      tenantCode: req.tenantCode,
   });

   // Log response when finished
   res.on('finish', () => {
      const duration = Date.now() - startTime;

      logger.info('API Request Completed', {
         method: req.method,
         url: req.originalUrl,
         statusCode: res.statusCode,
         responseTime: `${duration}ms`,
         userId: req.user?.id,
         tenantCode: req.tenantCode,
      });
   });

   next();
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch rejected promises
 */
const asyncHandler = (fn) => {
   return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
   };
};

/**
 * Health check middleware
 */
const healthCheck = async (req, res) => {
   try {
      const { dbManager } = require('../models/database');
      const { modelRegistry } = require('../models');

      // Check database health
      const dbHealth = await dbManager.healthCheck();

      // Check model registry health
      const modelHealth = await modelRegistry.healthCheck();

      const health = {
         status: 'healthy',
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         memory: process.memoryUsage(),
         database: dbHealth,
         models: modelHealth,
         environment: process.env.NODE_ENV,
      };

      res.json({
         success: true,
         data: health,
      });
   } catch (error) {
      logError(error, { context: 'healthCheck' });

      res.status(503).json({
         success: false,
         error: {
            code: 'HEALTH_CHECK_FAILED',
            message: 'System health check failed',
            timestamp: new Date().toISOString(),
         },
      });
   }
};

module.exports = {
   errorHandler,
   notFoundHandler,
   requestLogger,
   asyncHandler,
   healthCheck,
};
