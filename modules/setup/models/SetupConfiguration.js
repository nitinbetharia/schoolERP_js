const { DataTypes } = require('sequelize');

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

module.exports = { defineSetupConfiguration };
