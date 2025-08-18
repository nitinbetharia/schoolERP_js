const express = require('express');
const router = express.Router();
const communicationService = require('../modules/communication/communication-service');
const setupService = require('../modules/setup/setup-service');
const emailProviders = require('../modules/communication/email-service-providers');
const smsProviders = require('../modules/communication/sms-service-providers');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Provider Configuration Management

// Setup email provider
router.post(
  '/providers/email/setup',
  authMiddleware.requireRole(['TRUST_ADMIN']),
  authMiddleware.requirePermission('communication', 'configure'),
  validationMiddleware.validate('communication.emailSetup'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const emailConfig = req.body;

      const result = await setupService.setupEmailProvider(emailConfig, req.trustCode);

      res.success(result, 'Email provider configured successfully');
    } catch (error) {
      res.error(error.message, 'EMAIL_SETUP_FAILED', 400);
    }
  })
);

// Setup SMS provider
router.post(
  '/providers/sms/setup',
  authMiddleware.requireRole(['TRUST_ADMIN']),
  authMiddleware.requirePermission('communication', 'configure'),
  validationMiddleware.validate('communication.smsSetup'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const smsConfig = req.body;

      const result = await setupService.setupSMSProvider(smsConfig, req.trustCode);

      res.success(result, 'SMS provider configured successfully');
    } catch (error) {
      res.error(error.message, 'SMS_SETUP_FAILED', 400);
    }
  })
);

// Get communication providers
router.get(
  '/providers',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { type } = req.query;

      const providers = await setupService.getCommunicationProviders(req.trustCode, type);

      res.success(providers, 'Communication providers retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PROVIDERS_FETCH_FAILED', 500);
    }
  })
);

// Test communication provider
router.post(
  '/providers/test',
  authMiddleware.requireRole(['TRUST_ADMIN']),
  authMiddleware.requirePermission('communication', 'configure'),
  validationMiddleware.validate('communication.providerTest'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { provider_type, test_data } = req.body;

      const result = await setupService.testCommunicationProvider(
        req.trustCode,
        provider_type,
        test_data
      );

      if (result.success) {
        res.success(result, 'Provider test completed successfully');
      } else {
        res.error(result.message, 'PROVIDER_TEST_FAILED', 400);
      }
    } catch (error) {
      res.error(error.message, 'PROVIDER_TEST_ERROR', 500);
    }
  })
);

// Get communication statistics
router.get(
  '/stats',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.statsQuery'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const dateRange = {
        start:
          req.query.start_date ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: req.query.end_date || new Date().toISOString().split('T')[0]
      };

      const stats = await setupService.getCommunicationStats(req.trustCode, dateRange);

      res.success(stats, 'Communication statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'STATS_FETCH_FAILED', 500);
    }
  })
);

// Email Management

// Send email
router.post(
  '/email/send',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authMiddleware.requirePermission('communication', 'send'),
  validationMiddleware.validate('communication.sendEmail'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const emailData = req.body;

      const result = await communicationService.sendEmail(emailData, req.trustCode);

      res.success(result, 'Email sent successfully');
    } catch (error) {
      res.error(error.message, 'EMAIL_SEND_FAILED', 400);
    }
  })
);

// Send bulk emails
router.post(
  '/email/bulk',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'bulk_send'),
  validationMiddleware.validate('communication.bulkEmail'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { emails, batch_size } = req.body;

      const results = await emailProviders.processBulkEmails(
        emails,
        req.trustCode,
        batch_size || 10
      );

      res.success(results, 'Bulk emails processed successfully');
    } catch (error) {
      res.error(error.message, 'BULK_EMAIL_FAILED', 400);
    }
  })
);

// Get email delivery stats
router.get(
  '/email/stats',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.deliveryStats'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const dateRange = {
        start: req.query.start_date,
        end: req.query.end_date
      };

      const stats = await emailProviders.getDeliveryStats(req.trustCode, dateRange);

      res.success(stats, 'Email delivery statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'EMAIL_STATS_FAILED', 500);
    }
  })
);

// SMS Management

// Send SMS
router.post(
  '/sms/send',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authMiddleware.requirePermission('communication', 'send'),
  validationMiddleware.validate('communication.sendSMS'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const smsData = req.body;

      const result = await communicationService.sendSMS(smsData, req.trustCode);

      res.success(result, 'SMS sent successfully');
    } catch (error) {
      res.error(error.message, 'SMS_SEND_FAILED', 400);
    }
  })
);

// Send bulk SMS
router.post(
  '/sms/bulk',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'bulk_send'),
  validationMiddleware.validate('communication.bulkSMS'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { messages, batch_size } = req.body;

      const results = await smsProviders.processBulkSMS(messages, req.trustCode, batch_size || 10);

      res.success(results, 'Bulk SMS processed successfully');
    } catch (error) {
      res.error(error.message, 'BULK_SMS_FAILED', 400);
    }
  })
);

// Get SMS delivery stats
router.get(
  '/sms/stats',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.deliveryStats'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const dateRange = {
        start: req.query.start_date,
        end: req.query.end_date
      };

      const stats = await smsProviders.getDeliveryStats(req.trustCode, dateRange);

      res.success(stats, 'SMS delivery statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SMS_STATS_FAILED', 500);
    }
  })
);

// Handle SMS delivery reports (webhook)
router.post(
  '/sms/delivery-report/:provider',
  validationMiddleware.validateParams('communication.providerName'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { provider } = req.params;
      const reportData = req.body;

      await smsProviders.handleDeliveryReport(provider.toUpperCase(), reportData, req.trustCode);

      res.success({}, 'Delivery report processed successfully');
    } catch (error) {
      res.error(error.message, 'DELIVERY_REPORT_FAILED', 400);
    }
  })
);

// Generate SMS usage report
router.get(
  '/sms/usage-report',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.usageReport'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const dateRange = {
        start: req.query.start_date,
        end: req.query.end_date
      };

      const report = await smsProviders.generateUsageReport(req.trustCode, dateRange);

      res.success(report, 'SMS usage report generated successfully');
    } catch (error) {
      res.error(error.message, 'USAGE_REPORT_FAILED', 500);
    }
  })
);

// Message Templates Management

// Create message template
router.post(
  '/templates',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.createTemplate'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const templateData = req.body;
      templateData.created_by = req.session.userId;

      const result = await communicationService.createTemplate(templateData, req.trustCode);

      res.success(result, 'Message template created successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATE_CREATION_FAILED', 400);
    }
  })
);

// Get message templates
router.get(
  '/templates',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.templateFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;

      const templates = await communicationService.getTemplates(filters, req.trustCode);

      res.success(templates, 'Message templates retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATES_FETCH_FAILED', 500);
    }
  })
);

// Update message template
router.put(
  '/templates/:templateId',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'update'),
  validationMiddleware.validateParams('communication.templateId'),
  validationMiddleware.validate('communication.updateTemplate'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { templateId } = req.params;
      const updateData = req.body;

      const result = await communicationService.updateTemplate(
        templateId,
        updateData,
        req.trustCode
      );

      res.success(result, 'Message template updated successfully');
    } catch (error) {
      res.error(error.message, 'TEMPLATE_UPDATE_FAILED', 400);
    }
  })
);

// Send Individual Messages

// Send SMS message
router.post(
  '/sms/send',
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.sendSMS'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        message_type: 'SMS',
        created_by: req.session.userId
      };

      const result = await communicationService.sendMessage(messageData, req.trustCode);

      res.success(result, 'SMS message sent successfully');
    } catch (error) {
      res.error(error.message, 'SMS_SEND_FAILED', 400);
    }
  })
);

// Send email message
router.post(
  '/email/send',
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.sendEmail'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        message_type: 'EMAIL',
        created_by: req.session.userId
      };

      const result = await communicationService.sendMessage(messageData, req.trustCode);

      res.success(result, 'Email message sent successfully');
    } catch (error) {
      res.error(error.message, 'EMAIL_SEND_FAILED', 400);
    }
  })
);

// Send in-app notification
router.post(
  '/notifications/send',
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.sendNotification'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        message_type: 'NOTIFICATION',
        created_by: req.session.userId
      };

      const result = await communicationService.sendMessage(messageData, req.trustCode);

      res.success(result, 'Notification sent successfully');
    } catch (error) {
      res.error(error.message, 'NOTIFICATION_SEND_FAILED', 400);
    }
  })
);

// Create announcement
router.post(
  '/announcements',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.createAnnouncement'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        message_type: 'ANNOUNCEMENT',
        created_by: req.session.userId
      };

      const result = await communicationService.sendMessage(messageData, req.trustCode);

      res.success(result, 'Announcement created successfully');
    } catch (error) {
      res.error(error.message, 'ANNOUNCEMENT_CREATION_FAILED', 400);
    }
  })
);

// Bulk Messaging

// Send bulk messages
router.post(
  '/bulk/send',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.sendBulkMessage'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const bulkData = {
        ...req.body,
        created_by: req.session.userId
      };

      const result = await communicationService.sendBulkMessage(bulkData, req.trustCode);

      res.success(result, 'Bulk messages sent successfully');
    } catch (error) {
      res.error(error.message, 'BULK_MESSAGE_FAILED', 400);
    }
  })
);

// Get recipients for bulk messaging
router.post(
  '/recipients/get',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validate('communication.getRecipients'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const criteria = req.body;

      const recipients = await communicationService.getRecipients(criteria, req.trustCode);

      res.success(recipients, 'Recipients retrieved successfully');
    } catch (error) {
      res.error(error.message, 'RECIPIENTS_FETCH_FAILED', 500);
    }
  })
);

// Message History and Tracking

// Get message history
router.get(
  '/messages',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.messageFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;

      const messages = await communicationService.getMessageHistory(filters, req.trustCode);

      res.success(messages, 'Message history retrieved successfully');
    } catch (error) {
      res.error(error.message, 'MESSAGE_HISTORY_FETCH_FAILED', 500);
    }
  })
);

// Get communication statistics
router.get(
  '/stats',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.statsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;

      const stats = await communicationService.getCommunicationStats(filters, req.trustCode);

      res.success(stats, 'Communication statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'COMMUNICATION_STATS_FETCH_FAILED', 500);
    }
  })
);

// Notifications Management

// Get user notifications
router.get(
  '/notifications',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.notificationFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const userId = req.session.userId;
      const { limit = 50 } = req.query;

      const notifications = await communicationService.getUserNotifications(
        userId,
        req.trustCode,
        parseInt(limit)
      );

      res.success(notifications, 'Notifications retrieved successfully');
    } catch (error) {
      res.error(error.message, 'NOTIFICATIONS_FETCH_FAILED', 500);
    }
  })
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  authMiddleware.requirePermission('communication', 'update'),
  validationMiddleware.validateParams('communication.notificationId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.session.userId;

      const result = await communicationService.markNotificationAsRead(
        userId,
        notificationId,
        req.trustCode
      );

      res.success(result, 'Notification marked as read');
    } catch (error) {
      res.error(error.message, 'NOTIFICATION_UPDATE_FAILED', 400);
    }
  })
);

// Announcements

// Get announcements
router.get(
  '/announcements',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.announcementFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;

      const announcements = await communicationService.getAnnouncements(filters, req.trustCode);

      res.success(announcements, 'Announcements retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ANNOUNCEMENTS_FETCH_FAILED', 500);
    }
  })
);

// Communication Groups (for organizing recipients)

// Create communication group
router.post(
  '/groups',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.createGroup'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      // This would be implemented in communication service
      const groupData = req.body;
      groupData.created_by = req.session.userId;

      // Placeholder implementation
      res.success(
        {
          groupId: 'group_' + Date.now(),
          message: 'Communication groups feature not yet implemented'
        },
        'Communication group created successfully'
      );
    } catch (error) {
      res.error(error.message, 'GROUP_CREATION_FAILED', 400);
    }
  })
);

// Get communication groups
router.get(
  '/groups',
  authMiddleware.requirePermission('communication', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      // Placeholder implementation
      const groups = [];

      res.success(groups, 'Communication groups retrieved successfully');
    } catch (error) {
      res.error(error.message, 'GROUPS_FETCH_FAILED', 500);
    }
  })
);

// Scheduled Messages

// Schedule message
router.post(
  '/scheduled',
  authMiddleware.requirePermission('communication', 'create'),
  validationMiddleware.validate('communication.scheduleMessage'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const messageData = {
        ...req.body,
        created_by: req.session.userId
      };

      // This would be implemented to schedule messages
      res.success(
        {
          scheduleId: 'schedule_' + Date.now(),
          message: 'Message scheduling feature not yet implemented'
        },
        'Message scheduled successfully'
      );
    } catch (error) {
      res.error(error.message, 'MESSAGE_SCHEDULING_FAILED', 400);
    }
  })
);

// Get scheduled messages
router.get(
  '/scheduled',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateQuery('communication.scheduledFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      // Placeholder implementation
      const scheduledMessages = [];

      res.success(scheduledMessages, 'Scheduled messages retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SCHEDULED_MESSAGES_FETCH_FAILED', 500);
    }
  })
);

// Communication Settings

// Get communication settings
router.get(
  '/settings',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      // This would be implemented to get communication settings
      const settings = {
        sms_enabled: true,
        email_enabled: true,
        notification_enabled: true,
        max_bulk_recipients: 1000,
        message: 'Communication settings not yet fully implemented'
      };

      res.success(settings, 'Communication settings retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SETTINGS_FETCH_FAILED', 500);
    }
  })
);

// Update communication settings
router.put(
  '/settings',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('communication', 'update'),
  validationMiddleware.validate('communication.updateSettings'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const settings = req.body;

      // This would be implemented to update communication settings
      res.success(
        {
          updated: true,
          message: 'Communication settings update not yet implemented'
        },
        'Communication settings updated successfully'
      );
    } catch (error) {
      res.error(error.message, 'SETTINGS_UPDATE_FAILED', 400);
    }
  })
);

// Export communication data
router.get(
  '/export/:format',
  authMiddleware.requirePermission('communication', 'read'),
  validationMiddleware.validateParams('common.exportFormat'),
  validationMiddleware.validateQuery('communication.exportFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { format } = req.params;
      const filters = req.query;

      // This would be implemented to export communication data
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `communication-export-${timestamp}.${format}`;

      res.success(
        {
          filename,
          message: 'Communication export not yet implemented',
          format,
          filters
        },
        'Communication export initiated'
      );
    } catch (error) {
      res.error(error.message, 'COMMUNICATION_EXPORT_FAILED', 500);
    }
  })
);

module.exports = router;
