/**
 * Flash Message Middleware
 * Provides flash message functionality for EJS templates
 */

function setupFlashMessages(req, res, next) {
   // Initialize flash messages if they don't exist
   if (!req.session.flash) {
      req.session.flash = {};
   }

   // Flash function to set messages
   req.flash = function (type, message) {
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

module.exports = {
   setupFlashMessages,
};
