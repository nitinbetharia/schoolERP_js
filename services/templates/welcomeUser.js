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
 * Welcome User Email Template
 * Handles welcome email generation for new users
 */

/**
 * Generate welcome email content
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email content and options
 */
async function generateWelcomeEmail(options) {
   try {
      const { user, tempPassword, tenant, createdBy } = options;

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
         tempPassword,
         hasTemporaryPassword: !!tempPassword,
         createdBy: createdBy?.full_name || 'System Administrator',
         welcomeDate: formatEmailDate(new Date()),
         firstLoginUrl: `${baseUrl}/login`,
         profileUrl: `${baseUrl}/profile`,
         supportUrl: `${baseUrl}/help`,
         gettingStartedSteps: [
            'Log in using your credentials',
            'Complete your profile information',
            'Explore the dashboard features',
            'Set up your preferences',
            'Contact support if you need help',
         ],
      };

      // Render HTML template
      const html = await renderTemplate('welcome-user', templateData);

      // Generate text version
      const text = generateWelcomeText(templateData);

      // Prepare email options
      const mailOptions = {
         from: getFromAddress(tenant),
         to: user.email,
         subject: getWelcomeSubject(tenant),
         html,
         text,
         headers: {
            'X-Priority': '3',
            'X-Mailer': 'School ERP System',
         },
      };

      logSystem('Welcome email generated', {
         userId: user.id,
         email: user.email,
         tenantId: tenant?.id,
         hasTemporaryPassword: !!tempPassword,
         createdBy: createdBy?.id,
      });

      return {
         mailOptions,
         metadata: {
            type: 'welcome_user',
            userId: user.id,
            tenantId: tenant?.id,
            createdBy: createdBy?.id,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'GenerateWelcomeEmail',
         userId: options.user?.id,
         email: options.user?.email,
         tenantId: options.tenant?.id,
      });
      throw error;
   }
}

/**
 * Generate welcome email subject line
 * @param {Object} tenant - Tenant object
 * @returns {string} - Email subject
 */
function getWelcomeSubject(tenant) {
   const systemName = tenant?.trust_name || 'School ERP System';
   return `Welcome to ${systemName}!`;
}

/**
 * Generate plain text version of welcome email
 * @param {Object} templateData - Template data
 * @returns {string} - Plain text content
 */
function generateWelcomeText(templateData) {
   const { user, systemName, firstLoginUrl, tempPassword, hasTemporaryPassword, createdBy, gettingStartedSteps } =
      templateData;

   let passwordSection = '';
   if (hasTemporaryPassword) {
      passwordSection = `
Your account credentials:
- Username: ${user.username || user.email}
- Temporary Password: ${tempPassword}

IMPORTANT: Please change your password after your first login for security.
`;
   }

   const stepsText = gettingStartedSteps.map((step, index) => `${index + 1}. ${step}`).join('\n');

   return `
Welcome to ${systemName}!

Hello ${user.full_name || user.name || 'User'},

Welcome to ${systemName}! Your account has been created by ${createdBy}.
${passwordSection}
Getting Started:
${stepsText}

Login to your account:
${firstLoginUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
${systemName} Team

---
This is an automated message, please do not reply to this email.
   `.trim();
}

/**
 * Generate account activation email content
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email content and options
 */
async function generateAccountActivationEmail(options) {
   try {
      const { user, activationToken, tenant } = options;

      // Validate required data
      validateTemplateData(options, ['user.email', 'user.full_name', 'activationToken']);

      // Get common email data
      const baseUrl = getBaseUrl(tenant);
      const commonData = getCommonEmailData({ tenant, user, baseUrl });

      // Prepare template data
      const templateData = {
         ...commonData,
         user: sanitizeTemplateData(user),
         tenant: sanitizeTemplateData(tenant),
         activationUrl: `${baseUrl}/activate/${activationToken}`,
         activationToken,
         expiryHours: 48, // Activation token expiry
      };

      // For account activation, we can reuse welcome template with activation data
      const html = await renderTemplate('welcome-user', {
         ...templateData,
         isActivation: true,
         hasTemporaryPassword: false,
      });

      // Generate text version
      const text = generateAccountActivationText(templateData);

      // Prepare email options
      const mailOptions = {
         from: getFromAddress(tenant),
         to: user.email,
         subject: getAccountActivationSubject(tenant),
         html,
         text,
         headers: {
            'X-Priority': '2',
            'X-Mailer': 'School ERP System',
         },
      };

      logSystem('Account activation email generated', {
         userId: user.id,
         email: user.email,
         tenantId: tenant?.id,
      });

      return {
         mailOptions,
         metadata: {
            type: 'account_activation',
            userId: user.id,
            tenantId: tenant?.id,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'GenerateAccountActivationEmail',
         userId: options.user?.id,
         email: options.user?.email,
         tenantId: options.tenant?.id,
      });
      throw error;
   }
}

/**
 * Generate account activation subject line
 * @param {Object} tenant - Tenant object
 * @returns {string} - Email subject
 */
function getAccountActivationSubject(tenant) {
   const systemName = tenant?.trust_name || 'School ERP System';
   return `Activate Your ${systemName} Account`;
}

/**
 * Generate plain text version of account activation email
 * @param {Object} templateData - Template data
 * @returns {string} - Plain text content
 */
function generateAccountActivationText(templateData) {
   const { user, systemName, activationUrl, expiryHours } = templateData;

   return `
Activate Your ${systemName} Account

Hello ${user.full_name || user.name || 'User'},

Your ${systemName} account has been created! To complete your registration, please activate your account by clicking the link below:

${activationUrl}

This activation link will expire in ${expiryHours} hours for security reasons.

After activation, you'll be able to:
- Access your dashboard
- Complete your profile
- Start using all system features

If you're having trouble with the link, copy and paste the URL into your browser.

Welcome aboard!

Best regards,
${systemName} Team

---
This is an automated message, please do not reply to this email.
   `.trim();
}

module.exports = {
   generateWelcomeEmail,
   generateAccountActivationEmail,
   getWelcomeSubject,
   getAccountActivationSubject,
};
