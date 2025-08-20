const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * Student Fee Model
 * Tracks individual fee assignments and calculations for students
 * Links students to fee structures with personalized amounts and discounts
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineStudentFee(sequelize) {
   const StudentFee = sequelize.define(
      'StudentFee',
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
            comment: 'Reference to student',
         },
         fee_structure_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'fee_structures',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to fee structure',
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
            comment: 'Reference to school (denormalized for performance)',
         },
         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year like "2024-25"',
         },
         original_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Original fee amount from structure',
         },
         discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Total discount amount applied',
         },
         discount_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Discount percentage applied',
         },
         discount_reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Reason for discount (scholarship, sibling, etc.)',
         },
         final_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Final amount after discounts',
         },
         tax_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Tax amount if applicable',
         },
         total_payable: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Total amount to be paid including tax',
         },
         paid_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Amount already paid',
         },
         balance_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Remaining balance amount',
         },
         late_fee_amount: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Late fee amount added',
         },
         installment_plan: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Number of installments',
         },
         installment_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Amount per installment',
         },
         payment_status: {
            type: DataTypes.ENUM,
            values: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'REFUNDED'],
            allowNull: false,
            defaultValue: 'PENDING',
            comment: 'Current payment status',
         },
         due_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Final due date for payment',
         },
         grace_period_end: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'End of grace period before late fee',
         },
         first_notice_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when first notice was sent',
         },
         final_notice_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when final notice was sent',
         },
         exempted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether student is exempted from this fee',
         },
         exemption_reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Reason for fee exemption',
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
            comment: 'User who approved discount/exemption',
         },
         approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when discount/exemption was approved',
         },
         notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional notes about this fee assignment',
         },
         calculation_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Detailed calculation breakdown (JSON)',
         },
         payment_reminders: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Payment reminder history (JSON)',
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
            comment: 'User who created this fee assignment',
         },
         last_calculated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Last time amounts were recalculated',
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
         tableName: 'student_fees',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary query indexes
            {
               name: 'idx_student_fees_student',
               fields: ['student_id', 'academic_year'],
            },
            {
               name: 'idx_student_fees_school',
               fields: ['school_id', 'academic_year', 'payment_status'],
            },
            {
               name: 'idx_student_fees_structure',
               fields: ['fee_structure_id'],
            },
            {
               name: 'idx_student_fees_status',
               fields: ['payment_status', 'due_date'],
            },
            {
               name: 'idx_student_fees_overdue',
               fields: ['due_date', 'payment_status'],
            },
            {
               name: 'idx_student_fees_balance',
               fields: ['balance_amount', 'payment_status'],
            },
         ],
         // Unique constraint: one fee assignment per student per fee structure
         constraints: [
            {
               name: 'unique_student_fee_structure',
               unique: true,
               fields: ['student_id', 'fee_structure_id'],
            },
         ],
      }
   );

   // Model associations
   StudentFee.associate = function (models) {
      // Belongs to Student
      StudentFee.belongsTo(models.Student, {
         foreignKey: 'student_id',
         as: 'student',
         onDelete: 'CASCADE',
      });

      // Belongs to FeeStructure
      StudentFee.belongsTo(models.FeeStructure, {
         foreignKey: 'fee_structure_id',
         as: 'feeStructure',
         onDelete: 'CASCADE',
      });

      // Belongs to School
      StudentFee.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to User (created by)
      StudentFee.belongsTo(models.User, {
         foreignKey: 'created_by',
         as: 'creator',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (approved by)
      StudentFee.belongsTo(models.User, {
         foreignKey: 'approved_by',
         as: 'approver',
         onDelete: 'SET NULL',
      });

      // Has many FeeCollections
      StudentFee.hasMany(models.FeeCollection, {
         foreignKey: 'student_fee_id',
         as: 'collections',
         onDelete: 'RESTRICT',
      });

      // Has many FeeInstallments
      StudentFee.hasMany(models.FeeInstallment, {
         foreignKey: 'student_fee_id',
         as: 'installments',
         onDelete: 'CASCADE',
      });
   };

   // Instance methods for business logic
   StudentFee.prototype.isPending = function () {
      return this.payment_status === 'PENDING';
   };

   StudentFee.prototype.isPaid = function () {
      return this.payment_status === 'PAID';
   };

   StudentFee.prototype.isOverdue = function () {
      return this.payment_status === 'OVERDUE' || (this.balance_amount > 0 && new Date() > new Date(this.due_date));
   };

   StudentFee.prototype.isPartiallyPaid = function () {
      return this.payment_status === 'PARTIAL' || (this.paid_amount > 0 && this.balance_amount > 0);
   };

   StudentFee.prototype.calculateDiscount = function (discountPercentage, discountAmount) {
      let calculatedDiscount = 0;

      if (discountPercentage) {
         calculatedDiscount = (parseFloat(this.original_amount) * parseFloat(discountPercentage)) / 100;
      } else if (discountAmount) {
         calculatedDiscount = parseFloat(discountAmount);
      }

      // Ensure discount doesn't exceed original amount
      return Math.min(calculatedDiscount, parseFloat(this.original_amount));
   };

   StudentFee.prototype.recalculateAmounts = function () {
      // Calculate final amount after discount
      this.final_amount = parseFloat(this.original_amount) - parseFloat(this.discount_amount);

      // Calculate tax if applicable
      if (this.tax_amount > 0) {
         this.total_payable = parseFloat(this.final_amount) + parseFloat(this.tax_amount);
      } else {
         this.total_payable = this.final_amount;
      }

      // Add late fee if applicable
      if (this.late_fee_amount > 0) {
         this.total_payable = parseFloat(this.total_payable) + parseFloat(this.late_fee_amount);
      }

      // Calculate balance
      this.balance_amount = parseFloat(this.total_payable) - parseFloat(this.paid_amount);

      // Calculate installment amount
      if (this.installment_plan > 1) {
         this.installment_amount = parseFloat(this.total_payable) / this.installment_plan;
      }

      // Update calculation timestamp
      this.last_calculated_at = new Date();

      // Round all amounts to 2 decimal places
      this.final_amount = Math.round(this.final_amount * 100) / 100;
      this.total_payable = Math.round(this.total_payable * 100) / 100;
      this.balance_amount = Math.round(this.balance_amount * 100) / 100;
      if (this.installment_amount) {
         this.installment_amount = Math.round(this.installment_amount * 100) / 100;
      }
   };

   StudentFee.prototype.updatePaymentStatus = function () {
      if (this.balance_amount <= 0) {
         this.payment_status = 'PAID';
      } else if (this.paid_amount > 0) {
         this.payment_status = 'PARTIAL';
      } else if (new Date() > new Date(this.due_date)) {
         this.payment_status = 'OVERDUE';
      } else {
         this.payment_status = 'PENDING';
      }
   };

   StudentFee.prototype.addLateFee = function (lateFeeAmount) {
      this.late_fee_amount = parseFloat(this.late_fee_amount) + parseFloat(lateFeeAmount);
      this.recalculateAmounts();
   };

   StudentFee.prototype.applyDiscount = function (discountAmount, discountReason, approvedBy) {
      this.discount_amount = parseFloat(discountAmount);
      this.discount_reason = discountReason;
      this.approved_by = approvedBy;
      this.approved_at = new Date();

      // Calculate discount percentage
      if (this.original_amount > 0) {
         this.discount_percentage = (this.discount_amount / parseFloat(this.original_amount)) * 100;
      }

      this.recalculateAmounts();
   };

   StudentFee.prototype.recordPayment = function (paidAmount) {
      this.paid_amount = parseFloat(this.paid_amount) + parseFloat(paidAmount);
      this.recalculateAmounts();
      this.updatePaymentStatus();
   };

   StudentFee.prototype.getDaysOverdue = function () {
      if (!this.isOverdue()) {
         return 0;
      }

      const today = new Date();
      const dueDate = new Date(this.due_date);
      const diffTime = today - dueDate;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   };

   StudentFee.prototype.getPaymentProgress = function () {
      if (this.total_payable <= 0) {
         return 100;
      }

      return Math.round((parseFloat(this.paid_amount) / parseFloat(this.total_payable)) * 100);
   };

   // Class methods for bulk operations
   StudentFee.createFromStructure = async function (studentId, feeStructure, createdBy, options = {}) {
      try {
         const studentFeeData = {
            student_id: studentId,
            fee_structure_id: feeStructure.id,
            school_id: feeStructure.school_id,
            academic_year: feeStructure.academic_year,
            original_amount: feeStructure.amount,
            discount_amount: options.discountAmount || 0,
            discount_percentage: options.discountPercentage || null,
            discount_reason: options.discountReason || null,
            tax_amount: feeStructure.tax_applicable
               ? (parseFloat(feeStructure.amount) * parseFloat(feeStructure.tax_percentage || 0)) / 100
               : 0,
            due_date: options.dueDate || feeStructure.getDueDates(feeStructure.academic_year)[0],
            installment_plan: options.installmentPlan || feeStructure.installments,
            created_by: createdBy,
         };

         // Calculate amounts
         const discountAmount = studentFeeData.discount_amount;
         studentFeeData.final_amount = parseFloat(studentFeeData.original_amount) - discountAmount;
         studentFeeData.total_payable = studentFeeData.final_amount + studentFeeData.tax_amount;
         studentFeeData.balance_amount = studentFeeData.total_payable;

         if (studentFeeData.installment_plan > 1) {
            studentFeeData.installment_amount = studentFeeData.total_payable / studentFeeData.installment_plan;
         }

         const studentFee = await this.create(studentFeeData);
         return studentFee;
      } catch (error) {
         logger.error('Error creating student fee from structure', {
            student_id: studentId,
            fee_structure_id: feeStructure.id,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFee.getOverdueFees = async function (schoolId, daysOverdue = 0) {
      try {
         const { Op } = require('sequelize');
         const cutoffDate = new Date();
         cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

         const overdueFees = await this.findAll({
            where: {
               school_id: schoolId,
               balance_amount: {
                  [Op.gt]: 0,
               },
               due_date: {
                  [Op.lt]: cutoffDate,
               },
               payment_status: {
                  [Op.in]: ['PENDING', 'PARTIAL', 'OVERDUE'],
               },
            },
            include: [
               {
                  model: this.sequelize.models.Student,
                  as: 'student',
                  attributes: ['id', 'first_name', 'last_name', 'admission_number'],
               },
               {
                  model: this.sequelize.models.FeeStructure,
                  as: 'feeStructure',
                  attributes: ['fee_category', 'fee_type'],
               },
            ],
            order: [['due_date', 'ASC']],
         });

         return overdueFees;
      } catch (error) {
         logger.error('Error getting overdue fees', {
            school_id: schoolId,
            days_overdue: daysOverdue,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFee.calculateTotalDues = async function (studentId, academicYear) {
      try {
         const { fn, col } = require('sequelize');

         const result = await this.findAll({
            attributes: [
               [fn('SUM', col('total_payable')), 'totalPayable'],
               [fn('SUM', col('paid_amount')), 'totalPaid'],
               [fn('SUM', col('balance_amount')), 'totalBalance'],
               [fn('COUNT', col('id')), 'feeCount'],
            ],
            where: {
               student_id: studentId,
               academic_year: academicYear,
               payment_status: {
                  [require('sequelize').Op.ne]: 'WAIVED',
               },
            },
            raw: true,
         });

         return {
            totalPayable: parseFloat(result[0]?.totalPayable || 0),
            totalPaid: parseFloat(result[0]?.totalPaid || 0),
            totalBalance: parseFloat(result[0]?.totalBalance || 0),
            feeCount: parseInt(result[0]?.feeCount || 0),
         };
      } catch (error) {
         logger.error('Error calculating total dues', {
            student_id: studentId,
            academic_year: academicYear,
            error: error.message,
         });
         throw error;
      }
   };

   // Validation schemas for API endpoints
   StudentFee.validationSchemas = {
      create: {
         student_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         fee_structure_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         discount_amount: {
            required: false,
            type: 'number',
            min: 0,
         },
         discount_percentage: {
            required: false,
            type: 'number',
            min: 0,
            max: 100,
         },
         installment_plan: {
            required: false,
            type: 'integer',
            min: 1,
            max: 12,
         },
      },
      update: {
         discount_amount: {
            required: false,
            type: 'number',
            min: 0,
         },
         payment_status: {
            required: false,
            type: 'string',
            enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'REFUNDED'],
         },
         notes: {
            required: false,
            type: 'string',
            maxLength: 1000,
         },
      },
   };

   return StudentFee;
}

module.exports = defineStudentFee;
