const logger = require('../config/logger');

class ErrorHandler {
  constructor() {
    this.logger = logger;
  }

  // Helper to detect browser requests
  isBrowserRequest(req) {
    return req.headers.accept && req.headers.accept.includes('text/html');
  }

  // Main error handling middleware
  handle() {
    return (err, req, res, next) => {
      // Log the error
      this.logError(err, req);

      // Check if this is a browser request
      if (this.isBrowserRequest(req)) {
        return this.handleBrowserError(err, req, res);
      }

      // API request - return JSON
      const errorResponse = this.buildErrorResponse(err, req);
      res.status(errorResponse.status).json(errorResponse.body);
    };
  }

  // Handle browser errors with redirects and error pages
  handleBrowserError(err, req, res) {
    const status = err.status || 500;
    
    // Add flash message if available
    if (typeof req.flash === 'function') {
      req.flash('error', err.message || 'An error occurred');
    }

    // Redirect based on error type
    if (status === 404) {
      return res.redirect('/error/404');
    } else if (status === 403) {
      return res.redirect('/error/403');
    } else if (status === 401) {
      return res.redirect('/auth/login');
    } else {
      return res.redirect('/error/500');
    }
  }

  // 404 handler
  notFound() {
    return (req, res, next) => {
      const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
      error.status = 404;
      error.code = 'ROUTE_NOT_FOUND';
      next(error);
    };
  }

  // Async error wrapper
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Log error with context
  logError(err, req) {
    const errorLog = {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      trustCode: req.trustCode,
      timestamp: new Date().toISOString()
    };

    // Log sensitive information only in development
    if (process.env.NODE_ENV === 'development') {
      errorLog.headers = req.headers;
      errorLog.body = req.body;
      errorLog.query = req.query;
      errorLog.params = req.params;
    }

    this.logger.error('Application error', errorLog);
  }

  // Build appropriate error response
  buildErrorResponse(err, req) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Default error response
    let response = {
      status: err.status || 500,
      body: {
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      }
    };

    // Handle specific error types
    if (err.code === 'ER_DUP_ENTRY') {
      response = this.handleDuplicateEntryError(err);
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      response = this.handleForeignKeyError(err);
    } else if (err.code === 'ECONNREFUSED') {
      response = this.handleDatabaseConnectionError(err);
    } else if (err.name === 'ValidationError') {
      response = this.handleValidationError(err);
    } else if (err.name === 'CastError') {
      response = this.handleCastError(err);
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      response = this.handleFileSizeError(err);
    } else if (err.status === 401) {
      response = this.handleAuthenticationError(err);
    } else if (err.status === 403) {
      response = this.handleAuthorizationError(err);
    } else if (err.status === 429) {
      response = this.handleRateLimitError(err);
    }

    // Add stack trace in development
    if (isDevelopment && err.stack) {
      response.body.stack = err.stack;
      response.body.details = err.details;
    }

    // Add request ID for tracking
    if (req.id) {
      response.body.requestId = req.id;
    }

    return response;
  }

  handleDuplicateEntryError(err) {
    return {
      status: 409,
      body: {
        error: 'Duplicate entry detected',
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this information already exists',
        timestamp: new Date().toISOString()
      }
    };
  }

  handleForeignKeyError(err) {
    return {
      status: 400,
      body: {
        error: 'Invalid reference',
        code: 'INVALID_REFERENCE',
        message: 'Referenced record does not exist',
        timestamp: new Date().toISOString()
      }
    };
  }

  handleDatabaseConnectionError(err) {
    return {
      status: 503,
      body: {
        error: 'Service temporarily unavailable',
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Unable to connect to database',
        timestamp: new Date().toISOString()
      }
    };
  }

  handleValidationError(err) {
    return {
      status: 400,
      body: {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details || [],
        timestamp: new Date().toISOString()
      }
    };
  }

  handleCastError(err) {
    return {
      status: 400,
      body: {
        error: 'Invalid data format',
        code: 'INVALID_DATA_FORMAT',
        message: `Invalid ${err.path}: ${err.value}`,
        timestamp: new Date().toISOString()
      }
    };
  }

  handleFileSizeError(err) {
    return {
      status: 413,
      body: {
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        message: 'Uploaded file exceeds size limit',
        timestamp: new Date().toISOString()
      }
    };
  }

  handleAuthenticationError(err) {
    return {
      status: 401,
      body: {
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Please login to access this resource',
        timestamp: new Date().toISOString()
      }
    };
  }

  handleAuthorizationError(err) {
    return {
      status: 403,
      body: {
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to access this resource',
        timestamp: new Date().toISOString()
      }
    };
  }

  handleRateLimitError(err) {
    return {
      status: 429,
      body: {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: err.retryAfter || 900,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Create custom error types
  createError(message, status = 500, code = null) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
  }

  // Business logic error
  businessError(message, code = 'BUSINESS_LOGIC_ERROR') {
    return this.createError(message, 400, code);
  }

  // Not found error
  notFoundError(resource = 'Resource') {
    return this.createError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  // Unauthorized error
  unauthorizedError(message = 'Unauthorized access') {
    return this.createError(message, 401, 'UNAUTHORIZED');
  }

  // Forbidden error
  forbiddenError(message = 'Access forbidden') {
    return this.createError(message, 403, 'FORBIDDEN');
  }

  // Conflict error
  conflictError(message = 'Resource conflict') {
    return this.createError(message, 409, 'CONFLICT');
  }

  // Unprocessable entity error
  unprocessableError(message = 'Unprocessable entity') {
    return this.createError(message, 422, 'UNPROCESSABLE_ENTITY');
  }

  // Service unavailable error
  serviceUnavailableError(message = 'Service temporarily unavailable') {
    return this.createError(message, 503, 'SERVICE_UNAVAILABLE');
  }

  // Health check for error handling system
  healthCheck() {
    try {
      // Test logger
      this.logger.info('Error handler health check');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        logger: 'operational'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Graceful shutdown handler
  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, starting graceful shutdown`);
        
        try {
          // Close database connections
          const db = require('../modules/data/database-service');
          await db.close();
          
          this.logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          this.logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    });
  }

  // Unhandled promise rejection handler
  setupUnhandledRejectionHandler() {
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Promise Rejection:', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise
      });
      
      // In production, you might want to exit the process
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  }

  // Uncaught exception handler
  setupUncaughtExceptionHandler() {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', {
        message: error.message,
        stack: error.stack
      });
      
      // Exit process on uncaught exception
      process.exit(1);
    });
  }

  // Initialize all error handlers
  initialize() {
    this.setupGracefulShutdown();
    this.setupUnhandledRejectionHandler();
    this.setupUncaughtExceptionHandler();
    
    this.logger.info('Error handling system initialized');
  }
}

module.exports = new ErrorHandler();