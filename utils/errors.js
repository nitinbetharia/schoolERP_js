/**
 * Custom Error Classes and Error Factory
 * Provides standardized error handling across the application
 */

/**
 * Base Application Error Class
 */
class AppError extends Error {
   constructor(message, statusCode = 500, userMessage = null) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      this.status = statusCode;
      this.userMessage = userMessage || message;
      this.isOperational = true;

      Error.captureStackTrace(this, this.constructor);
   }
}

/**
 * Validation Error Class
 */
class ValidationError extends AppError {
   constructor(message, details = null) {
      super(message, 400, 'Please check your input and try again.');
      this.details = details;
   }
}

/**
 * Not Found Error Class
 */
class NotFoundError extends AppError {
   constructor(resource = 'Resource') {
      const userMsg = `The requested ${resource.toLowerCase()} could not be found.`;
      super(`${resource} not found`, 404, userMsg);
   }
}

/**
 * Duplicate Error Class
 */
class DuplicateError extends AppError {
   constructor(resource = 'Resource', field = 'field') {
      const message = `${resource} with this ${field} already exists`;
      const userMsg = `A ${resource.toLowerCase()} with this ${field} already exists.`;
      super(message, 409, userMsg);
   }
}

/**
 * Authentication Error Class
 */
class AuthenticationError extends AppError {
   constructor(message = 'Authentication failed') {
      super(message, 401, 'You must be logged in to access this resource.');
   }
}

/**
 * Authorization Error Class
 */
class AuthorizationError extends AppError {
   constructor(message = 'Access denied') {
      super(message, 403, 'You do not have permission to access this resource.');
   }
}

/**
 * Database Error Class
 */
class DatabaseError extends AppError {
   constructor(message, originalError = null) {
      super(message, 500, 'A database error occurred. Please try again.');
      this.originalError = originalError;
   }
}

/**
 * Error Factory for creating standardized errors
 */
class ErrorFactory {
   /**
    * Create a validation error
    */
   static validation(message, details = null) {
      return new ValidationError(message, details);
   }

   /**
    * Create a not found error
    */
   static notFound(resource = 'Resource') {
      return new NotFoundError(resource);
   }

   /**
    * Create a duplicate error
    */
   static duplicate(resource = 'Resource', field = 'field') {
      return new DuplicateError(resource, field);
   }

   /**
    * Create an authentication error
    */
   static authentication(message = 'Authentication failed') {
      return new AuthenticationError(message);
   }

   /**
    * Create an authorization error
    */
   static authorization(message = 'Access denied') {
      return new AuthorizationError(message);
   }

   /**
    * Create a database error
    */
   static database(message, originalError = null) {
      return new DatabaseError(message, originalError);
   }

   /**
    * Create a generic application error
    */
   static app(message, statusCode = 500, userMessage = null) {
      return new AppError(message, statusCode, userMessage);
   }

   /**
    * Create error from existing error object
    */
   static fromError(error, statusCode = 500, userMessage = null) {
      if (error instanceof AppError) {
         return error;
      }

      return new AppError(error.message, statusCode, userMessage);
   }
}

module.exports = {
   AppError,
   ValidationError,
   NotFoundError,
   DuplicateError,
   AuthenticationError,
   AuthorizationError,
   DatabaseError,
   ErrorFactory,
};
