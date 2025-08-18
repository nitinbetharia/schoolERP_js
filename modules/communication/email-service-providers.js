const logger = require('../../config/logger');

/**
 * Email Service Provider Utilities
 * Handles email template processing, queue management, and delivery optimization
 */
class EmailServiceProviders {
  /**
   * Process email template with variables
   */
  static processTemplate(template, variables) {
    try {
      let processedSubject = template.subject || '';
      let processedContent = template.content || '';

      // Replace variables in subject and content
      Object.keys(variables).forEach(key => {
        const value = variables[key] || '';
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedSubject = processedSubject.replace(regex, value);
        processedContent = processedContent.replace(regex, value);
      });

      // Process conditional blocks
      processedContent = this.processConditionals(processedContent, variables);

      // Process loops
      processedContent = this.processLoops(processedContent, variables);

      return {
        subject: processedSubject,
        content: processedContent
      };
    } catch (error) {
      logger.error('Error processing email template:', error);
      throw new Error(`Template processing failed: ${error.message}`);
    }
  }

  /**
   * Process conditional blocks in template
   * Syntax: {{#if variable}}content{{/if}}
   */
  static processConditionals(content, variables) {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return content.replace(conditionalRegex, (match, variable, block) => {
      const value = variables[variable];
      if (value && value !== '' && value !== false && value !== 0) {
        return block;
      }
      return '';
    });
  }

  /**
   * Process loop blocks in template
   * Syntax: {{#each items}}{{name}} - {{value}}{{/each}}
   */
  static processLoops(content, variables) {
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return content.replace(loopRegex, (match, arrayName, block) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) {
        return '';
      }

      return array
        .map(item => {
          let processedBlock = block;
          Object.keys(item).forEach(key => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            processedBlock = processedBlock.replace(regex, item[key] || '');
          });
          return processedBlock;
        })
        .join('');
    });
  }

  /**
   * Validate email configuration
   */
  static validateEmailConfig(config) {
    const errors = [];

    // Common validations
    if (!config.provider) {
      errors.push('Email provider is required');
    }

    if (!config.from_email || !this.isValidEmail(config.from_email)) {
      errors.push('Valid from email is required');
    }

    if (!config.from_name) {
      errors.push('From name is required');
    }

    // Provider-specific validations
    switch (config.provider) {
      case 'SMTP':
        if (!config.smtp_host) errors.push('SMTP host is required');
        if (!config.smtp_port) errors.push('SMTP port is required');
        if (!config.smtp_username) errors.push('SMTP username is required');
        if (!config.smtp_password) errors.push('SMTP password is required');
        break;

      case 'SENDGRID':
        if (!config.sendgrid_api_key) errors.push('SendGrid API key is required');
        break;

      case 'SES':
        // SES provider no longer supported
        errors.push('Amazon SES provider is no longer supported');
        break;
        break;

      case 'GMAIL':
        if (!config.gmail_username) errors.push('Gmail username is required');
        if (!config.gmail_app_password) errors.push('Gmail app password is required');
        break;

      case 'MAILGUN':
        if (!config.mailgun_api_key) errors.push('Mailgun API key is required');
        if (!config.mailgun_domain) errors.push('Mailgun domain is required');
        break;

      default:
        errors.push(`Unsupported email provider: ${config.provider}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(config) {
    try {
      const validation = this.validateEmailConfig(config);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Configuration validation failed',
          errors: validation.errors
        };
      }

      // Create test email
      const testEmail = {
        to: config.from_email,
        subject: 'Test Email - School ERP Configuration',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email Configuration Test</h2>
                        <p>This is a test email to verify your email configuration.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <strong>Provider:</strong> ${config.provider}<br>
                            <strong>From:</strong> ${config.from_name} &lt;${config.from_email}&gt;<br>
                            <strong>Test Time:</strong> ${new Date().toLocaleString()}
                        </div>
                        <p style="color: #666;">If you received this email, your configuration is working correctly!</p>
                    </div>
                `,
        text: `Email Configuration Test\n\nThis is a test email to verify your email configuration.\n\nProvider: ${config.provider}\nFrom: ${config.from_name} <${config.from_email}>\nTest Time: ${new Date().toLocaleString()}\n\nIf you received this email, your configuration is working correctly!`
      };

      // The actual sending would be handled by the CommunicationService
      return {
        success: true,
        message: 'Test email configuration is valid',
        testEmail
      };
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return {
        success: false,
        message: `Configuration test failed: ${error.message}`
      };
    }
  }

  /**
   * Generate email templates for common school scenarios
   */
  static getDefaultTemplates() {
    return [
      {
        name: 'fee_payment_confirmation',
        type: 'EMAIL',
        subject: 'Fee Payment Confirmation - {{student_name}}',
        content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">{{school_name}}</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Fee Payment Confirmation</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p>Dear {{parent_name}},</p>
                            
                            <p>We have successfully received the fee payment for <strong>{{student_name}}</strong> ({{student_id}}).</p>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Transaction ID:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">{{transaction_id}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount Paid:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">₹{{amount}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Payment Method:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">{{payment_method}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
                                        <td style="padding: 8px 0;">{{payment_date}}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p>Thank you for your prompt payment. If you have any questions, please contact our accounts department.</p>
                            
                            <p>Best regards,<br>{{school_name}} Administration</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                            <p>This is an automated email. Please do not reply to this message.</p>
                            <p>{{school_address}} | {{school_phone}} | {{school_email}}</p>
                        </div>
                    </div>
                `,
        variables: [
          'school_name',
          'parent_name',
          'student_name',
          'student_id',
          'transaction_id',
          'amount',
          'payment_method',
          'payment_date',
          'school_address',
          'school_phone',
          'school_email'
        ]
      },
      {
        name: 'fee_payment_reminder',
        type: 'EMAIL',
        subject: 'Fee Payment Reminder - {{student_name}}',
        content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">{{school_name}}</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Fee Payment Reminder</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p>Dear {{parent_name}},</p>
                            
                            <p>This is a reminder that the fee payment for <strong>{{student_name}}</strong> ({{student_id}}) is due on <strong>{{due_date}}</strong>.</p>
                            
                            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                <h3 style="margin-top: 0; color: #856404;">Fee Details</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #ffeaa7;"><strong>Fee Head:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #ffeaa7;">{{fee_head}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #ffeaa7;"><strong>Amount Due:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #ffeaa7;">₹{{amount_due}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;"><strong>Due Date:</strong></td>
                                        <td style="padding: 8px 0;">{{due_date}}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            {{#if online_payment_enabled}}
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{{payment_link}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Pay Online Now</a>
                            </div>
                            {{/if}}
                            
                            <p>Please ensure payment is made before the due date to avoid late fees. For any queries, contact our accounts department.</p>
                            
                            <p>Best regards,<br>{{school_name}} Administration</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                            <p>{{school_address}} | {{school_phone}} | {{school_email}}</p>
                        </div>
                    </div>
                `,
        variables: [
          'school_name',
          'parent_name',
          'student_name',
          'student_id',
          'fee_head',
          'amount_due',
          'due_date',
          'online_payment_enabled',
          'payment_link',
          'school_address',
          'school_phone',
          'school_email'
        ]
      },
      {
        name: 'attendance_alert',
        type: 'EMAIL',
        subject: 'Low Attendance Alert - {{student_name}}',
        content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">{{school_name}}</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Attendance Alert</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p>Dear {{parent_name}},</p>
                            
                            <p>We would like to bring to your attention that <strong>{{student_name}}</strong> ({{student_id}}) has low attendance in the current month.</p>
                            
                            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                                <h3 style="margin-top: 0; color: #721c24;">Attendance Summary</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;"><strong>Current Attendance:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;">{{attendance_percentage}}%</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;"><strong>Days Present:</strong></td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid #f5c6cb;">{{days_present}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;"><strong>Total Days:</strong></td>
                                        <td style="padding: 8px 0;">{{total_days}}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p>Regular attendance is crucial for academic progress. Please ensure your child attends school regularly.</p>
                            
                            <p>If there are any specific concerns or issues, please contact the class teacher or school administration.</p>
                            
                            <p>Best regards,<br>{{school_name}} Administration</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                            <p>{{school_address}} | {{school_phone}} | {{school_email}}</p>
                        </div>
                    </div>
                `,
        variables: [
          'school_name',
          'parent_name',
          'student_name',
          'student_id',
          'attendance_percentage',
          'days_present',
          'total_days',
          'school_address',
          'school_phone',
          'school_email'
        ]
      },
      {
        name: 'general_announcement',
        type: 'EMAIL',
        subject: '{{announcement_title}} - {{school_name}}',
        content: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%); color: white; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">{{school_name}}</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Important Announcement</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <h2 style="color: #333; margin-top: 0;">{{announcement_title}}</h2>
                            
                            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                                <div style="line-height: 1.6;">{{announcement_content}}</div>
                            </div>
                            
                            {{#if announcement_date}}
                            <p><strong>Date:</strong> {{announcement_date}}</p>
                            {{/if}}
                            
                            {{#if contact_required}}
                            <p>For more information, please contact the school office.</p>
                            {{/if}}
                            
                            <p>Best regards,<br>{{school_name}} Administration</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                            <p>{{school_address}} | {{school_phone}} | {{school_email}}</p>
                        </div>
                    </div>
                `,
        variables: [
          'school_name',
          'announcement_title',
          'announcement_content',
          'announcement_date',
          'contact_required',
          'school_address',
          'school_phone',
          'school_email'
        ]
      }
    ];
  }

  /**
   * Utility method to validate email address
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email delivery statistics
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
                WHERE type = 'EMAIL'
                    AND created_at >= ? 
                    AND created_at <= ?
                GROUP BY provider, status, DATE(created_at)
                ORDER BY date DESC
            `;

      const result = await db.queryTrust(trustCode, sql, [dateRange.start, dateRange.end]);

      return result;
    } catch (error) {
      logger.error('Failed to get email delivery stats:', error);
      throw error;
    }
  }

  /**
   * Bulk email processing with rate limiting
   */
  static async processBulkEmails(emails, trustCode, batchSize = 10) {
    const results = [];
    const batches = [];

    // Split emails into batches
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    const communicationService = require('./communication-service');

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(email =>
        communicationService
          .sendEmail(email, trustCode)
          .then(result => ({ success: true, email: email.to, result }))
          .catch(error => ({ success: false, email: email.to, error: error.message }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = EmailServiceProviders;
