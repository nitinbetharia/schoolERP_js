const db = require('../data/database-service');
const crypto = require('crypto');
const logger = require('../../config/logger');

// Email Providers
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// SMS Providers
const twilio = require('twilio');

class CommunicationService {
  constructor() {
    this.providers = {
      sms: null, // Will be configured per tenant
      email: null, // Will be configured per tenant
      push: null // Will be configured per tenant
    };
    this.providerInstances = new Map();
  }

  // Provider Configuration Management
  async setupEmailProvider(config, trustCode) {
    try {
      const encryptedConfig = this.encryptSensitiveData(config);

      const sql = `
        INSERT INTO trust_config (config_key, config_value, created_at, updated_at)
        VALUES ('email_provider_config', ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        config_value = VALUES(config_value),
        updated_at = NOW()
      `;

      await db.queryTrust(trustCode, sql, [JSON.stringify(encryptedConfig)]);

      // Initialize the provider instance
      await this.initializeEmailProvider(trustCode);

      logger.info('Email provider configured successfully', {
        trustCode,
        provider: config.provider
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to setup email provider:', error);
      throw new Error(`Failed to setup email provider: ${error.message}`);
    }
  }

  async setupSMSProvider(config, trustCode) {
    try {
      const encryptedConfig = this.encryptSensitiveData(config);

      const sql = `
        INSERT INTO trust_config (config_key, config_value, created_at, updated_at)
        VALUES ('sms_provider_config', ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        config_value = VALUES(config_value),
        updated_at = NOW()
      `;

      await db.queryTrust(trustCode, sql, [JSON.stringify(encryptedConfig)]);

      // Initialize the provider instance
      await this.initializeSMSProvider(trustCode);

      logger.info('SMS provider configured successfully', { trustCode, provider: config.provider });
      return { success: true };
    } catch (error) {
      logger.error('Failed to setup SMS provider:', error);
      throw new Error(`Failed to setup SMS provider: ${error.message}`);
    }
  }

  async initializeEmailProvider(trustCode) {
    try {
      const sql = `SELECT config_value FROM trust_config WHERE config_key = 'email_provider_config'`;
      const result = await db.queryTrust(trustCode, sql);

      if (result.length === 0) {
        throw new Error('Email provider not configured');
      }

      const config = this.decryptSensitiveData(JSON.parse(result[0].config_value));
      let providerInstance = null;

      switch (config.provider) {
        case 'SMTP':
          providerInstance = nodemailer.createTransporter({
            host: config.smtp_host,
            port: config.smtp_port,
            secure: config.smtp_secure,
            auth: {
              user: config.smtp_username,
              pass: config.smtp_password
            }
          });
          break;

        case 'SENDGRID':
          sgMail.setApiKey(config.sendgrid_api_key);
          providerInstance = sgMail;
          break;

        case 'GMAIL':
          providerInstance = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: config.gmail_username,
              pass: config.gmail_app_password
            }
          });
          break;

        default:
          throw new Error(`Unsupported email provider: ${config.provider}`);
      }

      this.providerInstances.set(`${trustCode}_email`, {
        instance: providerInstance,
        config: config,
        type: 'email'
      });

      return providerInstance;
    } catch (error) {
      logger.error('Failed to initialize email provider:', error);
      throw error;
    }
  }

  async initializeSMSProvider(trustCode) {
    try {
      const sql = `SELECT config_value FROM trust_config WHERE config_key = 'sms_provider_config'`;
      const result = await db.queryTrust(trustCode, sql);

      if (result.length === 0) {
        throw new Error('SMS provider not configured');
      }

      const config = this.decryptSensitiveData(JSON.parse(result[0].config_value));
      let providerInstance = null;

      switch (config.provider) {
        case 'TWILIO':
          providerInstance = twilio(config.twilio_account_sid, config.twilio_auth_token);
          break;

        case 'TEXTLOCAL':
          providerInstance = {
            apiKey: config.textlocal_api_key,
            username: config.textlocal_username,
            baseUrl: 'https://api.textlocal.in/send/'
          };
          break;

        case 'MSG91':
          providerInstance = {
            authKey: config.msg91_auth_key,
            baseUrl: 'https://api.msg91.com/api/sendhttp.php'
          };
          break;

        case 'FAST2SMS':
          providerInstance = {
            apiKey: config.fast2sms_api_key,
            baseUrl: 'https://www.fast2sms.com/dev/bulkV2'
          };
          break;

        default:
          throw new Error(`Unsupported SMS provider: ${config.provider}`);
      }

      this.providerInstances.set(`${trustCode}_sms`, {
        instance: providerInstance,
        config: config,
        type: 'sms'
      });

      return providerInstance;
    } catch (error) {
      logger.error('Failed to initialize SMS provider:', error);
      throw error;
    }
  }

  // Email Sending Methods
  async sendEmail(emailData, trustCode) {
    try {
      const provider = this.providerInstances.get(`${trustCode}_email`);
      if (!provider) {
        await this.initializeEmailProvider(trustCode);
      }

      const providerData = this.providerInstances.get(`${trustCode}_email`);
      if (!providerData) {
        throw new Error('Email provider not configured');
      }

      let result;
      const config = providerData.config;

      switch (config.provider) {
        case 'SMTP':
        case 'GMAIL':
          result = await this.sendEmailSMTP(providerData.instance, emailData, config);
          break;

        case 'SENDGRID':
          result = await this.sendEmailSendGrid(providerData.instance, emailData, config);
          break;

        default:
          throw new Error(`Unsupported email provider: ${config.provider}`);
      }

      // Log the email sending
      await this.logCommunication({
        type: 'EMAIL',
        provider: config.provider,
        recipient: emailData.to,
        subject: emailData.subject,
        status: 'SENT',
        message_id: result.messageId,
        trustCode
      });

      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);

      // Log the failed attempt
      await this.logCommunication({
        type: 'EMAIL',
        recipient: emailData.to,
        subject: emailData.subject,
        status: 'FAILED',
        error_message: error.message,
        trustCode
      });

      throw error;
    }
  }

  async sendEmailSMTP(transporter, emailData, config) {
    const mailOptions = {
      from: `${config.from_name} <${config.from_email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments
    };

    return await transporter.sendMail(mailOptions);
  }

  async sendEmailSendGrid(sgMail, emailData, config) {
    const msg = {
      to: emailData.to,
      from: {
        email: config.from_email,
        name: config.from_name
      },
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    return await sgMail.send(msg);
  }

  // SMS Sending Methods
  async sendSMS(smsData, trustCode) {
    try {
      const provider = this.providerInstances.get(`${trustCode}_sms`);
      if (!provider) {
        await this.initializeSMSProvider(trustCode);
      }

      const providerData = this.providerInstances.get(`${trustCode}_sms`);
      if (!providerData) {
        throw new Error('SMS provider not configured');
      }

      let result;
      const config = providerData.config;

      switch (config.provider) {
        case 'TWILIO':
          result = await this.sendSMSTwilio(providerData.instance, smsData, config);
          break;

        case 'TEXTLOCAL':
          result = await this.sendSMSTextLocal(providerData.instance, smsData);
          break;

        case 'MSG91':
          result = await this.sendSMSMsg91(providerData.instance, smsData);
          break;

        case 'FAST2SMS':
          result = await this.sendSMSFast2SMS(providerData.instance, smsData);
          break;

        default:
          throw new Error(`Unsupported SMS provider: ${config.provider}`);
      }

      // Log the SMS sending
      await this.logCommunication({
        type: 'SMS',
        provider: config.provider,
        recipient: smsData.to,
        message: smsData.message,
        status: 'SENT',
        message_id: result.sid || result.id,
        trustCode
      });

      return result;
    } catch (error) {
      logger.error('Failed to send SMS:', error);

      // Log the failed attempt
      await this.logCommunication({
        type: 'SMS',
        recipient: smsData.to,
        message: smsData.message,
        status: 'FAILED',
        error_message: error.message,
        trustCode
      });

      throw error;
    }
  }

  async sendSMSTwilio(client, smsData, config) {
    return await client.messages.create({
      body: smsData.message,
      from: config.twilio_phone_number,
      to: smsData.to
    });
  }

  async sendSMSTextLocal(provider, smsData) {
    const axios = require('axios');
    const response = await axios.post(provider.baseUrl, {
      apikey: provider.apiKey,
      username: provider.username,
      message: smsData.message,
      numbers: smsData.to,
      sender: 'SCHOOL'
    });

    return response.data;
  }

  async sendSMSMsg91(provider, smsData) {
    const axios = require('axios');
    const response = await axios.get(provider.baseUrl, {
      params: {
        authkey: provider.authKey,
        mobiles: smsData.to,
        message: smsData.message,
        sender: 'SCHOOL',
        route: 4
      }
    });

    return response.data;
  }

  async sendSMSFast2SMS(provider, smsData) {
    const axios = require('axios');
    const response = await axios.post(provider.baseUrl, {
      authorization: provider.apiKey,
      message: smsData.message,
      numbers: smsData.to,
      sender_id: 'SCHOOL'
    });

    return response.data;
  }

  // Communication Logging
  async logCommunication(logData) {
    try {
      const sql = `
        INSERT INTO communication_logs (
          type, provider, recipient, subject, message, status, 
          message_id, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await db.queryTrust(logData.trustCode, sql, [
        logData.type,
        logData.provider || null,
        logData.recipient,
        logData.subject || null,
        logData.message || null,
        logData.status,
        logData.message_id || null,
        logData.error_message || null
      ]);
    } catch (error) {
      logger.error('Failed to log communication:', error);
    }
  }

  // Utility Methods
  encryptSensitiveData(data) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const iv = crypto.randomBytes(16);

    const encryptedData = { ...data };
    const sensitiveFields = ['password', 'api_key', 'auth_token', 'secret_key', 'app_password'];

    for (const field of sensitiveFields) {
      if (data[field]) {
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(data[field], 'utf8', 'hex');
        encrypted += cipher.final('hex');
        encryptedData[field] = encrypted;
      }
    }

    return encryptedData;
  }

  decryptSensitiveData(data) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

    const decryptedData = { ...data };
    const sensitiveFields = ['password', 'api_key', 'auth_token', 'secret_key', 'app_password'];

    for (const field of sensitiveFields) {
      if (data[field]) {
        try {
          const decipher = crypto.createDecipher(algorithm, key);
          let decrypted = decipher.update(data[field], 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          decryptedData[field] = decrypted;
        } catch (error) {
          logger.warn(`Failed to decrypt field ${field}:`, error);
        }
      }
    }

    return decryptedData;
  }

  // Template Management
  async createTemplate(templateData, trustCode) {
    try {
      const sql = `
        INSERT INTO communication_templates (
          template_name, template_type, subject, content, variables, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const result = await db.queryTrust(trustCode, sql, [
        templateData.template_name,
        templateData.template_type,
        templateData.subject || null,
        templateData.content,
        JSON.stringify(templateData.variables || []),
        templateData.created_by
      ]);

      return { templateId: result.insertId };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Template with this name and type already exists');
      }
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  async updateTemplate(templateId, templateData, trustCode) {
    try {
      const updateFields = [];
      const params = [];

      const allowedFields = ['subject', 'content', 'variables', 'status'];

      for (const field of allowedFields) {
        if (templateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          if (field === 'variables') {
            params.push(JSON.stringify(templateData[field]));
          } else {
            params.push(templateData[field]);
          }
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(templateId);

      const sql = `
        UPDATE communication_templates 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `;

      const result = await db.queryTrust(trustCode, sql, params);

      if (result.affectedRows === 0) {
        throw new Error('Template not found');
      }

      return { templateId, updated: true };
    } catch (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
  }

  async getTemplates(filters, trustCode) {
    let sql = `
      SELECT 
        ct.id,
        ct.template_name,
        ct.template_type,
        ct.subject,
        ct.content,
        ct.variables,
        ct.status,
        ct.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM communication_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.template_type) {
      sql += ' AND ct.template_type = ?';
      params.push(filters.template_type);
    }

    if (filters.status) {
      sql += ' AND ct.status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      sql += ' AND (ct.template_name LIKE ? OR ct.content LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY ct.created_at DESC';

    return await db.queryTrust(trustCode, sql, params);
  }

  // Message Sending
  async sendMessage(messageData, trustCode) {
    try {
      return await db.transactionTrust(trustCode, async connection => {
        const messageId = await this.createMessageRecord(messageData, connection);

        // Process based on message type
        switch (messageData.message_type) {
          case 'SMS':
            await this.processSMSMessage(messageId, messageData, trustCode);
            break;
          case 'EMAIL':
            await this.processEmailMessage(messageId, messageData, trustCode);
            break;
          case 'NOTIFICATION':
            await this.processNotificationMessage(messageId, messageData, trustCode);
            break;
          case 'ANNOUNCEMENT':
            await this.processAnnouncementMessage(messageId, messageData, trustCode);
            break;
          default:
            throw new Error(`Unsupported message type: ${messageData.message_type}`);
        }

        return { messageId };
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async createMessageRecord(messageData, connection) {
    const sql = `
      INSERT INTO communication_messages (
        template_id, message_type, recipient_type, recipient_id,
        recipient_email, recipient_phone, subject, content, priority,
        scheduled_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(sql, [
      messageData.template_id || null,
      messageData.message_type,
      messageData.recipient_type,
      messageData.recipient_id || null,
      messageData.recipient_email || null,
      messageData.recipient_phone || null,
      messageData.subject || null,
      messageData.content,
      messageData.priority || 'NORMAL',
      messageData.scheduled_at || null,
      messageData.created_by
    ]);

    return result.insertId;
  }

  async processSMSMessage(messageId, messageData, trustCode) {
    try {
      // In a real implementation, integrate with SMS provider (Twilio, AWS SNS)
      console.log(`Sending SMS message ${messageId} to ${messageData.recipient_phone}`);

      // Simulate SMS sending
      const success = true; // Replace with actual SMS API call

      if (success) {
        await this.updateMessageStatus(messageId, 'SENT', trustCode);
      } else {
        await this.updateMessageStatus(messageId, 'FAILED', trustCode, 'SMS delivery failed');
      }
    } catch (error) {
      await this.updateMessageStatus(messageId, 'FAILED', trustCode, error.message);
    }
  }

  async processEmailMessage(messageId, messageData, trustCode) {
    try {
      // In a real implementation, integrate with email provider (SendGrid, AWS SES)
      console.log(`Sending email message ${messageId} to ${messageData.recipient_email}`);

      // Simulate email sending
      const success = true; // Replace with actual email API call

      if (success) {
        await this.updateMessageStatus(messageId, 'SENT', trustCode);
      } else {
        await this.updateMessageStatus(messageId, 'FAILED', trustCode, 'Email delivery failed');
      }
    } catch (error) {
      await this.updateMessageStatus(messageId, 'FAILED', trustCode, error.message);
    }
  }

  async processNotificationMessage(messageId, messageData, trustCode) {
    try {
      // Store in-app notification
      const notificationSql = `
        INSERT INTO trust_config (config_key, config_value, data_type)
        VALUES (?, ?, 'JSON')
      `;

      const notificationKey = `notification_${messageData.recipient_id}_${messageId}`;
      const notificationData = {
        messageId,
        title: messageData.subject || 'Notification',
        content: messageData.content,
        priority: messageData.priority,
        read: false,
        createdAt: new Date().toISOString()
      };

      await db.queryTrust(trustCode, notificationSql, [
        notificationKey,
        JSON.stringify(notificationData)
      ]);

      await this.updateMessageStatus(messageId, 'DELIVERED', trustCode);
    } catch (error) {
      await this.updateMessageStatus(messageId, 'FAILED', trustCode, error.message);
    }
  }

  async processAnnouncementMessage(messageId, messageData, trustCode) {
    try {
      // Store announcement for all targeted recipients
      const announcementSql = `
        INSERT INTO trust_config (config_key, config_value, data_type)
        VALUES ('announcement_' || ?, ?, 'JSON')
      `;

      const announcementData = {
        messageId,
        title: messageData.subject || 'Announcement',
        content: messageData.content,
        priority: messageData.priority,
        targetAudience: messageData.recipient_type,
        createdBy: messageData.created_by,
        createdAt: new Date().toISOString(),
        expiresAt: messageData.expires_at || null
      };

      await db.queryTrust(trustCode, announcementSql, [
        messageId,
        JSON.stringify(announcementData)
      ]);

      await this.updateMessageStatus(messageId, 'DELIVERED', trustCode);
    } catch (error) {
      await this.updateMessageStatus(messageId, 'FAILED', trustCode, error.message);
    }
  }

  async updateMessageStatus(messageId, status, trustCode, errorMessage = null) {
    const sql = `
      UPDATE communication_messages 
      SET status = ?, error_message = ?, 
          ${status === 'SENT' ? 'sent_at = NOW(),' : ''}
          ${status === 'DELIVERED' ? 'delivered_at = NOW(),' : ''}
          updated_at = NOW()
      WHERE id = ?
    `;

    await db.queryTrust(trustCode, sql, [status, errorMessage, messageId]);
  }

  // Bulk messaging
  async sendBulkMessage(bulkData, trustCode) {
    try {
      const results = [];

      for (const recipient of bulkData.recipients) {
        const messageData = {
          ...bulkData,
          recipient_type: recipient.type,
          recipient_id: recipient.id,
          recipient_email: recipient.email,
          recipient_phone: recipient.phone,
          content: this.processTemplate(bulkData.content, recipient.variables || {})
        };

        try {
          const result = await this.sendMessage(messageData, trustCode);
          results.push({
            recipientId: recipient.id,
            messageId: result.messageId,
            status: 'QUEUED'
          });
        } catch (error) {
          results.push({
            recipientId: recipient.id,
            status: 'FAILED',
            error: error.message
          });
        }
      }

      return { results, totalSent: results.length };
    } catch (error) {
      throw new Error(`Failed to send bulk message: ${error.message}`);
    }
  }

  // Get recipients based on criteria
  async getRecipients(criteria, trustCode) {
    try {
      let recipients = [];

      switch (criteria.type) {
        case 'ALL_PARENTS':
          recipients = await this.getAllParents(criteria, trustCode);
          break;
        case 'CLASS_PARENTS':
          recipients = await this.getClassParents(criteria, trustCode);
          break;
        case 'ALL_TEACHERS':
          recipients = await this.getAllTeachers(criteria, trustCode);
          break;
        case 'SCHOOL_STAFF':
          recipients = await this.getSchoolStaff(criteria, trustCode);
          break;
        case 'SPECIFIC_USERS':
          recipients = await this.getSpecificUsers(criteria, trustCode);
          break;
        default:
          throw new Error(`Unsupported recipient criteria: ${criteria.type}`);
      }

      return recipients;
    } catch (error) {
      throw new Error(`Failed to get recipients: ${error.message}`);
    }
  }

  async getAllParents(criteria, trustCode) {
    let sql = `
      SELECT DISTINCT
        u.id,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        'PARENT' as type
      FROM users u
      JOIN student_parents sp ON u.id = sp.parent_id
      JOIN students s ON sp.student_id = s.id
      WHERE u.role = 'PARENT' AND u.status = 'ACTIVE' AND s.status = 'ACTIVE'
    `;

    const params = [];

    if (criteria.school_id) {
      sql += ' AND s.school_id = ?';
      params.push(criteria.school_id);
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async getClassParents(criteria, trustCode) {
    let sql = `
      SELECT DISTINCT
        u.id,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        'PARENT' as type,
        CONCAT(s.first_name, ' ', s.last_name) as student_name
      FROM users u
      JOIN student_parents sp ON u.id = sp.parent_id
      JOIN students s ON sp.student_id = s.id
      WHERE u.role = 'PARENT' AND u.status = 'ACTIVE' AND s.status = 'ACTIVE'
    `;

    const params = [];

    if (criteria.class_id) {
      sql += ' AND s.class_id = ?';
      params.push(criteria.class_id);
    }

    if (criteria.section_id) {
      sql += ' AND s.section_id = ?';
      params.push(criteria.section_id);
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async getAllTeachers(criteria, trustCode) {
    let sql = `
      SELECT 
        u.id,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        'TEACHER' as type,
        u.department
      FROM users u
      WHERE u.role = 'TEACHER' AND u.status = 'ACTIVE'
    `;

    const params = [];

    if (criteria.school_id) {
      sql += ' AND u.school_id = ?';
      params.push(criteria.school_id);
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async getSchoolStaff(criteria, trustCode) {
    let sql = `
      SELECT 
        u.id,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.role as type,
        u.department,
        u.designation
      FROM users u
      WHERE u.role IN ('SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT') 
        AND u.status = 'ACTIVE'
    `;

    const params = [];

    if (criteria.school_id) {
      sql += ' AND u.school_id = ?';
      params.push(criteria.school_id);
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async getSpecificUsers(criteria, trustCode) {
    if (!criteria.user_ids || criteria.user_ids.length === 0) {
      return [];
    }

    const placeholders = criteria.user_ids.map(() => '?').join(',');
    const sql = `
      SELECT 
        u.id,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.role as type
      FROM users u
      WHERE u.id IN (${placeholders}) AND u.status = 'ACTIVE'
    `;

    return await db.queryTrust(trustCode, sql, criteria.user_ids);
  }

  // Template processing
  processTemplate(content, variables) {
    let processedContent = content;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    return processedContent;
  }

  // Message history and tracking
  async getMessageHistory(filters, trustCode) {
    let sql = `
      SELECT 
        cm.id,
        cm.message_type,
        cm.recipient_type,
        cm.subject,
        cm.content,
        cm.status,
        cm.priority,
        cm.sent_at,
        cm.delivered_at,
        cm.error_message,
        cm.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        ct.template_name
      FROM communication_messages cm
      LEFT JOIN users u ON cm.created_by = u.id
      LEFT JOIN communication_templates ct ON cm.template_id = ct.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.message_type) {
      sql += ' AND cm.message_type = ?';
      params.push(filters.message_type);
    }

    if (filters.status) {
      sql += ' AND cm.status = ?';
      params.push(filters.status);
    }

    if (filters.recipient_type) {
      sql += ' AND cm.recipient_type = ?';
      params.push(filters.recipient_type);
    }

    if (filters.from_date) {
      sql += ' AND cm.created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      sql += ' AND cm.created_at <= ?';
      params.push(filters.to_date);
    }

    sql += ' ORDER BY cm.created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        sql += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }

    return await db.queryTrust(trustCode, sql, params);
  }

  async getCommunicationStats(filters, trustCode) {
    const sql = `
      SELECT 
        cm.message_type,
        cm.status,
        COUNT(*) as count
      FROM communication_messages cm
      WHERE cm.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY cm.message_type, cm.status
      ORDER BY cm.message_type, cm.status
    `;

    const result = await db.queryTrust(trustCode, sql);

    // Format statistics
    const stats = {
      total: 0,
      byType: {},
      byStatus: {}
    };

    for (const row of result) {
      stats.total += row.count;

      if (!stats.byType[row.message_type]) {
        stats.byType[row.message_type] = 0;
      }
      stats.byType[row.message_type] += row.count;

      if (!stats.byStatus[row.status]) {
        stats.byStatus[row.status] = 0;
      }
      stats.byStatus[row.status] += row.count;
    }

    return stats;
  }

  // Notifications management
  async getUserNotifications(userId, trustCode, limit = 50) {
    try {
      const sql = `
        SELECT config_key, config_value, created_at
        FROM trust_config
        WHERE config_key LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const result = await db.queryTrust(trustCode, sql, [`notification_${userId}_%`, limit]);

      const notifications = result.map(row => {
        const notification = JSON.parse(row.config_value);
        return {
          id: row.config_key,
          ...notification,
          createdAt: row.created_at
        };
      });

      return notifications;
    } catch (error) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  async markNotificationAsRead(userId, notificationId, trustCode) {
    try {
      const sql = `
        UPDATE trust_config
        SET config_value = JSON_SET(config_value, '$.read', true)
        WHERE config_key = ?
      `;

      await db.queryTrust(trustCode, sql, [`notification_${userId}_${notificationId}`]);

      return { marked: true };
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  async getAnnouncements(filters, trustCode) {
    try {
      const sql = `
        SELECT config_key, config_value, created_at
        FROM trust_config
        WHERE config_key LIKE 'announcement_%'
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const result = await db.queryTrust(trustCode, sql);

      const announcements = result
        .map(row => {
          const announcement = JSON.parse(row.config_value);
          return {
            id: row.config_key.replace('announcement_', ''),
            ...announcement,
            createdAt: row.created_at
          };
        })
        .filter(announcement => {
          // Filter by expiry date
          if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
            return false;
          }
          return true;
        });

      return announcements;
    } catch (error) {
      throw new Error(`Failed to get announcements: ${error.message}`);
    }
  }
}

module.exports = new CommunicationService();
