const { DataTypes } = require('sequelize');

/**
 * Fee Configuration Model
 * Stores different fee structures and payment configurations per tenant
 * Located in SYSTEM database
 */
const defineFeeConfiguration = (sequelize) => {
   const FeeConfiguration = sequelize.define(
      'FeeConfiguration',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },

         trust_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'trusts',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Reference to trust this fee configuration belongs to',
         },

         name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Fee structure name (e.g., "Primary School Fees 2024-25")',
         },

         code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Unique code for fee structure (e.g., "PRIMARY_2024_25")',
         },

         academic_year: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'Academic year this fee applies to (e.g., "2024-25")',
         },

         applicable_classes: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            comment: 'Array of class names/IDs this fee structure applies to',
         },

         fee_components: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Detailed breakdown of fee components',
            /*
            Example:
            {
              "tuition_fee": {
                "label": "Tuition Fee",
                "amount": 15000,
                "frequency": "monthly", // monthly, quarterly, annually, one_time
                "is_mandatory": true,
                "can_be_waived": false,
                "category": "academic"
              },
              "library_fee": {
                "label": "Library Fee", 
                "amount": 500,
                "frequency": "annually",
                "is_mandatory": true,
                "can_be_waived": true,
                "category": "facility"
              },
              "transport_fee": {
                "label": "Transport Fee",
                "amount": 2000,
                "frequency": "monthly",
                "is_mandatory": false,
                "can_be_waived": false,
                "category": "optional",
                "conditional": {
                  "field": "transport_required",
                  "value": true
                }
              }
            }
            */
         },

         payment_schedule: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Payment schedule configuration',
            /*
            Example:
            {
              "schedule_type": "monthly", // monthly, quarterly, annually, custom
              "due_dates": {
                "monthly": [5], // 5th of each month
                "quarterly": [5, 5, 5, 5], // 5th of Apr, Jul, Oct, Jan
                "annually": [30] // 30th of March
              },
              "late_fee_policy": {
                "enabled": true,
                "grace_period_days": 7,
                "late_fee_amount": 100,
                "late_fee_type": "fixed" // fixed, percentage
              },
              "advance_discount": {
                "enabled": true,
                "discount_percentage": 5,
                "applicable_if_paid_before": "2024-03-31"
              }
            }
            */
         },

         collection_methods: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               cash: true,
               cheque: true,
               online: false,
               bank_transfer: true,
               mobile_payment: false,
            },
            comment: 'Available payment collection methods',
         },

         discount_policies: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Various discount policies available',
            /*
            Example:
            {
              "sibling_discount": {
                "enabled": true,
                "discount_percentage": 10,
                "applicable_to": "second_child_onwards",
                "max_discount_amount": 5000
              },
              "merit_discount": {
                "enabled": true,
                "criteria": "academic_performance",
                "discount_percentage": 25,
                "min_grade_percentage": 90
              },
              "economically_weaker_section": {
                "enabled": true,
                "discount_percentage": 50,
                "income_threshold": 200000,
                "requires_income_certificate": true
              }
            }
            */
         },

         fee_calculation_rules: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            comment: 'Rules for calculating final fee amounts',
            /*
            Example:
            {
              "proration_policy": {
                "enabled": true,
                "method": "monthly", // monthly, daily
                "applicable_for": ["tuition_fee"]
              },
              "rounding_rules": {
                "round_to": 10, // Round to nearest 10
                "method": "nearest" // nearest, up, down
              },
              "tax_configuration": {
                "applicable": false,
                "tax_percentage": 0,
                "tax_components": []
              }
            }
            */
         },

         concession_policies: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
            comment: 'Fee concession and scholarship policies',
            /*
            Example:
            {
              "staff_children": {
                "enabled": true,
                "discount_percentage": 75,
                "applicable_components": ["tuition_fee", "library_fee"]
              },
              "single_parent": {
                "enabled": true,
                "discount_percentage": 20,
                "requires_documentation": true
              }
            }
            */
         },

         workflow_settings: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
               fee_approval_required: false,
               discount_approval_required: true,
               refund_approval_required: true,
               notification_settings: {
                  due_date_reminder_days: [7, 3, 1],
                  overdue_reminder_frequency: 'weekly',
               },
            },
            comment: 'Workflow and approval settings for fee management',
         },

         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether this fee configuration is currently active',
         },

         effective_from: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Date from which this fee structure is effective',
         },

         effective_till: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Date till which this fee structure is effective',
         },

         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who created this fee configuration',
         },

         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who last updated this fee configuration',
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
         tableName: 'fee_configurations',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['trust_id', 'code'],
               unique: true,
               name: 'idx_fee_config_trust_code',
            },
            {
               fields: ['trust_id', 'academic_year'],
               name: 'idx_fee_config_trust_year',
            },
            {
               fields: ['is_active'],
               name: 'idx_fee_config_active',
            },
            {
               fields: ['effective_from', 'effective_till'],
               name: 'idx_fee_config_effective_dates',
            },
         ],
         hooks: {
            beforeValidate: (feeConfig) => {
               // Generate code if not provided
               if (!feeConfig.code && feeConfig.name && feeConfig.academic_year) {
                  feeConfig.code =
                     feeConfig.name
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '_')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '') +
                     '_' +
                     feeConfig.academic_year.replace('-', '_');
               }
            },
         },
      }
   );

   // Instance Methods
   FeeConfiguration.prototype.getFeeComponents = function () {
      return this.fee_components || {};
   };

   FeeConfiguration.prototype.getPaymentSchedule = function () {
      return this.payment_schedule || {};
   };

   FeeConfiguration.prototype.getDiscountPolicies = function () {
      return this.discount_policies || {};
   };

   FeeConfiguration.prototype.calculateTotalAnnualFee = function () {
      const components = this.getFeeComponents();
      let totalAnnual = 0;

      Object.keys(components).forEach((componentKey) => {
         const component = components[componentKey];
         if (component.is_mandatory) {
            const amount = parseFloat(component.amount) || 0;

            switch (component.frequency) {
               case 'monthly':
                  totalAnnual += amount * 12;
                  break;
               case 'quarterly':
                  totalAnnual += amount * 4;
                  break;
               case 'annually':
               case 'one_time':
                  totalAnnual += amount;
                  break;
            }
         }
      });

      return totalAnnual;
   };

   FeeConfiguration.prototype.calculateMonthlyFee = function (studentConditions = {}) {
      const components = this.getFeeComponents();
      let monthlyTotal = 0;

      Object.keys(components).forEach((componentKey) => {
         const component = components[componentKey];
         let includeComponent = component.is_mandatory;

         // Check conditional components
         if (component.conditional && studentConditions) {
            const conditionField = component.conditional.field;
            const conditionValue = component.conditional.value;
            includeComponent = studentConditions[conditionField] === conditionValue;
         }

         if (includeComponent) {
            const amount = parseFloat(component.amount) || 0;

            switch (component.frequency) {
               case 'monthly':
                  monthlyTotal += amount;
                  break;
               case 'quarterly':
                  monthlyTotal += amount / 3;
                  break;
               case 'annually':
                  monthlyTotal += amount / 12;
                  break;
               case 'one_time':
                  // One-time fees are not included in monthly calculation
                  break;
            }
         }
      });

      return Math.round(monthlyTotal);
   };

   FeeConfiguration.prototype.isApplicableForClass = function (className) {
      const applicableClasses = this.applicable_classes || [];
      return applicableClasses.includes(className) || applicableClasses.length === 0;
   };

   FeeConfiguration.prototype.getApplicableDiscounts = function (studentProfile) {
      const discountPolicies = this.getDiscountPolicies();
      const applicableDiscounts = [];

      Object.keys(discountPolicies).forEach((discountKey) => {
         const policy = discountPolicies[discountKey];
         if (policy.enabled) {
            // Check if student qualifies for this discount
            if (this.qualifiesForDiscount(discountKey, policy, studentProfile)) {
               applicableDiscounts.push({
                  type: discountKey,
                  ...policy,
               });
            }
         }
      });

      return applicableDiscounts;
   };

   FeeConfiguration.prototype.qualifiesForDiscount = function (discountType, policy, studentProfile) {
      switch (discountType) {
         case 'sibling_discount':
            return studentProfile.has_siblings_in_school === true;

         case 'merit_discount':
            return (studentProfile.academic_percentage || 0) >= (policy.min_grade_percentage || 90);

         case 'economically_weaker_section':
            const familyIncome = studentProfile.family_annual_income || 999999;
            const incomeThreshold = policy.income_threshold || 200000;
            return familyIncome <= incomeThreshold;

         case 'staff_children':
            return studentProfile.is_staff_child === true;

         case 'single_parent':
            return studentProfile.is_single_parent === true;

         default:
            return false;
      }
   };

   // Class Methods
   FeeConfiguration.getActiveConfigurationForClass = async function (trustId, className, academicYear) {
      return await this.findOne({
         where: {
            trust_id: trustId,
            academic_year: academicYear,
            is_active: true,
            effective_from: { [sequelize.Sequelize.Op.lte]: new Date() },
            [sequelize.Sequelize.Op.or]: [
               { effective_till: null },
               { effective_till: { [sequelize.Sequelize.Op.gte]: new Date() } },
            ],
         },
         order: [['created_at', 'DESC']],
      });
   };

   FeeConfiguration.createDefaultConfiguration = function (trustId, academicYear) {
      return {
         trust_id: trustId,
         name: `Default Fee Structure ${academicYear}`,
         code: `DEFAULT_${academicYear.replace('-', '_')}`,
         academic_year: academicYear,
         applicable_classes: [],
         fee_components: {
            tuition_fee: {
               label: 'Tuition Fee',
               amount: 10000,
               frequency: 'monthly',
               is_mandatory: true,
               can_be_waived: false,
               category: 'academic',
            },
            admission_fee: {
               label: 'Admission Fee',
               amount: 5000,
               frequency: 'one_time',
               is_mandatory: true,
               can_be_waived: false,
               category: 'admission',
            },
         },
         payment_schedule: {
            schedule_type: 'monthly',
            due_dates: { monthly: [5] },
            late_fee_policy: {
               enabled: true,
               grace_period_days: 7,
               late_fee_amount: 100,
               late_fee_type: 'fixed',
            },
         },
         effective_from: new Date(),
      };
   };

   return FeeConfiguration;
};

module.exports = defineFeeConfiguration;
