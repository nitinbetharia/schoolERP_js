const Joi = require('joi');
const { logger } = require('./logger');

/**
 * Simple Validation Utility
 * Uses standard Error objects with centralized error handling
 */

/**
 * Validate request body using Joi schema
 */
function validateBody(schema) {
   return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
         abortEarly: false,
         stripUnknown: true,
         convert: true,
      });

      if (error) {
         const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
         }));

         logger.warn('Validation failed', {
            errors: validationErrors,
            originalBody: req.body,
         });

         return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: validationErrors,
         });
      }

      req.body = value;
      next();
   };
}

/**
 * Validate query parameters using Joi schema
 */
function validateQuery(schema) {
   return (req, res, next) => {
      const { error, value } = schema.validate(req.query, {
         abortEarly: false,
         stripUnknown: true,
         convert: true,
      });

      if (error) {
         const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
         }));

         logger.warn('Query validation failed', {
            errors: validationErrors,
            originalQuery: req.query,
         });

         return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: validationErrors,
         });
      }

      req.query = value;
      next();
   };
}

/**
 * Validate route parameters using Joi schema
 */
function validateParams(schema) {
   return (req, res, next) => {
      const { error, value } = schema.validate(req.params, {
         abortEarly: false,
         stripUnknown: true,
         convert: true,
      });

      if (error) {
         const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
         }));

         logger.warn('Parameter validation failed', {
            errors: validationErrors,
            originalParams: req.params,
         });

         return res.status(400).json({
            success: false,
            error: 'Parameter validation failed',
            details: validationErrors,
         });
      }

      req.params = value;
      next();
   };
}

/**
 * Common Joi validation schemas (reusable)
 */
const commonSchemas = {
   id: Joi.number().integer().positive().required(),
   uuid: Joi.string().uuid().required(),
   email: Joi.string().email().max(255).required(),
   password: Joi.string().min(6).max(50).required(),
   phone: Joi.string()
      .pattern(/^\d{10,15}$/)
      .required(),
   name: Joi.string().trim().min(2).max(100).required(),
   status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').default('ACTIVE'),

   // Pagination schemas
   pagination: {
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sortBy: Joi.string().default('created_at'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
   },

   // Date schemas
   date: Joi.date().iso().required(),
   dateOptional: Joi.date().iso().optional(),
   dateRange: {
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
   },
};

/**
 * Simple success response formatter
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

/**
 * Simple error response formatter
 */
function formatErrorResponse(error, message = 'An error occurred') {
   return {
      success: false,
      error: message,
      details: error.details || null,
      timestamp: new Date().toISOString(),
   };
}

/**
 * Async handler wrapper to catch errors
 */
function asyncHandler(fn) {
   return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
   };
}

/**
 * Simple pagination helper
 */
function getPaginationData(page = 1, limit = 20, totalCount = 0) {
   const totalPages = Math.ceil(totalCount / limit);
   const offset = (page - 1) * limit;

   return {
      pagination: {
         currentPage: page,
         totalPages,
         totalCount,
         limit,
         offset,
         hasNext: page < totalPages,
         hasPrev: page > 1,
      },
   };
}

/**
 * Sanitize user input for logging (remove sensitive data)
 */
function sanitizeForLog(data) {
   if (!data || typeof data !== 'object') {
      return data;
   }

   const sanitized = { ...data };
   const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];

   sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
         sanitized[field] = '[REDACTED]';
      }
   });

   return sanitized;
}

/**
 * Extract status code from error object
 * Similar to what the error handler middleware does
 */
function getErrorStatusCode(err) {
   // Return status code from error, with fallback to 500
   let statusCode = err.statusCode || err.status || 500;

   // Handle specific error types for status code adjustment
   if (err.name?.startsWith('Sequelize')) {
      statusCode = 400;
   } else if (err.name?.includes('JsonWebToken') || err.name === 'TokenExpiredError') {
      statusCode = 401;
   } else if (err.name === 'ValidationError') {
      statusCode = 400;
   }

   return statusCode;
}

module.exports = {
   // Validation middleware
   validateBody,
   validateQuery,
   validateParams,

   // Response formatters
   formatSuccessResponse,
   formatErrorResponse,

   // Common schemas
   commonSchemas,

   // Utilities
   asyncHandler,
   getPaginationData,
   sanitizeForLog,
   getErrorStatusCode,
};
