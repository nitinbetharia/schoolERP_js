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
 * Get user creation permissions based on role
 * @param {Object} user - Current user object
 * @returns {Promise<Object>} - User permissions
 */
async function getUserCreationPermissions(user) {
   try {
      const roleHierarchy = {
         SYSTEM_ADMIN: ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
         TRUST_ADMIN: ['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
         SCHOOL_ADMIN: ['TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
         TEACHER: ['STUDENT', 'PARENT'],
         ACCOUNTANT: ['STUDENT', 'PARENT'],
         PARENT: [],
         STUDENT: [],
      };

      const allowedUserTypes = roleHierarchy[user.role] || [];

      return {
         canCreate: allowedUserTypes.length > 0,
         allowedUserTypes,
         maxUsers: user.role === 'SYSTEM_ADMIN' ? null : 1000, // No limit for system admin
      };
   } catch (error) {
      logError(error, { context: 'getUserCreationPermissions', userId: user?.id });
      return {
         canCreate: false,
         allowedUserTypes: [],
         maxUsers: 0,
      };
   }
}

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
 * @route GET /forgot-password
 * @desc Render forgot password page
 * @access Public
 */
router.get('/forgot-password', (req, res) => {
   try {
      // If user is already logged in, redirect to dashboard
      if (req.session && req.session.user) {
         return res.redirect('/dashboard');
      }

      res.render('pages/auth/forgot-password', {
         title: 'Forgot Password',
         description: 'Reset your password for School ERP System',
         tenant: req.tenant || null,
         layout: 'layout',
      });
   } catch (error) {
      logError(error, { context: 'ForgotPasswordPage' });
      req.flash('error', 'Unable to load password reset page. Please try again.');
      res.redirect('/login');
   }
});

/**
 * @route POST /forgot-password
 * @desc Process forgot password request
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
   try {
      const { email } = req.body;

      // Validate email
      if (!email) {
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: false,
               error: 'Email address is required',
            });
         }
         req.flash('error', 'Email address is required');
         return res.redirect('/forgot-password');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({
               success: false,
               error: 'Please enter a valid email address',
            });
         }
         req.flash('error', 'Please enter a valid email address');
         return res.redirect('/forgot-password');
      }

      // Check if email exists in system (system users) or tenant (tenant users)
      let user = null;
      let userType = null;

      // For security, we don't reveal if email exists or not
      // Always return success message regardless of whether email is found
      try {
         // First check system users
         const systemUser = await systemAuthService.findUserByEmail(email);
         if (systemUser) {
            user = systemUser;
            userType = 'system';
         } else if (req.tenant) {
            // Check tenant users if on a tenant subdomain
            const tenantUser = await userService.findUserByEmail(email, req.tenant.id);
            if (tenantUser) {
               user = tenantUser;
               userType = 'tenant';
            }
         }

         // Generate password reset token if user exists
         if (user) {
            const resetToken = await (userType === 'system'
               ? systemAuthService.generatePasswordResetToken(user.id)
               : userService.generatePasswordResetToken(user.id, req.tenant.id));

            // Send password reset email
            const emailService = require('../services/emailService');
            await emailService.sendPasswordResetEmail(user, resetToken, req.tenant);

            logSystem('Password reset requested', {
               userId: user.id,
               email: user.email,
               userType,
               tenantId: req.tenant?.id,
               ip: req.ip,
            });
         }
      } catch (error) {
         logError(error, {
            context: 'ForgotPasswordProcess',
            email: email,
            tenantId: req.tenant?.id,
         });
         // Continue to success message for security
      }

      // Always return success message for security
      const successMessage =
         'If an account with this email exists, you will receive password reset instructions shortly.';

      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.json({
            success: true,
            message: successMessage,
         });
      }

      req.flash('success', successMessage);
      res.redirect('/forgot-password');
   } catch (error) {
      logError(error, { context: 'ForgotPasswordError' });

      const errorMsg = 'Unable to process password reset request. Please try again.';
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.status(500).json({
            success: false,
            error: errorMsg,
         });
      }

      req.flash('error', errorMsg);
      res.redirect('/forgot-password');
   }
});

/**
 * @route GET /reset-password/:token
 * @desc Render password reset page with token validation
 * @access Public
 */
router.get('/reset-password/:token', async (req, res) => {
   try {
      const { token } = req.params;

      // If user is already logged in, redirect to dashboard
      if (req.session && req.session.user) {
         return res.redirect('/dashboard');
      }

      if (!token) {
         req.flash('error', 'Invalid password reset link');
         return res.redirect('/forgot-password');
      }

      // Validate token
      let tokenValid = false;
      let user = null;

      try {
         // Check system users first
         const systemReset = await systemAuthService.validatePasswordResetToken(token);
         if (systemReset) {
            tokenValid = true;
            user = systemReset.user;
         } else if (req.tenant) {
            // Check tenant users
            const tenantReset = await userService.validatePasswordResetToken(token, req.tenant.id);
            if (tenantReset) {
               tokenValid = true;
               user = tenantReset.user;
            }
         }
      } catch (error) {
         logError(error, {
            context: 'ResetTokenValidation',
            token: token.substring(0, 10) + '...', // Log partial token for security
            tenantId: req.tenant?.id,
         });
      }

      res.render('pages/auth/reset-password', {
         title: 'Reset Password',
         description: 'Create a new password for your account',
         tenant: req.tenant || null,
         layout: 'layout',
         token,
         tokenValid,
         user: user ? { name: user.name, email: user.email } : null,
      });
   } catch (error) {
      logError(error, { context: 'ResetPasswordPage' });
      req.flash('error', 'Unable to load password reset page. Please try again.');
      res.redirect('/forgot-password');
   }
});

/**
 * @route POST /reset-password/:token
 * @desc Process password reset with new password
 * @access Public
 */
router.post('/reset-password/:token', async (req, res) => {
   try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      // Validate input
      if (!token) {
         const errorMsg = 'Invalid password reset link';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({ success: false, error: errorMsg });
         }
         req.flash('error', errorMsg);
         return res.redirect('/forgot-password');
      }

      if (!password || !confirmPassword) {
         const errorMsg = 'Both password fields are required';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({ success: false, error: errorMsg });
         }
         req.flash('error', errorMsg);
         return res.redirect(`/reset-password/${token}`);
      }

      if (password !== confirmPassword) {
         const errorMsg = 'Passwords do not match';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({ success: false, error: errorMsg });
         }
         req.flash('error', errorMsg);
         return res.redirect(`/reset-password/${token}`);
      }

      // Validate password strength
      if (password.length < 8) {
         const errorMsg = 'Password must be at least 8 characters long';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({ success: false, error: errorMsg });
         }
         req.flash('error', errorMsg);
         return res.redirect(`/reset-password/${token}`);
      }

      // Attempt to reset password
      let resetResult = null;
      let userType = null;

      try {
         // Try system users first
         resetResult = await systemAuthService.resetPassword(token, password);
         if (resetResult) {
            userType = 'system';
         } else if (req.tenant) {
            // Try tenant users
            resetResult = await userService.resetPassword(token, password, req.tenant.id);
            if (resetResult) {
               userType = 'tenant';
            }
         }
      } catch (error) {
         logError(error, {
            context: 'PasswordResetProcess',
            token: token.substring(0, 10) + '...',
            tenantId: req.tenant?.id,
         });
      }

      if (!resetResult) {
         const errorMsg = 'Password reset link is invalid or has expired. Please request a new one.';
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.json({ success: false, error: errorMsg });
         }
         req.flash('error', errorMsg);
         return res.redirect('/forgot-password');
      }

      // Log successful password reset
      logSystem('Password reset completed', {
         userId: resetResult.user.id,
         email: resetResult.user.email,
         userType,
         tenantId: req.tenant?.id,
         ip: req.ip,
      });

      // Success response
      const successMessage = 'Your password has been successfully reset. You can now login with your new password.';

      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.json({
            success: true,
            message: successMessage,
         });
      }

      req.flash('success', successMessage);
      res.redirect('/login');
   } catch (error) {
      logError(error, { context: 'ResetPasswordError' });

      const errorMsg = 'Unable to reset password. Please try again.';
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
         return res.status(500).json({
            success: false,
            error: errorMsg,
         });
      }

      req.flash('error', errorMsg);
      res.redirect(`/reset-password/${req.params.token}`);
   }
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
 * Admin User Registration Routes
 * Role-based access control for user creation
 */

/**
 * Role-based access middleware
 * Checks if user has permission to create other users
 */
const requireUserCreationAccess = (req, res, next) => {
   try {
      if (!req.session || !req.session.user) {
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(401).json({
               success: false,
               error: 'Authentication required',
               redirect: '/login',
            });
         }
         req.flash('error', 'Please log in to access this page');
         return res.redirect('/login');
      }

      const user = req.session.user;
      const userType = req.session.userType;
      const userRole = user.role;

      // Define role hierarchy and permissions
      const rolePermissions = {
         SYSTEM_ADMIN: {
            canCreate: ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
            description: 'System Administrator - Can create all user types',
         },
         TRUST_ADMIN: {
            canCreate: ['SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
            description: 'Trust Administrator - Can create school-level users',
         },
         SCHOOL_ADMIN: {
            canCreate: ['TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'],
            description: 'School Administrator - Can create school users',
         },
         TEACHER: {
            canCreate: ['STUDENT'],
            description: 'Teacher - Can create student accounts',
         },
         ACCOUNTANT: {
            canCreate: [],
            description: 'Accountant - View only access',
         },
         PARENT: {
            canCreate: [],
            description: 'Parent - View only access',
         },
         STUDENT: {
            canCreate: [],
            description: 'Student - View only access',
         },
      };

      const userPermissions = rolePermissions[userRole];
      if (!userPermissions || userPermissions.canCreate.length === 0) {
         if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(403).json({
               success: false,
               error: 'Access denied. You do not have permission to create users.',
            });
         }
         req.flash('error', 'Access denied. You do not have permission to create users.');
         return res.redirect('/dashboard');
      }

      // Attach permissions to request for use in routes
      req.userPermissions = userPermissions;
      next();
   } catch (error) {
      logError(error, { context: 'RequireUserCreationAccess' });
      res.status(500).json({
         success: false,
         error: 'Internal server error',
      });
   }
};

/**
 * @route GET /admin/users/register
 * @desc Show user registration management page
 * @access Private (Admin roles only)
 */
router.get('/admin/users/register', requireUserCreationAccess, (req, res) => {
   try {
      const userType = req.session.userType;
      const userRole = req.session.user.role;

      res.render('pages/admin/user-registration', {
         title: 'User Registration',
         description: 'Create and manage user accounts',
         user: req.session.user,
         tenant: req.tenant || null,
         userType: userType,
         userRole: userRole,
         permissions: req.userPermissions,
         currentPath: '/admin/users/register',
         layout: 'layout',
      });
   } catch (error) {
      logError(error, { context: 'admin/users/register GET' });
      req.flash('error', 'Unable to load user registration page');
      res.redirect('/dashboard');
   }
});

/**
 * @route GET /api/admin/users/permissions
 * @desc Get user creation permissions for current user
 * @access Private (Admin roles only)
 */
router.get('/api/admin/users/permissions', requireUserCreationAccess, (req, res) => {
   try {
      const userRole = req.session.user.role;
      const permissions = req.userPermissions;

      // Define user types with their metadata
      const userTypeMetadata = {
         SYSTEM_ADMIN: {
            type: 'SYSTEM_ADMIN',
            name: 'System Administrator',
            description: 'Full system access and management',
            icon: 'fas fa-crown',
            roles: ['SYSTEM_ADMIN'],
            category: 'system',
         },
         TRUST_ADMIN: {
            type: 'TRUST_ADMIN',
            name: 'Trust Administrator',
            description: 'Manage multiple schools within trust',
            icon: 'fas fa-building',
            roles: ['TRUST_ADMIN'],
            category: 'trust',
         },
         SCHOOL_ADMIN: {
            type: 'SCHOOL_ADMIN',
            name: 'School Administrator',
            description: 'Manage single school operations',
            icon: 'fas fa-school',
            roles: ['SCHOOL_ADMIN'],
            category: 'school',
         },
         TEACHER: {
            type: 'TEACHER',
            name: 'Teacher',
            description: 'Classroom management and student records',
            icon: 'fas fa-chalkboard-teacher',
            roles: ['TEACHER'],
            category: 'academic',
         },
         ACCOUNTANT: {
            type: 'ACCOUNTANT',
            name: 'Accountant',
            description: 'Financial management and fee collection',
            icon: 'fas fa-calculator',
            roles: ['ACCOUNTANT'],
            category: 'finance',
         },
         PARENT: {
            type: 'PARENT',
            name: 'Parent',
            description: 'View child progress and school information',
            icon: 'fas fa-users',
            roles: ['PARENT'],
            category: 'stakeholder',
         },
         STUDENT: {
            type: 'STUDENT',
            name: 'Student',
            description: 'Access learning materials and assignments',
            icon: 'fas fa-graduation-cap',
            roles: ['STUDENT'],
            category: 'academic',
         },
      };

      // Filter user types based on permissions
      const canCreateUserTypes = permissions.canCreate
         .map((roleType) => userTypeMetadata[roleType])
         .filter((metadata) => metadata); // Remove any undefined entries

      res.json({
         success: true,
         userRole: userRole,
         canCreateUserTypes: canCreateUserTypes,
         permissions: permissions,
      });
   } catch (error) {
      logError(error, { context: 'api/admin/users/permissions GET' });
      res.status(500).json({
         success: false,
         error: 'Failed to retrieve user permissions',
      });
   }
});

/**
 * @route GET /api/admin/users/stats
 * @desc Get user statistics for dashboard
 * @access Private (Admin roles only)
 */
router.get('/api/admin/users/stats', requireUserCreationAccess, async (req, res) => {
   try {
      const userType = req.session.userType;
      const userRole = req.session.user.role;

      let stats = {};

      if (userType === 'system') {
         // System admin - get global stats
         try {
            const { trustService } = require('../services/systemServices');
            const systemStats = await trustService.getSystemStats();

            stats = {
               total: systemStats.totalSystemUsers + systemStats.totalTenantUsers || 0,
               active: systemStats.activeUsers || 0,
               pending: systemStats.pendingUsers || 0,
               monthly: systemStats.monthlyNewUsers || 0,
            };
         } catch (error) {
            logError(error, { context: 'SystemUserStats' });
            stats = { total: 0, active: 0, pending: 0, monthly: 0 };
         }
      } else {
         // Tenant admin - get tenant-specific stats
         try {
            const tenantCode = req.session.tenantCode || req.tenant?.trust_code;
            const userStats = await userService.getUserStats(tenantCode);

            stats = {
               total: userStats.total || 0,
               active: userStats.active || 0,
               pending: userStats.pending || 0,
               monthly: userStats.monthly || 0,
            };
         } catch (error) {
            logError(error, { context: 'TenantUserStats', tenantCode: req.tenant?.trust_code });
            stats = { total: 0, active: 0, pending: 0, monthly: 0 };
         }
      }

      res.json(stats);
   } catch (error) {
      logError(error, { context: 'api/admin/users/stats GET' });
      res.status(500).json({
         success: false,
         error: 'Failed to retrieve user statistics',
         stats: { total: 0, active: 0, pending: 0, monthly: 0 },
      });
   }
});

/**
 * @route POST /api/admin/users/create
 * @desc Create a new user account
 * @access Private (Admin roles only)
 */
router.post('/api/admin/users/create', requireUserCreationAccess, async (req, res) => {
   try {
      const {
         firstName,
         lastName,
         email,
         phone,
         dateOfBirth,
         gender,
         role,
         status,
         userType,
         passwordOption,
         password,
         sendWelcomeEmail,
      } = req.body;

      const currentUser = req.session.user;
      const currentUserType = req.session.userType;

      // Validate required fields
      if (!firstName || !lastName || !email || !role || !userType) {
         return res.status(400).json({
            success: false,
            error: 'Required fields missing: firstName, lastName, email, role, userType',
         });
      }

      // Check if user can create this role type
      if (!req.userPermissions.canCreate.includes(role)) {
         return res.status(403).json({
            success: false,
            error: `You do not have permission to create users with role: ${role}`,
         });
      }

      // Generate password if not provided
      let userPassword = password;
      if (passwordOption === 'generate' || !userPassword) {
         userPassword = generateSecurePassword();
      }

      // Prepare user data
      const userData = {
         firstName,
         lastName,
         full_name: `${firstName} ${lastName}`,
         email: email.toLowerCase(),
         phone,
         date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
         gender,
         role,
         user_type: userType,
         status: status || 'ACTIVE',
         password: userPassword,
         created_by: currentUser.id,
         is_active: status !== 'INACTIVE',
      };

      let newUser = null;

      // Create user based on context
      if (currentUserType === 'system' && ['SYSTEM_ADMIN'].includes(role)) {
         // Create system user
         try {
            newUser = await systemAuthService.createSystemUser(userData, currentUser.id);
         } catch (error) {
            logError(error, { context: 'CreateSystemUser', userData: { email, role } });
            return res.status(400).json({
               success: false,
               error: error.message || 'Failed to create system user',
            });
         }
      } else {
         // Create tenant user
         try {
            const tenantCode = req.session.tenantCode || req.tenant?.trust_code;
            if (!tenantCode) {
               return res.status(400).json({
                  success: false,
                  error: 'Tenant context required for user creation',
               });
            }

            newUser = await userService.createUser(tenantCode, userData);
         } catch (error) {
            logError(error, { context: 'CreateTenantUser', userData: { email, role } });
            return res.status(400).json({
               success: false,
               error: error.message || 'Failed to create tenant user',
            });
         }
      }

      // Send welcome email if requested
      if (sendWelcomeEmail && newUser) {
         try {
            const emailService = require('../services/emailService');
            await emailService.sendWelcomeEmail(newUser, userPassword, req.tenant);
         } catch (emailError) {
            logError(emailError, { context: 'SendWelcomeEmail', userId: newUser.id });
            // Don't fail the user creation if email fails
         }
      }

      // Log user creation
      logSystem('New user created via admin interface', {
         newUserId: newUser.id,
         newUserEmail: newUser.email,
         newUserRole: newUser.role,
         createdBy: currentUser.id,
         createdByRole: currentUser.role,
         tenantCode: req.session.tenantCode || req.tenant?.trust_code,
      });

      res.json({
         success: true,
         message: 'User created successfully',
         user: {
            id: newUser.id,
            name: newUser.full_name || `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
         },
         passwordGenerated: passwordOption === 'generate',
      });
   } catch (error) {
      logError(error, { context: 'api/admin/users/create POST' });
      res.status(500).json({
         success: false,
         error: 'Internal server error during user creation',
      });
   }
});

/**
 * @route GET /api/admin/users/registration-requests
 * @desc Get pending registration requests
 * @access Private (Admin roles only)
 */
router.get('/api/admin/users/registration-requests', requireUserCreationAccess, async (req, res) => {
   try {
      const userType = req.session.userType;
      const { status = 'all', limit = 50 } = req.query;

      let requests = [];

      if (userType === 'system') {
         // System admin - get all registration requests
         // This would need a system-level registration request service
         requests = []; // Placeholder - implement systemRegistrationService
      } else {
         // Tenant admin - get tenant-specific requests
         try {
            const tenantCode = req.session.tenantCode || req.tenant?.trust_code;
            // This would need a tenant-level registration request service
            requests = []; // Placeholder - implement tenant registration requests
         } catch (error) {
            logError(error, { context: 'TenantRegistrationRequests' });
         }
      }

      res.json(requests);
   } catch (error) {
      logError(error, { context: 'api/admin/users/registration-requests GET' });
      res.status(500).json({
         success: false,
         error: 'Failed to retrieve registration requests',
         requests: [],
      });
   }
});

// ================================
// ENHANCED FEATURES (Option C)
// ================================

/**
 * @route GET /admin/bulk-user-import
 * @desc Bulk user import interface
 * @access Private (Admin only with bulk permissions)
 */
router.get('/admin/bulk-user-import', requireUserCreationAccess, async (req, res) => {
   try {
      const user = req.session.user;
      const userType = req.session.userType;
      const userRole = user.role;

      // Check if bulk import is allowed for this user level
      const canBulkImport = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'].includes(userRole);
      if (!canBulkImport) {
         req.flash('error', 'Access denied. Bulk import privileges required.');
         return res.redirect('/admin/users/register');
      }

      res.render('pages/admin/bulk-user-import', {
         title: 'Bulk User Import',
         description: 'Import multiple users from CSV file',
         user: user,
         tenant: req.tenant || null,
         userType: userType,
         userRole: userRole,
         permissions: req.userPermissions,
         currentPath: '/admin/bulk-user-import',
         layout: 'layout',
      });
   } catch (error) {
      logError(error, {
         context: 'admin/bulk-user-import GET',
         userId: req.session?.user?.id,
      });
      req.flash('error', 'Unable to load bulk import page');
      res.redirect('/admin/users/register');
   }
});

/**
 * @route GET /admin/user-management
 * @desc User management interface with search and filtering
 * @access Private (Admin only)
 */
router.get('/admin/user-management', requireUserCreationAccess, async (req, res) => {
   try {
      const user = req.session.user;
      const userType = req.session.userType;
      const userRole = user.role;

      const { page = 1, limit = 20, search, role, status, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      // Fetch users with pagination and filtering (placeholder implementation)
      const users = {
         data: [],
         pagination: {
            current: parseInt(page),
            total: 0,
            limit: parseInt(limit),
         },
      };

      res.render('pages/admin/user-management', {
         title: 'User Management',
         description: 'Manage user accounts, roles, and permissions',
         user: user,
         tenant: req.tenant || null,
         userType: userType,
         userRole: userRole,
         permissions: req.userPermissions,
         currentPath: '/admin/user-management',
         users: users.data,
         pagination: users.pagination,
         filters: { search, role, status, sortBy, sortOrder },
         layout: 'layout',
      });
   } catch (error) {
      logError(error, {
         context: 'admin/user-management GET',
         userId: req.session?.user?.id,
      });
      req.flash('error', 'Unable to load user management page');
      res.redirect('/dashboard');
   }
});

/**
 * @route POST /api/admin/users/bulk/validate
 * @desc Validate bulk user data from CSV
 * @access Private (Admin only with bulk permissions)
 */
router.post('/api/admin/users/bulk/validate', requireUserCreationAccess, async (req, res) => {
   try {
      const user = req.session.user;
      const userRole = user.role;
      const { data } = req.body;

      // Check bulk import permission
      const canBulkImport = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'].includes(userRole);
      if (!canBulkImport) {
         return res.status(403).json({
            error: "You don't have permission for bulk imports",
         });
      }

      if (!data || !Array.isArray(data)) {
         return res.status(400).json({
            error: 'Invalid data format. Expected array of user objects.',
         });
      }

      if (data.length === 0) {
         return res.status(400).json({
            error: 'No data provided for validation.',
         });
      }

      if (data.length > 1000) {
         return res.status(400).json({
            error: 'Maximum 1000 records allowed per import.',
         });
      }

      // Get allowed user types for this admin
      const permissions = req.userPermissions;
      const allowedTypes = permissions.allowedUserTypes || [];

      const validationResults = await validateBulkUserData(data, allowedTypes);

      res.json(validationResults);
   } catch (error) {
      logError(error, {
         context: 'POST /api/admin/users/bulk/validate',
         userId: req.session?.user?.id,
      });
      res.status(500).json({
         error: 'Failed to validate bulk data',
      });
   }
});

/**
 * @route POST /api/admin/users/bulk/import
 * @desc Import bulk users from validated CSV data
 * @access Private (Admin only with bulk permissions)
 */
router.post('/api/admin/users/bulk/import', requireUserCreationAccess, async (req, res) => {
   try {
      const user = req.session.user;
      const userType = req.session.userType;
      const userRole = user.role;
      const tenantCode = req.session.tenantCode;
      const { data, validationResults } = req.body;

      // Check bulk import permission
      const canBulkImport = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN'].includes(userRole);
      if (!canBulkImport) {
         return res.status(403).json({
            error: "You don't have permission for bulk imports",
         });
      }

      // Set up streaming response
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Process bulk import with streaming progress updates
      await processBulkUserImport(data, validationResults, {
         user,
         userType,
         userRole,
         tenantCode,
         permissions: req.userPermissions,
         progressCallback: (progress) => {
            res.write(JSON.stringify(progress) + '\n');
         },
      });

      res.end();
   } catch (error) {
      logError(error, {
         context: 'POST /api/admin/users/bulk/import',
         userId: req.session?.user?.id,
      });

      if (!res.headersSent) {
         res.status(500).json({
            error: 'Failed to import bulk users',
         });
      }
   }
});

/**
 * Validate bulk user data
 */
async function validateBulkUserData(data, allowedUserTypes) {
   const valid = [];
   const invalid = [];
   const duplicateEmails = new Set();
   const seenEmails = new Set();

   // Required fields
   const requiredFields = ['email', 'fullName', 'userType'];

   // Valid user types
   const validUserTypes = ['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'PARENT', 'STUDENT'];

   // Valid genders
   const validGenders = ['MALE', 'FEMALE', 'OTHER'];

   data.forEach((row, index) => {
      const rowNumber = index + 2; // Account for header row
      const errors = [];

      // Check required fields
      requiredFields.forEach((field) => {
         if (!row[field] || row[field].trim() === '') {
            errors.push(`${field} is required`);
         }
      });

      // Validate email format
      if (row.email) {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(row.email)) {
            errors.push('Invalid email format');
         }

         // Check for duplicates within the dataset
         if (seenEmails.has(row.email.toLowerCase())) {
            duplicateEmails.add(row.email.toLowerCase());
            errors.push('Duplicate email in dataset');
         } else {
            seenEmails.add(row.email.toLowerCase());
         }
      }

      // Validate user type
      if (row.userType && !validUserTypes.includes(row.userType.toUpperCase())) {
         errors.push(`Invalid user type: ${row.userType}. Valid types: ${validUserTypes.join(', ')}`);
      }

      // Check permission to create this user type
      if (row.userType && !allowedUserTypes.includes(row.userType.toUpperCase())) {
         errors.push(`You don't have permission to create users of type: ${row.userType}`);
      }

      // Validate phone number format if provided
      if (row.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(row.phoneNumber)) {
         errors.push('Invalid phone number format');
      }

      // Validate date format if provided
      if (row.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(row.dateOfBirth)) {
         errors.push('Invalid date format. Use YYYY-MM-DD');
      }

      // Validate gender if provided
      if (row.gender && !validGenders.includes(row.gender.toUpperCase())) {
         errors.push(`Invalid gender. Valid values: ${validGenders.join(', ')}`);
      }

      const rowData = {
         row: rowNumber,
         email: row.email,
         fullName: row.fullName,
         userType: row.userType,
         phoneNumber: row.phoneNumber,
         dateOfBirth: row.dateOfBirth,
         gender: row.gender,
         address: row.address,
      };

      if (errors.length === 0) {
         valid.push(rowData);
      } else {
         invalid.push({
            ...rowData,
            errors: errors,
         });
      }
   });

   // Create preview (first 10 rows)
   const preview = data.slice(0, 10).map((row, index) => ({
      row: index + 2,
      email: row.email || '',
      fullName: row.fullName || '',
      userType: row.userType || '',
   }));

   return {
      valid,
      invalid,
      summary: {
         totalCount: data.length,
         validCount: valid.length,
         invalidCount: invalid.length,
         duplicateCount: duplicateEmails.size,
      },
      preview,
   };
}

/**
 * Process bulk user import with streaming progress
 */
async function processBulkUserImport(data, validationResults, options) {
   const { user, userType, userRole, tenantCode, permissions, progressCallback } = options;
   const PasswordGenerator = require('../utils/passwordGenerator');
   const emailService = require('../services/emailService');

   let current = 0;
   let successful = 0;
   let failed = 0;
   const errors = [];

   // Only process valid records
   const validRecords = validationResults.valid;

   for (const record of validRecords) {
      current++;

      try {
         // Generate password
         const password = PasswordGenerator.generateTemporaryPassword();

         // Prepare user data
         const userData = {
            email: record.email.toLowerCase(),
            fullName: record.fullName,
            userType: record.userType,
            phoneNumber: record.phoneNumber,
            dateOfBirth: record.dateOfBirth,
            gender: record.gender,
            address: record.address,
            password: password,
            createdBy: user.id,
            tenantCode: userType === 'system' ? null : tenantCode,
         };

         // Create user (placeholder - would need actual implementation)
         const newUserId = await createUserAccount(userData, userType, tenantCode);

         // Send welcome email
         try {
            await emailService.sendWelcomeEmail({ ...userData, id: newUserId }, password, options.tenant);
         } catch (emailError) {
            logError(emailError, {
               context: 'Bulk import welcome email',
               userId: newUserId,
            });
         }

         successful++;

         // Send progress update
         progressCallback({
            type: 'progress',
            current,
            total: validRecords.length,
            successful,
            failed,
         });
      } catch (error) {
         failed++;
         errors.push({
            type: 'error',
            row: record.row,
            email: record.email,
            message: error.message,
         });

         logError(error, {
            context: 'Bulk import user creation',
            row: record.row,
            email: record.email,
         });

         // Send progress update
         progressCallback({
            type: 'progress',
            current,
            total: validRecords.length,
            successful,
            failed,
         });
      }
   }

   // Send completion message
   progressCallback({
      type: 'complete',
      successful,
      failed,
      errors,
   });

   logSystem('Bulk user import completed', {
      total: validRecords.length,
      successful,
      failed,
      importedBy: user.id,
      tenantCode,
   });
}

/**
 * Create user account (placeholder implementation)
 */
async function createUserAccount(userData, userType, tenantCode) {
   // This would integrate with the actual user creation services
   // For now, return a mock ID
   return Math.floor(Math.random() * 10000);
}

/**
 * Helper function to generate secure password
 */
function generateSecurePassword(length = 12) {
   const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
   let password = '';

   // Ensure at least one character from each required type
   const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   const lowercase = 'abcdefghijklmnopqrstuvwxyz';
   const numbers = '0123456789';
   const symbols = '!@#$%^&*';

   password += uppercase[Math.floor(Math.random() * uppercase.length)];
   password += lowercase[Math.floor(Math.random() * lowercase.length)];
   password += numbers[Math.floor(Math.random() * numbers.length)];
   password += symbols[Math.floor(Math.random() * symbols.length)];

   // Fill the rest randomly
   for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
   }

   // Shuffle the password
   return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
}

/**
 * @route GET /api/admin/users/search
 * @desc Search and filter users with pagination
 * @access Admin
 */
router.get('/api/admin/users/search', requireUserCreationAccess, async (req, res) => {
   try {
      const {
         q = '',
         role = '',
         status = '',
         page = 1,
         limit = 10,
         sortBy = 'created_at',
         sortOrder = 'desc',
      } = req.query;

      // Get user creation permissions
      const permissions = await getUserCreationPermissions(req.session.user);
      const allowedUserTypes = permissions.allowedUserTypes;

      // Build search conditions
      const searchConditions = [];
      const searchParams = [];

      // Text search across name and email
      if (q.trim()) {
         searchConditions.push('(full_name LIKE ? OR email LIKE ?)');
         searchParams.push(`%${q}%`, `%${q}%`);
      }

      // Role filter
      if (role && allowedUserTypes.includes(role.toUpperCase())) {
         searchConditions.push('role = ?');
         searchParams.push(role.toUpperCase());
      }

      // Status filter
      if (status) {
         searchConditions.push('status = ?');
         searchParams.push(status);
      }

      // Only show users that the current user can manage
      if (allowedUserTypes.length < 7) {
         // Not system admin
         const roleConditions = allowedUserTypes.map(() => '?').join(',');
         searchConditions.push(`role IN (${roleConditions})`);
         searchParams.push(...allowedUserTypes);
      }

      // Build final query
      const whereClause = searchConditions.length > 0 ? 'WHERE ' + searchConditions.join(' AND ') : '';

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const validSortFields = ['full_name', 'email', 'role', 'status', 'created_at', 'last_login'];
      const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Get total count
      const countQuery = `
         SELECT COUNT(*) as total
         FROM system_users
         ${whereClause}
      `;

      const [countResult] = await req.systemDB.execute(countQuery, searchParams);
      const totalUsers = countResult[0].total;

      // Get users with pagination
      const usersQuery = `
         SELECT 
            id,
            email,
            full_name,
            role,
            status,
            phone_number,
            date_of_birth,
            gender,
            created_at,
            updated_at,
            last_login,
            profile_picture,
            is_email_verified
         FROM system_users
         ${whereClause}
         ORDER BY ${safeSortBy} ${safeSortOrder}
         LIMIT ${parseInt(limit)} OFFSET ${offset}
      `;

      const [users] = await req.systemDB.execute(usersQuery, searchParams);

      // Calculate pagination info
      const totalPages = Math.ceil(totalUsers / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
         success: true,
         users: users.map((user) => ({
            ...user,
            // Don't expose sensitive fields
            password: undefined,
            password_reset_token: undefined,
            password_reset_expires: undefined,
         })),
         pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers,
            limit: parseInt(limit),
            hasNextPage,
            hasPrevPage,
         },
         filters: {
            q,
            role,
            status,
            sortBy: safeSortBy,
            sortOrder: safeSortOrder,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'GET /api/admin/users/search',
         userId: req.session.user?.id,
         query: req.query,
      });

      res.status(500).json({
         success: false,
         error: 'Failed to search users',
      });
   }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user information
 * @access Admin
 */
router.put('/api/admin/users/:id', requireUserCreationAccess, async (req, res) => {
   try {
      const userId = parseInt(req.params.id);
      const { fullName, email, phoneNumber, dateOfBirth, gender, status, role } = req.body;

      // Get user creation permissions
      const permissions = await getUserCreationPermissions(req.session.user);
      const allowedUserTypes = permissions.allowedUserTypes;

      // Check if user exists and if current user can manage it
      const [existingUsers] = await req.systemDB.execute('SELECT id, role, email FROM system_users WHERE id = ?', [
         userId,
      ]);

      if (existingUsers.length === 0) {
         return res.status(404).json({
            success: false,
            error: 'User not found',
         });
      }

      const existingUser = existingUsers[0];

      // Check permission to manage this user type
      if (!allowedUserTypes.includes(existingUser.role)) {
         return res.status(403).json({
            success: false,
            error: "You don't have permission to modify this user",
         });
      }

      // If role is being changed, check permission for new role
      if (role && role !== existingUser.role && !allowedUserTypes.includes(role.toUpperCase())) {
         return res.status(403).json({
            success: false,
            error: "You don't have permission to assign this role",
         });
      }

      // Validate email uniqueness if email is being changed
      if (email && email !== existingUser.email) {
         const [emailCheck] = await req.systemDB.execute('SELECT id FROM system_users WHERE email = ? AND id != ?', [
            email,
            userId,
         ]);

         if (emailCheck.length > 0) {
            return res.status(400).json({
               success: false,
               error: 'Email already exists',
            });
         }
      }

      // Build update query
      const updateFields = [];
      const updateParams = [];

      if (fullName !== undefined) {
         updateFields.push('full_name = ?');
         updateParams.push(fullName);
      }

      if (email !== undefined) {
         updateFields.push('email = ?');
         updateParams.push(email);
      }

      if (phoneNumber !== undefined) {
         updateFields.push('phone_number = ?');
         updateParams.push(phoneNumber);
      }

      if (dateOfBirth !== undefined) {
         updateFields.push('date_of_birth = ?');
         updateParams.push(dateOfBirth);
      }

      if (gender !== undefined) {
         updateFields.push('gender = ?');
         updateParams.push(gender);
      }

      if (status !== undefined) {
         updateFields.push('status = ?');
         updateParams.push(status);
      }

      if (role !== undefined) {
         updateFields.push('role = ?');
         updateParams.push(role.toUpperCase());
      }

      updateFields.push('updated_at = NOW()');
      updateParams.push(userId);

      const updateQuery = `
         UPDATE system_users 
         SET ${updateFields.join(', ')}
         WHERE id = ?
      `;

      await req.systemDB.execute(updateQuery, updateParams);

      // Get updated user
      const [updatedUsers] = await req.systemDB.execute(
         `SELECT 
            id, email, full_name, role, status, phone_number, 
            date_of_birth, gender, created_at, updated_at, last_login
          FROM system_users 
          WHERE id = ?`,
         [userId]
      );

      logSystem('User updated successfully', {
         userId,
         updatedBy: req.session.user.id,
         changes: req.body,
      });

      res.json({
         success: true,
         message: 'User updated successfully',
         user: updatedUsers[0],
      });
   } catch (error) {
      logError(error, {
         context: 'PUT /api/admin/users/:id',
         userId: req.session.user?.id,
         targetUserId: req.params.id,
         body: req.body,
      });

      res.status(500).json({
         success: false,
         error: 'Failed to update user',
      });
   }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete or deactivate user
 * @access Admin
 */
router.delete('/api/admin/users/:id', requireUserCreationAccess, async (req, res) => {
   try {
      const userId = parseInt(req.params.id);
      const { permanent = false } = req.query;

      // Get user creation permissions
      const permissions = await getUserCreationPermissions(req.session.user);
      const allowedUserTypes = permissions.allowedUserTypes;

      // Check if user exists and if current user can manage it
      const [existingUsers] = await req.systemDB.execute(
         'SELECT id, role, email, full_name FROM system_users WHERE id = ?',
         [userId]
      );

      if (existingUsers.length === 0) {
         return res.status(404).json({
            success: false,
            error: 'User not found',
         });
      }

      const existingUser = existingUsers[0];

      // Check permission to manage this user type
      if (!allowedUserTypes.includes(existingUser.role)) {
         return res.status(403).json({
            success: false,
            error: "You don't have permission to delete this user",
         });
      }

      // Prevent self-deletion
      if (userId === req.session.user.id) {
         return res.status(400).json({
            success: false,
            error: 'You cannot delete your own account',
         });
      }

      if (permanent === 'true') {
         // Permanent deletion (dangerous - should be restricted to system admins)
         if (req.session.user.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({
               success: false,
               error: 'Only system administrators can permanently delete users',
            });
         }

         await req.systemDB.execute('DELETE FROM system_users WHERE id = ?', [userId]);

         logSystem('User permanently deleted', {
            deletedUserId: userId,
            deletedUserEmail: existingUser.email,
            deletedBy: req.session.user.id,
         });

         res.json({
            success: true,
            message: 'User permanently deleted',
         });
      } else {
         // Soft deletion (deactivation)
         await req.systemDB.execute('UPDATE system_users SET status = ?, updated_at = NOW() WHERE id = ?', [
            'INACTIVE',
            userId,
         ]);

         logSystem('User deactivated', {
            deactivatedUserId: userId,
            deactivatedUserEmail: existingUser.email,
            deactivatedBy: req.session.user.id,
         });

         res.json({
            success: true,
            message: 'User deactivated successfully',
         });
      }
   } catch (error) {
      logError(error, {
         context: 'DELETE /api/admin/users/:id',
         userId: req.session.user?.id,
         targetUserId: req.params.id,
      });

      res.status(500).json({
         success: false,
         error: 'Failed to delete user',
      });
   }
});

/**
 * @route POST /api/admin/users/:id/reset-password
 * @desc Reset user password
 * @access Admin
 */
router.post('/api/admin/users/:id/reset-password', requireUserCreationAccess, async (req, res) => {
   try {
      const userId = parseInt(req.params.id);
      const { sendEmail = true } = req.body;

      // Get user creation permissions
      const permissions = await getUserCreationPermissions(req.session.user);
      const allowedUserTypes = permissions.allowedUserTypes;

      // Check if user exists and if current user can manage it
      const [existingUsers] = await req.systemDB.execute(
         'SELECT id, role, email, full_name FROM system_users WHERE id = ?',
         [userId]
      );

      if (existingUsers.length === 0) {
         return res.status(404).json({
            success: false,
            error: 'User not found',
         });
      }

      const existingUser = existingUsers[0];

      // Check permission to manage this user type
      if (!allowedUserTypes.includes(existingUser.role)) {
         return res.status(403).json({
            success: false,
            error: "You don't have permission to reset this user's password",
         });
      }

      // Generate new temporary password
      const PasswordGenerator = require('../utils/passwordGenerator');
      const newPassword = PasswordGenerator.generateTemporaryPassword();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await req.systemDB.execute('UPDATE system_users SET password = ?, updated_at = NOW() WHERE id = ?', [
         hashedPassword,
         userId,
      ]);

      // Send email if requested
      let emailResult = null;
      if (sendEmail) {
         const emailService = require('../services/emailService');
         emailResult = await emailService.sendPasswordResetEmail(existingUser, newPassword);
      }

      logSystem('User password reset by admin', {
         resetUserId: userId,
         resetUserEmail: existingUser.email,
         resetBy: req.session.user.id,
         emailSent: sendEmail,
      });

      res.json({
         success: true,
         message: 'Password reset successfully',
         newPassword: sendEmail ? undefined : newPassword, // Only return password if not emailing
         emailSent: sendEmail,
         emailResult,
      });
   } catch (error) {
      logError(error, {
         context: 'POST /api/admin/users/:id/reset-password',
         userId: req.session.user?.id,
         targetUserId: req.params.id,
      });

      res.status(500).json({
         success: false,
         error: 'Failed to reset user password',
      });
   }
});

/**
 * @route GET /api/admin/users/export
 * @desc Export users data to CSV
 * @access Admin
 */
router.get('/api/admin/users/export', requireUserCreationAccess, async (req, res) => {
   try {
      const { format = 'csv', role = '', status = '' } = req.query;

      // Get user creation permissions
      const permissions = await getUserCreationPermissions(req.session.user);
      const allowedUserTypes = permissions.allowedUserTypes;

      // Build query conditions
      const conditions = [];
      const params = [];

      if (role && allowedUserTypes.includes(role.toUpperCase())) {
         conditions.push('role = ?');
         params.push(role.toUpperCase());
      }

      if (status) {
         conditions.push('status = ?');
         params.push(status);
      }

      // Only show users that the current user can manage
      if (allowedUserTypes.length < 7) {
         const roleConditions = allowedUserTypes.map(() => '?').join(',');
         conditions.push(`role IN (${roleConditions})`);
         params.push(...allowedUserTypes);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Get users data
      const [users] = await req.systemDB.execute(
         `
         SELECT 
            id,
            email,
            full_name,
            role,
            status,
            phone_number,
            date_of_birth,
            gender,
            created_at,
            last_login,
            is_email_verified
         FROM system_users
         ${whereClause}
         ORDER BY created_at DESC
      `,
         params
      );

      if (format === 'csv') {
         // Generate CSV
         const csvHeaders = [
            'ID',
            'Email',
            'Full Name',
            'Role',
            'Status',
            'Phone Number',
            'Date of Birth',
            'Gender',
            'Created At',
            'Last Login',
            'Email Verified',
         ];

         const csvRows = users.map((user) => [
            user.id,
            user.email,
            user.full_name,
            user.role,
            user.status,
            user.phone_number || '',
            user.date_of_birth || '',
            user.gender || '',
            user.created_at,
            user.last_login || '',
            user.is_email_verified ? 'Yes' : 'No',
         ]);

         const csvContent = [csvHeaders, ...csvRows]
            .map((row) => row.map((field) => `"${field}"`).join(','))
            .join('\n');

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`
         );
         res.send(csvContent);
      } else {
         // Return JSON
         res.json({
            success: true,
            users,
            exportedAt: new Date().toISOString(),
            totalRecords: users.length,
         });
      }

      logSystem('Users data exported', {
         exportedBy: req.session.user.id,
         format,
         recordCount: users.length,
         filters: { role, status },
      });
   } catch (error) {
      logError(error, {
         context: 'GET /api/admin/users/export',
         userId: req.session.user?.id,
         query: req.query,
      });

      res.status(500).json({
         success: false,
         error: 'Failed to export users data',
      });
   }
});

/**
 * @route GET /api/admin/users/:id/profile
 * @desc Get user profile details
 * @access Admin
 */
router.get('/api/admin/users/:id/profile', requireUserCreationAccess, async (req, res) => {
   try {
      const userId = parseInt(req.params.id);

      const UserProfileService = require('../services/userProfileService');
      const profileService = new UserProfileService(req.systemDB);

      // Get user creation permissions to check access
      const permissions = await getUserCreationPermissions(req.session.user);

      // Get user profile
      const userProfile = await profileService.getUserProfile(userId);

      if (!userProfile) {
         return res.status(404).json({
            success: false,
            error: 'User not found',
         });
      }

      // Check permission to view this user
      if (!permissions.allowedUserTypes.includes(userProfile.role)) {
         return res.status(403).json({
            success: false,
            error: "You don't have permission to view this user's profile",
         });
      }

      res.json({
         success: true,
         profile: {
            ...userProfile,
            // Don't expose sensitive data
            password: undefined,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'GET /api/admin/users/:id/profile',
         userId: req.session.user?.id,
         targetUserId: req.params.id,
      });

      res.status(500).json({
         success: false,
         error: 'Failed to fetch user profile',
      });
   }
});

/**
 * @route PUT /api/admin/users/:id/profile
 * @desc Update user profile
 * @access Admin
 */
router.put('/api/admin/users/:id/profile', requireUserCreationAccess, async (req, res) => {
   try {
      const userId = parseInt(req.params.id);
      const profileData = req.body;

      const UserProfileService = require('../services/userProfileService');
      const profileService = new UserProfileService(req.systemDB);

      // Get user creation permissions to check access
      const permissions = await getUserCreationPermissions(req.session.user);

      // Check if user exists
      const existingProfile = await profileService.getUserProfile(userId);
      if (!existingProfile) {
         return res.status(404).json({
            success: false,
            error: 'User not found',
         });
      }

      // Check permission to modify this user
      if (!permissions.allowedUserTypes.includes(existingProfile.role)) {
         return res.status(403).json({
            success: false,
            error: "You don't have permission to modify this user's profile",
         });
      }

      // Update profile
      const updatedProfile = await profileService.updateUserProfile(userId, profileData, req.session.user.id);

      res.json({
         success: true,
         message: 'Profile updated successfully',
         profile: {
            ...updatedProfile,
            password: undefined,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'PUT /api/admin/users/:id/profile',
         userId: req.session.user?.id,
         targetUserId: req.params.id,
         profileData: req.body,
      });

      res.status(500).json({
         success: false,
         error: error.message || 'Failed to update user profile',
      });
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
