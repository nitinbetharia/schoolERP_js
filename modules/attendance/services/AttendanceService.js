const { Op, fn, col } = require('sequelize');
const { ErrorFactory } = require('../../../utils/errors');
const { logger } = require('../../../utils/logger');

/**
 * Attendance Service
 * Provides business logic for all attendance operations
 * Handles both student and teacher attendance management
 * Following copilot instructions: CommonJS, async/await, centralized error handling
 */
class AttendanceService {
   constructor(models) {
      this.models = models;
      this.StudentAttendance = models.StudentAttendance;
      this.TeacherAttendance = models.TeacherAttendance;
      this.User = models.User;
      this.Student = models.Student;
      this.School = models.School;
      this.Class = models.Class;
   }

   // ==================== STUDENT ATTENDANCE METHODS ====================

   /**
    * Mark student attendance for a specific date
    * @param {Object} attendanceData - Attendance data
    * @param {number} userId - ID of user marking attendance
    * @returns {Object} Created attendance record
    */
   async markStudentAttendance(attendanceData, userId) {
      try {
         logger.info('Marking student attendance', {
            student_id: attendanceData.student_id,
            date: attendanceData.attendance_date,
            status: attendanceData.status,
            marked_by: userId,
         });

         // Check if student exists and belongs to the school
         const student = await this.Student.findOne({
            where: {
               id: attendanceData.student_id,
               school_id: attendanceData.school_id,
               status: 'ACTIVE',
            },
         });

         if (!student) {
            throw ErrorFactory.createError('NOT_FOUND', 'Student not found or inactive in this school');
         }

         // Check if attendance already exists for this date
         const existingAttendance = await this.StudentAttendance.findOne({
            where: {
               student_id: attendanceData.student_id,
               attendance_date: attendanceData.attendance_date,
            },
         });

         if (existingAttendance) {
            throw ErrorFactory.createError('CONFLICT', 'Attendance already marked for this date');
         }

         // Create attendance record
         const attendance = await this.StudentAttendance.create({
            ...attendanceData,
            marked_by: userId,
            academic_year: new Date(attendanceData.attendance_date).getFullYear(),
         });

         await this.logAttendanceActivity('STUDENT_ATTENDANCE_MARKED', attendance.id, userId, {
            status: attendanceData.status,
         });

         return attendance;
      } catch (error) {
         logger.error('Error marking student attendance', {
            student_id: attendanceData.student_id,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Mark attendance for multiple students (bulk operation)
    * @param {Array} attendanceList - Array of attendance records
    * @param {number} userId - ID of user marking attendance
    * @returns {Object} Result with successful and failed records
    */
   async markBulkStudentAttendance(attendanceList, userId) {
      const transaction = await this.models.sequelize.transaction();
      const results = {
         successful: [],
         failed: [],
         summary: {
            total: attendanceList.length,
            success: 0,
            failed: 0,
         },
      };

      try {
         logger.info('Starting bulk student attendance marking', {
            total_records: attendanceList.length,
            marked_by: userId,
         });

         for (const attendanceData of attendanceList) {
            try {
               // Check for existing attendance
               const existing = await this.StudentAttendance.findOne({
                  where: {
                     student_id: attendanceData.student_id,
                     attendance_date: attendanceData.attendance_date,
                  },
                  transaction,
               });

               if (existing) {
                  results.failed.push({
                     student_id: attendanceData.student_id,
                     error: 'Attendance already exists',
                  });
                  continue;
               }

               const attendance = await this.StudentAttendance.create(
                  {
                     ...attendanceData,
                     marked_by: userId,
                     academic_year: new Date(attendanceData.attendance_date).getFullYear(),
                  },
                  { transaction }
               );

               results.successful.push(attendance);
            } catch (error) {
               results.failed.push({
                  student_id: attendanceData.student_id,
                  error: error.message,
               });
            }
         }

         results.summary.success = results.successful.length;
         results.summary.failed = results.failed.length;

         await transaction.commit();

         await this.logAttendanceActivity('BULK_STUDENT_ATTENDANCE_MARKED', null, userId, {
            total: results.summary.total,
            success: results.summary.success,
            failed: results.summary.failed,
         });

         logger.info('Bulk student attendance completed', results.summary);

         return results;
      } catch (error) {
         await transaction.rollback();
         logger.error('Error in bulk student attendance marking', {
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update existing student attendance record
    * @param {number} attendanceId - ID of attendance record
    * @param {Object} updateData - Data to update
    * @param {number} userId - ID of user making update
    * @returns {Object} Updated attendance record
    */
   async updateStudentAttendance(attendanceId, updateData, userId) {
      try {
         const attendance = await this.StudentAttendance.findByPk(attendanceId);

         if (!attendance) {
            throw ErrorFactory.createError('NOT_FOUND', 'Attendance record not found');
         }

         const oldStatus = attendance.status;

         await attendance.update({
            ...updateData,
            modified_by: userId,
         });

         await this.logAttendanceActivity('STUDENT_ATTENDANCE_UPDATED', attendanceId, userId, {
            old_status: oldStatus,
            new_status: updateData.status || oldStatus,
         });

         return attendance;
      } catch (error) {
         logger.error('Error updating student attendance', {
            attendance_id: attendanceId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get student attendance for a specific date range
    * @param {Object} filters - Query filters
    * @returns {Array} Attendance records
    */
   async getStudentAttendance(filters) {
      try {
         const whereClause = this.buildStudentAttendanceWhereClause(filters);

         const attendance = await this.StudentAttendance.findAll({
            where: whereClause,
            include: [
               {
                  model: this.Student,
                  as: 'student',
                  attributes: ['id', 'first_name', 'last_name', 'roll_number', 'admission_number'],
               },
               {
                  model: this.Class,
                  as: 'class',
                  attributes: ['id', 'name', 'section'],
               },
               {
                  model: this.User,
                  as: 'marker',
                  attributes: ['id', 'first_name', 'last_name'],
               },
            ],
            order: [
               ['attendance_date', 'DESC'],
               ['created_at', 'DESC'],
            ],
         });

         return attendance;
      } catch (error) {
         logger.error('Error fetching student attendance', {
            filters,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Calculate student attendance statistics
    * @param {Object} filters - Query filters
    * @returns {Object} Attendance statistics
    */
   async getStudentAttendanceStats(filters) {
      try {
         const whereClause = this.buildStudentAttendanceWhereClause(filters);

         // Get total records
         const totalRecords = await this.StudentAttendance.count({
            where: {
               ...whereClause,
               is_holiday: false,
            },
         });

         // Get present records
         const presentRecords = await this.StudentAttendance.count({
            where: {
               ...whereClause,
               status: ['PRESENT', 'LATE'],
               is_holiday: false,
            },
         });

         // Get absent records
         const absentRecords = await this.StudentAttendance.count({
            where: {
               ...whereClause,
               status: ['ABSENT', 'SICK'],
               is_holiday: false,
            },
         });

         // Get status breakdown
         const statusBreakdown = await this.StudentAttendance.findAll({
            where: whereClause,
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            group: ['status'],
            raw: true,
         });

         const attendancePercentage =
            totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 100) / 100 : 0;

         return {
            total_records: totalRecords,
            present_records: presentRecords,
            absent_records: absentRecords,
            attendance_percentage: attendancePercentage,
            status_breakdown: statusBreakdown,
         };
      } catch (error) {
         logger.error('Error calculating student attendance stats', {
            filters,
            error: error.message,
         });
         throw error;
      }
   }

   // ==================== TEACHER ATTENDANCE METHODS ====================

   /**
    * Mark teacher attendance for a specific date
    * @param {Object} attendanceData - Attendance data
    * @param {number} userId - ID of user marking attendance
    * @returns {Object} Created attendance record
    */
   async markTeacherAttendance(attendanceData, userId) {
      try {
         logger.info('Marking teacher attendance', {
            teacher_id: attendanceData.teacher_id,
            date: attendanceData.attendance_date,
            status: attendanceData.status,
            marked_by: userId,
         });

         // Check if teacher exists and belongs to the school
         const teacher = await this.User.findOne({
            where: {
               id: attendanceData.teacher_id,
               school_id: attendanceData.school_id,
               role: ['TEACHER', 'PRINCIPAL', 'ADMIN'],
               status: 'ACTIVE',
            },
         });

         if (!teacher) {
            throw ErrorFactory.createError('NOT_FOUND', 'Teacher not found or inactive in this school');
         }

         // Check if attendance already exists for this date
         const existingAttendance = await this.TeacherAttendance.findOne({
            where: {
               teacher_id: attendanceData.teacher_id,
               attendance_date: attendanceData.attendance_date,
            },
         });

         if (existingAttendance) {
            throw ErrorFactory.createError('CONFLICT', 'Attendance already marked for this date');
         }

         // Calculate worked hours if check-in and check-out times provided
         let calculatedData = { ...attendanceData };
         if (attendanceData.check_in_time && attendanceData.check_out_time) {
            calculatedData.total_hours_worked = this.calculateHoursWorked(
               attendanceData.check_in_time,
               attendanceData.check_out_time
            );
            calculatedData.overtime_hours = this.calculateOvertimeHours(
               calculatedData.total_hours_worked,
               attendanceData.scheduled_start || '08:00:00',
               attendanceData.scheduled_end || '16:00:00'
            );
         }

         // Calculate minutes late
         if (attendanceData.check_in_time && attendanceData.scheduled_start) {
            calculatedData.minutes_late = this.calculateMinutesLate(
               attendanceData.check_in_time,
               attendanceData.scheduled_start
            );
         }

         const attendance = await this.TeacherAttendance.create({
            ...calculatedData,
            marked_by: userId,
            academic_year: new Date(attendanceData.attendance_date).getFullYear(),
         });

         await this.logAttendanceActivity('TEACHER_ATTENDANCE_MARKED', attendance.id, userId, {
            status: attendanceData.status,
         });

         return attendance;
      } catch (error) {
         logger.error('Error marking teacher attendance', {
            teacher_id: attendanceData.teacher_id,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update teacher check-out time and calculate hours
    * @param {number} attendanceId - ID of attendance record
    * @param {string} checkOutTime - Check-out time (HH:MM:SS)
    * @param {number} userId - ID of user making update
    * @returns {Object} Updated attendance record
    */
   async updateTeacherCheckOut(attendanceId, checkOutTime, userId) {
      try {
         const attendance = await this.TeacherAttendance.findByPk(attendanceId);

         if (!attendance) {
            throw ErrorFactory.createError('NOT_FOUND', 'Attendance record not found');
         }

         if (!attendance.check_in_time) {
            throw ErrorFactory.createError('BAD_REQUEST', 'Cannot check out without check-in time');
         }

         const totalHours = this.calculateHoursWorked(attendance.check_in_time, checkOutTime);
         const overtimeHours = this.calculateOvertimeHours(
            totalHours,
            attendance.scheduled_start,
            attendance.scheduled_end
         );

         const earlyDepartureMinutes = this.calculateEarlyDepartureMinutes(checkOutTime, attendance.scheduled_end);

         await attendance.update({
            check_out_time: checkOutTime,
            total_hours_worked: totalHours,
            overtime_hours: overtimeHours,
            early_departure_minutes: earlyDepartureMinutes,
            modified_by: userId,
         });

         await this.logAttendanceActivity('TEACHER_CHECKOUT_UPDATED', attendanceId, userId, {
            check_out_time: checkOutTime,
            total_hours: totalHours,
            overtime_hours: overtimeHours,
         });

         return attendance;
      } catch (error) {
         logger.error('Error updating teacher check-out', {
            attendance_id: attendanceId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get teacher attendance for a specific date range
    * @param {Object} filters - Query filters
    * @returns {Array} Attendance records
    */
   async getTeacherAttendance(filters) {
      try {
         const whereClause = this.buildTeacherAttendanceWhereClause(filters);

         const attendance = await this.TeacherAttendance.findAll({
            where: whereClause,
            include: [
               {
                  model: this.User,
                  as: 'teacher',
                  attributes: ['id', 'first_name', 'last_name', 'employee_id', 'role'],
               },
               {
                  model: this.User,
                  as: 'marker',
                  attributes: ['id', 'first_name', 'last_name'],
               },
               {
                  model: this.User,
                  as: 'originalTeacher',
                  attributes: ['id', 'first_name', 'last_name'],
                  required: false,
               },
            ],
            order: [
               ['attendance_date', 'DESC'],
               ['created_at', 'DESC'],
            ],
         });

         return attendance;
      } catch (error) {
         logger.error('Error fetching teacher attendance', {
            filters,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Calculate teacher attendance and hours statistics
    * @param {Object} filters - Query filters
    * @returns {Object} Attendance and hours statistics
    */
   async getTeacherAttendanceStats(filters) {
      try {
         const whereClause = this.buildTeacherAttendanceWhereClause(filters);

         // Get basic attendance stats
         const totalRecords = await this.TeacherAttendance.count({
            where: {
               ...whereClause,
               is_holiday: false,
            },
         });

         const presentRecords = await this.TeacherAttendance.count({
            where: {
               ...whereClause,
               status: ['PRESENT', 'LATE', 'HALF_DAY'],
               is_holiday: false,
            },
         });

         // Get hours statistics
         const hoursStats = await this.TeacherAttendance.findAll({
            where: {
               ...whereClause,
               total_hours_worked: { [Op.not]: null },
            },
            attributes: [
               [fn('SUM', col('total_hours_worked')), 'totalHours'],
               [fn('SUM', col('overtime_hours')), 'totalOvertime'],
               [fn('AVG', col('total_hours_worked')), 'avgDailyHours'],
               [fn('COUNT', col('id')), 'workingDays'],
            ],
            raw: true,
         });

         // Get leave breakdown
         const leaveBreakdown = await this.TeacherAttendance.findAll({
            where: {
               ...whereClause,
               status: 'LEAVE',
            },
            attributes: ['leave_type', [fn('COUNT', col('id')), 'count']],
            group: ['leave_type'],
            raw: true,
         });

         const attendancePercentage =
            totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100 * 100) / 100 : 0;

         return {
            total_records: totalRecords,
            present_records: presentRecords,
            absent_records: totalRecords - presentRecords,
            attendance_percentage: attendancePercentage,
            hours_stats: {
               total_hours: parseFloat(hoursStats[0]?.totalHours || 0),
               total_overtime: parseFloat(hoursStats[0]?.totalOvertime || 0),
               avg_daily_hours: parseFloat(hoursStats[0]?.avgDailyHours || 0),
               working_days: parseInt(hoursStats[0]?.workingDays || 0),
            },
            leave_breakdown: leaveBreakdown,
         };
      } catch (error) {
         logger.error('Error calculating teacher attendance stats', {
            filters,
            error: error.message,
         });
         throw error;
      }
   }

   // ==================== UTILITY METHODS ====================

   /**
    * Build WHERE clause for student attendance queries
    * @param {Object} filters - Query filters
    * @returns {Object} Sequelize WHERE clause
    */
   buildStudentAttendanceWhereClause(filters) {
      const where = {};

      if (filters.student_id) {
         where.student_id = filters.student_id;
      }

      if (filters.school_id) {
         where.school_id = filters.school_id;
      }

      if (filters.class_id) {
         where.class_id = filters.class_id;
      }

      if (filters.status) {
         where.status = Array.isArray(filters.status) ? filters.status : [filters.status];
      }

      if (filters.start_date && filters.end_date) {
         where.attendance_date = {
            [Op.between]: [filters.start_date, filters.end_date],
         };
      } else if (filters.start_date) {
         where.attendance_date = {
            [Op.gte]: filters.start_date,
         };
      } else if (filters.end_date) {
         where.attendance_date = {
            [Op.lte]: filters.end_date,
         };
      }

      if (filters.academic_year) {
         where.academic_year = filters.academic_year;
      }

      if (filters.is_holiday !== undefined) {
         where.is_holiday = filters.is_holiday;
      }

      return where;
   }

   /**
    * Build WHERE clause for teacher attendance queries
    * @param {Object} filters - Query filters
    * @returns {Object} Sequelize WHERE clause
    */
   buildTeacherAttendanceWhereClause(filters) {
      const where = {};

      if (filters.teacher_id) {
         where.teacher_id = filters.teacher_id;
      }

      if (filters.school_id) {
         where.school_id = filters.school_id;
      }

      if (filters.status) {
         where.status = Array.isArray(filters.status) ? filters.status : [filters.status];
      }

      if (filters.leave_type) {
         where.leave_type = filters.leave_type;
      }

      if (filters.start_date && filters.end_date) {
         where.attendance_date = {
            [Op.between]: [filters.start_date, filters.end_date],
         };
      } else if (filters.start_date) {
         where.attendance_date = {
            [Op.gte]: filters.start_date,
         };
      } else if (filters.end_date) {
         where.attendance_date = {
            [Op.lte]: filters.end_date,
         };
      }

      if (filters.academic_year) {
         where.academic_year = filters.academic_year;
      }

      if (filters.is_holiday !== undefined) {
         where.is_holiday = filters.is_holiday;
      }

      if (filters.is_substitute !== undefined) {
         where.is_substitute = filters.is_substitute;
      }

      return where;
   }

   /**
    * Calculate hours worked between two times
    * @param {string} checkInTime - Check-in time (HH:MM:SS)
    * @param {string} checkOutTime - Check-out time (HH:MM:SS)
    * @returns {number} Hours worked (decimal)
    */
   calculateHoursWorked(checkInTime, checkOutTime) {
      const checkIn = new Date(`1970-01-01T${checkInTime}`);
      const checkOut = new Date(`1970-01-01T${checkOutTime}`);

      const diffMs = checkOut - checkIn;
      const diffHours = diffMs / (1000 * 60 * 60);

      return Math.max(0, Math.round(diffHours * 100) / 100);
   }

   /**
    * Calculate overtime hours
    * @param {number} workedHours - Total hours worked
    * @param {string} scheduledStart - Scheduled start time
    * @param {string} scheduledEnd - Scheduled end time
    * @returns {number} Overtime hours
    */
   calculateOvertimeHours(workedHours, scheduledStart, scheduledEnd) {
      const start = new Date(`1970-01-01T${scheduledStart}`);
      const end = new Date(`1970-01-01T${scheduledEnd}`);
      const scheduledHours = (end - start) / (1000 * 60 * 60);

      return Math.max(0, workedHours - scheduledHours);
   }

   /**
    * Calculate minutes late from scheduled start time
    * @param {string} checkInTime - Actual check-in time
    * @param {string} scheduledStart - Scheduled start time
    * @returns {number} Minutes late
    */
   calculateMinutesLate(checkInTime, scheduledStart) {
      const checkIn = new Date(`1970-01-01T${checkInTime}`);
      const scheduled = new Date(`1970-01-01T${scheduledStart}`);

      const diffMs = checkIn - scheduled;
      const diffMinutes = diffMs / (1000 * 60);

      return Math.max(0, Math.round(diffMinutes));
   }

   /**
    * Calculate early departure minutes
    * @param {string} checkOutTime - Actual check-out time
    * @param {string} scheduledEnd - Scheduled end time
    * @returns {number} Early departure minutes
    */
   calculateEarlyDepartureMinutes(checkOutTime, scheduledEnd) {
      const checkOut = new Date(`1970-01-01T${checkOutTime}`);
      const scheduled = new Date(`1970-01-01T${scheduledEnd}`);

      const diffMs = scheduled - checkOut;
      const diffMinutes = diffMs / (1000 * 60);

      return Math.max(0, Math.round(diffMinutes));
   }

   /**
    * Log attendance activity for audit purposes
    * @param {string} action - Action performed
    * @param {number} recordId - Record ID (if applicable)
    * @param {number} userId - User who performed action
    * @param {Object} metadata - Additional metadata
    */
   async logAttendanceActivity(action, recordId, userId, metadata = {}) {
      try {
         logger.info('Attendance activity logged', {
            action,
            record_id: recordId,
            user_id: userId,
            metadata,
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('Error logging attendance activity', {
            action,
            record_id: recordId,
            error: error.message,
         });
      }
   }

   /**
    * Generate attendance report for a specific period
    * @param {Object} filters - Report filters
    * @returns {Object} Comprehensive attendance report
    */
   async generateAttendanceReport(filters) {
      try {
         logger.info('Generating attendance report', filters);

         const report = {
            report_period: {
               start_date: filters.start_date,
               end_date: filters.end_date,
               school_id: filters.school_id,
            },
            generated_at: new Date().toISOString(),
            student_attendance: null,
            teacher_attendance: null,
         };

         // Generate student attendance report if requested
         if (!filters.type || filters.type === 'student' || filters.type === 'both') {
            const studentAttendance = await this.getStudentAttendance(filters);
            const studentStats = await this.getStudentAttendanceStats(filters);

            report.student_attendance = {
               records: studentAttendance,
               statistics: studentStats,
            };
         }

         // Generate teacher attendance report if requested
         if (!filters.type || filters.type === 'teacher' || filters.type === 'both') {
            const teacherAttendance = await this.getTeacherAttendance(filters);
            const teacherStats = await this.getTeacherAttendanceStats(filters);

            report.teacher_attendance = {
               records: teacherAttendance,
               statistics: teacherStats,
            };
         }

         logger.info('Attendance report generated successfully', {
            school_id: filters.school_id,
            period: `${filters.start_date} to ${filters.end_date}`,
         });

         return report;
      } catch (error) {
         logger.error('Error generating attendance report', {
            filters,
            error: error.message,
         });
         throw error;
      }
   }
}

module.exports = AttendanceService;
