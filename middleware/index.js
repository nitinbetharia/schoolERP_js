const { validators } = require('../utils/errors');

// Re-export all middleware for easy importing
const errorHandler = require('./errorHandler');
const tenant = require('./tenant');
const auth = require('./auth');
const security = require('./security');

module.exports = {
   // Error handling
   ...errorHandler,

   // Tenant management
   ...tenant,

   // Authentication & Authorization
   ...auth,

   // Security
   ...security,

   // Validation helpers
   ...validators,
};
