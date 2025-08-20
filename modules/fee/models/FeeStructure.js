const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

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

   // Validation schemas for API endpoints
   FeeStructure.validationSchemas = {
      create: {
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
         academic_year: {
            required: true,
            type: 'string',
            pattern: /^\d{4}-\d{2}$/,
         },
         fee_category: {
            required: true,
            type: 'string',
            enum: [
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
         },
         amount: {
            required: true,
            type: 'number',
            min: 0,
            max: 999999.99,
         },
         frequency: {
            required: false,
            type: 'string',
            enum: ['YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME'],
         },
         effective_from: {
            required: true,
            type: 'date',
         },
      },
      update: {
         amount: {
            required: false,
            type: 'number',
            min: 0,
            max: 999999.99,
         },
         frequency: {
            required: false,
            type: 'string',
            enum: ['YEARLY', 'HALF_YEARLY', 'QUARTERLY', 'MONTHLY', 'ONE_TIME'],
         },
         status: {
            required: false,
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'DRAFT'],
         },
         effective_to: {
            required: false,
            type: 'date',
         },
      },
   };

   return FeeStructure;
}

module.exports = defineFeeStructure;
