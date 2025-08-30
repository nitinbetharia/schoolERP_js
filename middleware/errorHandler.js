const { formatErrorResponse } = require('../utils/validation');
const { logger } = require('../utils/logger');
const { sendErrorAlert } = require('../utils/emailService');

/**
 * Error severity classification for better handling
 */
const ERROR_SEVERITY = {
   LOW: 'low', // User input errors, validation failures
   MEDIUM: 'medium', // Business logic errors, external service issues
   HIGH: 'high', // System errors, database failures
   CRITICAL: 'critical', // Application crashes, data corruption, security issues
};

/**
 * Classify error severity based on error type and status code
 */
function classifyErrorSeverity(err, statusCode) {
   // Critical errors
   if (statusCode >= 500) {
      if (err.name?.includes('Database') || err.name?.startsWith('Sequelize')) {
         return ERROR_SEVERITY.CRITICAL;
      }
      if (err.message?.toLowerCase().includes('crash') || err.message?.toLowerCase().includes('corruption')) {
         return ERROR_SEVERITY.CRITICAL;
      }
      return ERROR_SEVERITY.HIGH;
   }

   // Authentication/Authorization errors
   if (statusCode === 401 || statusCode === 403) {
      return ERROR_SEVERITY.MEDIUM;
   }

   // Client errors
   if (statusCode >= 400 && statusCode < 500) {
      if (err.name === 'ValidationError') {
         return ERROR_SEVERITY.LOW;
      }
      return ERROR_SEVERITY.MEDIUM;
   }

   return ERROR_SEVERITY.LOW;
}

/**
 * Extract user-friendly message from error object
 */
function extractUserMessage(err) {
   // Try to get user-friendly message
   if (err.userMessage) {
      return err.userMessage;
   }

   // Handle common error types
   if (err.name?.startsWith('Sequelize')) {
      return 'A database error occurred. Please try again.';
   }

   if (err.name?.includes('JsonWebToken') || err.name === 'TokenExpiredError') {
      return 'Your session has expired. Please log in again.';
   }

   if (err.name === 'ValidationError') {
      if (err.details && err.details.validationErrors && Array.isArray(err.details.validationErrors)) {
         const messages = err.details.validationErrors.map((ve) => ve.message || 'Invalid value');
         return messages.join(', ');
      }
      if (err.details && Array.isArray(err.details)) {
         return err.details.map((d) => d.message).join(', ');
      }
      return 'Please check your input and try again.';
   }

   // For API error objects, try to extract meaningful message
   if (typeof err === 'object' && err.message) {
      // Clean up technical messages for users
      const message = err.message;

      // Remove stack traces and technical details from user message
      if (message.includes('at ') || message.includes('Error:')) {
         return 'An unexpected error occurred. Please try again.';
      }

      return message;
   }

   return 'An unexpected error occurred. Please try again.';
}

/**
 * Format error for flash message display
 */
function formatFlashError(err, userMessage) {
   const isDevelopment = process.env.NODE_ENV === 'development';

   // Create base flash message
   const flashMessage = {
      message: userMessage,
      technical: isDevelopment,
   };

   // Add validation errors if present (for user-friendly display)
   if (err.details && err.details.validationErrors) {
      flashMessage.validationErrors = err.details.validationErrors.map((ve) => ({
         field: ve.field || 'unknown',
         message: ve.message || 'Invalid value',
      }));
   }

   // Add available options for NotFoundErrors
   if (err.name === 'NotFoundError' && err.details) {
      if (err.details.availableSteps) {
         flashMessage.suggestions = `Available options: ${err.details.availableSteps.join(', ')}`;
      }
   }

   // In development, add comprehensive debugging information
   if (isDevelopment) {
      if (err.context) {
         flashMessage.context = err.context;
      }

      if (err.details) {
         flashMessage.debugDetails = err.details;
      }

      if (err.timestamp) {
         flashMessage.timestamp = err.timestamp;
      }

      if (err.stack) {
         // First 5 lines of stack for debugging
         flashMessage.stack = err.stack.split('\n').slice(0, 5).join('\n');
      }
   }

   return flashMessage;
}

/**
 * Send error alert email in production for high/critical severity errors
 */
async function handleErrorAlert(err, req, severity) {
   if (process.env.NODE_ENV !== 'production') {
      return; // Only send alerts in production
   }

   if (severity !== ERROR_SEVERITY.HIGH && severity !== ERROR_SEVERITY.CRITICAL) {
      return; // Only alert for high/critical errors
   }

   try {
      await sendErrorAlert({
         error: err,
         request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            user: req.user,
            tenant: req.tenant,
            tenantCode: req.tenantCode,
         },
         severity,
         timestamp: new Date().toISOString(),
      });
   } catch (emailError) {
      logger.error('Failed to send error alert email', {
         originalError: err.message,
         emailError: emailError.message,
      });
   }
}

/**
 * Centralized Error Handler Middleware
 * Enhanced with smart error object processing and email alerts
 */
function errorHandler(err, req, res, _next) {
   const error = err;
   let statusCode = err.statusCode || err.status || 500;

   // Classify error severity
   const severity = classifyErrorSeverity(err, statusCode);

   // Extract user-friendly message
   const userMessage = extractUserMessage(err);

   // Handle specific error types for status code adjustment
   if (err.name?.startsWith('Sequelize')) {
      statusCode = 400;
   } else if (err.name?.includes('JsonWebToken') || err.name === 'TokenExpiredError') {
      statusCode = 401;
   } else if (err.name === 'ValidationError') {
      statusCode = 400;
   }

   // Log the error with enhanced context
   logger.error('Request Error', {
      error: userMessage,
      severity: severity,
      originalError: err.message,
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

   // Send error alert for production high/critical errors
   handleErrorAlert(err, req, severity).catch((alertError) => {
      logger.warn('Error alert handling failed', { error: alertError.message });
   });

   // Format error response for API
   const errorResponse = formatErrorResponse(error, userMessage);

   // Check if this is a web request (HTML) or API request (JSON)
   const acceptsHTML = req.headers.accept && req.headers.accept.includes('text/html');
   const isWebRoute = !req.originalUrl.startsWith('/api/');

   if (acceptsHTML && isWebRoute) {
      // Format error for flash message
      const flashError = formatFlashError(err, userMessage);

      // Store structured error in flash for better display
      if (req.flash) {
         if (flashError.technical && process.env.NODE_ENV === 'development') {
            req.flash('error', {
               message: flashError.message,
               details: flashError.details,
               technical: true,
               severity: severity,
            });
         } else {
            req.flash('error', flashError.message);
         }
      }

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
         description: `Error ${statusCode} - ${userMessage}`,

         // Individual variables for templates that expect them
         errorCode: statusCode.toString(),
         errorMessage: userMessage,
         errorDetails: process.env.NODE_ENV === 'development' ? err.stack : null,
         originalUrl: req.originalUrl,
         severity: severity,

         // Error object for templates that expect it
         error: {
            statusCode: statusCode,
            status: statusCode,
            message: userMessage,
            stack: process.env.NODE_ENV === 'development' ? err.stack : null,
            severity: severity,
         },

         // User and tenant context
         user: req.user || null,
         tenant: req.tenant || null,

         // Flash messages (if available) - these will be processed by our enhanced system
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
      const { dbManager, modelHealthCheck } = require('../models/system/database');

      // Check database health
      const dbHealth = await dbManager.healthCheck();

      // Check model health
      const modelHealth = await modelHealthCheck();

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
