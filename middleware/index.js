// Re-export all middleware for easy importing
const errorHandler = require('./errorHandler');
const tenant = require('./tenant');
const auth = require('./auth');
const security = require('./security');
const flash = require('./flash');
const templateLocals = require('./templateLocals');

module.exports = {
   // Error handling
   ...errorHandler,

   // Tenant management
   ...tenant,

   // Authentication & Authorization
   ...auth,

   // Security
   ...security,

   // Flash messages
   ...flash,

   // Template locals
   ...templateLocals,
};
