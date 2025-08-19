/**
 * Class Model - Q&A Compliant Implementation
 *
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key (lookup table)
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 *
 * Database Schema Match:
 * - Matches EXACTLY with actual `classes` table structure
 * - All fields correspond to database columns
 * - Proper foreign key relationships
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../config');
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

      // Class name - matches DB varchar(50)
      className: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'class_name', // Q16: Map camelCase to snake_case
        validate: {
          notEmpty: true,
          len: [1, 50]
        }
      },

      // Class order for sorting - matches DB int
      classOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_order',
        defaultValue: 0,
        validate: {
          min: 0
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

      // Status enum - matches DB exactly (Q59: Use business constants)
      status: {
        type: DataTypes.ENUM(...constants.ACADEMIC_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.ACADEMIC_STATUS.ACTIVE,
        validate: {
          isIn: [constants.ACADEMIC_STATUS.ALL_STATUS]
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

  // Q19: Validation schemas within model file
  Class.validationSchemas = {
    create: Joi.object({
      className: Joi.string().trim().min(1).max(50).required().messages({
        'string.empty': 'Class name is required',
        'string.max': 'Class name cannot exceed 50 characters'
      }),

      classOrder: Joi.number().integer().min(0).required().messages({
        'number.base': 'Class order must be a number',
        'number.min': 'Class order cannot be negative'
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
          'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
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
        .valid(...constants.ACADEMIC_STATUS.ALL_STATUS)
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
        .valid(...constants.ACADEMIC_STATUS.ALL_STATUS)
        .default(constants.ACADEMIC_STATUS.ACTIVE)
        .messages({
          'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
        })
    })
  };

  // Q20: Input sanitization with Joi transforms
  Class.sanitizeInput = function (data, schema = 'create') {
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
  };

  // Business logic methods
  Class.findBySchoolAndYear = async function (schoolId, academicYearId, options = {}) {
    const sanitized = Class.sanitizeInput({ schoolId, academicYearId }, 'findBySchool');

    return await Class.findAll({
      where: {
        schoolId: sanitized.schoolId,
        academicYearId: sanitized.academicYearId,
        status: options.status || constants.ACADEMIC_STATUS.ACTIVE
      },
      order: [['classOrder', 'ASC']],
      ...options
    });
  };

  Class.getActiveClassesBySchool = async function (schoolId, options = {}) {
    const sanitized = Class.sanitizeInput({ schoolId }, 'findBySchool');

    return await Class.findAll({
      where: {
        schoolId: sanitized.schoolId,
        status: constants.ACADEMIC_STATUS.ACTIVE
      },
      order: [['classOrder', 'ASC']],
      ...options
    });
  };

  return Class;
}

module.exports = createClassModel;
