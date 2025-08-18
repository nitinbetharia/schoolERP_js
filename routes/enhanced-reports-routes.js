/**
 * Enhanced Reports Web Routes
 * Frontend interfaces for the advanced reporting framework
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth-middleware');

// Reports Dashboard
router.get('/', requireAuth, (req, res) => {
  res.render('reports/dashboard', {
    title: 'Reports Dashboard',
    currentPath: req.path,
    user: req.user,
    userRole: req.user.role,
    pageTitle: 'Enhanced Reporting Framework',
    breadcrumbs: [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Reports', url: '/reports' }
    ]
  });
});

// Report Builder
router.get(
  '/builder',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  (req, res) => {
    res.render('reports/builder', {
      title: 'Report Builder',
      currentPath: req.path,
      user: req.user,
      userRole: req.user.role,
      pageTitle: 'Custom Report Builder',
      breadcrumbs: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Reports', url: '/reports' },
        { name: 'Builder', url: '/reports/builder' }
      ]
    });
  }
);

// Report Templates
router.get('/templates', requireAuth, (req, res) => {
  res.render('reports/templates', {
    title: 'Report Templates',
    currentPath: req.path,
    user: req.user,
    userRole: req.user.role,
    pageTitle: 'Report Templates',
    breadcrumbs: [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Reports', url: '/reports' },
      { name: 'Templates', url: '/reports/templates' }
    ]
  });
});

// My Reports
router.get('/my-reports', requireAuth, (req, res) => {
  res.render('reports/my-reports', {
    title: 'My Reports',
    currentPath: req.path,
    user: req.user,
    userRole: req.user.role,
    pageTitle: 'My Reports',
    breadcrumbs: [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Reports', url: '/reports' },
      { name: 'My Reports', url: '/reports/my-reports' }
    ]
  });
});

// Scheduled Reports
router.get(
  '/schedules',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  (req, res) => {
    res.render('reports/schedules', {
      title: 'Scheduled Reports',
      currentPath: req.path,
      user: req.user,
      userRole: req.user.role,
      pageTitle: 'Scheduled Reports',
      breadcrumbs: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Reports', url: '/reports' },
        { name: 'Schedules', url: '/reports/schedules' }
      ]
    });
  }
);

// Analytics Dashboard
router.get(
  '/analytics',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  (req, res) => {
    res.render('reports/analytics', {
      title: 'Reports Analytics',
      currentPath: req.path,
      user: req.user,
      userRole: req.user.role,
      pageTitle: 'Reports Analytics',
      breadcrumbs: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Reports', url: '/reports' },
        { name: 'Analytics', url: '/reports/analytics' }
      ]
    });
  }
);

// View Specific Report
router.get('/view/:reportId', requireAuth, (req, res) => {
  const { reportId } = req.params;

  res.render('reports/view', {
    title: 'View Report',
    currentPath: req.path,
    user: req.user,
    userRole: req.user.role,
    reportId: reportId,
    pageTitle: 'Report Viewer',
    breadcrumbs: [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Reports', url: '/reports' },
      { name: 'View Report', url: `/reports/view/${reportId}` }
    ]
  });
});

// Edit Report
router.get(
  '/edit/:reportId',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  (req, res) => {
    const { reportId } = req.params;

    res.render('reports/edit', {
      title: 'Edit Report',
      currentPath: req.path,
      user: req.user,
      userRole: req.user.role,
      reportId: reportId,
      pageTitle: 'Edit Report',
      breadcrumbs: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Reports', url: '/reports' },
        { name: 'Edit Report', url: `/reports/edit/${reportId}` }
      ]
    });
  }
);

// Custom Dashboard Builder
router.get(
  '/dashboard-builder',
  requireAuth,
  requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  (req, res) => {
    res.render('reports/dashboard-builder', {
      title: 'Dashboard Builder',
      currentPath: req.path,
      user: req.user,
      userRole: req.user.role,
      pageTitle: 'Custom Dashboard Builder',
      breadcrumbs: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Reports', url: '/reports' },
        { name: 'Dashboard Builder', url: '/reports/dashboard-builder' }
      ]
    });
  }
);

module.exports = router;
