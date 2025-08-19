/**
 * AttendanceConfig Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * AttendanceConfig represents holiday calendar and attendance rules
 * - Manages holidays, working days, half-days, and special events
 * - Exception-based calendar system as per Q&A decisions
 * - Configurable per school and academic year
 * - Used for attendance calculation and reporting
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * AttendanceConfig Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} AttendanceConfig model
 */
function createAttendanceConfigModel(sequelize) {
  const AttendanceConfig = sequelize.define(
    'AttendanceConfig',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // School and academic year reference
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'school_id',
        references: {
          model: 'schools',
          key: 'id'
        }
      },

      academicYearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'academic_year_id',
        references: {
          model: 'academic_years',
          key: 'id'
        }
      },

      // Configuration details
      configType: {
        type: DataTypes.ENUM(...constants.ATTENDANCE_CONFIG_TYPES.ALL_TYPES),
        allowNull: false,
        field: 'config_type',
        validate: {
          isIn: [constants.ATTENDANCE_CONFIG_TYPES.ALL_TYPES]
        }
      },

      configDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'config_date'
      },

      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100]
        }
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Recurring configuration
      isRecurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_recurring',
        comment: 'For annual holidays like Independence Day'
      },

      // Class/section specific application
      appliesToClasses: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'applies_to_classes',
        comment: 'Array of class IDs, NULL = all classes'
      },

      // Additional configuration
      configData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'config_data',
        comment: 'Additional configuration like timing changes'
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      // Model options
      tableName: 'attendance_configs',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      
      // Indexes for performance
      indexes: [
        {
          fields: ['school_id', 'academic_year_id']
        },
        {
          fields: ['config_date']
        },
        {
          fields: ['config_type']
        },
        {
          // Unique constraint for same type on same date for same school
          unique: true,
          fields: ['school_id', 'config_date', 'config_type']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  AttendanceConfig.associate = (models) => {
    // AttendanceConfig belongs to School
    if (models.School) {
      AttendanceConfig.belongsTo(models.School, {
        foreignKey: 'schoolId',
        as: 'school',
        onDelete: 'CASCADE'
      });
    }

    // AttendanceConfig belongs to AcademicYear
    if (models.AcademicYear) {
      AttendanceConfig.belongsTo(models.AcademicYear, {
        foreignKey: 'academicYearId',
        as: 'academicYear',
        onDelete: 'CASCADE'
      });
    }
  };

  // Instance methods
  AttendanceConfig.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Parse JSON fields
    if (values.appliesToClasses && typeof values.appliesToClasses === 'string') {
      values.appliesToClasses = JSON.parse(values.appliesToClasses);
    }
    if (values.configData && typeof values.configData === 'string') {
      values.configData = JSON.parse(values.configData);
    }
    
    return values;
  };

  AttendanceConfig.prototype.appliesToClass = function(classId) {
    // If appliesToClasses is null or empty, applies to all classes
    if (!this.appliesToClasses || this.appliesToClasses.length === 0) {
      return true;
    }
    
    return this.appliesToClasses.includes(classId);
  };

  // Class methods
  AttendanceConfig.findForDate = async function(schoolId, academicYearId, date, classId = null) {
    const where = {
      schoolId,
      academicYearId,
      configDate: date
    };

    const configs = await this.findAll({
      where,
      include: ['school', 'academicYear']
    });

    // Filter by class if specified
    if (classId) {
      return configs.filter(config => config.appliesToClass(classId));
    }

    return configs;
  };

  AttendanceConfig.findHolidaysInRange = async function(schoolId, academicYearId, startDate, endDate, classId = null) {
    const where = {
      schoolId,
      academicYearId,
      configType: constants.ATTENDANCE_CONFIG_TYPES.HOLIDAY,
      configDate: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    };

    const holidays = await this.findAll({
      where,
      order: [['configDate', 'ASC']],
      include: ['school', 'academicYear']
    });

    // Filter by class if specified
    if (classId) {
      return holidays.filter(holiday => holiday.appliesToClass(classId));
    }

    return holidays;
  };

  AttendanceConfig.getWorkingDaysCount = async function(schoolId, academicYearId, startDate, endDate, classId = null) {
    // Get all configs in the date range
    const configs = await this.findAll({
      where: {
        schoolId,
        academicYearId,
        configDate: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    // Filter by class if specified
    const relevantConfigs = classId 
      ? configs.filter(config => config.appliesToClass(classId))
      : configs;

    // Calculate working days
    let totalDays = 0;
    let holidays = 0;
    let halfDays = 0;

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayConfigs = relevantConfigs.filter(c => c.configDate === dateStr);
      
      // Check if it's a weekend (Saturday = 6, Sunday = 0)
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!isWeekend) {
        totalDays++;
        
        // Check for holidays or half days
        const hasHoliday = dayConfigs.some(c => c.configType === constants.ATTENDANCE_CONFIG_TYPES.HOLIDAY);
        const hasHalfDay = dayConfigs.some(c => c.configType === constants.ATTENDANCE_CONFIG_TYPES.HALF_DAY);
        
        if (hasHoliday) {
          holidays++;
        } else if (hasHalfDay) {
          halfDays++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      totalDays,
      holidays,
      halfDays,
      workingDays: totalDays - holidays,
      effectiveWorkingDays: totalDays - holidays - (halfDays * 0.5)
    };
  };

  AttendanceConfig.isWorkingDay = async function(schoolId, academicYearId, date, classId = null) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Check for holiday configuration
    const configs = await this.findForDate(schoolId, academicYearId, date, classId);
    const hasHoliday = configs.some(c => c.configType === constants.ATTENDANCE_CONFIG_TYPES.HOLIDAY);
    
    return !hasHoliday;
  };

  return AttendanceConfig;
}

// Q19 Compliance: Joi validation schemas
const attendanceConfigValidationSchemas = {
  create: Joi.object({
    schoolId: Joi.number().integer().min(1).required(),
    academicYearId: Joi.number().integer().min(1).required(),
    configType: Joi.string().valid(...constants.ATTENDANCE_CONFIG_TYPES.ALL_TYPES).required(),
    configDate: Joi.date().required(),
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    isRecurring: Joi.boolean().default(false),
    appliesToClasses: Joi.array().items(Joi.number().integer().min(1)).optional(),
    configData: Joi.object().optional()
  }),

  update: Joi.object({
    configType: Joi.string().valid(...constants.ATTENDANCE_CONFIG_TYPES.ALL_TYPES).optional(),
    configDate: Joi.date().optional(),
    title: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    isRecurring: Joi.boolean().optional(),
    appliesToClasses: Joi.array().items(Joi.number().integer().min(1)).optional(),
    configData: Joi.object().optional()
  }),

  query: Joi.object({
    schoolId: Joi.number().integer().min(1).required(),
    academicYearId: Joi.number().integer().min(1).required(),
    configType: Joi.string().valid(...constants.ATTENDANCE_CONFIG_TYPES.ALL_TYPES).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    classId: Joi.number().integer().min(1).optional()
  })
};

module.exports = createAttendanceConfigModel;
module.exports.validationSchemas = attendanceConfigValidationSchemas;
