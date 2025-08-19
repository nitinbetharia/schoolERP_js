/**
 * Message Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * Message represents individual communications sent to recipients
 * - Tracks message delivery across multiple channels
 * - Supports bulk messaging operations
 * - Delivery status tracking and retry logic
 * - Failed message analysis and reporting
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * Message Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} Message model
 */
function createMessageModel(sequelize) {
  const Message = sequelize.define(
    'Message',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Message identification
      messageId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'message_id',
        comment: 'Unique identifier for tracking'
      },

      // Template reference (optional)
      templateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'template_id',
        references: {
          model: 'message_templates',
          key: 'id'
        }
      },

      // Message content
      channel: {
        type: DataTypes.ENUM(...constants.COMMUNICATION_CHANNELS.ALL_CHANNELS),
        allowNull: false,
        validate: {
          isIn: [constants.COMMUNICATION_CHANNELS.ALL_CHANNELS]
        }
      },

      subject: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'Subject for email/push notifications'
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Main message content'
      },

      // Recipient information
      recipientType: {
        type: DataTypes.ENUM(...constants.RECIPIENT_TYPES.ALL_TYPES),
        allowNull: false,
        field: 'recipient_type',
        validate: {
          isIn: [constants.RECIPIENT_TYPES.ALL_TYPES]
        }
      },

      recipientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'recipient_id',
        comment: 'ID of the recipient (User/Student/Parent)'
      },

      recipientContact: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'recipient_contact',
        comment: 'Email/Phone number for delivery'
      },

      recipientName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'recipient_name'
      },

      // Message categorization
      category: {
        type: DataTypes.ENUM(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES),
        allowNull: false,
        validate: {
          isIn: [constants.MESSAGE_CATEGORIES.ALL_CATEGORIES]
        }
      },

      priority: {
        type: DataTypes.ENUM(...constants.MESSAGE_PRIORITY.ALL_PRIORITIES),
        allowNull: false,
        defaultValue: constants.MESSAGE_PRIORITY.MEDIUM,
        validate: {
          isIn: [constants.MESSAGE_PRIORITY.ALL_PRIORITIES]
        }
      },

      // Delivery tracking
      status: {
        type: DataTypes.ENUM(...constants.MESSAGE_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.MESSAGE_STATUS.PENDING,
        validate: {
          isIn: [constants.MESSAGE_STATUS.ALL_STATUS]
        }
      },

      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'scheduled_at',
        comment: 'When the message should be sent'
      },

      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'sent_at'
      },

      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'delivered_at'
      },

      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'read_at'
      },

      // Retry mechanism
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'retry_count'
      },

      maxRetries: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        field: 'max_retries'
      },

      nextRetryAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'next_retry_at'
      },

      // Error tracking
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message'
      },

      errorCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'error_code'
      },

      // External provider tracking
      providerMessageId: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'provider_message_id',
        comment: 'Message ID from external provider (SendGrid, Twilio, etc.)'
      },

      providerResponse: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'provider_response',
        comment: 'Full response from external provider'
      },

      // Cost tracking
      estimatedCost: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        field: 'estimated_cost',
        comment: 'Estimated cost for sending (SMS/WhatsApp)'
      },

      actualCost: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        field: 'actual_cost',
        comment: 'Actual cost charged by provider'
      },

      // Sender information
      sentByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sent_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      // Campaign reference
      campaignId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'campaign_id',
        comment: 'Reference for bulk message campaigns'
      },

      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional message context and variables'
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
      tableName: 'messages',
      timestamps: false, // Custom timestamp handling
      underscored: true,
      
      // Indexes for performance
      indexes: [
        {
          unique: true,
          fields: ['message_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['channel']
        },
        {
          fields: ['category']
        },
        {
          fields: ['recipient_type', 'recipient_id']
        },
        {
          fields: ['campaign_id']
        },
        {
          fields: ['sent_by_user_id']
        },
        {
          fields: ['scheduled_at']
        },
        {
          fields: ['next_retry_at']
        },
        {
          // Composite index for delivery tracking
          fields: ['status', 'channel', 'created_at']
        },
        {
          // Composite index for retry processing
          fields: ['status', 'next_retry_at']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  Message.associate = (models) => {
    // Message belongs to MessageTemplate (optional)
    if (models.MessageTemplate) {
      Message.belongsTo(models.MessageTemplate, {
        foreignKey: 'templateId',
        as: 'template',
        onDelete: 'SET NULL'
      });
    }

    // Message belongs to User (sender)
    if (models.User) {
      Message.belongsTo(models.User, {
        foreignKey: 'sentByUserId',
        as: 'sentBy',
        onDelete: 'RESTRICT'
      });
    }

    // Message has many CommunicationLogs
    if (models.CommunicationLog) {
      Message.hasMany(models.CommunicationLog, {
        foreignKey: 'messageId',
        as: 'logs',
        onDelete: 'CASCADE'
      });
    }
  };

  // Instance methods
  Message.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Parse JSON fields if they're strings
    ['providerResponse', 'metadata'].forEach(field => {
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

  Message.prototype.isPending = function() {
    return this.status === constants.MESSAGE_STATUS.PENDING;
  };

  Message.prototype.isSent = function() {
    return [
      constants.MESSAGE_STATUS.SENT,
      constants.MESSAGE_STATUS.DELIVERED,
      constants.MESSAGE_STATUS.READ
    ].includes(this.status);
  };

  Message.prototype.isFailed = function() {
    return this.status === constants.MESSAGE_STATUS.FAILED;
  };

  Message.prototype.canRetry = function() {
    return this.isFailed() && this.retryCount < this.maxRetries;
  };

  Message.prototype.isScheduled = function() {
    return this.scheduledAt && this.scheduledAt > new Date();
  };

  Message.prototype.isReadyToSend = function() {
    if (this.isScheduled()) {
      return this.scheduledAt <= new Date();
    }
    return this.isPending();
  };

  Message.prototype.markAsSent = async function(providerMessageId = null, providerResponse = null) {
    return await this.update({
      status: constants.MESSAGE_STATUS.SENT,
      sentAt: new Date(),
      providerMessageId,
      providerResponse,
      updatedAt: new Date()
    });
  };

  Message.prototype.markAsDelivered = async function(deliveredAt = null) {
    return await this.update({
      status: constants.MESSAGE_STATUS.DELIVERED,
      deliveredAt: deliveredAt || new Date(),
      updatedAt: new Date()
    });
  };

  Message.prototype.markAsRead = async function(readAt = null) {
    return await this.update({
      status: constants.MESSAGE_STATUS.READ,
      readAt: readAt || new Date(),
      updatedAt: new Date()
    });
  };

  Message.prototype.markAsFailed = async function(errorMessage, errorCode = null, providerResponse = null) {
    const updateData = {
      status: constants.MESSAGE_STATUS.FAILED,
      errorMessage,
      errorCode,
      updatedAt: new Date()
    };

    if (providerResponse) {
      updateData.providerResponse = providerResponse;
    }

    // Schedule retry if possible
    if (this.canRetry()) {
      const retryDelayMinutes = Math.pow(2, this.retryCount) * 5; // Exponential backoff
      updateData.nextRetryAt = new Date(Date.now() + retryDelayMinutes * 60 * 1000);
    }

    return await this.update(updateData);
  };

  Message.prototype.incrementRetry = async function() {
    return await this.update({
      retryCount: this.retryCount + 1,
      status: constants.MESSAGE_STATUS.PENDING,
      nextRetryAt: null,
      updatedAt: new Date()
    });
  };

  Message.prototype.calculateEstimatedCost = function() {
    // Simple cost estimation logic
    const costs = {
      [constants.COMMUNICATION_CHANNELS.EMAIL]: 0.001,
      [constants.COMMUNICATION_CHANNELS.SMS]: 0.05,
      [constants.COMMUNICATION_CHANNELS.WHATSAPP]: 0.02,
      [constants.COMMUNICATION_CHANNELS.PUSH]: 0.0
    };

    return costs[this.channel] || 0;
  };

  // Class methods for bulk operations
  Message.createBulkMessages = async function(messageData, sentByUserId, campaignId = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const messages = [];
      
      for (const data of messageData) {
        const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const message = await this.create({
          messageId,
          sentByUserId,
          campaignId,
          estimatedCost: Message.prototype.calculateEstimatedCost.call({ channel: data.channel }),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        }, { transaction });
        
        messages.push(message);
      }
      
      await transaction.commit();
      return messages;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  Message.findPendingMessages = async function(limit = 100) {
    const Op = sequelize.Op;
    
    return await this.findAll({
      where: {
        [Op.or]: [
          { status: constants.MESSAGE_STATUS.PENDING },
          {
            status: constants.MESSAGE_STATUS.FAILED,
            nextRetryAt: {
              [Op.lte]: new Date()
            }
          }
        ]
      },
      order: [
        ['priority', 'DESC'],
        ['scheduled_at', 'ASC'],
        ['created_at', 'ASC']
      ],
      limit,
      include: ['template', 'sentBy']
    });
  };

  Message.findByRecipient = async function(recipientType, recipientId, options = {}) {
    const where = {
      recipientType,
      recipientId
    };
    
    if (options.category) {
      where.category = options.category;
    }
    
    if (options.channel) {
      where.channel = options.channel;
    }
    
    if (options.status) {
      where.status = options.status;
    }

    return await this.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: options.limit || 100,
      include: options.include || ['template', 'sentBy']
    });
  };

  Message.findByCampaign = async function(campaignId, options = {}) {
    return await this.findAll({
      where: { campaignId },
      order: [['created_at', 'DESC']],
      include: options.include || ['template', 'sentBy']
    });
  };

  Message.getDeliveryStats = async function(filters = {}) {
    const where = {};
    
    if (filters.channel) {
      where.channel = filters.channel;
    }
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
    }
    
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [sequelize.Op.between]: [filters.startDate, filters.endDate]
      };
    }

    const stats = await this.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('actual_cost')), 'totalCost']
      ],
      group: ['status'],
      raw: true
    });

    const result = {
      total: 0,
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      totalCost: 0
    };

    stats.forEach(stat => {
      result.total += parseInt(stat.count);
      result[stat.status.toLowerCase()] = parseInt(stat.count);
      result.totalCost += parseFloat(stat.totalCost || 0);
    });

    result.successRate = result.total > 0 
      ? ((result.sent + result.delivered + result.read) / result.total * 100).toFixed(2)
      : 0;

    return result;
  };

  return Message;
}

// Q19 Compliance: Joi validation schemas
const messageValidationSchemas = {
  create: Joi.object({
    templateId: Joi.number().integer().min(1).optional(),
    channel: Joi.string().valid(...constants.COMMUNICATION_CHANNELS.ALL_CHANNELS).required(),
    subject: Joi.string().max(200).optional(),
    content: Joi.string().required(),
    recipientType: Joi.string().valid(...constants.RECIPIENT_TYPES.ALL_TYPES).required(),
    recipientId: Joi.number().integer().min(1).required(),
    recipientContact: Joi.string().max(100).required(),
    recipientName: Joi.string().max(200).required(),
    category: Joi.string().valid(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES).required(),
    priority: Joi.string().valid(...constants.MESSAGE_PRIORITY.ALL_PRIORITIES).default(constants.MESSAGE_PRIORITY.MEDIUM),
    scheduledAt: Joi.date().optional(),
    maxRetries: Joi.number().integer().min(0).max(10).default(3),
    sentByUserId: Joi.number().integer().min(1).required(),
    campaignId: Joi.string().max(100).optional(),
    metadata: Joi.object().optional()
  }),

  bulkCreate: Joi.object({
    messages: Joi.array().items(
      Joi.object({
        templateId: Joi.number().integer().min(1).optional(),
        channel: Joi.string().valid(...constants.COMMUNICATION_CHANNELS.ALL_CHANNELS).required(),
        subject: Joi.string().max(200).optional(),
        content: Joi.string().required(),
        recipientType: Joi.string().valid(...constants.RECIPIENT_TYPES.ALL_TYPES).required(),
        recipientId: Joi.number().integer().min(1).required(),
        recipientContact: Joi.string().max(100).required(),
        recipientName: Joi.string().max(200).required(),
        category: Joi.string().valid(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES).required(),
        priority: Joi.string().valid(...constants.MESSAGE_PRIORITY.ALL_PRIORITIES).default(constants.MESSAGE_PRIORITY.MEDIUM),
        scheduledAt: Joi.date().optional(),
        metadata: Joi.object().optional()
      })
    ).required().min(1),
    sentByUserId: Joi.number().integer().min(1).required(),
    campaignId: Joi.string().max(100).optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(...constants.MESSAGE_STATUS.ALL_STATUS).required(),
    providerMessageId: Joi.string().max(200).optional(),
    providerResponse: Joi.object().optional(),
    errorMessage: Joi.string().optional(),
    errorCode: Joi.string().max(50).optional(),
    actualCost: Joi.number().precision(4).optional(),
    deliveredAt: Joi.date().optional(),
    readAt: Joi.date().optional()
  }),

  query: Joi.object({
    recipientType: Joi.string().valid(...constants.RECIPIENT_TYPES.ALL_TYPES).optional(),
    recipientId: Joi.number().integer().min(1).optional(),
    channel: Joi.string().valid(...constants.COMMUNICATION_CHANNELS.ALL_CHANNELS).optional(),
    category: Joi.string().valid(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES).optional(),
    status: Joi.string().valid(...constants.MESSAGE_STATUS.ALL_STATUS).optional(),
    campaignId: Joi.string().max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100)
  })
};

module.exports = createMessageModel;
module.exports.validationSchemas = messageValidationSchemas;
