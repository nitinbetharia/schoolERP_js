/**
 * LEGACY FILE - Moved to legacy folder as it's not currently used
 * Template Locals Middleware
 * Ensures all templates have access to required variables
 *
 * This middleware was part of the original design but is not actively used
 * in the current implementation. Routes handle template variables manually.
 * Moved here for historical reference.
 */

/**
 * Middleware to set global template locals
 * This prevents "variable not defined" errors in templates
 */
function templateLocals(req, res, next) {
   // Always provide these variables to templates
   res.locals.user = req.user || null;
   res.locals.tenant = req.tenant || null;
   res.locals.tenantCode = req.tenantCode || 'demo';

   // Flash messages (empty arrays if not set or flash not available)
   res.locals.success = req.flash ? req.flash('success') : [];
   res.locals.error = req.flash ? req.flash('error') : [];
   res.locals.warning = req.flash ? req.flash('warning') : [];
   res.locals.info = req.flash ? req.flash('info') : []; // Common template data
   res.locals.appName = 'School ERP';
   res.locals.appVersion = '2.0.0';
   res.locals.year = new Date().getFullYear();

   // Environment info
   res.locals.isDev = process.env.NODE_ENV === 'development';
   res.locals.isProd = process.env.NODE_ENV === 'production';

   // URL helpers
   res.locals.currentUrl = req.originalUrl;
   res.locals.currentPath = req.path;

   // Helper functions for templates
   res.locals.hasFlashMessages = function () {
      return (
         (res.locals.success && res.locals.success.length > 0) ||
         (res.locals.error && res.locals.error.length > 0) ||
         (res.locals.warning && res.locals.warning.length > 0) ||
         (res.locals.info && res.locals.info.length > 0)
      );
   };

   res.locals.isActive = function (path) {
      return req.path === path ? 'active' : '';
   };

   res.locals.formatDate = function (date) {
      if (!date) {
         return '';
      }
      return new Date(date).toLocaleDateString('en-IN');
   };

   res.locals.formatDateTime = function (date) {
      if (!date) {
         return '';
      }
      return new Date(date).toLocaleString('en-IN');
   };

   res.locals.getUserName = function () {
      if (res.locals.user) {
         return res.locals.user.name || res.locals.user.email || 'User';
      }
      return 'Guest';
   };

   res.locals.getTenantName = function () {
      if (res.locals.tenant) {
         return res.locals.tenant.name || res.locals.tenant.tenantCode || 'School';
      }
      return 'School ERP';
   };

   next();
}

module.exports = {
   templateLocals,
};
