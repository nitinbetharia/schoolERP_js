/**
 * Admin Routes - System Administration
 * System-level management for SYSTEM_ADMIN and GROUP_ADMIN
 */

const express = require('express');
const { requireAuth, requireSystemAccess } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

// Apply authentication and system access to all admin routes
router.use(requireAuth);
router.use(requireSystemAccess);

/**
 * GET /admin - System Admin Dashboard
 */
router.get('/', asyncHandler(async (req, res) => {
  res.redirect('/dashboard/system');
}));

/**
 * GET /admin/health - System Health Check
 */
router.get('/health', asyncHandler(async (req, res) => {
  // TODO: Implement comprehensive system health check
  res.render('admin/health', {
    title: 'System Health',
    pageHeader: {
      title: 'System Health Monitor',
      description: 'Monitor system performance and health'
    }
  });
}));

module.exports = router;