/**
 * Simple Error Utilities
 * Helper functions to create standard Error objects for centralized error handling
 */

/**
 * Create a validation error (400)
 */
function createValidationError(message) {
   const error = new Error(message);
   error.statusCode = 400;
   error.userMessage = 'Please check your input and try again.';
   return error;
}

/**
 * Create a not found error (404)
 */
function createNotFoundError(message) {
   const error = new Error(message);
   error.statusCode = 404;
   error.userMessage = 'The requested resource was not found.';
   return error;
}

/**
 * Create a conflict error (409)
 */
function createConflictError(message) {
   const error = new Error(message);
   error.statusCode = 409;
   error.userMessage = 'There was a conflict with the current state of the resource.';
   return error;
}

/**
 * Create an authentication error (401)
 */
function createAuthenticationError(message) {
   const error = new Error(message);
   error.statusCode = 401;
   error.userMessage = 'Authentication failed. Please check your credentials.';
   return error;
}

/**
 * Create an authorization error (403)
 */
function createAuthorizationError(message) {
   const error = new Error(message);
   error.statusCode = 403;
   error.userMessage = 'You do not have permission to perform this action.';
   return error;
}

/**
 * Create an internal server error (500)
 */
function createInternalError(message) {
   const error = new Error(message);
   error.statusCode = 500;
   error.userMessage = 'An internal server error occurred. Please try again later.';
   return error;
}

/**
 * Create a database error (500)
 */
function createDatabaseError(message) {
   const error = new Error(message);
   error.statusCode = 500;
   error.userMessage = 'A database error occurred. Please try again later.';
   return error;
}

/**
 * Create a client error (400)
 */
function createClientError(message) {
   const error = new Error(message);
   error.statusCode = 400;
   error.userMessage = 'There was an issue with your request.';
   return error;
}

module.exports = {
   createValidationError,
   createNotFoundError,
   createConflictError,
   createAuthenticationError,
   createAuthorizationError,
   createInternalError,
   createDatabaseError,
   createClientError,
};
