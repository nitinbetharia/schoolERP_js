const bcrypt = require('bcryptjs');
const logger = require('../../../utils/logger');
const { ValidationError, NotFoundError, DuplicateError, AuthenticationError } = require('../../../utils/errors');

/**
 * User Service
 * Handles tenant user management operations
 */
class UserService {
   constructor() {
      this.defaultRoles = ['STUDENT', 'TEACHER', 'STAFF', 'PRINCIPAL', 'ADMIN'];
   }

   /**
    * Create a new tenant user
    */
   async createUser(tenantCode, userData, createdBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { User, UserProfile } = tenantModels;

         // Check if user already exists
         const existingUser = await User.findOne({
            where: { username: userData.username },
         });

         if (existingUser) {
            throw new DuplicateError('Username already exists in this tenant');
         }

         if (userData.email) {
            const existingEmail = await User.findOne({
               where: { email: userData.email },
            });

            if (existingEmail) {
               throw new DuplicateError('Email already exists in this tenant');
            }
         }

         // Hash password
         const saltRounds = 12;
         const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

         // Create user
         const user = await User.create({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || 'STUDENT',
            is_active: userData.is_active !== undefined ? userData.is_active : true,
            created_by: createdBy,
         });

         // Create user profile if profile data provided
         let profile = null;
         if (userData.profile) {
            profile = await UserProfile.create({
               user_id: user.id,
               ...userData.profile,
            });
         }

         logger.info('User Service Event', {
            service: 'user-service',
            category: 'USER',
            event: 'User created successfully',
            tenant_code: tenantCode,
            user_id: user.id,
            username: userData.username,
            role: user.role,
            created_by: createdBy,
         });

         return {
            user: {
               id: user.id,
               username: user.username,
               email: user.email,
               role: user.role,
               is_active: user.is_active,
               created_at: user.created_at,
            },
            profile: profile,
         };
      } catch (error) {
         logger.error('User Service Error', {
            service: 'user-service',
            category: 'ERROR',
            event: 'Failed to create user',
            tenant_code: tenantCode,
            username: userData.username,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get user by ID with profile
    */
   async getUserById(tenantCode, userId) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { User, UserProfile } = tenantModels;

         const user = await User.findByPk(userId, {
            include: [
               {
                  model: UserProfile,
                  as: 'profile',
                  required: false,
               },
            ],
            attributes: { exclude: ['password'] },
         });

         if (!user) {
            throw new NotFoundError('User not found');
         }

         return user;
      } catch (error) {
         logger.error('User Service Error', {
            service: 'user-service',
            category: 'ERROR',
            event: 'Failed to get user',
            tenant_code: tenantCode,
            user_id: userId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update user
    */
   async updateUser(tenantCode, userId, updateData, updatedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { User, UserProfile } = tenantModels;

         const user = await User.findByPk(userId);
         if (!user) {
            throw new NotFoundError('User not found');
         }

         // Check for duplicate username or email if being updated
         if (updateData.username && updateData.username !== user.username) {
            const existingUsername = await User.findOne({
               where: {
                  username: updateData.username,
                  id: { [require('sequelize').Op.ne]: userId },
               },
            });

            if (existingUsername) {
               throw new DuplicateError('Username already exists');
            }
         }

         if (updateData.email && updateData.email !== user.email) {
            const existingEmail = await User.findOne({
               where: {
                  email: updateData.email,
                  id: { [require('sequelize').Op.ne]: userId },
               },
            });

            if (existingEmail) {
               throw new DuplicateError('Email already exists');
            }
         }

         // Hash new password if provided
         if (updateData.password) {
            const saltRounds = 12;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
         }

         // Update user
         await user.update({
            ...updateData,
            updated_by: updatedBy,
         });

         // Update profile if profile data provided
         if (updateData.profile) {
            let profile = await UserProfile.findOne({ where: { user_id: userId } });

            if (profile) {
               await profile.update(updateData.profile);
            } else {
               await UserProfile.create({
                  user_id: userId,
                  ...updateData.profile,
               });
            }
         }

         logger.info('User Service Event', {
            service: 'user-service',
            category: 'USER',
            event: 'User updated successfully',
            tenant_code: tenantCode,
            user_id: userId,
            updated_by: updatedBy,
         });

         return await this.getUserById(tenantCode, userId);
      } catch (error) {
         logger.error('User Service Error', {
            service: 'user-service',
            category: 'ERROR',
            event: 'Failed to update user',
            tenant_code: tenantCode,
            user_id: userId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get all users with filters
    */
   async getUsers(tenantCode, filters = {}) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { User, UserProfile } = tenantModels;

         const where = {};
         if (filters.role) where.role = filters.role;
         if (filters.is_active !== undefined) where.is_active = filters.is_active;

         const users = await User.findAll({
            where,
            include: [
               {
                  model: UserProfile,
                  as: 'profile',
                  required: false,
               },
            ],
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
         });

         return users;
      } catch (error) {
         logger.error('User Service Error', {
            service: 'user-service',
            category: 'ERROR',
            event: 'Failed to get users',
            tenant_code: tenantCode,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Authenticate user
    */
   async authenticateUser(tenantCode, username, password) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { User, UserProfile } = tenantModels;

         const user = await User.findOne({
            where: {
               username: username,
               is_active: true,
            },
            include: [
               {
                  model: UserProfile,
                  as: 'profile',
                  required: false,
               },
            ],
         });

         if (!user) {
            throw new AuthenticationError('Invalid username or password');
         }

         const isValidPassword = await bcrypt.compare(password, user.password);
         if (!isValidPassword) {
            throw new AuthenticationError('Invalid username or password');
         }

         // Update last login
         await user.update({
            last_login_at: new Date(),
         });

         logger.info('User Service Event', {
            service: 'user-service',
            category: 'AUTH',
            event: 'User authenticated successfully',
            tenant_code: tenantCode,
            user_id: user.id,
            username: username,
         });

         return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            profile: user.profile,
            last_login_at: user.last_login_at,
         };
      } catch (error) {
         logger.error('User Service Error', {
            service: 'user-service',
            category: 'ERROR',
            event: 'User authentication failed',
            tenant_code: tenantCode,
            username: username,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Delete user (soft delete)
    */
   async deleteUser(tenantCode, userId, deletedBy) {
      try {
         const { getTenantModels } = require('../../../models');
         const tenantModels = await getTenantModels(tenantCode);
         const { User } = tenantModels;

         const user = await User.findByPk(userId);
         if (!user) {
            throw new NotFoundError('User not found');
         }

         await user.update({
            is_active: false,
            updated_by: deletedBy,
         });

         logger.info('User Service Event', {
            service: 'user-service',
            category: 'USER',
            event: 'User deleted successfully',
            tenant_code: tenantCode,
            user_id: userId,
            deleted_by: deletedBy,
         });

         return { message: 'User deleted successfully' };
      } catch (error) {
         logger.error('User Service Error', {
            service: 'user-service',
            category: 'ERROR',
            event: 'Failed to delete user',
            tenant_code: tenantCode,
            user_id: userId,
            error: error.message,
         });
         throw error;
      }
   }
}

module.exports = UserService;
