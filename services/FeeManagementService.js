const { logger } = require('../utils/logger');

/**
 * Fee Management Service
 * Comprehensive service for handling all fee-related operations
 */
class FeeManagementService {
   constructor() {
      this.feeConfigCache = new Map();
      this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
   }

   /**
    * Get fee configuration with caching
    */
   async getFeeConfiguration(feeConfigId, systemDb) {
      const cacheKey = `fee_config_${feeConfigId}`;
      const cached = this.feeConfigCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
         return cached.data;
      }

      try {
         const FeeConfiguration = systemDb.models.FeeConfiguration;
         const config = await FeeConfiguration.findByPk(feeConfigId);

         if (config) {
            this.feeConfigCache.set(cacheKey, {
               data: config,
               timestamp: Date.now(),
            });
         }

         return config;
      } catch (error) {
         logger.error('Error fetching fee configuration:', error);
         throw error;
      }
   }

   /**
    * Assign fee configuration to a student
    */
   async assignFeeToStudent(studentId, feeConfigId, academicYear, assignedBy, tenantDb, systemDb) {
      try {
         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;

         // Check if student already has a fee assignment for this academic year
         const existingAssignment = await StudentFeeAssignment.getActiveAssignment(studentId, academicYear);

         if (existingAssignment) {
            throw new Error(`Student already has fee assignment for academic year ${academicYear}`);
         }

         // Get fee configuration from system database
         const feeConfig = await this.getFeeConfiguration(feeConfigId, systemDb);
         if (!feeConfig) {
            throw new Error('Fee configuration not found');
         }

         // Create fee assignment
         const assignment = await StudentFeeAssignment.assignFeeToStudent(
            studentId,
            feeConfigId,
            academicYear,
            assignedBy
         );

         // Calculate fee structure based on configuration
         await this.initializeStudentFeeStructure(assignment, feeConfig, tenantDb);

         logger.info(`Fee assigned to student ${studentId} for academic year ${academicYear}`);
         return assignment;
      } catch (error) {
         logger.error('Error assigning fee to student:', error);
         throw error;
      }
   }

   /**
    * Initialize student fee structure based on configuration
    */
   async initializeStudentFeeStructure(assignment, feeConfig, tenantDb) {
      try {
         const Student = tenantDb.models.Student;
         const student = await Student.findByPk(assignment.student_id);

         if (!student) {
            throw new Error('Student not found');
         }

         // Get student conditions for conditional fee components
         const studentConditions = {
            transport_required: student.transport_required || false,
            hostel_required: student.hostel_required || false,
            has_siblings_in_school: false, // This would be calculated
            is_staff_child: false, // This would be determined from parent data
         };

         const feeComponents = feeConfig.getFeeComponents();
         const calculatedStructure = {};

         // Calculate each component
         Object.keys(feeComponents).forEach((componentKey) => {
            const component = feeComponents[componentKey];
            let includeComponent = component.is_mandatory;

            // Check conditional components
            if (component.conditional) {
               const conditionField = component.conditional.field;
               const conditionValue = component.conditional.value;
               includeComponent = studentConditions[conditionField] === conditionValue;
            }

            if (includeComponent) {
               calculatedStructure[componentKey] = {
                  label: component.label,
                  original_amount: parseFloat(component.amount),
                  adjustment_amount: 0,
                  final_amount: parseFloat(component.amount),
                  frequency: component.frequency,
                  category: component.category,
                  is_mandatory: component.is_mandatory,
                  can_be_waived: component.can_be_waived || false,
               };
            }
         });

         // Apply any automatic discounts based on student profile
         const studentProfile = this.buildStudentProfile(student);
         const applicableDiscounts = feeConfig.getApplicableDiscounts(studentProfile);

         for (const discount of applicableDiscounts) {
            await this.applyDiscount(assignment, discount, calculatedStructure);
         }

         // Update assignment with calculated structure
         assignment.calculated_fee_structure = calculatedStructure;
         await assignment.save();

         return assignment;
      } catch (error) {
         logger.error('Error initializing student fee structure:', error);
         throw error;
      }
   }

   /**
    * Build student profile for discount calculations
    */
   buildStudentProfile(student) {
      return {
         has_siblings_in_school: false, // Would be calculated by checking other students
         academic_percentage: null, // Would come from academic records
         family_annual_income: (student.father_annual_income || 0) + (student.mother_annual_income || 0),
         is_staff_child: false, // Would be determined from parent employment data
         is_single_parent: !student.father_name || !student.mother_name,
         category: student.category,
         transport_required: student.transport_required || false,
         hostel_required: student.hostel_required || false,
      };
   }

   /**
    * Apply discount to fee structure
    */
   async applyDiscount(assignment, discount, calculatedStructure) {
      try {
         const applicableComponents = discount.applicable_components || Object.keys(calculatedStructure);

         applicableComponents.forEach((componentKey) => {
            if (calculatedStructure[componentKey]) {
               const component = calculatedStructure[componentKey];
               let discountAmount = 0;

               if (discount.discount_percentage) {
                  discountAmount = (component.original_amount * discount.discount_percentage) / 100;
               } else if (discount.discount_amount) {
                  discountAmount = discount.discount_amount;
               }

               // Apply max discount limit if specified
               if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
                  discountAmount = discount.max_discount_amount;
               }

               component.adjustment_amount = -discountAmount;
               component.final_amount = component.original_amount - discountAmount;
               component.discount_applied = {
                  type: discount.type,
                  amount: discountAmount,
                  percentage: discount.discount_percentage || 0,
               };
            }
         });

         // Record the discount application
         const adjustments = assignment.getIndividualAdjustments();
         adjustments[`auto_discount_${discount.type}`] = {
            adjustment_type: 'discount',
            adjustment_amount: this.calculateTotalDiscountAmount(calculatedStructure),
            reason: `Automatic ${discount.type} discount`,
            applied_date: new Date(),
            auto_applied: true,
         };

         assignment.individual_adjustments = adjustments;
      } catch (error) {
         logger.error('Error applying discount:', error);
         throw error;
      }
   }

   /**
    * Calculate total discount amount from fee structure
    */
   calculateTotalDiscountAmount(calculatedStructure) {
      let totalDiscount = 0;

      Object.keys(calculatedStructure).forEach((componentKey) => {
         const component = calculatedStructure[componentKey];
         if (component.discount_applied) {
            totalDiscount += component.discount_applied.amount;
         }
      });

      return totalDiscount;
   }

   /**
    * Process fee payment
    */
   async processPayment(paymentData, tenantDb) {
      const transaction = await tenantDb.transaction();

      try {
         const FeeTransaction = tenantDb.models.FeeTransaction;
         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;

         // Get fee assignment
         const assignment = await StudentFeeAssignment.findByPk(paymentData.fee_assignment_id);
         if (!assignment) {
            throw new Error('Fee assignment not found');
         }

         // Calculate outstanding balance
         const outstandingBalance = await FeeTransaction.getOutstandingBalance(
            paymentData.student_id,
            paymentData.academic_year
         );

         // Create payment transaction
         const payment = await FeeTransaction.createPayment(
            {
               ...paymentData,
               balance_before: outstandingBalance,
               balance_after: outstandingBalance - paymentData.total_amount,
            },
            transaction
         );

         // Update payment schedule if this covers future dues
         await this.updatePaymentSchedule(assignment, payment, transaction);

         await transaction.commit();

         logger.info(`Payment processed: ${payment.transaction_number} for student ${paymentData.student_id}`);
         return payment;
      } catch (error) {
         await transaction.rollback();
         logger.error('Error processing payment:', error);
         throw error;
      }
   }

   /**
    * Update payment schedule after payment
    */
   async updatePaymentSchedule(assignment, payment, _transaction) {
      // This would implement logic to mark payment schedule items as paid
      // and calculate next due dates

      const periodCovered = payment.getPeriodCovered();
      logger.info(`Updated payment schedule for assignment ${assignment.id}`, periodCovered);
   }

   /**
    * Generate fee receipt
    */
   async generateFeeReceipt(transactionId, tenantDb) {
      try {
         const FeeTransaction = tenantDb.models.FeeTransaction;
         const Student = tenantDb.models.Student;

         const transaction = await FeeTransaction.findByPk(transactionId, {
            include: [
               {
                  model: Student,
                  attributes: ['admission_number', 'roll_number'],
               },
            ],
         });

         if (!transaction) {
            throw new Error('Transaction not found');
         }

         const receipt = {
            receipt_number: transaction.receipt_number,
            transaction_number: transaction.transaction_number,
            student_details: transaction.Student,
            transaction_details: transaction.getFormattedDetails(),
            generated_at: new Date(),
            generated_by: 'system',
         };

         return receipt;
      } catch (error) {
         logger.error('Error generating fee receipt:', error);
         throw error;
      }
   }

   /**
    * Calculate outstanding fees for a student
    */
   async calculateOutstandingFees(studentId, academicYear, tenantDb) {
      try {
         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;
         const FeeTransaction = tenantDb.models.FeeTransaction;

         const assignment = await StudentFeeAssignment.getActiveAssignment(studentId, academicYear);
         if (!assignment) {
            return { total_outstanding: 0, breakdown: {} };
         }

         const feeStructure = assignment.getCalculatedFeeStructure();
         const transactions = await FeeTransaction.getStudentTransactions(studentId, academicYear);

         // Calculate what's due vs what's paid
         const breakdown = this.calculateFeeBreakdown(feeStructure, transactions);

         return {
            total_outstanding: breakdown.total_outstanding,
            breakdown: breakdown.components,
            next_due_date: this.calculateNextDueDate(assignment, new Date()),
            overdue_amount: breakdown.overdue_amount,
         };
      } catch (error) {
         logger.error('Error calculating outstanding fees:', error);
         throw error;
      }
   }

   /**
    * Calculate fee breakdown
    */
   calculateFeeBreakdown(feeStructure, _transactions) {
      const breakdown = {
         components: {},
         total_outstanding: 0,
         overdue_amount: 0,
      };

      // This would implement detailed fee calculation logic
      // For now, returning basic structure

      Object.keys(feeStructure).forEach((componentKey) => {
         const component = feeStructure[componentKey];
         breakdown.components[componentKey] = {
            total_due: component.final_amount,
            paid: 0,
            outstanding: component.final_amount,
         };
         breakdown.total_outstanding += component.final_amount;
      });

      return breakdown;
   }

   /**
    * Calculate next due date
    */
   calculateNextDueDate(assignment, currentDate) {
      // This would calculate next due date based on payment schedule
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(5); // Assuming 5th of each month as due date

      return nextMonth;
   }

   /**
    * Generate fee reports
    */
   async generateFeeReports(criteria, tenantDb) {
      try {
         // This would generate various fee reports based on criteria
         const reportData = {
            report_type: criteria.type,
            generated_at: new Date(),
            data: {},
         };

         switch (criteria.type) {
            case 'collection_summary':
               reportData.data = await this.generateCollectionSummary(criteria, tenantDb);
               break;
            case 'outstanding_fees':
               reportData.data = await this.generateOutstandingFeesReport(criteria, tenantDb);
               break;
            case 'defaulters_list':
               reportData.data = await this.generateDefaultersList(criteria, tenantDb);
               break;
            default:
               throw new Error(`Unsupported report type: ${criteria.type}`);
         }

         return reportData;
      } catch (error) {
         logger.error('Error generating fee reports:', error);
         throw error;
      }
   }

   /**
    * Generate collection summary
    */
   async generateCollectionSummary(criteria, _tenantDb) {
      // This would generate collection summary report
      return {
         total_collected: 0,
         collection_methods: {},
         period: criteria.period,
      };
   }

   /**
    * Generate outstanding fees report
    */
   async generateOutstandingFeesReport(_criteria, _tenantDb) {
      // This would generate outstanding fees report
      return {
         total_outstanding: 0,
         student_wise_breakdown: [],
         class_wise_summary: {},
      };
   }

   /**
    * Generate defaulters list
    */
   async generateDefaultersList(criteria, _tenantDb) {
      // This would generate list of fee defaulters
      return {
         defaulters: [],
         criteria: criteria.defaulter_criteria,
      };
   }

   /**
    * Clear cache
    */
   clearCache() {
      this.feeConfigCache.clear();
      logger.info('Fee management cache cleared');
   }
}

// Export singleton instance
module.exports = new FeeManagementService();
