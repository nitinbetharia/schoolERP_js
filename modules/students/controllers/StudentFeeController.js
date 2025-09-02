const FeeManagementService = require('../../../services/FeeManagementService');
const { logger } = require('../../../utils/logger');

/**
 * Student Fee Controller
 * Handles student fee assignments, payments, and transactions
 */
class StudentFeeController {
   /**
    * Assign fee configuration to a student
    */
   static async assignFeeToStudent(req, res) {
      try {
         const { student_id } = req.params;
         const { fee_configuration_id, academic_year, notes } = req.body;
         const tenantDb = req.tenantDb;
         const systemDb = req.systemDb;

         // Validate student exists
         const Student = tenantDb.models.Student;
         const student = await Student.findByPk(student_id);

         if (!student) {
            return res.status(404).json({
               success: false,
               message: 'Student not found',
            });
         }

         // Assign fee to student
         const assignment = await FeeManagementService.assignFeeToStudent(
            student_id,
            fee_configuration_id,
            academic_year,
            req.user.id,
            tenantDb,
            systemDb
         );

         if (notes) {
            assignment.notes = notes;
            await assignment.save();
         }

         logger.info(`Fee assigned to student ${student_id} by user ${req.user.id}`);

         res.status(201).json({
            success: true,
            message: 'Fee configuration assigned successfully',
            data: assignment,
         });
      } catch (error) {
         logger.error('Error assigning fee to student:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to assign fee to student',
            error: error.message,
         });
      }
   }

   /**
    * Get student's fee assignment details
    */
   static async getStudentFeeAssignment(req, res) {
      try {
         const { student_id } = req.params;
         const { academic_year } = req.query;
         const tenantDb = req.tenantDb;

         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;
         const assignment = await StudentFeeAssignment.getActiveAssignment(student_id, academic_year);

         if (!assignment) {
            return res.status(404).json({
               success: false,
               message: 'No fee assignment found for this student and academic year',
            });
         }

         // Get associated fee configuration from system DB
         const systemDb = req.systemDb;
         const feeConfig = await FeeManagementService.getFeeConfiguration(assignment.fee_configuration_id, systemDb);

         const result = {
            assignment: assignment,
            fee_configuration: feeConfig,
            calculated_structure: assignment.getCalculatedFeeStructure(),
            payment_schedule: assignment.getPaymentSchedule(),
         };

         res.json({
            success: true,
            data: result,
         });
      } catch (error) {
         logger.error('Error fetching student fee assignment:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to fetch fee assignment',
            error: error.message,
         });
      }
   }

   /**
    * Update student fee assignment (adjustments, discounts)
    */
   static async updateStudentFeeAssignment(req, res) {
      try {
         const { assignment_id } = req.params;
         const tenantDb = req.tenantDb;

         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;
         const assignment = await StudentFeeAssignment.findByPk(assignment_id);

         if (!assignment) {
            return res.status(404).json({
               success: false,
               message: 'Fee assignment not found',
            });
         }

         // Handle individual adjustments
         if (req.body.individual_adjustments) {
            const existingAdjustments = assignment.getIndividualAdjustments();
            const newAdjustments = {
               ...existingAdjustments,
               ...req.body.individual_adjustments,
            };
            assignment.individual_adjustments = newAdjustments;
         }

         // Handle discount approvals
         if (req.body.discount_approvals) {
            const existingApprovals = assignment.getDiscountApprovals();
            const newApprovals = {
               ...existingApprovals,
               ...req.body.discount_approvals,
            };
            assignment.discount_approvals = newApprovals;
         }

         // Handle payment overrides
         if (req.body.payment_overrides) {
            assignment.payment_overrides = req.body.payment_overrides;
         }

         assignment.last_updated_by = req.user.id;
         await assignment.save();

         // Recalculate amounts after updates
         await assignment.recalculateAmounts();

         logger.info(`Fee assignment updated: ${assignment_id} by user ${req.user.id}`);

         res.json({
            success: true,
            message: 'Fee assignment updated successfully',
            data: assignment,
         });
      } catch (error) {
         logger.error('Error updating student fee assignment:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to update fee assignment',
            error: error.message,
         });
      }
   }

   /**
    * Apply discount to student
    */
   static async applyDiscountToStudent(req, res) {
      try {
         const { assignment_id } = req.params;
         const { discount_type, discount_amount, discount_percentage, reason } = req.body;
         const tenantDb = req.tenantDb;

         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;
         const assignment = await StudentFeeAssignment.findByPk(assignment_id);

         if (!assignment) {
            return res.status(404).json({
               success: false,
               message: 'Fee assignment not found',
            });
         }

         // Apply discount
         await assignment.addDiscountApproval(discount_type, discount_amount, discount_percentage, reason, req.user.id);

         logger.info(`Discount applied to assignment ${assignment_id} by user ${req.user.id}`);

         res.json({
            success: true,
            message: 'Discount applied successfully',
            data: assignment,
         });
      } catch (error) {
         logger.error('Error applying discount:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to apply discount',
            error: error.message,
         });
      }
   }

   /**
    * Process fee payment
    */
   static async processPayment(req, res) {
      try {
         const paymentData = {
            ...req.body,
            processed_by: req.user.id,
         };

         const tenantDb = req.tenantDb;
         const payment = await FeeManagementService.processPayment(paymentData, tenantDb);

         logger.info(`Payment processed: ${payment.transaction_number} by user ${req.user.id}`);

         res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: payment,
         });
      } catch (error) {
         logger.error('Error processing payment:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to process payment',
            error: error.message,
         });
      }
   }

   /**
    * Get student payment history
    */
   static async getStudentPaymentHistory(req, res) {
      try {
         const { student_id } = req.params;
         const { academic_year, limit = 50, offset = 0 } = req.query;
         const tenantDb = req.tenantDb;

         const FeeTransaction = tenantDb.models.FeeTransaction;
         const whereClause = { student_id };

         if (academic_year) {
            whereClause.academic_year = academic_year;
         }

         const transactions = await FeeTransaction.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['transaction_date', 'DESC']],
            include: [
               {
                  model: tenantDb.models.Student,
                  attributes: ['admission_number', 'roll_number'],
               },
            ],
         });

         res.json({
            success: true,
            data: transactions.rows,
            total: transactions.count,
            pagination: {
               limit: parseInt(limit),
               offset: parseInt(offset),
               total: transactions.count,
            },
         });
      } catch (error) {
         logger.error('Error fetching payment history:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to fetch payment history',
            error: error.message,
         });
      }
   }

   /**
    * Calculate outstanding fees for student
    */
   static async getStudentOutstandingFees(req, res) {
      try {
         const { student_id } = req.params;
         const { academic_year } = req.query;
         const tenantDb = req.tenantDb;

         const outstandingFees = await FeeManagementService.calculateOutstandingFees(
            student_id,
            academic_year,
            tenantDb
         );

         res.json({
            success: true,
            data: outstandingFees,
         });
      } catch (error) {
         logger.error('Error calculating outstanding fees:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to calculate outstanding fees',
            error: error.message,
         });
      }
   }

   /**
    * Generate fee receipt
    */
   static async generateFeeReceipt(req, res) {
      try {
         const { transaction_id } = req.params;
         const tenantDb = req.tenantDb;

         const receipt = await FeeManagementService.generateFeeReceipt(transaction_id, tenantDb);

         res.json({
            success: true,
            data: receipt,
         });
      } catch (error) {
         logger.error('Error generating fee receipt:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to generate fee receipt',
            error: error.message,
         });
      }
   }

   /**
    * Reverse a payment transaction
    */
   static async reversePayment(req, res) {
      try {
         const { transaction_id } = req.params;
         const { reversal_reason } = req.body;
         const tenantDb = req.tenantDb;

         const FeeTransaction = tenantDb.models.FeeTransaction;
         const transaction = await FeeTransaction.findByPk(transaction_id);

         if (!transaction) {
            return res.status(404).json({
               success: false,
               message: 'Transaction not found',
            });
         }

         const reversalTransaction = await transaction.reverseTransaction(reversal_reason, req.user.id);

         logger.info(`Payment reversed: ${transaction_id} by user ${req.user.id}`);

         res.json({
            success: true,
            message: 'Payment reversed successfully',
            data: reversalTransaction,
         });
      } catch (error) {
         logger.error('Error reversing payment:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to reverse payment',
            error: error.message,
         });
      }
   }

   /**
    * Lock student fee structure (prevent further changes)
    */
   static async lockFeeStructure(req, res) {
      try {
         const { assignment_id } = req.params;
         const { lock_reason } = req.body;
         const tenantDb = req.tenantDb;

         const StudentFeeAssignment = tenantDb.models.StudentFeeAssignment;
         const assignment = await StudentFeeAssignment.findByPk(assignment_id);

         if (!assignment) {
            return res.status(404).json({
               success: false,
               message: 'Fee assignment not found',
            });
         }

         await assignment.lockFeeStructure(lock_reason, req.user.id);

         logger.info(`Fee structure locked: ${assignment_id} by user ${req.user.id}`);

         res.json({
            success: true,
            message: 'Fee structure locked successfully',
            data: assignment,
         });
      } catch (error) {
         logger.error('Error locking fee structure:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to lock fee structure',
            error: error.message,
         });
      }
   }

   /**
    * Get class-wise fee collection summary
    */
   static async getClassWiseFeeCollection(req, res) {
      try {
         const { academic_year, class_id } = req.query;
         // const tenantDb = req.tenantDb; // Will be used when implementing actual logic

         // This would implement class-wise collection summary
         // For now, returning placeholder data
         const summary = {
            academic_year,
            class_id,
            total_students: 0,
            total_collected: 0,
            total_outstanding: 0,
            collection_percentage: 0,
         };

         res.json({
            success: true,
            data: summary,
         });
      } catch (error) {
         logger.error('Error fetching class-wise fee collection:', error);
         res.status(500).json({
            success: false,
            message: 'Failed to fetch fee collection summary',
            error: error.message,
         });
      }
   }
}

module.exports = StudentFeeController;
