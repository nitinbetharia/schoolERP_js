/**
 * Fee Transaction Model - Hooks and Validation
 * Database hooks for automatic field generation and validation logic
 * Handles transaction numbering and receipt generation
 *
 * Following copilot instructions: CommonJS, clear hook organization
 */

const feeTransactionHooks = {
   beforeCreate: (transaction) => {
      // Generate transaction number if not provided
      if (!transaction.transaction_number) {
         const date = new Date();
         const year = date.getFullYear().toString().substr(-2);
         const month = (date.getMonth() + 1).toString().padStart(2, '0');
         const random = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, '0');
         transaction.transaction_number = `TXN${year}${month}${random}`;
      }

      // Generate receipt number for payments
      if (transaction.transaction_type === 'payment' && !transaction.receipt_number) {
         const date = new Date();
         const year = date.getFullYear().toString().substr(-2);
         const month = (date.getMonth() + 1).toString().padStart(2, '0');
         const random = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, '0');
         transaction.receipt_number = `RCP${year}${month}${random}`;
      }
   },
};

module.exports = feeTransactionHooks;
