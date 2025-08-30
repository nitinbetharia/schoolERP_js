const nodemailer = require('nodemailer');
const { logSystem, logError } = require('../utils/logger');

/**
 * Email Transport Service
 * Handles SMTP transport configuration and initialization
 */
class EmailTransport {
   constructor() {
      this.transporter = null;
      this.isInitialized = false;
   }

   /**
    * Initialize email transporter with configuration
    */
   async initialize() {
      try {
         // Get email configuration from environment or config
         const emailConfig = {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
               user: process.env.SMTP_USER || '',
               pass: process.env.SMTP_PASS || '',
            },
            tls: {
               rejectUnauthorized: process.env.NODE_ENV === 'production',
            },
         };

         // Create transporter
         this.transporter = nodemailer.createTransport(emailConfig);

         // Verify connection
         if (process.env.NODE_ENV !== 'test') {
            await this.transporter.verify();
            logSystem('Email transport initialized successfully', {
               host: emailConfig.host,
               port: emailConfig.port,
               secure: emailConfig.secure,
            });
         }

         this.isInitialized = true;

         // For development, create a test account
         if (process.env.NODE_ENV === 'development') {
            await this.createTestAccount();
         }
      } catch (error) {
         logError(error, { context: 'EmailTransportInit' });

         // Fallback to test account for development
         if (process.env.NODE_ENV === 'development') {
            await this.createTestAccount();
         } else {
            throw error;
         }
      }
   }

   /**
    * Create a test account for development
    */
   async createTestAccount() {
      try {
         const testAccount = await nodemailer.createTestAccount();

         this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
               user: testAccount.user,
               pass: testAccount.pass,
            },
         });

         this.isInitialized = true;

         logSystem('Test email account created for development', {
            user: testAccount.user,
            smtp: testAccount.smtp,
            imap: testAccount.imap,
            pop3: testAccount.pop3,
         });
      } catch (error) {
         logError(error, { context: 'TestEmailAccountCreation' });
         throw new Error('Failed to create test email account');
      }
   }

   /**
    * Send email using configured transport
    * @param {Object} mailOptions - Email options
    * @returns {Promise<Object>} - Send result
    */
   async sendMail(mailOptions) {
      if (!this.isInitialized || !this.transporter) {
         throw new Error('Email transport not initialized');
      }

      try {
         const result = await this.transporter.sendMail(mailOptions);

         // For development, log the preview URL
         if (process.env.NODE_ENV === 'development' && result.messageId) {
            const previewUrl = nodemailer.getTestMessageUrl(result);
            if (previewUrl) {
               logSystem('Email preview URL (development only)', { previewUrl });
               result.previewUrl = previewUrl;
            }
         }

         return result;
      } catch (error) {
         logError(error, {
            context: 'SendMail',
            to: mailOptions.to,
            subject: mailOptions.subject,
         });
         throw error;
      }
   }

   /**
    * Verify transport connection
    * @returns {Promise<boolean>} - Verification result
    */
   async verifyConnection() {
      if (!this.transporter) {
         return false;
      }

      try {
         await this.transporter.verify();
         return true;
      } catch (error) {
         logError(error, { context: 'VerifyEmailConnection' });
         return false;
      }
   }

   /**
    * Get transport status
    * @returns {Object} - Transport status information
    */
   getStatus() {
      return {
         isInitialized: this.isInitialized,
         hasTransporter: !!this.transporter,
         environment: process.env.NODE_ENV,
      };
   }

   /**
    * Close transport connection
    */
   async close() {
      if (this.transporter) {
         this.transporter.close();
         this.transporter = null;
         this.isInitialized = false;
         logSystem('Email transport connection closed');
      }
   }
}

// Export singleton instance
module.exports = new EmailTransport();
