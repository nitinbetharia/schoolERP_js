/**
 * Bulletproof Error Handling Middleware
 * Comprehensive error handling with graceful degradation
 */

const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

// Custom error classes for different scenarios
class BusinessError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.details = details;
    this.statusCode = 400;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends Error {
  constructor(field, message, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.statusCode = 422;
    this.timestamp = new Date().toISOString();
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTHENTICATION_REQUIRED';
    this.statusCode = 401;
    this.timestamp = new Date().toISOString();
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'ACCESS_DENIED';
    this.statusCode = 403;
    this.timestamp = new Date().toISOString();
  }
}

class DatabaseError extends Error {
  constructor(operation, originalError) {
    super(`Database operation failed: ${operation}`);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.originalError = originalError;
    this.statusCode = 500;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Request ID middleware - adds unique ID to each request
 */
function requestIdMiddleware(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.method} ${req.path} not found`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
}

/**
 * Main error handler - handles all errors with appropriate responses
 */
function errorHandler(err, req, res, next) {
  const requestId = req.id || 'unknown';
  
  // Log all errors with full context
  const errorContext = {
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.session?.user?.id,
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code
    }
  };

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      requestId
    },
    timestamp: new Date().toISOString()
  };

  // Handle different error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 422;
      errorResponse.error = {
        code: 'VALIDATION_ERROR',
        message: err.message,
        field: err.field,
        value: err.value,
        requestId
      };
      logger.warn('Validation error', errorContext);
      break;

    case 'BusinessError':
      statusCode = err.statusCode || 400;
      errorResponse.error = {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId
      };
      logger.warn('Business logic error', errorContext);
      break;

    case 'AuthenticationError':
      statusCode = 401;
      errorResponse.error = {
        code: 'AUTHENTICATION_REQUIRED',
        message: err.message,
        requestId
      };
      logger.security('Authentication failure', 'medium', errorContext);
      break;

    case 'AuthorizationError':
      statusCode = 403;
      errorResponse.error = {
        code: 'ACCESS_DENIED',
        message: err.message,
        requestId
      };
      logger.security('Authorization failure', 'medium', errorContext);
      break;

    case 'DatabaseError':
      statusCode = 500;
      errorResponse.error = {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        operation: err.operation,
        requestId
      };
      logger.error('Database error', errorContext);
      sendCriticalAlert('Database Error', errorContext);
      break;

    case 'JsonWebTokenError':
    case 'TokenExpiredError':
    case 'NotBeforeError':
      statusCode = 401;
      errorResponse.error = {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired',
        requestId
      };
      logger.security('JWT token error', 'low', errorContext);
      break;

    case 'SyntaxError':
      if (err.message.includes('JSON')) {
        statusCode = 400;
        errorResponse.error = {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
          requestId
        };
        logger.warn('Invalid JSON request', errorContext);
      }
      break;

    default:
      // Unknown errors - log as critical
      logger.error('Unknown error', errorContext);
      sendCriticalAlert('Unknown Error', errorContext);
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        errorResponse.error.message = 'An unexpected error occurred';
      } else {
        errorResponse.error.message = err.message;
        errorResponse.error.stack = err.stack;
      }
  }

  // Send appropriate response based on request type
  if (req.accepts('html') && !req.xhr) {
    // HTML response for browser requests
    const errorPage = getErrorPage(statusCode);
    res.status(statusCode).render(errorPage, {
      title: `Error ${statusCode}`,
      error: errorResponse.error,
      hideNavigation: true,
      layout: 'layouts/error'
    });
  } else {
    // JSON response for API requests
    res.status(statusCode).json(errorResponse);
  }
}

/**
 * Get appropriate error page template based on status code
 */
function getErrorPage(statusCode) {
  switch (statusCode) {
    case 404:
      return 'errors/404';
    case 403:
      return 'errors/403';
    case 401:
      return 'errors/401';
    case 500:
    default:
      return 'errors/500';
  }
}

/**
 * Critical alert system for production issues
 */
function sendCriticalAlert(type, context) {
  // Log critical alert
  logger.error('CRITICAL ALERT', {
    alertType: type,
    context,
    serverInfo: {
      hostname: require('os').hostname(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      load: require('os').loadavg()
    }
  });
  
  // In production, you would implement actual alerting here:
  // - Send email to administrators
  // - Send SMS alerts for critical issues
  // - Post to Slack/Teams channel
  // - Integrate with monitoring services (PagerDuty, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement actual alerting mechanism
    console.error('CRITICAL ALERT:', type, JSON.stringify(context, null, 2));
  }
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Rate limit error handler
 */
function rateLimitHandler(req, res) {
  const requestId = req.id || 'unknown';
  
  logger.security('Rate limit exceeded', 'medium', {
    requestId,
    ip: req.ip,
    url: req.url,
    userAgent: req.get('User-Agent')
  });

  if (req.accepts('html') && !req.xhr) {
    return res.status(429).render('errors/429', {
      title: 'Too Many Requests',
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait and try again.',
        requestId
      },
      hideNavigation: true
    });
  }

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait and try again.',
      retryAfter: 900,
      requestId
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  // Error classes
  BusinessError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  
  // Middleware functions
  requestIdMiddleware,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  rateLimitHandler,
  
  // Utility functions
  sendCriticalAlert
};