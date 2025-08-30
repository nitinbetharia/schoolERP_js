const {
   getBaseUrl,
   getFromAddress,
   renderTemplate,
   getCommonEmailData,
   generateTextVersion,
   validateTemplateData,
   sanitizeTemplateData,
   formatEmailDate,
} = require('./baseTemplate');
const { logSystem, logError } = require('../../utils/logger');

/**
 * Password Reset Email Template
 * Handles password reset email generation and sending
 */

/**
 * Generate password reset email content
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email content and options
 */
async function generatePasswordResetEmail(options) {
   try {
      const { user, resetToken, tenant, ipAddress } = options;

      // Validate required data
      validateTemplateData(options, ['user.email', 'user.full_name', 'resetToken']);

      // Get common email data
      const baseUrl = getBaseUrl(tenant);
      const commonData = getCommonEmailData({ tenant, user, baseUrl });

      // Prepare template data
      const templateData = {
         ...commonData,
         user: sanitizeTemplateData(user),
         resetUrl: `${baseUrl}/reset-password/${resetToken}`,
         resetToken,
         tenant: sanitizeTemplateData(tenant),
         ipAddress,
         expiryHours: 24, // Password reset token expiry
         resetDate: formatEmailDate(new Date(), { includeTime: true }),
      };

      // Render HTML template
      const html = await renderTemplate('password-reset', templateData);

      // Generate text version
      const text = generatePasswordResetText(templateData);

      // Prepare email options
      const mailOptions = {
         from: getFromAddress(tenant),
         to: user.email,
         subject: getPasswordResetSubject(tenant),
         html,
         text,
         // Email headers for better deliverability
         headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'X-Mailer': 'School ERP System',
         },
      };

      logSystem('Password reset email generated', {
         userId: user.id,
         email: user.email,
         tenantId: tenant?.id,
         hasResetToken: !!resetToken,
      });

      return {
         mailOptions,
         metadata: {
            type: 'password_reset',
            userId: user.id,
            tenantId: tenant?.id,
            resetToken: resetToken.substring(0, 10), // Log partial token for tracking
         },
      };
   } catch (error) {
      logError(error, {
         context: 'GeneratePasswordResetEmail',
         userId: options.user?.id,
         email: options.user?.email,
         tenantId: options.tenant?.id,
      });
      throw error;
   }
}

/**
 * Generate password reset subject line
 * @param {Object} tenant - Tenant object
 * @returns {string} - Email subject
 */
function getPasswordResetSubject(tenant) {
   const systemName = tenant?.trust_name || 'School ERP System';
   return `Password Reset Request - ${systemName}`;
}

/**
 * Generate plain text version of password reset email
 * @param {Object} templateData - Template data
 * @returns {string} - Plain text content
 */
function generatePasswordResetText(templateData) {
   const { user, resetUrl, systemName, expiryHours } = templateData;

   return `
Password Reset Request - ${systemName}

Hello ${user.full_name || user.name || 'User'},

We received a request to reset your password for your ${systemName} account.

To reset your password, click the link below or copy and paste it into your browser:
${resetUrl}

This link will expire in ${expiryHours} hours for security reasons.

If you did not request this password reset, please ignore this email. Your password will remain unchanged.

For security reasons:
- Never share this link with anyone
- This link can only be used once
- If you're having trouble, contact our support team

Best regards,
${systemName} Team

---
This is an automated message, please do not reply to this email.
   `.trim();
}

/**
 * Generate password reset success email content
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email content and options
 */
async function generatePasswordResetSuccessEmail(options) {
   try {
      const { user, tenant, ipAddress } = options;

      // Validate required data
      validateTemplateData(options, ['user.email', 'user.full_name']);

      // Get common email data
      const baseUrl = getBaseUrl(tenant);
      const commonData = getCommonEmailData({ tenant, user, baseUrl });

      // Prepare template data
      const templateData = {
         ...commonData,
         user: sanitizeTemplateData(user),
         tenant: sanitizeTemplateData(tenant),
         ipAddress,
         resetDate: formatEmailDate(new Date(), { includeTime: true }),
         securityTips: [
            'Use a strong, unique password',
            'Enable two-factor authentication if available',
            'Log out from shared devices',
            'Report suspicious activity immediately',
         ],
      };

      // Render HTML template
      const html = await renderTemplate('password-reset-success', templateData);

      // Generate text version
      const text = generatePasswordResetSuccessText(templateData);

      // Prepare email options
      const mailOptions = {
         from: getFromAddress(tenant),
         to: user.email,
         subject: getPasswordResetSuccessSubject(tenant),
         html,
         text,
         headers: {
            'X-Mailer': 'School ERP System',
         },
      };

      logSystem('Password reset success email generated', {
         userId: user.id,
         email: user.email,
         tenantId: tenant?.id,
      });

      return {
         mailOptions,
         metadata: {
            type: 'password_reset_success',
            userId: user.id,
            tenantId: tenant?.id,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'GeneratePasswordResetSuccessEmail',
         userId: options.user?.id,
         email: options.user?.email,
         tenantId: options.tenant?.id,
      });
      throw error;
   }
}

/**
 * Generate password reset success subject line
 * @param {Object} tenant - Tenant object
 * @returns {string} - Email subject
 */
function getPasswordResetSuccessSubject(tenant) {
   const systemName = tenant?.trust_name || 'School ERP System';
   return `Password Reset Successful - ${systemName}`;
}

/**
 * Generate plain text version of password reset success email
 * @param {Object} templateData - Template data
 * @returns {string} - Plain text content
 */
function generatePasswordResetSuccessText(templateData) {
   const { user, systemName, loginUrl, resetDate } = templateData;

   return `
Password Reset Successful - ${systemName}

Hello ${user.full_name || user.name || 'User'},

Your password has been successfully reset on ${resetDate}.

You can now log in to your account using your new password:
${loginUrl}

For your security:
- Use a strong, unique password
- Enable two-factor authentication if available  
- Log out from shared devices
- Report any suspicious activity immediately

If you did not make this change, please contact our support team immediately.

Best regards,
${systemName} Team

---
This is an automated message, please do not reply to this email.
   `.trim();
}

module.exports = {
   generatePasswordResetEmail,
   generatePasswordResetSuccessEmail,
   getPasswordResetSubject,
   getPasswordResetSuccessSubject,
};
