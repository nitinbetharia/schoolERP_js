/**
 * MessageTemplate Model - Tenant Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for tenant entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * MessageTemplate represents reusable message templates for communication
 * - Supports multiple channels (Email, SMS, WhatsApp, Push)
 * - Template variables for dynamic content substitution
 * - Multi-language support for international schools
 * - Version control and approval workflow
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * MessageTemplate Model Definition
 * @param {Sequelize} sequelize - Tenant sequelize instance
 * @returns {Model} MessageTemplate model
 */
function createMessageTemplateModel(sequelize) {
  const MessageTemplate = sequelize.define(
    'MessageTemplate',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Template identification
      templateCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'template_code',
        validate: {
          isAlphanumeric: true,
          isUppercase: true
        }
      },

      templateName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'template_name'
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      // Template category
      category: {
        type: DataTypes.ENUM(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES),
        allowNull: false,
        validate: {
          isIn: [constants.MESSAGE_CATEGORIES.ALL_CATEGORIES]
        }
      },

      // Communication channels
      channels: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'Array of supported channels: EMAIL, SMS, WHATSAPP, PUSH',
        validate: {
          isValidChannels(value) {
            if (!Array.isArray(value)) {
              throw new Error('Channels must be an array');
            }
            const validChannels = constants.COMMUNICATION_CHANNELS.ALL_CHANNELS;
            const invalid = value.filter(channel => !validChannels.includes(channel));
            if (invalid.length > 0) {
              throw new Error(`Invalid channels: ${invalid.join(', ')}`);
            }
          }
        }
      },

      // Template content for different channels
      emailSubject: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'email_subject'
      },

      emailBody: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'email_body'
      },

      smsContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'sms_content',
        validate: {
          len: [1, 160] // SMS character limit
        }
      },

      whatsappContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'whatsapp_content'
      },

      pushTitle: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'push_title'
      },

      pushBody: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'push_body'
      },

      // Template variables
      variables: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Template variables for dynamic substitution',
        defaultValue: []
      },

      // Multi-language support
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'EN'
      },

      // Template metadata
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_system',
        comment: 'System templates cannot be modified'
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },

      // Version control
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },

      parentTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_template_id',
        references: {
          model: 'message_templates',
          key: 'id'
        }
      },

      // Approval workflow
      approvalStatus: {
        type: DataTypes.ENUM(...constants.APPROVAL_STATUS.ALL_STATUS),
        allowNull: false,
        defaultValue: constants.APPROVAL_STATUS.DRAFT,
        field: 'approval_status'
      },

      approvedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at'
      },

      // Creator information
      createdByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by_user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },

      // Additional metadata
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional template configuration'
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
      tableName: 'message_templates',
      timestamps: false, // Custom timestamp handling
      underscored: true,
      
      // Indexes for performance
      indexes: [
        {
          unique: true,
          fields: ['template_code']
        },
        {
          fields: ['category']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['approval_status']
        },
        {
          fields: ['language']
        },
        {
          fields: ['created_by_user_id']
        },
        {
          // Composite index for template lookup
          fields: ['category', 'language', 'is_active']
        }
      ]
    }
  );

  // Q13 Compliance: Define associations
  MessageTemplate.associate = (models) => {
    // MessageTemplate belongs to User (creator)
    if (models.User) {
      MessageTemplate.belongsTo(models.User, {
        foreignKey: 'createdByUserId',
        as: 'createdBy',
        onDelete: 'RESTRICT'
      });

      MessageTemplate.belongsTo(models.User, {
        foreignKey: 'approvedByUserId',
        as: 'approvedBy',
        onDelete: 'SET NULL'
      });
    }

    // Self-referencing association for template versions
    MessageTemplate.belongsTo(MessageTemplate, {
      foreignKey: 'parentTemplateId',
      as: 'parentTemplate',
      onDelete: 'CASCADE'
    });

    MessageTemplate.hasMany(MessageTemplate, {
      foreignKey: 'parentTemplateId',
      as: 'childTemplates',
      onDelete: 'CASCADE'
    });

    // MessageTemplate has many Messages
    if (models.Message) {
      MessageTemplate.hasMany(models.Message, {
        foreignKey: 'templateId',
        as: 'messages',
        onDelete: 'RESTRICT'
      });
    }
  };

  // Instance methods
  MessageTemplate.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    
    // Parse JSON fields if they're strings
    ['channels', 'variables', 'metadata'].forEach(field => {
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

  MessageTemplate.prototype.isApproved = function() {
    return this.approvalStatus === constants.APPROVAL_STATUS.APPROVED;
  };

  MessageTemplate.prototype.canModify = function() {
    return !this.isSystem && this.approvalStatus !== constants.APPROVAL_STATUS.APPROVED;
  };

  MessageTemplate.prototype.supportsChannel = function(channel) {
    return this.channels && this.channels.includes(channel);
  };

  MessageTemplate.prototype.getContentForChannel = function(channel) {
    switch (channel) {
      case constants.COMMUNICATION_CHANNELS.EMAIL:
        return {
          subject: this.emailSubject,
          body: this.emailBody
        };
      case constants.COMMUNICATION_CHANNELS.SMS:
        return {
          content: this.smsContent
        };
      case constants.COMMUNICATION_CHANNELS.WHATSAPP:
        return {
          content: this.whatsappContent
        };
      case constants.COMMUNICATION_CHANNELS.PUSH:
        return {
          title: this.pushTitle,
          body: this.pushBody
        };
      default:
        return null;
    }
  };

  MessageTemplate.prototype.renderTemplate = function(variables = {}) {
    const rendered = {};
    
    if (this.emailSubject) {
      rendered.emailSubject = this.substituteVariables(this.emailSubject, variables);
    }
    if (this.emailBody) {
      rendered.emailBody = this.substituteVariables(this.emailBody, variables);
    }
    if (this.smsContent) {
      rendered.smsContent = this.substituteVariables(this.smsContent, variables);
    }
    if (this.whatsappContent) {
      rendered.whatsappContent = this.substituteVariables(this.whatsappContent, variables);
    }
    if (this.pushTitle) {
      rendered.pushTitle = this.substituteVariables(this.pushTitle, variables);
    }
    if (this.pushBody) {
      rendered.pushBody = this.substituteVariables(this.pushBody, variables);
    }
    
    return rendered;
  };

  MessageTemplate.prototype.substituteVariables = function(content, variables) {
    if (!content || typeof content !== 'string') return content;
    
    let result = content;
    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, variables[key] || '');
    });
    
    return result;
  };

  MessageTemplate.prototype.createVersion = async function(updates = {}) {
    const newVersion = await MessageTemplate.create({
      ...this.toJSON(),
      id: undefined,
      parentTemplateId: this.id,
      version: this.version + 1,
      approvalStatus: constants.APPROVAL_STATUS.DRAFT,
      approvedByUserId: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...updates
    });
    
    return newVersion;
  };

  // Class methods
  MessageTemplate.findByCode = async function(templateCode, options = {}) {
    return await this.findOne({
      where: {
        templateCode,
        isActive: options.includeInactive ? undefined : true,
        approvalStatus: options.includeDrafts ? undefined : constants.APPROVAL_STATUS.APPROVED
      },
      include: options.include
    });
  };

  MessageTemplate.findByCategory = async function(category, language = 'EN', options = {}) {
    return await this.findAll({
      where: {
        category,
        language,
        isActive: true,
        approvalStatus: constants.APPROVAL_STATUS.APPROVED
      },
      order: [['templateName', 'ASC']],
      include: options.include
    });
  };

  MessageTemplate.getSystemTemplates = async function() {
    return await this.findAll({
      where: {
        isSystem: true,
        isActive: true
      },
      order: [['category', 'ASC'], ['templateName', 'ASC']]
    });
  };

  MessageTemplate.searchTemplates = async function(searchTerm, options = {}) {
    const Op = sequelize.Op;
    
    return await this.findAll({
      where: {
        [Op.or]: [
          { templateName: { [Op.like]: `%${searchTerm}%` } },
          { templateCode: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } }
        ],
        isActive: true,
        language: options.language || 'EN'
      },
      order: [['templateName', 'ASC']],
      limit: options.limit || 50
    });
  };

  MessageTemplate.validateTemplate = function(templateData) {
    const errors = [];
    
    // Check if at least one channel content is provided
    const hasEmailContent = templateData.emailSubject || templateData.emailBody;
    const hasSmsContent = templateData.smsContent;
    const hasWhatsappContent = templateData.whatsappContent;
    const hasPushContent = templateData.pushTitle || templateData.pushBody;
    
    if (!hasEmailContent && !hasSmsContent && !hasWhatsappContent && !hasPushContent) {
      errors.push('At least one channel content must be provided');
    }
    
    // Check channel-content alignment
    if (templateData.channels) {
      const channels = Array.isArray(templateData.channels) ? templateData.channels : [];
      
      if (channels.includes(constants.COMMUNICATION_CHANNELS.EMAIL) && !hasEmailContent) {
        errors.push('Email content required when EMAIL channel is selected');
      }
      
      if (channels.includes(constants.COMMUNICATION_CHANNELS.SMS) && !hasSmsContent) {
        errors.push('SMS content required when SMS channel is selected');
      }
      
      if (channels.includes(constants.COMMUNICATION_CHANNELS.WHATSAPP) && !hasWhatsappContent) {
        errors.push('WhatsApp content required when WHATSAPP channel is selected');
      }
      
      if (channels.includes(constants.COMMUNICATION_CHANNELS.PUSH) && !hasPushContent) {
        errors.push('Push content required when PUSH channel is selected');
      }
    }
    
    return errors;
  };

  return MessageTemplate;
}

// Q19 Compliance: Joi validation schemas
const messageTemplateValidationSchemas = {
  create: Joi.object({
    templateCode: Joi.string().alphanum().uppercase().max(100).required(),
    templateName: Joi.string().max(200).required(),
    description: Joi.string().optional(),
    category: Joi.string().valid(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES).required(),
    channels: Joi.array()
      .items(Joi.string().valid(...constants.COMMUNICATION_CHANNELS.ALL_CHANNELS))
      .min(1)
      .required(),
    emailSubject: Joi.string().max(200).optional(),
    emailBody: Joi.string().optional(),
    smsContent: Joi.string().max(160).optional(),
    whatsappContent: Joi.string().optional(),
    pushTitle: Joi.string().max(100).optional(),
    pushBody: Joi.string().optional(),
    variables: Joi.array().items(Joi.string()).optional(),
    language: Joi.string().max(10).default('EN'),
    isActive: Joi.boolean().default(true),
    createdByUserId: Joi.number().integer().min(1).required(),
    metadata: Joi.object().optional()
  }),

  update: Joi.object({
    templateName: Joi.string().max(200).optional(),
    description: Joi.string().optional(),
    category: Joi.string().valid(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES).optional(),
    channels: Joi.array()
      .items(Joi.string().valid(...constants.COMMUNICATION_CHANNELS.ALL_CHANNELS))
      .min(1)
      .optional(),
    emailSubject: Joi.string().max(200).optional(),
    emailBody: Joi.string().optional(),
    smsContent: Joi.string().max(160).optional(),
    whatsappContent: Joi.string().optional(),
    pushTitle: Joi.string().max(100).optional(),
    pushBody: Joi.string().optional(),
    variables: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional(),
    metadata: Joi.object().optional()
  }),

  approve: Joi.object({
    approvalStatus: Joi.string()
      .valid(...constants.APPROVAL_STATUS.ALL_STATUS)
      .required(),
    approvedByUserId: Joi.number().integer().min(1).when('approvalStatus', {
      is: constants.APPROVAL_STATUS.APPROVED,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  search: Joi.object({
    searchTerm: Joi.string().min(2).required(),
    category: Joi.string().valid(...constants.MESSAGE_CATEGORIES.ALL_CATEGORIES).optional(),
    language: Joi.string().max(10).default('EN'),
    limit: Joi.number().integer().min(1).max(100).default(50)
  })
};

module.exports = createMessageTemplateModel;
module.exports.validationSchemas = messageTemplateValidationSchemas;
