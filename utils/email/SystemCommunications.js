const { createTransporter, createEmailTemplate } = require('./EmailCore');
const { logger } = require('../logger');

/**
 * Email Service - System Communications
 * Handles system-level emails (error alerts, system notifications, admin alerts)
 * Focused on operational and administrative system communications
 *
 * Following copilot instructions: CommonJS, async/await, proper error handling
 */

/**
 * Send error alert email to administrators for system monitoring
 * @param {Object} errorData - Error information with details
 * @returns {Promise<Object>} Send result with success status
 */
async function sendErrorAlert(errorData) {
   const emailTransporter = createTransporter();
   if (!emailTransporter) {
      throw new Error('Email service not configured');
   }

   const { error, request, severity, timestamp } = errorData;

   // Determine recipients based on severity
   const adminEmails = process.env.ADMIN_ALERT_EMAILS
      ? process.env.ADMIN_ALERT_EMAILS.split(',').map((email) => email.trim())
      : ['admin@schoolerp.com'];

   // Create severity-based subject
   const severityLabels = {
      low: '🔵 Low',
      medium: '🟡 Medium',
      high: '🟠 High',
      critical: '🔴 CRITICAL',
   };

   const severityLabel = severityLabels[severity] || '⚪ Unknown';
   const subject = `${severityLabel} Error Alert - School ERP [${severity.toUpperCase()}]`;

   // Format error details
   const userEmailOrUsername = request.user?.email || request.user?.username;
   const userInfo = request.user ? `<p><strong>User:</strong> ${userEmailOrUsername} (ID: ${request.user.id})</p>` : '';

   const tenantInfo = request.tenant
      ? `<p><strong>Tenant:</strong> ${request.tenant.name} (Code: ${request.tenantCode})</p>`
      : '';

   const stackTrace = error.stack
      ? `
      <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; 
         padding: 15px; border-radius: 5px; margin: 15px 0;">
         <h3>🔧 Stack Trace</h3>
         <pre style="font-size: 12px; white-space: pre-wrap; 
            word-wrap: break-word;">${error.stack}</pre>
      </div>
      `
      : '';

   const errorContent = `
      <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; 
         color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0;">
         <h3>🚨 Error Details</h3>
         <p><strong>Severity:</strong> ${severityLabel} ${severity.toUpperCase()}</p>
         <p><strong>Message:</strong> ${error.message || 'Unknown error'}</p>
         <p><strong>Timestamp:</strong> ${timestamp}</p>
      </div>
      
      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; 
         color: #0c5460; padding: 15px; border-radius: 5px; margin: 15px 0;">
         <h3>📋 Request Information</h3>
         <p><strong>Method:</strong> ${request.method}</p>
         <p><strong>URL:</strong> ${request.url}</p>
         <p><strong>IP Address:</strong> ${request.ip}</p>
         <p><strong>User Agent:</strong> ${request.userAgent}</p>
         ${userInfo}
         ${tenantInfo}
      </div>
      
      ${stackTrace}
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; 
         color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0;">
         <h3>⚡ Action Required</h3>
         <p>This error requires immediate attention from the development team.</p>
         <ul>
            <li>Review the error logs for additional context</li>
            <li>Check system health and performance metrics</li>
            <li>Consider implementing additional monitoring for this error type</li>
         </ul>
      </div>
   `;

   try {
      const emailTemplate = createEmailTemplate(subject, errorContent, 'System Administrator', {
         name: 'School ERP System',
      });

      const mailOptions = {
         from: process.env.SMTP_FROM || process.env.SMTP_USER,
         to: adminEmails,
         subject: emailTemplate.subject,
         html: emailTemplate.html,
         text: emailTemplate.text,
         priority: severity === 'critical' ? 'high' : 'normal',
      };

      const result = await emailTransporter.sendMail(mailOptions);

      logger.info('Error alert email sent successfully', {
         messageId: result.messageId,
         recipients: adminEmails,
         severity: severity,
         errorMessage: error.message,
      });

      return {
         success: true,
         messageId: result.messageId,
         recipients: adminEmails,
      };
   } catch (emailError) {
      logger.error('Failed to send error alert email', {
         error: emailError.message,
         originalError: error.message,
         severity: severity,
      });
      throw emailError;
   }
}

module.exports = {
   sendErrorAlert,
};
