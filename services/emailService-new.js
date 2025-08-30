/**
 * Email Service - Main Coordinator
 * Coordinates email transport, templates, queue, and validation
 * Maintains backward compatibility while using modular architecture
 */

const emailTransport = require('./EmailTransport');
const emailQueue = require('./EmailQueue');
const emailValidation = require('./EmailValidation');
const templateManager = require('./templates/TemplateManager');
const { logSystem, logError } = require('../utils/logger');

/**
 * Email Service Class
 * Provides high-level email functionality using modular components
 */
class EmailService {
   constructor() {
      this.initialized = false;
   }

   /**
    * Initialize email service
    */
   async initialize() {
      try {
         if (this.initialized) {
            return;
         }

         await emailTransport.initialize();
         this.initialized = true;

         logSystem('Email service initialized successfully');
      } catch (error) {
         logError(error, { context: 'EmailServiceInit' });
         throw error;
      }
   }

   /**
    * Send password reset email
    * @param {Object} user - User object with name, email
    * @param {string} resetToken - Password reset token
    * @param {Object} tenant - Tenant object (optional for system users)
    * @returns {Promise<Object>} - Send result
    */
   async sendPasswordResetEmail(user, resetToken, tenant = null) {
      try {
         // Ensure service is initialized
         await this.ensureInitialized();

         // Validate email address
         const emailResult = emailValidation.validateAndNormalizeEmail(user.email);
         if (!emailResult.isValid) {
            throw new Error(`Invalid email address: ${emailResult.errors.join(', ')}`);
         }

         // Generate email content
         const emailData = await templateManager.generateEmail(templateManager.EMAIL_TYPES.PASSWORD_RESET, {
            user,
            resetToken,
            tenant,
         });

         // Send via queue for reliability
         const queueId = emailQueue.addToQueue({
            mailOptions: emailData.mailOptions,
            metadata: emailData.metadata,
            priority: 'high', // Password reset is high priority
         });

         logSystem('Password reset email queued', {
            userId: user.id,
            email: emailResult.normalized,
            queueId,
            tenantId: tenant?.id,
         });

         return {
            success: true,
            queueId,
            email: emailResult.normalized,
         };
      } catch (error) {
         logError(error, {
            context: 'SendPasswordResetEmail',
            userId: user?.id,
            email: user?.email,
            tenantId: tenant?.id,
         });

         return {
            success: false,
            error: error.message,
         };
      }
   }

   /**
    * Send password reset success confirmation email
    * @param {Object} user - User object
    * @param {Object} tenant - Tenant object (optional)
    * @param {string} ipAddress - IP address of the reset request
    * @returns {Promise<Object>} - Send result
    */
   async sendPasswordResetSuccessEmail(user, tenant = null, ipAddress = null) {
      try {
         // Ensure service is initialized
         await this.ensureInitialized();

         // Validate email address
         const emailResult = emailValidation.validateAndNormalizeEmail(user.email);
         if (!emailResult.isValid) {
            throw new Error(`Invalid email address: ${emailResult.errors.join(', ')}`);
         }

         // Generate email content
         const emailData = await templateManager.generateEmail(templateManager.EMAIL_TYPES.PASSWORD_RESET_SUCCESS, {
            user,
            tenant,
            ipAddress,
         });

         // Send via queue
         const queueId = emailQueue.addToQueue({
            mailOptions: emailData.mailOptions,
            metadata: emailData.metadata,
            priority: 'normal',
         });

         logSystem('Password reset success email queued', {
            userId: user.id,
            email: emailResult.normalized,
            queueId,
            tenantId: tenant?.id,
         });

         return {
            success: true,
            queueId,
            email: emailResult.normalized,
         };
      } catch (error) {
         logError(error, {
            context: 'SendPasswordResetSuccessEmail',
            userId: user?.id,
            email: user?.email,
            tenantId: tenant?.id,
         });

         return {
            success: false,
            error: error.message,
         };
      }
   }

   /**
    * Send welcome email to new user
    * @param {Object} user - User object
    * @param {string} tempPassword - Temporary password (optional)
    * @param {Object} tenant - Tenant object (optional)
    * @param {Object} createdBy - User who created the account
    * @returns {Promise<Object>} - Send result
    */
   async sendWelcomeEmail(user, tempPassword = null, tenant = null, createdBy = null) {
      try {
         // Ensure service is initialized
         await this.ensureInitialized();

         // Validate email address
         const emailResult = emailValidation.validateAndNormalizeEmail(user.email);
         if (!emailResult.isValid) {
            throw new Error(`Invalid email address: ${emailResult.errors.join(', ')}`);
         }

         // Generate email content
         const emailData = await templateManager.generateEmail(templateManager.EMAIL_TYPES.WELCOME_USER, {
            user,
            tempPassword,
            tenant,
            createdBy,
         });

         // Send via queue
         const queueId = emailQueue.addToQueue({
            mailOptions: emailData.mailOptions,
            metadata: emailData.metadata,
            priority: 'normal',
         });

         logSystem('Welcome email queued', {
            userId: user.id,
            email: emailResult.normalized,
            queueId,
            tenantId: tenant?.id,
            hasTemporaryPassword: !!tempPassword,
         });

         return {
            success: true,
            queueId,
            email: emailResult.normalized,
         };
      } catch (error) {
         logError(error, {
            context: 'SendWelcomeEmail',
            userId: user?.id,
            email: user?.email,
            tenantId: tenant?.id,
         });

         return {
            success: false,
            error: error.message,
         };
      }
   }

   /**
    * Send notification email
    * @param {Object} user - User object
    * @param {string} subject - Email subject
    * @param {string} message - Email message
    * @param {Object} options - Additional options
    * @returns {Promise<Object>} - Send result
    */
   async sendNotificationEmail(user, subject, message, options = {}) {
      try {
         // Ensure service is initialized
         await this.ensureInitialized();

         // Validate email address
         const emailResult = emailValidation.validateAndNormalizeEmail(user.email);
         if (!emailResult.isValid) {
            throw new Error(`Invalid email address: ${emailResult.errors.join(', ')}`);
         }

         // Prepare options
         const emailOptions = {
            user,
            subject,
            message,
            tenant: options.tenant,
            actionUrl: options.actionUrl,
            actionText: options.actionText,
            priority: options.priority || 'normal',
         };

         // Generate email content
         const emailData = await templateManager.generateEmail(templateManager.EMAIL_TYPES.NOTIFICATION, emailOptions);

         // Send via queue
         const queueId = emailQueue.addToQueue({
            mailOptions: emailData.mailOptions,
            metadata: emailData.metadata,
            priority: emailOptions.priority,
         });

         logSystem('Notification email queued', {
            userId: user.id,
            email: emailResult.normalized,
            queueId,
            subject,
            tenantId: options.tenant?.id,
         });

         return {
            success: true,
            queueId,
            email: emailResult.normalized,
         };
      } catch (error) {
         logError(error, {
            context: 'SendNotificationEmail',
            userId: user?.id,
            email: user?.email,
            subject,
         });

         return {
            success: false,
            error: error.message,
         };
      }
   }

   /**
    * Get email service status
    * @returns {Object} - Service status
    */
   getStatus() {
      return {
         initialized: this.initialized,
         transport: emailTransport.getStatus(),
         queue: emailQueue.getStatus(),
         availableTemplates: templateManager.getAvailableTemplates(),
      };
   }

   /**
    * Ensure service is initialized
    * @private
    */
   async ensureInitialized() {
      if (!this.initialized) {
         await this.initialize();
      }
   }

   /**
    * Get queue status (for monitoring)
    * @returns {Object} - Queue status
    */
   getQueueStatus() {
      return emailQueue.getStatus();
   }

   /**
    * Clear email queue (admin function)
    * @param {string} status - Optional status filter
    * @returns {number} - Number of cleared items
    */
   clearQueue(status = null) {
      return emailQueue.clearQueue(status);
   }

   /**
    * Validate email address
    * @param {string} email - Email to validate
    * @returns {Object} - Validation result
    */
   validateEmail(email) {
      return emailValidation.validateAndNormalizeEmail(email);
   }

   /**
    * Validate multiple email addresses
    * @param {Array<string>} emails - Emails to validate
    * @returns {Object} - Validation results
    */
   validateMultipleEmails(emails) {
      return emailValidation.validateMultipleEmails(emails);
   }
}

// Export singleton instance
const emailService = new EmailService();

// Initialize on startup (non-blocking)
emailService.initialize().catch((error) => {
   logError(error, { context: 'EmailServiceStartup' });
});

module.exports = emailService;
