const bcrypt = require('bcryptjs');
const { dbManager } = require('../../../models/system/database');
const { logger } = require('../../../utils/logger');
const { getPaginationData } = require('../../../utils/validation');

/**
 * User Service - Simple business logic functions
 * Converted from factory pattern to direct function exports
 * Handles user business logic for multi-tenant system
 */

/**
 * Create a new user
 */
async function createUser(tenantCode, userData) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      // Check if user already exists
      const existingUser = await User.findOne({
         where: { email: userData.email },
      });

      if (existingUser) {
         throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await User.create({
         ...userData,
         password_hash: hashedPassword,
         is_active: userData.is_active !== undefined ? userData.is_active : true,
      });

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
   } catch (error) {
      logger.error('Error in createUser service', {
         error: error.message,
         tenantCode,
         email: userData.email,
      });
      throw error;
   }
}

/**
 * Get user by ID
 */
async function getUserById(tenantCode, userId) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      const user = await User.findByPk(userId, {
         attributes: { exclude: ['password_hash'] },
      });

      return user;
   } catch (error) {
      logger.error('Error in getUserById service', {
         error: error.message,
         tenantCode,
         userId,
      });
      throw error;
   }
}

/**
 * Update user
 */
async function updateUser(tenantCode, userId, updateData) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      // Find user first
      const user = await User.findByPk(userId);
      if (!user) {
         throw new Error('User not found');
      }

      // If password is being updated, hash it
      if (updateData.password) {
         const saltRounds = 12;
         updateData.password_hash = await bcrypt.hash(updateData.password, saltRounds);
         delete updateData.password; // Remove plain password
      }

      // Update user
      await user.update(updateData);

      // Return updated user without password
      const { password_hash, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
   } catch (error) {
      logger.error('Error in updateUser service', {
         error: error.message,
         tenantCode,
         userId,
      });
      throw error;
   }
}

/**
 * Delete user (soft delete by setting inactive)
 */
async function deleteUser(tenantCode, userId) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      // Find user first
      const user = await User.findByPk(userId);
      if (!user) {
         throw new Error('User not found');
      }

      // Soft delete by marking as inactive
      await user.update({ is_active: false });

      return { message: 'User deactivated successfully' };
   } catch (error) {
      logger.error('Error in deleteUser service', {
         error: error.message,
         tenantCode,
         userId,
      });
      throw error;
   }
}

/**
 * List users with pagination and filtering
 */
async function listUsers(tenantCode, queryParams = {}) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      const { page = 1, limit = 20, role, status, search, sortBy = 'created_at', sortOrder = 'DESC' } = queryParams;

      // Build where conditions
      const whereConditions = {};

      if (role) {
         whereConditions.role = role;
      }

      if (status) {
         whereConditions.is_active = status === 'ACTIVE';
      }

      // Search functionality
      if (search) {
         const { Op } = require('sequelize');
         whereConditions[Op.or] = [{ username: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
      }

      const offset = (page - 1) * limit;

      // Get users with pagination
      const { rows: users, count: totalCount } = await User.findAndCountAll({
         where: whereConditions,
         attributes: { exclude: ['password_hash'] },
         order: [[sortBy, sortOrder.toUpperCase()]],
         limit: parseInt(limit),
         offset: offset,
      });

      // Get pagination data
      const paginationData = getPaginationData(page, limit, totalCount);

      return {
         users,
         pagination: paginationData.pagination,
      };
   } catch (error) {
      logger.error('Error in listUsers service', {
         error: error.message,
         tenantCode,
         queryParams,
      });
      throw error;
   }
}

/**
 * Authenticate user
 */
async function authenticateUser(tenantCode, username, password) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      // Find user by username or email
      const user = await User.findOne({
         where: {
            [require('sequelize').Op.or]: [{ username: username }, { email: username }],
         },
      });

      if (!user) {
         throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.is_active) {
         throw new Error('Account is disabled');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
         throw new Error('Invalid credentials');
      }

      // Update last login
      await user.update({ last_login_at: new Date() });

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
   } catch (error) {
      logger.error('Error in authenticateUser service', {
         error: error.message,
         tenantCode,
         username,
      });
      throw error;
   }
}

/**
 * Change user password
 */
async function changePassword(tenantCode, userId, newPassword) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      // Find user first
      const user = await User.findByPk(userId);
      if (!user) {
         throw new Error('User not found');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password_hash: hashedPassword });

      return { message: 'Password changed successfully' };
   } catch (error) {
      logger.error('Error in changePassword service', {
         error: error.message,
         tenantCode,
         userId,
      });
      throw error;
   }
}

/**
 * Get available user roles
 */
async function getUserRoles() {
   try {
      // Define roles (could be moved to config later)
      const roles = [
         { value: 'admin', label: 'Administrator' },
         { value: 'teacher', label: 'Teacher' },
         { value: 'student', label: 'Student' },
         { value: 'parent', label: 'Parent' },
      ];

      return roles;
   } catch (error) {
      logger.error('Error in getUserRoles service', error);
      throw error;
   }
}

/**
 * Get users by role (helper function)
 */
async function getUsersByRole(tenantCode, role) {
   try {
      const models = await dbManager.getTenantModels(tenantCode);
      const { User } = models;

      const users = await User.findAll({
         where: {
            role: role,
            is_active: true,
         },
         attributes: ['id', 'username', 'email', 'role'],
         order: [['username', 'ASC']],
      });

      return users;
   } catch (error) {
      logger.error('Error in getUsersByRole service', {
         error: error.message,
         tenantCode,
         role,
      });
      throw error;
   }
}

/**
 * Find user by email for password reset
 */
async function findUserByEmail(email, tenantId) {
   try {
      const models = await dbManager.getTenantModelsById(tenantId);
      const { User } = models;

      const user = await User.findOne({
         where: { email: email.toLowerCase() },
      });

      return user;
   } catch (error) {
      logger.error('Error in findUserByEmail service', {
         error: error.message,
         email,
         tenantId,
      });
      throw error;
   }
}

/**
 * Generate password reset token for tenant user
 */
async function generatePasswordResetToken(userId, tenantId) {
   try {
      const models = await dbManager.getTenantModelsById(tenantId);
      const { User } = models;

      const user = await User.findByPk(userId);
      if (!user) {
         throw new Error('User not found');
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

      logger.info('Password reset token generated for tenant user', {
         userId,
         tenantId,
         tokenExpires: resetTokenExpires,
      });

      return resetToken;
   } catch (error) {
      logger.error('Error in generatePasswordResetToken service', {
         error: error.message,
         userId,
         tenantId,
      });
      throw error;
   }
}

/**
 * Validate password reset token for tenant user
 */
async function validatePasswordResetToken(token, tenantId) {
   try {
      const models = await dbManager.getTenantModelsById(tenantId);
      const { User } = models;

      const user = await User.findOne({
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
      logger.error('Error in validatePasswordResetToken service', {
         error: error.message,
         token: token?.substring(0, 10),
         tenantId,
      });
      throw error;
   }
}

/**
 * Reset password using token for tenant user
 */
async function resetPassword(token, newPassword, tenantId) {
   try {
      const models = await dbManager.getTenantModelsById(tenantId);
      const { User } = models;

      // Validate token first
      const resetData = await validatePasswordResetToken(token, tenantId);
      if (!resetData) {
         throw new Error('Invalid or expired password reset token');
      }

      const { user } = resetData;

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await user.update({
         password_hash: newPasswordHash,
         reset_token: null,
         reset_token_expires: null,
         // Reset login attempts on successful password reset (if these fields exist)
         login_attempts: 0,
      });

      logger.info('Password reset completed for tenant user', {
         userId: user.id,
         email: user.email,
         tenantId,
      });

      // Send success email
      const emailService = require('../../../services/emailService');
      const { dbManager: dbMgr } = require('../../../models/system/database');
      const tenant = await dbMgr.getTenantById(tenantId);
      await emailService.sendPasswordResetSuccessEmail(user, tenant);

      return {
         success: true,
         user: {
            id: user.id,
            email: user.email,
            name: user.name || user.full_name,
         },
      };
   } catch (error) {
      logger.error('Error in resetPassword service', {
         error: error.message,
         token: token?.substring(0, 10),
         tenantId,
      });
      throw error;
   }
}

// Direct function exports (no factory pattern)
module.exports = {
   createUser,
   getUserById,
   updateUser,
   deleteUser,
   listUsers,
   authenticateUser,
   changePassword,
   getUserRoles,
   getUsersByRole,
   findUserByEmail,
   generatePasswordResetToken,
   validatePasswordResetToken,
   resetPassword,
};
