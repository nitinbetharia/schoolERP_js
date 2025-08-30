const bcrypt = require('bcryptjs');
const { logAuth, logSystem, logError } = require('../utils/logger');
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

// Helper function to get system models
async function getSystemModels() {
   const { dbManager } = require('../models/system/database');
   const { defineSystemUserModel } = require('../models/system/SystemUser');
   const systemDB = await dbManager.getSystemDB();
   const SystemUser = defineSystemUserModel(systemDB);
   return { SystemUser };
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
         const { dbManager } = require('../models/system/database');
         const { defineSystemUserModel } = require('../models/system/SystemUser');
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
            throw createNotFoundError('User not found');
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

         logAuth('PASSWORD_CHANGED', userId);

         return { success: true };
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
   async function createSystemUser(userData, createdBy = null) {
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
         const crypto = require('crypto');

         const user = await SystemUser.findByPk(userId);
         if (!user) {
            throw createNotFoundError('User not found');
         }

         // Generate secure random token
         const token = crypto.randomBytes(32).toString('hex');
         const tokenExpiry = new Date(Date.now() + appConfig.security.passwordResetTokenExpiry);

         // Store token in user record
         await user.update({
            password_reset_token: token,
            password_reset_expires: tokenExpiry,
         });

         logAuth('PASSWORD_RESET_TOKEN_GENERATED', userId);

         return { token, expiry: tokenExpiry };
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to generate reset token', 'TOKEN_GENERATION_ERROR', {
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
               password_reset_token: token,
               password_reset_expires: {
                  [require('sequelize').Op.gt]: new Date(),
               },
            },
         });

         if (!user) {
            throw createValidationError('Invalid or expired reset token');
         }

         return user;
      } catch (error) {
         if (error.isOperational) {
            throw error;
         }
         throw createInternalError('Failed to validate reset token', 'TOKEN_VALIDATION_ERROR', {
            originalError: error.message,
         });
      }
   }

   /**
    * Reset password with token
    */
   async function resetPassword(token, newPassword) {
      try {
         // Validate token and get user
         const user = await validatePasswordResetToken(token);

         // Hash new password
         const saltRounds = appConfig.security.bcryptRounds;
         const passwordHash = await bcrypt.hash(newPassword, saltRounds);

         // Update password and clear reset token
         await user.update({
            password_hash: passwordHash,
            password_reset_token: null,
            password_reset_expires: null,
         });

         logAuth('PASSWORD_RESET_COMPLETED', user.id);

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

// Export the service factory
module.exports = { createSystemAuthService };
