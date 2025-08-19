const Joi = require('joi');
const { ERROR_CODES } = require('../config/business-constants');

/**
 * Standardized error response structure
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

/**
 * Validation error with Joi details
 */
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

/**
 * Database operation error
 */
class DatabaseError extends AppError {
   constructor(message, originalError = null) {
      super(message, 500, ERROR_CODES.DB_QUERY_ERROR, {
         originalMessage: originalError?.message,
         sql: originalError?.sql,
      });
   }
}

/**
 * Authentication error
 */
class AuthenticationError extends AppError {
   constructor(message = 'Authentication failed', errorCode = ERROR_CODES.AUTH_INVALID_CREDENTIALS) {
      super(message, 401, errorCode);
   }
}

/**
 * Authorization error
 */
class AuthorizationError extends AppError {
   constructor(message = 'Insufficient permissions') {
      super(message, 403, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS);
   }
}

/**
 * Business rule violation error
 */
class BusinessError extends AppError {
   constructor(message, details = null) {
      super(message, 422, ERROR_CODES.BUSINESS_RULE_VIOLATION, details);
   }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
   constructor(resource = 'Resource') {
      super(`${resource} not found`, 404, ERROR_CODES.DB_NOT_FOUND);
   }
}

/**
 * Duplicate entry error
 */
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
            return next(new ValidationError(error));
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
            return next(new ValidationError(error));
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
            return next(new ValidationError(error));
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
 * Error response formatter
 */
const formatErrorResponse = (error) => {
   return {
      success: false,
      error: {
         code: error.errorCode || ERROR_CODES.SYSTEM_ERROR,
         message: error.message,
         details: error.details || null,
         timestamp: error.timestamp || new Date().toISOString(),
      },
   };
};

/**
 * Success response formatter
 */
const formatSuccessResponse = (data = null, message = 'Success', meta = null) => {
   const response = {
      success: true,
      message,
      data,
   };

   if (meta) {
      response.meta = meta;
   }

   return response;
};

module.exports = {
   // Error classes
   AppError,
   ValidationError,
   DatabaseError,
   AuthenticationError,
   AuthorizationError,
   BusinessError,
   NotFoundError,
   DuplicateError,

   // Validation helpers
   validators,
   commonSchemas,

   // Response formatters
   formatErrorResponse,
   formatSuccessResponse,
};
