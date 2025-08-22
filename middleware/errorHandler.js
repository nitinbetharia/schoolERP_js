const { formatErrorResponse } = require('../utils/validation');
const { logger } = require('../utils/logger');

/**
 * Centralized Error Handler Middleware
 * Single point of error processing using http-errors
 * Handles all error types: operational, system, Sequelize, JWT, etc.
 */
function errorHandler(err, req, res, next) {
   let error = err;
   let statusCode = err.statusCode || err.status || 500;
   let message = err.message || 'An unexpected error occurred';

   // Handle specific error types
   if (err.name?.startsWith('Sequelize')) {
      statusCode = 400;
      message = 'Database error occurred';
   } else if (err.name?.includes('JsonWebToken') || err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Authentication failed';
   } else if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
   }

   // Log the error with context
   logger.error('Request Error', {
      error: message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      requestId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      tenant: req.tenant ? { id: req.tenant.id, name: req.tenant.name } : null,
      tenantCode: req.tenantCode,
   });

   // Format error response
   const errorResponse = formatErrorResponse(error, message);

   // Check if this is a web request (HTML) or API request (JSON)
   const acceptsHTML = req.headers.accept && req.headers.accept.includes('text/html');
   const isWebRoute = !req.originalUrl.startsWith('/api/');

   if (acceptsHTML && isWebRoute) {
      // Determine which error template to use based on status code
      let errorTemplate = 'pages/errors/generic';
      if (statusCode === 404) {
         errorTemplate = 'pages/errors/404';
      } else if (statusCode === 403) {
         errorTemplate = 'pages/errors/403';
      } else if (statusCode === 500 || statusCode >= 500) {
         errorTemplate = 'pages/errors/500';
      }

      // Render user-friendly error page for web requests using main layout
      return res.status(statusCode).render(errorTemplate, {
         layout: 'layout',
         title: `Error ${statusCode}`,
         description: `Error ${statusCode} - ${error.message || 'An unexpected error occurred'}`,

         // Individual variables for templates that expect them
         errorCode: statusCode.toString(),
         errorMessage: error.userMessage || error.message || 'An unexpected error occurred',
         errorDetails: process.env.NODE_ENV === 'development' ? error.stack : null,
         originalUrl: req.originalUrl,

         // Error object for templates that expect it
         error: {
            statusCode: statusCode,
            status: statusCode,
            message: error.userMessage || error.message || 'An unexpected error occurred',
            stack: process.env.NODE_ENV === 'development' ? error.stack : null,
         },

         // User and tenant context
         user: req.user || null,
         tenant: req.tenant || null,

         // Flash messages (if available)
         success: req.flash ? req.flash('success') : null,
         flashError: req.flash ? req.flash('error') : null,
         warning: req.flash ? req.flash('warning') : null,
         info: req.flash ? req.flash('info') : null,
      });
   }

   // Send JSON response for API requests
   res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 - Not Found
 * Creates standardized 404 responses
 */
function notFoundHandler(req, res, next) {
   // Create a more user-friendly 404 message
   const isAPI = req.originalUrl.startsWith('/api/');
   const message = isAPI
      ? `API endpoint ${req.method} ${req.originalUrl} not found`
      : `Page not found: ${req.originalUrl}`;

   const error = new Error(message);
   error.statusCode = 404;
   error.userMessage = isAPI
      ? 'The requested API endpoint does not exist'
      : 'The page you are looking for could not be found';

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
         logger.error('Async handler error', {
            error: err.message,
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
      logger.error('Health check failed', { error: error.message, context: 'healthCheck' });

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
      logger.error('Uncaught exception', {
         error: err.message,
         stack: err.stack,
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
      logger.error('Unhandled promise rejection', {
         error: err.message,
         stack: err.stack,
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
