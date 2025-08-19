/**
 * Subject Model - Q&A Compliant Implementation
 *
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key (lookup table)
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 *
 * A Subject represents an academic subject/course
 * - Can be taught across multiple classes
 * - Has curriculum properties (theory/practical hours)
 * - Used for timetable, teacher assignment, and assessment
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../config');
const constants = config.get('constants');

/**
 * Subject Model Definition
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Model} Subject model
 */
function createSubjectModel(sequelize) {
  const Subject = sequelize.define(
    'Subject',
    {
      // Primary Key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique subject identifier'
      },

      // Subject Identity
      subjectCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'subject_code',
        comment: 'Unique code for the subject (e.g., MATH101, ENG12)',
        validate: {
          notEmpty: {
            msg: 'Subject code cannot be empty'
          },
          len: {
            args: [2, 20],
            msg: 'Subject code must be 2-20 characters'
          },
          is: {
            args: /^[A-Z0-9_-]+$/i,
            msg: 'Subject code can only contain letters, numbers, hyphens, and underscores'
          }
        }
      },

      subjectName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'subject_name',
        comment: 'Full name of the subject',
        validate: {
          notEmpty: {
            msg: 'Subject name cannot be empty'
          },
          len: {
            args: [2, 100],
            msg: 'Subject name must be 2-100 characters'
          }
        }
      },

      // Academic Properties
      subjectType: {
        type: DataTypes.ENUM('CORE', 'ELECTIVE', 'OPTIONAL', 'EXTRA_CURRICULAR'),
        allowNull: false,
        defaultValue: 'CORE',
        field: 'subject_type',
        comment: 'Type/category of the subject',
        validate: {
          isIn: {
            args: [['CORE', 'ELECTIVE', 'OPTIONAL', 'EXTRA_CURRICULAR']],
            msg: 'Subject type must be CORE, ELECTIVE, OPTIONAL, or EXTRA_CURRICULAR'
          }
        }
      },

      category: {
        type: DataTypes.ENUM(
          'LANGUAGE',
          'SCIENCE',
          'MATHEMATICS',
          'SOCIAL_SCIENCE',
          'ARTS',
          'VOCATIONAL',
          'SPORTS',
          'OTHER'
        ),
        allowNull: false,
        defaultValue: 'OTHER',
        comment: 'Academic category of the subject',
        validate: {
          isIn: {
            args: [
              [
                'LANGUAGE',
                'SCIENCE',
                'MATHEMATICS',
                'SOCIAL_SCIENCE',
                'ARTS',
                'VOCATIONAL',
                'SPORTS',
                'OTHER'
              ]
            ],
            msg: 'Category must be a valid academic category'
          }
        }
      },

      // Curriculum Configuration
      theoryHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'theory_hours',
        comment: 'Weekly theory hours for this subject',
        validate: {
          min: {
            args: [0],
            msg: 'Theory hours cannot be negative'
          },
          max: {
            args: [40],
            msg: 'Theory hours cannot exceed 40 per week'
          }
        }
      },

      practicalHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'practical_hours',
        comment: 'Weekly practical hours for this subject',
        validate: {
          min: {
            args: [0],
            msg: 'Practical hours cannot be negative'
          },
          max: {
            args: [40],
            msg: 'Practical hours cannot exceed 40 per week'
          }
        }
      },

      totalHours: {
        type: DataTypes.VIRTUAL,
        get() {
          return (this.theoryHours || 0) + (this.practicalHours || 0);
        }
      },

      // Assessment Configuration
      maxMarks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        field: 'max_marks',
        comment: 'Maximum marks for this subject',
        validate: {
          min: {
            args: [1],
            msg: 'Maximum marks must be at least 1'
          },
          max: {
            args: [1000],
            msg: 'Maximum marks cannot exceed 1000'
          }
        }
      },

      passingMarks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 35,
        field: 'passing_marks',
        comment: 'Minimum marks required to pass',
        validate: {
          min: {
            args: [0],
            msg: 'Passing marks cannot be negative'
          }
        }
      },

      // Subject Configuration
      hasTheory: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'has_theory',
        comment: 'Whether subject has theory component'
      },

      hasPractical: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'has_practical',
        comment: 'Whether subject has practical component'
      },

      isOptional: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_optional',
        comment: 'Whether subject is optional for students'
      },

      // Content and Resources
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description of the subject',
        validate: {
          len: {
            args: [0, 2000],
            msg: 'Description cannot exceed 2000 characters'
          }
        }
      },

      syllabus: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Subject syllabus/curriculum outline',
        validate: {
          len: {
            args: [0, 5000],
            msg: 'Syllabus cannot exceed 5000 characters'
          }
        }
      },

      textbooks: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'List of recommended textbooks and resources',
        validate: {
          isValidJSON(value) {
            if (value && typeof value !== 'object') {
              throw new Error('Textbooks must be a valid JSON object');
            }
          }
        }
      },

      // Status and Management
      status: {
        type: DataTypes.ENUM(...constants.ACADEMIC_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.ACADEMIC_STATUS.ACTIVE,
        comment: 'Subject operational status',
        validate: {
          isIn: {
            args: [constants.ACADEMIC_STATUS.ALL_STATUS],
            msg: `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
          }
        }
      },

      // School Association
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

      // Administrative Fields
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
        comment: 'Display order for subject listing'
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
      tableName: 'subjects',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes for Performance
      indexes: [
        {
          unique: true,
          fields: ['subject_code'],
          name: 'uk_subjects_code'
        },
        {
          fields: ['school_id'],
          name: 'idx_subjects_school'
        },
        {
          fields: ['status'],
          name: 'idx_subjects_status'
        },
        {
          fields: ['subject_type'],
          name: 'idx_subjects_type'
        },
        {
          fields: ['category'],
          name: 'idx_subjects_category'
        },
        {
          fields: ['sort_order'],
          name: 'idx_subjects_sort'
        }
      ],

      // Custom Validations
      validate: {
        passingMarksValidation() {
          if (this.passingMarks > this.maxMarks) {
            throw new Error('Passing marks cannot exceed maximum marks');
          }
        },
        hoursValidation() {
          if (this.theoryHours === 0 && this.practicalHours === 0) {
            throw new Error('Subject must have either theory or practical hours');
          }
        },
        componentValidation() {
          if (this.hasTheory && this.theoryHours === 0) {
            throw new Error('Theory hours must be greater than 0 if subject has theory component');
          }
          if (this.hasPractical && this.practicalHours === 0) {
            throw new Error(
              'Practical hours must be greater than 0 if subject has practical component'
            );
          }
        }
      },

      // Model Configuration
      comment: 'Academic subjects/courses offered in the school'
    }
  );

  // Model Associations (Q13: Will be defined in associate method)
  Subject.associate = models => {
    // Belongs to School
    Subject.belongsTo(models.School, {
      foreignKey: 'schoolId',
      as: 'school',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT'
    });

    // Created/Updated by Users
    Subject.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onUpdate: 'RESTRICT',
      onDelete: 'SET NULL'
    });

    Subject.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater',
      onUpdate: 'RESTRICT',
      onDelete: 'SET NULL'
    });

    // Many-to-Many with Classes (through class_subjects junction table)
    // Subject.belongsToMany(models.Class, {
    //   through: 'class_subjects',
    //   foreignKey: 'subjectId',
    //   otherKey: 'classId',
    //   as: 'classes'
    // });

    // Has Many Teacher Assignments (when TeacherSubject model is created)
    // Subject.hasMany(models.TeacherSubject, {
    //   foreignKey: 'subjectId',
    //   as: 'teacherAssignments'
    // });
  };

  // Instance Methods
  Subject.prototype.getPassingPercentage = function () {
    return Math.round((this.passingMarks / this.maxMarks) * 100);
  };

  Subject.prototype.isCore = function () {
    return this.subjectType === 'CORE';
  };

  Subject.prototype.requiresPractical = function () {
    return this.hasPractical && this.practicalHours > 0;
  };

  Subject.prototype.getDisplayName = function () {
    return `${this.subjectCode} - ${this.subjectName}`;
  };

  // Static Methods
  Subject.getActiveBySchool = async function (schoolId) {
    return await Subject.findAll({
      where: {
        schoolId,
        status: constants.ACADEMIC_STATUS.ACTIVE
      },
      order: [
        ['sortOrder', 'ASC'],
        ['subjectName', 'ASC']
      ]
    });
  };

  Subject.getCoreSubjects = async function (schoolId) {
    return await Subject.findAll({
      where: {
        schoolId,
        subjectType: 'CORE',
        status: constants.ACADEMIC_STATUS.ACTIVE
      },
      order: [
        ['sortOrder', 'ASC'],
        ['subjectName', 'ASC']
      ]
    });
  };

  Subject.getByCategory = async function (schoolId, category) {
    return await Subject.findAll({
      where: {
        schoolId,
        category,
        status: constants.ACADEMIC_STATUS.ACTIVE
      },
      order: [
        ['sortOrder', 'ASC'],
        ['subjectName', 'ASC']
      ]
    });
  };

  Subject.searchByName = async function (schoolId, searchTerm) {
    const { Op } = require('sequelize');
    return await Subject.findAll({
      where: {
        schoolId,
        status: constants.ACADEMIC_STATUS.ACTIVE,
        [Op.or]: [
          { subjectName: { [Op.like]: `%${searchTerm}%` } },
          { subjectCode: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      order: [['subjectName', 'ASC']]
    });
  };

  return Subject;
}

// Q19: Joi Validation Schemas
const subjectValidationSchemas = {
  create: Joi.object({
    subjectCode: Joi.string()
      .trim()
      .uppercase()
      .min(2)
      .max(20)
      .pattern(/^[A-Z0-9_-]+$/)
      .required()
      .messages({
        'string.base': 'Subject code must be a string',
        'string.empty': 'Subject code cannot be empty',
        'string.min': 'Subject code must be at least 2 characters',
        'string.max': 'Subject code cannot exceed 20 characters',
        'string.pattern.base':
          'Subject code can only contain letters, numbers, hyphens, and underscores',
        'any.required': 'Subject code is required'
      }),

    subjectName: Joi.string().trim().min(2).max(100).required().messages({
      'string.base': 'Subject name must be a string',
      'string.empty': 'Subject name cannot be empty',
      'string.min': 'Subject name must be at least 2 characters',
      'string.max': 'Subject name cannot exceed 100 characters',
      'any.required': 'Subject name is required'
    }),

    schoolId: Joi.number().integer().positive().required().messages({
      'number.base': 'School ID must be a number',
      'number.positive': 'School ID must be positive',
      'any.required': 'School ID is required'
    }),

    subjectType: Joi.string()
      .valid('CORE', 'ELECTIVE', 'OPTIONAL', 'EXTRA_CURRICULAR')
      .default('CORE')
      .messages({
        'any.only': 'Subject type must be CORE, ELECTIVE, OPTIONAL, or EXTRA_CURRICULAR'
      }),

    category: Joi.string()
      .valid(
        'LANGUAGE',
        'SCIENCE',
        'MATHEMATICS',
        'SOCIAL_SCIENCE',
        'ARTS',
        'VOCATIONAL',
        'SPORTS',
        'OTHER'
      )
      .default('OTHER')
      .messages({
        'any.only': 'Category must be a valid academic category'
      }),

    theoryHours: Joi.number().integer().min(0).max(40).default(0).messages({
      'number.base': 'Theory hours must be a number',
      'number.min': 'Theory hours cannot be negative',
      'number.max': 'Theory hours cannot exceed 40 per week'
    }),

    practicalHours: Joi.number().integer().min(0).max(40).default(0).messages({
      'number.base': 'Practical hours must be a number',
      'number.min': 'Practical hours cannot be negative',
      'number.max': 'Practical hours cannot exceed 40 per week'
    }),

    maxMarks: Joi.number().integer().min(1).max(1000).default(100).messages({
      'number.base': 'Maximum marks must be a number',
      'number.min': 'Maximum marks must be at least 1',
      'number.max': 'Maximum marks cannot exceed 1000'
    }),

    passingMarks: Joi.number().integer().min(0).default(35).messages({
      'number.base': 'Passing marks must be a number',
      'number.min': 'Passing marks cannot be negative'
    }),

    hasTheory: Joi.boolean().default(true),

    hasPractical: Joi.boolean().default(false),

    isOptional: Joi.boolean().default(false),

    description: Joi.string().trim().max(2000).allow('', null).messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),

    syllabus: Joi.string().trim().max(5000).allow('', null).messages({
      'string.max': 'Syllabus cannot exceed 5000 characters'
    }),

    textbooks: Joi.object().allow(null),

    status: Joi.string()
      .valid(...constants.ACADEMIC_STATUS.ALL_STATUS)
      .default(constants.ACADEMIC_STATUS.ACTIVE)
      .messages({
        'any.only': `Status must be one of: ${constants.ACADEMIC_STATUS.ALL_STATUS.join(', ')}`
      }),

    sortOrder: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'Sort order must be a number',
      'number.min': 'Sort order cannot be negative'
    })
  })
    .custom((value, helpers) => {
      // Custom validation for passing marks vs max marks
      if (value.passingMarks > value.maxMarks) {
        return helpers.error('custom.passingMarksExceedsMax');
      }

      // Custom validation for hours
      if (value.theoryHours === 0 && value.practicalHours === 0) {
        return helpers.error('custom.noHours');
      }

      return value;
    }, 'Subject validation')
    .messages({
      'custom.passingMarksExceedsMax': 'Passing marks cannot exceed maximum marks',
      'custom.noHours': 'Subject must have either theory or practical hours'
    }),

  update: Joi.object({
    subjectCode: Joi.string()
      .trim()
      .uppercase()
      .min(2)
      .max(20)
      .pattern(/^[A-Z0-9_-]+$/)
      .messages({
        'string.pattern.base':
          'Subject code can only contain letters, numbers, hyphens, and underscores'
      }),

    subjectName: Joi.string().trim().min(2).max(100).messages({
      'string.min': 'Subject name must be at least 2 characters',
      'string.max': 'Subject name cannot exceed 100 characters'
    }),

    subjectType: Joi.string().valid('CORE', 'ELECTIVE', 'OPTIONAL', 'EXTRA_CURRICULAR'),

    category: Joi.string().valid(
      'LANGUAGE',
      'SCIENCE',
      'MATHEMATICS',
      'SOCIAL_SCIENCE',
      'ARTS',
      'VOCATIONAL',
      'SPORTS',
      'OTHER'
    ),

    theoryHours: Joi.number().integer().min(0).max(40),

    practicalHours: Joi.number().integer().min(0).max(40),

    maxMarks: Joi.number().integer().min(1).max(1000),

    passingMarks: Joi.number().integer().min(0),

    hasTheory: Joi.boolean(),
    hasPractical: Joi.boolean(),
    isOptional: Joi.boolean(),

    description: Joi.string().trim().max(2000).allow('', null),

    syllabus: Joi.string().trim().max(5000).allow('', null),

    textbooks: Joi.object().allow(null),

    status: Joi.string().valid(...constants.ACADEMIC_STATUS.ALL_STATUS),

    sortOrder: Joi.number().integer().min(0)
  })
};

// Input Sanitization (Security)
const sanitizeInput = input => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const sanitized = { ...input };

  // Sanitize string fields
  ['subjectCode', 'subjectName', 'description', 'syllabus'].forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
      // Convert empty strings to null for optional fields
      if (['description', 'syllabus'].includes(field) && sanitized[field] === '') {
        sanitized[field] = null;
      }
    }
  });

  // Uppercase subject code
  if (sanitized.subjectCode) {
    sanitized.subjectCode = sanitized.subjectCode.toUpperCase();
  }

  // Ensure numeric fields are proper numbers
  ['schoolId', 'theoryHours', 'practicalHours', 'maxMarks', 'passingMarks', 'sortOrder'].forEach(
    field => {
      if (sanitized[field] !== undefined && sanitized[field] !== null) {
        const num = parseInt(sanitized[field], 10);
        if (!isNaN(num)) {
          sanitized[field] = num;
        }
      }
    }
  );

  return sanitized;
};

module.exports = {
  createSubjectModel,
  subjectValidationSchemas,
  sanitizeInput
};
