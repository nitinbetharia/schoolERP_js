/**
 * Class Model - Q&A Compliant Implementation
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key (lookup table)
 * Q16:       ),
      
      status: Joi.string()
        .valid(...constants.ACADEMIC_STATUS.ALL_STATUS) // Q59: Use business constants
        .default(constants.ACADEMIC_STATUS.ACTIVE) // Q59: Use business constants
        .messages({
          'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
        })
    }),e database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * 
 * Database Schema Match:
 * - Matches EXACTLY with actual `classes` table structure
 * - All fields correspond to database columns
 * - Proper foreign key relationships
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');

// Q59: Use business constants instead of hardcoded values
const config = require('../../../config/index');
const constants = config.get('constants');

/**
 * Class Model Definition
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} Class model
 */
function createClassModel(sequelize) {
  const Class = sequelize.define(
    'Class',
    {
      // Q14: INTEGER primary key for lookup tables (not UUID)
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      // Class name - matches DB varchar(50) - Q59: Use reasonable defaults
      className: {
        type: DataTypes.STRING(50), // Match DB constraint
        allowNull: false,
        field: 'class_name', // Q16: Map camelCase to snake_case
        validate: {
          notEmpty: true,
          len: [1, 50] // Match DB constraint
        }
      },

      // Class order for sorting - matches DB int - Use reasonable defaults
      classOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_order',
        defaultValue: 0,
        validate: {
          min: 1, // Reasonable minimum
          max: 999 // Reasonable maximum
        }
      },

      // Foreign key to schools table - matches DB int
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'school_id',
        references: {
          model: 'schools',
          key: 'id'
        }
      },

      // Foreign key to academic_years table - matches DB int
      academicYearId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'academic_year_id',
        references: {
          model: 'academic_years',
          key: 'id'
        }
      },

      // Status enum - matches DB exactly - Q59: Use business constants
      status: {
        type: DataTypes.ENUM(...constants.ACADEMIC_STATUS.ALL_STATUS), // Q59: Use business constants
        allowNull: false,
        defaultValue: constants.ACADEMIC_STATUS.ACTIVE, // Q59: Use business constants
        validate: {
          isIn: [constants.ACADEMIC_STATUS.ALL_STATUS] // Q59: Use business constants
        }
      }

      // Q15: Timestamps handled by Sequelize options below
    },
    {
      // Model options following Q&A decisions
      sequelize,
      modelName: 'Class',
      tableName: 'classes',

      // Q15: Custom timestamp fields
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Q16: Snake_case database, camelCase JavaScript
      underscored: true,

      // Indexes matching database schema
      indexes: [
        {
          // Unique constraint: class_name + school_id + academic_year_id
          unique: true,
          fields: ['class_name', 'school_id', 'academic_year_id'],
          name: 'uk_classes_name_school_year'
        },
        {
          fields: ['school_id'],
          name: 'fk_classes_school'
        },
        {
          fields: ['academic_year_id'],
          name: 'fk_classes_academic_year'
        },
        {
          fields: ['class_order'],
          name: 'idx_classes_order'
        }
      ]
    }
  );

  // Q13: Inline associations with model definition
  Class.associate = function (models) {
    // Q33: RESTRICT foreign keys with user-friendly errors
    Class.belongsTo(models.School, {
      foreignKey: 'schoolId',
      as: 'school',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    Class.belongsTo(models.AcademicYear, {
      foreignKey: 'academicYearId',
      as: 'academicYear',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    Class.hasMany(models.Section, {
      foreignKey: 'classId',
      as: 'sections',
      onDelete: 'RESTRICT'
    });

    Class.hasMany(models.Subject, {
      foreignKey: 'classId',
      as: 'subjects',
      onDelete: 'RESTRICT'
    });

    Class.hasMany(models.Student, {
      foreignKey: 'classId',
      as: 'students',
      onDelete: 'RESTRICT'
    });
  };

  // Q19: Validation schemas within model file - Q59: Use config for validation rules
  Class.validationSchemas = {
    create: Joi.object({
      className: Joi.string().trim().min(1).max(50).required().messages({
        'string.empty': 'Class name is required',
        'string.max': 'Class name cannot exceed 50 characters',
        'string.min': 'Class name must be at least 1 character'
      }),

      classOrder: Joi.number().integer().min(1).max(999).required().messages({
        'number.base': 'Class order must be a number',
        'number.min': 'Class order cannot be less than 1',
        'number.max': 'Class order cannot exceed 999'
      }),

      schoolId: Joi.number().integer().positive().required().messages({
        'number.base': 'School ID must be a number',
        'number.positive': 'School ID must be positive'
      }),

      academicYearId: Joi.number().integer().positive().required().messages({
        'number.base': 'Academic Year ID must be a number',
        'number.positive': 'Academic Year ID must be positive'
      }),

      status: Joi.string()
        .valid(...constants.ACADEMIC_STATUS.ALL_STATUS)
        .default(constants.ACADEMIC_STATUS.ACTIVE)
        .messages({
          'any.only': 'Status must be either ACTIVE or INACTIVE'
        })
    }),

    update: Joi.object({
      className: Joi.string().trim().min(1).max(50).messages({
        'string.empty': 'Class name cannot be empty',
        'string.max': 'Class name cannot exceed 50 characters'
      }),

      classOrder: Joi.number().integer().min(0).messages({
        'number.base': 'Class order must be a number',
        'number.min': 'Class order cannot be negative'
      }),

      status: Joi.string()
        .valid(...constants.ACADEMIC_STATUS.ALL_STATUS) // Q59: Use business constants
        .messages({
          'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
        })
    }),

    // Validation for finding classes
    findBySchool: Joi.object({
      schoolId: Joi.number().integer().positive().required().messages({
        'number.base': 'School ID must be a number',
        'number.positive': 'School ID must be positive'
      }),

      academicYearId: Joi.number().integer().positive().optional().messages({
        'number.base': 'Academic Year ID must be a number',
        'number.positive': 'Academic Year ID must be positive'
      }),

      status: Joi.string()
        .valid(...constants.ACADEMIC_STATUS.ALL_STATUS) // Q59: Use business constants
        .default(constants.ACADEMIC_STATUS.ACTIVE) // Q59: Use business constants
        .messages({
          'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
        })
    })
  };

  // Q20: Input sanitization with Joi transforms + Q57-Q58: async/await + try-catch
  Class.sanitizeInput = async function (data, schema = 'create') {
    try {
      const validationSchema = Class.validationSchemas[schema];
      if (!validationSchema) {
        throw new Error(`Unknown validation schema: ${schema}`);
      }

      const { error, value } = validationSchema.validate(data, {
        stripUnknown: true,
        abortEarly: false
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        throw {
          name: 'ValidationError',
          message: 'Validation failed',
          errors: validationErrors
        };
      }

      return value;
    } catch (error) {
      const logger = require('../../../config/logger');
      logger.error('Class input validation failed', {
        data,
        schema,
        error: error.message
      });
      throw error;
    }
  };

  // Business logic methods with Q57-Q58 compliance
  Class.findBySchoolAndYear = async function (schoolId, academicYearId, options = {}) {
    try {
      const sanitized = await Class.sanitizeInput({ schoolId, academicYearId }, 'findBySchool');

      const classes = await Class.findAll({
        where: {
          schoolId: sanitized.schoolId,
          academicYearId: sanitized.academicYearId,
          status: options.status || constants.ACADEMIC_STATUS.ACTIVE // Q59: Use business constants
        },
        order: [['classOrder', 'ASC']],
        ...options
      });

      const logger = require('../../../config/logger');
      logger.database('SELECT', 'classes', {
        schoolId: sanitized.schoolId,
        academicYearId: sanitized.academicYearId,
        count: classes.length
      });

      return classes;
    } catch (error) {
      const logger = require('../../../config/logger');
      logger.error('Failed to find classes by school and year', {
        schoolId,
        academicYearId,
        error: error.message
      });
      throw error;
    }
  };

  Class.getActiveClassesBySchool = async function (schoolId, options = {}) {
    try {
      const sanitized = await Class.sanitizeInput({ schoolId }, 'findBySchool');

      const classes = await Class.findAll({
        where: {
          schoolId: sanitized.schoolId,
          status: constants.ACADEMIC_STATUS.ACTIVE // Q59: Use business constants
        },
        order: [['classOrder', 'ASC']],
        ...options
      });

      const logger = require('../../../config/logger');
      logger.database('SELECT', 'classes', {
        schoolId: sanitized.schoolId,
        count: classes.length
      });

      return classes;
    } catch (error) {
      const logger = require('../../../config/logger');
      logger.error('Failed to get active classes by school', {
        schoolId,
        error: error.message
      });
      throw error;
    }
  };

  Class.createClass = async function (classData) {
    try {
      const sanitized = await this.sanitizeInput(classData, 'create');

      const classRecord = await this.create(sanitized);

      const logger = require('../../../config/logger');
      logger.business('class_created', 'Class', classRecord.id, {
        className: classRecord.className,
        schoolId: classRecord.schoolId,
        academicYearId: classRecord.academicYearId
      });

      return classRecord;
    } catch (error) {
      const logger = require('../../../config/logger');
      logger.error('Class creation failed', {
        classData,
        error: error.message
      });
      throw error;
    }
  };

  return Class;
}

module.exports = createClassModel;
