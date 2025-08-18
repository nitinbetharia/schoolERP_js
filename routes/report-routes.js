const express = require('express');
const router = express.Router();
const reportsService = require('../modules/reports/reports-service');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Report Templates Management

// Get available report templates
router.get('/templates',
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateQuery('reports.templateFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      
      const templates = await reportsService.getReportTemplates(filters, userRole, req.trustCode);
      
      res.success(templates, 'Report templates retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATES_FETCH_FAILED', 500);
    }
  })
);

// Get report template by ID
router.get('/templates/:templateId',
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateParams('reports.templateId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { templateId } = req.params;
      
      const template = await reportsService.getReportTemplateById(templateId, req.trustCode);
      
      res.success(template, 'Report template retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATE_FETCH_FAILED', 404);
    }
  })
);

// Create custom report template
router.post('/templates',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.createTemplate'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const templateData = req.body;
      const createdBy = req.session.userId;
      
      const result = await reportsService.createReportTemplate(templateData, createdBy, req.trustCode);
      
      res.success(result, 'Report template created successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATE_CREATION_FAILED', 400);
    }
  })
);

// Update report template
router.put('/templates/:templateId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'update'),
  validationMiddleware.validateParams('reports.templateId'),
  validationMiddleware.validate('reports.updateTemplate'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { templateId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;
      
      const result = await reportsService.updateReportTemplate(templateId, updateData, updatedBy, req.trustCode);
      
      res.success(result, 'Report template updated successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATE_UPDATE_FAILED', 400);
    }
  })
);

// Student Reports

// Generate student profile report
router.post('/students/profile',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.studentProfile'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateStudentProfileReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Student profile report generated successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_REPORT_FAILED', 400);
    }
  })
);

// Generate student list report
router.post('/students/list',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.studentList'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateStudentListReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Student list report generated successfully');
    } catch (error) {
      res.error(error.message, 'STUDENT_LIST_REPORT_FAILED', 400);
    }
  })
);

// Generate admission report
router.post('/students/admissions',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.admissionReport'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateAdmissionReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Admission report generated successfully');
    } catch (error) {
      res.error(error.message, 'ADMISSION_REPORT_FAILED', 400);
    }
  })
);

// Fee Reports

// Generate fee collection report
router.post('/fees/collection',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.feeCollection'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateFeeCollectionReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Fee collection report generated successfully');
    } catch (error) {
      res.error(error.message, 'FEE_COLLECTION_REPORT_FAILED', 400);
    }
  })
);

// Generate outstanding fees report
router.post('/fees/outstanding',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.outstandingFees'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateOutstandingFeesReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Outstanding fees report generated successfully');
    } catch (error) {
      res.error(error.message, 'OUTSTANDING_FEES_REPORT_FAILED', 400);
    }
  })
);

// Generate fee defaulters report
router.post('/fees/defaulters',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.feeDefaulters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateFeeDefaultersReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Fee defaulters report generated successfully');
    } catch (error) {
      res.error(error.message, 'FEE_DEFAULTERS_REPORT_FAILED', 400);
    }
  })
);

// Attendance Reports

// Generate attendance summary report
router.post('/attendance/summary',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.attendanceSummary'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateAttendanceSummaryReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Attendance summary report generated successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_SUMMARY_REPORT_FAILED', 400);
    }
  })
);

// Generate daily attendance report
router.post('/attendance/daily',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.dailyAttendance'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateDailyAttendanceReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Daily attendance report generated successfully');
    } catch (error) {
      res.error(error.message, 'DAILY_ATTENDANCE_REPORT_FAILED', 400);
    }
  })
);

// Generate absentee report
router.post('/attendance/absentees',
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.absenteeReport'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportParams = req.body;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.generateAbsenteeReport(
        reportParams, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(result, 'Absentee report generated successfully');
    } catch (error) {
      res.error(error.message, 'ABSENTEE_REPORT_FAILED', 400);
    }
  })
);

// Custom Reports

// Execute custom report
router.post('/custom/execute',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.customReport'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const reportConfig = req.body;
      const executedBy = req.session.userId;
      const userRole = req.session.userRole;
      
      const result = await reportsService.executeCustomReport(
        reportConfig, 
        executedBy, 
        userRole, 
        req.trustCode
      );
      
      res.success(result, 'Custom report executed successfully');
    } catch (error) {
      res.error(error.message, 'CUSTOM_REPORT_FAILED', 400);
    }
  })
);

// Get custom report builder configuration
router.get('/custom/builder-config',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const config = await reportsService.getReportBuilderConfig(req.trustCode);
      
      res.success(config, 'Report builder configuration retrieved successfully');
    } catch (error) {
      res.error(error.message, 'BUILDER_CONFIG_FETCH_FAILED', 500);
    }
  })
);

// Report History and Management

// Get report execution history
router.get('/history',
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateQuery('reports.historyFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const history = await reportsService.getReportHistory(
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(history, 'Report history retrieved successfully');
    } catch (error) {
      res.error(error.message, 'REPORT_HISTORY_FETCH_FAILED', 500);
    }
  })
);

// Get report by execution ID
router.get('/executions/:executionId',
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateParams('reports.executionId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { executionId } = req.params;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const report = await reportsService.getReportByExecutionId(
        executionId, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(report, 'Report retrieved successfully');
    } catch (error) {
      res.error(error.message, 'REPORT_FETCH_FAILED', 404);
    }
  })
);

// Download report file
router.get('/executions/:executionId/download',
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateParams('reports.executionId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { executionId } = req.params;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await reportsService.downloadReport(
        executionId, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
      
    } catch (error) {
      res.error(error.message, 'REPORT_DOWNLOAD_FAILED', 404);
    }
  })
);

// Scheduled Reports

// Create scheduled report
router.post('/scheduled',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'create'),
  validationMiddleware.validate('reports.scheduleReport'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const scheduleData = req.body;
      const createdBy = req.session.userId;
      
      const result = await reportsService.scheduleReport(scheduleData, createdBy, req.trustCode);
      
      res.success(result, 'Report scheduled successfully');
    } catch (error) {
      res.error(error.message, 'REPORT_SCHEDULING_FAILED', 400);
    }
  })
);

// Get scheduled reports
router.get('/scheduled',
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateQuery('reports.scheduledFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const scheduledReports = await reportsService.getScheduledReports(
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(scheduledReports, 'Scheduled reports retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SCHEDULED_REPORTS_FETCH_FAILED', 500);
    }
  })
);

// Update scheduled report
router.put('/scheduled/:scheduleId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'update'),
  validationMiddleware.validateParams('reports.scheduleId'),
  validationMiddleware.validate('reports.updateSchedule'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;
      
      const result = await reportsService.updateScheduledReport(
        scheduleId, 
        updateData, 
        updatedBy, 
        req.trustCode
      );
      
      res.success(result, 'Scheduled report updated successfully');
    } catch (error) {
      res.error(error.message, 'SCHEDULE_UPDATE_FAILED', 400);
    }
  })
);

// Delete scheduled report
router.delete('/scheduled/:scheduleId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('reports', 'delete'),
  validationMiddleware.validateParams('reports.scheduleId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const deletedBy = req.session.userId;
      
      const result = await reportsService.deleteScheduledReport(scheduleId, deletedBy, req.trustCode);
      
      res.success(result, 'Scheduled report deleted successfully');
    } catch (error) {
      res.error(error.message, 'SCHEDULE_DELETION_FAILED', 400);
    }
  })
);

// Report Analytics

// Get report usage analytics
router.get('/analytics/usage',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('reports', 'read'),
  validationMiddleware.validateQuery('reports.analyticsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      
      const analytics = await reportsService.getReportUsageAnalytics(filters, req.trustCode);
      
      res.success(analytics, 'Report usage analytics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ANALYTICS_FETCH_FAILED', 500);
    }
  })
);

module.exports = router;