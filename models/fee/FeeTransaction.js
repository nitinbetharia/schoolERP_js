const { feeTransactionFields, feeTransactionOptions } = require('./fee/FeeTransactionFields');
const feeTransactionInstanceMethods = require('./fee/FeeTransactionInstanceMethods');
const feeTransactionClassMethods = require('./fee/FeeTransactionClassMethods');
const feeTransactionHooks = require('./fee/FeeTransactionHooks');

/**
 * Fee Transaction Model - Main Definition
 * Modular Sequelize model combining fields, methods, hooks from specialized modules
 * Tracks all fee payments, adjustments, and financial transactions in TENANT database
 *
 * Architecture:
 * - FeeTransactionFields: Schema definition, indexes, constraints
 * - FeeTransactionInstanceMethods: Business logic for individual transactions
 * - FeeTransactionClassMethods: Static methods for queries and bulk operations
 * - FeeTransactionHooks: Database hooks for auto-generation and validation
 *
 * Following copilot instructions: CommonJS, modular architecture, clean separation
 */
const defineFeeTransaction = (sequelize) => {
   const FeeTransaction = sequelize.define(
      'FeeTransaction',
      feeTransactionFields,
      {
         ...feeTransactionOptions,
         hooks: feeTransactionHooks,
      }
   );

   // Attach instance methods
   Object.keys(feeTransactionInstanceMethods).forEach((methodName) => {
      FeeTransaction.prototype[methodName] = feeTransactionInstanceMethods[methodName];
   });

   // Attach class methods
   Object.keys(feeTransactionClassMethods).forEach((methodName) => {
      FeeTransaction[methodName] = feeTransactionClassMethods[methodName];
   });

   return FeeTransaction;
};

module.exports = defineFeeTransaction;
