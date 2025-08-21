const createUserService = require("../services/UserService");
const {
  ErrorFactory,
  formatSuccessResponse,
  validators,
  commonSchemas,
} = require("../../../utils/errors");
const { logger } = require("../../../utils/logger");

/**
 * User Controller
 * Handles HTTP requests for tenant user management
 */
function createUserController() {
  const userService = createUserService();

  /**
   * Create a new user
   * POST /api/users
   */
  async function createUser(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const userData = req.body;
      const createdBy = req.user ? req.user.id : null;

      // Add creator info
      userData.created_by = createdBy;

      const user = await userService.createUser(tenantCode, userData);

      res
        .status(201)
        .json(formatSuccessResponse(user, "User created successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async function getUserById(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const userId = req.params.id;

      const user = await userService.getUserById(tenantCode, userId);

      res.json(formatSuccessResponse(user, "User retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async function updateUser(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const userId = req.params.id;
      const updateData = req.body;

      const user = await userService.updateUser(tenantCode, userId, updateData);

      res.json(formatSuccessResponse(user, "User updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  async function deleteUser(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const userId = req.params.id;

      const result = await userService.deleteUser(tenantCode, userId);

      res.json(formatSuccessResponse(result, "User deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * List users with filtering and pagination
   * GET /api/users
   */
  async function listUsers(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const query = req.query;

      const result = await userService.listUsers(tenantCode, query);

      res.json(
        formatSuccessResponse(result.users, "Users retrieved successfully", {
          pagination: result.pagination,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate user
   * POST /api/users/auth/login
   */
  async function authenticateUser(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const { username, password } = req.body;

      const user = await userService.authenticateUser(
        tenantCode,
        username,
        password,
      );

      // Set session
      req.session.user = user;
      req.session.userType = "tenant";
      req.session.tenantCode = tenantCode;

      res.json(formatSuccessResponse(user, "Authentication successful"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/users/auth/logout
   */
  async function logoutUser(req, res, next) {
    try {
      if (req.session) {
        req.session.destroy();
      }

      res.json(formatSuccessResponse(null, "Logout successful"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/users/profile
   */
  async function getCurrentUser(req, res, next) {
    try {
      res.json(
        formatSuccessResponse(req.user, "Current user retrieved successfully"),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/users/change-password
   */
  async function changePassword(req, res, next) {
    try {
      const tenantCode = req.tenantCode;
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Authenticate current password first
      await userService.authenticateUser(
        tenantCode,
        req.user.username,
        currentPassword,
      );

      // Update with new password
      await userService.updateUser(tenantCode, userId, {
        password: newPassword,
      });

      res.json(formatSuccessResponse(null, "Password changed successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user roles
   * GET /api/users/roles
   */
  async function getUserRoles(req, res, next) {
    try {
      res.json(
        formatSuccessResponse(
          userService.defaultRoles,
          "User roles retrieved successfully",
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  return {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    listUsers,
    authenticateUser,
    logoutUser,
    getCurrentUser,
    changePassword,
    getUserRoles,
  };
}

module.exports = createUserController;
