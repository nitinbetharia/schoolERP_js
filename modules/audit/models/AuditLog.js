/**
 * AuditLog Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * AuditLog provides comprehensive audit trails for all system operations
 * - Tracks all CRUD operations across all entities
 * - Captures before/after values for data changes
 * - Records user actions and system events
 * - Enables compliance and forensic analysis
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * AuditLog Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} AuditLog model
 */
function createAuditLogModel(sequelize) {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Audit identification
      auditId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'audit_id',
        comment: 'Unique identifier for audit entry'
      },

      // Operation details
      action: {
        type: DataTypes.ENUM(...constants.AUDIT_ACTIONS.ALL_ACTIONS),
        allowNull: false,
        validate: {
          isIn: [constants.AUDIT_ACTIONS.ALL_ACTIONS]
        }
      },

      entityType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'entity_type',
        comment: 'Type of entity being audited (User, Student, etc.)'
      },

      entityId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'entity_id',
        comment: 'ID of the entity being audited'
      },

      // Table and operation context
      tableName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'table_name',
        comment: 'Database table name'
      },

      primaryKeyValue: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'primary_key_value',
        comment: 'Primary key value of the affected record'
      },

      // User and session context
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who performed the action (null for system actions)'
      },

      sessionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'session_id',
        comment: 'User session ID'
      },

      // Request context
      requestId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'request_id',
        comment: 'Unique request identifier for tracking'
      },

      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: 'IP address of the user/system'
      },

      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: 'User agent string'
      },

      // Data changes
      oldValues: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'old_values',
        comment: 'Previous values before the change (for UPDATE/DELETE)'
      },

      newValues: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'new_values',
        comment: 'New values after the change (for CREATE/UPDATE)'
      },

      changedFields: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'changed_fields',
        comment: 'List of fields that were modified'
      },

      // Operation metadata
      operationResult: {
        type: DataTypes.ENUM(...constants.OPERATION_RESULTS.ALL_RESULTS),
        allowNull: false,
        field: 'operation_result',
        validate: {
          isIn: [constants.OPERATION_RESULTS.ALL_RESULTS]
        }
      },

      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message',
        comment: 'Error message if operation failed'
      },

      // Business context
      businessReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'business_reason',
        comment: 'Business justification for the change'
      },

      category: {
        type: DataTypes.ENUM(...constants.AUDIT_CATEGORIES.ALL_CATEGORIES),
        allowNull: false,
        validate: {
          isIn: [constants.AUDIT_CATEGORIES.ALL_CATEGORIES]
        }
      },

      riskLevel: {
        type: DataTypes.ENUM(...constants.RISK_LEVELS.ALL_LEVELS),
        allowNull: false,
        field: 'risk_level',
        defaultValue: constants.RISK_LEVELS.LOW,
        validate: {
          isIn: [constants.RISK_LEVELS.ALL_LEVELS]
        }
      },

      // System context
      applicationModule: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'application_module',
        comment: 'Application module/feature that initiated the action'
      },

      serverInstance: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'server_instance',
        comment: 'Server instance that processed the request'
      },

      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional context information'
      },

      // Compliance and retention
      retentionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'retention_date',
        comment: 'Date when this audit record can be purged'
      },

      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_archived',
        comment: 'Whether this record has been archived'
      },

      // Timestamp
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      }
    },
    {
      // Model options
      tableName: 'audit_logs',
      timestamps: false, // Only using createdAt
      underscored: true,
      
      // Indexes for performance
      indexes: [
        {
          unique: true,
          fields: ['audit_id']
        },
        {
          fields: ['entity_type', 'entity_id']
        },
        {
          fields: ['table_name', 'primary_key_value']
        },
        {
          fields: ['user_id']
        },
        {
          fields: ['action']
        },
        {
          fields: ['category']
        },
        {
          fields: ['risk_level']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['retention_date']
        },
        {
          // Composite index for entity timeline
          fields: ['entity_type', 'entity_id', 'created_at']
        },
        {
          // Composite index for user activity
          fields: ['user_id', 'created_at']
        },
        {
          // Composite index for risk analysis
          fields: ['risk_level', 'category', 'created_at']
        },
        {
          // Composite index for compliance reporting
          fields: ['category', 'action', 'created_at']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  AuditLog.associate = (models) => {
    // AuditLog belongs to User (optional - system actions have no user)
    if (models.User) {
      AuditLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'SET NULL'
      });
    }
  };

  // Instance methods
  AuditLog.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Parse JSON fields if they're strings
    ['oldValues', 'newValues', 'changedFields', 'metadata'].forEach(field => {
      if (values[field] && typeof values[field] === 'string') {
        try {
          values[field] = JSON.parse(values[field]);
        } catch (e) {
          values[field] = null;
        }
      }
    });
    
    return values;
  };

  AuditLog.prototype.isSuccess = function() {
    return this.operationResult === constants.OPERATION_RESULTS.SUCCESS;
  };

  AuditLog.prototype.isFailed = function() {
    return this.operationResult === constants.OPERATION_RESULTS.FAILED;
  };

  AuditLog.prototype.isHighRisk = function() {
    return this.riskLevel === constants.RISK_LEVELS.HIGH;
  };

  AuditLog.prototype.isArchivable = function() {
    return this.retentionDate && this.retentionDate <= new Date();
  };

  AuditLog.prototype.getChangeSummary = function() {
    if (!this.changedFields || this.changedFields.length === 0) {
      return 'No fields changed';
    }
    
    const fields = Array.isArray(this.changedFields) ? this.changedFields : [];
    if (fields.length === 1) {
      return `Changed field: ${fields[0]}`;
    } else if (fields.length <= 3) {
      return `Changed fields: ${fields.join(', ')}`;
    } else {
      return `Changed ${fields.length} fields: ${fields.slice(0, 3).join(', ')}, ...`;
    }
  };

  AuditLog.prototype.archive = async function() {
    return await this.update({
      isArchived: true,
      metadata: {
        ...this.metadata,
        archivedAt: new Date(),
        archivedReason: 'Retention policy'
      }
    });
  };

  // Class methods for creating audit entries
  AuditLog.logCreate = async function(entityType, entityId, newValues, context = {}) {
    return await this.createAuditEntry({
      action: constants.AUDIT_ACTIONS.CREATE,
      entityType,
      entityId,
      newValues,
      ...context
    });
  };

  AuditLog.logUpdate = async function(entityType, entityId, oldValues, newValues, context = {}) {
    const changedFields = this.getChangedFields(oldValues, newValues);
    
    return await this.createAuditEntry({
      action: constants.AUDIT_ACTIONS.UPDATE,
      entityType,
      entityId,
      oldValues,
      newValues,
      changedFields,
      ...context
    });
  };

  AuditLog.logDelete = async function(entityType, entityId, oldValues, context = {}) {
    return await this.createAuditEntry({
      action: constants.AUDIT_ACTIONS.DELETE,
      entityType,
      entityId,
      oldValues,
      riskLevel: constants.RISK_LEVELS.HIGH, // Deletions are high risk by default
      ...context
    });
  };

  AuditLog.logLogin = async function(userId, context = {}) {
    return await this.createAuditEntry({
      action: constants.AUDIT_ACTIONS.LOGIN,
      entityType: 'User',
      entityId: userId.toString(),
      category: constants.AUDIT_CATEGORIES.AUTHENTICATION,
      userId,
      ...context
    });
  };

  AuditLog.logLogout = async function(userId, context = {}) {
    return await this.createAuditEntry({
      action: constants.AUDIT_ACTIONS.LOGOUT,
      entityType: 'User',
      entityId: userId.toString(),
      category: constants.AUDIT_CATEGORIES.AUTHENTICATION,
      userId,
      ...context
    });
  };

  AuditLog.logAccess = async function(entityType, entityId, userId, context = {}) {
    return await this.createAuditEntry({
      action: constants.AUDIT_ACTIONS.ACCESS,
      entityType,
      entityId,
      category: constants.AUDIT_CATEGORIES.DATA_ACCESS,
      userId,
      riskLevel: constants.RISK_LEVELS.LOW,
      ...context
    });
  };

  AuditLog.createAuditEntry = async function(data) {
    const auditId = `AUDIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set defaults
    const auditData = {
      auditId,
      tableName: data.tableName || this.getTableNameFromEntityType(data.entityType),
      primaryKeyValue: data.primaryKeyValue || data.entityId,
      category: data.category || constants.AUDIT_CATEGORIES.DATA_MODIFICATION,
      riskLevel: data.riskLevel || this.assessRiskLevel(data),
      operationResult: data.operationResult || constants.OPERATION_RESULTS.SUCCESS,
      serverInstance: process.env.SERVER_INSTANCE || 'unknown',
      retentionDate: this.calculateRetentionDate(data.category),
      createdAt: new Date(),
      ...data
    };

    return await this.create(auditData);
  };

  AuditLog.getChangedFields = function(oldValues, newValues) {
    if (!oldValues || !newValues) return [];
    
    const changed = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
    
    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        changed.push(key);
      }
    }
    
    return changed;
  };

  AuditLog.getTableNameFromEntityType = function(entityType) {
    const mapping = {
      'User': 'users',
      'Student': 'students',
      'Parent': 'parents',
      'Teacher': 'teachers',
      'Class': 'classes',
      'Section': 'sections',
      'Subject': 'subjects',
      'FeeStructure': 'fee_structures',
      'FeeTransaction': 'fee_transactions',
      'AttendanceRecord': 'attendance_records',
      'Message': 'messages'
    };
    
    return mapping[entityType] || entityType.toLowerCase() + 's';
  };

  AuditLog.assessRiskLevel = function(data) {
    // High risk operations
    if (data.action === constants.AUDIT_ACTIONS.DELETE) return constants.RISK_LEVELS.HIGH;
    if (data.entityType === 'User' && data.action === constants.AUDIT_ACTIONS.UPDATE) return constants.RISK_LEVELS.HIGH;
    if (data.category === constants.AUDIT_CATEGORIES.AUTHENTICATION) return constants.RISK_LEVELS.MEDIUM;
    if (data.category === constants.AUDIT_CATEGORIES.FINANCE) return constants.RISK_LEVELS.HIGH;
    
    // Medium risk by default
    return constants.RISK_LEVELS.MEDIUM;
  };

  AuditLog.calculateRetentionDate = function(category) {
    const now = new Date();
    const retentionPeriods = {
      [constants.AUDIT_CATEGORIES.AUTHENTICATION]: 365, // 1 year
      [constants.AUDIT_CATEGORIES.FINANCE]: 2555, // 7 years
      [constants.AUDIT_CATEGORIES.ACADEMIC]: 1825, // 5 years
      [constants.AUDIT_CATEGORIES.COMMUNICATION]: 1095, // 3 years
      [constants.AUDIT_CATEGORIES.DATA_MODIFICATION]: 730, // 2 years
      [constants.AUDIT_CATEGORIES.DATA_ACCESS]: 365, // 1 year
      [constants.AUDIT_CATEGORIES.SYSTEM]: 365 // 1 year
    };
    
    const days = retentionPeriods[category] || 730; // Default 2 years
    const retentionDate = new Date(now);
    retentionDate.setDate(retentionDate.getDate() + days);
    
    return retentionDate;
  };

  // Query methods
  AuditLog.findByEntity = async function(entityType, entityId, options = {}) {
    return await this.findAll({
      where: {
        entityType,
        entityId: entityId.toString()
      },
      order: [['created_at', 'DESC']],
      limit: options.limit || 100,
      include: options.include || ['user']
    });
  };

  AuditLog.findByUser = async function(userId, options = {}) {
    const where = { userId };
    
    if (options.startDate && options.endDate) {
      where.createdAt = {
        [sequelize.Op.between]: [options.startDate, options.endDate]
      };
    }
    
    if (options.action) {
      where.action = options.action;
    }
    
    if (options.category) {
      where.category = options.category;
    }

    return await this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit || 100
    });
  };

  AuditLog.findHighRiskOperations = async function(options = {}) {
    const where = {
      riskLevel: constants.RISK_LEVELS.HIGH
    };
    
    if (options.startDate && options.endDate) {
      where.createdAt = {
        [sequelize.Op.between]: [options.startDate, options.endDate]
      };
    }

    return await this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit || 100,
      include: ['user']
    });
  };

  AuditLog.findFailedOperations = async function(options = {}) {
    const where = {
      operationResult: constants.OPERATION_RESULTS.FAILED
    };
    
    if (options.startDate && options.endDate) {
      where.createdAt = {
        [sequelize.Op.between]: [options.startDate, options.endDate]
      };
    }

    return await this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit || 100,
      include: ['user']
    });
  };

  AuditLog.getActivitySummary = async function(filters = {}) {
    const where = {};
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [sequelize.Op.between]: [filters.startDate, filters.endDate]
      };
    }

    const summary = await this.findAll({
      where,
      attributes: [
        'action',
        'category',
        'operation_result',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action', 'category', 'operation_result'],
      raw: true
    });

    return summary.map(item => ({
      action: item.action,
      category: item.category,
      operationResult: item.operation_result,
      count: parseInt(item.count)
    }));
  };

  AuditLog.archiveOldRecords = async function() {
    const result = await this.update(
      { isArchived: true },
      {
        where: {
          retentionDate: {
            [sequelize.Op.lte]: new Date()
          },
          isArchived: false
        }
      }
    );
    
    return result[0]; // Number of affected rows
  };

  AuditLog.purgeArchivedRecords = async function(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await this.destroy({
      where: {
        isArchived: true,
        retentionDate: {
          [sequelize.Op.lte]: cutoffDate
        }
      }
    });
    
    return result;
  };

  return AuditLog;
}

// Q19 Compliance: Joi validation schemas
const auditLogValidationSchemas = {
  create: Joi.object({
    action: Joi.string().valid(...constants.AUDIT_ACTIONS.ALL_ACTIONS).required(),
    entityType: Joi.string().max(100).required(),
    entityId: Joi.string().max(50).required(),
    tableName: Joi.string().max(100).optional(),
    primaryKeyValue: Joi.string().max(50).optional(),
    userId: Joi.number().integer().min(1).optional(),
    sessionId: Joi.string().max(100).optional(),
    requestId: Joi.string().max(100).optional(),
    ipAddress: Joi.string().max(45).optional(),
    userAgent: Joi.string().optional(),
    oldValues: Joi.object().optional(),
    newValues: Joi.object().optional(),
    changedFields: Joi.array().items(Joi.string()).optional(),
    operationResult: Joi.string().valid(...constants.OPERATION_RESULTS.ALL_RESULTS).default(constants.OPERATION_RESULTS.SUCCESS),
    errorMessage: Joi.string().optional(),
    businessReason: Joi.string().optional(),
    category: Joi.string().valid(...constants.AUDIT_CATEGORIES.ALL_CATEGORIES).required(),
    riskLevel: Joi.string().valid(...constants.RISK_LEVELS.ALL_LEVELS).default(constants.RISK_LEVELS.LOW),
    applicationModule: Joi.string().max(100).optional(),
    metadata: Joi.object().optional()
  }),

  query: Joi.object({
    entityType: Joi.string().max(100).optional(),
    entityId: Joi.string().max(50).optional(),
    userId: Joi.number().integer().min(1).optional(),
    action: Joi.string().valid(...constants.AUDIT_ACTIONS.ALL_ACTIONS).optional(),
    category: Joi.string().valid(...constants.AUDIT_CATEGORIES.ALL_CATEGORIES).optional(),
    riskLevel: Joi.string().valid(...constants.RISK_LEVELS.ALL_LEVELS).optional(),
    operationResult: Joi.string().valid(...constants.OPERATION_RESULTS.ALL_RESULTS).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  }),

  archive: Joi.object({
    olderThanDays: Joi.number().integer().min(1).max(3650).default(30)
  })
};

module.exports = createAuditLogModel;
module.exports.validationSchemas = auditLogValidationSchemas;
