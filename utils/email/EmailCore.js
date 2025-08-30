const nodemailer = require('nodemailer');
const { logger } = require('../logger');

/**
 * Email Service - Core Infrastructure
 * Handles transporter creation and base email template generation
 * Provides foundational email functionality for all email modules
 *
 * Following copilot instructions: CommonJS, DRY principles, cached transporter
 */

// Cache transporter to avoid recreating
let transporter = null;

/**
 * Create reusable email transporter (DRY principle)
 * @returns {Object|null} Configured nodemailer transporter or null if failed
 */
function createTransporter() {
   if (transporter) {
      return transporter;
   }

   // Validate required environment variables
   const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
   const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

   if (missingVars.length > 0) {
      logger.warn('Email service not configured - missing environment variables', {
         missingVars,
      });
      return null;
   }

   try {
      transporter = nodemailer.createTransporter({
         host: process.env.SMTP_HOST,
         port: parseInt(process.env.SMTP_PORT) || 587,
         secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
         auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
         },
         // Additional security options
         tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
         },
      });

      logger.info('Email transporter created successfully');
      return transporter;
   } catch (error) {
      logger.error('Failed to create email transporter', error);
      return null;
   }
}

/**
 * Common email template function (DRY principle)
 * @param {string} subject - Email subject
 * @param {string} content - Email content HTML
 * @param {string} recipientName - Recipient's name
 * @param {Object} schoolData - School information
 * @returns {Object} Email template with HTML and text versions
 */
function createEmailTemplate(subject, content, recipientName, schoolData = {}) {
   const schoolName = schoolData.name || 'School ERP System';

   return {
      subject: subject,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background-color: #366092; 
            color: white; 
            padding: 20px; 
            text-align: center; 
          }
          .content { 
            background-color: #f9f9f9; 
            padding: 30px; 
          }
          .footer { 
            background-color: #666; 
            color: white; 
            padding: 15px; 
            text-align: center; 
            font-size: 12px; 
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #366092; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 10px 0; 
          }
          .highlight { 
            background-color: #fff3cd; 
            padding: 10px; 
            border-left: 4px solid #ffc107; 
            margin: 10px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${schoolName}</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <div>${content}</div>
            <br>
            <p>Best regards,<br>
            <strong>${schoolName}</strong><br>
            School Administration</p>
          </div>
          <div class="footer">
            <p>This is an automated email from ${schoolName}. Please do not reply to this email.</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
      </html>
    `,
      text: `
      ${schoolName}
      
      Dear ${recipientName},
      
      ${content}
      
      Best regards,
      ${schoolName}
      School Administration
      
      This is an automated email from ${schoolName}. Please do not reply to this email.
      Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    `,
   };
}

/**
 * Test email configuration
 * @returns {Promise<Object>} Test results
 */
async function testEmailConfiguration() {
   try {
      const testTransporter = createTransporter();
      if (!testTransporter) {
         return {
            success: false,
            message: 'Email transporter could not be created - check configuration',
         };
      }

      await testTransporter.verify();
      logger.info('Email configuration test successful');

      return {
         success: true,
         message: 'Email configuration is valid and server is reachable',
      };
   } catch (error) {
      logger.error('Email configuration test failed', error);
      return {
         success: false,
         message: `Email configuration test failed: ${error.message}`,
      };
   }
}

module.exports = {
   createTransporter,
   createEmailTemplate,
   testEmailConfiguration,
};
