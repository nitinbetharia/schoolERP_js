/**
 * System Dashboard Routes
 * API endpoints for system administrator dashboard
 */

const express = require('express');
const router = express.Router();
const systemDashboardService = require('../modules/dashboard/system-dashboard-service');
const errorHandler = require('../middleware/error-handler');
const authMiddleware = require('../middleware/auth-middleware');

// Middleware to ensure system admin access
const requireSystemAdmin = (req, res, next) => {
  if (req.session.loginType !== 'SYSTEM' || req.session.userRole !== 'SYSTEM_ADMIN') {
    return res.error('Access denied. System admin privileges required.', 'ACCESS_DENIED', 403);
  }
  next();
};

// Get system-wide dashboard statistics
router.get('/stats',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const stats = await systemDashboardService.getSystemStats();
      
      res.success(stats, 'System dashboard stats retrieved successfully');
    } catch (error) {
      res.error(error.message, 'DASHBOARD_STATS_FAILED', 500);
    }
  })
);

// Get platform overview
router.get('/platform',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const platformStats = await systemDashboardService.getPlatformStats();
      
      res.success(platformStats, 'Platform stats retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PLATFORM_STATS_FAILED', 500);
    }
  })
);

// Get trust statistics
router.get('/trusts',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const trustStats = await systemDashboardService.getTrustStats();
      
      res.success(trustStats, 'Trust stats retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TRUST_STATS_FAILED', 500);
    }
  })
);

// Get available trusts for switching
router.get('/trusts/available',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const trusts = await systemDashboardService.getAvailableTrusts();
      
      res.success(trusts, 'Available trusts retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TRUSTS_LIST_FAILED', 500);
    }
  })
);

// Get user statistics
router.get('/users',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userStats = await systemDashboardService.getSystemUserStats();
      
      res.success(userStats, 'User stats retrieved successfully');
    } catch (error) {
      res.error(error.message, 'USER_STATS_FAILED', 500);
    }
  })
);

// Get activity metrics
router.get('/activity',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const activity = await systemDashboardService.getSystemActivity();
      
      res.success(activity, 'Activity metrics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ACTIVITY_STATS_FAILED', 500);
    }
  })
);

// Get growth metrics
router.get('/growth',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const growth = await systemDashboardService.getGrowthMetrics();
      
      res.success(growth, 'Growth metrics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'GROWTH_STATS_FAILED', 500);
    }
  })
);

// Get performance metrics
router.get('/performance',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const performance = await systemDashboardService.getPerformanceMetrics();
      
      res.success(performance, 'Performance metrics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PERFORMANCE_STATS_FAILED', 500);
    }
  })
);

// Get success metrics
router.get('/success',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const success = await systemDashboardService.getSuccessMetrics();
      
      res.success(success, 'Success metrics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SUCCESS_STATS_FAILED', 500);
    }
  })
);

// Switch to a specific trust context (for system admins)
router.post('/switch-trust',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { trustCode } = req.body;
      
      if (!trustCode) {
        return res.error('Trust code is required', 'MISSING_TRUST_CODE', 400);
      }
      
      // Update session to include trust context
      req.session.trustCode = trustCode;
      req.session.switchedToTrust = true;
      req.session.originalLoginType = 'SYSTEM';
      
      res.success({
        trustCode,
        message: `Switched to trust: ${trustCode}`,
        canSwitchBack: true
      }, 'Trust context switched successfully');
    } catch (error) {
      res.error(error.message, 'TRUST_SWITCH_FAILED', 500);
    }
  })
);

// Switch back to system admin view
router.post('/switch-back',
  requireSystemAdmin,
  errorHandler.asyncHandler(async (req, res) => {
    try {
      // Clear trust context and restore system admin view
      req.session.trustCode = null;
      req.session.switchedToTrust = false;
      
      res.success({
        message: 'Switched back to system admin view'
      }, 'Returned to system admin view successfully');
    } catch (error) {
      res.error(error.message, 'SWITCH_BACK_FAILED', 500);
    }
  })
);

module.exports = router;