const { DataTypes } = require('sequelize');

/**
 * Student Fee Assignment Model
 * Links students to specific fee configurations with individual adjustments
 * Located in TENANT database
 */
const defineStudentFeeAssignment = (sequelize) => {
   const StudentFeeAssignment = sequelize.define(
      'StudentFeeAssignment',
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

         fee_configuration_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Reference to fee configuration in system database',
         },

         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year this assignment is for',
         },

         assignment_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Date when fee was assigned to student',
         },

         individual_adjustments: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Student-specific fee adjustments',
            /*
            Example:
            {
              "tuition_fee": {
                "adjustment_type": "discount",
                "adjustment_amount": 2000,
                "adjustment_percentage": 20,
                "reason": "Sibling discount",
                "approved_by": 123,
                "approval_date": "2024-04-01"
              },
              "transport_fee": {
                "adjustment_type": "waiver",
                "reason": "Staff child benefit",
                "approved_by": 123,
                "approval_date": "2024-04-01"
              }
            }
            */
         },

         calculated_fee_structure: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Final calculated fee amounts after all adjustments',
            /*
            Example:
            {
              "tuition_fee": {
                "original_amount": 10000,
                "adjustment_amount": -2000,
                "final_amount": 8000,
                "frequency": "monthly"
              },
              "library_fee": {
                "original_amount": 500,
                "adjustment_amount": 0,
                "final_amount": 500,
                "frequency": "annually"
              }
            }
            */
         },

         payment_schedule_override: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Custom payment schedule for this student if different from default',
            /*
            Example:
            {
              "custom_due_dates": ["2024-04-10", "2024-05-10", "2024-06-10"],
              "installment_amounts": [8000, 8000, 8000],
              "reason": "Special payment arrangement approved"
            }
            */
         },

         discount_approvals: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: 'Record of all discount approvals',
            /*
            Example:
            [
              {
                "discount_type": "sibling_discount",
                "discount_amount": 2000,
                "requested_by": 456,
                "approved_by": 123,
                "request_date": "2024-03-15",
                "approval_date": "2024-03-16",
                "status": "approved",
                "comments": "Second child in same school"
              }
            ]
            */
         },

         concession_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Details of any concessions or scholarships applied',
            /*
            Example:
            {
              "scholarship_name": "Merit Scholarship 2024",
              "scholarship_amount": 5000,
              "scholarship_percentage": 50,
              "applicable_components": ["tuition_fee"],
              "valid_from": "2024-04-01",
              "valid_till": "2025-03-31",
              "certificate_number": "MERIT/2024/001"
            }
            */
         },

         fee_lock_status: {
            type: DataTypes.ENUM('unlocked', 'locked', 'frozen'),
            defaultValue: 'unlocked',
            comment: 'Lock status to prevent accidental modifications',
         },

         lock_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for locking fee structure',
         },

         total_annual_fee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Cached total annual fee amount for quick reference',
         },

         total_monthly_fee: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: true,
            comment: 'Cached monthly fee amount for quick reference',
         },

         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this fee assignment is currently active',
         },

         assigned_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who assigned this fee configuration',
         },

         last_modified_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who last modified this assignment',
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },

         updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'student_fee_assignments',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['student_id', 'academic_year'],
               unique: true,
               name: 'idx_student_fee_assignment_unique',
            },
            {
               fields: ['fee_configuration_id'],
               name: 'idx_student_fee_config',
            },
            {
               fields: ['academic_year'],
               name: 'idx_student_fee_year',
            },
            {
               fields: ['is_active'],
               name: 'idx_student_fee_active',
            },
            {
               fields: ['fee_lock_status'],
               name: 'idx_student_fee_lock_status',
            },
         ],
         hooks: {
            beforeSave: async (assignment) => {
               // Recalculate cached amounts whenever assignment is saved
               await assignment.recalculateAmounts();
            },
         },
      }
   );

   // Instance Methods
   StudentFeeAssignment.prototype.getIndividualAdjustments = function () {
      return this.individual_adjustments || {};
   };

   StudentFeeAssignment.prototype.getCalculatedFeeStructure = function () {
      return this.calculated_fee_structure || {};
   };

   StudentFeeAssignment.prototype.getDiscountApprovals = function () {
      return this.discount_approvals || [];
   };

   StudentFeeAssignment.prototype.addDiscountApproval = function (discountData) {
      const approvals = this.getDiscountApprovals();
      approvals.push({
         ...discountData,
         request_date: new Date(),
         status: 'pending',
      });
      this.discount_approvals = approvals;
      return this.save();
   };

   StudentFeeAssignment.prototype.approveDiscount = function (discountIndex, approverUserId, comments = '') {
      const approvals = this.getDiscountApprovals();
      if (approvals[discountIndex]) {
         approvals[discountIndex].approved_by = approverUserId;
         approvals[discountIndex].approval_date = new Date();
         approvals[discountIndex].status = 'approved';
         approvals[discountIndex].comments = comments;
         this.discount_approvals = approvals;

         // Apply the discount to individual adjustments
         this.applyApprovedDiscount(approvals[discountIndex]);
      }
      return this.save();
   };

   StudentFeeAssignment.prototype.applyApprovedDiscount = function (discountApproval) {
      const adjustments = this.getIndividualAdjustments();
      const componentKey = discountApproval.applicable_component || 'tuition_fee';

      adjustments[componentKey] = {
         adjustment_type: 'discount',
         adjustment_amount: discountApproval.discount_amount || 0,
         adjustment_percentage: discountApproval.discount_percentage || 0,
         reason: discountApproval.discount_type,
         approved_by: discountApproval.approved_by,
         approval_date: discountApproval.approval_date,
      };

      this.individual_adjustments = adjustments;
   };

   StudentFeeAssignment.prototype.recalculateAmounts = async function () {
      // This would typically fetch fee configuration from system DB
      // For now, we'll use cached calculations

      const feeStructure = this.getCalculatedFeeStructure();
      let totalAnnual = 0;
      let totalMonthly = 0;

      Object.keys(feeStructure).forEach((componentKey) => {
         const component = feeStructure[componentKey];
         const finalAmount = parseFloat(component.final_amount) || 0;

         switch (component.frequency) {
            case 'monthly':
               totalMonthly += finalAmount;
               totalAnnual += finalAmount * 12;
               break;
            case 'quarterly':
               totalMonthly += finalAmount / 3;
               totalAnnual += finalAmount * 4;
               break;
            case 'annually':
            case 'one_time':
               totalMonthly += finalAmount / 12;
               totalAnnual += finalAmount;
               break;
         }
      });

      this.total_annual_fee = Math.round(totalAnnual * 100) / 100;
      this.total_monthly_fee = Math.round(totalMonthly * 100) / 100;
   };

   StudentFeeAssignment.prototype.lockFeeStructure = function (reason, userId) {
      this.fee_lock_status = 'locked';
      this.lock_reason = reason;
      this.last_modified_by = userId;
      return this.save();
   };

   StudentFeeAssignment.prototype.unlockFeeStructure = function (userId) {
      this.fee_lock_status = 'unlocked';
      this.lock_reason = null;
      this.last_modified_by = userId;
      return this.save();
   };

   StudentFeeAssignment.prototype.canModify = function () {
      return this.fee_lock_status === 'unlocked';
   };

   StudentFeeAssignment.prototype.getFeeBreakdown = function () {
      const feeStructure = this.getCalculatedFeeStructure();
      const breakdown = {
         components: [],
         totals: {
            monthly: this.total_monthly_fee || 0,
            quarterly: 0,
            annually: this.total_annual_fee || 0,
         },
      };

      Object.keys(feeStructure).forEach((componentKey) => {
         const component = feeStructure[componentKey];
         breakdown.components.push({
            name: componentKey,
            label: component.label || componentKey,
            original_amount: component.original_amount || 0,
            adjustment_amount: component.adjustment_amount || 0,
            final_amount: component.final_amount || 0,
            frequency: component.frequency,
            category: component.category || 'other',
         });
      });

      return breakdown;
   };

   // Class Methods
   StudentFeeAssignment.getActiveAssignment = async function (studentId, academicYear) {
      return await this.findOne({
         where: {
            student_id: studentId,
            academic_year: academicYear,
            is_active: true,
         },
      });
   };

   StudentFeeAssignment.assignFeeToStudent = async function (
      studentId,
      feeConfigurationId,
      academicYear,
      assignedBy,
      transaction = null
   ) {
      // Create new assignment
      const assignment = await this.create(
         {
            student_id: studentId,
            fee_configuration_id: feeConfigurationId,
            academic_year: academicYear,
            assigned_by: assignedBy,
            assignment_date: new Date(),
         },
         { transaction }
      );

      // Initialize calculated fee structure based on configuration
      // This would typically fetch from system database
      await assignment.initializeFeeStructure(transaction);

      return assignment;
   };

   StudentFeeAssignment.prototype.initializeFeeStructure = async function (transaction = null) {
      // This would fetch fee configuration from system database and calculate initial amounts
      // For now, we'll set up a basic structure

      const basicStructure = {
         tuition_fee: {
            original_amount: 10000,
            adjustment_amount: 0,
            final_amount: 10000,
            frequency: 'monthly',
            category: 'academic',
            label: 'Tuition Fee',
         },
      };

      this.calculated_fee_structure = basicStructure;
      await this.recalculateAmounts();

      return await this.save({ transaction });
   };

   return StudentFeeAssignment;
};

module.exports = defineStudentFeeAssignment;
