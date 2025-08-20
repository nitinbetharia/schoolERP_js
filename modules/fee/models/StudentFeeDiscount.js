const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * Student Fee Discount Model
 * Junction table for student fee and discount assignments
 * Tracks which discounts are applied to which student fees
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineStudentFeeDiscount(sequelize) {
   const StudentFeeDiscount = sequelize.define(
      'StudentFeeDiscount',
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
         fee_discount_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'fee_discounts',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to fee discount',
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
         discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Calculated discount amount for this student',
            validate: {
               min: {
                  args: [0],
                  msg: 'Discount amount cannot be negative',
               },
               max: {
                  args: [999999.99],
                  msg: 'Discount amount cannot exceed 999999.99',
               },
            },
         },
         original_fee_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Original fee amount before discount',
         },
         final_fee_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Final fee amount after discount',
         },
         discount_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Actual discount percentage applied',
         },
         application_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Date when discount was applied',
         },
         effective_from: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date from which discount is effective',
         },
         effective_until: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date until which discount is valid',
         },
         application_status: {
            type: DataTypes.ENUM,
            values: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
            allowNull: false,
            defaultValue: 'PENDING',
            comment: 'Status of discount application',
         },
         auto_applied: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether discount was auto-applied',
         },
         applied_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
            comment: 'User who applied the discount',
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
            comment: 'User who approved the discount',
         },
         approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when discount was approved',
         },
         rejected_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who rejected the discount',
         },
         rejected_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when discount was rejected',
         },
         rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for rejection',
         },
         cancelled_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who cancelled the discount',
         },
         cancelled_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when discount was cancelled',
         },
         cancellation_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for cancellation',
         },
         supporting_documents: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'List of supporting documents submitted',
         },
         verification_status: {
            type: DataTypes.ENUM,
            values: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_REQUIRED'],
            allowNull: false,
            defaultValue: 'NOT_REQUIRED',
            comment: 'Status of document verification',
         },
         verification_notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Notes from document verification',
         },
         verified_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who verified the documents',
         },
         verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when documents were verified',
         },
         renewal_required: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether discount requires annual renewal',
         },
         last_renewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp of last renewal',
         },
         next_renewal_due: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when next renewal is due',
         },
         budget_utilized: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Budget utilized for this discount instance',
         },
         refund_processed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether refund has been processed (if cancelled)',
         },
         refund_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Amount refunded (if applicable)',
         },
         priority_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Priority order when multiple discounts applied',
         },
         remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional remarks about discount application',
         },
         audit_trail: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Audit trail of all changes',
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
         tableName: 'student_fee_discounts',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary query indexes
            {
               name: 'idx_student_fee_discount_unique',
               fields: ['student_fee_id', 'fee_discount_id'],
               unique: true,
            },
            {
               name: 'idx_student_fee_discount_student',
               fields: ['student_id', 'academic_year', 'application_status'],
            },
            {
               name: 'idx_student_fee_discount_school',
               fields: ['school_id', 'application_date', 'application_status'],
            },
            {
               name: 'idx_student_fee_discount_status',
               fields: ['application_status', 'verification_status'],
            },
            {
               name: 'idx_student_fee_discount_approval',
               fields: ['application_status', 'approved_by', 'approved_at'],
            },
            {
               name: 'idx_student_fee_discount_effective',
               fields: ['effective_from', 'effective_until', 'application_status'],
            },
            {
               name: 'idx_student_fee_discount_renewal',
               fields: ['renewal_required', 'next_renewal_due'],
            },
         ],
      }
   );

   // Model associations
   StudentFeeDiscount.associate = function (models) {
      // Belongs to Student
      StudentFeeDiscount.belongsTo(models.Student, {
         foreignKey: 'student_id',
         as: 'student',
         onDelete: 'CASCADE',
      });

      // Belongs to StudentFee
      StudentFeeDiscount.belongsTo(models.StudentFee, {
         foreignKey: 'student_fee_id',
         as: 'studentFee',
         onDelete: 'CASCADE',
      });

      // Belongs to FeeDiscount
      StudentFeeDiscount.belongsTo(models.FeeDiscount, {
         foreignKey: 'fee_discount_id',
         as: 'feeDiscount',
         onDelete: 'CASCADE',
      });

      // Belongs to School
      StudentFeeDiscount.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to User (applied by)
      StudentFeeDiscount.belongsTo(models.User, {
         foreignKey: 'applied_by',
         as: 'appliedBy',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (approved by)
      StudentFeeDiscount.belongsTo(models.User, {
         foreignKey: 'approved_by',
         as: 'approvedBy',
         onDelete: 'SET NULL',
      });

      // Belongs to User (rejected by)
      StudentFeeDiscount.belongsTo(models.User, {
         foreignKey: 'rejected_by',
         as: 'rejectedBy',
         onDelete: 'SET NULL',
      });

      // Belongs to User (cancelled by)
      StudentFeeDiscount.belongsTo(models.User, {
         foreignKey: 'cancelled_by',
         as: 'cancelledBy',
         onDelete: 'SET NULL',
      });

      // Belongs to User (verified by)
      StudentFeeDiscount.belongsTo(models.User, {
         foreignKey: 'verified_by',
         as: 'verifiedBy',
         onDelete: 'SET NULL',
      });
   };

   // Instance methods for business logic
   StudentFeeDiscount.prototype.isPending = function () {
      return this.application_status === 'PENDING';
   };

   StudentFeeDiscount.prototype.isApproved = function () {
      return this.application_status === 'APPROVED';
   };

   StudentFeeDiscount.prototype.isRejected = function () {
      return this.application_status === 'REJECTED';
   };

   StudentFeeDiscount.prototype.isCancelled = function () {
      return this.application_status === 'CANCELLED';
   };

   StudentFeeDiscount.prototype.isExpired = function () {
      return (
         this.application_status === 'EXPIRED' || (this.effective_until && new Date() > new Date(this.effective_until))
      );
   };

   StudentFeeDiscount.prototype.isActive = function () {
      if (!this.isApproved()) return false;
      if (this.isExpired()) return false;

      const today = new Date();
      if (today < new Date(this.effective_from)) return false;

      return true;
   };

   StudentFeeDiscount.prototype.needsRenewal = function () {
      if (!this.renewal_required) return false;
      if (!this.next_renewal_due) return false;

      const today = new Date();
      const renewalDue = new Date(this.next_renewal_due);

      return today >= renewalDue;
   };

   StudentFeeDiscount.prototype.canBeApproved = function () {
      return (
         this.isPending() && (this.verification_status === 'VERIFIED' || this.verification_status === 'NOT_REQUIRED')
      );
   };

   StudentFeeDiscount.prototype.canBeCancelled = function () {
      return ['PENDING', 'APPROVED'].includes(this.application_status);
   };

   StudentFeeDiscount.prototype.approve = async function (approvedBy, remarks = null) {
      try {
         if (!this.canBeApproved()) {
            throw new Error('Discount cannot be approved in current state');
         }

         this.application_status = 'APPROVED';
         this.approved_by = approvedBy;
         this.approved_at = new Date();

         if (remarks) {
            this.remarks = remarks;
         }

         // Update audit trail
         this.addToAuditTrail('APPROVED', approvedBy, remarks);

         await this.save();

         // Update student fee with discount
         const studentFee = await this.getStudentFee();
         if (studentFee) {
            await studentFee.applyDiscount(this.discount_amount);
         }

         // Update discount budget utilization
         const feeDiscount = await this.getFeeDiscount();
         if (feeDiscount) {
            await feeDiscount.updateBudgetUtilization(this.discount_amount);
         }

         logger.info('Discount approved', {
            student_fee_discount_id: this.id,
            student_id: this.student_id,
            discount_amount: this.discount_amount,
            approved_by: approvedBy,
         });

         return true;
      } catch (error) {
         logger.error('Error approving discount', {
            student_fee_discount_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFeeDiscount.prototype.reject = async function (rejectedBy, reason) {
      try {
         if (!this.isPending()) {
            throw new Error('Only pending discounts can be rejected');
         }

         this.application_status = 'REJECTED';
         this.rejected_by = rejectedBy;
         this.rejected_at = new Date();
         this.rejection_reason = reason;

         // Update audit trail
         this.addToAuditTrail('REJECTED', rejectedBy, reason);

         await this.save();

         logger.info('Discount rejected', {
            student_fee_discount_id: this.id,
            student_id: this.student_id,
            rejected_by: rejectedBy,
            reason: reason,
         });

         return true;
      } catch (error) {
         logger.error('Error rejecting discount', {
            student_fee_discount_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFeeDiscount.prototype.cancel = async function (cancelledBy, reason) {
      try {
         if (!this.canBeCancelled()) {
            throw new Error('Discount cannot be cancelled in current state');
         }

         const wasApproved = this.isApproved();

         this.application_status = 'CANCELLED';
         this.cancelled_by = cancelledBy;
         this.cancelled_at = new Date();
         this.cancellation_reason = reason;

         // If discount was already applied, process refund
         if (wasApproved && this.discount_amount > 0) {
            await this.processRefund();
         }

         // Update audit trail
         this.addToAuditTrail('CANCELLED', cancelledBy, reason);

         await this.save();

         // Revert student fee discount if was approved
         if (wasApproved) {
            const studentFee = await this.getStudentFee();
            if (studentFee) {
               await studentFee.revertDiscount(this.discount_amount);
            }
         }

         logger.info('Discount cancelled', {
            student_fee_discount_id: this.id,
            student_id: this.student_id,
            cancelled_by: cancelledBy,
            reason: reason,
            refund_processed: this.refund_processed,
         });

         return true;
      } catch (error) {
         logger.error('Error cancelling discount', {
            student_fee_discount_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFeeDiscount.prototype.processRefund = async function () {
      try {
         if (this.refund_processed) return false;

         // Calculate refund amount (could be partial if payment already made)
         const studentFee = await this.getStudentFee();
         if (!studentFee) return false;

         // For simplicity, refund full discount amount
         // In real scenario, this would be more complex based on payments made
         this.refund_amount = this.discount_amount;
         this.refund_processed = true;

         await this.save();

         logger.info('Refund processed for cancelled discount', {
            student_fee_discount_id: this.id,
            refund_amount: this.refund_amount,
         });

         return true;
      } catch (error) {
         logger.error('Error processing refund', {
            student_fee_discount_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFeeDiscount.prototype.addToAuditTrail = function (action, userId, notes = null) {
      try {
         if (!this.audit_trail) {
            this.audit_trail = [];
         }

         this.audit_trail.push({
            action: action,
            user_id: userId,
            timestamp: new Date().toISOString(),
            notes: notes,
         });
      } catch (error) {
         logger.error('Error adding to audit trail', {
            student_fee_discount_id: this.id,
            action: action,
            error: error.message,
         });
      }
   };

   StudentFeeDiscount.prototype.renew = async function (renewedBy, newExpiryDate) {
      try {
         if (!this.isActive()) {
            throw new Error('Only active discounts can be renewed');
         }

         this.last_renewed_at = new Date();
         this.effective_until = newExpiryDate;

         // Calculate next renewal date (typically one year)
         const nextRenewal = new Date(newExpiryDate);
         nextRenewal.setMonth(nextRenewal.getMonth() - 1); // Remind 1 month before expiry
         this.next_renewal_due = nextRenewal;

         // Update audit trail
         this.addToAuditTrail('RENEWED', renewedBy, `Extended until ${newExpiryDate}`);

         await this.save();

         logger.info('Discount renewed', {
            student_fee_discount_id: this.id,
            renewed_by: renewedBy,
            new_expiry: newExpiryDate,
         });

         return true;
      } catch (error) {
         logger.error('Error renewing discount', {
            student_fee_discount_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   // Class methods for business operations
   StudentFeeDiscount.applyDiscount = async function (studentFeeId, discountId, appliedBy, options = {}) {
      const transaction = await this.sequelize.transaction();

      try {
         // Get student fee and discount details
         const studentFee = await this.sequelize.models.StudentFee.findByPk(studentFeeId, { transaction });
         const discount = await this.sequelize.models.FeeDiscount.findByPk(discountId, { transaction });

         if (!studentFee || !discount) {
            throw new Error('Student fee or discount not found');
         }

         // Check if discount is already applied
         const existingDiscount = await this.findOne({
            where: {
               student_fee_id: studentFeeId,
               fee_discount_id: discountId,
            },
            transaction,
         });

         if (existingDiscount) {
            throw new Error('Discount is already applied to this student fee');
         }

         // Calculate discount amount
         const discountAmount = discount.calculateDiscountAmount(studentFee.total_amount);
         if (discountAmount <= 0) {
            throw new Error('No discount amount calculated');
         }

         // Create discount application
         const studentFeeDiscount = await this.create(
            {
               student_id: studentFee.student_id,
               student_fee_id: studentFeeId,
               fee_discount_id: discountId,
               school_id: studentFee.school_id,
               academic_year: studentFee.academic_year,
               discount_amount: discountAmount,
               original_fee_amount: studentFee.total_amount,
               final_fee_amount: studentFee.total_amount - discountAmount,
               discount_percentage: (discountAmount / studentFee.total_amount) * 100,
               effective_from: options.effective_from || new Date(),
               effective_until: options.effective_until || discount.valid_until,
               auto_applied: options.auto_applied || false,
               applied_by: appliedBy,
               application_status: discount.requires_approval ? 'PENDING' : 'APPROVED',
               verification_status: discount.document_requirements ? 'PENDING' : 'NOT_REQUIRED',
               priority_order: discount.priority_order,
            },
            { transaction }
         );

         // If auto-approved, update student fee immediately
         if (!discount.requires_approval) {
            await studentFee.applyDiscount(discountAmount);
            studentFeeDiscount.approved_by = appliedBy;
            studentFeeDiscount.approved_at = new Date();
            await studentFeeDiscount.save({ transaction });
         }

         // Update audit trail
         studentFeeDiscount.addToAuditTrail('CREATED', appliedBy, 'Discount application created');

         await transaction.commit();

         logger.info('Discount applied to student fee', {
            student_fee_discount_id: studentFeeDiscount.id,
            student_id: studentFee.student_id,
            discount_amount: discountAmount,
            auto_approved: !discount.requires_approval,
         });

         return studentFeeDiscount;
      } catch (error) {
         await transaction.rollback();
         logger.error('Error applying discount', {
            student_fee_id: studentFeeId,
            discount_id: discountId,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFeeDiscount.getPendingApprovals = async function (schoolId, userId = null) {
      try {
         const where = {
            school_id: schoolId,
            application_status: 'PENDING',
         };

         if (userId) {
            // Filter by approval authority if user role is provided
            // This would require role-based filtering logic
         }

         const pending = await this.findAll({
            where: where,
            include: [
               {
                  model: this.sequelize.models.Student,
                  as: 'student',
                  attributes: ['id', 'admission_number', 'first_name', 'last_name'],
               },
               {
                  model: this.sequelize.models.FeeDiscount,
                  as: 'feeDiscount',
                  attributes: ['id', 'discount_name', 'discount_type', 'approval_authority'],
               },
               {
                  model: this.sequelize.models.User,
                  as: 'appliedBy',
                  attributes: ['id', 'name', 'email'],
               },
            ],
            order: [['created_at', 'ASC']],
         });

         return pending;
      } catch (error) {
         logger.error('Error getting pending approvals', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   };

   StudentFeeDiscount.getDiscountStatistics = async function (schoolId, academicYear) {
      try {
         const { fn, col } = require('sequelize');

         const stats = await this.findAll({
            attributes: [
               'application_status',
               [fn('COUNT', col('id')), 'count'],
               [fn('SUM', col('discount_amount')), 'total_amount'],
            ],
            where: {
               school_id: schoolId,
               academic_year: academicYear,
            },
            group: ['application_status'],
            raw: true,
         });

         const result = {
            school_id: schoolId,
            academic_year: academicYear,
            total_applications: 0,
            total_discount_amount: 0,
            by_status: {},
         };

         stats.forEach((stat) => {
            const count = parseInt(stat.count);
            const amount = parseFloat(stat.total_amount) || 0;

            result.total_applications += count;
            result.total_discount_amount += amount;
            result.by_status[stat.application_status] = {
               count: count,
               total_amount: amount,
            };
         });

         return result;
      } catch (error) {
         logger.error('Error getting discount statistics', {
            school_id: schoolId,
            academic_year: academicYear,
            error: error.message,
         });
         throw error;
      }
   };

   // Validation schemas for API endpoints
   StudentFeeDiscount.validationSchemas = {
      create: {
         student_fee_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         fee_discount_id: {
            required: true,
            type: 'integer',
            min: 1,
         },
         effective_from: {
            required: false,
            type: 'date',
         },
      },
      approve: {
         remarks: {
            required: false,
            type: 'string',
            maxLength: 1000,
         },
      },
      reject: {
         rejection_reason: {
            required: true,
            type: 'string',
            minLength: 10,
            maxLength: 1000,
         },
      },
   };

   return StudentFeeDiscount;
}

module.exports = defineStudentFeeDiscount;
