const express = require('express');
const path = require('path');
const router = express.Router();
const { logSystem, logError } = require('../utils/logger');
const { systemAuthService } = require('../services/systemServices');
const userService = require('../modules/users/services/userService');
const { systemUserValidationSchemas } = require('../models/SystemUser');

// Frontend test route (no auth required)
router.get('/test-frontend', (req, res) => {
   try {
      res.render('pages/test-frontend', {
         title: 'Frontend Test',
         subtitle: 'Testing Bootstrap 5, Font Awesome, and Vanilla JavaScript',
         user: null, // No user for this test
         tenant: null,
      });
   } catch (error) {
      console.error('Frontend test route error:', error);
      res.status(500).send('Error rendering test page');
   }
});

/**
 * Middleware to require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
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

/**
 * Web Routes for Authentication
 * Renders EJS templates for login/logout functionality
 * Mobile-first, tenant-aware authentication pages
 */

/**
 * @route GET /test-frontend
 * @desc Test Bootstrap 5 and Font Awesome implementation
 */
router.get('/test-frontend', (req, res) => {
   res.sendFile(path.join(__dirname, '../public/test-bootstrap.html'));
});

/**
 * @route GET /auth/login
 * @desc Show login form
 * @access Public
 */
router.get('/login', async (req, res) => {
   try {
      console.log('🔍 LOGIN ROUTE DEBUG:', {
         path: req.path,
         host: req.get('host'),
         isSystemAdmin: req.isSystemAdmin,
         tenantCode: req.tenantCode,
         hasFlash: typeof req.flash === 'function',
      });

      // If user is already logged in, redirect to dashboard
      if (req.session && req.session.user) {
         return res.redirect('/dashboard');
      }

      const renderData = {
         title: 'Login',
         description: 'Sign in to your School ERP account',
         subtitle: 'Access your educational management system',
         tenant: req.tenant || null,
         user: req.user || null, // Always pass user variable
         success: req.flash ? req.flash('success') : [],
         error: req.flash ? req.flash('error') : [],
         warning: req.flash ? req.flash('warning') : [],
         info: req.flash ? req.flash('info') : [],
      };

      console.log('✅ Rendering login page successfully');
      res.render('pages/auth/login', {
         ...renderData,
         layout: 'layout', // Use main layout
      });
   } catch (error) {
      console.error('❌ LOGIN ROUTE ERROR:', error);
      logError(error, { context: 'auth/login GET' });
      res.status(500).json({
         success: false,
         error: {
            code: 'LOGIN_PAGE_ERROR',
            message: 'Unable to load login page: ' + error.message,
            timestamp: new Date().toISOString(),
         },
      });
   }
});

/**
 * @route POST /auth/login
 * @desc Process login form (connects to existing backend APIs)
 * @access Public
 */
router.post('/login', async (req, res) => {
   try {
      const { email, password, remember } = req.body;

      // Determine validation schema based on login type
      const isSystemLogin = !email.includes('@') || email.includes('admin');

      let validationSchema;
      if (isSystemLogin) {
         validationSchema = systemUserValidationSchemas.login;
      } else {
         validationSchema = systemUserValidationSchemas.login; // Use system user validation for now
      }

      // Validate input using proper schema
      const { error } = validationSchema.validate(
         {
            username: email,
            password,
         },
         {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
         }
      );

      if (error) {
         const validationErrors = {};
         error.details.forEach((detail) => {
            const key = detail.path[0];
            validationErrors[key === 'username' ? 'email' : key] = detail.message;
         });

         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: false,
               error: 'Validation failed',
               errors: validationErrors,
            });
         }
         req.flash('error', Object.values(validationErrors).join(', '));
         return res.redirect('/auth/login');
      }

      let authResult;

      if (isSystemLogin) {
         // Use existing system authentication API

         try {
            authResult = await systemAuthService.login({
               username: email,
               password: password,
            });

            // Set system user session
            req.session.user = authResult;
            req.session.userType = 'system';
         } catch (error) {
            const errorMsg = 'Invalid system credentials';
            logError(error, { context: 'SystemLogin', username: email });

            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: error.userMessage || errorMsg,
                  flash: { error: [error.userMessage || errorMsg] },
               });
            }
            req.flash('error', error.userMessage || errorMsg);
            return res.redirect('/auth/login');
         }
      } else {
         // Use existing tenant user authentication
         const tenantCode = req.tenantCode || 'demo';

         try {
            authResult = await userService.authenticateUser(tenantCode, email, password);

            // Set tenant user session
            req.session.user = authResult;
            req.session.userType = 'tenant';
            req.session.tenantCode = tenantCode;
         } catch (error) {
            const errorMsg = 'Invalid tenant credentials';
            logError(error, {
               context: 'TenantLogin',
               username: email,
               tenantCode,
            });

            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: error.userMessage || errorMsg,
                  flash: { error: [error.userMessage || errorMsg] },
               });
            }
            req.flash('error', error.userMessage || errorMsg);
            return res.redirect('/auth/login');
         }
      }

      // Set remember me cookie if requested
      if (remember) {
         req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }

      // Log successful login
      logSystem('User logged in via web interface', {
         userId: authResult.id,
         userType: isSystemLogin ? 'system' : 'tenant',
         tenantCode: req.tenantCode || null,
      });

      // Successful login response
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.json({
            success: true,
            message: 'Login successful',
            redirect: isSystemLogin ? '/admin/system' : '/dashboard',
            flash: { success: ['Welcome! You have successfully logged in.'] },
         });
      }

      // Redirect based on user type
      const redirectUrl = isSystemLogin ? '/admin/system' : '/dashboard';
      const welcomeName = authResult.name || authResult.username || 'User';
      req.flash('success', `Welcome back, ${welcomeName}! You are now logged in.`);
      return res.redirect(redirectUrl);
   } catch (error) {
      logError(error, { context: 'WebLoginError' });

      const errorMsg = 'An error occurred during login. Please try again.';
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.status(500).json({
            success: false,
            error: errorMsg,
            flash: { error: [errorMsg] },
         });
      }

      req.flash('error', errorMsg);
      return res.redirect('/auth/login');
   }
});

// REMOVED: Duplicate logout route - keeping the improved version below at line 320

/**
 * @route GET /dashboard
 * @desc Dashboard page (Trust Admin)
 * @access Private
 */
router.get('/dashboard', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;

      // Redirect system admins to their specific dashboard
      if (userType === 'system') {
         return res.redirect('/admin/system');
      }

      // Render trust admin dashboard for tenant users
      res.render('pages/dashboard/trust-admin', {
         title: 'Trust Dashboard',
         description: 'Trust administration dashboard for managing schools, students, and staff',
         user: req.session.user,
         tenant: req.session.tenant || req.tenant,
         userType: userType,
         currentPath: '/dashboard',
      });
   } catch (error) {
      logError(error, { context: 'dashboard GET' });
      req.flash('error', 'Unable to load dashboard');
      res.redirect('/auth/login');
   }
});

/**
 * @route GET /admin/system
 * @desc System Admin Dashboard page
 * @access Private (System Admin only)
 */
router.get('/admin/system', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;

      // Only allow system admins
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/dashboard/system-admin', {
         title: 'System Administration',
         description: 'System admin dashboard for managing trusts and configuration',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/admin/system',
      });
   } catch (error) {
      logError(error, { context: 'admin/system GET' });
      req.flash('error', 'Unable to load system dashboard');
      res.redirect('/auth/login');
   }
});

/**
 * @route POST /auth/logout
 * @desc Process logout
 * @access Private
 */
router.post('/logout', (req, res) => {
   try {
      const user = req.session?.user;

      // Store flash message before destroying session
      const flashMessage = 'You have been logged out successfully.';

      req.session.destroy((err) => {
         if (err) {
            logError(err, { context: 'logout', userId: user?.id });
         } else {
            logSystem(`User logout: ${user?.email}`, {
               userId: user?.id,
               tenantCode: user?.tenantCode,
            });
         }

         res.clearCookie('connect.sid');

         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: true,
               message: 'Logged out successfully',
               redirect: '/auth/login',
               flash: { success: [flashMessage] },
            });
         }

         // For web requests, redirect without flash since session is destroyed
         res.redirect('/auth/login');
      });
   } catch (error) {
      logError(error, { context: 'logout' });
      res.redirect('/auth/login');
   }
});

/**
 * @route GET /auth/logout
 * @desc Process logout via GET (for convenience links)
 * @access Private
 */
router.get('/logout', (req, res) => {
   // Redirect GET to POST for security
   res.render('pages/auth/logout', {
      title: 'Logout',
      description: 'Logging out of School ERP System',
      tenant: req.tenant || null,
      layout: 'layout',
   });
});

/**
 * @route GET /admin/system/profile
 * @desc System Admin Profile page
 * @access Private (System Admin only)
 */
router.get('/admin/system/profile', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;

      // Only allow system admins
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/profile/system-admin', {
         title: 'Profile Settings',
         description: 'System administrator profile settings and account management',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/admin/system/profile',
      });
   } catch (error) {
      logError(error, { context: 'admin/system/profile GET' });
      req.flash('error', 'Unable to load profile page');
      res.redirect('/admin/system');
   }
});

/**
 * @route GET /system/health
 * @desc User-friendly system health status page
 * @access Private (System Admin)
 */
router.get('/system/health', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;

      // Only allow system admins
      if (userType !== 'system') {
         return res.status(403).render('pages/errors/403', {
            layout: 'layout',
            title: 'Access Denied',
            description: 'Access denied - System admin privileges required',
            errorCode: '403',
            errorMessage: 'System admin privileges required to view health status',
            errorDetails: null,
            user: req.session.user,
            tenant: null,
         });
      }

      res.render('pages/system/health', {
         title: 'System Health',
         description: 'Real-time system health monitoring and status',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/health',
      });
   } catch (error) {
      logError(error, { context: 'system/health GET' });
      res.status(500).render('pages/errors/500', {
         layout: 'layout',
         title: 'Server Error',
         description: 'Server error - Unable to load system health page',
         errorCode: '500',
         errorMessage: 'Unable to load system health page',
         errorDetails: process.env.NODE_ENV === 'development' ? error.stack : null,
         user: req.session.user,
         tenant: null,
      });
   }
});

/**
 * @route GET /test/error-handler
 * @desc Error handler test page
 * @access Public
 */
router.get('/test/error-handler', (req, res) => {
   res.render('pages/test/error-handler', {
      title: 'Error Handler Test',
      description: 'Test page for error handling functionality',
      user: req.session?.user || null,
      tenant: req.tenant || null,
   });
});

/**
 * @route GET /test-500-error
 * @desc Trigger a 500 error for testing
 * @access Public
 */
router.get('/test-500-error', (_req, _res) => {
   // Intentionally throw an error
   throw new Error('This is a test 500 error');
});

/**
 * @route GET /test-generic-error
 * @desc Trigger a generic error for testing
 * @access Public
 */
router.get('/test-generic-error', (_req, _res) => {
   const error = new Error('This is a test generic error');
   error.statusCode = 418; // I'm a teapot
   throw error;
});

/**
 * @route GET /test-long-message
 * @desc Test flash message truncation with long messages
 * @access Public
 */
router.get('/test-long-message', (req, res) => {
   try {
      // Test with a very long success message
      const longSuccessMessage =
         'This is an extremely long success message that should ' +
         'definitely exceed three lines of text when displayed in the flash message container. ' +
         'The purpose of this message is to test the automatic truncation functionality that ' +
         "we've implemented. When this message is displayed, it should be truncated to fit " +
         "within approximately three lines, and a 'View Full Message' button should appear, " +
         'allowing users to see the complete message in a modal dialog. This feature helps ' +
         'maintain a clean user interface while still providing access to complete information ' +
         'when needed. The truncation system uses CSS line-clamp and JavaScript calculations ' +
         'to determine when messages are too long and need to be truncated for better user experience.';

      const longErrorMessage =
         'This is a comprehensive error message that contains detailed ' +
         'information about what went wrong during the process. Error messages tend to be longer ' +
         'because they often need to provide specific details about the failure, including error ' +
         'codes, possible causes, and suggested solutions. This particular message is intentionally ' +
         "made very long to test our truncation system's ability to handle error messages " +
         'appropriately. The system should detect that this message exceeds the three-line limit ' +
         'and provide a modal option for viewing the complete error details. This is especially ' +
         'important for developers and administrators who need to see full error information for ' +
         'debugging purposes, while regular users can see a concise summary in the toast notification.';

      // Flash both messages
      req.flash('success', longSuccessMessage);
      req.flash('error', longErrorMessage);
      req.flash('warning', 'This is a shorter warning message that should not be truncated.');
      req.flash('info', 'Short info message.');

      // Redirect to a page that will display the messages
      res.redirect('/admin/system');
   } catch (error) {
      logError(error, { context: 'test-long-message' });
      req.flash('error', 'Failed to test long messages');
      res.redirect('/');
   }
});

/**
 * @route GET /
 * @desc Redirect root to appropriate page
 * @access Public
 */
router.get('/', (req, res) => {
   if (req.session && req.session.user) {
      res.redirect('/dashboard');
   } else {
      res.redirect('/auth/login');
   }
});

module.exports = router;
