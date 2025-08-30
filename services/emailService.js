const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');
const { logSystem, logError } = require('../utils/logger');

/**
 * Email Service for School ERP System
 * Handles all email communications including password reset, notifications, etc.
 * Supports both system and tenant-specific configurations
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    /**
     * Initialize email transporter with configuration
     */
    async initializeTransporter() {
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
            this.transporter = nodemailer.createTransporter(emailConfig);

            // Verify connection
            if (process.env.NODE_ENV !== 'test') {
                await this.transporter.verify();
                logSystem('Email service initialized successfully', {
                    host: emailConfig.host,
                    port: emailConfig.port,
                    secure: emailConfig.secure,
                });
            }
        } catch (error) {
            logError(error, { context: 'EmailServiceInit' });
            
            // For development, create a test account
            if (process.env.NODE_ENV === 'development') {
                await this.createTestAccount();
            }
        }
    }

    /**
     * Create a test account for development
     */
    async createTestAccount() {
        try {
            const testAccount = await nodemailer.createTestAccount();
            
            this.transporter = nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            logSystem('Test email account created for development', {
                user: testAccount.user,
                smtp: testAccount.smtp,
                imap: testAccount.imap,
                pop3: testAccount.pop3,
            });
        } catch (error) {
            logError(error, { context: 'TestEmailAccountCreation' });
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
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            // Determine the reset URL based on tenant
            const baseUrl = this.getBaseUrl(tenant);
            const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
            const loginUrl = `${baseUrl}/login`;

            // Render email template
            const emailTemplate = path.join(__dirname, '../views/emails/password-reset.ejs');
            const emailHtml = await ejs.renderFile(emailTemplate, {
                user,
                resetUrl,
                loginUrl,
                resetToken,
                tenant,
                baseUrl,
            });

            // Email options
            const mailOptions = {
                from: this.getFromAddress(tenant),
                to: user.email,
                subject: this.getPasswordResetSubject(tenant),
                html: emailHtml,
                // Text version for accessibility
                text: this.getPasswordResetText(user, resetUrl, tenant),
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            logSystem('Password reset email sent', {
                userId: user.id,
                email: user.email,
                messageId: result.messageId,
                tenantId: tenant?.id,
            });

            // For development, log the preview URL
            if (process.env.NODE_ENV === 'development' && result.messageId) {
                const previewUrl = nodemailer.getTestMessageUrl(result);
                if (previewUrl) {
                    logSystem('Email preview URL (development only)', { previewUrl });
                }
            }

            return {
                success: true,
                messageId: result.messageId,
                previewUrl: process.env.NODE_ENV === 'development' 
                    ? nodemailer.getTestMessageUrl(result) 
                    : null,
            };
        } catch (error) {
            logError(error, { 
                context: 'SendPasswordResetEmail', 
                userId: user?.id,
                email: user?.email,
                tenantId: tenant?.id 
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
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            // Determine URLs
            const baseUrl = this.getBaseUrl(tenant);
            const loginUrl = `${baseUrl}/login`;

            // Render email template
            const emailTemplate = path.join(__dirname, '../views/emails/password-reset-success.ejs');
            const emailHtml = await ejs.renderFile(emailTemplate, {
                user,
                loginUrl,
                tenant,
                baseUrl,
                ipAddress,
            });

            // Email options
            const mailOptions = {
                from: this.getFromAddress(tenant),
                to: user.email,
                subject: this.getPasswordResetSuccessSubject(tenant),
                html: emailHtml,
                text: this.getPasswordResetSuccessText(user, loginUrl, tenant),
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            logSystem('Password reset success email sent', {
                userId: user.id,
                email: user.email,
                messageId: result.messageId,
                tenantId: tenant?.id,
            });

            return {
                success: true,
                messageId: result.messageId,
            };
        } catch (error) {
            logError(error, { 
                context: 'SendPasswordResetSuccessEmail', 
                userId: user?.id,
                email: user?.email,
                tenantId: tenant?.id 
            });
            
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get base URL for email links
     * @param {Object} tenant - Tenant object
     * @returns {string} - Base URL
     */
    getBaseUrl(tenant) {
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const port = process.env.NODE_ENV === 'production' ? '' : `:${process.env.PORT || 3000}`;
        
        if (tenant && tenant.subdomain) {
            return `${protocol}://${tenant.subdomain}.${process.env.DOMAIN || 'localhost'}${port}`;
        }
        
        return `${protocol}://${process.env.DOMAIN || 'localhost'}${port}`;
    }

    /**
     * Get from address for emails
     * @param {Object} tenant - Tenant object
     * @returns {string} - From address
     */
    getFromAddress(tenant) {
        if (tenant && tenant.email) {
            return `"${tenant.name}" <${tenant.email}>`;
        }
        
        const systemName = process.env.SYSTEM_NAME || 'School ERP System';
        const systemEmail = process.env.SYSTEM_EMAIL || process.env.SMTP_USER || 'noreply@schoolerp.local';
        
        return `"${systemName}" <${systemEmail}>`;
    }

    /**
     * Get password reset subject line
     * @param {Object} tenant - Tenant object
     * @returns {string} - Subject line
     */
    getPasswordResetSubject(tenant) {
        const systemName = tenant?.name || process.env.SYSTEM_NAME || 'School ERP System';
        return `Password Reset Request - ${systemName}`;
    }

    /**
     * Get password reset success subject line
     * @param {Object} tenant - Tenant object
     * @returns {string} - Subject line
     */
    getPasswordResetSuccessSubject(tenant) {
        const systemName = tenant?.name || process.env.SYSTEM_NAME || 'School ERP System';
        return `Password Reset Successful - ${systemName}`;
    }

    /**
     * Get plain text version of password reset email
     * @param {Object} user - User object
     * @param {string} resetUrl - Reset URL
     * @param {Object} tenant - Tenant object
     * @returns {string} - Plain text email
     */
    getPasswordResetText(user, resetUrl, tenant) {
        const systemName = tenant?.name || 'School ERP System';
        
        return `
Hello ${user.name || user.email || 'User'},

We received a request to reset your password for your ${systemName} account.

If you requested this password reset, please visit the following link to create a new password:

${resetUrl}

This link will expire in 30 minutes for your security.

If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged.

For security, this password reset link can only be used once.

If you have any questions, please contact our support team.

Best regards,
${systemName} Team

---
This is an automated message. Please do not reply to this email.
        `.trim();
    }

    /**
     * Get plain text version of password reset success email
     * @param {Object} user - User object
     * @param {string} loginUrl - Login URL
     * @param {Object} tenant - Tenant object
     * @returns {string} - Plain text email
     */
    getPasswordResetSuccessText(user, loginUrl, tenant) {
        const systemName = tenant?.name || 'School ERP System';
        
        return `
Hello ${user.name || user.email || 'User'},

Great news! Your password has been successfully reset for your ${systemName} account.

You can now login to your account using your new password at:

${loginUrl}

Account: ${user.email}
Reset Time: ${new Date().toLocaleString()}

If this wasn't you, please contact support immediately.

Best regards,
${systemName} Team

---
This is an automated message. Please do not reply to this email.
        `.trim();
    }

    /**
     * Send welcome email to new user
     * @param {Object} user - User object
     * @param {string} password - User's password (if provided)
     * @param {Object} tenant - Tenant object (optional)
     * @returns {Promise<Object>} - Send result
     */
    async sendWelcomeEmail(user, password = null, tenant = null) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            // Determine URLs
            const baseUrl = this.getBaseUrl(tenant);
            const loginUrl = `${baseUrl}/login`;

            // Render email template
            const emailTemplate = path.join(__dirname, '../views/emails/welcome-user.ejs');
            const emailHtml = await ejs.renderFile(emailTemplate, {
                user,
                password,
                loginUrl,
                baseUrl,
                tenant,
            });

            // Email options
            const mailOptions = {
                from: this.getFromAddress(tenant),
                to: user.email,
                subject: this.getWelcomeSubject(tenant),
                html: emailHtml,
                text: this.getWelcomeText(user, password, loginUrl, tenant),
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            logSystem('Welcome email sent', {
                userId: user.id,
                email: user.email,
                messageId: result.messageId,
                tenantId: tenant?.id,
            });

            return {
                success: true,
                messageId: result.messageId,
                previewUrl: process.env.NODE_ENV === 'development' 
                    ? nodemailer.getTestMessageUrl(result) 
                    : null,
            };
        } catch (error) {
            logError(error, { 
                context: 'SendWelcomeEmail', 
                userId: user?.id,
                email: user?.email,
                tenantId: tenant?.id 
            });
            
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get welcome email subject line
     * @param {Object} tenant - Tenant object
     * @returns {string} - Subject line
     */
    getWelcomeSubject(tenant) {
        const systemName = tenant?.name || process.env.SYSTEM_NAME || 'School ERP System';
        return `Welcome to ${systemName}! Your account is ready`;
    }

    /**
     * Get plain text version of welcome email
     * @param {Object} user - User object
     * @param {string} password - User password
     * @param {string} loginUrl - Login URL
     * @param {Object} tenant - Tenant object
     * @returns {string} - Plain text email
     */
    getWelcomeText(user, password, loginUrl, tenant) {
        const systemName = tenant?.name || 'School ERP System';
        const userName = user.full_name || user.name || `${user.firstName} ${user.lastName}` || 'User';
        
        return `
Welcome to ${systemName}!

Hello ${userName},

Your account has been successfully created and you now have access to the ${systemName}.

LOGIN CREDENTIALS:
Username/Email: ${user.email}
${password ? `Password: ${password}` : 'Password: (Set during account creation)'}

Login URL: ${loginUrl}

IMPORTANT SECURITY NOTICE:
- Change your password after your first login
- Never share your credentials with anyone
- Always log out when using shared computers
${password ? '- The password provided is temporary and should be changed immediately' : ''}

If you have any questions or need assistance, please contact our support team.

Best regards,
${systemName} Team

---
This is an automated message. Please do not reply to this email.
        `.trim();
    }

    /**
     * Test email configuration by sending a test email
     * @param {string} toEmail - Test recipient email
     * @returns {Promise<Object>} - Test result
     */
    async testEmailConfiguration(toEmail) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const mailOptions = {
                from: this.getFromAddress(),
                to: toEmail,
                subject: 'Test Email - School ERP System',
                html: '<h1>Test Email</h1><p>This is a test email from School ERP System.</p>',
                text: 'Test Email - This is a test email from School ERP System.',
            };

            const result = await this.transporter.sendMail(mailOptions);

            logSystem('Test email sent successfully', {
                to: toEmail,
                messageId: result.messageId,
            });

            return {
                success: true,
                messageId: result.messageId,
                previewUrl: process.env.NODE_ENV === 'development' 
                    ? nodemailer.getTestMessageUrl(result) 
                    : null,
            };
        } catch (error) {
            logError(error, { context: 'TestEmailConfiguration' });
            
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Create and export singleton instance
const emailService = new EmailService();

module.exports = emailService;
