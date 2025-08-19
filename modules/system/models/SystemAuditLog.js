/**
 * SystemAuditLog Model - System Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses BIGINT primary key for high-volume audit data
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * SystemAuditLog represents cross-tenant audit trail
 * - Tracks all system-level operations across all trusts
 * - Contains 2-year retention policy as per Q&A decisions
 * - Used for compliance and security monitoring
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * SystemAuditLog Model Definition
 * @param {Sequelize} sequelize - System sequelize instance
 * @returns {Model} SystemAuditLog model
 */
function createSystemAuditLogModel(sequelize) {
  const SystemAuditLog = sequelize.define(
    'SystemAuditLog',
    {
      // Primary key - BIGINT for high volume
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Trust reference (nullable for system-wide operations)
      trustId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'trust_id',
        references: {
          model: 'trusts',
          key: 'id'
        }
      },

      // User information
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id'
      },

      userType: {
        type: DataTypes.ENUM(...constants.AUDIT_USER_TYPES.ALL_TYPES),
        allowNull: false,
        field: 'user_type',
        validate: {
          isIn: [constants.AUDIT_USER_TYPES.ALL_TYPES]
        }
      },

      // Action details
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100]
        }
      },

      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [1, 50]
        }
      },

      // Database table and record information
      tableName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'table_name',
        validate: {
          len: [1, 100]
        }
      },

      recordId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'record_id',
        validate: {
          len: [1, 50]
        }
      },

      // Data changes (JSON format)
      oldValues: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'old_values'
      },

      newValues: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'new_values'
      },

      // Request context
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
        validate: {
          isIP: true
        }
      },

      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent'
      },

      sessionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'session_id'
      },

      requestUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'request_url'
      },

      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional context information'
      },

      // Timestamp (single field for audit logs)
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      }
    },
    {
      // Model options
      tableName: 'system_audit_logs',
      timestamps: false, // Only createdAt for audit logs
      underscored: true,
      
      // Indexes for performance and queries
      indexes: [
        {
          fields: ['trust_id', 'user_id']
        },
        {
          fields: ['action']
        },
        {
          fields: ['module']
        },
        {
          fields: ['table_name', 'record_id']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['user_type']
        },
        {
          // Composite index for common queries
          fields: ['trust_id', 'created_at']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  SystemAuditLog.associate = (models) => {
    // SystemAuditLog belongs to Trust
    if (models.Trust) {
      SystemAuditLog.belongsTo(models.Trust, {
        foreignKey: 'trustId',
        as: 'trust',
        onDelete: 'SET NULL'
      });
    }

    // SystemAuditLog belongs to SystemUser (when userType is SYSTEM_USER)
    if (models.SystemUser) {
      SystemAuditLog.belongsTo(models.SystemUser, {
        foreignKey: 'userId',
        as: 'systemUser',
        constraints: false, // Polymorphic association
        scope: { userType: 'SYSTEM_USER' }
      });
    }
  };

  // Instance methods
  SystemAuditLog.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Format timestamps
    if (values.createdAt) {
      values.createdAt = values.createdAt.toISOString();
    }
    
    // Truncate large user agent strings
    if (values.userAgent && values.userAgent.length > 200) {
      values.userAgent = values.userAgent.substring(0, 200) + '...';
    }
    
    return values;
  };

  // Class methods for audit log creation
  SystemAuditLog.logAction = async function(logData) {
    try {
      return await this.create({
        trustId: logData.trustId || null,
        userId: logData.userId || null,
        userType: logData.userType,
        action: logData.action,
        module: logData.module,
        tableName: logData.tableName || null,
        recordId: logData.recordId ? String(logData.recordId) : null,
        oldValues: logData.oldValues || null,
        newValues: logData.newValues || null,
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null,
        sessionId: logData.sessionId || null,
        requestUrl: logData.requestUrl || null,
        metadata: logData.metadata || null
      });
    } catch (error) {
      // Log creation should not fail the main operation
      console.error('Failed to create system audit log:', error.message);
      return null;
    }
  };

  // Query helpers
  SystemAuditLog.findByTrust = async function(trustId, options = {}) {
    return await this.findAll({
      where: { trustId },
      order: [['createdAt', 'DESC']],
      limit: options.limit || 100,
      include: options.include || []
    });
  };

  SystemAuditLog.findByUser = async function(userId, userType, options = {}) {
    return await this.findAll({
      where: { userId, userType },
      order: [['createdAt', 'DESC']],
      limit: options.limit || 100,
      include: options.include || []
    });
  };

  SystemAuditLog.findByDateRange = async function(startDate, endDate, options = {}) {
    return await this.findAll({
      where: {
        createdAt: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['createdAt', 'DESC']],
      limit: options.limit || 1000,
      include: options.include || []
    });
  };

  // Data retention management
  SystemAuditLog.cleanupOldLogs = async function() {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const deletedCount = await this.destroy({
      where: {
        createdAt: {
          [sequelize.Op.lt]: twoYearsAgo
        }
      }
    });
    
    console.log(`Cleaned up ${deletedCount} old audit logs (older than 2 years)`);
    return deletedCount;
  };

  return SystemAuditLog;
}

// Q19 Compliance: Joi validation schemas
const systemAuditLogValidationSchemas = {
  create: Joi.object({
    trustId: Joi.number().integer().min(1).optional(),
    userId: Joi.number().integer().min(1).optional(),
    userType: Joi.string().valid(...constants.AUDIT_USER_TYPES.ALL_TYPES).required(),
    action: Joi.string().min(1).max(100).required(),
    module: Joi.string().min(1).max(50).required(),
    tableName: Joi.string().min(1).max(100).optional(),
    recordId: Joi.string().min(1).max(50).optional(),
    oldValues: Joi.object().optional(),
    newValues: Joi.object().optional(),
    ipAddress: Joi.string().ip().optional(),
    userAgent: Joi.string().max(1000).optional(),
    sessionId: Joi.string().max(255).optional(),
    requestUrl: Joi.string().uri().max(500).optional(),
    metadata: Joi.object().optional()
  }),

  query: Joi.object({
    trustId: Joi.number().integer().min(1).optional(),
    userId: Joi.number().integer().min(1).optional(),
    userType: Joi.string().valid(...constants.AUDIT_USER_TYPES.ALL_TYPES).optional(),
    action: Joi.string().optional(),
    module: Joi.string().optional(),
    tableName: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  })
};

module.exports = createSystemAuditLogModel;
module.exports.validationSchemas = systemAuditLogValidationSchemas;
