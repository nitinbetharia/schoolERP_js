/**
 * Section Model - Q&A Compliant Implementation
 *
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key (lookup table)
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 *
 * A Section represents a subdivision of a Class (e.g., Class X Section A)
 * - Belongs to a specific Class
 * - Has academic properties (max students, room number)
 * - Used for student enrollment and timetable management
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../config');
const constants = config.get('constants');

/**
 * Section Model Definition
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} Section model
 */
function createSectionModel(sequelize) {
  const Section = sequelize.define(
    'Section',
    {
      // Primary Key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique section identifier'
      },

      // Foreign Keys
      classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_id',
        comment: 'Reference to parent class',
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT'
      },

      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'school_id',
        comment: 'Reference to school (for multi-school support)',
        references: {
          model: 'schools',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT'
      },

      // Section Properties
      sectionName: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'section_name',
        comment: 'Section identifier (A, B, C, Alpha, Beta, etc.)',
        validate: {
          notEmpty: {
            msg: 'Section name cannot be empty'
          },
          len: {
            args: [1, 20],
            msg: 'Section name must be 1-20 characters'
          }
        }
      },

      // Academic Configuration
      maxStudents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 40,
        field: 'max_students',
        comment: 'Maximum number of students allowed',
        validate: {
          min: {
            args: [1],
            msg: 'Maximum students must be at least 1'
          },
          max: {
            args: [200],
            msg: 'Maximum students cannot exceed 200'
          }
        }
      },

      currentStudents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'current_students',
        comment: 'Current number of enrolled students',
        validate: {
          min: {
            args: [0],
            msg: 'Current students cannot be negative'
          }
        }
      },

      // Physical Properties
      roomNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'room_number',
        comment: 'Assigned classroom/room number',
        validate: {
          len: {
            args: [0, 20],
            msg: 'Room number cannot exceed 20 characters'
          }
        }
      },

      building: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'building',
        comment: 'Building where section is located',
        validate: {
          len: {
            args: [0, 50],
            msg: 'Building name cannot exceed 50 characters'
          }
        }
      },

      floor: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'floor',
        comment: 'Floor number or identifier',
        validate: {
          len: {
            args: [0, 10],
            msg: 'Floor cannot exceed 10 characters'
          }
        }
      },

      // Status and Management
      status: {
        type: DataTypes.ENUM(...constants.ACADEMIC_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.ACADEMIC_STATUS.ACTIVE,
        comment: 'Section operational status',
        validate: {
          isIn: {
            args: [constants.ACADEMIC_STATUS.ALL_STATUS],
            msg: `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
          }
        }
      },

      // Teacher Assignment
      classTeacherId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'class_teacher_id',
        comment: 'Primary class teacher for this section',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'SET NULL'
      },

      // Administrative Fields
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional notes about the section',
        validate: {
          len: {
            args: [0, 1000],
            msg: 'Remarks cannot exceed 1000 characters'
          }
        }
      },

      // Audit Fields (Q16: snake_case in DB, camelCase in JS)
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
        comment: 'Record creation timestamp'
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
        comment: 'Record last update timestamp'
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        comment: 'User who created this record',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'SET NULL'
      },

      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        comment: 'User who last updated this record',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'RESTRICT',
        onDelete: 'SET NULL'
      }
    },
    {
      // Table Configuration (Q16: underscored naming)
      tableName: 'sections',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes for Performance
      indexes: [
        {
          unique: true,
          fields: ['class_id', 'section_name'],
          name: 'uk_sections_class_section'
        },
        {
          fields: ['school_id'],
          name: 'idx_sections_school'
        },
        {
          fields: ['status'],
          name: 'idx_sections_status'
        },
        {
          fields: ['class_teacher_id'],
          name: 'idx_sections_teacher'
        }
      ],

      // Model Configuration
      comment: 'Section subdivisions within classes for student organization'
    }
  );

  // Model Associations (Q13: Will be defined in associate method)
  Section.associate = models => {
    // Belongs to Class
    Section.belongsTo(models.Class, {
      foreignKey: 'classId',
      as: 'class',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT'
    });

    // Belongs to School
    Section.belongsTo(models.School, {
      foreignKey: 'schoolId',
      as: 'school',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT'
    });

    // Has Class Teacher (User)
    Section.belongsTo(models.User, {
      foreignKey: 'classTeacherId',
      as: 'classTeacher',
      onUpdate: 'RESTRICT',
      onDelete: 'SET NULL'
    });

    // Created/Updated by Users
    Section.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onUpdate: 'RESTRICT',
      onDelete: 'SET NULL'
    });

    Section.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater',
      onUpdate: 'RESTRICT',
      onDelete: 'SET NULL'
    });

    // Has Many Students (when Student model is created)
    // Section.hasMany(models.Student, {
    //   foreignKey: 'sectionId',
    //   as: 'students',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT'
    // });
  };

  // Instance Methods
  Section.prototype.getFullName = function () {
    return `${this.class?.className || 'Unknown Class'} - ${this.sectionName}`;
  };

  Section.prototype.isAtCapacity = function () {
    return this.currentStudents >= this.maxStudents;
  };

  Section.prototype.getAvailableSeats = function () {
    return Math.max(0, this.maxStudents - this.currentStudents);
  };

  Section.prototype.canEnrollStudent = function () {
    return this.status === constants.ACADEMIC_STATUS.ACTIVE && !this.isAtCapacity();
  };

  // Static Methods
  Section.getActiveByClass = async function (classId) {
    return await Section.findAll({
      where: {
        classId,
        status: constants.ACADEMIC_STATUS.ACTIVE
      },
      include: [
        { model: models.Class, as: 'class' },
        { model: models.User, as: 'classTeacher' }
      ],
      order: [['sectionName', 'ASC']]
    });
  };

  Section.getBySchool = async function (schoolId, includeInactive = false) {
    const whereClause = { schoolId };
    if (!includeInactive) {
      whereClause.status = constants.ACADEMIC_STATUS.ACTIVE;
    }

    return await Section.findAll({
      where: whereClause,
      include: [
        { model: models.Class, as: 'class' },
        { model: models.User, as: 'classTeacher' }
      ],
      order: [['sectionName', 'ASC']]
    });
  };

  return Section;
}

// Q19: Joi Validation Schemas
const sectionValidationSchemas = {
  create: Joi.object({
    classId: Joi.number().integer().positive().required().messages({
      'number.base': 'Class ID must be a number',
      'number.positive': 'Class ID must be positive',
      'any.required': 'Class ID is required'
    }),

    schoolId: Joi.number().integer().positive().required().messages({
      'number.base': 'School ID must be a number',
      'number.positive': 'School ID must be positive',
      'any.required': 'School ID is required'
    }),

    sectionName: Joi.string().trim().min(1).max(20).required().messages({
      'string.base': 'Section name must be a string',
      'string.empty': 'Section name cannot be empty',
      'string.min': 'Section name must be at least 1 character',
      'string.max': 'Section name cannot exceed 20 characters',
      'any.required': 'Section name is required'
    }),

    maxStudents: Joi.number().integer().min(1).max(200).default(40).messages({
      'number.base': 'Maximum students must be a number',
      'number.min': 'Maximum students must be at least 1',
      'number.max': 'Maximum students cannot exceed 200'
    }),

    roomNumber: Joi.string().trim().max(20).allow('', null).messages({
      'string.max': 'Room number cannot exceed 20 characters'
    }),

    building: Joi.string().trim().max(50).allow('', null).messages({
      'string.max': 'Building name cannot exceed 50 characters'
    }),

    floor: Joi.string().trim().max(10).allow('', null).messages({
      'string.max': 'Floor cannot exceed 10 characters'
    }),

    status: Joi.string()
      .valid(...constants.ACADEMIC_STATUS.ALL_STATUS)
      .default(constants.ACADEMIC_STATUS.ACTIVE)
      .messages({
        'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
      }),

    classTeacherId: Joi.number().integer().positive().allow(null).messages({
      'number.base': 'Class teacher ID must be a number',
      'number.positive': 'Class teacher ID must be positive'
    }),

    remarks: Joi.string().trim().max(1000).allow('', null).messages({
      'string.max': 'Remarks cannot exceed 1000 characters'
    })
  }),

  update: Joi.object({
    sectionName: Joi.string().trim().min(1).max(20).messages({
      'string.empty': 'Section name cannot be empty',
      'string.min': 'Section name must be at least 1 character',
      'string.max': 'Section name cannot exceed 20 characters'
    }),

    maxStudents: Joi.number().integer().min(1).max(200).messages({
      'number.base': 'Maximum students must be a number',
      'number.min': 'Maximum students must be at least 1',
      'number.max': 'Maximum students cannot exceed 200'
    }),

    roomNumber: Joi.string().trim().max(20).allow('', null).messages({
      'string.max': 'Room number cannot exceed 20 characters'
    }),

    building: Joi.string().trim().max(50).allow('', null).messages({
      'string.max': 'Building name cannot exceed 50 characters'
    }),

    floor: Joi.string().trim().max(10).allow('', null).messages({
      'string.max': 'Floor cannot exceed 10 characters'
    }),

    status: Joi.string()
      .valid(...constants.ACADEMIC_STATUS.ALL_STATUS)
      .messages({
        'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
      }),

    classTeacherId: Joi.number().integer().positive().allow(null).messages({
      'number.base': 'Class teacher ID must be a number',
      'number.positive': 'Class teacher ID must be positive'
    }),

    remarks: Joi.string().trim().max(1000).allow('', null).messages({
      'string.max': 'Remarks cannot exceed 1000 characters'
    })
  })
};

// Input Sanitization (Security)
const sanitizeInput = input => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const sanitized = { ...input };

  // Sanitize string fields
  ['sectionName', 'roomNumber', 'building', 'floor', 'remarks'].forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
      // Convert empty strings to null for optional fields
      if (
        ['roomNumber', 'building', 'floor', 'remarks'].includes(field) &&
        sanitized[field] === ''
      ) {
        sanitized[field] = null;
      }
    }
  });

  // Ensure numeric fields are proper numbers
  ['classId', 'schoolId', 'maxStudents', 'classTeacherId'].forEach(field => {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      const num = parseInt(sanitized[field], 10);
      if (!isNaN(num)) {
        sanitized[field] = num;
      }
    }
  });

  return sanitized;
};

module.exports = {
  createSectionModel,
  sectionValidationSchemas,
  sanitizeInput
};
