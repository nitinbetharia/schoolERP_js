const createError = require('http-errors');
const Joi = require('joi');
const { logger } = require('./logger');
const { ERROR_CODES } = require('../config/business-constants');

/**
 * Centralized HTTP Error Factory using http-errors
 * Single source of truth for all error handling across the application
 */
function createErrorFactory() {
   /**
    * Create validation error (400 Bad Request)
    */
   function validation(message, details = null, errorCode = ERROR_CODES.VALIDATION_REQUIRED) {
      const error = createError(400, message, {
         code: errorCode,
         details: details,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create authentication error (401 Unauthorized)
    */
   function authentication(message = 'Authentication failed', errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS) {
      const error = createError(401, message, {
         code: errorCode,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create authorization error (403 Forbidden)
    */
   function authorization(message = 'Insufficient permissions', errorCode = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS) {
      const error = createError(403, message, {
         code: errorCode,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create not found error (404 Not Found)
    */
   function notFound(resource = 'Resource', errorCode = ERROR_CODES.DB_NOT_FOUND) {
      const message = resource + ' not found';
      const error = createError(404, message, {
         code: errorCode,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create conflict error (409 Conflict)
    */
   function conflict(message, details = null, errorCode = ERROR_CODES.DUPLICATE_ENTRY) {
      const error = createError(409, message, {
         code: errorCode,
         details: details,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create business logic error (422 Unprocessable Entity)
    */
   function businessLogic(message, details = null, errorCode = ERROR_CODES.BUSINESS_RULE_VIOLATION) {
      const error = createError(422, message, {
         code: errorCode,
         details: details,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create internal server error (500 Internal Server Error)
    */
   function internal(message = 'Internal server error', originalError = null, errorCode = ERROR_CODES.SYSTEM_ERROR) {
      const error = createError(500, message, {
         code: errorCode,
         details: originalError
            ? {
                 originalMessage: originalError.message,
                 stack: process.env.NODE_ENV === 'development' ? originalError.stack : undefined,
              }
            : null,
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create database error (500 Internal Server Error)
    */
   function database(message, originalError = null, errorCode = ERROR_CODES.DB_QUERY_ERROR) {
      const error = createError(500, message, {
         code: errorCode,
         details: {
            originalMessage: originalError?.message,
            sql: originalError?.sql,
            errno: originalError?.errno,
         },
         timestamp: new Date().toISOString(),
         isOperational: true,
      });
      return error;
   }

   /**
    * Create Joi validation error from Joi validation result
    */
   function fromJoi(joiError) {
      const details = joiError.details.map((detail) => ({
         field: detail.path.join('.'),
         message: detail.message,
         value: detail.context?.value,
      }));

      return validation('Validation failed', details);
   }

   /**
    * Create error from Sequelize error
    */
   function fromSequelize(sequelizeError) {
      if (sequelizeError.name === 'SequelizeValidationError') {
         const details = sequelizeError.errors.map((error) => ({
            field: error.path,
            message: error.message,
            value: error.value,
         }));
         return validation('Database validation failed', details);
      }

      if (sequelizeError.name === 'SequelizeUniqueConstraintError') {
         const details = sequelizeError.errors.map((error) => ({
            field: error.path,
            message: error.path + ' already exists',
            value: error.value,
         }));
         return conflict('Duplicate entry found', details);
      }

      if (sequelizeError.name === 'SequelizeForeignKeyConstraintError') {
         return businessLogic('Referenced record not found', {
            field: sequelizeError.field,
            value: sequelizeError.value,
         });
      }

      if (sequelizeError.name === 'SequelizeConnectionError') {
         return database('Database connection error', sequelizeError, ERROR_CODES.DB_CONNECTION_ERROR);
      }

      // Generic database error
      return database('Database operation failed', sequelizeError);
   }

   /**
    * Create error from JWT error
    */
   function fromJWT(jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
         return authentication('Authentication token has expired', ERROR_CODES.AUTH_SESSION_EXPIRED);
      }

      if (jwtError.name === 'JsonWebTokenError') {
         return authentication('Invalid authentication token', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
      }

      return authentication('Authentication failed', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
   }

   // Return public interface
   return {
      validation,
      authentication,
      authorization,
      notFound,
      conflict,
      businessLogic,
      internal,
      database,
      fromJoi,
      fromSequelize,
      fromJWT,
   };
}

// Create singleton instance
const ErrorFactory = createErrorFactory();

/**
 * Centralized error response formatter
 * Converts http-errors into standardized API response format
 */
function formatErrorResponse(err) {
   // If it's an http-errors error, use its structure
   if (err.status || err.statusCode) {
      return {
         success: false,
         error: {
            code: err.code || 'HTTP_ERROR',
            message: err.message,
            details: err.details || null,
            timestamp: err.timestamp || new Date().toISOString(),
         },
      };
   }

   // Fallback for non-http-errors
   return {
      success: false,
      error: {
         code: 'UNKNOWN_ERROR',
         message: err.message || 'An unexpected error occurred',
         timestamp: new Date().toISOString(),
      },
   };
}

/**
 * Get HTTP status code from error
 */
function getErrorStatusCode(err) {
   return err.status || err.statusCode || 500;
}

/**
 * Check if error is operational (expected/handled error)
 */
function isOperationalError(err) {
   return err.isOperational === true || err.status || err.statusCode;
}

/**
 * Centralized error logging utility
 */
function logError(err, context = {}) {
   const errorInfo = {
      message: err.message,
      status: getErrorStatusCode(err),
      code: err.code,
      details: err.details,
      timestamp: err.timestamp || new Date().toISOString(),
      isOperational: isOperationalError(err),
      context: context,
   };

   // Add stack trace for non-operational errors or in development
   if (!isOperationalError(err) || process.env.NODE_ENV === 'development') {
      errorInfo.stack = err.stack;
   }

   // Log with appropriate level
   if (isOperationalError(err)) {
      logger.warn('Operational Error', errorInfo);
   } else {
      logger.error('System Error', errorInfo);
   }
}

/**
 * Legacy error classes for backward compatibility
 * @deprecated Use ErrorFactory methods instead
 */
class AppError extends Error {
   constructor(message, statusCode = 500, errorCode = ERROR_CODES.SYSTEM_ERROR, details = null) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      this.details = details;
      this.timestamp = new Date().toISOString();
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
   }
}

class ValidationError extends AppError {
   constructor(joiError) {
      const message = 'Validation failed';
      const details = joiError.details.map((detail) => ({
         field: detail.path.join('.'),
         message: detail.message,
         value: detail.context?.value,
      }));
      super(message, 400, ERROR_CODES.VALIDATION_REQUIRED, details);
   }
}

class DatabaseError extends AppError {
   constructor(message, originalError = null) {
      super(message, 500, ERROR_CODES.DB_QUERY_ERROR, {
         originalMessage: originalError?.message,
         sql: originalError?.sql,
      });
   }
}

class AuthenticationError extends AppError {
   constructor(message = 'Authentication failed', errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS) {
      super(message, 401, errorCode);
   }
}

class AuthorizationError extends AppError {
   constructor(message = 'Insufficient permissions') {
      super(message, 403, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS);
   }
}

class BusinessLogicError extends AppError {
   constructor(message, details = null) {
      super(message, 422, ERROR_CODES.BUSINESS_RULE_VIOLATION, details);
   }
}

class NotFoundError extends AppError {
   constructor(resource = 'Resource') {
      super(`${resource} not found`, 404, ERROR_CODES.DB_NOT_FOUND);
   }
}

class DuplicateError extends AppError {
   constructor(field, value) {
      super(`${field} '${value}' already exists`, 409, ERROR_CODES.DUPLICATE_ENTRY, {
         field,
         value,
      });
   }
}

/**
 * Validation helper functions
 */
const validators = {
   /**
    * Validate request body against Joi schema
    */
   validateBody: (schema) => {
      return (req, res, next) => {
         const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
         });

         if (error) {
            return next(ErrorFactory.fromJoi(error));
         }

         req.body = value;
         next();
      };
   },

   /**
    * Validate query parameters against Joi schema
    */
   validateQuery: (schema) => {
      return (req, res, next) => {
         const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
         });

         if (error) {
            return next(ErrorFactory.fromJoi(error));
         }

         req.query = value;
         next();
      };
   },

   /**
    * Validate route parameters against Joi schema
    */
   validateParams: (schema) => {
      return (req, res, next) => {
         const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
         });

         if (error) {
            return next(ErrorFactory.fromJoi(error));
         }

         req.params = value;
         next();
      };
   },
};

/**
 * Common Joi schemas
 */
const commonSchemas = {
   id: Joi.number().integer().positive().required(),
   uuid: Joi.string().uuid().required(),
   email: Joi.string().email().max(255).required(),
   password: Joi.string().min(8).max(50).required(),
   phone: Joi.string()
      .pattern(/^\d{10,15}$/)
      .required(),
   name: Joi.string().trim().min(2).max(100).required(),
   status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').default('ACTIVE'),
   pagination: {
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().default('created_at'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
   },
};

/**
 * Success response formatter
 */
function formatSuccessResponse(data = null, message = 'Success', meta = null) {
   const response = {
      success: true,
      message,
      data,
   };

   if (meta) {
      response.meta = meta;
   }

   return response;
}

module.exports = {
   // Primary Error Factory (recommended for new code)
   ErrorFactory,

   // Utility functions
   formatErrorResponse,
   formatSuccessResponse,
   getErrorStatusCode,
   isOperationalError,
   logError,

   // Legacy Error classes (backward compatibility)
   AppError,
   ValidationError,
   DatabaseError,
   AuthenticationError,
   AuthorizationError,
   BusinessError: BusinessLogicError, // Alias for consistency
   BusinessLogicError,
   NotFoundError,
   DuplicateError,

   // Validation helpers
   validators,
   commonSchemas,
};
