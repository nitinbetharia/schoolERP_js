const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * Fee Installment Model
 * Manages fee installment plans and due dates
 * Essential for breaking down fees into manageable payments
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineFeeInstallment(sequelize) {
   const FeeInstallment = sequelize.define(
      'FeeInstallment',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         student_fee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'student_fees',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to student fee',
         },
         fee_structure_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'fee_structures',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'Reference to fee structure',
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
            comment: 'Reference to student (denormalized)',
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
            comment: 'Reference to school (denormalized)',
         },
         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year like "2024-25"',
         },
         installment_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Installment sequence number (1, 2, 3...)',
            validate: {
               min: {
                  args: [1],
                  msg: 'Installment number must be at least 1',
               },
               max: {
                  args: [12],
                  msg: 'Installment number cannot exceed 12',
               },
            },
         },
         installment_title: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Title like "First Installment", "April Fee", etc.',
         },
         due_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Due date for this installment',
         },
         due_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Amount due for this installment',
            validate: {
               min: {
                  args: [0.01],
                  msg: 'Due amount must be greater than 0',
               },
               max: {
                  args: [999999.99],
                  msg: 'Due amount cannot exceed 999999.99',
               },
            },
         },
         base_fee_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Base fee amount (excluding late fees, taxes)',
         },
         tax_amount: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Tax amount for this installment',
         },
         discount_amount: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Discount amount applied to this installment',
         },
         late_fee_amount: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Late fee amount for this installment',
         },
         adjustment_amount: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Any adjustment amount (positive or negative)',
         },
         paid_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Amount already paid for this installment',
         },
         balance_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Remaining balance amount',
         },
         payment_status: {
            type: DataTypes.ENUM,
            values: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED'],
            allowNull: false,
            defaultValue: 'PENDING',
            comment: 'Payment status of this installment',
         },
         installment_type: {
            type: DataTypes.ENUM,
            values: ['REGULAR', 'ADVANCE', 'SUPPLEMENTARY', 'MAKEUP'],
            allowNull: false,
            defaultValue: 'REGULAR',
            comment: 'Type of installment',
         },
         grace_period_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Grace period days after due date',
            validate: {
               min: {
                  args: [0],
                  msg: 'Grace period cannot be negative',
               },
               max: {
                  args: [90],
                  msg: 'Grace period cannot exceed 90 days',
               },
            },
         },
         late_fee_applicable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether late fee is applicable for this installment',
         },
         late_fee_waived: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether late fee has been waived',
         },
         late_fee_waived_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who waived the late fee',
         },
         late_fee_waived_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when late fee was waived',
         },
         late_fee_waiver_reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Reason for waiving late fee',
         },
         first_payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date of first payment towards this installment',
         },
         last_payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date of last payment towards this installment',
         },
         full_payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when installment was fully paid',
         },
         overdue_notice_sent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether overdue notice has been sent',
         },
         overdue_notice_sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when overdue notice was sent',
         },
         reminder_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of payment reminders sent',
         },
         last_reminder_sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when last reminder was sent',
         },
         auto_late_fee_applied: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether late fee has been auto-applied',
         },
         auto_late_fee_applied_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when late fee was auto-applied',
         },
         is_locked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether installment is locked from modifications',
         },
         locked_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who locked the installment',
         },
         locked_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when installment was locked',
         },
         lock_reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Reason for locking the installment',
         },
         notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional notes about this installment',
         },
         additional_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional installment information',
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
         tableName: 'fee_installments',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary query indexes
            {
               name: 'idx_fee_installment_student_fee',
               fields: ['student_fee_id', 'installment_number'],
               unique: true,
            },
            {
               name: 'idx_fee_installment_student',
               fields: ['student_id', 'academic_year', 'due_date'],
            },
            {
               name: 'idx_fee_installment_school',
               fields: ['school_id', 'due_date', 'payment_status'],
            },
            {
               name: 'idx_fee_installment_due_date',
               fields: ['due_date', 'payment_status'],
            },
            {
               name: 'idx_fee_installment_status',
               fields: ['payment_status', 'installment_type'],
            },
            {
               name: 'idx_fee_installment_overdue',
               fields: ['due_date', 'payment_status', 'late_fee_applicable'],
               where: {
                  payment_status: ['PENDING', 'PARTIAL'],
               },
            },
            {
               name: 'idx_fee_installment_reminders',
               fields: ['due_date', 'payment_status', 'last_reminder_sent_at'],
            },
         ],
      }
   );

   // Model associations
   FeeInstallment.associate = function (models) {
      // Belongs to StudentFee
      FeeInstallment.belongsTo(models.StudentFee, {
         foreignKey: 'student_fee_id',
         as: 'studentFee',
         onDelete: 'CASCADE',
      });

      // Belongs to FeeStructure
      FeeInstallment.belongsTo(models.FeeStructure, {
         foreignKey: 'fee_structure_id',
         as: 'feeStructure',
         onDelete: 'RESTRICT',
      });

      // Belongs to Student
      FeeInstallment.belongsTo(models.Student, {
         foreignKey: 'student_id',
         as: 'student',
         onDelete: 'CASCADE',
      });

      // Belongs to School
      FeeInstallment.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to User (late fee waived by)
      FeeInstallment.belongsTo(models.User, {
         foreignKey: 'late_fee_waived_by',
         as: 'lateFeeWaivedBy',
         onDelete: 'SET NULL',
      });

      // Belongs to User (locked by)
      FeeInstallment.belongsTo(models.User, {
         foreignKey: 'locked_by',
         as: 'lockedBy',
         onDelete: 'SET NULL',
      });

      // Has many FeeCollections
      FeeInstallment.hasMany(models.FeeCollection, {
         foreignKey: 'installment_number',
         as: 'payments',
         constraints: false,
         scope: {
            // Additional scope conditions can be added here
         },
      });
   };

   // Instance methods for business logic
   FeeInstallment.prototype.isPending = function () {
      return this.payment_status === 'PENDING';
   };

   FeeInstallment.prototype.isPartiallyPaid = function () {
      return this.payment_status === 'PARTIAL';
   };

   FeeInstallment.prototype.isFullyPaid = function () {
      return this.payment_status === 'PAID';
   };

   FeeInstallment.prototype.isOverdue = function () {
      return (
         this.payment_status === 'OVERDUE' || (this.isOutstanding() && this.getDaysOverdue() > this.grace_period_days)
      );
   };

   FeeInstallment.prototype.isOutstanding = function () {
      return ['PENDING', 'PARTIAL', 'OVERDUE'].includes(this.payment_status);
   };

   FeeInstallment.prototype.isWaived = function () {
      return this.payment_status === 'WAIVED';
   };

   FeeInstallment.prototype.isCancelled = function () {
      return this.payment_status === 'CANCELLED';
   };

   FeeInstallment.prototype.getDaysOverdue = function () {
      if (!this.isOutstanding()) return 0;

      const today = new Date();
      const dueDate = new Date(this.due_date);
      const timeDiff = today.getTime() - dueDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return Math.max(0, daysDiff);
   };

   FeeInstallment.prototype.getDaysUntilDue = function () {
      const today = new Date();
      const dueDate = new Date(this.due_date);
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return daysDiff; // Can be negative if overdue
   };

   FeeInstallment.prototype.calculateLateFee = function () {
      if (!this.late_fee_applicable || this.late_fee_waived || !this.isOverdue()) {
         return 0;
      }

      const daysOverdue = Math.max(0, this.getDaysOverdue() - this.grace_period_days);
      if (daysOverdue <= 0) return 0;

      // Get late fee configuration from fee structure
      // This would typically come from the associated fee structure
      // For now, using a simple calculation
      const lateFeePerDay = 5; // ₹5 per day
      const maxLateFee = this.base_fee_amount * 0.1; // Max 10% of base fee

      const calculatedLateFee = Math.min(daysOverdue * lateFeePerDay, maxLateFee);

      return Math.round(calculatedLateFee * 100) / 100; // Round to 2 decimals
   };

   FeeInstallment.prototype.applyLateFee = async function () {
      try {
         if (!this.late_fee_applicable || this.late_fee_waived || this.auto_late_fee_applied) {
            return false;
         }

         const calculatedLateFee = this.calculateLateFee();
         if (calculatedLateFee <= 0) return false;

         this.late_fee_amount = calculatedLateFee;
         this.due_amount =
            parseFloat(this.base_fee_amount) +
            parseFloat(this.tax_amount) +
            parseFloat(this.late_fee_amount) -
            parseFloat(this.discount_amount);
         this.balance_amount = this.due_amount - this.paid_amount;
         this.auto_late_fee_applied = true;
         this.auto_late_fee_applied_at = new Date();

         await this.save();

         logger.info('Late fee applied to installment', {
            installment_id: this.id,
            student_id: this.student_id,
            late_fee_amount: calculatedLateFee,
         });

         return true;
      } catch (error) {
         logger.error('Error applying late fee', {
            installment_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   FeeInstallment.prototype.waiveLateFee = async function (waivedBy, reason) {
      try {
         if (!this.late_fee_applicable || this.late_fee_waived) {
            return false;
         }

         const oldLateFee = this.late_fee_amount;

         this.late_fee_amount = 0;
         this.late_fee_waived = true;
         this.late_fee_waived_by = waivedBy;
         this.late_fee_waived_at = new Date();
         this.late_fee_waiver_reason = reason;

         // Recalculate amounts
         this.due_amount =
            parseFloat(this.base_fee_amount) + parseFloat(this.tax_amount) - parseFloat(this.discount_amount);
         this.balance_amount = this.due_amount - this.paid_amount;

         await this.save();

         logger.info('Late fee waived for installment', {
            installment_id: this.id,
            student_id: this.student_id,
            waived_amount: oldLateFee,
            waived_by: waivedBy,
            reason: reason,
         });

         return true;
      } catch (error) {
         logger.error('Error waiving late fee', {
            installment_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   FeeInstallment.prototype.recordPayment = async function (paymentAmount) {
      try {
         const payment = parseFloat(paymentAmount);

         this.paid_amount = parseFloat(this.paid_amount) + payment;
         this.balance_amount = this.due_amount - this.paid_amount;

         // Set payment dates
         if (!this.first_payment_date) {
            this.first_payment_date = new Date();
         }
         this.last_payment_date = new Date();

         // Update payment status
         if (this.balance_amount <= 0.01) {
            // Allow for rounding differences
            this.payment_status = 'PAID';
            this.full_payment_date = new Date();
            this.balance_amount = 0;
         } else if (this.paid_amount > 0) {
            this.payment_status = 'PARTIAL';
         }

         await this.save();

         logger.info('Payment recorded for installment', {
            installment_id: this.id,
            student_id: this.student_id,
            payment_amount: payment,
            balance_amount: this.balance_amount,
            payment_status: this.payment_status,
         });

         return true;
      } catch (error) {
         logger.error('Error recording payment for installment', {
            installment_id: this.id,
            payment_amount: paymentAmount,
            error: error.message,
         });
         throw error;
      }
   };

   FeeInstallment.prototype.updatePaymentStatus = async function () {
      try {
         let newStatus = this.payment_status;

         if (this.balance_amount <= 0.01) {
            newStatus = 'PAID';
         } else if (this.paid_amount > 0) {
            newStatus = 'PARTIAL';
         } else if (this.isOverdue()) {
            newStatus = 'OVERDUE';
         } else {
            newStatus = 'PENDING';
         }

         if (newStatus !== this.payment_status) {
            this.payment_status = newStatus;
            await this.save();
         }

         return newStatus;
      } catch (error) {
         logger.error('Error updating payment status', {
            installment_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   // Class methods for business operations
   FeeInstallment.createInstallments = async function (studentFeeId, feeStructure, studentFee) {
      const transaction = await this.sequelize.transaction();

      try {
         const installments = [];
         const installmentPlan = feeStructure.installment_plan;

         if (!installmentPlan || installmentPlan.length === 0) {
            throw new Error('No installment plan defined in fee structure');
         }

         for (let i = 0; i < installmentPlan.length; i++) {
            const plan = installmentPlan[i];
            const installmentAmount = (studentFee.total_amount * plan.percentage) / 100;

            const installment = await this.create(
               {
                  student_fee_id: studentFeeId,
                  fee_structure_id: feeStructure.id,
                  student_id: studentFee.student_id,
                  school_id: studentFee.school_id,
                  academic_year: studentFee.academic_year,
                  installment_number: plan.installment_number,
                  installment_title: plan.title,
                  due_date: plan.due_date,
                  due_amount: installmentAmount,
                  base_fee_amount: installmentAmount,
                  tax_amount: 0,
                  discount_amount: 0,
                  balance_amount: installmentAmount,
                  grace_period_days: plan.grace_period_days || 0,
                  late_fee_applicable: plan.late_fee_applicable !== false,
               },
               { transaction }
            );

            installments.push(installment);
         }

         await transaction.commit();

         logger.info('Installments created successfully', {
            student_fee_id: studentFeeId,
            installments_count: installments.length,
         });

         return installments;
      } catch (error) {
         await transaction.rollback();
         logger.error('Error creating installments', {
            student_fee_id: studentFeeId,
            error: error.message,
         });
         throw error;
      }
   };

   FeeInstallment.getOverdueInstallments = async function (schoolId, graceDays = 0) {
      try {
         const { Op } = require('sequelize');
         const overdueDate = new Date();
         overdueDate.setDate(overdueDate.getDate() - graceDays);

         const overdue = await this.findAll({
            where: {
               school_id: schoolId,
               payment_status: ['PENDING', 'PARTIAL'],
               due_date: {
                  [Op.lt]: overdueDate,
               },
               late_fee_applicable: true,
            },
            include: [
               {
                  model: this.sequelize.models.Student,
                  as: 'student',
                  attributes: ['id', 'admission_number', 'first_name', 'last_name'],
               },
               {
                  model: this.sequelize.models.FeeStructure,
                  as: 'feeStructure',
                  attributes: ['id', 'fee_name', 'fee_category'],
               },
            ],
            order: [['due_date', 'ASC']],
         });

         return overdue;
      } catch (error) {
         logger.error('Error getting overdue installments', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   };

   FeeInstallment.getDueInstallments = async function (schoolId, daysAhead = 7) {
      try {
         const { Op } = require('sequelize');
         const startDate = new Date();
         const endDate = new Date();
         endDate.setDate(endDate.getDate() + daysAhead);

         const due = await this.findAll({
            where: {
               school_id: schoolId,
               payment_status: ['PENDING', 'PARTIAL'],
               due_date: {
                  [Op.between]: [startDate, endDate],
               },
            },
            include: [
               {
                  model: this.sequelize.models.Student,
                  as: 'student',
                  attributes: ['id', 'admission_number', 'first_name', 'last_name'],
               },
               {
                  model: this.sequelize.models.FeeStructure,
                  as: 'feeStructure',
                  attributes: ['id', 'fee_name', 'fee_category'],
               },
            ],
            order: [['due_date', 'ASC']],
         });

         return due;
      } catch (error) {
         logger.error('Error getting due installments', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   };

   FeeInstallment.processAutoLateFees = async function (schoolId) {
      try {
         const overdue = await this.getOverdueInstallments(schoolId);
         const results = [];

         for (const installment of overdue) {
            try {
               const applied = await installment.applyLateFee();
               results.push({
                  installment_id: installment.id,
                  student_id: installment.student_id,
                  late_fee_applied: applied,
                  late_fee_amount: applied ? installment.late_fee_amount : 0,
               });
            } catch (error) {
               logger.error('Error applying late fee to installment', {
                  installment_id: installment.id,
                  error: error.message,
               });
               results.push({
                  installment_id: installment.id,
                  student_id: installment.student_id,
                  late_fee_applied: false,
                  error: error.message,
               });
            }
         }

         logger.info('Auto late fee processing completed', {
            school_id: schoolId,
            processed_count: results.length,
            applied_count: results.filter((r) => r.late_fee_applied).length,
         });

         return results;
      } catch (error) {
         logger.error('Error processing auto late fees', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   };

   // Validation schemas for API endpoints
   FeeInstallment.validationSchemas = {
      create: {
         student_fee_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         installment_number: {
            required: true,
            type: 'integer',
            min: 1,
            max: 12,
         },
         due_date: {
            required: true,
            type: 'date',
         },
         due_amount: {
            required: true,
            type: 'number',
            min: 0.01,
            max: 999999.99,
         },
      },
      update: {
         payment_status: {
            required: false,
            type: 'string',
            enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED'],
         },
         notes: {
            required: false,
            type: 'string',
            maxLength: 1000,
         },
      },
   };

   return FeeInstallment;
}

module.exports = defineFeeInstallment;
