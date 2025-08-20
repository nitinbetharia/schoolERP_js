const { ErrorFactory } = require('../../../utils/errors');
const { logger } = require('../../../utils/logger');
const AttendanceService = require('../services/AttendanceService');

/**
 * Attendance Controller
 * Handles HTTP requests for attendance management
 * Provides REST API endpoints for student and teacher attendance
 * Following copilot instructions: CommonJS, async/await, centralized error handling
 */
class AttendanceController {
   constructor(models) {
      this.models = models;
      this.attendanceService = new AttendanceService(models);
   }

   // ==================== STUDENT ATTENDANCE ENDPOINTS ====================

   /**
    * Mark student attendance
    * POST /api/attendance/student
    */
   async markStudentAttendance(req, res, next) {
      try {
         const { student_id, school_id, class_id, attendance_date, status, period, reason, additional_info } = req.body;

         // Validate required fields
         if (!student_id || !school_id || !attendance_date || !status) {
            throw ErrorFactory.createError(
               'BAD_REQUEST',
               'Missing required fields: student_id, school_id, attendance_date, status'
            );
         }

         // Validate attendance date format
         if (!/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)) {
            throw ErrorFactory.createError('BAD_REQUEST', 'Invalid date format. Use YYYY-MM-DD');
         }

         // Validate status
         const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'HALF_DAY'];
         if (!validStatuses.includes(status)) {
            throw ErrorFactory.createError(
               'BAD_REQUEST',
               `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            );
         }

         const attendanceData = {
            student_id,
            school_id,
            class_id,
            attendance_date,
            status,
            period: period || 'FULL_DAY',
            reason,
            additional_info,
         };

         const attendance = await this.attendanceService.markStudentAttendance(attendanceData, req.user.id);

         logger.info('Student attendance marked successfully', {
            attendance_id: attendance.id,
            student_id,
            status,
            marked_by: req.user.id,
         });

         res.status(201).json({
            success: true,
            message: 'Student attendance marked successfully',
            data: attendance,
         });
      } catch (error) {
         logger.error('Error in markStudentAttendance controller', {
            error: error.message,
            user_id: req.user?.id,
            request_body: req.body,
         });
         next(error);
      }
   }

   /**
    * Mark bulk student attendance
    * POST /api/attendance/student/bulk
    */
   async markBulkStudentAttendance(req, res, next) {
      try {
         const { attendance_list } = req.body;

         if (!Array.isArray(attendance_list) || attendance_list.length === 0) {
            throw ErrorFactory.createError('BAD_REQUEST', 'attendance_list must be a non-empty array');
         }

         // Validate each attendance record
         for (const [index, record] of attendance_list.entries()) {
            if (!record.student_id || !record.school_id || !record.attendance_date || !record.status) {
               throw ErrorFactory.createError('BAD_REQUEST', `Missing required fields in record ${index + 1}`);
            }
         }

         const results = await this.attendanceService.markBulkStudentAttendance(attendance_list, req.user.id);

         logger.info('Bulk student attendance completed', {
            total: results.summary.total,
            success: results.summary.success,
            failed: results.summary.failed,
            marked_by: req.user.id,
         });

         res.status(201).json({
            success: true,
            message: 'Bulk student attendance processing completed',
            data: results,
         });
      } catch (error) {
         logger.error('Error in markBulkStudentAttendance controller', {
            error: error.message,
            user_id: req.user?.id,
         });
         next(error);
      }
   }

   /**
    * Update student attendance
    * PUT /api/attendance/student/:id
    */
   async updateStudentAttendance(req, res, next) {
      try {
         const { id } = req.params;
         const updateData = req.body;

         if (!id || isNaN(id)) {
            throw ErrorFactory.createError('BAD_REQUEST', 'Invalid attendance ID');
         }

         const attendance = await this.attendanceService.updateStudentAttendance(parseInt(id), updateData, req.user.id);

         logger.info('Student attendance updated successfully', {
            attendance_id: id,
            updated_by: req.user.id,
         });

         res.json({
            success: true,
            message: 'Student attendance updated successfully',
            data: attendance,
         });
      } catch (error) {
         logger.error('Error in updateStudentAttendance controller', {
            attendance_id: req.params.id,
            error: error.message,
            user_id: req.user?.id,
         });
         next(error);
      }
   }

   /**
    * Get student attendance records
    * GET /api/attendance/student
    */
   async getStudentAttendance(req, res, next) {
      try {
         const filters = {
            student_id: req.query.student_id ? parseInt(req.query.student_id) : undefined,
            school_id: req.query.school_id ? parseInt(req.query.school_id) : undefined,
            class_id: req.query.class_id ? parseInt(req.query.class_id) : undefined,
            status: req.query.status ? req.query.status.split(',') : undefined,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            academic_year: req.query.academic_year ? parseInt(req.query.academic_year) : undefined,
            is_holiday: req.query.is_holiday !== undefined ? req.query.is_holiday === 'true' : undefined,
         };

         // Remove undefined values
         Object.keys(filters).forEach((key) => {
            if (filters[key] === undefined) {
               delete filters[key];
            }
         });

         const attendance = await this.attendanceService.getStudentAttendance(filters);

         res.json({
            success: true,
            message: 'Student attendance records retrieved successfully',
            data: attendance,
            filters: filters,
         });
      } catch (error) {
         logger.error('Error in getStudentAttendance controller', {
            error: error.message,
            query_params: req.query,
         });
         next(error);
      }
   }

   /**
    * Get student attendance statistics
    * GET /api/attendance/student/stats
    */
   async getStudentAttendanceStats(req, res, next) {
      try {
         const filters = {
            student_id: req.query.student_id ? parseInt(req.query.student_id) : undefined,
            school_id: req.query.school_id ? parseInt(req.query.school_id) : undefined,
            class_id: req.query.class_id ? parseInt(req.query.class_id) : undefined,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            academic_year: req.query.academic_year ? parseInt(req.query.academic_year) : undefined,
         };

         // Remove undefined values
         Object.keys(filters).forEach((key) => {
            if (filters[key] === undefined) {
               delete filters[key];
            }
         });

         const stats = await this.attendanceService.getStudentAttendanceStats(filters);

         res.json({
            success: true,
            message: 'Student attendance statistics retrieved successfully',
            data: stats,
            filters: filters,
         });
      } catch (error) {
         logger.error('Error in getStudentAttendanceStats controller', {
            error: error.message,
            query_params: req.query,
         });
         next(error);
      }
   }

   // ==================== TEACHER ATTENDANCE ENDPOINTS ====================

   /**
    * Mark teacher attendance
    * POST /api/attendance/teacher
    */
   async markTeacherAttendance(req, res, next) {
      try {
         const {
            teacher_id,
            school_id,
            attendance_date,
            status,
            check_in_time,
            check_out_time,
            scheduled_start,
            scheduled_end,
            leave_type,
            reason,
            location,
            is_substitute,
            substituting_for,
            additional_info,
         } = req.body;

         // Validate required fields
         if (!teacher_id || !school_id || !attendance_date || !status) {
            throw ErrorFactory.createError(
               'BAD_REQUEST',
               'Missing required fields: teacher_id, school_id, attendance_date, status'
            );
         }

         // Validate status
         const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'LEAVE', 'HALF_DAY'];
         if (!validStatuses.includes(status)) {
            throw ErrorFactory.createError(
               'BAD_REQUEST',
               `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            );
         }

         // Validate leave type if status is LEAVE
         if (status === 'LEAVE' && !leave_type) {
            throw ErrorFactory.createError('BAD_REQUEST', 'leave_type is required when status is LEAVE');
         }

         const attendanceData = {
            teacher_id,
            school_id,
            attendance_date,
            status,
            check_in_time,
            check_out_time,
            scheduled_start: scheduled_start || '08:00:00',
            scheduled_end: scheduled_end || '16:00:00',
            leave_type,
            reason,
            location,
            is_substitute: is_substitute || false,
            substituting_for,
            additional_info,
         };

         const attendance = await this.attendanceService.markTeacherAttendance(attendanceData, req.user.id);

         logger.info('Teacher attendance marked successfully', {
            attendance_id: attendance.id,
            teacher_id,
            status,
            marked_by: req.user.id,
         });

         res.status(201).json({
            success: true,
            message: 'Teacher attendance marked successfully',
            data: attendance,
         });
      } catch (error) {
         logger.error('Error in markTeacherAttendance controller', {
            error: error.message,
            user_id: req.user?.id,
            request_body: req.body,
         });
         next(error);
      }
   }

   /**
    * Update teacher check-out time
    * PUT /api/attendance/teacher/:id/checkout
    */
   async updateTeacherCheckOut(req, res, next) {
      try {
         const { id } = req.params;
         const { check_out_time } = req.body;

         if (!id || isNaN(id)) {
            throw ErrorFactory.createError('BAD_REQUEST', 'Invalid attendance ID');
         }

         if (!check_out_time) {
            throw ErrorFactory.createError('BAD_REQUEST', 'check_out_time is required');
         }

         // Validate time format (HH:MM:SS or HH:MM)
         if (!/^\d{2}:\d{2}(:\d{2})?$/.test(check_out_time)) {
            throw ErrorFactory.createError('BAD_REQUEST', 'Invalid time format. Use HH:MM or HH:MM:SS');
         }

         const formattedTime = check_out_time.length === 5 ? `${check_out_time}:00` : check_out_time;

         const attendance = await this.attendanceService.updateTeacherCheckOut(
            parseInt(id),
            formattedTime,
            req.user.id
         );

         logger.info('Teacher check-out updated successfully', {
            attendance_id: id,
            check_out_time: formattedTime,
            updated_by: req.user.id,
         });

         res.json({
            success: true,
            message: 'Teacher check-out time updated successfully',
            data: attendance,
         });
      } catch (error) {
         logger.error('Error in updateTeacherCheckOut controller', {
            attendance_id: req.params.id,
            error: error.message,
            user_id: req.user?.id,
         });
         next(error);
      }
   }

   /**
    * Get teacher attendance records
    * GET /api/attendance/teacher
    */
   async getTeacherAttendance(req, res, next) {
      try {
         const filters = {
            teacher_id: req.query.teacher_id ? parseInt(req.query.teacher_id) : undefined,
            school_id: req.query.school_id ? parseInt(req.query.school_id) : undefined,
            status: req.query.status ? req.query.status.split(',') : undefined,
            leave_type: req.query.leave_type,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            academic_year: req.query.academic_year ? parseInt(req.query.academic_year) : undefined,
            is_holiday: req.query.is_holiday !== undefined ? req.query.is_holiday === 'true' : undefined,
            is_substitute: req.query.is_substitute !== undefined ? req.query.is_substitute === 'true' : undefined,
         };

         // Remove undefined values
         Object.keys(filters).forEach((key) => {
            if (filters[key] === undefined) {
               delete filters[key];
            }
         });

         const attendance = await this.attendanceService.getTeacherAttendance(filters);

         res.json({
            success: true,
            message: 'Teacher attendance records retrieved successfully',
            data: attendance,
            filters: filters,
         });
      } catch (error) {
         logger.error('Error in getTeacherAttendance controller', {
            error: error.message,
            query_params: req.query,
         });
         next(error);
      }
   }

   /**
    * Get teacher attendance statistics
    * GET /api/attendance/teacher/stats
    */
   async getTeacherAttendanceStats(req, res, next) {
      try {
         const filters = {
            teacher_id: req.query.teacher_id ? parseInt(req.query.teacher_id) : undefined,
            school_id: req.query.school_id ? parseInt(req.query.school_id) : undefined,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            academic_year: req.query.academic_year ? parseInt(req.query.academic_year) : undefined,
         };

         // Remove undefined values
         Object.keys(filters).forEach((key) => {
            if (filters[key] === undefined) {
               delete filters[key];
            }
         });

         const stats = await this.attendanceService.getTeacherAttendanceStats(filters);

         res.json({
            success: true,
            message: 'Teacher attendance statistics retrieved successfully',
            data: stats,
            filters: filters,
         });
      } catch (error) {
         logger.error('Error in getTeacherAttendanceStats controller', {
            error: error.message,
            query_params: req.query,
         });
         next(error);
      }
   }

   // ==================== REPORT ENDPOINTS ====================

   /**
    * Generate comprehensive attendance report
    * GET /api/attendance/report
    */
   async generateAttendanceReport(req, res, next) {
      try {
         const filters = {
            school_id: req.query.school_id ? parseInt(req.query.school_id) : undefined,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            type: req.query.type || 'both', // 'student', 'teacher', or 'both'
            academic_year: req.query.academic_year ? parseInt(req.query.academic_year) : undefined,
         };

         // Validate required fields
         if (!filters.school_id || !filters.start_date || !filters.end_date) {
            throw ErrorFactory.createError(
               'BAD_REQUEST',
               'Missing required parameters: school_id, start_date, end_date'
            );
         }

         // Validate type
         const validTypes = ['student', 'teacher', 'both'];
         if (!validTypes.includes(filters.type)) {
            throw ErrorFactory.createError('BAD_REQUEST', `Invalid type. Must be one of: ${validTypes.join(', ')}`);
         }

         // Remove undefined values
         Object.keys(filters).forEach((key) => {
            if (filters[key] === undefined) {
               delete filters[key];
            }
         });

         const report = await this.attendanceService.generateAttendanceReport(filters);

         logger.info('Attendance report generated successfully', {
            school_id: filters.school_id,
            period: `${filters.start_date} to ${filters.end_date}`,
            type: filters.type,
            generated_by: req.user.id,
         });

         res.json({
            success: true,
            message: 'Attendance report generated successfully',
            data: report,
         });
      } catch (error) {
         logger.error('Error in generateAttendanceReport controller', {
            error: error.message,
            query_params: req.query,
            user_id: req.user?.id,
         });
         next(error);
      }
   }

   /**
    * Get attendance summary for dashboard
    * GET /api/attendance/dashboard
    */
   async getAttendanceDashboard(req, res, next) {
      try {
         const { school_id, date } = req.query;

         if (!school_id) {
            throw ErrorFactory.createError('BAD_REQUEST', 'school_id is required');
         }

         const targetDate = date || new Date().toISOString().split('T')[0];

         // Get today's student attendance summary
         const studentFilters = {
            school_id: parseInt(school_id),
            start_date: targetDate,
            end_date: targetDate,
         };

         const studentStats = await this.attendanceService.getStudentAttendanceStats(studentFilters);

         // Get today's teacher attendance summary
         const teacherFilters = {
            school_id: parseInt(school_id),
            start_date: targetDate,
            end_date: targetDate,
         };

         const teacherStats = await this.attendanceService.getTeacherAttendanceStats(teacherFilters);

         const dashboard = {
            date: targetDate,
            school_id: parseInt(school_id),
            student_attendance: studentStats,
            teacher_attendance: teacherStats,
            generated_at: new Date().toISOString(),
         };

         res.json({
            success: true,
            message: 'Attendance dashboard data retrieved successfully',
            data: dashboard,
         });
      } catch (error) {
         logger.error('Error in getAttendanceDashboard controller', {
            error: error.message,
            query_params: req.query,
         });
         next(error);
      }
   }
}

module.exports = AttendanceController;
