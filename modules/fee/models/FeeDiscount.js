const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * Fee Discount Model
 * Manages various types of discounts and concessions
 * Essential for handling scholarships, sibling discounts, etc.
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineFeeDiscount(sequelize) {
   const FeeDiscount = sequelize.define(
      'FeeDiscount',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         discount_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Name of the discount scheme',
         },
         discount_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            comment: 'Unique code for the discount',
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
         discount_type: {
            type: DataTypes.ENUM,
            values: [
               'SCHOLARSHIP',
               'SIBLING_DISCOUNT',
               'STAFF_WARD',
               'MERIT_SCHOLARSHIP',
               'NEED_BASED',
               'SPORTS_QUOTA',
               'CULTURAL_ACTIVITY',
               'EARLY_BIRD',
               'BULK_PAYMENT',
               'LOYALTY_DISCOUNT',
               'SPECIAL_CATEGORY',
               'GOVERNMENT_SCHEME',
               'MANAGEMENT_QUOTA',
               'OTHER',
            ],
            allowNull: false,
            comment: 'Type of discount',
         },
         discount_category: {
            type: DataTypes.ENUM,
            values: ['PERCENTAGE', 'FIXED_AMOUNT', 'WAIVER'],
            allowNull: false,
            comment: 'How discount is calculated',
         },
         discount_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Discount value (percentage or fixed amount)',
            validate: {
               min: {
                  args: [0],
                  msg: 'Discount value cannot be negative',
               },
            },
         },
         max_discount_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Maximum discount amount (for percentage discounts)',
         },
         min_fee_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Minimum fee amount required for discount eligibility',
         },
         applicable_fee_categories: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of fee categories where discount applies',
            defaultValue: [],
         },
         applicable_classes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of classes where discount applies',
            defaultValue: [],
         },
         applicable_academic_years: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of academic years where discount applies',
            defaultValue: [],
         },
         eligibility_criteria: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Eligibility criteria for the discount',
         },
         auto_apply: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether discount should be auto-applied',
         },
         requires_approval: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether discount requires approval',
         },
         approval_authority: {
            type: DataTypes.ENUM,
            values: ['SYSTEM', 'ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'MANAGER'],
            allowNull: true,
            comment: 'Who can approve this discount',
         },
         max_students_per_family: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Maximum students per family eligible for discount',
         },
         priority_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Priority order when multiple discounts apply',
         },
         cumulative_with_others: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this discount can be combined with others',
         },
         valid_from: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date from which discount is valid',
         },
         valid_until: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date until which discount is valid',
         },
         application_start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date from which applications can be submitted',
         },
         application_end_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Last date for discount applications',
         },
         max_applications: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Maximum number of applications accepted',
         },
         current_applications: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Current number of applications',
         },
         is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether discount is currently active',
         },
         description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of the discount',
         },
         terms_and_conditions: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Terms and conditions for the discount',
         },
         document_requirements: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'List of required documents for discount application',
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
            comment: 'User who created this discount',
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who last updated this discount',
         },
         deactivated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'users',
               key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'User who deactivated this discount',
         },
         deactivated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when discount was deactivated',
         },
         deactivation_reason: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Reason for deactivating the discount',
         },
         budget_allocated: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            comment: 'Budget allocated for this discount scheme',
         },
         budget_utilized: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
            comment: 'Budget utilized so far',
         },
         statistics: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Statistical data about discount usage',
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
         tableName: 'fee_discounts',
         timestamps: true,
         underscored: true,
         indexes: [
            // Primary query indexes
            {
               name: 'idx_fee_discount_code',
               fields: ['discount_code'],
               unique: true,
            },
            {
               name: 'idx_fee_discount_school',
               fields: ['school_id', 'is_active', 'discount_type'],
            },
            {
               name: 'idx_fee_discount_type',
               fields: ['discount_type', 'discount_category', 'is_active'],
            },
            {
               name: 'idx_fee_discount_validity',
               fields: ['valid_from', 'valid_until', 'is_active'],
            },
            {
               name: 'idx_fee_discount_application',
               fields: ['application_start_date', 'application_end_date', 'is_active'],
            },
            {
               name: 'idx_fee_discount_auto_apply',
               fields: ['auto_apply', 'is_active', 'priority_order'],
            },
            {
               name: 'idx_fee_discount_approval',
               fields: ['requires_approval', 'approval_authority'],
            },
         ],
      }
   );

   // Model associations
   FeeDiscount.associate = function (models) {
      // Belongs to School
      FeeDiscount.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
      });

      // Belongs to User (created by)
      FeeDiscount.belongsTo(models.User, {
         foreignKey: 'created_by',
         as: 'creator',
         onDelete: 'RESTRICT',
      });

      // Belongs to User (updated by)
      FeeDiscount.belongsTo(models.User, {
         foreignKey: 'updated_by',
         as: 'updater',
         onDelete: 'SET NULL',
      });

      // Belongs to User (deactivated by)
      FeeDiscount.belongsTo(models.User, {
         foreignKey: 'deactivated_by',
         as: 'deactivator',
         onDelete: 'SET NULL',
      });

      // Has many StudentFeeDiscounts
      FeeDiscount.hasMany(models.StudentFeeDiscount, {
         foreignKey: 'fee_discount_id',
         as: 'studentDiscounts',
         onDelete: 'CASCADE',
      });
   };

   // Instance methods for business logic
   FeeDiscount.prototype.isActive = function () {
      return this.is_active;
   };

   FeeDiscount.prototype.isValid = function () {
      if (!this.is_active) return false;

      const today = new Date();

      if (this.valid_from && today < new Date(this.valid_from)) {
         return false;
      }

      if (this.valid_until && today > new Date(this.valid_until)) {
         return false;
      }

      return true;
   };

   FeeDiscount.prototype.isApplicationOpen = function () {
      if (!this.isValid()) return false;

      const today = new Date();

      if (this.application_start_date && today < new Date(this.application_start_date)) {
         return false;
      }

      if (this.application_end_date && today > new Date(this.application_end_date)) {
         return false;
      }

      if (this.max_applications && this.current_applications >= this.max_applications) {
         return false;
      }

      return true;
   };

   FeeDiscount.prototype.canAutoApply = function () {
      return this.auto_apply && this.isValid();
   };

   FeeDiscount.prototype.requiresApproval = function () {
      return this.requires_approval;
   };

   FeeDiscount.prototype.calculateDiscountAmount = function (feeAmount) {
      if (!this.isValid() || feeAmount <= 0) {
         return 0;
      }

      if (this.min_fee_amount && feeAmount < this.min_fee_amount) {
         return 0;
      }

      let discountAmount = 0;

      switch (this.discount_category) {
         case 'PERCENTAGE':
            discountAmount = (feeAmount * this.discount_value) / 100;
            if (this.max_discount_amount && discountAmount > this.max_discount_amount) {
               discountAmount = this.max_discount_amount;
            }
            break;

         case 'FIXED_AMOUNT':
            discountAmount = Math.min(this.discount_value, feeAmount);
            break;

         case 'WAIVER':
            discountAmount = feeAmount;
            break;

         default:
            discountAmount = 0;
      }

      return Math.round(discountAmount * 100) / 100; // Round to 2 decimals
   };

   FeeDiscount.prototype.isApplicableToFeeCategory = function (feeCategory) {
      if (!this.applicable_fee_categories || this.applicable_fee_categories.length === 0) {
         return true; // Applies to all categories if none specified
      }

      return this.applicable_fee_categories.includes(feeCategory);
   };

   FeeDiscount.prototype.isApplicableToClass = function (className) {
      if (!this.applicable_classes || this.applicable_classes.length === 0) {
         return true; // Applies to all classes if none specified
      }

      return this.applicable_classes.includes(className);
   };

   FeeDiscount.prototype.isApplicableToAcademicYear = function (academicYear) {
      if (!this.applicable_academic_years || this.applicable_academic_years.length === 0) {
         return true; // Applies to all academic years if none specified
      }

      return this.applicable_academic_years.includes(academicYear);
   };

   FeeDiscount.prototype.checkEligibility = function (student, studentFee) {
      try {
         // Basic validations
         if (!this.isValid()) return { eligible: false, reason: 'Discount is not valid' };

         if (!this.isApplicableToClass(student.class_name)) {
            return { eligible: false, reason: "Not applicable to student's class" };
         }

         if (!this.isApplicableToAcademicYear(studentFee.academic_year)) {
            return { eligible: false, reason: 'Not applicable to current academic year' };
         }

         if (!this.isApplicableToFeeCategory(studentFee.fee_category)) {
            return { eligible: false, reason: 'Not applicable to fee category' };
         }

         // Check specific eligibility criteria
         if (this.eligibility_criteria) {
            const criteria = this.eligibility_criteria;

            // Check academic performance if specified
            if (criteria.min_percentage && student.academic_percentage < criteria.min_percentage) {
               return { eligible: false, reason: 'Does not meet minimum academic requirement' };
            }

            // Check family income if specified
            if (criteria.max_family_income && student.family_income > criteria.max_family_income) {
               return { eligible: false, reason: 'Family income exceeds maximum limit' };
            }

            // Check special categories if specified
            if (criteria.required_category && !criteria.required_category.includes(student.category)) {
               return { eligible: false, reason: 'Does not belong to required category' };
            }
         }

         return { eligible: true, reason: 'Meets all eligibility criteria' };
      } catch (error) {
         logger.error('Error checking discount eligibility', {
            discount_id: this.id,
            student_id: student.id,
            error: error.message,
         });
         return { eligible: false, reason: 'Error checking eligibility' };
      }
   };

   FeeDiscount.prototype.deactivate = async function (deactivatedBy, reason) {
      try {
         this.is_active = false;
         this.deactivated_by = deactivatedBy;
         this.deactivated_at = new Date();
         this.deactivation_reason = reason;

         await this.save();

         logger.info('Discount deactivated', {
            discount_id: this.id,
            deactivated_by: deactivatedBy,
            reason: reason,
         });

         return true;
      } catch (error) {
         logger.error('Error deactivating discount', {
            discount_id: this.id,
            error: error.message,
         });
         throw error;
      }
   };

   FeeDiscount.prototype.updateBudgetUtilization = async function (amount) {
      try {
         this.budget_utilized = parseFloat(this.budget_utilized) + parseFloat(amount);

         if (this.budget_allocated && this.budget_utilized > this.budget_allocated) {
            logger.warn('Budget exceeded for discount', {
               discount_id: this.id,
               allocated: this.budget_allocated,
               utilized: this.budget_utilized,
            });
         }

         await this.save();
         return true;
      } catch (error) {
         logger.error('Error updating budget utilization', {
            discount_id: this.id,
            amount: amount,
            error: error.message,
         });
         throw error;
      }
   };

   // Class methods for business operations
   FeeDiscount.getActiveDiscounts = async function (schoolId, feeCategory = null, className = null) {
      try {
         const where = {
            school_id: schoolId,
            is_active: true,
         };

         const discounts = await this.findAll({
            where: where,
            order: [
               ['priority_order', 'DESC'],
               ['created_at', 'ASC'],
            ],
         });

         // Filter by fee category and class if specified
         let filteredDiscounts = discounts.filter((discount) => discount.isValid());

         if (feeCategory) {
            filteredDiscounts = filteredDiscounts.filter((discount) => discount.isApplicableToFeeCategory(feeCategory));
         }

         if (className) {
            filteredDiscounts = filteredDiscounts.filter((discount) => discount.isApplicableToClass(className));
         }

         return filteredDiscounts;
      } catch (error) {
         logger.error('Error getting active discounts', {
            school_id: schoolId,
            fee_category: feeCategory,
            class_name: className,
            error: error.message,
         });
         throw error;
      }
   };

   FeeDiscount.getAutoApplyDiscounts = async function (schoolId) {
      try {
         const discounts = await this.findAll({
            where: {
               school_id: schoolId,
               is_active: true,
               auto_apply: true,
            },
            order: [['priority_order', 'DESC']],
         });

         return discounts.filter((discount) => discount.isValid());
      } catch (error) {
         logger.error('Error getting auto-apply discounts', {
            school_id: schoolId,
            error: error.message,
         });
         throw error;
      }
   };

   FeeDiscount.calculateBestDiscountCombination = function (discounts, feeAmount) {
      try {
         if (!discounts || discounts.length === 0) {
            return { discounts: [], total_discount: 0 };
         }

         // Separate cumulative and non-cumulative discounts
         const cumulativeDiscounts = discounts.filter((d) => d.cumulative_with_others);
         const nonCumulativeDiscounts = discounts.filter((d) => !d.cumulative_with_others);

         let bestCombination = { discounts: [], total_discount: 0 };

         // Check single non-cumulative discounts
         for (const discount of nonCumulativeDiscounts) {
            const discountAmount = discount.calculateDiscountAmount(feeAmount);
            if (discountAmount > bestCombination.total_discount) {
               bestCombination = {
                  discounts: [discount],
                  total_discount: discountAmount,
               };
            }
         }

         // Check cumulative discounts combination
         if (cumulativeDiscounts.length > 0) {
            let cumulativeAmount = 0;
            let remainingFee = feeAmount;
            const selectedDiscounts = [];

            // Sort by priority and apply in order
            const sortedCumulative = cumulativeDiscounts.sort((a, b) => b.priority_order - a.priority_order);

            for (const discount of sortedCumulative) {
               const discountAmount = discount.calculateDiscountAmount(remainingFee);
               if (discountAmount > 0) {
                  cumulativeAmount += discountAmount;
                  remainingFee -= discountAmount;
                  selectedDiscounts.push(discount);
               }
            }

            if (cumulativeAmount > bestCombination.total_discount) {
               bestCombination = {
                  discounts: selectedDiscounts,
                  total_discount: cumulativeAmount,
               };
            }
         }

         return bestCombination;
      } catch (error) {
         logger.error('Error calculating best discount combination', {
            discounts_count: discounts?.length,
            fee_amount: feeAmount,
            error: error.message,
         });
         return { discounts: [], total_discount: 0 };
      }
   };

   // Validation schemas for API endpoints
   FeeDiscount.validationSchemas = {
      create: {
         discount_name: {
            required: true,
            type: 'string',
            minLength: 3,
            maxLength: 100,
         },
         discount_code: {
            required: true,
            type: 'string',
            minLength: 3,
            maxLength: 20,
            pattern: /^[A-Z0-9_]+$/,
         },
         discount_type: {
            required: true,
            type: 'string',
            enum: [
               'SCHOLARSHIP',
               'SIBLING_DISCOUNT',
               'STAFF_WARD',
               'MERIT_SCHOLARSHIP',
               'NEED_BASED',
               'SPORTS_QUOTA',
               'CULTURAL_ACTIVITY',
               'EARLY_BIRD',
               'BULK_PAYMENT',
               'LOYALTY_DISCOUNT',
               'SPECIAL_CATEGORY',
               'GOVERNMENT_SCHEME',
               'MANAGEMENT_QUOTA',
               'OTHER',
            ],
         },
         discount_category: {
            required: true,
            type: 'string',
            enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'WAIVER'],
         },
         discount_value: {
            required: true,
            type: 'number',
            min: 0,
         },
      },
      update: {
         is_active: {
            required: false,
            type: 'boolean',
         },
         description: {
            required: false,
            type: 'string',
            maxLength: 1000,
         },
      },
   };

   return FeeDiscount;
}

module.exports = defineFeeDiscount;
