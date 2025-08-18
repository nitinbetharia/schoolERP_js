const express = require('express');
const router = express.Router();
const attendanceService = require('../modules/attendance/attendance-service');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Daily Attendance Management

// Mark daily attendance
router.post('/daily',
  authMiddleware.requireRole(['TEACHER', 'SCHOOL_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('attendance', 'create'),
  validationMiddleware.validate('attendance.markDaily'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const attendanceData = req.body;
      const markedBy = req.session.userId;
      
      const result = await attendanceService.markDailyAttendance(attendanceData, markedBy, req.trustCode);
      
      res.success(result, 'Daily attendance marked successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_MARKING_FAILED', 400);
    }
  })
);

// Bulk mark attendance for class/section
router.post('/daily/bulk',
  authMiddleware.requireRole(['TEACHER', 'SCHOOL_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('attendance', 'create'),
  validationMiddleware.validate('attendance.bulkMark'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { class_id, section_id, attendance_date, attendance_records } = req.body;
      const markedBy = req.session.userId;
      
      const result = await attendanceService.bulkMarkAttendance(
        class_id, 
        section_id, 
        attendance_date, 
        attendance_records, 
        markedBy, 
        req.trustCode
      );
      
      res.success(result, 'Bulk attendance marked successfully');
    } catch (error) {
      res.error(error.message, 'BULK_ATTENDANCE_FAILED', 400);
    }
  })
);

// Get daily attendance
router.get('/daily',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateQuery('attendance.dailyList'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const attendance = await attendanceService.getDailyAttendance(filters, userRole, userId, req.trustCode);
      
      res.success(attendance, 'Daily attendance retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_FETCH_FAILED', 500);
    }
  })
);

// Get attendance for specific date and class/section
router.get('/daily/:date/class/:classId/section/:sectionId',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateParams('attendance.classSection'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { date, classId, sectionId } = req.params;
      
      const attendance = await attendanceService.getClassSectionAttendance(
        date, 
        classId, 
        sectionId, 
        req.trustCode
      );
      
      res.success(attendance, 'Class section attendance retrieved successfully');
    } catch (error) {
      res.error(error.message, 'CLASS_ATTENDANCE_FETCH_FAILED', 500);
    }
  })
);

// Update attendance record
router.put('/daily/:attendanceId',
  authMiddleware.requireRole(['TEACHER', 'SCHOOL_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('attendance', 'update'),
  validationMiddleware.validateParams('attendance.id'),
  validationMiddleware.validate('attendance.update'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;
      
      const result = await attendanceService.updateAttendanceRecord(
        attendanceId, 
        updateData, 
        updatedBy, 
        req.trustCode
      );
      
      res.success(result, 'Attendance record updated successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_UPDATE_FAILED', 400);
    }
  })
);

// Leave Applications

// Submit leave application
router.post('/leave-applications',
  authMiddleware.requirePermission('leave', 'create'),
  validationMiddleware.validate('attendance.submitLeave'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const leaveData = req.body;
      const submittedBy = req.session.userId;
      const userRole = req.session.userRole;
      
      const result = await attendanceService.submitLeaveApplication(
        leaveData, 
        submittedBy, 
        userRole, 
        req.trustCode
      );
      
      res.success(result, 'Leave application submitted successfully');
    } catch (error) {
      res.error(error.message, 'LEAVE_SUBMISSION_FAILED', 400);
    }
  })
);

// Get leave applications
router.get('/leave-applications',
  authMiddleware.requirePermission('leave', 'read'),
  validationMiddleware.validateQuery('attendance.leaveList'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const leaveApplications = await attendanceService.getLeaveApplications(
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(leaveApplications, 'Leave applications retrieved successfully');
    } catch (error) {
      res.error(error.message, 'LEAVE_APPLICATIONS_FETCH_FAILED', 500);
    }
  })
);

// Get leave application by ID
router.get('/leave-applications/:applicationId',
  authMiddleware.requirePermission('leave', 'read'),
  validationMiddleware.validateParams('attendance.leaveId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { applicationId } = req.params;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const application = await attendanceService.getLeaveApplicationById(
        applicationId, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(application, 'Leave application retrieved successfully');
    } catch (error) {
      res.error(error.message, 'LEAVE_APPLICATION_FETCH_FAILED', 404);
    }
  })
);

// Process leave application (approve/reject)
router.patch('/leave-applications/:applicationId/:action',
  authMiddleware.requireRole(['TEACHER', 'SCHOOL_ADMIN', 'TRUST_ADMIN']),
  authMiddleware.requirePermission('leave', 'update'),
  validationMiddleware.validateParams('attendance.leaveAction'),
  validationMiddleware.validate('attendance.processLeave'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { applicationId, action } = req.params;
      const { remarks } = req.body;
      const processedBy = req.session.userId;
      
      const result = await attendanceService.processLeaveApplication(
        applicationId, 
        action, 
        remarks, 
        processedBy, 
        req.trustCode
      );
      
      res.success(result, `Leave application ${action}d successfully`);
    } catch (error) {
      res.error(error.message, 'LEAVE_PROCESSING_FAILED', 400);
    }
  })
);

// Attendance Summary and Reports

// Get student attendance summary
router.get('/summary/student/:studentId',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateParams('attendance.studentId'),
  validationMiddleware.validateQuery('attendance.summaryFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const summary = await attendanceService.getStudentAttendanceSummary(
        studentId, 
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(summary, 'Student attendance summary retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_SUMMARY_FETCH_FAILED', 500);
    }
  })
);

// Get class attendance summary
router.get('/summary/class/:classId',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateParams('attendance.classId'),
  validationMiddleware.validateQuery('attendance.summaryFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { classId } = req.params;
      const filters = req.query;
      
      const summary = await attendanceService.getClassAttendanceSummary(
        classId, 
        filters, 
        req.trustCode
      );
      
      res.success(summary, 'Class attendance summary retrieved successfully');
    } catch (error) {
      res.error(error.message, 'CLASS_SUMMARY_FETCH_FAILED', 500);
    }
  })
);

// Get attendance statistics
router.get('/stats/overview',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateQuery('attendance.statsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const stats = await attendanceService.getAttendanceStats(
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(stats, 'Attendance statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_STATS_FETCH_FAILED', 500);
    }
  })
);

// Generate attendance reports
router.get('/reports/:reportType',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateParams('attendance.reportType'),
  validationMiddleware.validateQuery('attendance.reportFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { reportType } = req.params;
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const report = await attendanceService.generateAttendanceReport(
        reportType, 
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(report, 'Attendance report generated successfully');
    } catch (error) {
      res.error(error.message, 'REPORT_GENERATION_FAILED', 500);
    }
  })
);

// Export attendance data
router.get('/export/:format',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateParams('common.exportFormat'),
  validationMiddleware.validateQuery('attendance.export'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { format } = req.params;
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const result = await attendanceService.exportAttendanceData(
        format, 
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
      
    } catch (error) {
      res.error(error.message, 'ATTENDANCE_EXPORT_FAILED', 500);
    }
  })
);

// Attendance Calendar and Holidays

// Get attendance calendar
router.get('/calendar',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateQuery('attendance.calendarFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      
      const calendar = await attendanceService.getAttendanceCalendar(filters, req.trustCode);
      
      res.success(calendar, 'Attendance calendar retrieved successfully');
    } catch (error) {
      res.error(error.message, 'CALENDAR_FETCH_FAILED', 500);
    }
  })
);

// Manage holidays
router.post('/holidays',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('attendance', 'create'),
  validationMiddleware.validate('attendance.createHoliday'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const holidayData = req.body;
      const createdBy = req.session.userId;
      
      const result = await attendanceService.createHoliday(holidayData, createdBy, req.trustCode);
      
      res.success(result, 'Holiday created successfully');
    } catch (error) {
      res.error(error.message, 'HOLIDAY_CREATION_FAILED', 400);
    }
  })
);

// Get holidays
router.get('/holidays',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateQuery('attendance.holidayFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      
      const holidays = await attendanceService.getHolidays(filters, req.trustCode);
      
      res.success(holidays, 'Holidays retrieved successfully');
    } catch (error) {
      res.error(error.message, 'HOLIDAYS_FETCH_FAILED', 500);
    }
  })
);

// Biometric Integration (if applicable)

// Sync biometric attendance data
router.post('/biometric/sync',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('attendance', 'create'),
  validationMiddleware.validate('attendance.biometricSync'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const biometricData = req.body;
      const syncedBy = req.session.userId;
      
      const result = await attendanceService.syncBiometricData(biometricData, syncedBy, req.trustCode);
      
      res.success(result, 'Biometric data synced successfully');
    } catch (error) {
      res.error(error.message, 'BIOMETRIC_SYNC_FAILED', 400);
    }
  })
);

// Attendance Notifications

// Get attendance alerts
router.get('/alerts',
  authMiddleware.requirePermission('attendance', 'read'),
  validationMiddleware.validateQuery('attendance.alertFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;
      
      const alerts = await attendanceService.getAttendanceAlerts(
        filters, 
        userRole, 
        userId, 
        req.trustCode
      );
      
      res.success(alerts, 'Attendance alerts retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ALERTS_FETCH_FAILED', 500);
    }
  })
);

module.exports = router;