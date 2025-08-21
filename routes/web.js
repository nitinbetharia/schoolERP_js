const express = require('express');
const router = express.Router();
const { logSystem, logError } = require('../utils/logger');
const { systemAuthService } = require('../services/systemServices');
const createUserService = require('../modules/user/services/UserService');
const { systemUserValidationSchemas } = require('../models/SystemUser');
const { userValidationSchemas } = require('../models');

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
 * @route GET /auth/login
 * @desc Show login form
 * @access Public
 */
router.get('/login', async (req, res) => {
   try {
      // If user is already logged in, redirect to dashboard
      if (req.session && req.session.user) {
         return res.redirect('/dashboard');
      }

      const renderData = {
         title: 'Login',
         description: 'Sign in to your School ERP account',
         subtitle: 'Access your educational management system',
         tenant: req.tenant || null,
         success: req.flash('success'),
         error: req.flash('error'),
         warning: req.flash('warning'),
         info: req.flash('info'),
      };

      res.render('layouts/auth', {
         ...renderData,
         body: await new Promise((resolve, reject) => {
            res.app.render('pages/auth/login', renderData, (err, html) => {
               if (err) reject(err);
               else resolve(html);
            });
         }),
      });
   } catch (error) {
      logError(error, { context: 'auth/login GET' });
      res.status(500).render('layouts/auth', {
         title: 'Error',
         tenant: req.tenant || null,
         error: 'Unable to load login page',
         body: '<div class="text-center"><h3>Service Unavailable</h3><p>Please try again later.</p></div>',
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
         validationSchema = userValidationSchemas.login;
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
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
            return res.redirect('/auth/login');
         }
      } else {
         // Use existing tenant user authentication
         const tenantCode = req.tenantCode || 'demo';
         const createUserService = require('../modules/user/services/UserService');
         const userService = createUserService();

         try {
            authResult = await userService.authenticateUser(tenantCode, email, password);

            // Set tenant user session
            req.session.user = authResult;
            req.session.userType = 'tenant';
            req.session.tenantCode = tenantCode;
         } catch (error) {
            const errorMsg = 'Invalid tenant credentials';
            logError(error, { context: 'TenantLogin', username: email, tenantCode });

            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({ success: false, error: errorMsg });
            }
            req.flash('error', errorMsg);
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
         });
      }

      // Redirect based on user type
      const redirectUrl = isSystemLogin ? '/admin/system' : '/dashboard';
      req.flash('success', 'Welcome! You have successfully logged in.');
      return res.redirect(redirectUrl);
   } catch (error) {
      logError(error, { context: 'WebLoginError' });

      const errorMsg = 'An error occurred during login. Please try again.';
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.status(500).json({ success: false, error: errorMsg });
      }

      req.flash('error', errorMsg);
      return res.redirect('/auth/login');
   }
});

/**
 * @route POST /auth/logout
 * @desc Process logout
 * @access Private
 */
router.post('/logout', (req, res) => {
   try {
      if (req.session) {
         req.session.destroy((err) => {
            if (err) {
               logError(err, { context: 'logout' });
            }
         });
      }

      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.json({ success: true, message: 'Logged out successfully' });
      }

      req.flash('success', 'You have been logged out successfully');
      res.redirect('/auth/login');
   } catch (error) {
      logError(error, { context: 'logout' });
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.json({ success: false, error: 'Logout failed' });
      }
      res.redirect('/auth/login');
   }
});

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
      res.render('layouts/main', {
         title: 'Trust Dashboard',
         description: 'Trust administration dashboard for managing schools, students, and staff',
         user: req.session.user,
         tenant: req.session.tenant || req.tenant,
         userType: userType,
         body: 'pages/dashboard/trust-admin',
         currentPath: '/dashboard'
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

      res.render('layouts/main', {
         title: 'System Administration',
         description: 'System administration dashboard for managing trusts and system configuration',
         user: req.session.user,
         tenant: null,
         userType: userType,
         body: 'pages/dashboard/system-admin',
         currentPath: '/admin/system'
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

         if (req.xhr) {
            return res.json({
               success: true,
               message: 'Logged out successfully',
               redirect: '/auth/login',
            });
         }

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
   res.render('layouts/auth', {
      title: 'Logout',
      tenant: req.tenant || null,
      body: `
            <div class="text-center space-y-4">
                <h3 class="text-lg font-semibold">Logging out...</h3>
                <form method="POST" action="/auth/logout" class="hidden" id="logoutForm">
                    <button type="submit">Logout</button>
                </form>
                <script>
                    document.getElementById('logoutForm').submit();
                </script>
            </div>
        `,
   });
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
