/**
 * Fee Transaction Model - Instance Methods
 * Business logic methods that operate on individual transaction instances
 * Handles validation, formatting, and transaction-specific operations
 *
 * Following copilot instructions: CommonJS, async/await, clear method organization
 */

const feeTransactionInstanceMethods = {
   /**
    * Get parsed fee components from JSON field
    * @returns {Object} Fee components breakdown
    */
   getFeeComponents: function () {
      return this.fee_components || {};
   },

   /**
    * Get parsed payment details from JSON field
    * @returns {Object} Payment method specific details
    */
   getPaymentDetails: function () {
      return this.payment_details || {};
   },

   /**
    * Get parsed adjustment details from JSON field
    * @returns {Object} Adjustment specific details
    */
   getAdjustmentDetails: function () {
      return this.adjustment_details || {};
   },

   /**
    * Get parsed period covered from JSON field
    * @returns {Object} Time period this transaction covers
    */
   getPeriodCovered: function () {
      return this.period_covered || {};
   },

   /**
    * Check if transaction is a payment type
    * @returns {boolean} True if payment transaction
    */
   isPayment: function () {
      return this.transaction_type === 'payment';
   },

   /**
    * Check if transaction is a refund type
    * @returns {boolean} True if refund transaction
    */
   isRefund: function () {
      return this.transaction_type === 'refund';
   },

   /**
    * Check if transaction is an adjustment type
    * @returns {boolean} True if adjustment, waiver, or discount
    */
   isAdjustment: function () {
      return ['adjustment', 'waiver', 'discount'].includes(this.transaction_type);
   },

   /**
    * Check if transaction can be reversed
    * @returns {boolean} True if reversible
    */
   canBeReversed: function () {
      return (
         !this.is_reversed &&
         this.transaction_status === 'completed' &&
         ['payment', 'refund', 'adjustment'].includes(this.transaction_type)
      );
   },

   /**
    * Reverse this transaction (creates opposite transaction)
    * @param {number} userId - User performing the reversal
    * @param {string} reason - Reason for reversal
    * @param {Object} transaction - Database transaction object
    * @returns {Promise<Object>} Created reversal transaction
    */
   reverseTransaction: async function (userId, reason, transaction = null) {
      const FeeTransaction = this.constructor;

      if (!this.canBeReversed()) {
         throw new Error('Transaction cannot be reversed');
      }

      this.is_reversed = true;
      this.reversed_by = userId;
      this.reversal_date = new Date();
      this.reversal_reason = reason;

      await this.save({ transaction });

      // Create a reversal transaction
      const reversalType = this.transaction_type === 'payment' ? 'refund' : 'adjustment';
      const reversalAmount = this.transaction_type === 'refund' ? this.total_amount : -this.total_amount;

      const reversalTransaction = await FeeTransaction.create(
         {
            student_id: this.student_id,
            fee_assignment_id: this.fee_assignment_id,
            transaction_type: reversalType,
            academic_year: this.academic_year,
            total_amount: Math.abs(reversalAmount),
            transaction_date: new Date(),
            collected_by: userId,
            remarks: `Reversal of transaction ${this.transaction_number}: ${reason}`,
            adjustment_details: {
               reason: `Reversal: ${reason}`,
               original_transaction: this.transaction_number,
               reversed_by: userId,
               reversal_date: new Date(),
            },
         },
         { transaction }
      );

      return reversalTransaction;
   },

   /**
    * Get formatted transaction details for display/API response
    * @returns {Object} Formatted transaction data
    */
   getFormattedDetails: function () {
      return {
         transaction_number: this.transaction_number,
         receipt_number: this.receipt_number,
         type: this.transaction_type,
         amount: parseFloat(this.total_amount),
         date: this.transaction_date,
         method: this.payment_method,
         status: this.transaction_status,
         components: this.getFeeComponents(),
         period: this.getPeriodCovered(),
         late_fee: parseFloat(this.late_fee_applied || 0),
         discount: parseFloat(this.discount_applied || 0),
         remarks: this.remarks,
         is_reversed: this.is_reversed,
      };
   },
};

module.exports = feeTransactionInstanceMethods;
