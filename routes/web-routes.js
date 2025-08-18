const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');
const logoHelper = require('../utils/logo-helper');
const dashboardService = require('../modules/dashboard/dashboard-service');
const systemDashboardService = require('../modules/dashboard/system-dashboard-service');
const { ICONS } = require('../config/icon-config');

// Middleware to ensure user is authenticated for web routes
const requireWebAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware to add common template variables
const addTemplateVars = (req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.userRole = req.session.userRole || null;
  res.locals.trustCode = req.trustCode || null;
  res.locals.currentPath = req.path;
  res.locals.appName = 'School ERP';
  res.locals.year = new Date().getFullYear();
  res.locals.logo = logoHelper.getLogoForTemplate(req);
  res.locals.icons = ICONS; // Add standardized icons
  next();
};

// Apply middleware to all routes
router.use(addTemplateVars);

// Public Routes (No authentication required)

// Landing page - redirect to login
router.get(
  '/',
  errorHandler.asyncHandler(async (req, res) => {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    // Redirect to login page instead of rendering landing
    res.redirect('/auth/login');
  })
);

// Login page
router.get(
  '/auth/login',
  errorHandler.asyncHandler(async (req, res) => {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }

    // Determine login type based on context
    const loginType = req.context?.isSystemContext ? 'SYSTEM' : 'TRUST';

    res.render('auth/login', {
      title: 'Login - School ERP',
      description: 'Sign in to access your School ERP account',
      loginType,
      hideNavigation: true,
      schools: [], // Will be populated for multi-school trusts
      trust: null, // Will be populated based on trust context
      trustContext: req.context || {},
      formData: { email: '' }, // No longer populate from URL
      isDevelopment: process.env.NODE_ENV !== 'production'
    });
  })
);

// Forgot password page
router.get(
  '/auth/forgot-password',
  errorHandler.asyncHandler(async (req, res) => {
    res.render('auth/forgot-password', {
      title: 'Forgot Password - School ERP',
      hideNavigation: true
    });
  })
);

// Reset password page
router.get(
  '/auth/reset-password/:token',
  errorHandler.asyncHandler(async (req, res) => {
    const { token } = req.params;

    res.render('auth/reset-password', {
      title: 'Reset Password - School ERP',
      hideNavigation: true,
      token
    });
  })
);

// Setup wizard pages (public for initial setup)
router.get(
  '/setup',
  errorHandler.asyncHandler(async (req, res) => {
    res.render('setup/wizard', {
      title: 'Setup Wizard - School ERP',
      hideNavigation: true
    });
  })
);

// Logout handler
router.post(
  '/auth/logout',
  errorHandler.asyncHandler(async (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.clearCookie('school_erp_session');
      // Create a new session for the flash message after logout
      req.session.regenerate(() => {
        req.flash('message', 'Logged out successfully');
        res.redirect('/auth/login');
      });
    });
  })
);

// Error Routes (must be BEFORE requireWebAuth)
router.get(
  '/error/403',
  errorHandler.asyncHandler(async (req, res) => {
    res.status(403).render('errors/403', {
      title: 'Access Denied - School ERP',
      hideNavigation: false
    });
  })
);

router.get(
  '/error/404',
  errorHandler.asyncHandler(async (req, res) => {
    res.status(404).render('errors/404', {
      title: 'Page Not Found - School ERP',
      hideNavigation: false
    });
  })
);

router.get(
  '/error/500',
  errorHandler.asyncHandler(async (req, res) => {
    res.status(500).render('errors/500', {
      title: 'Server Error - School ERP',
      hideNavigation: false,
      error: null // Explicitly set error to null for direct access
    });
  })
);

// Protected Web Routes (requires authentication)
router.use(requireWebAuth);

// Simple dashboard route without complex permission checks
router.get('/dashboard', async (req, res) => {
  try {
    const userRole = req.session.userRole;
    const userId = req.session.userId;
    const trustCode = req.trustCode || 'demo'; // Default to demo for development

    const userData = {
      id: userId,
      role: userRole,
      email: req.session.userEmail,
      name: req.session.userName || 'User',
      fullName: req.session.userFullName || req.session.userName || 'User'
    };

    // Get real stats using dashboard service
    let quickStats = {};

    try {
      quickStats = await dashboardService.getRealDashboardStats(
        userRole,
        trustCode,
        userId,
        req.session.schoolId
      );
    } catch (error) {
      console.error('Failed to get real dashboard stats:', error);
      // Fallback to basic stats
      quickStats = dashboardService.getFallbackStats(userRole);
    }

    res.render('dashboard/index', {
      title:
        userRole === 'SUPER_ADMIN' || userRole === 'SYSTEM_ADMIN'
          ? 'System Dashboard - School ERP'
          : 'Dashboard - School ERP',
      userRole: userRole,
      userData: userData,
      user: userData, // For navigation compatibility
      quickStats: quickStats,
      icons: ICONS, // Pass standardized icons to template
      pageScript: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard/index', {
      title: 'Dashboard - School ERP',
      userRole: req.session.userRole || 'USER',
      userData: { name: 'User', fullName: 'User' },
      user: { fullName: 'User' },
      quickStats: {},
      icons: ICONS,
      pageScript: 'dashboard'
    });
  }
});

// Set user object from session for compatibility with permission middleware
router.use((req, res, next) => {
  if (req.session.userId) {
    req.user = {
      id: req.session.userId,
      role: req.session.userRole,
      type: req.session.loginType || 'SYSTEM_USER',
      trustCode: req.session.trustCode || null,
      schoolId: req.session.schoolId || null
    };
  }
  next();
});

// User Management
router.get(
  '/users',
  authMiddleware.requirePermission('users', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('users/index', {
      title: 'User Management - School ERP',
      pageScript: 'users'
    });
  })
);

router.get(
  '/users/create',
  authMiddleware.requirePermission('users', 'create'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('users/create', {
      title: 'Create User - School ERP',
      pageScript: 'users/form'
    });
  })
);

router.get(
  '/users/:userId/edit',
  authMiddleware.requirePermission('users', 'update'),
  errorHandler.asyncHandler(async (req, res) => {
    const { userId } = req.params;

    res.render('users/edit', {
      title: 'Edit User - School ERP',
      userId,
      pageScript: 'users/form'
    });
  })
);

router.get(
  '/users/:userId/view',
  authMiddleware.requirePermission('users', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    const { userId } = req.params;

    res.render('users/view', {
      title: 'View User - School ERP',
      userId,
      pageScript: 'users/view'
    });
  })
);

// Student Management
router.get(
  '/students',
  authMiddleware.requirePermission('students', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('students/index', {
      title: 'Student Management - School ERP',
      pageScript: 'students'
    });
  })
);

router.get(
  '/students/admissions',
  authMiddleware.requirePermission('students', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('students/admissions', {
      title: 'Student Admissions - School ERP',
      pageScript: 'students/admissions'
    });
  })
);

router.get(
  '/students/create',
  authMiddleware.requirePermission('students', 'create'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('students/create', {
      title: 'Add Student - School ERP',
      pageScript: 'students/form'
    });
  })
);

router.get(
  '/students/:studentId/edit',
  authMiddleware.requirePermission('students', 'update'),
  errorHandler.asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    res.render('students/edit', {
      title: 'Edit Student - School ERP',
      studentId,
      pageScript: 'students/form'
    });
  })
);

router.get(
  '/students/:studentId/view',
  authMiddleware.requirePermission('students', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    res.render('students/view', {
      title: 'Student Profile - School ERP',
      studentId,
      pageScript: 'students/view'
    });
  })
);

// Fee Management
router.get(
  '/fees',
  authMiddleware.requirePermission('fees', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('fees/index', {
      title: 'Fee Management - School ERP',
      pageScript: 'fees'
    });
  })
);

router.get(
  '/fees/structures',
  authMiddleware.requirePermission('fees', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('fees/structures', {
      title: 'Fee Structures - School ERP',
      pageScript: 'fees/structures'
    });
  })
);

router.get(
  '/fees/collection',
  authMiddleware.requirePermission('fees', 'create'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('fees/collection', {
      title: 'Fee Collection - School ERP',
      pageScript: 'fees/collection'
    });
  })
);

router.get(
  '/fees/receipts',
  authMiddleware.requirePermission('fees', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('fees/receipts', {
      title: 'Fee Receipts - School ERP',
      pageScript: 'fees/receipts'
    });
  })
);

// Attendance Management
router.get(
  '/attendance',
  authMiddleware.requirePermission('attendance', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('attendance/index', {
      title: 'Attendance Management - School ERP',
      pageScript: 'attendance'
    });
  })
);

router.get(
  '/attendance/mark',
  authMiddleware.requirePermission('attendance', 'create'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('attendance/mark', {
      title: 'Mark Attendance - School ERP',
      pageScript: 'attendance/mark'
    });
  })
);

router.get(
  '/attendance/reports',
  authMiddleware.requirePermission('attendance', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('attendance/reports', {
      title: 'Attendance Reports - School ERP',
      pageScript: 'attendance/reports'
    });
  })
);

router.get(
  '/attendance/leave',
  authMiddleware.requirePermission('leave', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('attendance/leave', {
      title: 'Leave Management - School ERP',
      pageScript: 'attendance/leave'
    });
  })
);

// Reports
router.get(
  '/reports',
  authMiddleware.requirePermission('reports', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('reports/index', {
      title: 'Reports - School ERP',
      pageScript: 'reports'
    });
  })
);

router.get(
  '/reports/builder',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'create'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('reports/builder', {
      title: 'Report Builder - School ERP',
      pageScript: 'reports/builder'
    });
  })
);

// Communication
router.get(
  '/communication',
  authMiddleware.requirePermission('communication', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/index', {
      title: 'Communication - School ERP',
      pageScript: 'communication'
    });
  })
);

router.get(
  '/communication/messages',
  authMiddleware.requirePermission('communication', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/messages', {
      title: 'Messages - School ERP',
      pageScript: 'communication/messages'
    });
  })
);

router.get(
  '/communication/compose',
  authMiddleware.requirePermission('communication', 'create'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/compose', {
      title: 'Compose Message - School ERP',
      pageScript: 'communication/compose'
    });
  })
);

router.get(
  '/communication/templates',
  authMiddleware.requirePermission('communication', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/templates', {
      title: 'Message Templates - School ERP',
      pageScript: 'communication/templates'
    });
  })
);

// System Admin Dashboard (System admins only)
router.get(
  '/admin/dashboard',
  authMiddleware.requireRole(['SYSTEM_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/dashboard', {
      title: 'System Dashboard - School ERP',
      pageScript: 'admin/dashboard'
    });
  })
);

// Setup and Configuration (Admin only)
router.get(
  '/admin/setup',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/setup', {
      title: 'System Setup - School ERP',
      pageScript: 'admin/setup'
    });
  })
);

router.get(
  '/admin/schools',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/schools', {
      title: 'School Management - School ERP',
      pageScript: 'admin/schools'
    });
  })
);

router.get(
  '/admin/settings',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/settings', {
      title: 'System Settings - School ERP',
      pageScript: 'admin/settings'
    });
  })
);

// System Health Monitoring
router.get(
  '/admin/system-health',
  authMiddleware.requireRole(['SYSTEM_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/system-health', {
      title: 'System Health - School ERP',
      pageScript: 'admin/system-health'
    });
  })
);

// Reports
router.get(
  '/admin/reports',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/reports', {
      title: 'System Reports - School ERP',
      pageScript: 'admin/reports'
    });
  })
);

// Communication Management
router.get(
  '/admin/communication',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/communication', {
      title: 'Communication Management - School ERP',
      pageScript: 'admin/communication'
    });
  })
);

// Backup Management
router.get(
  '/admin/backup',
  authMiddleware.requireRole(['SYSTEM_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/backup', {
      title: 'Backup Management - School ERP',
      pageScript: 'admin/backup'
    });
  })
);

// Audit Logs
router.get(
  '/admin/audit-logs',
  authMiddleware.requireRole(['SYSTEM_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('admin/audit-logs', {
      title: 'Audit Logs - School ERP',
      pageScript: 'admin/audit-logs'
    });
  })
);

// Profile Management
router.get(
  '/profile',
  errorHandler.asyncHandler(async (req, res) => {
    res.render('profile/index', {
      title: 'My Profile - School ERP',
      pageScript: 'profile'
    });
  })
);

router.get(
  '/profile/edit',
  errorHandler.asyncHandler(async (req, res) => {
    res.render('profile/edit', {
      title: 'Edit Profile - School ERP',
      pageScript: 'profile/edit'
    });
  })
);

// Parent Portal (for parents)
router.get(
  '/parent/children',
  authMiddleware.requireRole(['PARENT']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('parent/children', {
      title: 'My Children - School ERP',
      pageScript: 'parent/children'
    });
  })
);

router.get(
  '/parent/fees',
  authMiddleware.requireRole(['PARENT']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('parent/fees', {
      title: 'Fee Status - School ERP',
      pageScript: 'parent/fees'
    });
  })
);

router.get(
  '/parent/attendance',
  authMiddleware.requireRole(['PARENT']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('parent/attendance', {
      title: 'Attendance Report - School ERP',
      pageScript: 'parent/attendance'
    });
  })
);

// Logout route
router.post(
  '/logout',
  errorHandler.asyncHandler(async (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.clearCookie('school_erp_session');
      // Create a new session for the flash message after logout
      req.session.regenerate(() => {
        req.flash('message', 'Logged out successfully');
        res.redirect('/auth/login');
      });
    });
  })
);

// Communication Routes
// Communication Setup
router.get(
  '/communication/setup',
  requireWebAuth,
  authMiddleware.requireRole(['admin', 'super_admin']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/setup', {
      title: 'Communication Setup - School ERP',
      pageTitle: 'Communication Setup'
    });
  })
);

// Communication Templates
router.get(
  '/communication/templates',
  requireWebAuth,
  authMiddleware.requireRole(['admin', 'super_admin']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/templates', {
      title: 'Communication Templates - School ERP',
      pageTitle: 'Communication Templates'
    });
  })
);

// Bulk Communication
router.get(
  '/communication/bulk-send',
  requireWebAuth,
  authMiddleware.requireRole(['admin', 'super_admin', 'staff']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/bulk-send', {
      title: 'Bulk Communication - School ERP',
      pageTitle: 'Bulk Communication'
    });
  })
);

// Communication Analytics
router.get(
  '/communication/analytics',
  requireWebAuth,
  authMiddleware.requireRole(['admin', 'super_admin']),
  errorHandler.asyncHandler(async (req, res) => {
    res.render('communication/analytics', {
      title: 'Communication Analytics - School ERP',
      pageTitle: 'Communication Analytics'
    });
  })
);

// Health check for web interface
router.get(
  '/health-check',
  errorHandler.asyncHandler(async (req, res) => {
    res.render('health-check', {
      title: 'Health Check - School ERP',
      hideNavigation: true,
      timestamp: new Date().toISOString()
    });
  })
);

// Enhanced Reports Routes
router.use('/reports', requireWebAuth, require('./enhanced-reports-routes'));

module.exports = router;
