const { DataTypes } = require('sequelize');
const Joi = require('joi');
const { logger } = require('../../../utils/logger');

/**
 * Q59-ENFORCED: Comprehensive validation schemas for fee structure operations
 * These schemas enforce business rules and data integrity for all fee structure operations
 */
const feeStructureValidationSchemas = {
   // Fee Structure Creation Validation
   createFeeStructure: Joi.object({
      school_id: Joi.number().integer().positive().required().messages({
         'number.base': 'School ID must be a number',
         'number.integer': 'School ID must be an integer',
         'number.positive': 'School ID must be positive',
         'any.required': 'School ID is required',
      }),
      class_id: Joi.number().integer().positive().required().messages({
         'number.base': 'Class ID must be a number',
         'number.integer': 'Class ID must be an integer',
         'number.positive': 'Class ID must be positive',
         'any.required': 'Class ID is required',
      }),
      academic_year: Joi.string()
         .pattern(/^\d{4}-\d{2}$/)
         .required()
         .messages({
            'string.pattern.base': 'Academic year must be in format YYYY-YY (e.g., 2024-25)',
            'any.required': 'Academic year is required',
         }),
      fee_category: Joi.string()
         .valid(
            'TUITION',
            'ADMISSION',
            'DEVELOPMENT',
            'TRANSPORT',
            'LIBRARY',
            'LABORATORY',
            'COMPUTER',
            'SPORTS',
            'ACTIVITY',
            'EXAMINATION',
            'ANNUAL',
            'CAUTION_MONEY',
            'UNIFORM',
            'BOOKS',
            'STATIONERY',
            'HOSTEL',
            'MESS',
            'MEDICAL',
            'INSURANCE',
            'OTHER'
         )
         .required()
         .messages({
            'any.only': 'Fee category must be a valid category',
            'any.required': 'Fee category is required',
         }),
      fee_type: Joi.string().valid('MANDATORY', 'OPTIONAL', 'CONDITIONAL').default('MANDATORY').messages({
         'any.only': 'Fee type must be MANDATORY, OPTIONAL, or CONDITIONAL',
      }),
      amount: Joi.number().min(0).max(999999.99).precision(2).required().messages({
         'number.base': 'Amount must be a number',
         'number.min': 'Amount cannot be negative',
         'number.max': 'Amount cannot exceed 999,999.99',
         'any.required': 'Amount is required',
      }),
      frequency: Joi.string()
         .valid('YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME')
         .default('YEARLY')
         .messages({
            'any.only': 'Frequency must be YEARLY, HALF_YEARLY, QUARTERLY, MONTHLY, or ONE_TIME',
         }),
      due_date: Joi.date().optional().allow(null),
      due_month: Joi.number().integer().min(1).max(12).optional().allow(null).messages({
         'number.min': 'Due month must be between 1 and 12',
         'number.max': 'Due month must be between 1 and 12',
      }),
      installments: Joi.number().integer().min(1).max(12).default(1).messages({
         'number.min': 'Installments must be at least 1',
         'number.max': 'Maximum 12 installments allowed',
      }),
      late_fee_applicable: Joi.boolean().default(true),
      late_fee_amount: Joi.number().min(0).precision(2).optional().allow(null).messages({
         'number.min': 'Late fee amount cannot be negative',
      }),
      late_fee_percentage: Joi.number().min(0).max(100).precision(2).optional().allow(null).messages({
         'number.min': 'Late fee percentage cannot be negative',
         'number.max': 'Late fee percentage cannot exceed 100%',
      }),
      grace_period_days: Joi.number().integer().min(0).max(365).default(0).messages({
         'number.min': 'Grace period cannot be negative',
         'number.max': 'Grace period cannot exceed 365 days',
      }),
      discount_applicable: Joi.boolean().default(true),
      refundable: Joi.boolean().default(false),
      description: Joi.string().max(1000).optional().allow(null, ''),
      conditions: Joi.object().optional().allow(null),
      tax_applicable: Joi.boolean().default(false),
      tax_percentage: Joi.number().min(0).max(50).precision(2).optional().allow(null).messages({
         'number.min': 'Tax percentage cannot be negative',
         'number.max': 'Tax percentage cannot exceed 50%',
      }),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').default('ACTIVE').messages({
         'any.only': 'Status must be ACTIVE, INACTIVE, or DRAFT',
      }),
      effective_from: Joi.date().required().messages({
         'any.required': 'Effective from date is required',
      }),
      effective_to: Joi.date().optional().allow(null),
      created_by: Joi.number().integer().positive().required().messages({
         'number.positive': 'Created by user ID must be positive',
         'any.required': 'Created by user ID is required',
      }),
      additional_info: Joi.object().optional().allow(null),
   }),

   // Fee Structure Update Validation
   updateFeeStructure: Joi.object({
      amount: Joi.number().min(0).max(999999.99).precision(2).optional().messages({
         'number.min': 'Amount cannot be negative',
         'number.max': 'Amount cannot exceed 999,999.99',
      }),
      frequency: Joi.string().valid('YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME').optional().messages({
         'any.only': 'Frequency must be YEARLY, HALF_YEARLY, QUARTERLY, MONTHLY, or ONE_TIME',
      }),
      due_date: Joi.date().optional().allow(null),
      due_month: Joi.number().integer().min(1).max(12).optional().allow(null).messages({
         'number.min': 'Due month must be between 1 and 12',
         'number.max': 'Due month must be between 1 and 12',
      }),
      installments: Joi.number().integer().min(1).max(12).optional().messages({
         'number.min': 'Installments must be at least 1',
         'number.max': 'Maximum 12 installments allowed',
      }),
      late_fee_applicable: Joi.boolean().optional(),
      late_fee_amount: Joi.number().min(0).precision(2).optional().allow(null).messages({
         'number.min': 'Late fee amount cannot be negative',
      }),
      late_fee_percentage: Joi.number().min(0).max(100).precision(2).optional().allow(null).messages({
         'number.min': 'Late fee percentage cannot be negative',
         'number.max': 'Late fee percentage cannot exceed 100%',
      }),
      grace_period_days: Joi.number().integer().min(0).max(365).optional().messages({
         'number.min': 'Grace period cannot be negative',
         'number.max': 'Grace period cannot exceed 365 days',
      }),
      discount_applicable: Joi.boolean().optional(),
      refundable: Joi.boolean().optional(),
      description: Joi.string().max(1000).optional().allow(null, ''),
      conditions: Joi.object().optional().allow(null),
      tax_applicable: Joi.boolean().optional(),
      tax_percentage: Joi.number().min(0).max(50).precision(2).optional().allow(null).messages({
         'number.min': 'Tax percentage cannot be negative',
         'number.max': 'Tax percentage cannot exceed 50%',
      }),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional().messages({
         'any.only': 'Status must be ACTIVE, INACTIVE, or DRAFT',
      }),
      effective_to: Joi.date().optional().allow(null),
      approved_by: Joi.number().integer().positive().optional().allow(null).messages({
         'number.positive': 'Approved by user ID must be positive',
      }),
      additional_info: Joi.object().optional().allow(null),
   }),

   // Fee Structure Query Validation
   queryFeeStructures: Joi.object({
      school_id: Joi.number().integer().positive().optional().messages({
         'number.positive': 'School ID must be positive',
      }),
      class_id: Joi.number().integer().positive().optional().messages({
         'number.positive': 'Class ID must be positive',
      }),
      academic_year: Joi.string()
         .pattern(/^\d{4}-\d{2}$/)
         .optional()
         .messages({
            'string.pattern.base': 'Academic year must be in format YYYY-YY',
         }),
      fee_category: Joi.string()
         .valid(
            'TUITION',
            'ADMISSION',
            'DEVELOPMENT',
            'TRANSPORT',
            'LIBRARY',
            'LABORATORY',
            'COMPUTER',
            'SPORTS',
            'ACTIVITY',
            'EXAMINATION',
            'ANNUAL',
            'CAUTION_MONEY',
            'UNIFORM',
            'BOOKS',
            'STATIONERY',
            'HOSTEL',
            'MESS',
            'MEDICAL',
            'INSURANCE',
            'OTHER'
         )
         .optional(),
      fee_type: Joi.string().valid('MANDATORY', 'OPTIONAL', 'CONDITIONAL').optional(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
      frequency: Joi.string().valid('YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME').optional(),
      effective_from: Joi.date().optional(),
      effective_to: Joi.date().optional(),
      limit: Joi.number().integer().min(1).max(1000).default(50).messages({
         'number.min': 'Limit must be at least 1',
         'number.max': 'Limit cannot exceed 1000',
      }),
      offset: Joi.number().integer().min(0).default(0).messages({
         'number.min': 'Offset cannot be negative',
      }),
      sortBy: Joi.string().valid('id', 'fee_category', 'amount', 'effective_from', 'created_at').default('id'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
   })
      .min(1)
      .messages({
         'object.min': 'At least one filter parameter is required',
      }),

   // Bulk Fee Structure Operations
   bulkCreateFeeStructures: Joi.object({
      feeStructures: Joi.array()
         .items(
            Joi.object({
               school_id: Joi.number().integer().positive().required(),
               class_id: Joi.number().integer().positive().required(),
               academic_year: Joi.string()
                  .pattern(/^\d{4}-\d{2}$/)
                  .required(),
               fee_category: Joi.string()
                  .valid(
                     'TUITION',
                     'ADMISSION',
                     'DEVELOPMENT',
                     'TRANSPORT',
                     'LIBRARY',
                     'LABORATORY',
                     'COMPUTER',
                     'SPORTS',
                     'ACTIVITY',
                     'EXAMINATION',
                     'ANNUAL',
                     'CAUTION_MONEY',
                     'UNIFORM',
                     'BOOKS',
                     'STATIONERY',
                     'HOSTEL',
                     'MESS',
                     'MEDICAL',
                     'INSURANCE',
                     'OTHER'
                  )
                  .required(),
               amount: Joi.number().min(0).max(999999.99).precision(2).required(),
               frequency: Joi.string()
                  .valid('YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME')
                  .default('YEARLY'),
               effective_from: Joi.date().required(),
               created_by: Joi.number().integer().positive().required(),
            })
         )
         .min(1)
         .max(100)
         .required()
         .messages({
            'array.min': 'At least one fee structure is required',
            'array.max': 'Maximum 100 fee structures allowed per bulk operation',
            'any.required': 'Fee structures array is required',
         }),
   }),
};

/**
 * Fee Structure Model
 * Defines fee categories and amounts for different classes and academic years
 * Essential for fee collection and financial planning
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineFeeStructure(sequelize) {
   const FeeStructure = sequelize.define(
      'FeeStructure',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
         class_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'classes',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to class for which fee structure applies',
         },
         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year like "2024-25"',
            validate: {
               is: {
                  args: /^\d{4}-\d{2}$/,
                  msg: 'Academic year must be in format YYYY-YY (e.g., 2024-25)',
               },
            },
         },
         fee_category: {
            type: DataTypes.ENUM,
            values: [
               'TUITION',
               'ADMISSION',
               'DEVELOPMENT',
               'TRANSPORT',
               'LIBRARY',
               'LABORATORY',
               'COMPUTER',
               'SPORTS',
               'ACTIVITY',
               'EXAMINATION',
               'ANNUAL',
               'CAUTION_MONEY',
               'UNIFORM',
               'BOOKS',
               'STATIONERY',
               'HOSTEL',
               'MESS',
               'MEDICAL',
               'INSURANCE',
               'OTHER',
            ],
            allowNull: false,
            comment: 'Category of fee component',
         },
         fee_type: {
            type: DataTypes.ENUM,
            values: ['MANDATORY', 'OPTIONAL', 'CONDITIONAL'],
            allowNull: false,
            defaultValue: 'MANDATORY',
            comment: 'Whether fee is mandatory or optional',
         },
         amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Fee amount in rupees',
            validate: {
               min: {
                  args: [0],
                  msg: 'Amount cannot be negative',
               },
               max: {
                  args: [999999.99],
                  msg: 'Amount cannot exceed 999999.99',
               },
            },
         },
         frequency: {
            type: DataTypes.ENUM,
            values: ['YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME'],
            allowNull: false,
            defaultValue: 'YEARLY',
            comment: 'Payment frequency for this fee',
         },
         due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Due date for fee payment (if specific)',
         },
         due_month: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Month number when fee is due (1-12)',
            validate: {
               min: {
                  args: [1],
                  msg: 'Month must be between 1 and 12',
               },
               max: {
                  args: [12],
                  msg: 'Month must be between 1 and 12',
               },
            },
         },
         installments: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Number of installments allowed',
            validate: {
               min: {
                  args: [1],
                  msg: 'Installments must be at least 1',
               },
               max: {
                  args: [12],
                  msg: 'Maximum 12 installments allowed',
               },
            },
         },
         late_fee_applicable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether late fee is applicable for this component',
         },
         late_fee_amount: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: true,
            comment: 'Fixed late fee amount',
            validate: {
               min: {
                  args: [0],
                  msg: 'Late fee amount cannot be negative',
               },
            },
         },
         late_fee_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Late fee as percentage of original amount',
            validate: {
               min: {
                  args: [0],
                  msg: 'Late fee percentage cannot be negative',
               },
               max: {
                  args: [100],
                  msg: 'Late fee percentage cannot exceed 100%',
               },
            },
         },
         grace_period_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Grace period in days before late fee is applied',
            validate: {
               min: {
                  args: [0],
                  msg: 'Grace period cannot be negative',
               },
               max: {
                  args: [365],
                  msg: 'Grace period cannot exceed 365 days',
               },
            },
         },
         discount_applicable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether discounts can be applied to this fee',
         },
         refundable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this fee can be refunded',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of the fee component',
         },
         conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Conditions for fee applicability (JSON)',
         },
         tax_applicable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether tax is applicable on this fee',
         },
         tax_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Tax percentage if applicable',
            validate: {
               min: {
                  args: [0],
                  msg: 'Tax percentage cannot be negative',
               },
               max: {
                  args: [50],
                  msg: 'Tax percentage cannot exceed 50%',
               },
            },
         },
         status: {
            type: DataTypes.ENUM,
            values: ['ACTIVE', 'INACTIVE', 'DRAFT'],
            allowNull: false,
            defaultValue: 'ACTIVE',
            comment: 'Status of the fee structure',
         },
         effective_from: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date from which this fee structure is effective',
         },
         effective_to: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date until which this fee structure is valid',
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'User who created this fee structure',
         },
         approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who approved this fee structure',
         },
         approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when fee structure was approved',
         },
         additional_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional fee structure information',
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
         tableName: 'fee_structures',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary queries
            {
               name: 'idx_fee_structure_school_class',
               fields: ['school_id', 'class_id', 'academic_year'],
            },
            {
               name: 'idx_fee_structure_category',
               fields: ['fee_category', 'fee_type'],
            },
            {
               name: 'idx_fee_structure_year',
               fields: ['academic_year', 'status'],
            },
            {
               name: 'idx_fee_structure_effective',
               fields: ['effective_from', 'effective_to', 'status'],
            },
            {
               name: 'idx_fee_structure_frequency',
               fields: ['frequency', 'due_month'],
            },
         ],
         // Unique constraint: one fee structure per category per class per year
         constraints: [
            {
               name: 'unique_fee_structure_category',
               unique: true,
               fields: ['school_id', 'class_id', 'academic_year', 'fee_category'],
            },
         ],
      }
   );

   // Model associations
   FeeStructure.associate = function (models) {
      // Belongs to School
      FeeStructure.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to Class
      FeeStructure.belongsTo(models.Class, {
         foreignKey: 'class_id',
         as: 'class',
         onDelete: 'CASCADE',
      });

      // Belongs to User (created by)
      FeeStructure.belongsTo(models.User, {
         foreignKey: 'created_by',
         as: 'creator',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (approved by)
      FeeStructure.belongsTo(models.User, {
         foreignKey: 'approved_by',
         as: 'approver',
         onDelete: 'SET NULL',
      });

      // Has many StudentFees
      FeeStructure.hasMany(models.StudentFee, {
         foreignKey: 'fee_structure_id',
         as: 'studentFees',
         onDelete: 'CASCADE',
      });

      // Has many FeeCollections
      FeeStructure.hasMany(models.FeeCollection, {
         foreignKey: 'fee_structure_id',
         as: 'collections',
         onDelete: 'RESTRICT',
      });
   };

   // Instance methods for business logic
   FeeStructure.prototype.isActive = function () {
      return this.status === 'ACTIVE';
   };

   FeeStructure.prototype.isEffective = function (date = new Date()) {
      const checkDate = typeof date === 'string' ? new Date(date) : date;
      const fromDate = new Date(this.effective_from);
      const toDate = this.effective_to ? new Date(this.effective_to) : null;

      return checkDate >= fromDate && (!toDate || checkDate <= toDate);
   };

   FeeStructure.prototype.calculateTotalAmount = function () {
      let total = parseFloat(this.amount);

      if (this.tax_applicable && this.tax_percentage) {
         const taxAmount = (total * parseFloat(this.tax_percentage)) / 100;
         total += taxAmount;
      }

      return Math.round(total * 100) / 100; // Round to 2 decimals
   };

   FeeStructure.prototype.calculateLateFee = function () {
      if (!this.late_fee_applicable) {
         return 0;
      }

      let lateFee = 0;

      if (this.late_fee_amount) {
         lateFee = parseFloat(this.late_fee_amount);
      } else if (this.late_fee_percentage) {
         lateFee = (parseFloat(this.amount) * parseFloat(this.late_fee_percentage)) / 100;
      }

      return Math.round(lateFee * 100) / 100;
   };

   FeeStructure.prototype.getInstallmentAmount = function () {
      const totalAmount = this.calculateTotalAmount();
      return Math.round((totalAmount / this.installments) * 100) / 100;
   };

   FeeStructure.prototype.getDueDates = function (academicYear) {
      const dueDates = [];
      const startYear = parseInt(academicYear.split('-')[0]);

      for (let i = 0; i < this.installments; i++) {
         let dueDate;

         if (this.due_date) {
            // Specific due date
            dueDate = new Date(this.due_date);
         } else if (this.due_month) {
            // Monthly due dates
            const month = this.due_month + i;
            const year = month > 12 ? startYear + 1 : startYear;
            const adjustedMonth = month > 12 ? month - 12 : month;
            dueDate = new Date(year, adjustedMonth - 1, 10); // 10th of each month
         } else {
            // Default due dates based on frequency
            switch (this.frequency) {
               case 'QUARTERLY':
                  dueDate = new Date(startYear, i * 3 + 3, 10);
                  break;
               case 'HALF_YEARLY':
                  dueDate = new Date(startYear, i === 0 ? 6 : 12, 10);
                  break;
               case 'MONTHLY':
                  dueDate = new Date(startYear, i + 3, 10);
                  break;
               default:
                  dueDate = new Date(startYear, 3, 31); // March 31st for yearly
            }
         }

         dueDates.push(dueDate);
      }

      return dueDates;
   };

   // Class methods for calculations
   FeeStructure.calculateTotalFeeForClass = async function (classId, academicYear) {
      try {
         const { Op, fn, col } = require('sequelize');

         const result = await this.findAll({
            attributes: [
               [fn('SUM', col('amount')), 'totalAmount'],
               [fn('COUNT', col('id')), 'componentCount'],
            ],
            where: {
               class_id: classId,
               academic_year: academicYear,
               status: 'ACTIVE',
               effective_from: {
                  [Op.lte]: new Date(),
               },
               [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: new Date() } }],
            },
            raw: true,
         });

         return {
            totalAmount: parseFloat(result[0]?.totalAmount || 0),
            componentCount: parseInt(result[0]?.componentCount || 0),
         };
      } catch (error) {
         logger.error('Error calculating total fee for class', {
            class_id: classId,
            academic_year: academicYear,
            error: error.message,
         });
         throw error;
      }
   };

   FeeStructure.getEffectiveStructure = async function (schoolId, classId, academicYear, date = new Date()) {
      try {
         const { Op } = require('sequelize');

         const structures = await this.findAll({
            where: {
               school_id: schoolId,
               class_id: classId,
               academic_year: academicYear,
               status: 'ACTIVE',
               effective_from: {
                  [Op.lte]: date,
               },
               [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: date } }],
            },
            order: [['fee_category', 'ASC']],
         });

         return structures;
      } catch (error) {
         logger.error('Error getting effective fee structure', {
            school_id: schoolId,
            class_id: classId,
            academic_year: academicYear,
            error: error.message,
         });
         throw error;
      }
   };

   // Model associations
   FeeStructure.associate = function (models) {
      // Belongs to School
      FeeStructure.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to Class
      FeeStructure.belongsTo(models.Class, {
         foreignKey: 'class_id',
         as: 'class',
         onDelete: 'CASCADE',
      });

      // Belongs to User (created by)
      FeeStructure.belongsTo(models.User, {
         foreignKey: 'created_by',
         as: 'creator',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (approved by)
      FeeStructure.belongsTo(models.User, {
         foreignKey: 'approved_by',
         as: 'approver',
         onDelete: 'SET NULL',
      });

      // Has many Student Fees
      FeeStructure.hasMany(models.StudentFee, {
         foreignKey: 'fee_structure_id',
         as: 'studentFees',
         onDelete: 'CASCADE',
      });

      // Has many Fee Collections
      FeeStructure.hasMany(models.FeeCollection, {
         foreignKey: 'fee_structure_id',
         as: 'collections',
         onDelete: 'RESTRICT',
      });
   };

   return FeeStructure;
}

// Q59-ENFORCED: Export validation schemas
module.exports = {
   defineFeeStructure,
   feeStructureValidationSchemas,
};
