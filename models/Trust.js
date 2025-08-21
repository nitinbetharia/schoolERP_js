const { DataTypes } = require("sequelize");
const Joi = require("joi");
const { commonSchemas } = require("../utils/errors");
const { TRUST_STATUS, VALIDATION } = require("../config/business-constants");

/**
 * Trust model definition for system database
 * Represents educational trusts in the multi-tenant system
 */
const defineTrustModel = (sequelize) => {
  const Trust = sequelize.define(
    "Trust",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: "Primary key for trust",
      },

      trust_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: "Official name of the educational trust",
      },

      trust_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: "Unique code for trust identification",
      },

      subdomain: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Subdomain for tenant access",
      },

      contact_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
        comment: "Primary contact email for the trust",
      },

      contact_phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
        comment: "Primary contact phone number",
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Trust address",
      },

      database_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Tenant database name",
      },

      status: {
        type: DataTypes.ENUM(...Object.values(TRUST_STATUS)),
        defaultValue: TRUST_STATUS.SETUP_PENDING,
        comment: "Trust operational status",
      },

      tenant_config: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          nep_2020_adoption: {
            enabled: false,
            adoption_date: null,
            policy: "TRADITIONAL", // 'TRADITIONAL', 'NEP_2020', 'HYBRID'
            allow_school_override: true,
            academic_year_from: null,
          },
        },
        comment:
          "Trust-specific configuration settings including NEP 2020 policy",
      },

      setup_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when initial setup was completed",
      },

      last_active_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Last activity timestamp",
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: "Record creation timestamp",
      },

      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: "Record last update timestamp",
      },
    },
    {
      tableName: "trusts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        // Note: unique constraints on fields automatically create indexes
        // Only adding non-unique indexes here
        {
          fields: ["status"],
          name: "idx_trusts_status",
        },
      ],
      hooks: {
        beforeValidate: (trust) => {
          // Convert to lowercase for consistency
          if (trust.trust_code) {
            trust.trust_code = trust.trust_code.toLowerCase();
          }
          if (trust.subdomain) {
            trust.subdomain = trust.subdomain.toLowerCase();
          }
          if (trust.contact_email) {
            trust.contact_email = trust.contact_email.toLowerCase();
          }
        },

        beforeCreate: (trust) => {
          // Generate database name if not provided
          if (!trust.database_name) {
            trust.database_name = `school_erp_trust_${trust.trust_code}`;
          }
        },
      },
    },
  );

  // Instance methods
  Trust.prototype.isActive = function () {
    return this.status === TRUST_STATUS.ACTIVE;
  };

  Trust.prototype.isSetupComplete = function () {
    return this.setup_completed_at !== null;
  };

  Trust.prototype.markSetupComplete = function () {
    this.setup_completed_at = new Date();
    this.status = TRUST_STATUS.ACTIVE;
    return this.save();
  };

  return Trust;
};

/**
 * Validation schemas for Trust model
 */
const trustValidationSchemas = {
  create: Joi.object({
    trust_name: Joi.string()
      .trim()
      .min(VALIDATION.NAME_MIN_LENGTH)
      .max(200)
      .required()
      .messages({
        "string.empty": "Trust name is required",
        "string.min": `Trust name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`,
        "string.max": "Trust name cannot exceed 200 characters",
      }),

    trust_code: Joi.string()
      .trim()
      .lowercase()
      .min(VALIDATION.TRUST_CODE_MIN_LENGTH)
      .max(VALIDATION.TRUST_CODE_MAX_LENGTH)
      .pattern(/^[a-z0-9_-]+$/)
      .required()
      .messages({
        "string.empty": "Trust code is required",
        "string.pattern.base":
          "Trust code can only contain lowercase letters, numbers, hyphens and underscores",
        "string.min": `Trust code must be at least ${VALIDATION.TRUST_CODE_MIN_LENGTH} characters`,
        "string.max": `Trust code cannot exceed ${VALIDATION.TRUST_CODE_MAX_LENGTH} characters`,
      }),

    subdomain: Joi.string()
      .trim()
      .lowercase()
      .min(VALIDATION.SUBDOMAIN_MIN_LENGTH)
      .max(VALIDATION.SUBDOMAIN_MAX_LENGTH)
      .pattern(/^[a-z0-9-]+$/)
      .required()
      .messages({
        "string.empty": "Subdomain is required",
        "string.pattern.base":
          "Subdomain can only contain lowercase letters, numbers and hyphens",
        "string.min": `Subdomain must be at least ${VALIDATION.SUBDOMAIN_MIN_LENGTH} characters`,
        "string.max": `Subdomain cannot exceed ${VALIDATION.SUBDOMAIN_MAX_LENGTH} characters`,
      }),

    contact_email: commonSchemas.email,

    contact_phone: Joi.string()
      .pattern(/^\d{10,15}$/)
      .optional()
      .messages({
        "string.pattern.base": "Phone number must be 10-15 digits",
      }),

    address: Joi.string().trim().max(500).optional(),

    tenant_config: Joi.object().optional(),
  }),

  update: Joi.object({
    trust_name: Joi.string()
      .trim()
      .min(VALIDATION.NAME_MIN_LENGTH)
      .max(200)
      .optional(),

    contact_email: Joi.string().email().max(255).optional(),

    contact_phone: Joi.string()
      .pattern(/^\d{10,15}$/)
      .optional(),

    address: Joi.string().trim().max(500).optional(),

    status: Joi.string()
      .valid(...Object.values(TRUST_STATUS))
      .optional(),

    tenant_config: Joi.object().optional(),
  }),
};

module.exports = {
  defineTrustModel,
  trustValidationSchemas,
};
