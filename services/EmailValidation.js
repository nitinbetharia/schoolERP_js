/**
 * Email Validation Service
 * Handles email address validation, sanitization, and formatting
 */

/**
 * Basic email format validation using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid format
 */
function isValidEmailFormat(email) {
   if (!email || typeof email !== 'string') {
      return false;
   }

   // RFC 5322 compliant email regex (simplified but robust)
   const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

   return emailRegex.test(email) && email.length <= 254; // RFC limit
}

/**
 * Validate email domain
 * @param {string} email - Email address
 * @returns {boolean} - True if domain is valid
 */
function isValidDomain(email) {
   if (!isValidEmailFormat(email)) {
      return false;
   }

   const domain = email.split('@')[1];

   // Basic domain validation
   if (domain.length > 253) {
      return false;
   } // RFC limit
   if (domain.startsWith('.') || domain.endsWith('.')) {
      return false;
   }
   if (domain.includes('..')) {
      return false;
   }

   return true;
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
function sanitizeEmail(email) {
   if (!email || typeof email !== 'string') {
      return '';
   }

   return email.trim().toLowerCase().replace(/\s+/g, ''); // Remove any spaces
}

/**
 * Validate and normalize email address
 * @param {string} email - Email to validate and normalize
 * @returns {Object} - Validation result with normalized email
 */
function validateAndNormalizeEmail(email) {
   const sanitized = sanitizeEmail(email);

   const result = {
      original: email,
      normalized: sanitized,
      isValid: false,
      errors: [],
   };

   // Check if empty
   if (!sanitized) {
      result.errors.push('Email address is required');
      return result;
   }

   // Check format
   if (!isValidEmailFormat(sanitized)) {
      result.errors.push('Invalid email format');
      return result;
   }

   // Check domain
   if (!isValidDomain(sanitized)) {
      result.errors.push('Invalid email domain');
      return result;
   }

   // Additional checks
   const [localPart, domain] = sanitized.split('@');

   // Check local part length
   if (localPart.length > 64) {
      result.errors.push('Email local part too long (max 64 characters)');
      return result;
   }

   // Check for common typos in popular domains
   const correctedDomain = correctCommonDomainTypos(domain);
   if (correctedDomain !== domain) {
      result.normalized = `${localPart}@${correctedDomain}`;
      result.suggestion = result.normalized;
   }

   result.isValid = true;
   return result;
}

/**
 * Correct common domain typos
 * @param {string} domain - Domain to check
 * @returns {string} - Corrected domain or original
 */
function correctCommonDomainTypos(domain) {
   const corrections = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
   };

   return corrections[domain] || domain;
}

/**
 * Validate multiple email addresses
 * @param {Array<string>} emails - Array of email addresses
 * @returns {Object} - Validation results for all emails
 */
function validateMultipleEmails(emails) {
   if (!Array.isArray(emails)) {
      return {
         valid: [],
         invalid: [],
         errors: ['Input must be an array of emails'],
      };
   }

   const valid = [];
   const invalid = [];
   const errors = [];

   emails.forEach((email, index) => {
      const result = validateAndNormalizeEmail(email);

      if (result.isValid) {
         valid.push({
            index,
            original: result.original,
            normalized: result.normalized,
            suggestion: result.suggestion,
         });
      } else {
         invalid.push({
            index,
            email: result.original,
            errors: result.errors,
         });
         errors.push(`Email ${index + 1}: ${result.errors.join(', ')}`);
      }
   });

   return {
      valid,
      invalid,
      errors,
      summary: {
         total: emails.length,
         validCount: valid.length,
         invalidCount: invalid.length,
      },
   };
}

/**
 * Check if email is from a disposable email service
 * @param {string} email - Email address to check
 * @returns {boolean} - True if disposable
 */
function isDisposableEmail(email) {
   if (!isValidEmailFormat(email)) {
      return false;
   }

   const domain = email.split('@')[1].toLowerCase();

   // Common disposable email domains
   const disposableDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'temp-mail.org',
      'throwaway.email',
      'tempail.com',
   ];

   return disposableDomains.includes(domain);
}

/**
 * Extract domain from email address
 * @param {string} email - Email address
 * @returns {string|null} - Domain or null if invalid
 */
function extractDomain(email) {
   const result = validateAndNormalizeEmail(email);
   return result.isValid ? result.normalized.split('@')[1] : null;
}

/**
 * Check if email matches a pattern
 * @param {string} email - Email to check
 * @param {string} pattern - Pattern to match (* for wildcard)
 * @returns {boolean} - True if matches
 */
function matchesPattern(email, pattern) {
   if (!email || !pattern) {
      return false;
   }

   const normalizedEmail = sanitizeEmail(email);
   const normalizedPattern = pattern.toLowerCase().replace(/\*/g, '.*');
   const regex = new RegExp(`^${normalizedPattern}$`);

   return regex.test(normalizedEmail);
}

module.exports = {
   isValidEmailFormat,
   isValidDomain,
   sanitizeEmail,
   validateAndNormalizeEmail,
   correctCommonDomainTypos,
   validateMultipleEmails,
   isDisposableEmail,
   extractDomain,
   matchesPattern,
};
