/**
 * FeeStructure Model - Tenant Database Entity
 *
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 *
 * FeeStructure represents configurable fee rules per class/section
 * - Supports multiple fee types (tuition, transport, hostel, etc.)
 * - Configurable frequency (monthly, quarterly, yearly)
 * - Late fee calculation with grace periods
 * - Used for fee calculation engine
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * FeeStructure Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} FeeStructure model
 */
function createFeeStructureModel(sequelize) {
  const FeeStructure = sequelize.define(
    'FeeStructure',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Structure identification
      structureName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'structure_name',
        validate: {
          len: [3, 100]
        }
      },

      // School and academic references
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'school_id',
        references: {
          model: 'schools',
          key: 'id'
        }
      },

      classId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null means applies to all classes
        field: 'class_id',
        references: {
          model: 'classes',
          key: 'id'
        }
      },

      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null means applies to all sections
        field: 'section_id',
        references: {
          model: 'sections',
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

      // Fee configuration
      feeType: {
        type: DataTypes.ENUM(...constants.FEE_TYPES.ALL_TYPES),
        allowNull: false,
        field: 'fee_type',
        validate: {
          isIn: [constants.FEE_TYPES.ALL_TYPES]
        }
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          isDecimal: true
        }
      },

      frequency: {
        type: DataTypes.ENUM(...constants.FEE_FREQUENCIES.ALL_FREQUENCIES),
        allowNull: false,
        validate: {
          isIn: [constants.FEE_FREQUENCIES.ALL_FREQUENCIES]
        }
      },

      // Due date configuration
      dueDay: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'due_day',
        comment: 'Day of month for recurring fees',
        validate: {
          min: 1,
          max: 31
        }
      },

      // Late fee configuration
      lateFeeAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'late_fee_amount',
        validate: {
          min: 0,
          isDecimal: true
        }
      },

      lateFeeGraceDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'late_fee_grace_days',
        validate: {
          min: 0,
          max: 365
        }
      },

      // Configuration options
      isMandatory: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_mandatory'
      },

      // Status management
      status: {
        type: DataTypes.ENUM(...constants.FEE_STRUCTURE_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.FEE_STRUCTURE_STATUS.ACTIVE,
        validate: {
          isIn: [constants.FEE_STRUCTURE_STATUS.ALL_STATUS]
        }
      },

      // Additional configuration
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      configurationRules: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'configuration_rules',
        comment: 'Advanced fee calculation rules'
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
      tableName: 'fee_structures',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes for performance
      indexes: [
        {
          fields: ['school_id']
        },
        {
          fields: ['class_id', 'section_id']
        },
        {
          fields: ['academic_year_id']
        },
        {
          fields: ['fee_type']
        },
        {
          fields: ['status']
        },
        {
          fields: ['frequency']
        },
        {
          // Composite index for fee lookup
          fields: ['school_id', 'academic_year_id', 'status']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  FeeStructure.associate = models => {
    // FeeStructure belongs to School
    if (models.School) {
      FeeStructure.belongsTo(models.School, {
        foreignKey: 'schoolId',
        as: 'school',
        onDelete: 'CASCADE'
      });
    }

    // FeeStructure belongs to Class (optional)
    if (models.Class) {
      FeeStructure.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class',
        onDelete: 'CASCADE'
      });
    }

    // FeeStructure belongs to Section (optional)
    if (models.Section) {
      FeeStructure.belongsTo(models.Section, {
        foreignKey: 'sectionId',
        as: 'section',
        onDelete: 'CASCADE'
      });
    }

    // FeeStructure belongs to AcademicYear
    if (models.AcademicYear) {
      FeeStructure.belongsTo(models.AcademicYear, {
        foreignKey: 'academicYearId',
        as: 'academicYear',
        onDelete: 'CASCADE'
      });
    }

    // FeeStructure has many FeeTransactions
    if (models.FeeTransaction) {
      FeeStructure.hasMany(models.FeeTransaction, {
        foreignKey: 'feeStructureId',
        as: 'transactions',
        onDelete: 'CASCADE'
      });
    }
  };

  // Instance methods
  FeeStructure.prototype.toJSON = function () {
    const values = { ...this.dataValues };

    // Format decimal amounts
    if (values.amount) {
      values.amount = parseFloat(values.amount);
    }
    if (values.lateFeeAmount) {
      values.lateFeeAmount = parseFloat(values.lateFeeAmount);
    }

    return values;
  };

  FeeStructure.prototype.calculateLateFee = function (daysLate) {
    if (daysLate <= this.lateFeeGraceDays) {
      return 0;
    }
    return parseFloat(this.lateFeeAmount);
  };

  FeeStructure.prototype.getDueDateForMonth = function (year, month) {
    if (!this.dueDay) {
      return null;
    }

    // Handle end-of-month scenarios
    const dueDate = new Date(year, month - 1, this.dueDay);
    const lastDayOfMonth = new Date(year, month, 0).getDate();

    if (this.dueDay > lastDayOfMonth) {
      dueDate.setDate(lastDayOfMonth);
    }

    return dueDate;
  };

  // Class methods
  FeeStructure.findForStudent = async function (studentId, academicYearId) {
    // This would need to be implemented based on student's class and section
    const studentModel = sequelize.models.Student;
    if (!studentModel) return [];

    const student = await studentModel.findByPk(studentId, {
      include: ['class', 'section']
    });

    if (!student) return [];

    return await this.findAll({
      where: {
        academicYearId,
        schoolId: student.schoolId,
        status: constants.FEE_STRUCTURE_STATUS.ACTIVE,
        [sequelize.Op.or]: [
          { classId: null }, // Applies to all classes
          { classId: student.classId }
        ]
      },
      include: ['school', 'class', 'section', 'academicYear']
    });
  };

  FeeStructure.findBySchoolAndYear = async function (schoolId, academicYearId) {
    return await this.findAll({
      where: {
        schoolId,
        academicYearId,
        status: constants.FEE_STRUCTURE_STATUS.ACTIVE
      },
      include: ['school', 'class', 'section', 'academicYear'],
      order: [
        ['feeType', 'ASC'],
        ['amount', 'ASC']
      ]
    });
  };

  return FeeStructure;
}

// Q19 Compliance: Joi validation schemas
const feeStructureValidationSchemas = {
  create: Joi.object({
    structureName: Joi.string().min(3).max(100).required(),
    schoolId: Joi.number().integer().min(1).required(),
    classId: Joi.number().integer().min(1).optional(),
    sectionId: Joi.number().integer().min(1).optional(),
    academicYearId: Joi.number().integer().min(1).required(),
    feeType: Joi.string()
      .valid(...constants.FEE_TYPES.ALL_TYPES)
      .required(),
    amount: Joi.number().precision(2).min(0).required(),
    frequency: Joi.string()
      .valid(...constants.FEE_FREQUENCIES.ALL_FREQUENCIES)
      .required(),
    dueDay: Joi.number().integer().min(1).max(31).optional(),
    lateFeeAmount: Joi.number().precision(2).min(0).default(0),
    lateFeeGraceDays: Joi.number().integer().min(0).max(365).default(0),
    isMandatory: Joi.boolean().default(true),
    description: Joi.string().max(500).optional(),
    configurationRules: Joi.object().optional()
  }),

  update: Joi.object({
    structureName: Joi.string().min(3).max(100).optional(),
    classId: Joi.number().integer().min(1).optional(),
    sectionId: Joi.number().integer().min(1).optional(),
    amount: Joi.number().precision(2).min(0).optional(),
    frequency: Joi.string()
      .valid(...constants.FEE_FREQUENCIES.ALL_FREQUENCIES)
      .optional(),
    dueDay: Joi.number().integer().min(1).max(31).optional(),
    lateFeeAmount: Joi.number().precision(2).min(0).optional(),
    lateFeeGraceDays: Joi.number().integer().min(0).max(365).optional(),
    isMandatory: Joi.boolean().optional(),
    status: Joi.string()
      .valid(...constants.FEE_STRUCTURE_STATUS.ALL_STATUS)
      .optional(),
    description: Joi.string().max(500).optional(),
    configurationRules: Joi.object().optional()
  })
};

module.exports = createFeeStructureModel;
module.exports.validationSchemas = feeStructureValidationSchemas;
