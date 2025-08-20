const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * Teacher Attendance Model
 * Tracks daily attendance for teachers and staff
 * Essential for payroll and administrative reporting
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineTeacherAttendance(sequelize) {
   const TeacherAttendance = sequelize.define(
      'TeacherAttendance',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to teacher/staff user record',
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'schools',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to school',
         },
         attendance_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date of attendance (YYYY-MM-DD format)',
            validate: {
               isDate: {
                  msg: 'Attendance date must be a valid date',
               },
               notFuture(value) {
                  if (new Date(value) > new Date()) {
                     throw new Error('Attendance cannot be marked for future dates');
                  }
               },
            },
         },
         status: {
            type: DataTypes.ENUM,
            values: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'LEAVE', 'HALF_DAY'],
            allowNull: false,
            defaultValue: 'PRESENT',
            comment: 'Attendance status for the day',
         },
         check_in_time: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Time teacher checked in (HH:MM:SS format)',
         },
         check_out_time: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Time teacher checked out (HH:MM:SS format)',
         },
         scheduled_start: {
            type: DataTypes.TIME,
            allowNull: false,
            defaultValue: '08:00:00',
            comment: 'Scheduled start time for this teacher',
         },
         scheduled_end: {
            type: DataTypes.TIME,
            allowNull: false,
            defaultValue: '16:00:00',
            comment: 'Scheduled end time for this teacher',
         },
         minutes_late: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Minutes late from scheduled start time',
            validate: {
               min: {
                  args: [0],
                  msg: 'Minutes late cannot be negative',
               },
            },
         },
         early_departure_minutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: 'Minutes left early from scheduled end time',
            validate: {
               min: {
                  args: [0],
                  msg: 'Early departure minutes cannot be negative',
               },
            },
         },
         total_hours_worked: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
            comment: 'Total hours worked (calculated from check-in/out times)',
            validate: {
               min: {
                  args: [0],
                  msg: 'Hours worked cannot be negative',
               },
               max: {
                  args: [24],
                  msg: 'Hours worked cannot exceed 24 hours',
               },
            },
         },
         overtime_hours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
            defaultValue: 0,
            comment: 'Overtime hours beyond scheduled time',
         },
         leave_type: {
            type: DataTypes.ENUM,
            values: ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'OTHER'],
            allowNull: true,
            comment: 'Type of leave if status is LEAVE',
         },
         reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for absence, leave, or late arrival',
         },
         marked_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'Admin who marked attendance (or self if self-marked)',
         },
         marked_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Timestamp when attendance was marked',
         },
         modified_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'User who last modified the attendance record',
         },
         academic_year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Academic year for the attendance (YYYY format)',
            validate: {
               min: {
                  args: [2000],
                  msg: 'Academic year must be 2000 or later',
               },
               max: {
                  args: [2100],
                  msg: 'Academic year must be before 2100',
               },
            },
         },
         is_holiday: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this date was a holiday (affects payroll calculations)',
         },
         is_substitute: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this teacher was substituting for another teacher',
         },
         substituting_for: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Teacher being substituted for (if applicable)',
         },
         location: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Work location (classroom, office, field trip, etc.)',
         },
         device_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Device information for digital attendance tracking',
         },
         additional_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional attendance information (medical certificates, approvals, etc.)',
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'teacher_attendance',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary composite index for daily queries
            {
               name: 'idx_teacher_attendance_date',
               fields: ['school_id', 'attendance_date'],
            },
            // Teacher-specific queries
            {
               name: 'idx_teacher_attendance_teacher',
               fields: ['teacher_id', 'attendance_date'],
            },
            // Academic year reports
            {
               name: 'idx_teacher_attendance_year',
               fields: ['academic_year', 'school_id'],
            },
            // Status-based queries (absent teachers, etc.)
            {
               name: 'idx_teacher_attendance_status',
               fields: ['status', 'attendance_date', 'school_id'],
            },
            // Leave management queries
            {
               name: 'idx_teacher_attendance_leave',
               fields: ['leave_type', 'attendance_date', 'school_id'],
            },
            // Payroll calculation queries
            {
               name: 'idx_teacher_attendance_hours',
               fields: ['total_hours_worked', 'overtime_hours', 'attendance_date'],
            },
         ],
         // Unique constraint: one attendance record per teacher per date
         constraints: [
            {
               name: 'unique_teacher_date_attendance',
               unique: true,
               fields: ['teacher_id', 'attendance_date'],
            },
         ],
      }
   );

   // Model associations
   TeacherAttendance.associate = function (models) {
      // Belongs to User (Teacher)
      TeacherAttendance.belongsTo(models.User, {
         foreignKey: 'teacher_id',
         as: 'teacher',
         onDelete: 'CASCADE',
      });

      // Belongs to School
      TeacherAttendance.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to User (marked by)
      TeacherAttendance.belongsTo(models.User, {
         foreignKey: 'marked_by',
         as: 'marker',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (modified by)
      TeacherAttendance.belongsTo(models.User, {
         foreignKey: 'modified_by',
         as: 'modifier',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (substituting for)
      TeacherAttendance.belongsTo(models.User, {
         foreignKey: 'substituting_for',
         as: 'originalTeacher',
         onDelete: 'SET NULL',
      });
   };

   // Instance methods for business logic
   TeacherAttendance.prototype.isPresent = function () {
      return ['PRESENT', 'LATE'].includes(this.status);
   };

   TeacherAttendance.prototype.isAbsent = function () {
      return ['ABSENT', 'SICK', 'LEAVE'].includes(this.status);
   };

   TeacherAttendance.prototype.isLate = function () {
      return this.status === 'LATE' || this.minutes_late > 0;
   };

   TeacherAttendance.prototype.isOnLeave = function () {
      return this.status === 'LEAVE' && this.leave_type;
   };

   TeacherAttendance.prototype.calculateWorkedHours = function () {
      if (!this.check_in_time || !this.check_out_time) {
         return 0;
      }

      const checkIn = new Date(`1970-01-01T${this.check_in_time}`);
      const checkOut = new Date(`1970-01-01T${this.check_out_time}`);

      const diffMs = checkOut - checkIn;
      const diffHours = diffMs / (1000 * 60 * 60);

      return Math.max(0, Math.round(diffHours * 100) / 100); // Round to 2 decimals
   };

   TeacherAttendance.prototype.calculateOvertimeHours = function () {
      const workedHours = this.calculateWorkedHours();
      const scheduledStart = new Date(`1970-01-01T${this.scheduled_start}`);
      const scheduledEnd = new Date(`1970-01-01T${this.scheduled_end}`);
      const scheduledHours = (scheduledEnd - scheduledStart) / (1000 * 60 * 60);

      return Math.max(0, workedHours - scheduledHours);
   };

   // Class methods for calculations
   TeacherAttendance.calculateAttendancePercentage = async function (teacherId, startDate, endDate) {
      try {
         const { Op } = require('sequelize');

         const totalRecords = await this.count({
            where: {
               teacher_id: teacherId,
               attendance_date: {
                  [Op.between]: [startDate, endDate],
               },
               is_holiday: false,
            },
         });

         const presentRecords = await this.count({
            where: {
               teacher_id: teacherId,
               attendance_date: {
                  [Op.between]: [startDate, endDate],
               },
               status: ['PRESENT', 'LATE', 'HALF_DAY'],
               is_holiday: false,
            },
         });

         if (totalRecords === 0) return 0;
         return Math.round((presentRecords / totalRecords) * 100 * 100) / 100; // Round to 2 decimals
      } catch (error) {
         logger.error('Error calculating teacher attendance percentage', {
            teacher_id: teacherId,
            start_date: startDate,
            end_date: endDate,
            error: error.message,
         });
         throw error;
      }
   };

   TeacherAttendance.calculateTotalHours = async function (teacherId, startDate, endDate) {
      try {
         const { Op, fn, col } = require('sequelize');

         const result = await this.findAll({
            attributes: [
               [fn('SUM', col('total_hours_worked')), 'totalHours'],
               [fn('SUM', col('overtime_hours')), 'totalOvertime'],
            ],
            where: {
               teacher_id: teacherId,
               attendance_date: {
                  [Op.between]: [startDate, endDate],
               },
               total_hours_worked: {
                  [Op.not]: null,
               },
            },
            raw: true,
         });

         return {
            totalHours: parseFloat(result[0]?.totalHours || 0),
            totalOvertime: parseFloat(result[0]?.totalOvertime || 0),
         };
      } catch (error) {
         logger.error('Error calculating teacher total hours', {
            teacher_id: teacherId,
            start_date: startDate,
            end_date: endDate,
            error: error.message,
         });
         throw error;
      }
   };

   // Validation schemas for API endpoints
   TeacherAttendance.validationSchemas = {
      create: {
         teacher_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         school_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         attendance_date: {
            required: true,
            type: 'date',
         },
         status: {
            required: true,
            type: 'string',
            enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'LEAVE', 'HALF_DAY'],
         },
         check_in_time: {
            required: false,
            type: 'time',
         },
         leave_type: {
            required: false,
            type: 'string',
            enum: ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'OTHER'],
         },
         reason: {
            required: false,
            type: 'string',
            maxLength: 500,
         },
      },
      update: {
         status: {
            required: false,
            type: 'string',
            enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'LEAVE', 'HALF_DAY'],
         },
         check_in_time: {
            required: false,
            type: 'time',
         },
         check_out_time: {
            required: false,
            type: 'time',
         },
         leave_type: {
            required: false,
            type: 'string',
            enum: ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'OTHER'],
         },
         reason: {
            required: false,
            type: 'string',
            maxLength: 500,
         },
      },
   };

   return TeacherAttendance;
}

module.exports = defineTeacherAttendance;
