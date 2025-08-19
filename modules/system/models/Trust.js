/**
 * Trust Model - System Database Entity
 *
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for system entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 *
 * Trust represents a tenant/organization in the system
 * - Each trust has its own database (school_erp_trust_{trustCode})
 * - Contains configuration and contact information
 * - Used for multi-tenant management
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * Trust Model Definition
 * @param {Sequelize} sequelize - System sequelize instance
 * @returns {Model} Trust model
 */
function createTrustModel(sequelize) {
  const Trust = sequelize.define(
    'Trust',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Trust identification
      trustName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'trust_name'
      },

      trustCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'trust_code',
        validate: {
          isAlphanumeric: true,
          isUppercase: true,
          len: [2, 20]
        }
      },

      subdomain: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          isLowercase: true,
          is: /^[a-z0-9-]+$/ // Only lowercase, numbers, and hyphens
        }
      },

      // Contact information
      contactEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'contact_email',
        validate: {
          isEmail: true
        }
      },

      contactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'contact_phone'
      },

      // Address information
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      state: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'postal_code'
      },

      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India'
      },

      // Technical configuration
      databaseName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'database_name'
      },

      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true
        }
      },

      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'logo_url'
      },

      // Configuration data
      themeConfig: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'theme_config'
      },

      tenantConfig: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'tenant_config',
        comment: 'Configurable features per tenant'
      },

      // Status management
      status: {
        type: DataTypes.ENUM(...constants.TRUST_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.TRUST_STATUS.ACTIVE,
        validate: {
          isIn: [constants.TRUST_STATUS.ALL_STATUS]
        }
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      // Model options
      tableName: 'trusts',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes for performance
      indexes: [
        {
          fields: ['subdomain']
        },
        {
          fields: ['trust_code']
        },
        {
          fields: ['status']
        },
        {
          fields: ['contact_email']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  Trust.associate = models => {
    // Trust has many SystemAuditLogs
    if (models.SystemAuditLog) {
      Trust.hasMany(models.SystemAuditLog, {
        foreignKey: 'trustId',
        as: 'auditLogs',
        onDelete: 'SET NULL'
      });
    }
  };

  // Instance methods
  Trust.prototype.toJSON = function () {
    const values = { ...this.dataValues };
    // Remove sensitive configuration from JSON output
    if (values.tenantConfig && values.tenantConfig.sensitive) {
      delete values.tenantConfig.sensitive;
    }
    return values;
  };

  // Class methods
  Trust.findByCode = async function (trustCode) {
    return await this.findOne({
      where: { trustCode: trustCode.toUpperCase() }
    });
  };

  Trust.findBySubdomain = async function (subdomain) {
    return await this.findOne({
      where: { subdomain: subdomain.toLowerCase() }
    });
  };

  return Trust;
}

// Q19 Compliance: Joi validation schemas
const trustValidationSchemas = {
  create: Joi.object({
    trustName: Joi.string().min(3).max(200).required(),
    trustCode: Joi.string().min(2).max(20).uppercase().alphanum().required(),
    subdomain: Joi.string()
      .min(3)
      .max(50)
      .lowercase()
      .pattern(/^[a-z0-9-]+$/)
      .required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().min(10).max(20).optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    postalCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).default('India'),
    website: Joi.string().uri().optional(),
    logoUrl: Joi.string().uri().optional(),
    themeConfig: Joi.object().optional(),
    tenantConfig: Joi.object().optional()
  }),

  update: Joi.object({
    trustName: Joi.string().min(3).max(200).optional(),
    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().min(10).max(20).optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    postalCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional(),
    logoUrl: Joi.string().uri().optional(),
    themeConfig: Joi.object().optional(),
    tenantConfig: Joi.object().optional(),
    status: Joi.string()
      .valid(...constants.TRUST_STATUS.ALL_STATUS)
      .optional()
  })
};

module.exports = createTrustModel;
module.exports.validationSchemas = trustValidationSchemas;
