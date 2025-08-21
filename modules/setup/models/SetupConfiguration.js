const { DataTypes } = require('sequelize');
const Joi = require('joi');

/**
 * Q59-ENFORCED: Comprehensive validation schemas for setup configuration operations
 */
const setupConfigurationValidationSchemas = {
   // Setup Configuration Creation
   createSetupConfiguration: Joi.object({
      trust_id: Joi.number().integer().positive().required().messages({
         'number.positive': 'Trust ID must be positive',
         'any.required': 'Trust ID is required',
      }),
      step_name: Joi.string().max(100).required().messages({
         'string.max': 'Step name cannot exceed 100 characters',
         'any.required': 'Step name is required',
      }),
      step_order: Joi.number().integer().min(1).required().messages({
         'number.min': 'Step order must be at least 1',
         'any.required': 'Step order is required',
      }),
      is_completed: Joi.boolean().default(false),
      completed_by: Joi.number().integer().positive().optional().allow(null).messages({
         'number.positive': 'Completed by user ID must be positive',
      }),
      configuration_data: Joi.object().optional().allow(null),
      validation_errors: Joi.array().items(Joi.string()).optional().allow(null),
   }),

   // Setup Configuration Update
   updateSetupConfiguration: Joi.object({
      is_completed: Joi.boolean().optional(),
      completed_by: Joi.number().integer().positive().optional().allow(null).messages({
         'number.positive': 'Completed by user ID must be positive',
      }),
      configuration_data: Joi.object().optional().allow(null),
      validation_errors: Joi.array().items(Joi.string()).optional().allow(null),
   }),

   // Setup Configuration Query
   querySetupConfigurations: Joi.object({
      trust_id: Joi.number().integer().positive().optional().messages({
         'number.positive': 'Trust ID must be positive',
      }),
      step_name: Joi.string().max(100).optional(),
      is_completed: Joi.boolean().optional(),
      limit: Joi.number().integer().min(1).max(1000).default(50),
      offset: Joi.number().integer().min(0).default(0),
      sortBy: Joi.string().valid('step_order', 'step_name', 'completed_at', 'created_at').default('step_order'),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
   })
      .min(1)
      .messages({
         'object.min': 'At least one filter parameter is required',
      }),
};

/**
 * Setup Configuration Model
 * Manages trust-level setup configurations and progress tracking
 */
const defineSetupConfiguration = (sequelize) => {
   const SetupConfiguration = sequelize.define(
      'SetupConfiguration',
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
         },
         step_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Setup step name (trust_info, academic_year, schools, users, etc.)',
         },
         step_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Order of setup step',
         },
         is_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this setup step is completed',
         },
         completed_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'System user ID who completed this step',
         },
         completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When this step was completed',
         },
         configuration_data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON data for step configuration',
         },
         validation_errors: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON array of validation errors if any',
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'setup_configurations',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'setup_config_trust_id_idx',
               fields: ['trust_id'],
            },
            {
               name: 'setup_config_step_idx',
               fields: ['trust_id', 'step_name'],
            },
            {
               name: 'setup_config_order_idx',
               fields: ['trust_id', 'step_order'],
            },
            {
               name: 'setup_config_status_idx',
               fields: ['trust_id', 'is_completed'],
            },
         ],
      }
   );

   return SetupConfiguration;
};

// Q59-ENFORCED: Export validation schemas
module.exports = {
   defineSetupConfiguration,
   setupConfigurationValidationSchemas,
};
