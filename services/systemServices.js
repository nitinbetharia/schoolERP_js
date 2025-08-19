const { getTrustModel, getSystemUserModel } = require('../models');
const { passwordUtils, handleFailedLogin, handleSuccessfulLogin, checkAccountLock } = require('../middleware/auth');
const { logAuth, logBusiness, logError } = require('../utils/logger');
const {
   AuthenticationError,
   ValidationError,
   BusinessError,
   NotFoundError,
   DuplicateError,
} = require('../utils/errors');
const { dbManager } = require('../models/database');

/**
 * Trust management service
 */
class TrustService {
   /**
    * Create a new trust
    */
   async createTrust(trustData) {
      try {
         const Trust = getTrustModel();

         // Check for duplicates
         const { Op } = require('sequelize');
         const existingTrust = await Trust.findOne({
            where: {
               [Op.or]: [
                  { trust_code: trustData.trust_code },
                  { subdomain: trustData.subdomain },
                  { contact_email: trustData.contact_email },
               ],
            },
         });

         if (existingTrust) {
            if (existingTrust.trust_code === trustData.trust_code) {
               throw new DuplicateError('Trust code', trustData.trust_code);
            }
            if (existingTrust.subdomain === trustData.subdomain) {
               throw new DuplicateError('Subdomain', trustData.subdomain);
            }
            if (existingTrust.contact_email === trustData.contact_email) {
               throw new DuplicateError('Contact email', trustData.contact_email);
            }
         }

         // Create trust record
         const trust = await Trust.create(trustData);

         // Create tenant database
         await dbManager.createTenantDatabase(trust.trust_code);

         logBusiness('CREATE_TRUST', null, null, 'Trust', trust.id, {
            trust_name: trust.trust_name,
            trust_code: trust.trust_code,
         });

         return trust;
      } catch (error) {
         logError(error, { context: 'TrustService.createTrust', trustData });
         throw error;
      }
   }

   /**
    * Get trust by trust code or subdomain
    */
   async getTrust(identifier, field = 'trust_code') {
      try {
         const Trust = getTrustModel();

         const trust = await Trust.findOne({
            where: { [field]: identifier },
         });

         if (!trust) {
            throw new NotFoundError('Trust');
         }

         return trust;
      } catch (error) {
         logError(error, { context: 'TrustService.getTrust', identifier, field });
         throw error;
      }
   }

   /**
    * Update trust
    */
   async updateTrust(trustId, updateData, userId = null) {
      try {
         const Trust = getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw new NotFoundError('Trust');
         }

         const oldValues = { ...trust.dataValues };
         await trust.update(updateData);

         logBusiness('UPDATE_TRUST', userId, null, 'Trust', trustId, {
            before: oldValues,
            after: trust.dataValues,
         });

         return trust;
      } catch (error) {
         logError(error, { context: 'TrustService.updateTrust', trustId, updateData });
         throw error;
      }
   }

   /**
    * List all trusts with pagination
    */
   async listTrusts(options = {}) {
      try {
         const Trust = getTrustModel();

         const { page = 1, limit = 20, status = null, search = null } = options;

         const where = {};

         if (status) {
            where.status = status;
         }

         if (search) {
            const { Op } = require('sequelize');
            where[Op.or] = [
               { trust_name: { [Op.like]: `%${search}%` } },
               { trust_code: { [Op.like]: `%${search}%` } },
               { contact_email: { [Op.like]: `%${search}%` } },
            ];
         }

         const offset = (page - 1) * limit;

         const { rows: trusts, count: total } = await Trust.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
         });

         return {
            trusts,
            pagination: {
               total,
               page,
               limit,
               totalPages: Math.ceil(total / limit),
            },
         };
      } catch (error) {
         logError(error, { context: 'TrustService.listTrusts', options });
         throw error;
      }
   }

   /**
    * Mark trust setup as complete
    */
   async completeSetup(trustId, userId = null) {
      try {
         const Trust = getTrustModel();

         const trust = await Trust.findByPk(trustId);
         if (!trust) {
            throw new NotFoundError('Trust');
         }

         if (trust.isSetupComplete()) {
            throw new BusinessError('Trust setup is already completed');
         }

         await trust.markSetupComplete();

         logBusiness('COMPLETE_SETUP', userId, trust.trust_code, 'Trust', trustId, {
            setup_completed_at: trust.setup_completed_at,
            status: trust.status,
         });

         return trust;
      } catch (error) {
         logError(error, { context: 'TrustService.completeSetup', trustId });
         throw error;
      }
   }
}

/**
 * System authentication service
 */
class SystemAuthService {
   /**
    * Authenticate system user
    */
   async login(credentials) {
      try {
         const { username, password } = credentials;
         const SystemUser = getSystemUserModel();

         // Find user by username or email
         const { Op } = require('sequelize');
         const user = await SystemUser.findOne({
            where: {
               [Op.or]: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
            },
         });

         if (!user) {
            logAuth('LOGIN_FAILED_USER_NOT_FOUND', null, null, { username });
            throw new AuthenticationError('Invalid credentials');
         }

         // Check if account is locked
         await checkAccountLock(user);

         // Verify password
         const isValidPassword = await passwordUtils.verifyPassword(password, user.password_hash);

         if (!isValidPassword) {
            await handleFailedLogin(user);
            throw new AuthenticationError('Invalid credentials');
         }

         // Check if user is active
         if (!user.isActive()) {
            logAuth('LOGIN_BLOCKED_INACTIVE_USER', user.id, null, { status: user.status });
            throw new AuthenticationError('Account is inactive');
         }

         // Successful login
         await handleSuccessfulLogin(user);

         // Return user data (without password)
         const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            last_login_at: user.last_login_at,
            loginTime: new Date(),
            lastActivity: new Date(),
         };

         return userData;
      } catch (error) {
         logError(error, { context: 'SystemAuthService.login', username: credentials.username });
         throw error;
      }
   }

   /**
    * Create system user
    */
   async createSystemUser(userData, createdBy = null) {
      try {
         const SystemUser = getSystemUserModel();

         // Check for duplicates
         const { Op } = require('sequelize');
         const existingUser = await SystemUser.findOne({
            where: {
               [Op.or]: [{ username: userData.username }, { email: userData.email }],
            },
         });

         if (existingUser) {
            if (existingUser.username === userData.username) {
               throw new DuplicateError('Username', userData.username);
            }
            if (existingUser.email === userData.email) {
               throw new DuplicateError('Email', userData.email);
            }
         }

         // Hash password
         const passwordHash = await passwordUtils.hashPassword(userData.password);

         // Create user
         const user = await SystemUser.create({
            ...userData,
            password_hash: passwordHash,
            created_by: createdBy,
         });

         logBusiness('CREATE_SYSTEM_USER', createdBy, null, 'SystemUser', user.id, {
            username: user.username,
            email: user.email,
            role: user.role,
         });

         // Return user data (without password)
         const { password_hash, ...userWithoutPassword } = user.toJSON();
         return userWithoutPassword;
      } catch (error) {
         logError(error, { context: 'SystemAuthService.createSystemUser', userData });
         throw error;
      }
   }

   /**
    * Change system user password
    */
   async changePassword(userId, currentPassword, newPassword) {
      try {
         const SystemUser = getSystemUserModel();

         const user = await SystemUser.findByPk(userId);
         if (!user) {
            throw new NotFoundError('User');
         }

         // Verify current password
         const isValidPassword = await passwordUtils.verifyPassword(currentPassword, user.password_hash);
         if (!isValidPassword) {
            throw new AuthenticationError('Current password is incorrect');
         }

         // Hash new password
         const newPasswordHash = await passwordUtils.hashPassword(newPassword);

         // Update password
         await user.update({
            password_hash: newPasswordHash,
            password_changed_at: new Date(),
         });

         logAuth('PASSWORD_CHANGED', userId, null, { userId });

         return { success: true };
      } catch (error) {
         logError(error, { context: 'SystemAuthService.changePassword', userId });
         throw error;
      }
   }
}

// Export singleton instances
module.exports = {
   trustService: new TrustService(),
   systemAuthService: new SystemAuthService(),
};
