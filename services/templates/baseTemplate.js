const path = require('path');
const ejs = require('ejs');
const { logSystem, logError } = require('../../utils/logger');

/**
 * Base Template Utilities
 * Common functions for all email templates
 */

/**
 * Get base URL for email links
 * @param {Object} tenant - Tenant object
 * @returns {string} - Base URL
 */
function getBaseUrl(tenant) {
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
function getFromAddress(tenant) {
   if (tenant && tenant.contact_email) {
      return `${tenant.trust_name || 'School ERP'} <${tenant.contact_email}>`;
   }

   return process.env.FROM_EMAIL || 'noreply@schoolerp.com';
}

/**
 * Render email template with data
 * @param {string} templateName - Template filename (without .ejs extension)
 * @param {Object} data - Template data
 * @returns {Promise<string>} - Rendered HTML
 */
async function renderTemplate(templateName, data) {
   try {
      const templatePath = path.join(__dirname, '../../views/emails', `${templateName}.ejs`);
      const html = await ejs.renderFile(templatePath, data);
      return html;
   } catch (error) {
      logError(error, {
         context: 'RenderEmailTemplate',
         template: templateName,
         dataKeys: Object.keys(data || {}),
      });
      throw new Error(`Failed to render email template: ${templateName}`);
   }
}

/**
 * Generate common email data
 * @param {Object} options - Email options
 * @returns {Object} - Common email data
 */
function getCommonEmailData(options = {}) {
   const { tenant, user, baseUrl } = options;

   return {
      tenant,
      user,
      baseUrl: baseUrl || getBaseUrl(tenant),
      currentYear: new Date().getFullYear(),
      systemName: tenant?.trust_name || 'School ERP System',
      supportEmail: tenant?.contact_email || process.env.SUPPORT_EMAIL || 'support@schoolerp.com',
      companyName: tenant?.trust_name || 'School ERP',
      loginUrl: `${baseUrl || getBaseUrl(tenant)}/login`,
   };
}

/**
 * Generate text version of email content
 * @param {string} html - HTML content
 * @returns {string} - Plain text version
 */
function generateTextVersion(html) {
   if (!html) {
      return '';
   }

   return (
      html
         // Remove HTML tags
         .replace(/<[^>]*>/g, '')
         // Convert HTML entities
         .replace(/&nbsp;/g, ' ')
         .replace(/&amp;/g, '&')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'")
         // Clean up whitespace
         .replace(/\s+/g, ' ')
         .trim()
   );
}

/**
 * Validate required template data
 * @param {Object} data - Template data
 * @param {Array<string>} requiredFields - Required field names
 * @throws {Error} - If required fields are missing
 */
function validateTemplateData(data, requiredFields) {
   const missing = requiredFields.filter((field) => {
      const value = field.includes('.') ? field.split('.').reduce((obj, key) => obj?.[key], data) : data[field];
      return value === undefined || value === null;
   });

   if (missing.length > 0) {
      throw new Error(`Missing required template data: ${missing.join(', ')}`);
   }
}

/**
 * Sanitize email data to prevent XSS in templates
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
function sanitizeTemplateData(data) {
   if (!data || typeof data !== 'object') {
      return data;
   }

   const sanitized = {};

   for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
         // Basic HTML escape for security
         sanitized[key] = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
      } else if (typeof value === 'object' && value !== null) {
         sanitized[key] = sanitizeTemplateData(value);
      } else {
         sanitized[key] = value;
      }
   }

   return sanitized;
}

/**
 * Format date for email display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date
 */
function formatEmailDate(date, options = {}) {
   if (!date) {
      return '';
   }

   const dateObj = new Date(date);
   if (isNaN(dateObj.getTime())) {
      return '';
   }

   const { locale = 'en-US', timeZone = 'UTC', includeTime = false } = options;

   const formatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
   };

   if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
   }

   return dateObj.toLocaleDateString(locale, formatOptions);
}

module.exports = {
   getBaseUrl,
   getFromAddress,
   renderTemplate,
   getCommonEmailData,
   generateTextVersion,
   validateTemplateData,
   sanitizeTemplateData,
   formatEmailDate,
};
