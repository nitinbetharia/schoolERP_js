const logger = require('../../config/logger');
const axios = require('axios');

/**
 * SMS Service Provider Utilities
 * Handles SMS template processing, queue management, and delivery optimization
 */
class SMSServiceProviders {
  /**
   * Process SMS template with variables
   */
  static processTemplate(template, variables) {
    try {
      let processedMessage = template.content || '';

      // Replace variables in message
      Object.keys(variables).forEach(key => {
        const value = variables[key] || '';
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedMessage = processedMessage.replace(regex, value);
      });

      // Ensure message length limits
      if (processedMessage.length > 160) {
        logger.warn('SMS message exceeds 160 characters, may be split into multiple messages');
      }

      return {
        message: processedMessage,
        length: processedMessage.length,
        estimatedParts: Math.ceil(processedMessage.length / 160)
      };
    } catch (error) {
      logger.error('Error processing SMS template:', error);
      throw new Error(`SMS template processing failed: ${error.message}`);
    }
  }

  /**
   * Validate SMS configuration
   */
  static validateSMSConfig(config) {
    const errors = [];

    // Common validations
    if (!config.provider) {
      errors.push('SMS provider is required');
    }

    // Provider-specific validations
    switch (config.provider) {
      case 'TWILIO':
        if (!config.twilio_account_sid) errors.push('Twilio Account SID is required');
        if (!config.twilio_auth_token) errors.push('Twilio Auth Token is required');
        if (!config.twilio_phone_number) errors.push('Twilio phone number is required');
        break;

      case 'TEXTLOCAL':
        if (!config.textlocal_api_key) errors.push('TextLocal API key is required');
        if (!config.textlocal_username) errors.push('TextLocal username is required');
        break;

      case 'MSG91':
        if (!config.msg91_auth_key) errors.push('MSG91 auth key is required');
        break;

      case 'FAST2SMS':
        if (!config.fast2sms_api_key) errors.push('Fast2SMS API key is required');
        break;

      default:
        errors.push(`Unsupported SMS provider: ${config.provider}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Test SMS configuration
   */
  static async testSMSConfig(config, testNumber) {
    try {
      const validation = this.validateSMSConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Configuration validation failed',
          errors: validation.errors
        };
      }

      if (!testNumber || !this.isValidPhoneNumber(testNumber)) {
        return {
          success: false,
          message: 'Valid test phone number is required'
        };
      }

      // Create test SMS
      const testSMS = {
        to: testNumber,
        message: `Test SMS from School ERP - ${config.provider} configuration test at ${new Date().toLocaleString()}`
      };

      // The actual sending would be handled by the CommunicationService
      return {
        success: true,
        message: 'Test SMS configuration is valid',
        testSMS
      };
    } catch (error) {
      logger.error('SMS configuration test failed:', error);
      return {
        success: false,
        message: `Configuration test failed: ${error.message}`
      };
    }
  }

  /**
   * Generate SMS templates for common school scenarios
   */
  static getDefaultTemplates() {
    return [
      {
        name: 'fee_payment_confirmation_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, Fee payment of Rs.{{amount}} for {{student_name}} ({{student_id}}) received successfully. Transaction ID: {{transaction_id}}. Thank you. - {{school_name}}'
      },
      {
        name: 'fee_payment_reminder_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, Fee payment of Rs.{{amount_due}} for {{student_name}} ({{student_id}}) is due on {{due_date}}. Please pay at the earliest. - {{school_name}}'
      },
      {
        name: 'attendance_alert_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, {{student_name}} ({{student_id}}) was absent today ({{date}}). Please ensure regular attendance. - {{school_name}}'
      },
      {
        name: 'low_attendance_alert_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, {{student_name}} has low attendance: {{attendance_percentage}}%. Please ensure regular attendance for better academic progress. - {{school_name}}'
      },
      {
        name: 'exam_reminder_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, Reminder: {{exam_name}} for {{student_name}} ({{student_id}}) on {{exam_date}} at {{exam_time}}. Venue: {{venue}}. - {{school_name}}'
      },
      {
        name: 'result_published_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, {{exam_name}} results for {{student_name}} ({{student_id}}) are now available. Please check the student portal or visit school. - {{school_name}}'
      },
      {
        name: 'general_announcement_sms',
        type: 'SMS',
        content:
          'Dear Parents, {{announcement_title}}: {{announcement_content}} {{#if date}}Date: {{date}}{{/if}} For details, contact school. - {{school_name}}'
      },
      {
        name: 'holiday_notification_sms',
        type: 'SMS',
        content:
          'Dear Parents, School will remain closed on {{holiday_date}} due to {{holiday_reason}}. Classes will resume on {{resume_date}}. - {{school_name}}'
      },
      {
        name: 'parent_teacher_meeting_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, Parent-Teacher meeting for {{student_name}} ({{student_id}}) scheduled on {{meeting_date}} at {{meeting_time}}. Please attend. - {{school_name}}'
      },
      {
        name: 'event_invitation_sms',
        type: 'SMS',
        content:
          'Dear {{parent_name}}, You are invited to {{event_name}} on {{event_date}} at {{event_time}}. Venue: {{venue}}. Your presence is appreciated. - {{school_name}}'
      }
    ];
  }

  /**
   * Format phone number for different providers
   */
  static formatPhoneNumber(phoneNumber, provider) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle Indian numbers
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // Already in correct format
    } else if (cleaned.length === 13 && cleaned.startsWith('+91')) {
      cleaned = cleaned.substring(1);
    }

    switch (provider) {
      case 'TWILIO':
        return '+' + cleaned;
      case 'TEXTLOCAL':
      case 'MSG91':
      case 'FAST2SMS':
        return cleaned;
      default:
        return cleaned;
    }
  }

  /**
   * Validate phone number
   */
  static isValidPhoneNumber(phoneNumber) {
    // Basic validation for Indian phone numbers
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  }

  /**
   * Get SMS delivery statistics
   */
  static async getDeliveryStats(trustCode, dateRange) {
    try {
      const db = require('../data/database-service');

      const sql = `
                SELECT 
                    provider,
                    status,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM communication_logs 
                WHERE type = 'SMS'
                    AND created_at >= ? 
                    AND created_at <= ?
                GROUP BY provider, status, DATE(created_at)
                ORDER BY date DESC
            `;

      const result = await db.queryTrust(trustCode, sql, [dateRange.start, dateRange.end]);

      return result;
    } catch (error) {
      logger.error('Failed to get SMS delivery stats:', error);
      throw error;
    }
  }

  /**
   * Bulk SMS processing with rate limiting
   */
  static async processBulkSMS(messages, trustCode, batchSize = 10) {
    const results = [];
    const batches = [];

    // Split messages into batches
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize));
    }

    const communicationService = require('./communication-service');

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(sms =>
        communicationService
          .sendSMS(sms, trustCode)
          .then(result => ({ success: true, phone: sms.to, result }))
          .catch(error => ({ success: false, phone: sms.to, error: error.message }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay for SMS
      }
    }

    return results;
  }

  /**
   * Calculate SMS cost estimation
   */
  static calculateSMSCost(message, provider, rates) {
    const messageLength = message.length;
    const parts = Math.ceil(messageLength / 160);

    let costPerSMS = 0;

    // Default rates (in rupees) - should be configurable
    const defaultRates = {
      TWILIO: 0.8,
      TEXTLOCAL: 0.25,
      MSG91: 0.2,
      FAST2SMS: 0.15
    };

    costPerSMS = rates?.[provider] || defaultRates[provider] || 0.25;

    return {
      parts,
      costPerPart: costPerSMS,
      totalCost: parts * costPerSMS,
      currency: 'INR'
    };
  }

  /**
   * Provider-specific delivery report handling
   */
  static async handleDeliveryReport(provider, reportData, trustCode) {
    try {
      const db = require('../data/database-service');

      let messageId, status, deliveredAt;

      switch (provider) {
        case 'TWILIO':
          messageId = reportData.MessageSid;
          status = reportData.MessageStatus;
          deliveredAt = reportData.DateUpdated;
          break;

        case 'TEXTLOCAL':
          messageId = reportData.message_id;
          status = reportData.status;
          deliveredAt = reportData.timestamp;
          break;

        case 'MSG91':
          messageId = reportData.message_id;
          status = reportData.status;
          deliveredAt = reportData.delivered_time;
          break;

        case 'FAST2SMS':
          messageId = reportData.message_id;
          status = reportData.status;
          deliveredAt = reportData.delivered_at;
          break;

        default:
          throw new Error(`Unsupported provider for delivery reports: ${provider}`);
      }

      // Update the communication log
      const sql = `
                UPDATE communication_logs 
                SET status = ?, delivered_at = ?
                WHERE message_id = ? AND provider = ?
            `;

      await db.queryTrust(trustCode, sql, [
        this.normalizeDeliveryStatus(status),
        deliveredAt,
        messageId,
        provider
      ]);

      logger.info('SMS delivery status updated', {
        provider,
        messageId,
        status,
        trustCode
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle SMS delivery report:', error);
      throw error;
    }
  }

  /**
   * Normalize delivery status across providers
   */
  static normalizeDeliveryStatus(providerStatus) {
    const statusMap = {
      // Twilio
      delivered: 'DELIVERED',
      failed: 'FAILED',
      undelivered: 'FAILED',
      sent: 'SENT',

      // TextLocal
      success: 'DELIVERED',
      failure: 'FAILED',

      // MSG91
      1: 'DELIVERED',
      2: 'FAILED',
      8: 'SENT',

      // Fast2SMS
      Success: 'DELIVERED',
      Failed: 'FAILED'
    };

    return statusMap[providerStatus] || 'UNKNOWN';
  }

  /**
   * Generate SMS usage report
   */
  static async generateUsageReport(trustCode, dateRange) {
    try {
      const db = require('../data/database-service');

      const sql = `
                SELECT 
                    provider,
                    DATE(created_at) as date,
                    COUNT(*) as total_sent,
                    SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
                    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as pending
                FROM communication_logs 
                WHERE type = 'SMS'
                    AND created_at >= ? 
                    AND created_at <= ?
                GROUP BY provider, DATE(created_at)
                ORDER BY date DESC, provider
            `;

      const result = await db.queryTrust(trustCode, sql, [dateRange.start, dateRange.end]);

      // Calculate success rates
      const reportData = result.map(row => ({
        ...row,
        success_rate: row.total_sent > 0 ? ((row.delivered / row.total_sent) * 100).toFixed(2) : 0
      }));

      return reportData;
    } catch (error) {
      logger.error('Failed to generate SMS usage report:', error);
      throw error;
    }
  }
}

module.exports = SMSServiceProviders;
