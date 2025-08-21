const bcrypt = require('bcryptjs');
const { logSystem, logAuth, logError } = require('../utils/logger');
const { ErrorFactory } = require('../utils/errors');
const appConfig = require('../config/app-config.json');

/**
 * System Authentication Service
 * Handles system admin authentication and management
 */
function createSystemAuthService() {
   /**
    * Login system admin
    */
   async function login(credentials) {
      try {
         const { username, password } = credentials;

         logAuth('LOGIN_ATTEMPT', null, null, { username });

         // Get system models
         const { getSystemModels } = require('../models');
         const { SystemUser } = await getSystemModels();

         // Find user by username
         const user = await SystemUser.findOne({
            where: { username: username.toLowerCase() },
         });

         if (!user) {
            logAuth('LOGIN_FAILED_USER_NOT_FOUND', null, null, { username });
            throw ErrorFactory.authentication('Invalid username or password', 'AUTH_001');
         }

         // Check if account is locked
         if (user.isLocked()) {
            logAuth('LOGIN_BLOCKED_ACCOUNT_LOCKED', user.id, null, {
               lockedUntil: user.locked_until,
               loginAttempts: user.login_attempts,
            });
            throw ErrorFactory.authentication(
               'Account is temporarily locked due to multiple failed login attempts',
               'AUTH_ACCOUNT_LOCKED'
            );
         }

         // Verify password
         const isPasswordValid = await bcrypt.compare(password, user.password_hash);

         if (!isPasswordValid) {
            // Handle failed login
            await user.incrementLoginAttempts();

            if (user.login_attempts >= appConfig.security.maxLoginAttempts) {
               await user.lockAccount(appConfig.security.lockoutTimeMs);
               logAuth('ACCOUNT_LOCKED', user.id, null, {
                  loginAttempts: user.login_attempts,
                  lockedUntil: user.locked_until,
               });
            }

            logAuth('LOGIN_FAILED_INVALID_PASSWORD', user.id, null, {
               loginAttempts: user.login_attempts,
            });
            throw ErrorFactory.authentication('Invalid username or password', 'AUTH_001');
         }

         // Successful login - reset attempts and update last login
         await user.resetLoginAttempts();
         await user.updateLastLogin();

         logAuth('LOGIN_SUCCESS', user.id, null, {
            role: user.role,
            lastLogin: user.last_login_at,
         });

         // Return user data (exclude sensitive info)
         return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            last_login_at: user.last_login_at,
            profile: user.profile || {},
         };
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         logAuth('LOGIN_ERROR', null, null, { error: error.message });
         throw ErrorFactory.internal('An error occurred during login', 'AUTH_ERROR', { originalError: error.message });
      }
   }

   /**
    * Change system user password
    */
   async function changePassword(userId, currentPassword, newPassword) {
      try {
         const { getSystemModels } = require('../models');
         const { SystemUser } = await getSystemModels();

         const user = await SystemUser.findByPk(userId);
         if (!user) {
            throw ErrorFactory.notFound('User not found');
         }

         // Verify current password
         const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
         if (!isCurrentPasswordValid) {
            throw ErrorFactory.authentication('Current password is incorrect');
         }

         // Hash new password
         const saltRounds = appConfig.security.bcryptRounds;
         const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

         // Update password
         await user.update({ password_hash: newPasswordHash });

         logAuth('PASSWORD_CHANGED', userId, null, {});

         return { success: true, message: 'Password changed successfully' };
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw ErrorFactory.internal('Failed to change password', 'PASSWORD_CHANGE_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Create system user
    */
   async function createSystemUser(userData, createdBy) {
      try {
         const { getSystemModels } = require('../models');
         const { SystemUser } = await getSystemModels();

         // Check if username already exists
         const existingUser = await SystemUser.findOne({
            where: { username: userData.username.toLowerCase() },
         });

         if (existingUser) {
            throw ErrorFactory.conflict('Username already exists');
         }

         // Check if email already exists
         const existingEmail = await SystemUser.findOne({
            where: { email: userData.email.toLowerCase() },
         });

         if (existingEmail) {
            throw ErrorFactory.conflict('Email already exists');
         }

         // Hash password
         const saltRounds = appConfig.security.bcryptRounds;
         const passwordHash = await bcrypt.hash(userData.password, saltRounds);

         // Create user
         const user = await SystemUser.create({
            username: userData.username.toLowerCase(),
            email: userData.email.toLowerCase(),
            password_hash: passwordHash,
            full_name: userData.full_name,
            role: userData.role || 'SYSTEM_ADMIN',
            status: userData.status || 'ACTIVE',
            created_by: createdBy,
         });

         logSystem(`System user created: ${user.username}`, { userId: user.id, createdBy });

         // Return user data (exclude sensitive info)
         return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            profile: user.profile,
            created_at: user.created_at,
         };
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw ErrorFactory.internal('Failed to create system user', 'USER_CREATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   return {
      login,
      changePassword,
      createSystemUser,
   };
}

/**
 * Trust Service
 * Handles trust management operations
 */
function createTrustService() {
   /**
    * Create new trust
    */
   async function createTrust(trustData) {
      try {
         const { getTrustModel } = require('../models');
         const Trust = await getTrustModel();

         // Check if trust code already exists
         const existingTrustCode = await Trust.findOne({
            where: { trust_code: trustData.trust_code.toLowerCase() },
         });

         if (existingTrustCode) {
            throw ErrorFactory.conflict('Trust code already exists');
         }

         // Check if subdomain already exists
         const existingSubdomain = await Trust.findOne({
            where: { subdomain: trustData.subdomain.toLowerCase() },
         });

         if (existingSubdomain) {
            throw ErrorFactory.conflict('Subdomain already exists');
         }

         // Create trust
         const trust = await Trust.create({
            trust_name: trustData.trust_name,
            trust_code: trustData.trust_code.toLowerCase(),
            subdomain: trustData.subdomain.toLowerCase(),
            database_name: `school_erp_trust_${trustData.trust_code.toLowerCase()}`,
            contact_email: trustData.contact_email.toLowerCase(),
            contact_phone: trustData.contact_phone,
            address: trustData.address,
            tenant_config: trustData.tenant_config || {},
            status: 'SETUP_PENDING',
         });

         logSystem(`Trust created: ${trust.trust_name}`, { trustId: trust.id, trustCode: trust.trust_code });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw ErrorFactory.internal('Failed to create trust', 'TRUST_CREATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Get trust by ID or code
    */
   async function getTrust(identifier, field = 'id') {
      try {
         const { getTrustModel } = require('../models');
         const Trust = await getTrustModel();

         const whereClause = {};
         whereClause[field] = field === 'id' ? parseInt(identifier) : identifier;

         const trust = await Trust.findOne({ where: whereClause });

         if (!trust) {
            throw ErrorFactory.notFound(`Trust not found with ${field}: ${identifier}`);
         }

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw ErrorFactory.internal('Failed to get trust', 'TRUST_RETRIEVAL_ERROR', { originalError: error.message });
      }
   }

   /**
    * Update trust
    */
   async function updateTrust(trustId, updateData, updatedBy) {
      try {
         const { getTrustModel } = require('../models');
         const Trust = await getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw ErrorFactory.notFound('Trust not found');
         }

         // Check for conflicts if updating unique fields
         if (updateData.trust_code && updateData.trust_code !== trust.trust_code) {
            const existingTrustCode = await Trust.findOne({
               where: { trust_code: updateData.trust_code.toLowerCase() },
            });
            if (existingTrustCode && existingTrustCode.id !== trustId) {
               throw ErrorFactory.conflict('Trust code already exists');
            }
         }

         if (updateData.subdomain && updateData.subdomain !== trust.subdomain) {
            const existingSubdomain = await Trust.findOne({
               where: { subdomain: updateData.subdomain.toLowerCase() },
            });
            if (existingSubdomain && existingSubdomain.id !== trustId) {
               throw ErrorFactory.conflict('Subdomain already exists');
            }
         }

         // Update trust
         await trust.update(updateData);

         logSystem(`Trust updated: ${trust.trust_name}`, { trustId: trust.id, updatedBy });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw ErrorFactory.internal('Failed to update trust', 'TRUST_UPDATE_ERROR', { originalError: error.message });
      }
   }

   /**
    * List trusts with pagination and filtering
    */
   async function listTrusts(query = {}) {
      try {
         const { getTrustModel } = require('../models');
         const Trust = await getTrustModel();

         const { page = 1, limit = 10, status, search } = query;
         const offset = (page - 1) * limit;

         const whereClause = {};

         // Add status filter
         if (status) {
            whereClause.status = status;
         }

         // Add search filter
         if (search) {
            const { Op } = require('sequelize');
            whereClause[Op.or] = [
               { trust_name: { [Op.like]: `%${search}%` } },
               { trust_code: { [Op.like]: `%${search}%` } },
               { contact_email: { [Op.like]: `%${search}%` } },
            ];
         }

         const { count, rows } = await Trust.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
         });

         return {
            trusts: rows,
            pagination: {
               total: count,
               page: parseInt(page),
               limit: parseInt(limit),
               pages: Math.ceil(count / limit),
            },
         };
      } catch (error) {
         throw ErrorFactory.internal('Failed to list trusts', 'TRUST_LIST_ERROR', { originalError: error.message });
      }
   }

   /**
    * Complete trust setup
    */
   async function completeSetup(trustId, completedBy) {
      try {
         const { getTrustModel, initializeTenantModels } = require('../models');
         const { dbManager } = require('../models/database');
         const Trust = await getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw ErrorFactory.notFound('Trust not found');
         }

         if (trust.isSetupComplete()) {
            throw ErrorFactory.conflict('Trust setup is already complete');
         }

         // Ensure tenant database exists
         const dbExists = await dbManager.tenantDatabaseExists(trust.trust_code);
         if (!dbExists) {
            logSystem(`Creating tenant database for: ${trust.trust_code}`, { trustId: trust.id });
            await dbManager.createTenantDatabase(trust.trust_code);
         }

         // Initialize tenant models
         try {
            logSystem(`Initializing tenant models for: ${trust.trust_code}`, { trustId: trust.id });
            await initializeTenantModels(trust.trust_code);
            logSystem(`Tenant models initialized successfully for: ${trust.trust_code}`, { trustId: trust.id });
         } catch (modelError) {
            logError(modelError, {
               context: 'completeSetup',
               trustId: trust.id,
               trustCode: trust.trust_code,
               message: 'Failed to initialize tenant models',
            });
            // Don't throw error if models fail to initialize - they can be initialized later
         }

         // Mark setup as complete and activate trust
         await trust.markSetupComplete();

         logSystem(`Trust setup completed: ${trust.trust_name}`, { trustId: trust.id, completedBy });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw ErrorFactory.internal('Failed to complete trust setup', 'TRUST_SETUP_ERROR', {
            originalError: error.message,
         });
      }
   }

   return {
      createTrust,
      getTrust,
      updateTrust,
      listTrusts,
      completeSetup,
   };
}

// Create service instances
const systemAuthService = createSystemAuthService();
const trustService = createTrustService();

module.exports = {
   systemAuthService,
   trustService,
};
