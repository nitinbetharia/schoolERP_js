/**
 * Flash Message Middleware
 * Provides flash message functionality for EJS templates and API responses
 */

function setupFlashMessages(req, res, next) {
   try {
      console.log('🎯 FLASH MIDDLEWARE:', {
         path: req.path,
         hasSession: !!req.session,
         hasFlash: !!(req.session && req.session.flash),
      });

      // Check if session exists
      if (!req.session) {
         console.error('❌ FLASH ERROR: req.session is undefined');
         return next(new Error('Session not initialized'));
      }

      // Initialize flash messages if they don't exist
      if (!req.session.flash) {
         req.session.flash = {};
      }
   } catch (error) {
      console.error('❌ FLASH MIDDLEWARE ERROR:', error);
      return next(error);
   }

   // Flash function to set messages
   req.flash = function (type, message) {
      // Safety check: ensure session and flash are available
      if (!req.session || !req.session.flash) {
         console.warn('Flash message attempted but session/flash not available');
         return message ? undefined : [];
      }

      if (!req.session.flash[type]) {
         req.session.flash[type] = [];
      }
      if (message) {
         req.session.flash[type].push(message);
      } else {
         // Return and clear messages
         const messages = req.session.flash[type] || [];
         req.session.flash[type] = [];
         return messages.length === 1 ? messages[0] : messages.length > 1 ? messages : null;
      }
   };

   // Make flash messages available to views
   res.locals.flash = function (type) {
      return req.flash(type);
   };

   // Make individual flash types available
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   res.locals.warning = req.flash('warning');
   res.locals.info = req.flash('info');

   next();
}

/**
 * Enhanced flash helpers for API responses
 */
function addFlashHelpers(req, res, next) {
   // Add flash message to JSON response
   const originalJson = res.json;
   res.json = function (obj) {
      if (obj && typeof obj === 'object') {
         // Add flash messages to API responses
         // Safety check: ensure session exists and flash is available
         if (req.session && req.session.flash && typeof req.flash === 'function') {
            try {
               obj.flash = {
                  success: req.flash('success'),
                  error: req.flash('error'),
                  warning: req.flash('warning'),
                  info: req.flash('info'),
               };

               // Clean up empty flash arrays
               Object.keys(obj.flash).forEach((key) => {
                  if (!obj.flash[key] || (Array.isArray(obj.flash[key]) && obj.flash[key].length === 0)) {
                     delete obj.flash[key];
                  }
               });

               // Remove flash object if empty
               if (Object.keys(obj.flash).length === 0) {
                  delete obj.flash;
               }
            } catch (error) {
               // If flash fails (e.g., session destroyed), silently continue without flash
               console.warn('Flash message retrieval failed:', error.message);
            }
         }
      }
      return originalJson.call(this, obj);
   };

   // Helper to add flash message based on response success
   req.flashResponse = function (success, message, type = null) {
      if (success) {
         req.flash('success', message);
      } else {
         req.flash(type || 'error', message);
      }
   };

   // Helper to add validation error flash messages
   req.flashValidationErrors = function (errors) {
      if (Array.isArray(errors)) {
         errors.forEach((error) => req.flash('error', error));
      } else if (typeof errors === 'object') {
         Object.values(errors).forEach((error) => req.flash('error', error));
      } else if (typeof errors === 'string') {
         req.flash('error', errors);
      }
   };

   // Helper to set success flash
   req.flashSuccess = function (message) {
      req.flash('success', message);
   };

   // Helper to set error flash
   req.flashError = function (message) {
      req.flash('error', message);
   };

   // Helper to set warning flash
   req.flashWarning = function (message) {
      req.flash('warning', message);
   };

   // Helper to set info flash
   req.flashInfo = function (message) {
      req.flash('info', message);
   };

   next();
}

/**
 * Middleware to handle authentication errors with flash messages
 */
function handleAuthErrors(err, req, res, next) {
   if (err && err.code && err.code.startsWith('AUTH_')) {
      // Authentication/authorization errors
      const messages = {
         AUTH_001: 'Invalid username or password. Please try again.',
         AUTH_REQUIRED: 'Please log in to access this page.',
         AUTH_ACCOUNT_LOCKED: 'Account is temporarily locked. Please try again later.',
         SESSION_EXPIRED: 'Your session has expired. Please log in again.',
         INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource.',
         RATE_LIMIT_EXCEEDED: 'Too many attempts. Please wait before trying again.',
      };

      const message = messages[err.code] || err.message || 'Authentication failed.';

      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         // API request
         req.flashError(message);
         return res.status(err.statusCode || 401).json({
            success: false,
            error: {
               code: err.code,
               message: message,
               timestamp: new Date().toISOString(),
            },
            flash: {
               error: [message],
            },
         });
      } else {
         // Web request
         req.flashError(message);
         return res.redirect('/auth/login');
      }
   }

   next(err);
}

/**
 * Middleware to handle validation errors with flash messages
 */
function handleValidationErrors(err, req, res, next) {
   if (err && err.isJoi) {
      // Joi validation error
      const errors = err.details.map((detail) => detail.message);
      req.flashValidationErrors(errors);

      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         // API request
         return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: errors,
            flash: {
               error: errors,
            },
         });
      } else {
         // Web request - redirect back
         return res.redirect('back');
      }
   }

   next(err);
}

module.exports = {
   setupFlashMessages,
   addFlashHelpers,
   handleAuthErrors,
   handleValidationErrors,
};
