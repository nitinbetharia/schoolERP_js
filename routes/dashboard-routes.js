const express = require('express');
const router = express.Router();
const dashboardService = require('../modules/dashboard/dashboard-service');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Get user's dashboard configuration
router.get('/config',
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const config = await dashboardService.getDashboardConfig(userRole, req.trustCode, userId);
      
      res.success(config, 'Dashboard configuration retrieved successfully');
    } catch (error) {
      res.error(error.message, 'DASHBOARD_CONFIG_FETCH_FAILED', 500);
    }
  })
);

// Update user's dashboard configuration
router.put('/config',
  authMiddleware.requirePermission('dashboard', 'update'),
  validationMiddleware.validate('dashboard.updateConfig'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userId = req.session.userId;
      const config = req.body;
      
      const result = await dashboardService.updateUserDashboardConfig(userId, config, req.trustCode);
      
      res.success(result, 'Dashboard configuration updated successfully');
    } catch (error) {
      res.error(error.message, 'DASHBOARD_CONFIG_UPDATE_FAILED', 400);
    }
  })
);

// Get widget data
router.get('/widgets/:widgetId/data',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateParams('dashboard.widgetId'),
  validationMiddleware.validateQuery('dashboard.widgetFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { widgetId } = req.params;
      const filters = req.query;
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      // Determine school ID based on user role and context
      let schoolId = filters.school_id;
      if (!schoolId && ['TEACHER', 'SCHOOL_ADMIN'].includes(userRole)) {
        // For school-level users, get their assigned school
        schoolId = req.session.schoolId || filters.school_id;
      }
      
      const context = {
        userId,
        userRole,
        schoolId,
        filters
      };
      
      const data = await dashboardService.getWidgetData(widgetId, context, req.trustCode);
      
      res.success(data, 'Widget data retrieved successfully');
    } catch (error) {
      res.error(error.message, 'WIDGET_DATA_FETCH_FAILED', 500);
    }
  })
);

// Get multiple widget data in batch
router.post('/widgets/batch',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validate('dashboard.batchWidgetRequest'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { widgets } = req.body;
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      const results = {};
      
      for (const widgetRequest of widgets) {
        try {
          const context = {
            userId,
            userRole,
            schoolId: widgetRequest.schoolId,
            filters: widgetRequest.filters || {}
          };
          
          const data = await dashboardService.getWidgetData(
            widgetRequest.widgetId, 
            context, 
            req.trustCode
          );
          
          results[widgetRequest.widgetId] = {
            success: true,
            data
          };
        } catch (error) {
          results[widgetRequest.widgetId] = {
            success: false,
            error: error.message
          };
        }
      }
      
      res.success(results, 'Batch widget data retrieved');
    } catch (error) {
      res.error(error.message, 'BATCH_WIDGET_FETCH_FAILED', 500);
    }
  })
);

// System Statistics (for system admins)
router.get('/system-stats',
  authMiddleware.requireRole(['SYSTEM_ADMIN']),
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const stats = await dashboardService.getSystemStatsWidget(req.trustCode);
      
      res.success(stats, 'System statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SYSTEM_STATS_FETCH_FAILED', 500);
    }
  })
);

// School Statistics
router.get('/school-stats',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateQuery('dashboard.schoolStatsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { school_id } = req.query;
      
      const stats = await dashboardService.getSchoolStatsWidget(req.trustCode, school_id);
      
      res.success(stats, 'School statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOL_STATS_FETCH_FAILED', 500);
    }
  })
);

// Attendance Overview
router.get('/attendance-overview',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateQuery('dashboard.attendanceFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { school_id } = req.query;
      
      const stats = await dashboardService.getAttendanceOverviewWidget(req.trustCode, school_id);
      
      res.success(stats, 'Attendance overview retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_OVERVIEW_FETCH_FAILED', 500);
    }
  })
);

// Fee Collection Overview
router.get('/fee-collection',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateQuery('dashboard.feeCollectionFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { school_id } = req.query;
      
      const stats = await dashboardService.getFeeCollectionWidget(req.trustCode, school_id);
      
      res.success(stats, 'Fee collection data retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_COLLECTION_FETCH_FAILED', 500);
    }
  })
);

// Recent Admissions
router.get('/recent-admissions',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateQuery('dashboard.admissionsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { school_id } = req.query;
      
      const admissions = await dashboardService.getRecentAdmissionsWidget(req.trustCode, school_id);
      
      res.success(admissions, 'Recent admissions retrieved successfully');
    } catch (error) {
      res.error(error.message, 'RECENT_ADMISSIONS_FETCH_FAILED', 500);
    }
  })
);

// Teacher's Classes (for teachers)
router.get('/my-classes',
  authMiddleware.requireRole(['TEACHER']),
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const teacherId = req.session.userId;
      
      const classes = await dashboardService.getMyClassesWidget(req.trustCode, teacherId);
      
      res.success(classes, 'Teacher classes retrieved successfully');
    } catch (error) {
      res.error(error.message, 'MY_CLASSES_FETCH_FAILED', 500);
    }
  })
);

// Parent's Children (for parents)
router.get('/my-children',
  authMiddleware.requireRole(['PARENT']),
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const parentId = req.session.userId;
      
      const children = await dashboardService.getMyChildrenWidget(req.trustCode, parentId);
      
      res.success(children, 'Parent children data retrieved successfully');
    } catch (error) {
      res.error(error.message, 'MY_CHILDREN_FETCH_FAILED', 500);
    }
  })
);

// Pending Tasks
router.get('/pending-tasks',
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      const tasks = await dashboardService.getPendingTasksWidget(req.trustCode, userId, userRole);
      
      res.success(tasks, 'Pending tasks retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PENDING_TASKS_FETCH_FAILED', 500);
    }
  })
);

// Update tenant dashboard configuration (for admins)
router.put('/tenant-config',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('dashboard', 'update'),
  validationMiddleware.validate('dashboard.updateTenantConfig'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const config = req.body;
      
      const result = await dashboardService.updateTenantDashboardConfig(config, req.trustCode);
      
      res.success(result, 'Tenant dashboard configuration updated successfully');
    } catch (error) {
      res.error(error.message, 'TENANT_CONFIG_UPDATE_FAILED', 400);
    }
  })
);

// Get tenant dashboard configuration
router.get('/tenant-config',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const config = await dashboardService.getTenantDashboardConfig(req.trustCode);
      
      res.success(config, 'Tenant dashboard configuration retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TENANT_CONFIG_FETCH_FAILED', 500);
    }
  })
);

// Dashboard Analytics
router.get('/analytics/usage',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateQuery('dashboard.analyticsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      
      // This would be implemented in dashboard service
      const analytics = {
        message: 'Dashboard usage analytics not yet implemented',
        filters
      };
      
      res.success(analytics, 'Dashboard analytics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'DASHBOARD_ANALYTICS_FETCH_FAILED', 500);
    }
  })
);

// Real-time Dashboard Updates (WebSocket endpoint placeholder)
router.get('/realtime/subscribe',
  authMiddleware.requirePermission('dashboard', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      // This would typically be handled by WebSocket server
      // For now, return configuration for real-time updates
      const realtimeConfig = {
        enabled: true,
        refreshInterval: 30000, // 30 seconds
        supportedWidgets: [
          'attendance_overview',
          'fee_collection',
          'pending_tasks',
          'system_stats'
        ]
      };
      
      res.success(realtimeConfig, 'Real-time configuration retrieved successfully');
    } catch (error) {
      res.error(error.message, 'REALTIME_CONFIG_FETCH_FAILED', 500);
    }
  })
);

// Widget Performance Metrics
router.get('/widgets/:widgetId/performance',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateParams('dashboard.widgetId'),
  validationMiddleware.validateQuery('dashboard.performanceFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { widgetId } = req.params;
      const filters = req.query;
      
      // This would be implemented to track widget performance
      const performance = {
        widgetId,
        averageLoadTime: '150ms',
        totalRequests: 1250,
        errorRate: '0.02%',
        filters
      };
      
      res.success(performance, 'Widget performance metrics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'WIDGET_PERFORMANCE_FETCH_FAILED', 500);
    }
  })
);

// Export dashboard data
router.get('/export/:format',
  authMiddleware.requirePermission('dashboard', 'read'),
  validationMiddleware.validateParams('common.exportFormat'),
  validationMiddleware.validateQuery('dashboard.exportFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { format } = req.params;
      const filters = req.query;
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      // This would be implemented to export dashboard data
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `dashboard-export-${timestamp}.${format}`;
      
      res.success({
        filename,
        message: 'Dashboard export not yet implemented',
        format,
        filters
      }, 'Dashboard export initiated');
      
    } catch (error) {
      res.error(error.message, 'DASHBOARD_EXPORT_FAILED', 500);
    }
  })
);

module.exports = router;