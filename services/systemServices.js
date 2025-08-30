const bcrypt = require('bcryptjs');
const { logSystem, logAuth, logError } = require('../utils/logger');
const appConfig = require('../config/app-config.json');
const {
   createValidationError,
   createNotFoundError,
   createConflictError,
   createAuthenticationError,
   createAuthorizationError,
   createInternalError,
   createDatabaseError,
} = require('../utils/errorHelpers');

async function initializeTenantModelsHelper(trustCode) {
   const { dbManager } = require('../models/database');
   return await dbManager.initializeTenantModels(trustCode);
}

// Helper function to get system models
async function getSystemModels() {
   const { dbManager } = require('../models/database');
   const { defineSystemUserModel } = require('../models/SystemUser');
   const systemDB = await dbManager.getSystemDB();
   const SystemUser = defineSystemUserModel(systemDB);
   return { SystemUser };
}

async function getTrustModel() {
   const { dbManager } = require('../models/database');
   const { defineTrustModel } = require('../models/Trust');
   const systemDB = await dbManager.getSystemDB();
   const Trust = defineTrustModel(systemDB);
   return Trust;
}

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

         // Get system database and models
         const { dbManager } = require('../models/database');
         const { defineSystemUserModel } = require('../models/SystemUser');
         const systemDB = await dbManager.getSystemDB();
         const SystemUser = defineSystemUserModel(systemDB);

         // Find user by username
         const user = await SystemUser.findOne({
            where: { username: username.toLowerCase() },
         });

         if (!user) {
            logAuth('LOGIN_FAILED_USER_NOT_FOUND', null, null, { username });
            const error = new Error('Invalid username or password');
            error.statusCode = 401;
            error.code = 'AUTH_001';
            error.userMessage = 'Invalid username or password. Please check your credentials.';
            throw error;
         }

         // Check if account is locked
         if (user.isLocked()) {
            logAuth('LOGIN_BLOCKED_ACCOUNT_LOCKED', user.id, null, {
               lockedUntil: user.locked_until,
               loginAttempts: user.login_attempts,
            });
            const error = new Error('Account is temporarily locked due to multiple failed login attempts');
            error.statusCode = 401;
            error.code = 'AUTH_ACCOUNT_LOCKED';
            error.userMessage = 'Account locked due to failed attempts. Try again later.';
            throw error;
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
            const error = new Error('Invalid username or password');
            error.statusCode = 401;
            error.code = 'AUTH_001';
            error.userMessage = 'Invalid username or password. Please check your credentials.';
            throw error;
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
            full_name: user.full_name,
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
         const err = new Error('An error occurred during login');
         err.statusCode = 500;
         err.code = 'AUTH_ERROR';
         err.originalError = error.message;
         throw err;
      }
   }

   /**
    * Change system user password
    */
   async function changePassword(userId, currentPassword, newPassword) {
      try {
         // Get system models using helper function
         const { SystemUser } = await getSystemModels();

         const user = await SystemUser.findByPk(userId);
         if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
         }

         // Verify current password
         const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
         if (!isCurrentPasswordValid) {
            throw createAuthenticationError('Current password is incorrect');
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
         throw createInternalError('Failed to change password', 'PASSWORD_CHANGE_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Create system user
    */
   async function createSystemUser(userData, createdBy) {
      try {
         // Get system models using helper function
         const { SystemUser } = await getSystemModels();

         // Check if username already exists
         const existingUser = await SystemUser.findOne({
            where: { username: userData.username.toLowerCase() },
         });

         if (existingUser) {
            throw createConflictError('Username already exists');
         }

         // Check if email already exists
         const existingEmail = await SystemUser.findOne({
            where: { email: userData.email.toLowerCase() },
         });

         if (existingEmail) {
            throw createConflictError('Email already exists');
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

         logSystem(`System user created: ${user.username}`, {
            userId: user.id,
            createdBy,
         });

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
         throw createInternalError('Failed to create system user', 'USER_CREATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Update system user profile
    */
   async function updateProfile(userId, updateData) {
      try {
         // Get system models using helper function
         const { SystemUser } = await getSystemModels();

         const [updatedCount] = await SystemUser.update(updateData, {
            where: { id: userId },
            returning: true,
         });

         if (updatedCount === 0) {
            throw createAuthorizationError('User not found or unauthorized');
         }

         const updatedUser = await SystemUser.findByPk(userId, {
            attributes: { exclude: ['password_hash'] },
         });

         logSystem('PROFILE_UPDATED', userId, { updatedFields: Object.keys(updateData) });
         return updatedUser;
      } catch (error) {
         logError(error, { context: 'updateProfile', userId, updateData });
         throw error;
      }
   }

   /**
    * Find user by email for password reset
    */
   async function findUserByEmail(email) {
      try {
         const { SystemUser } = await getSystemModels();
         
         const user = await SystemUser.findOne({
            where: { email: email.toLowerCase() },
         });

         return user;
      } catch (error) {
         logError(error, { context: 'findUserByEmail', email });
         throw createDatabaseError('Failed to find user by email', 'FIND_USER_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Generate password reset token
    */
   async function generatePasswordResetToken(userId) {
      try {
         const { SystemUser } = await getSystemModels();
         
         const user = await SystemUser.findByPk(userId);
         if (!user) {
            throw createNotFoundError('User not found');
         }

         // Generate token (random string)
         const crypto = require('crypto');
         const resetToken = crypto.randomBytes(32).toString('hex');
         
         // Set expiration (30 minutes from now)
         const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

         // Update user with reset token
         await user.update({
            reset_token: resetToken,
            reset_token_expires: resetTokenExpires,
         });

         logSystem('Password reset token generated', {
            userId,
            tokenExpires: resetTokenExpires,
         });

         return resetToken;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         logError(error, { context: 'generatePasswordResetToken', userId });
         throw createInternalError('Failed to generate password reset token', 'TOKEN_GENERATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Validate password reset token
    */
   async function validatePasswordResetToken(token) {
      try {
         const { SystemUser } = await getSystemModels();
         
         const user = await SystemUser.findOne({
            where: {
               reset_token: token,
               reset_token_expires: {
                  [require('sequelize').Op.gt]: new Date(),
               },
            },
         });

         if (!user) {
            return null; // Invalid or expired token
         }

         return { user, token };
      } catch (error) {
         logError(error, { context: 'validatePasswordResetToken', token: token?.substring(0, 10) });
         throw createDatabaseError('Failed to validate password reset token', 'TOKEN_VALIDATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Reset password using token
    */
   async function resetPassword(token, newPassword) {
      try {
         const { SystemUser } = await getSystemModels();
         
         // Validate token first
         const resetData = await validatePasswordResetToken(token);
         if (!resetData) {
            throw createAuthenticationError('Invalid or expired password reset token');
         }

         const { user } = resetData;

         // Hash new password
         const saltRounds = appConfig.security.bcryptRounds;
         const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

         // Update password and clear reset token
         await user.update({
            password_hash: newPasswordHash,
            reset_token: null,
            reset_token_expires: null,
            // Reset login attempts on successful password reset
            login_attempts: 0,
            locked_until: null,
         });

         logSystem('Password reset completed', {
            userId: user.id,
            email: user.email,
         });

         // Send success email
         const emailService = require('./emailService');
         await emailService.sendPasswordResetSuccessEmail(user);

         return {
            success: true,
            user: {
               id: user.id,
               email: user.email,
               name: user.full_name,
            },
         };
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         logError(error, { context: 'resetPassword', token: token?.substring(0, 10) });
         throw createInternalError('Failed to reset password', 'PASSWORD_RESET_ERROR', {
            originalError: error.message,
         });
      }
   }

   return {
      login,
      changePassword,
      createSystemUser,
      updateProfile,
      findUserByEmail,
      generatePasswordResetToken,
      validatePasswordResetToken,
      resetPassword,
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
         // Get trust model using helper function
         const Trust = await getTrustModel();

         // Check if trust code already exists
         const existingTrustCode = await Trust.findOne({
            where: { trust_code: trustData.trust_code.toLowerCase() },
         });

         if (existingTrustCode) {
            throw createConflictError('Trust code already exists');
         }

         // Check if subdomain already exists
         const existingSubdomain = await Trust.findOne({
            where: { subdomain: trustData.subdomain.toLowerCase() },
         });

         if (existingSubdomain) {
            throw createConflictError('Subdomain already exists');
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

         logSystem(`Trust created: ${trust.trust_name}`, {
            trustId: trust.id,
            trustCode: trust.trust_code,
         });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to create trust', 'TRUST_CREATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Get trust by ID or code
    */
   async function getTrust(identifier, field = 'id') {
      try {
         // Get trust model using helper function
         const Trust = await getTrustModel();

         const whereClause = {};
         whereClause[field] = field === 'id' ? parseInt(identifier) : identifier;

         const trust = await Trust.findOne({ where: whereClause });

         if (!trust) {
            const err = new Error(`Trust not found with ${field}: ${identifier}`);
            err.statusCode = 404;
            throw err;
         }

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to get trust', 'TRUST_RETRIEVAL_ERROR', { originalError: error.message });
      }
   }

   /**
    * Update trust
    */
   async function updateTrust(trustId, updateData, updatedBy) {
      try {
         // Get trust model using helper function
         const Trust = await getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            const err = new Error('Trust not found');
            err.statusCode = 404;
            throw err;
         }

         // Check for conflicts if updating unique fields
         if (updateData.trust_code && updateData.trust_code !== trust.trust_code) {
            const existingTrustCode = await Trust.findOne({
               where: { trust_code: updateData.trust_code.toLowerCase() },
            });
            if (existingTrustCode && existingTrustCode.id !== trustId) {
               throw createConflictError('Trust code already exists');
            }
         }

         if (updateData.subdomain && updateData.subdomain !== trust.subdomain) {
            const existingSubdomain = await Trust.findOne({
               where: { subdomain: updateData.subdomain.toLowerCase() },
            });
            if (existingSubdomain && existingSubdomain.id !== trustId) {
               throw createConflictError('Subdomain already exists');
            }
         }

         // Update trust
         await trust.update(updateData);

         logSystem(`Trust updated: ${trust.trust_name}`, {
            trustId: trust.id,
            updatedBy,
         });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to update trust', 'TRUST_UPDATE_ERROR', { originalError: error.message });
      }
   }

   /**
    * List trusts with pagination and filtering
    */
   async function listTrusts(query = {}) {
      try {
         // Get trust model using helper function
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
         throw createInternalError('Failed to list trusts', 'TRUST_LIST_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Complete trust setup
    */
   async function completeSetup(trustId, completedBy) {
      try {
         // Get trust model using helper function
         const { dbManager } = require('../models/database');
         const Trust = await getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            const err = new Error('Trust not found');
            err.statusCode = 404;
            throw err;
         }

         if (trust.isSetupComplete()) {
            throw createConflictError('Trust setup is already complete');
         }

         // Ensure tenant database exists
         const dbExists = await dbManager.tenantDatabaseExists(trust.trust_code);
         if (!dbExists) {
            logSystem(`Creating tenant database for: ${trust.trust_code}`, {
               trustId: trust.id,
            });
            await dbManager.createTenantDatabase(trust.trust_code);
         }

         // Initialize tenant models
         try {
            logSystem(`Initializing tenant models for: ${trust.trust_code}`, {
               trustId: trust.id,
            });
            // Initialize tenant models using helper function
            await initializeTenantModelsHelper(trust.trust_code);
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

         logSystem(`Trust setup completed: ${trust.trust_name}`, {
            trustId: trust.id,
            completedBy,
         });

         return trust;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to complete trust setup', 'TRUST_SETUP_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Get system statistics for dashboard
    */
   async function getSystemStats() {
      try {
         // Get trust model using helper function
         // Get system models using helper function
         const { dbManager } = require('../models/database');

         const Trust = await getTrustModel();
         const { SystemUser } = await getSystemModels();

         // Get trust statistics
         const totalTrusts = await Trust.count();
         const activeTrusts = await Trust.count({ where: { status: 'ACTIVE' } });
         const pendingTrusts = await Trust.count({ where: { status: 'SETUP_PENDING' } });

         // Get system user count
         const totalSystemUsers = await SystemUser.count();
         const activeSystemUsers = await SystemUser.count({ where: { status: 'ACTIVE' } });

         // Get database health
         const dbHealth = await dbManager.healthCheck();

         return {
            totalTrusts,
            activeTrusts,
            pendingTrusts,
            totalSystemUsers,
            activeUsers: activeSystemUsers,
            systemHealth: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
            databaseStatus: dbHealth.database ? 'connected' : 'disconnected',
            lastUpdated: new Date().toISOString(),
         };
      } catch (error) {
         logError(error, { context: 'getSystemStats' });

         // Return safe defaults on error
         return {
            totalTrusts: 0,
            activeTrusts: 0,
            pendingTrusts: 0,
            totalSystemUsers: 0,
            activeUsers: 0,
            systemHealth: 'unhealthy',
            databaseStatus: 'disconnected',
            lastUpdated: new Date().toISOString(),
            error: 'Unable to retrieve system statistics',
         };
      }
   }

   return {
      createTrust,
      getTrust,
      updateTrust,
      listTrusts,
      completeSetup,
      getSystemStats,
   };
}

// Create service instances
const systemAuthService = createSystemAuthService();
const trustService = createTrustService();

module.exports = {
   systemAuthService,
   trustService,
};
