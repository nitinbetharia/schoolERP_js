/**
 * AttendanceRecord Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * AttendanceRecord represents daily attendance records for students
 * - Tracks daily attendance with all status types (Present/Absent/Late/Half-day/Excused)
 * - Supports bulk operations for class-wise attendance marking
 * - Contains check-in/check-out times and remarks
 * - Used for attendance reports and analytics
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * AttendanceRecord Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} AttendanceRecord model
 */
function createAttendanceRecordModel(sequelize) {
  const AttendanceRecord = sequelize.define(
    'AttendanceRecord',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Student reference
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'student_id',
        references: {
          model: 'students',
          key: 'id'
        }
      },

      // Attendance date
      attendanceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'attendance_date'
      },

      // Attendance status
      status: {
        type: DataTypes.ENUM(...constants.ATTENDANCE_STATUS.ALL_STATUS),
        allowNull: false,
        validate: {
          isIn: [constants.ATTENDANCE_STATUS.ALL_STATUS]
        }
      },

      // Time tracking
      checkInTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'check_in_time'
      },

      checkOutTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'check_out_time'
      },

      // Additional information
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Marking information
      markedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'marked_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      markedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'marked_at'
      },

      // Late arrival details
      lateMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'late_minutes',
        validate: {
          min: 0,
          max: 1440 // 24 hours in minutes
        }
      },

      // Excuse/Leave details
      excuseReason: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'excuse_reason'
      },

      approvedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at'
      },

      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional attendance context like temperature, etc.'
      },

      // Timestamps
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      // Model options
      tableName: 'attendance_records',
      timestamps: false, // Custom timestamp handling
      underscored: true,
      
      // Indexes for performance
      indexes: [
        {
          fields: ['student_id', 'attendance_date']
        },
        {
          fields: ['attendance_date']
        },
        {
          fields: ['status']
        },
        {
          fields: ['marked_by_user_id']
        },
        {
          // Unique constraint - one record per student per date
          unique: true,
          fields: ['student_id', 'attendance_date']
        },
        {
          // Composite index for attendance reports
          fields: ['attendance_date', 'status']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  AttendanceRecord.associate = (models) => {
    // AttendanceRecord belongs to Student
    if (models.Student) {
      AttendanceRecord.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student',
        onDelete: 'CASCADE'
      });
    }

    // AttendanceRecord belongs to User (marker)
    if (models.User) {
      AttendanceRecord.belongsTo(models.User, {
        foreignKey: 'markedByUserId',
        as: 'markedBy',
        onDelete: 'RESTRICT'
      });

      // AttendanceRecord belongs to User (approver)
      AttendanceRecord.belongsTo(models.User, {
        foreignKey: 'approvedByUserId',
        as: 'approvedBy',
        onDelete: 'SET NULL'
      });
    }
  };

  // Instance methods
  AttendanceRecord.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Format time fields
    if (values.checkInTime) {
      values.checkInTime = values.checkInTime;
    }
    if (values.checkOutTime) {
      values.checkOutTime = values.checkOutTime;
    }
    
    // Parse metadata if it's a string
    if (values.metadata && typeof values.metadata === 'string') {
      values.metadata = JSON.parse(values.metadata);
    }
    
    return values;
  };

  AttendanceRecord.prototype.isLate = function() {
    return this.status === constants.ATTENDANCE_STATUS.LATE;
  };

  AttendanceRecord.prototype.isPresent = function() {
    return [
      constants.ATTENDANCE_STATUS.PRESENT,
      constants.ATTENDANCE_STATUS.LATE,
      constants.ATTENDANCE_STATUS.HALF_DAY
    ].includes(this.status);
  };

  AttendanceRecord.prototype.calculateLateMinutes = function(schoolStartTime = '09:00') {
    if (!this.checkInTime) return 0;
    
    const [schoolHour, schoolMinute] = schoolStartTime.split(':').map(Number);
    const [checkHour, checkMinute] = this.checkInTime.split(':').map(Number);
    
    const schoolMinutes = schoolHour * 60 + schoolMinute;
    const checkMinutes = checkHour * 60 + checkMinute;
    
    return Math.max(0, checkMinutes - schoolMinutes);
  };

  // Class methods for bulk operations
  AttendanceRecord.markBulkAttendance = async function(attendanceData, markedByUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const records = [];
      
      for (const record of attendanceData) {
        const existing = await this.findOne({
          where: {
            studentId: record.studentId,
            attendanceDate: record.attendanceDate
          },
          transaction
        });

        const recordData = {
          ...record,
          markedByUserId,
          markedAt: new Date(),
          updatedAt: new Date()
        };

        if (existing) {
          await existing.update(recordData, { transaction });
          records.push(existing);
        } else {
          const newRecord = await this.create(recordData, { transaction });
          records.push(newRecord);
        }
      }
      
      await transaction.commit();
      return records;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  AttendanceRecord.findByStudent = async function(studentId, options = {}) {
    const where = { studentId };
    
    if (options.startDate && options.endDate) {
      where.attendanceDate = {
        [sequelize.Op.between]: [options.startDate, options.endDate]
      };
    }
    
    if (options.status) {
      where.status = options.status;
    }

    return await this.findAll({
      where,
      order: [['attendanceDate', 'DESC']],
      limit: options.limit || 100,
      include: options.include || ['markedBy']
    });
  };

  AttendanceRecord.findByClass = async function(classId, sectionId, date, options = {}) {
    // Get all students in the class/section
    const Student = sequelize.models.Student;
    if (!Student) return [];
    
    const students = await Student.findAll({
      where: {
        classId,
        sectionId: sectionId || { [sequelize.Op.ne]: null },
        status: constants.STUDENT_STATUS.ACTIVE
      }
    });
    
    const studentIds = students.map(s => s.id);
    
    return await this.findAll({
      where: {
        studentId: { [sequelize.Op.in]: studentIds },
        attendanceDate: date
      },
      include: ['student', 'markedBy'],
      order: [['student', 'rollNumber', 'ASC']]
    });
  };

  AttendanceRecord.getAttendanceSummary = async function(studentId, startDate, endDate) {
    const records = await this.findAll({
      where: {
        studentId,
        attendanceDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: ['status'],
      raw: true
    });

    const summary = {
      totalDays: records.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      excused: 0
    };

    records.forEach(record => {
      switch (record.status) {
        case constants.ATTENDANCE_STATUS.PRESENT:
          summary.present++;
          break;
        case constants.ATTENDANCE_STATUS.ABSENT:
          summary.absent++;
          break;
        case constants.ATTENDANCE_STATUS.LATE:
          summary.late++;
          break;
        case constants.ATTENDANCE_STATUS.HALF_DAY:
          summary.halfDay++;
          break;
        case constants.ATTENDANCE_STATUS.EXCUSED:
          summary.excused++;
          break;
      }
    });

    summary.attendancePercentage = summary.totalDays > 0 
      ? ((summary.present + summary.late + summary.halfDay * 0.5) / summary.totalDays * 100).toFixed(2)
      : 0;

    return summary;
  };

  AttendanceRecord.getClassAttendanceSummary = async function(classId, sectionId, date) {
    // Get all students in the class/section
    const Student = sequelize.models.Student;
    if (!Student) return { totalStudents: 0, present: 0, absent: 0, late: 0, halfDay: 0, excused: 0 };
    
    const students = await Student.findAll({
      where: {
        classId,
        sectionId: sectionId || { [sequelize.Op.ne]: null },
        status: constants.STUDENT_STATUS.ACTIVE
      }
    });
    
    const totalStudents = students.length;
    const studentIds = students.map(s => s.id);
    
    const records = await this.findAll({
      where: {
        studentId: { [sequelize.Op.in]: studentIds },
        attendanceDate: date
      },
      attributes: ['status'],
      raw: true
    });

    const summary = {
      totalStudents,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      excused: 0,
      notMarked: totalStudents - records.length
    };

    records.forEach(record => {
      switch (record.status) {
        case constants.ATTENDANCE_STATUS.PRESENT:
          summary.present++;
          break;
        case constants.ATTENDANCE_STATUS.ABSENT:
          summary.absent++;
          break;
        case constants.ATTENDANCE_STATUS.LATE:
          summary.late++;
          break;
        case constants.ATTENDANCE_STATUS.HALF_DAY:
          summary.halfDay++;
          break;
        case constants.ATTENDANCE_STATUS.EXCUSED:
          summary.excused++;
          break;
      }
    });

    summary.attendancePercentage = totalStudents > 0 
      ? ((summary.present + summary.late + summary.halfDay * 0.5) / totalStudents * 100).toFixed(2)
      : 0;

    return summary;
  };

  return AttendanceRecord;
}

// Q19 Compliance: Joi validation schemas
const attendanceRecordValidationSchemas = {
  create: Joi.object({
    studentId: Joi.number().integer().min(1).required(),
    attendanceDate: Joi.date().required(),
    status: Joi.string().valid(...constants.ATTENDANCE_STATUS.ALL_STATUS).required(),
    checkInTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    checkOutTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    remarks: Joi.string().max(500).optional(),
    lateMinutes: Joi.number().integer().min(0).max(1440).optional(),
    excuseReason: Joi.string().max(200).optional(),
    metadata: Joi.object().optional()
  }),

  update: Joi.object({
    status: Joi.string().valid(...constants.ATTENDANCE_STATUS.ALL_STATUS).optional(),
    checkInTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    checkOutTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    remarks: Joi.string().max(500).optional(),
    lateMinutes: Joi.number().integer().min(0).max(1440).optional(),
    excuseReason: Joi.string().max(200).optional(),
    approvedByUserId: Joi.number().integer().min(1).optional(),
    metadata: Joi.object().optional()
  }),

  bulkCreate: Joi.object({
    attendanceData: Joi.array().items(
      Joi.object({
        studentId: Joi.number().integer().min(1).required(),
        attendanceDate: Joi.date().required(),
        status: Joi.string().valid(...constants.ATTENDANCE_STATUS.ALL_STATUS).required(),
        checkInTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        checkOutTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        remarks: Joi.string().max(500).optional(),
        lateMinutes: Joi.number().integer().min(0).max(1440).optional(),
        excuseReason: Joi.string().max(200).optional()
      })
    ).required().min(1),
    markedByUserId: Joi.number().integer().min(1).required()
  }),

  query: Joi.object({
    studentId: Joi.number().integer().min(1).optional(),
    classId: Joi.number().integer().min(1).optional(),
    sectionId: Joi.number().integer().min(1).optional(),
    attendanceDate: Joi.date().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid(...constants.ATTENDANCE_STATUS.ALL_STATUS).optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  })
};

module.exports = createAttendanceRecordModel;
module.exports.validationSchemas = attendanceRecordValidationSchemas;
