const express = require('express');
const path = require('path');
const router = express.Router();
const { logSystem, logError } = require('../utils/logger');
const { systemAuthService } = require('../services/systemServices');
const userService = require('../modules/users/services/userService');
const { systemUserValidationSchemas } = require('../models/SystemUser');
const { tenantUserValidationSchemas } = require('../models/TenantUser');

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
      const { username, email, password, remember } = req.body;

      // Use username if provided, otherwise fall back to email
      const userIdentifier = username || email;

      // Debug logging
      console.log('🔍 LOGIN POST DEBUG:', {
         username,
         email,
         userIdentifier,
         host: req.get('host'),
         tenantCode: req.tenantCode,
         path: req.path,
         originalUrl: req.originalUrl,
      });

      // Determine login type based on user identifier pattern and tenant context
      const isSystemUserEmail = userIdentifier === 'sysadmin' || userIdentifier === 'admin';
      const isSystemPattern = userIdentifier && userIdentifier.includes('admin') && !userIdentifier.includes('@');
      const isPureSystemAdmin = isSystemUserEmail || isSystemPattern;

      const isTrustAdminEmail = userIdentifier && userIdentifier.includes('trustadmin@');
      const isDemoAdminEmail = userIdentifier && userIdentifier.includes('@demo.') && userIdentifier.includes('admin');
      const isTrustAdmin = isTrustAdminEmail || isDemoAdminEmail;

      // SECURITY FIX: Only pure system admins should use system authentication
      // Trust admins should ALWAYS use tenant authentication for security
      const isSystemLogin = isPureSystemAdmin && !isTrustAdmin;

      console.log('🔍 LOGIN TYPE DEBUG:', {
         email,
         isPureSystemAdmin,
         isTrustAdmin,
         isSystemLogin,
         hasTenantCode: !!req.tenantCode,
         tenantCode: req.tenantCode,
      });

      // Security check: Pure system admins should only login from main domain
      // Trust admins should only login from their tenant domain
      if (isPureSystemAdmin && req.tenantCode) {
         console.log('❌ BLOCKING: Pure system admin from tenant domain');
         const errorMsg =
            'System administrator login is only allowed from the main domain. ' + 'Please visit the main login page.';

         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: false,
               error: errorMsg,
               redirect: 'http://localhost:3000/auth/login',
               flash: { error: [errorMsg] },
            });
         }
         req.flash('error', errorMsg);
         return res.redirect('http://localhost:3000/auth/login');
      }

      // Trust admins must login from their tenant domain
      if (isTrustAdmin && !req.tenantCode) {
         console.log('❌ BLOCKING: Trust admin from main domain');
         const errorMsg =
            'Trust administrator must login from the tenant domain. ' + 'Please visit the tenant login page.';

         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: false,
               error: errorMsg,
               redirect: 'http://demo.localhost:3000/auth/login',
               flash: { error: [errorMsg] },
            });
         }
         req.flash('error', errorMsg);
         return res.redirect('http://demo.localhost:3000/auth/login');
      }

      let validationSchema;
      if (isSystemLogin) {
         validationSchema = systemUserValidationSchemas.login;
      } else {
         validationSchema = tenantUserValidationSchemas.login;
      }

      // Validate input using proper schema
      const { error } = validationSchema.validate(
         {
            username: userIdentifier,
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
         return res.redirect('/auth/login');
      }

      let authResult;

      if (isSystemLogin) {
         // Use existing system authentication API

         try {
            authResult = await systemAuthService.login({
               username: userIdentifier,
               password: password,
            });

            // Set system user session
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
            return res.redirect('/auth/login');
         }
      } else {
         // Use existing tenant user authentication
         const tenantCode = req.tenantCode || 'demo';

         try {
            authResult = await userService.authenticateUser(tenantCode, userIdentifier, password);

            // Set tenant user session
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
router.get('/admin/system', requireAuth, async (req, res) => {
   try {
      const userType = req.session.userType;

      // Only allow system admins
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      // Fetch real system statistics
      const { trustService } = require('../services/systemServices');
      let stats = null;

      try {
         stats = await trustService.getSystemStats();
      } catch (statsError) {
         logError(statsError, { context: 'admin/system stats fetch' });
         // Provide fallback stats if service fails
         stats = {
            totalTrusts: 0,
            activeTrusts: 0,
            pendingTrusts: 0,
            totalSystemUsers: 0,
            activeUsers: 0,
            systemHealth: 'unknown',
            databaseStatus: 'unknown',
            lastUpdated: new Date().toISOString(),
            error: 'Unable to retrieve current statistics',
         };
      }

      res.render('pages/dashboard/system-admin', {
         title: 'System Administration',
         description: 'System admin dashboard for managing trusts and configuration',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/admin/system',
         stats: stats,
      });
   } catch (error) {
      logError(error, { context: 'admin/system GET' });
      req.flash('error', 'Unable to load system dashboard');
      res.redirect('/auth/login');
   }
});

/**
 * System Admin Functional Routes
 */

/**
 * @route GET /system/trusts
 * @desc List all trusts
 * @access Private (System Admin only)
 */
router.get('/system/trusts', requireAuth, async (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      const { trustService } = require('../services/systemServices');
      const { page = 1, limit = 20, status, search } = req.query;

      let trusts = [];
      let pagination = null;

      try {
         const result = await trustService.listTrusts({ page, limit, status, search });
         trusts = result.trusts;
         pagination = result.pagination;
      } catch (error) {
         logError(error, { context: 'system/trusts list' });
         req.flash('error', 'Unable to load trusts');
      }

      res.render('pages/system/trusts/index', {
         title: 'Manage Trusts',
         description: 'View and manage all educational trusts in the system',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/trusts',
         trusts: trusts,
         pagination: pagination,
         filters: { status, search },
      });
   } catch (error) {
      logError(error, { context: 'system/trusts GET' });
      req.flash('error', 'Unable to load trusts page');
      res.redirect('/admin/system');
   }
});

/**
 * @route GET /system/trusts/new
 * @desc Show create trust form
 * @access Private (System Admin only)
 */
router.get('/system/trusts/new', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/trusts/create', {
         title: 'Create New Trust',
         description: 'Add a new educational trust to the system',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/trusts/new',
      });
   } catch (error) {
      logError(error, { context: 'system/trusts/new GET' });
      req.flash('error', 'Unable to load create trust page');
      res.redirect('/system/trusts');
   }
});

/**
 * @route GET /system/users
 * @desc List all system users
 * @access Private (System Admin only)
 */
router.get('/system/users', requireAuth, async (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      // For now, render placeholder page - would need systemUserService implementation
      res.render('pages/system/users/index', {
         title: 'System Users',
         description: 'Manage system administrator accounts',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/users',
         users: [], // Placeholder - would fetch from systemUserService
      });
   } catch (error) {
      logError(error, { context: 'system/users GET' });
      req.flash('error', 'Unable to load users page');
      res.redirect('/admin/system');
   }
});

/**
 * @route GET /system/health
 * @desc System health and monitoring page
 * @access Private (System Admin only)
 */
router.get('/system/health', requireAuth, async (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      const { trustService } = require('../services/systemServices');
      let stats = null;
      let healthData = {};

      try {
         stats = await trustService.getSystemStats();
         healthData = {
            database: stats.databaseStatus === 'connected',
            trusts: stats.activeTrusts,
            users: stats.activeUsers,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
         };
      } catch (error) {
         logError(error, { context: 'system/health data fetch' });
         healthData = {
            database: false,
            error: 'Unable to fetch health data',
         };
      }

      res.render('pages/system/monitoring/health', {
         title: 'System Health',
         description: 'Monitor system performance and status',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/health',
         stats: stats,
         health: healthData,
      });
   } catch (error) {
      logError(error, { context: 'system/health GET' });
      req.flash('error', 'Unable to load health monitoring');
      res.redirect('/admin/system');
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
 * @route GET /coming-soon
 * @desc Generic coming soon page for unimplemented features
 * @access Private
 */
router.get('/coming-soon', requireAuth, (req, res) => {
   try {
      const { title, description, icon, eta, features } = req.query;

      res.render('pages/coming-soon', {
         title: title || 'Feature Coming Soon',
         description:
            description || 'This feature is currently under development and will be available in a future update.',
         icon: icon || 'fas fa-tools',
         eta: eta || null,
         features: features ? JSON.parse(features) : [],
         user: req.session.user,
         tenant: req.tenant,
         layout: 'layout',
      });
   } catch (error) {
      logError(error, { context: 'coming-soon GET' });
      res.render('pages/coming-soon', {
         title: 'Feature Coming Soon',
         description: 'This feature is currently under development.',
         icon: 'fas fa-tools',
         eta: null,
         features: [],
         user: req.session.user,
         tenant: req.tenant,
         layout: 'layout',
      });
   }
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
 * Additional System Admin Routes for Navigation Menu Items
 */

// Schools Management Routes
router.get('/system/schools', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/schools/index', {
         title: 'School Management',
         description: 'Manage schools across all trusts',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/schools',
      });
   } catch (error) {
      logError(error, { context: 'system/schools GET' });
      req.flash('error', 'Unable to load schools page');
      res.redirect('/admin/system');
   }
});

router.get('/system/schools/performance', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'School Performance',
         description: 'Monitor and analyze school performance metrics',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/schools/performance',
      });
   } catch (error) {
      logError(error, { context: 'system/schools/performance GET' });
      req.flash('error', 'Unable to load performance page');
      res.redirect('/system/schools');
   }
});

router.get('/system/schools/compliance', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'School Compliance',
         description: 'Monitor school compliance and regulatory requirements',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/schools/compliance',
      });
   } catch (error) {
      logError(error, { context: 'system/schools/compliance GET' });
      req.flash('error', 'Unable to load compliance page');
      res.redirect('/system/schools');
   }
});

// Trust Management Sub-routes
router.get('/system/trusts/analytics', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Trust Analytics',
         description: 'Comprehensive analytics for trust performance and growth',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/trusts/analytics',
      });
   } catch (error) {
      logError(error, { context: 'system/trusts/analytics GET' });
      req.flash('error', 'Unable to load analytics page');
      res.redirect('/system/trusts');
   }
});

router.get('/system/trusts/setup', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Trust Setup',
         description: 'Configure trust settings and initialization parameters',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/trusts/setup',
      });
   } catch (error) {
      logError(error, { context: 'system/trusts/setup GET' });
      req.flash('error', 'Unable to load setup page');
      res.redirect('/system/trusts');
   }
});

// User Management Sub-routes
router.get('/system/users/new', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Add System User',
         description: 'Create new system administrator account',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/users/new',
      });
   } catch (error) {
      logError(error, { context: 'system/users/new GET' });
      req.flash('error', 'Unable to load add user page');
      res.redirect('/system/users');
   }
});

router.get('/system/users/roles', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Role Management',
         description: 'Manage system roles and access permissions',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/users/roles',
      });
   } catch (error) {
      logError(error, { context: 'system/users/roles GET' });
      req.flash('error', 'Unable to load roles page');
      res.redirect('/system/users');
   }
});

router.get('/system/users/permissions', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Permission Management',
         description: 'Configure detailed access permissions',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/users/permissions',
      });
   } catch (error) {
      logError(error, { context: 'system/users/permissions GET' });
      req.flash('error', 'Unable to load permissions page');
      res.redirect('/system/users');
   }
});

// Session Management
router.get('/system/sessions', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Active Sessions',
         description: 'Monitor and manage active user sessions',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/sessions',
      });
   } catch (error) {
      logError(error, { context: 'system/sessions GET' });
      req.flash('error', 'Unable to load sessions page');
      res.redirect('/admin/system');
   }
});

// Audit Logs
router.get('/system/audit', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/audit', {
         title: 'Audit Logs',
         description: 'System audit trails and security monitoring',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/audit',
      });
   } catch (error) {
      logError(error, { context: 'system/audit GET' });
      req.flash('error', 'Unable to load audit page');
      res.redirect('/admin/system');
   }
});

// Monitoring Sub-routes
router.get('/system/performance', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Performance Monitoring',
         description: 'Real-time system performance metrics and optimization',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/performance',
      });
   } catch (error) {
      logError(error, { context: 'system/performance GET' });
      req.flash('error', 'Unable to load performance page');
      res.redirect('/system/health');
   }
});

router.get('/system/analytics', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'System Analytics',
         description: 'Comprehensive system usage and performance analytics',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/analytics',
      });
   } catch (error) {
      logError(error, { context: 'system/analytics GET' });
      req.flash('error', 'Unable to load analytics page');
      res.redirect('/system/health');
   }
});

router.get('/system/logs', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'System Logs',
         description: 'View and analyze system logs and events',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/logs',
      });
   } catch (error) {
      logError(error, { context: 'system/logs GET' });
      req.flash('error', 'Unable to load logs page');
      res.redirect('/system/health');
   }
});

// Data Management Routes
router.get('/system/backups', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/data/backups', {
         title: 'Backup Management',
         description: 'System backup and restore operations',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/backups',
      });
   } catch (error) {
      logError(error, { context: 'system/backups GET' });
      req.flash('error', 'Unable to load backups page');
      res.redirect('/admin/system');
   }
});

router.get('/system/migrations', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Database Migrations',
         description: 'Manage database migrations and schema updates',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/migrations',
      });
   } catch (error) {
      logError(error, { context: 'system/migrations GET' });
      req.flash('error', 'Unable to load migrations page');
      res.redirect('/admin/system');
   }
});

router.get('/system/imports', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Data Import',
         description: 'Import data from external sources and files',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/imports',
      });
   } catch (error) {
      logError(error, { context: 'system/imports GET' });
      req.flash('error', 'Unable to load imports page');
      res.redirect('/admin/system');
   }
});

router.get('/system/exports', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Data Export',
         description: 'Export system data for backup and analysis',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/exports',
      });
   } catch (error) {
      logError(error, { context: 'system/exports GET' });
      req.flash('error', 'Unable to load exports page');
      res.redirect('/admin/system');
   }
});

// Configuration Routes
router.get('/system/config/general', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/config/index', {
         title: 'General Settings',
         description: 'Configure general system settings and preferences',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/config/general',
      });
   } catch (error) {
      logError(error, { context: 'system/config/general GET' });
      req.flash('error', 'Unable to load general settings page');
      res.redirect('/admin/system');
   }
});

router.get('/system/config/security', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Security Settings',
         description: 'Configure system security policies and authentication',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/config/security',
      });
   } catch (error) {
      logError(error, { context: 'system/config/security GET' });
      req.flash('error', 'Unable to load security settings page');
      res.redirect('/admin/system');
   }
});

router.get('/system/config/email', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Email Settings',
         description: 'Configure email server and notification settings',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/config/email',
      });
   } catch (error) {
      logError(error, { context: 'system/config/email GET' });
      req.flash('error', 'Unable to load email settings page');
      res.redirect('/admin/system');
   }
});

router.get('/system/config/integrations', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Integration Settings',
         description: 'Configure external system integrations and APIs',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/config/integrations',
      });
   } catch (error) {
      logError(error, { context: 'system/config/integrations GET' });
      req.flash('error', 'Unable to load integration settings page');
      res.redirect('/admin/system');
   }
});

// Maintenance
router.get('/system/maintenance', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'System Maintenance',
         description: 'System maintenance tools and utilities',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/maintenance',
      });
   } catch (error) {
      logError(error, { context: 'system/maintenance GET' });
      req.flash('error', 'Unable to load maintenance page');
      res.redirect('/admin/system');
   }
});

// Reports Routes
router.get('/system/reports/system', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/reports/index', {
         title: 'System Reports',
         description: 'Comprehensive system performance and usage reports',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/reports/system',
      });
   } catch (error) {
      logError(error, { context: 'system/reports/system GET' });
      req.flash('error', 'Unable to load system reports page');
      res.redirect('/admin/system');
   }
});

router.get('/system/reports/usage', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Usage Statistics',
         description: 'Detailed usage statistics and user activity reports',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/reports/usage',
      });
   } catch (error) {
      logError(error, { context: 'system/reports/usage GET' });
      req.flash('error', 'Unable to load usage reports page');
      res.redirect('/admin/system');
   }
});

router.get('/system/reports/financial', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Financial Reports',
         description: 'Financial analysis and revenue reports across all trusts',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/reports/financial',
      });
   } catch (error) {
      logError(error, { context: 'system/reports/financial GET' });
      req.flash('error', 'Unable to load financial reports page');
      res.redirect('/admin/system');
   }
});

router.get('/system/reports/custom', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Custom Reports',
         description: 'Create and manage custom reports and dashboards',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/reports/custom',
      });
   } catch (error) {
      logError(error, { context: 'system/reports/custom GET' });
      req.flash('error', 'Unable to load custom reports page');
      res.redirect('/admin/system');
   }
});

// Support Routes
router.get('/system/support', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Support Center',
         description: 'Access support resources and contact information',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/support',
      });
   } catch (error) {
      logError(error, { context: 'system/support GET' });
      req.flash('error', 'Unable to load support page');
      res.redirect('/admin/system');
   }
});

router.get('/system/documentation', requireAuth, (req, res) => {
   try {
      const userType = req.session.userType;
      if (userType !== 'system') {
         req.flash('error', 'Access denied. System admin privileges required.');
         return res.redirect('/dashboard');
      }

      res.render('pages/system/_placeholder', {
         title: 'Documentation',
         description: 'System documentation and user guides',
         user: req.session.user,
         tenant: null,
         userType: userType,
         currentPath: '/system/documentation',
      });
   } catch (error) {
      logError(error, { context: 'system/documentation GET' });
      req.flash('error', 'Unable to load documentation page');
      res.redirect('/admin/system');
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
