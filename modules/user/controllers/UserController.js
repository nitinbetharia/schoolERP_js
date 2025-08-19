const UserService = require('../services/UserService');
const { ValidationError, NotFoundError, DuplicateError, AuthenticationError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * User Controller
 * Handles HTTP requests for tenant user management
 */
class UserController {
   constructor() {
      this.userService = new UserService();
   }

   /**
    * Create a new user
    */
   async createUser(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const userData = req.body;
         const createdBy = req.user ? req.user.id : null;

         // Basic validation
         if (!userData.username) {
            throw new ValidationError('Username is required');
         }

         if (!userData.password || userData.password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters long');
         }

         const result = await this.userService.createUser(tenantCode, userData, createdBy);

         logger.info('User Controller Event', {
            service: 'user-controller',
            category: 'USER',
            event: 'User creation request processed',
            tenant_code: tenantCode,
            username: userData.username,
            created_by: createdBy,
         });

         res.status(201).json({
            success: true,
            data: result,
            message: 'User created successfully',
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'User creation failed',
            error: error.message,
         });

         const statusCode = error instanceof ValidationError ? 400 : error instanceof DuplicateError ? 409 : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Get user by ID
    */
   async getUserById(req, res) {
      try {
         const { user_id } = req.params;
         const tenantCode = req.tenantCode;

         if (!user_id || isNaN(user_id)) {
            throw new ValidationError('Valid user ID is required');
         }

         const user = await this.userService.getUserById(tenantCode, parseInt(user_id));

         res.status(200).json({
            success: true,
            data: user,
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'Get user failed',
            error: error.message,
         });

         const statusCode = error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Update user
    */
   async updateUser(req, res) {
      try {
         const { user_id } = req.params;
         const tenantCode = req.tenantCode;
         const updateData = req.body;
         const updatedBy = req.user ? req.user.id : null;

         if (!user_id || isNaN(user_id)) {
            throw new ValidationError('Valid user ID is required');
         }

         // Validate password if being updated
         if (updateData.password && updateData.password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters long');
         }

         const result = await this.userService.updateUser(tenantCode, parseInt(user_id), updateData, updatedBy);

         logger.info('User Controller Event', {
            service: 'user-controller',
            category: 'USER',
            event: 'User update request processed',
            tenant_code: tenantCode,
            user_id: user_id,
            updated_by: updatedBy,
         });

         res.status(200).json({
            success: true,
            data: result,
            message: 'User updated successfully',
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'User update failed',
            error: error.message,
         });

         const statusCode =
            error instanceof ValidationError
               ? 400
               : error instanceof NotFoundError
                 ? 404
                 : error instanceof DuplicateError
                   ? 409
                   : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Get all users with filters
    */
   async getUsers(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const filters = {
            role: req.query.role,
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0,
         };

         const users = await this.userService.getUsers(tenantCode, filters);

         res.status(200).json({
            success: true,
            data: users,
            meta: {
               total: users.length,
               limit: filters.limit,
               offset: filters.offset,
            },
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'Get users failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * User authentication
    */
   async authenticateUser(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const { username, password } = req.body;

         if (!username || !password) {
            throw new ValidationError('Username and password are required');
         }

         const user = await this.userService.authenticateUser(tenantCode, username, password);

         // Set session
         req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            tenantCode: tenantCode,
         };

         logger.info('User Controller Event', {
            service: 'user-controller',
            category: 'AUTH',
            event: 'User authentication request processed',
            tenant_code: tenantCode,
            username: username,
         });

         res.status(200).json({
            success: true,
            data: {
               user: user,
               session: req.session.user,
            },
            message: 'Authentication successful',
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'User authentication failed',
            error: error.message,
         });

         const statusCode = error instanceof ValidationError ? 400 : error instanceof AuthenticationError ? 401 : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * User logout
    */
   async logoutUser(req, res) {
      try {
         const tenantCode = req.tenantCode;
         const username = req.session.user ? req.session.user.username : 'unknown';

         req.session.destroy((err) => {
            if (err) {
               logger.error('User Controller Error', {
                  service: 'user-controller',
                  category: 'ERROR',
                  event: 'Session destruction failed',
                  error: err.message,
               });
               return res.status(500).json({
                  success: false,
                  error: 'Failed to logout',
               });
            }

            logger.info('User Controller Event', {
               service: 'user-controller',
               category: 'AUTH',
               event: 'User logout successful',
               tenant_code: tenantCode,
               username: username,
            });

            res.status(200).json({
               success: true,
               message: 'Logout successful',
            });
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'User logout failed',
            error: error.message,
         });

         res.status(500).json({
            success: false,
            error: error.message,
         });
      }
   }

   /**
    * Delete user
    */
   async deleteUser(req, res) {
      try {
         const { user_id } = req.params;
         const tenantCode = req.tenantCode;
         const deletedBy = req.user ? req.user.id : null;

         if (!user_id || isNaN(user_id)) {
            throw new ValidationError('Valid user ID is required');
         }

         const result = await this.userService.deleteUser(tenantCode, parseInt(user_id), deletedBy);

         logger.info('User Controller Event', {
            service: 'user-controller',
            category: 'USER',
            event: 'User deletion request processed',
            tenant_code: tenantCode,
            user_id: user_id,
            deleted_by: deletedBy,
         });

         res.status(200).json({
            success: true,
            data: result,
         });
      } catch (error) {
         logger.error('User Controller Error', {
            service: 'user-controller',
            category: 'ERROR',
            event: 'User deletion failed',
            error: error.message,
         });

         const statusCode = error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : 500;

         res.status(statusCode).json({
            success: false,
            error: error.message,
         });
      }
   }
}

module.exports = UserController;
