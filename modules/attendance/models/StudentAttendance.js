const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * Student Attendance Model
 * Tracks daily attendance for students
 * Core functionality for daily school operations
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineStudentAttendance(sequelize) {
   const StudentAttendance = sequelize.define(
      'StudentAttendance',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'students',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to student record',
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
            comment: 'Reference to school - for multi-school queries',
         },
         class_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'classes',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Class at time of attendance (students can change classes)',
         },
         section_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'sections',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Section at time of attendance (optional)',
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
            values: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'],
            allowNull: false,
            defaultValue: 'PRESENT',
            comment: 'Attendance status for the day',
         },
         time_in: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Time student arrived (HH:MM:SS format)',
         },
         time_out: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Time student departed (HH:MM:SS format)',
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
         reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for absence or late arrival',
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
            comment: 'Teacher/Admin who marked attendance',
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
            comment: 'Whether this date was a holiday (affects calculations)',
         },
         parent_notified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether parent has been notified of absence',
         },
         notification_sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when parent notification was sent',
         },
         additional_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional attendance information (medical certificates, etc.)',
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
         tableName: 'student_attendance',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary composite index for fast daily queries
            {
               name: 'idx_student_attendance_date',
               fields: ['school_id', 'attendance_date'],
            },
            // Student-specific queries
            {
               name: 'idx_student_attendance_student',
               fields: ['student_id', 'attendance_date'],
            },
            // Class-wise attendance reports
            {
               name: 'idx_student_attendance_class',
               fields: ['class_id', 'section_id', 'attendance_date'],
            },
            // Academic year reports
            {
               name: 'idx_student_attendance_year',
               fields: ['academic_year', 'school_id'],
            },
            // Status-based queries (absent students, etc.)
            {
               name: 'idx_student_attendance_status',
               fields: ['status', 'attendance_date', 'school_id'],
            },
            // Parent notification tracking
            {
               name: 'idx_student_attendance_notification',
               fields: ['parent_notified', 'notification_sent_at'],
            },
         ],
         // Unique constraint: one attendance record per student per date
         constraints: [
            {
               name: 'unique_student_date_attendance',
               unique: true,
               fields: ['student_id', 'attendance_date'],
            },
         ],
      }
   );

   // Model associations will be defined in the main model index
   StudentAttendance.associate = function (models) {
      // Belongs to Student
      StudentAttendance.belongsTo(models.Student, {
         foreignKey: 'student_id',
         as: 'student',
         onDelete: 'CASCADE',
      });

      // Belongs to School
      StudentAttendance.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to Class
      StudentAttendance.belongsTo(models.Class, {
         foreignKey: 'class_id',
         as: 'class',
         onDelete: 'CASCADE',
      });

      // Belongs to Section (optional)
      StudentAttendance.belongsTo(models.Section, {
         foreignKey: 'section_id',
         as: 'section',
         onDelete: 'SET NULL',
      });

      // Belongs to User (marked by)
      StudentAttendance.belongsTo(models.User, {
         foreignKey: 'marked_by',
         as: 'marker',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (modified by)
      StudentAttendance.belongsTo(models.User, {
         foreignKey: 'modified_by',
         as: 'modifier',
         onDelete: 'RESTRICT',
      });
   };

   // Instance methods for business logic
   StudentAttendance.prototype.isPresent = function () {
      return this.status === 'PRESENT';
   };

   StudentAttendance.prototype.isAbsent = function () {
      return ['ABSENT', 'SICK'].includes(this.status);
   };

   StudentAttendance.prototype.isLate = function () {
      return this.status === 'LATE' || this.minutes_late > 0;
   };

   StudentAttendance.prototype.needsParentNotification = function () {
      return this.isAbsent() && !this.parent_notified && !this.is_holiday;
   };

   // Class methods for calculations
   StudentAttendance.calculateAttendancePercentage = async function (studentId, startDate, endDate) {
      try {
         const { Op } = require('sequelize');

         const totalRecords = await this.count({
            where: {
               student_id: studentId,
               attendance_date: {
                  [Op.between]: [startDate, endDate],
               },
               is_holiday: false,
            },
         });

         const presentRecords = await this.count({
            where: {
               student_id: studentId,
               attendance_date: {
                  [Op.between]: [startDate, endDate],
               },
               status: ['PRESENT', 'LATE', 'EXCUSED'],
               is_holiday: false,
            },
         });

         if (totalRecords === 0) return 0;
         return Math.round((presentRecords / totalRecords) * 100 * 100) / 100; // Round to 2 decimals
      } catch (error) {
         logger.error('Error calculating attendance percentage', {
            student_id: studentId,
            start_date: startDate,
            end_date: endDate,
            error: error.message,
         });
         throw error;
      }
   };

   // Validation schemas for API endpoints
   StudentAttendance.validationSchemas = {
      create: {
         student_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         school_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         class_id: {
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
            enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'],
         },
         time_in: {
            required: false,
            type: 'time',
         },
         minutes_late: {
            required: false,
            type: 'integer',
            min: 0,
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
            enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'],
         },
         time_in: {
            required: false,
            type: 'time',
         },
         time_out: {
            required: false,
            type: 'time',
         },
         minutes_late: {
            required: false,
            type: 'integer',
            min: 0,
         },
         reason: {
            required: false,
            type: 'string',
            maxLength: 500,
         },
      },
   };

   return StudentAttendance;
}

/**
 * Student Attendance Validation Schemas
 * Following Q59-ENFORCED pattern - reusable across API and web routes
 */
const Joi = require('joi');

const studentAttendanceValidationSchemas = {
   markAttendance: Joi.object({
      // Required fields
      student_id: Joi.number().integer().positive().required().messages({
         'number.base': 'Student ID must be a number',
         'number.positive': 'Student ID must be positive',
         'any.required': 'Student ID is required',
      }),

      school_id: Joi.number().integer().positive().required().messages({
         'number.base': 'School ID must be a number',
         'number.positive': 'School ID must be positive',
         'any.required': 'School ID is required',
      }),

      class_id: Joi.number().integer().positive().required().messages({
         'number.base': 'Class ID must be a number',
         'number.positive': 'Class ID must be positive',
         'any.required': 'Class ID is required',
      }),

      attendance_date: Joi.date().max('now').required().messages({
         'date.max': 'Attendance cannot be marked for future dates',
         'any.required': 'Attendance date is required',
      }),

      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK').required().messages({
         'any.only': 'Status must be PRESENT, ABSENT, LATE, EXCUSED, or SICK',
         'any.required': 'Attendance status is required',
      }),

      academic_year: Joi.number().integer().min(2000).max(2100).required().messages({
         'number.min': 'Academic year must be 2000 or later',
         'number.max': 'Academic year must be before 2100',
         'any.required': 'Academic year is required',
      }),

      // Optional fields
      section_id: Joi.number().integer().positive().allow(null).optional(),

      time_in: Joi.string()
         .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
         .allow(null, '')
         .optional()
         .messages({
            'string.pattern.base': 'Time in must be in format HH:MM:SS',
         }),

      time_out: Joi.string()
         .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
         .allow(null, '')
         .optional()
         .messages({
            'string.pattern.base': 'Time out must be in format HH:MM:SS',
         }),

      minutes_late: Joi.number().integer().min(0).max(1440).allow(null).optional().messages({
         'number.min': 'Minutes late cannot be negative',
         'number.max': 'Minutes late cannot exceed 24 hours (1440 minutes)',
      }),

      reason: Joi.string().trim().max(500).allow(null, '').optional(),
      is_holiday: Joi.boolean().optional(),
      additional_info: Joi.object().allow(null).optional(),
   }),

   bulkMarkAttendance: Joi.object({
      // Required bulk parameters
      school_id: Joi.number().integer().positive().required(),
      class_id: Joi.number().integer().positive().required(),
      attendance_date: Joi.date().max('now').required(),
      academic_year: Joi.number().integer().min(2000).max(2100).required(),

      // Optional bulk parameters
      section_id: Joi.number().integer().positive().allow(null).optional(),
      is_holiday: Joi.boolean().optional(),

      // Array of student attendance records
      attendance_records: Joi.array()
         .items(
            Joi.object({
               student_id: Joi.number().integer().positive().required(),
               status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK').required(),
               time_in: Joi.string()
                  .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
                  .allow(null, '')
                  .optional(),
               time_out: Joi.string()
                  .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
                  .allow(null, '')
                  .optional(),
               minutes_late: Joi.number().integer().min(0).max(1440).allow(null).optional(),
               reason: Joi.string().trim().max(500).allow(null, '').optional(),
               additional_info: Joi.object().allow(null).optional(),
            })
         )
         .min(1)
         .max(100)
         .required()
         .messages({
            'array.min': 'At least one attendance record is required',
            'array.max': 'Cannot mark attendance for more than 100 students at once',
         }),
   }),

   updateAttendance: Joi.object({
      // Prevent updating core identity fields
      id: Joi.forbidden().messages({
         'any.unknown': 'Attendance ID cannot be updated',
      }),
      student_id: Joi.forbidden().messages({
         'any.unknown': 'Student ID cannot be updated',
      }),
      attendance_date: Joi.forbidden().messages({
         'any.unknown': 'Attendance date cannot be updated',
      }),

      // Allow updating attendance details
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK').optional(),

      time_in: Joi.string()
         .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
         .allow(null, '')
         .optional(),
      time_out: Joi.string()
         .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
         .allow(null, '')
         .optional(),
      minutes_late: Joi.number().integer().min(0).max(1440).allow(null).optional(),
      reason: Joi.string().trim().max(500).allow(null, '').optional(),
      additional_info: Joi.object().allow(null).optional(),

      // Parent notification updates
      parent_notified: Joi.boolean().optional(),
   }),

   attendanceQuery: Joi.object({
      student_id: Joi.number().integer().positive().optional(),
      school_id: Joi.number().integer().positive().optional(),
      class_id: Joi.number().integer().positive().optional(),
      section_id: Joi.number().integer().positive().allow(null).optional(),
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK').optional(),
      academic_year: Joi.number().integer().min(2000).max(2100).optional(),

      start_date: Joi.date().optional(),
      end_date: Joi.date().min(Joi.ref('start_date')).optional().messages({
         'date.min': 'End date must be after start date',
      }),

      // Pagination
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(1000).optional(),

      // Filters
      is_holiday: Joi.boolean().optional(),
      parent_notified: Joi.boolean().optional(),
   }),
};

module.exports = { defineStudentAttendance, studentAttendanceValidationSchemas };
