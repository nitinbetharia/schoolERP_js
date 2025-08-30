const express = require('express');
const { logSystem, logError } = require('../../utils/logger');
const { systemAuthService } = require('../../services/systemServices');
const userService = require('../../modules/users/services/userService');
const { systemUserValidationSchemas } = require('../../models/SystemUser');
const { tenantUserValidationSchemas } = require('../../models/TenantUser');

/**
 * Authentication Routes Module
 * Handles login, logout, forgot password, and password reset functionality
 * File size: ~250 lines (within industry standards)
 */

module.exports = function (_middleware) {
   const router = express.Router();

   // Import password reset routes
   const passwordResetRoutes = require('./password-reset');

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
    * @route GET /dashboard
    * @desc Dashboard page routing
    * @access Private
    */
   router.get('/dashboard', _middleware.requireAuth, (req, res) => {
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
         res.redirect('/login');
      }
   });

   /**
    * @route GET /login
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
            user: req.user || null,
            success: req.flash ? req.flash('success') : [],
            error: req.flash ? req.flash('error') : [],
            warning: req.flash ? req.flash('warning') : [],
            info: req.flash ? req.flash('info') : [],
         };

         console.log('✅ Rendering login page successfully');
         res.render('pages/auth/login', {
            ...renderData,
            layout: 'layout',
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
    * @route POST /login
    * @desc Process login form
    * @access Public
    */
   router.post('/login', async (req, res) => {
      try {
         const { username, email, password, remember } = req.body;
         const userIdentifier = username || email;

         console.log('🔍 LOGIN POST DEBUG:', {
            username,
            email,
            userIdentifier,
            host: req.get('host'),
            tenantCode: req.tenantCode,
         });

         // Determine login type
         const isSystemUserEmail = userIdentifier === 'sysadmin' || userIdentifier === 'admin';
         const isSystemPattern = userIdentifier && userIdentifier.includes('admin') && !userIdentifier.includes('@');
         const isPureSystemAdmin = isSystemUserEmail || isSystemPattern;

         const isTrustAdminEmail = userIdentifier && userIdentifier.includes('trustadmin@');
         const isDemoAdminEmail =
            userIdentifier && userIdentifier.includes('@demo.') && userIdentifier.includes('admin');
         const isTrustAdmin = isTrustAdminEmail || isDemoAdminEmail;

         const isSystemLogin = isPureSystemAdmin && !isTrustAdmin;

         // Security checks for domain restrictions
         if (isPureSystemAdmin && req.tenantCode) {
            const errorMsg =
               'System administrator login is only allowed from the main domain. ' +
               'Please visit the main login page.';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: errorMsg,
                  redirect: 'http://localhost:3000/login',
                  flash: { error: [errorMsg] },
               });
            }
            req.flash('error', errorMsg);
            return res.redirect('http://localhost:3000/login');
         }

         if (isTrustAdmin && !req.tenantCode) {
            const errorMsg =
               'Trust administrator must login from the tenant domain. ' + 'Please visit the tenant login page.';
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: errorMsg,
                  redirect: 'http://demo.localhost:3000/login',
                  flash: { error: [errorMsg] },
               });
            }
            req.flash('error', errorMsg);
            return res.redirect('http://demo.localhost:3000/login');
         }

         // Validate input
         const validationSchema = isSystemLogin ? systemUserValidationSchemas.login : tenantUserValidationSchemas.login;
         const { error } = validationSchema.validate({ username: userIdentifier, password });

         if (error) {
            const validationErrors = {};
            error.details.forEach((detail) => {
               const key = detail.path[0];
               validationErrors[key === 'username' ? 'userIdentifier' : key] = detail.message;
            });

            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
               return res.json({
                  success: false,
                  error: 'Validation failed',
                  errors: validationErrors,
               });
            }
            req.flash('error', Object.values(validationErrors).join(', '));
            return res.redirect('/login');
         }

         // Authenticate user
         let authResult;
         if (isSystemLogin) {
            try {
               authResult = await systemAuthService.login({
                  username: userIdentifier,
                  password: password,
               });
               req.session.user = authResult;
               req.session.userType = 'system';
            } catch (error) {
               const errorMsg = 'Invalid system credentials';
               logError(error, { context: 'SystemLogin', username: userIdentifier });

               if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                  return res.json({
                     success: false,
                     error: error.userMessage || errorMsg,
                     flash: { error: [error.userMessage || errorMsg] },
                  });
               }
               req.flash('error', error.userMessage || errorMsg);
               return res.redirect('/login');
            }
         } else {
            const tenantCode = req.tenantCode || 'demo';
            try {
               authResult = await userService.authenticateUser(tenantCode, userIdentifier, password);
               req.session.user = authResult;
               req.session.userType = 'tenant';
               req.session.tenantCode = tenantCode;
            } catch (error) {
               const errorMsg = 'Invalid tenant credentials';
               logError(error, {
                  context: 'TenantLogin',
                  username: userIdentifier,
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
               return res.redirect('/login');
            }
         }

         // Set remember me cookie
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
         return res.redirect('/login');
      }
   });

   /**
    * @route POST /logout
    * @desc Process logout
    * @access Private
    */
   router.post('/logout', (req, res) => {
      try {
         const user = req.session?.user;
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
                  redirect: '/login',
                  flash: { success: [flashMessage] },
               });
            }

            res.redirect('/login');
         });
      } catch (error) {
         logError(error, { context: 'logout' });
         res.redirect('/login');
      }
   });

   /**
    * @route GET /logout
    * @desc Render logout confirmation page
    * @access Private
    */
   router.get('/logout', (req, res) => {
      res.render('pages/auth/logout', {
         title: 'Logout',
         description: 'Logging out of School ERP System',
         tenant: req.tenant || null,
         layout: 'layout',
      });
   });

   // Mount password reset routes
   router.use('/', passwordResetRoutes(_middleware));

   return router;
};
