/**
 * CommunicationLog Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * CommunicationLog provides detailed tracking of message processing
 * - Detailed logs of each step in message delivery
 * - Provider-specific responses and webhooks
 * - Performance metrics and delivery analytics
 * - Debug information for failed messages
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * CommunicationLog Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} CommunicationLog model
 */
function createCommunicationLogModel(sequelize) {
  const CommunicationLog = sequelize.define(
    'CommunicationLog',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Message reference
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'message_id',
        references: {
          model: 'messages',
          key: 'id'
        }
      },

      // Log entry details
      logLevel: {
        type: DataTypes.ENUM(...constants.LOG_LEVELS.ALL_LEVELS),
        allowNull: false,
        field: 'log_level',
        validate: {
          isIn: [constants.LOG_LEVELS.ALL_LEVELS]
        }
      },

      event: {
        type: DataTypes.ENUM(...constants.COMMUNICATION_EVENTS.ALL_EVENTS),
        allowNull: false,
        validate: {
          isIn: [constants.COMMUNICATION_EVENTS.ALL_EVENTS]
        }
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Human-readable description of the event'
      },

      // Provider information
      provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Communication provider (SendGrid, Twilio, etc.)'
      },

      providerMessageId: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'provider_message_id'
      },

      // Request/Response data
      requestData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'request_data',
        comment: 'Request payload sent to provider'
      },

      responseData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'response_data',
        comment: 'Response received from provider'
      },

      // HTTP details for API calls
      httpMethod: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'http_method'
      },

      httpStatusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'http_status_code'
      },

      // Timing information
      processingTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'processing_time_ms',
        comment: 'Time taken for this operation in milliseconds'
      },

      // Error details
      errorCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'error_code'
      },

      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
      },

      stackTrace: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'stack_trace'
      },

      // Retry information
      retryAttempt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'retry_attempt'
      },

      // Webhook information
      webhookData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'webhook_data',
        comment: 'Webhook payload received from provider'
      },

      webhookSignature: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'webhook_signature',
        comment: 'Webhook signature for verification'
      },

      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional context information'
      },

      // User context (if applicable)
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'User who triggered this action (if applicable)'
      },

      // System information
      serverInstance: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'server_instance',
        comment: 'Server instance that processed this event'
      },

      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: 'IP address of the requester'
      },

      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: 'User agent string'
      },

      // Timestamp
      loggedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'logged_at'
      }
    },
    {
      // Model options
      tableName: 'communication_logs',
      timestamps: false, // Only using loggedAt
      underscored: true,
      
      // Indexes for performance
      indexes: [
        {
          fields: ['message_id']
        },
        {
          fields: ['log_level']
        },
        {
          fields: ['event']
        },
        {
          fields: ['provider']
        },
        {
          fields: ['logged_at']
        },
        {
          fields: ['error_code']
        },
        {
          // Composite index for message timeline
          fields: ['message_id', 'logged_at']
        },
        {
          // Composite index for error analysis
          fields: ['log_level', 'error_code', 'logged_at']
        },
        {
          // Composite index for provider performance
          fields: ['provider', 'event', 'logged_at']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  CommunicationLog.associate = (models) => {
    // CommunicationLog belongs to Message
    if (models.Message) {
      CommunicationLog.belongsTo(models.Message, {
        foreignKey: 'messageId',
        as: 'message',
        onDelete: 'CASCADE'
      });
    }

    // CommunicationLog belongs to User (optional)
    if (models.User) {
      CommunicationLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'SET NULL'
      });
    }
  };

  // Instance methods
  CommunicationLog.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Parse JSON fields if they're strings
    ['requestData', 'responseData', 'webhookData', 'metadata'].forEach(field => {
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

  CommunicationLog.prototype.isError = function() {
    return this.logLevel === constants.LOG_LEVELS.ERROR;
  };

  CommunicationLog.prototype.isWarning = function() {
    return this.logLevel === constants.LOG_LEVELS.WARNING;
  };

  CommunicationLog.prototype.isSuccess = function() {
    return this.event === constants.COMMUNICATION_EVENTS.DELIVERED ||
           this.event === constants.COMMUNICATION_EVENTS.READ;
  };

  CommunicationLog.prototype.hasPerformanceIssue = function() {
    return this.processingTimeMs && this.processingTimeMs > 5000; // 5+ seconds
  };

  // Class methods for logging different events
  CommunicationLog.logMessageCreated = async function(messageId, userId = null, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.INFO,
      event: constants.COMMUNICATION_EVENTS.CREATED,
      description: 'Message created and queued for processing',
      userId,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logProviderRequest = async function(messageId, provider, requestData, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.DEBUG,
      event: constants.COMMUNICATION_EVENTS.PROVIDER_REQUEST,
      description: `Request sent to ${provider}`,
      provider,
      requestData,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logProviderResponse = async function(messageId, provider, responseData, httpStatusCode, processingTime, metadata = {}) {
    const isSuccess = httpStatusCode >= 200 && httpStatusCode < 300;
    
    return await this.create({
      messageId,
      logLevel: isSuccess ? constants.LOG_LEVELS.INFO : constants.LOG_LEVELS.ERROR,
      event: isSuccess ? constants.COMMUNICATION_EVENTS.SENT : constants.COMMUNICATION_EVENTS.ERROR,
      description: `Response received from ${provider}`,
      provider,
      responseData,
      httpStatusCode,
      processingTimeMs: processingTime,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logDelivery = async function(messageId, provider, webhookData = null, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.INFO,
      event: constants.COMMUNICATION_EVENTS.DELIVERED,
      description: 'Message delivered successfully',
      provider,
      webhookData,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logRead = async function(messageId, readData = null, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.INFO,
      event: constants.COMMUNICATION_EVENTS.READ,
      description: 'Message read by recipient',
      webhookData: readData,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logError = async function(messageId, errorCode, errorMessage, stackTrace = null, retryAttempt = 0, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.ERROR,
      event: constants.COMMUNICATION_EVENTS.ERROR,
      description: `Message processing failed: ${errorMessage}`,
      errorCode,
      errorMessage,
      stackTrace,
      retryAttempt,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logRetry = async function(messageId, retryAttempt, reason, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.WARNING,
      event: constants.COMMUNICATION_EVENTS.RETRY,
      description: `Message retry attempt ${retryAttempt}: ${reason}`,
      retryAttempt,
      metadata,
      loggedAt: new Date()
    });
  };

  CommunicationLog.logWebhook = async function(messageId, provider, webhookData, webhookSignature = null, metadata = {}) {
    return await this.create({
      messageId,
      logLevel: constants.LOG_LEVELS.DEBUG,
      event: constants.COMMUNICATION_EVENTS.WEBHOOK_RECEIVED,
      description: `Webhook received from ${provider}`,
      provider,
      webhookData,
      webhookSignature,
      metadata,
      loggedAt: new Date()
    });
  };

  // Query methods
  CommunicationLog.findByMessage = async function(messageId, options = {}) {
    return await this.findAll({
      where: { messageId },
      order: [['logged_at', 'ASC']],
      limit: options.limit,
      include: options.include
    });
  };

  CommunicationLog.findErrors = async function(filters = {}) {
    const where = {
      logLevel: constants.LOG_LEVELS.ERROR
    };
    
    if (filters.provider) {
      where.provider = filters.provider;
    }
    
    if (filters.errorCode) {
      where.errorCode = filters.errorCode;
    }
    
    if (filters.startDate && filters.endDate) {
      where.loggedAt = {
        [sequelize.Op.between]: [filters.startDate, filters.endDate]
      };
    }

    return await this.findAll({
      where,
      order: [['logged_at', 'DESC']],
      limit: filters.limit || 100,
      include: ['message']
    });
  };

  CommunicationLog.getPerformanceMetrics = async function(filters = {}) {
    const where = {};
    
    if (filters.provider) {
      where.provider = filters.provider;
    }
    
    if (filters.event) {
      where.event = filters.event;
    }
    
    if (filters.startDate && filters.endDate) {
      where.loggedAt = {
        [sequelize.Op.between]: [filters.startDate, filters.endDate]
      };
    }

    const metrics = await this.findAll({
      where,
      attributes: [
        'provider',
        'event',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('processing_time_ms')), 'avgProcessingTime'],
        [sequelize.fn('MAX', sequelize.col('processing_time_ms')), 'maxProcessingTime'],
        [sequelize.fn('MIN', sequelize.col('processing_time_ms')), 'minProcessingTime']
      ],
      group: ['provider', 'event'],
      raw: true
    });

    return metrics.map(metric => ({
      provider: metric.provider,
      event: metric.event,
      count: parseInt(metric.count),
      avgProcessingTime: parseFloat(metric.avgProcessingTime) || 0,
      maxProcessingTime: parseFloat(metric.maxProcessingTime) || 0,
      minProcessingTime: parseFloat(metric.minProcessingTime) || 0
    }));
  };

  CommunicationLog.getErrorAnalysis = async function(filters = {}) {
    const where = {
      logLevel: constants.LOG_LEVELS.ERROR
    };
    
    if (filters.provider) {
      where.provider = filters.provider;
    }
    
    if (filters.startDate && filters.endDate) {
      where.loggedAt = {
        [sequelize.Op.between]: [filters.startDate, filters.endDate]
      };
    }

    const analysis = await this.findAll({
      where,
      attributes: [
        'provider',
        'error_code',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('MAX', sequelize.col('logged_at')), 'lastOccurrence']
      ],
      group: ['provider', 'error_code'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });

    return analysis.map(item => ({
      provider: item.provider,
      errorCode: item.error_code,
      count: parseInt(item.count),
      lastOccurrence: item.lastOccurrence
    }));
  };

  CommunicationLog.cleanupOldLogs = async function(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const result = await this.destroy({
      where: {
        loggedAt: {
          [sequelize.Op.lt]: cutoffDate
        }
      }
    });
    
    return result;
  };

  return CommunicationLog;
}

// Q19 Compliance: Joi validation schemas
const communicationLogValidationSchemas = {
  create: Joi.object({
    messageId: Joi.number().integer().min(1).required(),
    logLevel: Joi.string().valid(...constants.LOG_LEVELS.ALL_LEVELS).required(),
    event: Joi.string().valid(...constants.COMMUNICATION_EVENTS.ALL_EVENTS).required(),
    description: Joi.string().required(),
    provider: Joi.string().max(50).optional(),
    providerMessageId: Joi.string().max(200).optional(),
    requestData: Joi.object().optional(),
    responseData: Joi.object().optional(),
    httpMethod: Joi.string().max(10).optional(),
    httpStatusCode: Joi.number().integer().min(100).max(599).optional(),
    processingTimeMs: Joi.number().integer().min(0).optional(),
    errorCode: Joi.string().max(50).optional(),
    errorMessage: Joi.string().optional(),
    stackTrace: Joi.string().optional(),
    retryAttempt: Joi.number().integer().min(0).default(0),
    webhookData: Joi.object().optional(),
    webhookSignature: Joi.string().max(500).optional(),
    userId: Joi.number().integer().min(1).optional(),
    serverInstance: Joi.string().max(100).optional(),
    ipAddress: Joi.string().max(45).optional(),
    userAgent: Joi.string().optional(),
    metadata: Joi.object().optional()
  }),

  query: Joi.object({
    messageId: Joi.number().integer().min(1).optional(),
    logLevel: Joi.string().valid(...constants.LOG_LEVELS.ALL_LEVELS).optional(),
    event: Joi.string().valid(...constants.COMMUNICATION_EVENTS.ALL_EVENTS).optional(),
    provider: Joi.string().max(50).optional(),
    errorCode: Joi.string().max(50).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  }),

  performanceQuery: Joi.object({
    provider: Joi.string().max(50).optional(),
    event: Joi.string().valid(...constants.COMMUNICATION_EVENTS.ALL_EVENTS).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }),

  cleanup: Joi.object({
    retentionDays: Joi.number().integer().min(1).max(365).default(90)
  })
};

module.exports = createCommunicationLogModel;
module.exports.validationSchemas = communicationLogValidationSchemas;
