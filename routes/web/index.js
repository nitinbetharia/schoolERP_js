const express = require('express');
const router = express.Router();

// Import middleware and utilities
const { logError } = require('../../utils/logger');

/**
 * Main Web Router - Coordinates all sub-route modules
 * Following industry standards: keeping files under 300 lines
 * Each route module handles specific domain functionality
 */

// Middleware to require authentication
const requireAuth = (req, res, next) => {
   if (!req.session || !req.session.user) {
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.status(401).json({
            success: false,
            error: 'Authentication required',
            redirect: '/auth/login',
         });
      }
      req.flash('error', 'Please log in to access this page');
      return res.redirect('/auth/login');
   }
   next();
};

// Middleware to require user creation access
const requireUserCreationAccess = async (req, res, next) => {
   try {
      if (!req.session?.user) {
         return res.status(401).json({
            success: false,
            error: 'Authentication required',
         });
      }

      const user = req.session.user;
      const allowedRoles = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'];

      if (!allowedRoles.includes(user.role)) {
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(403).json({
               success: false,
               error: 'Insufficient permissions for user management',
            });
         }
         req.flash('error', 'Access denied. User management privileges required.');
         return res.redirect('/dashboard');
      }

      next();
   } catch (error) {
      logError(error, { context: 'requireUserCreationAccess middleware' });
      return res.status(500).json({
         success: false,
         error: 'Access verification failed',
      });
   }
};

// Export middleware for use in sub-routes
const middleware = {
   requireAuth,
   requireUserCreationAccess,
};

// Import route modules
const authRoutes = require('./auth');
const systemRoutes = require('./system');
const userRoutes = require('./users');
const trustRoutes = require('./trusts');
const schoolRoutes = require('./schools');
const apiRoutes = require('./api');
const utilityRoutes = require('./utils');

// Mount route modules with middleware
router.use('/', authRoutes(middleware));
router.use('/system', systemRoutes(middleware));
router.use('/admin', userRoutes(middleware));
router.use('/system/trusts', trustRoutes(middleware));
router.use('/system/schools', schoolRoutes(middleware));
router.use('/api', apiRoutes(middleware));
router.use('/test', utilityRoutes(middleware));

// Health check route for the web router
router.get('/health/web-router', (req, res) => {
   try {
      res.json({
         success: true,
         message: 'Web router is healthy',
         timestamp: new Date().toISOString(),
         routes: {
            auth: 'mounted',
            system: 'mounted',
            users: 'mounted',
            trusts: 'mounted',
            schools: 'mounted',
            api: 'mounted',
            utils: 'mounted',
         },
      });
   } catch (error) {
      logError(error, { context: 'web router health check' });
      res.status(500).json({
         success: false,
         error: 'Health check failed',
      });
   }
});

module.exports = router;
