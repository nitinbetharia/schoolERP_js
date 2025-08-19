const { DataTypes } = require('sequelize');
const Joi = require('joi');
const { commonSchemas } = require('../utils/errors');
const { USER_ROLES, USER_STATUS, VALIDATION } = require('../config/business-constants');

/**
 * System User model definition for system database
 * Represents system administrators and global users
 */
const defineSystemUserModel = (sequelize) => {
   const SystemUser = sequelize.define(
      'SystemUser',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Primary key for system user',
         },

         username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: 'Unique username for system access',
         },

         email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
               isEmail: true,
            },
            comment: 'Email address for system user',
         },

         password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'bcrypt hashed password',
         },

         full_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Full name of the system user',
         },

         role: {
            type: DataTypes.ENUM(USER_ROLES.SYSTEM_ADMIN),
            defaultValue: USER_ROLES.SYSTEM_ADMIN,
            comment: 'System user role (only SYSTEM_ADMIN allowed)',
         },

         status: {
            type: DataTypes.ENUM(...Object.values(USER_STATUS)),
            defaultValue: USER_STATUS.ACTIVE,
            comment: 'User account status',
         },

         last_login_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last login timestamp',
         },

         login_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Failed login attempts counter',
         },

         locked_until: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Account lock expiry timestamp',
         },

         password_changed_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Last password change timestamp',
         },

         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID of user who created this account',
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Record creation timestamp',
         },

         updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Record last update timestamp',
         },
      },
      {
         tableName: 'system_users',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               unique: true,
               fields: ['username'],
               name: 'idx_system_users_username',
            },
            {
               unique: true,
               fields: ['email'],
               name: 'idx_system_users_email',
            },
            {
               fields: ['status'],
               name: 'idx_system_users_status',
            },
         ],
         hooks: {
            beforeValidate: (user) => {
               if (user.username) {
                  user.username = user.username.toLowerCase().trim();
               }
               if (user.email) {
                  user.email = user.email.toLowerCase().trim();
               }
            },
         },
      }
   );

   // Instance methods
   SystemUser.prototype.isActive = function () {
      return this.status === USER_STATUS.ACTIVE;
   };

   SystemUser.prototype.isLocked = function () {
      return this.locked_until && this.locked_until > new Date();
   };

   SystemUser.prototype.incrementLoginAttempts = function () {
      this.login_attempts += 1;
      return this.save();
   };

   SystemUser.prototype.resetLoginAttempts = function () {
      this.login_attempts = 0;
      this.locked_until = null;
      return this.save();
   };

   SystemUser.prototype.lockAccount = function (lockDurationMs = 15 * 60 * 1000) {
      this.locked_until = new Date(Date.now() + lockDurationMs);
      return this.save();
   };

   SystemUser.prototype.updateLastLogin = function () {
      this.last_login_at = new Date();
      return this.save();
   };

   // Associations
   SystemUser.associate = function (models) {
      // Self-reference for created_by
      SystemUser.belongsTo(models.SystemUser, {
         foreignKey: 'created_by',
         as: 'creator',
      });
   };

   return SystemUser;
};

/**
 * System Audit Log model for tracking system-level operations
 */
const defineSystemAuditLogModel = (sequelize) => {
   const SystemAuditLog = sequelize.define(
      'SystemAuditLog',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Primary key for audit log entry',
         },

         user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID of system user who performed the action',
         },

         action: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Action performed (e.g., CREATE, UPDATE, DELETE)',
         },

         entity_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Type of entity affected (e.g., Trust, SystemUser)',
         },

         entity_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'ID of the affected entity',
         },

         changes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'JSON object containing before/after values',
         },

         ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
            comment: 'IP address from which action was performed',
         },

         user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'User agent string',
         },

         metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional metadata about the operation',
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: 'Audit log entry timestamp',
         },
      },
      {
         tableName: 'system_audit_logs',
         timestamps: false,
         indexes: [
            {
               fields: ['user_id'],
               name: 'idx_audit_user_id',
            },
            {
               fields: ['action', 'created_at'],
               name: 'idx_audit_action_time',
            },
            {
               fields: ['entity_type', 'entity_id'],
               name: 'idx_audit_entity',
            },
         ],
      }
   );

   // Associations
   SystemAuditLog.associate = function (models) {
      SystemAuditLog.belongsTo(models.SystemUser, {
         foreignKey: 'user_id',
         as: 'user',
      });
   };

   return SystemAuditLog;
};

/**
 * Validation schemas for System User model
 */
const systemUserValidationSchemas = {
   create: Joi.object({
      username: Joi.string()
         .trim()
         .lowercase()
         .min(3)
         .max(50)
         .pattern(/^[a-z0-9_-]+$/)
         .required()
         .messages({
            'string.empty': 'Username is required',
            'string.pattern.base': 'Username can only contain lowercase letters, numbers, hyphens and underscores',
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username cannot exceed 50 characters',
         }),

      email: commonSchemas.email,

      password: commonSchemas.password,

      full_name: Joi.string()
         .trim()
         .min(VALIDATION.NAME_MIN_LENGTH)
         .max(200)
         .required()
         .messages({
            'string.empty': 'Full name is required',
            'string.min': `Full name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`,
            'string.max': 'Full name cannot exceed 200 characters',
         }),
   }),

   update: Joi.object({
      email: Joi.string().email().max(255).optional(),

      full_name: Joi.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(200).optional(),

      status: Joi.string()
         .valid(...Object.values(USER_STATUS))
         .optional(),
   }),

   login: Joi.object({
      username: Joi.string().trim().required(),
      password: Joi.string().required(),
   }),

   changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: commonSchemas.password,
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
         'any.only': 'Password confirmation does not match',
      }),
   }),
};

module.exports = {
   defineSystemUserModel,
   defineSystemAuditLogModel,
   systemUserValidationSchemas,
};
