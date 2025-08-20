const {
   ErrorFactory,
   formatErrorResponse,
   getErrorStatusCode,
   isOperationalError,
   logError,
} = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Centralized Error Handler Middleware
 * Single point of error processing using http-errors
 * Handles all error types: operational, system, Sequelize, JWT, etc.
 */
function errorHandler(err, req, res, next) {
   let error = err;

   // Convert known errors to http-errors format
   if (!isOperationalError(err)) {
      // Handle Sequelize errors
      if (err.name?.startsWith('Sequelize')) {
         error = ErrorFactory.fromSequelize(err);
      }
      // Handle JWT errors
      else if (err.name?.includes('JsonWebToken') || err.name === 'TokenExpiredError') {
         error = ErrorFactory.fromJWT(err);
      }
      // Handle generic system errors
      else {
         error = ErrorFactory.internal('An unexpected error occurred', err);
      }
   }

   // Log the error with context
   logError(error, {
      requestId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      tenant: req.tenant ? { id: req.tenant.id, name: req.tenant.name } : null,
      tenantCode: req.tenantCode,
   });

   // Get status code
   const statusCode = getErrorStatusCode(error);

   // Format error response
   const errorResponse = formatErrorResponse(error);

   // Send error response
   res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 - Not Found
 * Creates standardized 404 responses
 */
function notFoundHandler(req, res, next) {
   const error = ErrorFactory.notFound(`Route ${req.method} ${req.originalUrl}`);
   next(error);
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
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
}

/**
 * Async error handler wrapper
 * Catches async errors and passes to error handler
 */
function asyncHandler(fn) {
   return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
   };
}

/**
 * Express async error wrapper for route handlers
 * Usage: router.get('/route', catchAsync(async (req, res) => { ... }))
 */
function catchAsync(fn) {
   return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch((err) => {
         // Log async handler error
         logError(err, {
            handler: 'asyncHandler',
            method: req.method,
            url: req.url,
            user: req.user?.id,
         });
         next(err);
      });
   };
}

/**
 * Health check middleware
 */
async function healthCheck(req, res) {
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
}

/**
 * Process exit handler for uncaught exceptions
 * Should only be used as last resort - proper error handling is preferred
 */
function setupProcessErrorHandlers() {
   // Handle uncaught exceptions
   process.on('uncaughtException', (err) => {
      logError(err, {
         type: 'uncaughtException',
         fatal: true,
      });

      // Give time for logging then exit
      setTimeout(() => {
         process.exit(1);
      }, 1000);
   });

   // Handle unhandled promise rejections
   process.on('unhandledRejection', (reason, promise) => {
      const err = reason instanceof Error ? reason : new Error(reason);
      logError(err, {
         type: 'unhandledRejection',
         promise: promise.toString(),
      });

      // Don't exit on unhandled rejections - just log them
   });
}

module.exports = {
   errorHandler,
   notFoundHandler,
   requestLogger,
   asyncHandler,
   catchAsync,
   healthCheck,
   setupProcessErrorHandlers,
};
