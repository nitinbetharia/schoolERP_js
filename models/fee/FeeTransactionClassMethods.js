const { Op } = require('sequelize');

/**
 * Fee Transaction Model - Class Methods
 * Static methods for creating transactions and querying transaction data
 * Handles bulk operations, balance calculations, and reporting
 *
 * Following copilot instructions: CommonJS, async/await, efficient database queries
 */

const feeTransactionClassMethods = {
   /**
    * Create a payment transaction with full details
    * @param {Object} paymentData - Payment transaction data
    * @param {Object} transaction - Database transaction object
    * @returns {Promise<Object>} Created payment transaction
    */
   createPayment: async function (paymentData, transaction = null) {
      const payment = await this.create(
         {
            student_id: paymentData.student_id,
            fee_assignment_id: paymentData.fee_assignment_id,
            transaction_type: 'payment',
            academic_year: paymentData.academic_year,
            total_amount: paymentData.total_amount,
            payment_method: paymentData.payment_method,
            payment_details: paymentData.payment_details || {},
            fee_components: paymentData.fee_components || {},
            transaction_date: paymentData.transaction_date || new Date(),
            due_date: paymentData.due_date,
            late_fee_applied: paymentData.late_fee_applied || 0,
            discount_applied: paymentData.discount_applied || 0,
            period_covered: paymentData.period_covered,
            collected_by: paymentData.collected_by,
            remarks: paymentData.remarks,
         },
         { transaction }
      );

      return payment;
   },

   /**
    * Get all transactions for a student
    * @param {number} studentId - Student ID
    * @param {string} academicYear - Academic year filter (optional)
    * @param {number} limit - Limit results (optional)
    * @returns {Promise<Array>} Array of transactions
    */
   getStudentTransactions: async function (studentId, academicYear, limit = null) {
      const whereClause = { student_id: studentId };
      if (academicYear) {
         whereClause.academic_year = academicYear;
      }

      const options = {
         where: whereClause,
         order: [
            ['transaction_date', 'DESC'],
            ['created_at', 'DESC'],
         ],
      };

      if (limit) {
         options.limit = limit;
      }

      return await this.findAll(options);
   },

   /**
    * Calculate outstanding balance for a student
    * @param {number} studentId - Student ID
    * @param {string} academicYear - Academic year
    * @returns {Promise<number>} Outstanding balance amount
    */
   getOutstandingBalance: async function (studentId, academicYear) {
      const transactions = await this.getStudentTransactions(studentId, academicYear);

      let balance = 0;
      transactions.forEach((txn) => {
         if (!txn.is_reversed && txn.transaction_status === 'completed') {
            switch (txn.transaction_type) {
               case 'payment':
                  balance -= parseFloat(txn.total_amount);
                  break;
               case 'refund':
                  balance += parseFloat(txn.total_amount);
                  break;
               case 'late_fee':
               case 'penalty':
                  balance += parseFloat(txn.total_amount);
                  break;
               case 'discount':
               case 'waiver':
                  balance -= parseFloat(txn.total_amount);
                  break;
            }
         }
      });

      return Math.round(balance * 100) / 100;
   },

   /**
    * Get payment history for a student within date range
    * @param {number} studentId - Student ID
    * @param {string} academicYear - Academic year (optional)
    * @param {Date} startDate - Start date (optional)
    * @param {Date} endDate - End date (optional)
    * @returns {Promise<Array>} Array of payment transactions
    */
   getPaymentHistory: async function (studentId, academicYear, startDate, endDate) {
      const whereClause = {
         student_id: studentId,
         transaction_type: 'payment',
         transaction_status: 'completed',
         is_reversed: false,
      };

      if (academicYear) {
         whereClause.academic_year = academicYear;
      }

      if (startDate && endDate) {
         whereClause.transaction_date = {
            [Op.between]: [startDate, endDate],
         };
      }

      return await this.findAll({
         where: whereClause,
         order: [['transaction_date', 'DESC']],
      });
   },
};

module.exports = feeTransactionClassMethods;
