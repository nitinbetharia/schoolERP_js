/**
 * System Utilities
 * Helper functions for system services
 */

/**
 * Helper function to initialize tenant models
 * @param {string} trustCode - The trust code for the tenant
 * @returns {Promise} - Initialized tenant models
 */
async function initializeTenantModelsHelper(trustCode) {
   const { dbManager } = require('../models/system/database');
   return await dbManager.initializeTenantModels(trustCode);
}

/**
 * Helper function to get system models
 * @returns {Promise<Object>} - Object containing SystemUser model
 */
async function getSystemModels() {
   const { dbManager } = require('../models/system/database');
   const { defineSystemUserModel } = require('../models/system/SystemUser');
   const systemDB = await dbManager.getSystemDB();
   const SystemUser = defineSystemUserModel(systemDB);
   return { SystemUser };
}

/**
 * Helper function to get Trust model
 * @returns {Promise<Object>} - Trust model instance
 */
async function getTrustModel() {
   const { dbManager } = require('../models/system/database');
   const { defineTrustModel } = require('../models/tenant/Trust');
   const systemDB = await dbManager.getSystemDB();
   const Trust = defineTrustModel(systemDB);
   return Trust;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(email);
}

/**
 * Validate username format (alphanumeric and underscores only)
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username format
 */
function isValidUsername(username) {
   const usernameRegex = /^[a-zA-Z0-9_]+$/;
   return usernameRegex.test(username) && username.length >= 3 && username.length <= 50;
}

/**
 * Validate trust code format (alphanumeric only, 3-20 chars)
 * @param {string} trustCode - Trust code to validate
 * @returns {boolean} - True if valid trust code format
 */
function isValidTrustCode(trustCode) {
   const trustCodeRegex = /^[a-zA-Z0-9]+$/;
   return trustCodeRegex.test(trustCode) && trustCode.length >= 3 && trustCode.length <= 20;
}

/**
 * Validate subdomain format (alphanumeric and hyphens, 3-63 chars)
 * @param {string} subdomain - Subdomain to validate
 * @returns {boolean} - True if valid subdomain format
 */
function isValidSubdomain(subdomain) {
   const subdomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
   return subdomainRegex.test(subdomain);
}

/**
 * Sanitize string input by removing potentially harmful characters
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
   if (typeof input !== 'string') {
      return '';
   }
   return input.replace(/[<>'"&]/g, '').trim();
}

/**
 * Generate database name for trust
 * @param {string} trustCode - Trust code
 * @returns {string} - Generated database name
 */
function generateDatabaseName(trustCode) {
   const sanitized = trustCode.toLowerCase().replace(/[^a-z0-9]/g, '');
   return `school_erp_trust_${sanitized}`;
}

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Generated token in hex format
 */
function generateSecureToken(length = 32) {
   const crypto = require('crypto');
   return crypto.randomBytes(length).toString('hex');
}

/**
 * Check if password meets security requirements
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and reasons
 */
function validatePasswordStrength(password) {
   const result = {
      isValid: true,
      reasons: [],
   };

   if (!password || password.length < 8) {
      result.isValid = false;
      result.reasons.push('Password must be at least 8 characters long');
   }

   if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.reasons.push('Password must contain at least one lowercase letter');
   }

   if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.reasons.push('Password must contain at least one uppercase letter');
   }

   if (!/\d/.test(password)) {
      result.isValid = false;
      result.reasons.push('Password must contain at least one number');
   }

   if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.isValid = false;
      result.reasons.push('Password must contain at least one special character');
   }

   return result;
}

/**
 * Format user data for API response (exclude sensitive information)
 * @param {Object} user - User object
 * @returns {Object} - Formatted user data
 */
function formatUserResponse(user) {
   if (!user) {
      return null;
   }

   return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      last_login_at: user.last_login_at,
      profile: user.profile || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
   };
}

/**
 * Format trust data for API response
 * @param {Object} trust - Trust object
 * @returns {Object} - Formatted trust data
 */
function formatTrustResponse(trust) {
   if (!trust) {
      return null;
   }

   return {
      id: trust.id,
      trust_name: trust.trust_name,
      trust_code: trust.trust_code,
      subdomain: trust.subdomain,
      contact_email: trust.contact_email,
      contact_phone: trust.contact_phone,
      address: trust.address,
      status: trust.status,
      tenant_config: trust.tenant_config || {},
      created_at: trust.created_at,
      updated_at: trust.updated_at,
      setup_completed_at: trust.setup_completed_at,
   };
}

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query parameters
 * @returns {Object} - Parsed pagination parameters
 */
function parsePaginationParams(query) {
   const page = Math.max(1, parseInt(query.page) || 1);
   const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
   const offset = (page - 1) * limit;

   return { page, limit, offset };
}

/**
 * Create pagination response object
 * @param {number} total - Total number of records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {Object} - Pagination information
 */
function createPaginationResponse(total, page, limit) {
   return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
   };
}

module.exports = {
   initializeTenantModelsHelper,
   getSystemModels,
   getTrustModel,
   isValidEmail,
   isValidUsername,
   isValidTrustCode,
   isValidSubdomain,
   sanitizeString,
   generateDatabaseName,
   generateSecureToken,
   validatePasswordStrength,
   formatUserResponse,
   formatTrustResponse,
   parsePaginationParams,
   createPaginationResponse,
};
