const { Op, Sequelize } = require('sequelize');
const { logError } = require('../utils/logger');

/**
 * Payment Processing Service
 * Complete payment management and transaction processing system
 * Phase 5 Implementation - Fee Management System
 */

class PaymentService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Process fee payment with comprehensive validation
    * @param {Object} paymentData - Payment information
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Payment result with receipt
    */
   async processPayment(paymentData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         // Validate fee assignment
         const feeAssignment = await this.models.FeeAssignment.findOne({
            where: {
               id: paymentData.fee_assignment_id,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            include: [
               {
                  model: this.models.Student,
                  as: 'student',
                  attributes: ['id', 'first_name', 'last_name', 'admission_number'],
               },
               {
                  model: this.models.FeeStructure,
                  as: 'feeStructure',
                  attributes: ['id', 'name', 'category'],
                  include: [
                     {
                        model: this.models.FeeComponent,
                        as: 'components',
                        attributes: ['id', 'name', 'amount', 'is_mandatory'],
                     },
                  ],
               },
            ],
            transaction,
         });

         if (!feeAssignment) {
            throw new Error('Fee assignment not found');
         }

         // Calculate current balance
         const existingPayments = await this.models.FeePayment.findAll({
            where: {
               fee_assignment_id: paymentData.fee_assignment_id,
               status: 'COMPLETED',
            },
            transaction,
         });

         const totalPaid = existingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
         const remainingBalance = parseFloat(feeAssignment.total_amount) - totalPaid;

         // Validate payment amount
         if (paymentData.amount <= 0) {
            throw new Error('Payment amount must be greater than zero');
         }

         if (paymentData.amount > remainingBalance) {
            throw new Error(`Payment amount (₹${paymentData.amount}) exceeds remaining balance (₹${remainingBalance})`);
         }

         // Generate transaction ID and receipt number
         const transactionId = this.generateTransactionId();
         const receiptNumber = await this.generateReceiptNumber(tenantCode, transaction);

         // Create payment record
         const payment = await this.models.FeePayment.create(
            {
               fee_assignment_id: paymentData.fee_assignment_id,
               amount: paymentData.amount,
               payment_method: paymentData.payment_method,
               payment_date: paymentData.payment_date || new Date(),
               transaction_id: transactionId,
               receipt_number: receiptNumber,
               status: 'COMPLETED',
               remarks: paymentData.remarks,
               collected_by: paymentData.collected_by,
               tenant_code: tenantCode,
            },
            { transaction }
         );

         // Process component-wise payments if specified
         if (paymentData.component_payments && paymentData.component_payments.length > 0) {
            await this.processComponentPayments(payment.id, paymentData.component_payments, tenantCode, transaction);
         }

         // Update fee assignment status
         const newTotalPaid = totalPaid + parseFloat(paymentData.amount);
         const newBalance = parseFloat(feeAssignment.total_amount) - newTotalPaid;

         let assignmentStatus = 'PENDING';
         if (newBalance <= 0) {
            assignmentStatus = 'PAID';
         } else if (newTotalPaid > 0) {
            assignmentStatus = 'PARTIALLY_PAID';
         }

         await feeAssignment.update(
            {
               status: assignmentStatus,
               last_payment_date: paymentData.payment_date || new Date(),
            },
            { transaction }
         );

         await transaction.commit();

         // Return payment with receipt data
         return {
            payment: payment,
            receipt: {
               receipt_number: receiptNumber,
               student: feeAssignment.student,
               fee_structure: feeAssignment.feeStructure,
               amount_paid: paymentData.amount,
               payment_method: paymentData.payment_method,
               payment_date: paymentData.payment_date || new Date(),
               remaining_balance: newBalance,
               transaction_id: transactionId,
            },
         };
      } catch (error) {
         await transaction.rollback();
         if (
            error.message.includes('not found') ||
            error.message.includes('exceeds') ||
            error.message.includes('greater than')
         ) {
            throw error;
         }
         logError(error, { context: 'PaymentService.processPayment', tenantCode });
         throw new Error('Failed to process payment');
      }
   }

   /**
    * Get payment history with filtering
    * @param {Object} filters - Filter criteria
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Payment history with pagination
    */
   async getPaymentHistory(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            student_id = '',
            fee_structure_id = '',
            payment_method = '',
            status = '',
            date_from = '',
            date_to = '',
            search = '',
         } = filters;

         const { page = 1, limit = 20, sortBy = 'payment_date', sortOrder = 'DESC' } = pagination;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         // Payment method filter
         if (payment_method) {
            whereConditions.payment_method = payment_method;
         }

         // Status filter
         if (status) {
            whereConditions.status = status;
         }

         // Date range filter
         if (date_from || date_to) {
            whereConditions.payment_date = {};
            if (date_from) {
               whereConditions.payment_date[Op.gte] = new Date(date_from);
            }
            if (date_to) {
               whereConditions.payment_date[Op.lte] = new Date(date_to);
            }
         }

         // Search in receipt number or transaction ID
         if (search) {
            whereConditions[Op.or] = [
               { receipt_number: { [Op.iLike]: `%${search}%` } },
               { transaction_id: { [Op.iLike]: `%${search}%` } },
            ];
         }

         // Include conditions for related models
         const includeConditions = [
            {
               model: this.models.FeeAssignment,
               as: 'feeAssignment',
               include: [
                  {
                     model: this.models.Student,
                     as: 'student',
                     attributes: ['id', 'first_name', 'last_name', 'admission_number'],
                     where: student_id ? { id: student_id } : {},
                  },
                  {
                     model: this.models.FeeStructure,
                     as: 'feeStructure',
                     attributes: ['id', 'name', 'category'],
                     where: fee_structure_id ? { id: fee_structure_id } : {},
                     include: [
                        {
                           model: this.models.Class,
                           as: 'class',
                           attributes: ['id', 'name', 'standard'],
                        },
                     ],
                  },
               ],
            },
         ];

         const offset = (page - 1) * limit;

         const { rows: payments, count: total } = await this.models.FeePayment.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: offset,
            distinct: true,
         });

         const totalPages = Math.ceil(total / limit);
         const hasNextPage = page < totalPages;
         const hasPreviousPage = page > 1;

         return {
            payments: payments,
            pagination: {
               currentPage: page,
               totalPages,
               totalItems: total,
               itemsPerPage: limit,
               hasNextPage,
               hasPreviousPage,
               nextPage: hasNextPage ? page + 1 : null,
               previousPage: hasPreviousPage ? page - 1 : null,
            },
         };
      } catch (error) {
         logError(error, { context: 'PaymentService.getPaymentHistory', tenantCode });
         throw new Error('Failed to retrieve payment history');
      }
   }

   /**
    * Get payment by ID
    * @param {number} paymentId - Payment ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Payment details
    */
   async getPaymentById(paymentId, tenantCode = null) {
      try {
         const whereConditions = { id: paymentId };
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         const payment = await this.models.FeePayment.findOne({
            where: whereConditions,
            include: [
               {
                  model: this.models.FeeAssignment,
                  as: 'feeAssignment',
                  include: [
                     {
                        model: this.models.Student,
                        as: 'student',
                     },
                     {
                        model: this.models.FeeStructure,
                        as: 'feeStructure',
                        include: [
                           {
                              model: this.models.Class,
                              as: 'class',
                           },
                           {
                              model: this.models.AcademicYear,
                              as: 'academicYear',
                           },
                        ],
                     },
                  ],
               },
               {
                  model: this.models.FeeComponentPayment,
                  as: 'componentPayments',
                  include: [
                     {
                        model: this.models.FeeComponent,
                        as: 'component',
                        attributes: ['id', 'name', 'amount'],
                     },
                  ],
                  required: false,
               },
            ],
         });

         if (!payment) {
            throw new Error('Payment not found');
         }

         return payment;
      } catch (error) {
         if (error.message === 'Payment not found') {
            throw error;
         }
         logError(error, { context: 'PaymentService.getPaymentById', paymentId, tenantCode });
         throw new Error('Failed to retrieve payment details');
      }
   }

   /**
    * Cancel payment (for failed/cancelled transactions)
    * @param {number} paymentId - Payment ID
    * @param {Object} cancelData - Cancellation details
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Updated payment
    */
   async cancelPayment(paymentId, cancelData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         const payment = await this.models.FeePayment.findOne({
            where: {
               id: paymentId,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            include: [
               {
                  model: this.models.FeeAssignment,
                  as: 'feeAssignment',
               },
            ],
            transaction,
         });

         if (!payment) {
            throw new Error('Payment not found');
         }

         if (payment.status === 'CANCELLED') {
            throw new Error('Payment is already cancelled');
         }

         if (payment.status !== 'PENDING' && payment.status !== 'FAILED') {
            throw new Error('Only pending or failed payments can be cancelled');
         }

         // Update payment status
         await payment.update(
            {
               status: 'CANCELLED',
               remarks: `${payment.remarks || ''} | Cancelled: ${cancelData.reason || 'No reason provided'}`,
               cancelled_at: new Date(),
               cancelled_by: cancelData.cancelled_by,
            },
            { transaction }
         );

         // Recalculate fee assignment status if needed
         const completedPayments = await this.models.FeePayment.findAll({
            where: {
               fee_assignment_id: payment.fee_assignment_id,
               status: 'COMPLETED',
            },
            transaction,
         });

         const totalPaid = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
         const remainingBalance = parseFloat(payment.feeAssignment.total_amount) - totalPaid;

         let assignmentStatus = 'PENDING';
         if (remainingBalance <= 0) {
            assignmentStatus = 'PAID';
         } else if (totalPaid > 0) {
            assignmentStatus = 'PARTIALLY_PAID';
         }

         await payment.feeAssignment.update(
            {
               status: assignmentStatus,
            },
            { transaction }
         );

         await transaction.commit();
         return payment.reload();
      } catch (error) {
         await transaction.rollback();
         if (
            error.message.includes('not found') ||
            error.message.includes('already') ||
            error.message.includes('Only')
         ) {
            throw error;
         }
         logError(error, { context: 'PaymentService.cancelPayment', paymentId, tenantCode });
         throw new Error('Failed to cancel payment');
      }
   }

   /**
    * Generate payment receipt
    * @param {number} paymentId - Payment ID
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Receipt data
    */
   async generateReceipt(paymentId, tenantCode = null) {
      try {
         const payment = await this.getPaymentById(paymentId, tenantCode);

         if (payment.status !== 'COMPLETED') {
            throw new Error('Receipt can only be generated for completed payments');
         }

         const receipt = {
            receipt_number: payment.receipt_number,
            payment_date: payment.payment_date,
            student: {
               name: `${payment.feeAssignment.student.first_name} ${payment.feeAssignment.student.last_name}`,
               admission_number: payment.feeAssignment.student.admission_number,
               class: payment.feeAssignment.feeStructure.class?.name || 'N/A',
            },
            fee_details: {
               structure_name: payment.feeAssignment.feeStructure.name,
               category: payment.feeAssignment.feeStructure.category,
               academic_year: payment.feeAssignment.feeStructure.academicYear?.name || 'N/A',
            },
            payment_details: {
               amount: payment.amount,
               method: payment.payment_method,
               transaction_id: payment.transaction_id,
               collected_by: payment.collected_by,
            },
            component_breakdown:
               payment.componentPayments?.map((cp) => ({
                  component: cp.component.name,
                  amount: cp.amount,
               })) || [],
         };

         return receipt;
      } catch (error) {
         if (error.message.includes('can only be generated')) {
            throw error;
         }
         logError(error, { context: 'PaymentService.generateReceipt', paymentId, tenantCode });
         throw new Error('Failed to generate receipt');
      }
   }

   /**
    * Get payment statistics
    * @param {Object} filters - Filter criteria
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Payment statistics
    */
   async getPaymentStatistics(filters = {}, tenantCode = null) {
      try {
         const whereConditions = {};
         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         // Date range filter
         if (filters.date_from || filters.date_to) {
            whereConditions.payment_date = {};
            if (filters.date_from) {
               whereConditions.payment_date[Op.gte] = new Date(filters.date_from);
            }
            if (filters.date_to) {
               whereConditions.payment_date[Op.lte] = new Date(filters.date_to);
            }
         }

         // Get payment statistics
         const [totalPayments, completedPayments, totalAmount, paymentMethods] = await Promise.all([
            // Total payments count
            this.models.FeePayment.count({ where: whereConditions }),

            // Completed payments
            this.models.FeePayment.findAll({
               where: { ...whereConditions, status: 'COMPLETED' },
               attributes: [
                  [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                  [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount'],
               ],
               raw: true,
            }),

            // Total amount collected
            this.models.FeePayment.sum('amount', {
               where: { ...whereConditions, status: 'COMPLETED' },
            }),

            // Payment method breakdown
            this.models.FeePayment.findAll({
               where: { ...whereConditions, status: 'COMPLETED' },
               attributes: [
                  'payment_method',
                  [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                  [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount'],
               ],
               group: ['payment_method'],
               raw: true,
            }),
         ]);

         const completedCount = completedPayments[0]?.count || 0;
         const completedAmount = completedPayments[0]?.total_amount || 0;

         // Calculate success rate
         const successRate = totalPayments > 0 ? (completedCount / totalPayments) * 100 : 0;

         return {
            total_payments: totalPayments,
            completed_payments: parseInt(completedCount),
            total_amount_collected: parseFloat(totalAmount || 0),
            success_rate: parseFloat(successRate.toFixed(2)),
            payment_method_breakdown: paymentMethods.map((method) => ({
               method: method.payment_method,
               count: parseInt(method.count),
               amount: parseFloat(method.amount || 0),
            })),
         };
      } catch (error) {
         logError(error, { context: 'PaymentService.getPaymentStatistics', tenantCode });
         throw new Error('Failed to retrieve payment statistics');
      }
   }

   /**
    * Process component-wise payments
    * @private
    */
   async processComponentPayments(paymentId, componentPayments, tenantCode, transaction) {
      const componentPaymentData = componentPayments.map((cp) => ({
         fee_payment_id: paymentId,
         fee_component_id: cp.component_id,
         amount: cp.amount,
         tenant_code: tenantCode,
      }));

      await this.models.FeeComponentPayment.bulkCreate(componentPaymentData, {
         transaction,
         validate: true,
      });
   }

   /**
    * Generate unique transaction ID
    * @private
    */
   generateTransactionId() {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000)
         .toString()
         .padStart(4, '0');
      return `TXN${timestamp}${random}`;
   }

   /**
    * Generate receipt number
    * @private
    */
   async generateReceiptNumber(tenantCode, transaction) {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

      // Get count of receipts for this month
      const startOfMonth = new Date(year, new Date().getMonth(), 1);
      const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

      const monthlyCount = await this.models.FeePayment.count({
         where: {
            payment_date: {
               [Op.between]: [startOfMonth, endOfMonth],
            },
            ...(tenantCode && { tenant_code: tenantCode }),
         },
         transaction,
      });

      const sequence = (monthlyCount + 1).toString().padStart(4, '0');
      const tenantPrefix = tenantCode ? tenantCode.substring(0, 3).toUpperCase() : 'SCH';

      return `${tenantPrefix}${year}${month}${sequence}`;
   }

   /**
    * Bulk payment processing
    * @param {Array} paymentsData - Array of payment data
    * @param {string} tenantCode - Tenant isolation
    * @returns {Object} Bulk processing results
    */
   async bulkProcessPayments(paymentsData, tenantCode = null) {
      const results = {
         processed: 0,
         failed: 0,
         errors: [],
      };

      for (const paymentData of paymentsData) {
         try {
            await this.processPayment(paymentData, tenantCode);
            results.processed++;
         } catch (error) {
            results.failed++;
            results.errors.push({
               payment_data: paymentData,
               error: error.message,
            });
         }
      }

      return results;
   }
}

module.exports = PaymentService;
