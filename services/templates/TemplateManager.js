const {
   getBaseUrl,
   getFromAddress,
   renderTemplate,
   getCommonEmailData,
   validateTemplateData,
   sanitizeTemplateData,
   formatEmailDate,
} = require('./baseTemplate');
const { logSystem, logError } = require('../../utils/logger');

/**
 * Template Manager
 * Central coordinator for all email template operations
 */

// Import specific template modules
const passwordResetTemplates = require('./passwordReset');
const welcomeUserTemplates = require('./welcomeUser');

/**
 * Available email template types
 */
const EMAIL_TYPES = {
   PASSWORD_RESET: 'password_reset',
   PASSWORD_RESET_SUCCESS: 'password_reset_success',
   WELCOME_USER: 'welcome_user',
   ACCOUNT_ACTIVATION: 'account_activation',
   NOTIFICATION: 'notification',
};

/**
 * Generate email content based on type
 * @param {string} emailType - Type of email to generate
 * @param {Object} options - Email generation options
 * @returns {Promise<Object>} - Generated email content and options
 */
async function generateEmail(emailType, options) {
   try {
      logSystem('Generating email template', {
         type: emailType,
         userId: options.user?.id,
         tenantId: options.tenant?.id,
      });

      switch (emailType) {
         case EMAIL_TYPES.PASSWORD_RESET:
            return await passwordResetTemplates.generatePasswordResetEmail(options);

         case EMAIL_TYPES.PASSWORD_RESET_SUCCESS:
            return await passwordResetTemplates.generatePasswordResetSuccessEmail(options);

         case EMAIL_TYPES.WELCOME_USER:
            return await welcomeUserTemplates.generateWelcomeEmail(options);

         case EMAIL_TYPES.ACCOUNT_ACTIVATION:
            return await welcomeUserTemplates.generateAccountActivationEmail(options);

         case EMAIL_TYPES.NOTIFICATION:
            return await generateNotificationEmail(options);

         default:
            throw new Error(`Unsupported email type: ${emailType}`);
      }
   } catch (error) {
      logError(error, {
         context: 'GenerateEmail',
         emailType,
         userId: options.user?.id,
         tenantId: options.tenant?.id,
      });
      throw error;
   }
}

/**
 * Generate generic notification email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email content and options
 */
async function generateNotificationEmail(options) {
   try {
      const { user, tenant, subject, message, actionUrl, actionText = 'View Details', priority = 'normal' } = options;

      // Validate required data
      validateTemplateData(options, ['user.email', 'subject', 'message']);

      // Get common email data
      const baseUrl = getBaseUrl(tenant);
      const commonData = getCommonEmailData({ tenant, user, baseUrl });

      // Prepare template data
      const templateData = {
         ...commonData,
         user: sanitizeTemplateData(user),
         tenant: sanitizeTemplateData(tenant),
         subject,
         message: sanitizeTemplateData({ message }).message,
         actionUrl,
         actionText,
         notificationDate: formatEmailDate(new Date(), { includeTime: true }),
         hasAction: !!actionUrl,
      };

      // Generate simple HTML content
      const html = generateNotificationHtml(templateData);

      // Generate text version
      const text = generateNotificationText(templateData);

      // Prepare email options
      const mailOptions = {
         from: getFromAddress(tenant),
         to: user.email,
         subject,
         html,
         text,
         headers: {
            'X-Priority': priority === 'high' ? '1' : '3',
            'X-Mailer': 'School ERP System',
         },
      };

      logSystem('Notification email generated', {
         userId: user.id,
         email: user.email,
         tenantId: tenant?.id,
         subject,
         hasAction: !!actionUrl,
      });

      return {
         mailOptions,
         metadata: {
            type: 'notification',
            userId: user.id,
            tenantId: tenant?.id,
            priority,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'GenerateNotificationEmail',
         userId: options.user?.id,
         email: options.user?.email,
         tenantId: options.tenant?.id,
      });
      throw error;
   }
}

/**
 * Generate HTML content for notification emails
 * @param {Object} templateData - Template data
 * @returns {string} - HTML content
 */
function generateNotificationHtml(templateData) {
   const { user, systemName, message, actionUrl, actionText, hasAction, baseUrl } = templateData;

   return `
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Notification - ${systemName}</title>
   <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f9fa; padding: 20px; text-align: center; }
      .content { padding: 20px; }
      .action-button { 
         display: inline-block; 
         background: #007bff; 
         color: white; 
         padding: 12px 24px; 
         text-decoration: none; 
         border-radius: 4px; 
         margin: 20px 0;
      }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
   </style>
</head>
<body>
   <div class="container">
      <div class="header">
         <h1>${systemName}</h1>
      </div>
      <div class="content">
         <h2>Hello ${user.full_name || user.name || 'User'},</h2>
         <p>${message}</p>
         ${hasAction ? `<a href="${actionUrl}" class="action-button">${actionText}</a>` : ''}
      </div>
      <div class="footer">
         <p>Best regards,<br>${systemName} Team</p>
         <p><a href="${baseUrl}">Visit ${systemName}</a></p>
      </div>
   </div>
</body>
</html>`.trim();
}

/**
 * Generate text content for notification emails
 * @param {Object} templateData - Template data
 * @returns {string} - Text content
 */
function generateNotificationText(templateData) {
   const { user, systemName, message, actionUrl, actionText, hasAction } = templateData;

   let actionSection = '';
   if (hasAction) {
      actionSection = `\n\n${actionText}: ${actionUrl}`;
   }

   return `
Notification - ${systemName}

Hello ${user.full_name || user.name || 'User'},

${message}${actionSection}

Best regards,
${systemName} Team

---
This is an automated message, please do not reply to this email.
   `.trim();
}

/**
 * Get list of available email templates
 * @returns {Array<string>} - List of available template types
 */
function getAvailableTemplates() {
   return Object.values(EMAIL_TYPES);
}

/**
 * Validate email type
 * @param {string} emailType - Email type to validate
 * @returns {boolean} - True if valid
 */
function isValidEmailType(emailType) {
   return Object.values(EMAIL_TYPES).includes(emailType);
}

module.exports = {
   generateEmail,
   generateNotificationEmail,
   getAvailableTemplates,
   isValidEmailType,
   EMAIL_TYPES,
};
