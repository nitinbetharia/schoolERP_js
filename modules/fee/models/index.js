const { logger } = require('../../../utils/logger');

/**
 * Fee Module Models Index
 * Centralizes all fee-related model definitions
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */

const defineFeeStructure = require('./FeeStructure');
const defineStudentFee = require('./StudentFee');
const defineFeeCollection = require('./FeeCollection');
const defineFeeInstallment = require('./FeeInstallment');
const defineFeeDiscount = require('./FeeDiscount');
const defineStudentFeeDiscount = require('./StudentFeeDiscount');

/**
 * Initialize all fee models with the given sequelize instance
 * @param {Object} sequelize - Sequelize instance
 * @returns {Object} Object containing all fee models
 */
function initializeFeeModels(sequelize) {
   try {
      logger.info('Initializing fee module models');

      // Define all models
      const FeeStructure = defineFeeStructure(sequelize);
      const StudentFee = defineStudentFee(sequelize);
      const FeeCollection = defineFeeCollection(sequelize);
      const FeeInstallment = defineFeeInstallment(sequelize);
      const FeeDiscount = defineFeeDiscount(sequelize);
      const StudentFeeDiscount = defineStudentFeeDiscount(sequelize);

      const models = {
         FeeStructure,
         StudentFee,
         FeeCollection,
         FeeInstallment,
         FeeDiscount,
         StudentFeeDiscount,
      };

      logger.info('Fee module models initialized successfully', {
         models_count: Object.keys(models).length,
         model_names: Object.keys(models),
      });

      return models;
   } catch (error) {
      logger.error('Error initializing fee module models', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

/**
 * Set up associations between fee models
 * @param {Object} models - Object containing all models (including non-fee models)
 */
function setupFeeAssociations(models) {
   try {
      logger.info('Setting up fee module associations');

      // FeeStructure associations
      if (models.FeeStructure && typeof models.FeeStructure.associate === 'function') {
         models.FeeStructure.associate(models);
      }

      // StudentFee associations
      if (models.StudentFee && typeof models.StudentFee.associate === 'function') {
         models.StudentFee.associate(models);
      }

      // FeeCollection associations
      if (models.FeeCollection && typeof models.FeeCollection.associate === 'function') {
         models.FeeCollection.associate(models);
      }

      // FeeInstallment associations
      if (models.FeeInstallment && typeof models.FeeInstallment.associate === 'function') {
         models.FeeInstallment.associate(models);
      }

      // FeeDiscount associations
      if (models.FeeDiscount && typeof models.FeeDiscount.associate === 'function') {
         models.FeeDiscount.associate(models);
      }

      // StudentFeeDiscount associations
      if (models.StudentFeeDiscount && typeof models.StudentFeeDiscount.associate === 'function') {
         models.StudentFeeDiscount.associate(models);
      }

      logger.info('Fee module associations set up successfully');
   } catch (error) {
      logger.error('Error setting up fee module associations', {
         error: error.message,
         stack: error.stack,
      });
      throw error;
   }
}

/**
 * Get validation schemas for all fee models
 * @returns {Object} Object containing validation schemas for all models
 */
function getFeeValidationSchemas() {
   try {
      const schemas = {};

      // Import validation schemas from each model
      const FeeStructure = require('./FeeStructure');
      const StudentFee = require('./StudentFee');
      const FeeCollection = require('./FeeCollection');
      const FeeInstallment = require('./FeeInstallment');
      const FeeDiscount = require('./FeeDiscount');
      const StudentFeeDiscount = require('./StudentFeeDiscount');

      // Note: These will be functions, we need to call them to get the model definition
      // In a real scenario, we'd need to structure this differently
      // For now, we'll return a placeholder structure

      schemas.FeeStructure = {
         create: {
            fee_name: { required: true, type: 'string', minLength: 3, maxLength: 100 },
            fee_category: { required: true, type: 'string' },
            amount: { required: true, type: 'number', min: 0.01 },
            class_name: { required: true, type: 'string' },
         },
         update: {
            is_active: { required: false, type: 'boolean' },
         },
      };

      schemas.StudentFee = {
         create: {
            student_id: { required: true, type: 'integer', min: 1 },
            fee_structure_id: { required: true, type: 'integer', min: 1 },
            academic_year: { required: true, type: 'string' },
         },
         update: {
            payment_status: { required: false, type: 'string' },
         },
      };

      schemas.FeeCollection = {
         create: {
            student_id: { required: true, type: 'integer', min: 1 },
            student_fee_id: { required: true, type: 'integer', min: 1 },
            payment_amount: { required: true, type: 'number', min: 0.01 },
            payment_method: { required: true, type: 'string' },
            payment_date: { required: true, type: 'date' },
         },
         update: {
            payment_status: { required: false, type: 'string' },
         },
      };

      schemas.FeeInstallment = {
         create: {
            student_fee_id: { required: true, type: 'integer', min: 1 },
            installment_number: { required: true, type: 'integer', min: 1, max: 12 },
            due_date: { required: true, type: 'date' },
            due_amount: { required: true, type: 'number', min: 0.01 },
         },
         update: {
            payment_status: { required: false, type: 'string' },
         },
      };

      schemas.FeeDiscount = {
         create: {
            discount_name: { required: true, type: 'string', minLength: 3, maxLength: 100 },
            discount_code: { required: true, type: 'string', minLength: 3, maxLength: 20 },
            discount_type: { required: true, type: 'string' },
            discount_category: { required: true, type: 'string' },
            discount_value: { required: true, type: 'number', min: 0 },
         },
         update: {
            is_active: { required: false, type: 'boolean' },
         },
      };

      schemas.StudentFeeDiscount = {
         create: {
            student_fee_id: { required: true, type: 'integer', min: 1 },
            fee_discount_id: { required: true, type: 'integer', min: 1 },
         },
         approve: {
            remarks: { required: false, type: 'string', maxLength: 1000 },
         },
         reject: {
            rejection_reason: { required: true, type: 'string', minLength: 10, maxLength: 1000 },
         },
      };

      return schemas;
   } catch (error) {
      logger.error('Error getting fee validation schemas', {
         error: error.message,
      });
      return {};
   }
}

/**
 * Get fee model configurations and metadata
 * @returns {Object} Object containing model configurations
 */
function getFeeModelConfigs() {
   return {
      FeeStructure: {
         tableName: 'fee_structures',
         primaryKey: 'id',
         timestamps: true,
         paranoid: false,
         description: 'Defines fee structures for different classes and categories',
      },
      StudentFee: {
         tableName: 'student_fees',
         primaryKey: 'id',
         timestamps: true,
         paranoid: false,
         description: 'Individual student fee assignments and tracking',
      },
      FeeCollection: {
         tableName: 'fee_collections',
         primaryKey: 'id',
         timestamps: true,
         paranoid: false,
         description: 'Records all fee payments and transactions',
      },
      FeeInstallment: {
         tableName: 'fee_installments',
         primaryKey: 'id',
         timestamps: true,
         paranoid: false,
         description: 'Manages fee installment plans and due dates',
      },
      FeeDiscount: {
         tableName: 'fee_discounts',
         primaryKey: 'id',
         timestamps: true,
         paranoid: false,
         description: 'Defines various types of discounts and concessions',
      },
      StudentFeeDiscount: {
         tableName: 'student_fee_discounts',
         primaryKey: 'id',
         timestamps: true,
         paranoid: false,
         description: 'Junction table for student fee and discount assignments',
      },
   };
}

/**
 * Utility function to get model relationships overview
 * @returns {Object} Object containing relationship mappings
 */
function getFeeModelRelationships() {
   return {
      FeeStructure: {
         hasMany: ['StudentFee'],
         belongsTo: ['School', 'User'],
         dependencies: ['School', 'User'],
      },
      StudentFee: {
         belongsTo: ['Student', 'FeeStructure', 'School'],
         hasMany: ['FeeCollection', 'FeeInstallment', 'StudentFeeDiscount'],
         dependencies: ['Student', 'FeeStructure', 'School'],
      },
      FeeCollection: {
         belongsTo: ['Student', 'StudentFee', 'FeeStructure', 'School', 'User'],
         dependencies: ['Student', 'StudentFee', 'User'],
      },
      FeeInstallment: {
         belongsTo: ['StudentFee', 'FeeStructure', 'Student', 'School', 'User'],
         hasMany: ['FeeCollection'],
         dependencies: ['StudentFee', 'Student'],
      },
      FeeDiscount: {
         belongsTo: ['School', 'User'],
         hasMany: ['StudentFeeDiscount'],
         dependencies: ['School', 'User'],
      },
      StudentFeeDiscount: {
         belongsTo: ['Student', 'StudentFee', 'FeeDiscount', 'School', 'User'],
         dependencies: ['Student', 'StudentFee', 'FeeDiscount'],
      },
   };
}

module.exports = {
   initializeFeeModels,
   setupFeeAssociations,
   getFeeValidationSchemas,
   getFeeModelConfigs,
   getFeeModelRelationships,
};
