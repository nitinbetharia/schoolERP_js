const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/AttendanceController');
// Use mock middleware for testing since main middleware is not available
const { authenticateToken, authorizeRoles } = require('../middleware/mockAuth');
const models = require('../models'); // Use local models instead of corrupted main models

// Q59-ENFORCED: Import validation schemas for attendance
const { validators } = require('../../../middleware');
const { studentAttendanceValidationSchemas, teacherAttendanceValidationSchemas } = require('../../../models/index');

/**
 * Attendance Routes
 * REST API endpoints for attendance management
 * Handles both student and teacher attendance operations
 * Following copilot instructions: CommonJS, proper middleware, role-based access
 */

// Initialize controller with models
const attendanceController = new AttendanceController(models);

// ==================== STUDENT ATTENDANCE ROUTES ====================

/**
 * @route   POST /api/attendance/student
 * @desc    Mark student attendance
 * @access  Private (Teachers, Admins, Principals)
 */
router.post(
   '/student',
   authenticateToken,
   authorizeRoles(['TEACHER', 'ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']),
   validators.validateBody(studentAttendanceValidationSchemas.markAttendance), // Q59-ENFORCED validation
   (req, res, next) => attendanceController.markStudentAttendance(req, res, next)
);

/**
 * @route   POST /api/attendance/student/bulk
 * @desc    Mark bulk student attendance
 * @access  Private (Teachers, Admins, Principals)
 */
router.post(
   '/student/bulk',
   authenticateToken,
   authorizeRoles(['TEACHER', 'ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']),
   validators.validateBody(studentAttendanceValidationSchemas.bulkMarkAttendance), // Q59-ENFORCED validation
   (req, res, next) => attendanceController.markBulkStudentAttendance(req, res, next)
);

/**
 * @route   PUT /api/attendance/student/:id
 * @desc    Update student attendance record
 * @access  Private (Teachers, Admins, Principals)
 */
router.put(
   '/student/:id',
   authenticateToken,
   authorizeRoles(['TEACHER', 'ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']),
   validators.validateBody(studentAttendanceValidationSchemas.updateAttendance), // Q59-ENFORCED validation
   (req, res, next) => attendanceController.updateStudentAttendance(req, res, next)
);

/**
 * @route   GET /api/attendance/student
 * @desc    Get student attendance records
 * @access  Private (All authenticated users)
 * @query   student_id, school_id, class_id, status, start_date, end_date, academic_year
 */
router.get('/student', authenticateToken, (req, res, next) =>
   attendanceController.getStudentAttendance(req, res, next)
);

/**
 * @route   GET /api/attendance/student/stats
 * @desc    Get student attendance statistics
 * @access  Private (All authenticated users)
 * @query   student_id, school_id, class_id, start_date, end_date, academic_year
 */
router.get('/student/stats', authenticateToken, (req, res, next) =>
   attendanceController.getStudentAttendanceStats(req, res, next)
);

// ==================== TEACHER ATTENDANCE ROUTES ====================

/**
 * @route   POST /api/attendance/teacher
 * @desc    Mark teacher attendance
 * @access  Private (Admins, Principals, Self-marking allowed)
 */
router.post(
   '/teacher',
   authenticateToken,
   authorizeRoles(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'TEACHER']),
   validators.validateBody(teacherAttendanceValidationSchemas.markAttendance), // Q59-ENFORCED validation
   (req, res, next) => attendanceController.markTeacherAttendance(req, res, next)
);

/**
 * @route   PUT /api/attendance/teacher/:id/checkout
 * @desc    Update teacher check-out time
 * @access  Private (Admins, Principals, Self-checkout allowed)
 */
router.put(
   '/teacher/:id/checkout',
   authenticateToken,
   authorizeRoles(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN', 'TEACHER']),
   validators.validateBody(teacherAttendanceValidationSchemas.checkOut), // Q59-ENFORCED validation
   (req, res, next) => attendanceController.updateTeacherCheckOut(req, res, next)
);

/**
 * @route   GET /api/attendance/teacher
 * @desc    Get teacher attendance records
 * @access  Private (All authenticated users)
 * @query   teacher_id, school_id, status, leave_type, start_date, end_date, academic_year
 */
router.get('/teacher', authenticateToken, (req, res, next) =>
   attendanceController.getTeacherAttendance(req, res, next)
);

/**
 * @route   GET /api/attendance/teacher/stats
 * @desc    Get teacher attendance statistics
 * @access  Private (All authenticated users)
 * @query   teacher_id, school_id, start_date, end_date, academic_year
 */
router.get('/teacher/stats', authenticateToken, (req, res, next) =>
   attendanceController.getTeacherAttendanceStats(req, res, next)
);

// ==================== REPORTING ROUTES ====================

/**
 * @route   GET /api/attendance/report
 * @desc    Generate comprehensive attendance report
 * @access  Private (Admins, Principals)
 * @query   school_id, start_date, end_date, type, academic_year
 */
router.get('/report', authenticateToken, authorizeRoles(['ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN']), (req, res, next) =>
   attendanceController.generateAttendanceReport(req, res, next)
);

/**
 * @route   GET /api/attendance/dashboard
 * @desc    Get attendance summary for dashboard
 * @access  Private (All authenticated users)
 * @query   school_id, date
 */
router.get('/dashboard', authenticateToken, (req, res, next) =>
   attendanceController.getAttendanceDashboard(req, res, next)
);

// ==================== MIDDLEWARE ERROR HANDLING ====================

/**
 * Route-specific error handler
 * Handles attendance-related errors with appropriate HTTP status codes
 */
router.use((error, req, res, next) => {
   // Log the error for debugging
   console.error('Attendance Route Error:', {
      path: req.path,
      method: req.method,
      error: error.message,
      stack: error.stack,
   });

   // Handle specific attendance validation errors
   if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
         success: false,
         message: 'Validation error',
         errors: error.errors.map((err) => ({
            field: err.path,
            message: err.message,
         })),
      });
   }

   if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
         success: false,
         message: 'Attendance record already exists for this date',
         error: error.message,
      });
   }

   if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
         success: false,
         message: 'Invalid reference to student, teacher, or school',
         error: error.message,
      });
   }

   // Handle attendance-specific business logic errors
   if (error.message && error.message.includes('attendance')) {
      return res.status(400).json({
         success: false,
         message: error.message,
      });
   }

   // Pass to global error handler
   next(error);
});

// ==================== ROUTE DOCUMENTATION ====================

/**
 * Attendance API Route Documentation
 *
 * Base URL: /api/attendance
 *
 * Student Attendance Endpoints:
 * - POST   /student              - Mark single student attendance
 * - POST   /student/bulk         - Mark multiple student attendance
 * - PUT    /student/:id          - Update student attendance record
 * - GET    /student              - Get student attendance records (with filters)
 * - GET    /student/stats        - Get student attendance statistics
 *
 * Teacher Attendance Endpoints:
 * - POST   /teacher              - Mark teacher attendance
 * - PUT    /teacher/:id/checkout - Update teacher check-out time
 * - GET    /teacher              - Get teacher attendance records (with filters)
 * - GET    /teacher/stats        - Get teacher attendance statistics
 *
 * Reporting Endpoints:
 * - GET    /report               - Generate comprehensive attendance report
 * - GET    /dashboard            - Get attendance dashboard summary
 *
 * Common Query Parameters:
 * - school_id: Filter by school
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 * - academic_year: Filter by academic year
 * - status: Filter by attendance status
 *
 * Authentication:
 * - All routes require valid JWT token
 * - Role-based access control applied
 * - Teachers can mark attendance and view their own records
 * - Admins/Principals have full access to all attendance data
 *
 * Response Format:
 * {
 *   "success": boolean,
 *   "message": string,
 *   "data": object|array,
 *   "filters"?: object (for GET requests with filters)
 * }
 *
 * Error Response Format:
 * {
 *   "success": false,
 *   "message": string,
 *   "error"?: string,
 *   "errors"?: array (for validation errors)
 * }
 */

module.exports = router;
