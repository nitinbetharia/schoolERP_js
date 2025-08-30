const { createTransporter, createEmailTemplate } = require('./EmailCore');
const { logger } = require('../logger');

/**
 * Email Service - User Communications
 * Handles user account related emails (welcome, account changes, etc.)
 * Focused on user management and authentication communications
 *
 * Following copilot instructions: CommonJS, async/await, proper error handling
 */

/**
 * Send welcome email to new users with login credentials
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's full name
 * @param {string} temporaryPassword - Temporary password for first login
 * @param {Object} schoolData - School information
 * @returns {Promise<Object>} Send result with success status
 */
async function sendWelcomeEmail(userEmail, userName, temporaryPassword, schoolData = {}) {
   try {
      const emailTransporter = createTransporter();
      if (!emailTransporter) {
         logger.warn('Email service not available - skipping welcome email');
         return { success: false, reason: 'Email service not configured' };
      }

      const template = createEmailTemplate(
         'Welcome to School ERP System',
         `
        <p>Your account has been created successfully in our School ERP System.</p>
        
        <div class="highlight">
          <h3>Your Login Credentials:</h3>
          <ul>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>Temporary Password:</strong> ${temporaryPassword}</li>
          </ul>
        </div>
        
        <p>For your security, please log in and change your password immediately.</p>
        
        <p><strong>Important Security Notes:</strong></p>
        <ul>
          <li>Never share your login credentials with anyone</li>
          <li>Use a strong, unique password</li>
          <li>Log out when you're finished using the system</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact the school 
        administration.</p>
      `,
         userName,
         schoolData
      );

      const mailOptions = {
         from: `"${schoolData.name || 'School ERP System'}" <${process.env.SMTP_USER}>`,
         to: userEmail,
         ...template,
      };

      const result = await emailTransporter.sendMail(mailOptions);

      logger.info('Welcome email sent successfully', {
         to: userEmail,
         messageId: result.messageId,
         userName,
      });

      return { success: true, messageId: result.messageId };
   } catch (error) {
      logger.error('Failed to send welcome email', {
         error: error.message,
         userEmail,
         userName,
      });
      throw error;
   }
}

module.exports = {
   sendWelcomeEmail,
};
