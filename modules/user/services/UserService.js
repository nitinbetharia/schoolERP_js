const bcrypt = require("bcryptjs");
const { logger } = require("../../../utils/logger");
const {
  ErrorFactory,
  // Legacy classes for backward compatibility
  ValidationError,
  NotFoundError,
  DuplicateError,
  AuthenticationError,
} = require("../../../utils/errors");

/**
 * User Service
 * Handles tenant user management operations
 */
function createUserService() {
  const defaultRoles = ["STUDENT", "TEACHER", "STAFF", "PRINCIPAL", "ADMIN"];

  /**
   * Create a new user
   */
  async function createUser(tenantCode, userData) {
    try {
      const { getTenantModels } = require("../../../models");
      const models = await getTenantModels(tenantCode);
      const { User, UserProfile } = models;

      // Check if username already exists
      const existingUser = await User.findOne({
        where: { username: userData.username.toLowerCase() },
      });

      if (existingUser) {
        throw ErrorFactory.conflict("Username already exists in this tenant");
      }

      // Check if email already exists
      const existingEmail = await User.findOne({
        where: { email: userData.email.toLowerCase() },
      });

      if (existingEmail) {
        throw ErrorFactory.conflict("Email already exists in this tenant");
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await User.create({
        username: userData.username.toLowerCase(),
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        role: userData.role || "USER",
        status: userData.status || "ACTIVE",
        tenant_code: tenantCode,
        created_by: userData.created_by,
      });

      // Create user profile if provided
      let profile = null;
      if (userData.profile) {
        profile = await UserProfile.create({
          user_id: user.id,
          ...userData.profile,
        });
      }

      logger.info("User Service Info", {
        service: "user-service",
        category: "USER_CREATION",
        event: "User created successfully",
        tenant_code: tenantCode,
        user_id: user.id,
        username: userData.username,
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: profile,
        created_at: user.created_at,
      };
    } catch (error) {
      logger.error("User Service Error", {
        service: "user-service",
        category: "ERROR",
        event: "Failed to create user",
        tenant_code: tenantCode,
        username: userData.username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async function getUserById(tenantCode, userId) {
    try {
      const { getTenantModels } = require("../../../models");
      const models = await getTenantModels(tenantCode);
      const { User, UserProfile } = models;

      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserProfile,
            as: "profile",
          },
        ],
      });

      if (!user) {
        throw ErrorFactory.notFound("User not found");
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      logger.error("User Service Error", {
        service: "user-service",
        category: "ERROR",
        event: "Failed to get user by ID",
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
  async function updateUser(tenantCode, userId, updateData) {
    try {
      const { getTenantModels } = require("../../../models");
      const models = await getTenantModels(tenantCode);
      const { User, UserProfile } = models;

      const user = await User.findByPk(userId);
      if (!user) {
        throw ErrorFactory.notFound("User not found");
      }

      // Check for username conflicts if updating username
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await User.findOne({
          where: { username: updateData.username.toLowerCase() },
        });
        if (existingUser && existingUser.id !== userId) {
          throw ErrorFactory.conflict("Username already exists in this tenant");
        }
      }

      // Check for email conflicts if updating email
      if (updateData.email && updateData.email !== user.email) {
        const existingEmail = await User.findOne({
          where: { email: updateData.email.toLowerCase() },
        });
        if (existingEmail && existingEmail.id !== userId) {
          throw ErrorFactory.conflict("Email already exists in this tenant");
        }
      }

      // Hash password if updating
      if (updateData.password) {
        const saltRounds = 12;
        updateData.password_hash = await bcrypt.hash(
          updateData.password,
          saltRounds,
        );
        delete updateData.password;
      }

      // Update user
      await user.update(updateData);

      // Update profile if provided
      if (updateData.profile) {
        const [profile] = await UserProfile.findOrCreate({
          where: { user_id: userId },
          defaults: { user_id: userId, ...updateData.profile },
        });
        await profile.update(updateData.profile);
      }

      logger.info("User Service Info", {
        service: "user-service",
        category: "USER_UPDATE",
        event: "User updated successfully",
        tenant_code: tenantCode,
        user_id: userId,
      });

      return await getUserById(tenantCode, userId);
    } catch (error) {
      logger.error("User Service Error", {
        service: "user-service",
        category: "ERROR",
        event: "Failed to update user",
        tenant_code: tenantCode,
        user_id: userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  async function authenticateUser(tenantCode, username, password) {
    try {
      const { getTenantModels } = require("../../../models");
      const models = await getTenantModels(tenantCode);
      const { User, UserProfile } = models;

      const user = await User.findOne({
        where: { username: username.toLowerCase() },
        include: [
          {
            model: UserProfile,
            as: "profile",
          },
        ],
      });

      if (!user) {
        throw ErrorFactory.authentication("Invalid username or password");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw ErrorFactory.authentication("Invalid username or password");
      }

      if (user.status !== "ACTIVE") {
        throw ErrorFactory.authentication("User account is not active");
      }

      // Update last login
      await user.update({ last_login_at: new Date() });

      logger.info("User Service Info", {
        service: "user-service",
        category: "AUTHENTICATION",
        event: "User authenticated successfully",
        tenant_code: tenantCode,
        user_id: user.id,
        username: user.username,
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        last_login_at: user.last_login_at,
      };
    } catch (error) {
      logger.error("User Service Error", {
        service: "user-service",
        category: "ERROR",
        event: "User authentication failed",
        tenant_code: tenantCode,
        username: username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async function deleteUser(tenantCode, userId) {
    try {
      const { getTenantModels } = require("../../../models");
      const models = await getTenantModels(tenantCode);
      const { User, UserProfile } = models;

      const user = await User.findByPk(userId);
      if (!user) {
        throw ErrorFactory.notFound("User not found");
      }

      // Delete user profile first
      await UserProfile.destroy({ where: { user_id: userId } });

      // Delete user
      await user.destroy();

      logger.info("User Service Info", {
        service: "user-service",
        category: "USER_DELETION",
        event: "User deleted successfully",
        tenant_code: tenantCode,
        user_id: userId,
      });

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      logger.error("User Service Error", {
        service: "user-service",
        category: "ERROR",
        event: "Failed to delete user",
        tenant_code: tenantCode,
        user_id: userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List users with pagination and filtering
   */
  async function listUsers(tenantCode, query = {}) {
    try {
      const { getTenantModels } = require("../../../models");
      const models = await getTenantModels(tenantCode);
      const { User, UserProfile } = models;

      const { page = 1, limit = 10, role, status, search } = query;
      const offset = (page - 1) * limit;

      const whereClause = {};

      if (role) whereClause.role = role;
      if (status) whereClause.status = status;
      if (search) {
        const { Op } = require("sequelize");
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: UserProfile,
            as: "profile",
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      return {
        users: rows.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          profile: user.profile,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
        })),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error("User Service Error", {
        service: "user-service",
        category: "ERROR",
        event: "Failed to list users",
        tenant_code: tenantCode,
        error: error.message,
      });
      throw error;
    }
  }

  return {
    createUser,
    getUserById,
    updateUser,
    authenticateUser,
    deleteUser,
    listUsers,
    defaultRoles,
  };
}

module.exports = createUserService;
