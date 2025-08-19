/**
 * SystemUser Model - System Database Entity
 * 
 * Q1: Uses Sequelize ORM (not raw MySQL)
 * Q12: Uses sequelize.define() (not class-based)
 * Q14: Uses INTEGER primary key for system entities
 * Q16: Snake_case database, camelCase JavaScript
 * Q19: Joi validation schemas within model file
 * Q33: RESTRICT foreign keys with user-friendly errors
 * Q59: Uses business constants instead of hardcoded values
 * 
 * SystemUser represents super admin users who manage the entire system
 * - Has access to all trusts and system-level operations
 * - Different from trust-level users (User model)
 * - Used for system administration and developer access
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const config = require('../../../config');
const constants = config.get('constants');

/**
 * SystemUser Model Definition
 * @param {Sequelize} sequelize - System sequelize instance
 * @returns {Model} SystemUser model
 */
function createSystemUserModel(sequelize) {
  const SystemUser = sequelize.define(
    'SystemUser',
    {
      // Primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Authentication fields
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 100],
          isAlphanumeric: true
        }
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },

      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
      },

      // Personal information
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
        validate: {
          len: [1, 100]
        }
      },

      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
        validate: {
          len: [1, 100]
        }
      },

      // Role and permissions
      role: {
        type: DataTypes.ENUM(...constants.SYSTEM_USER_ROLES.ALL_ROLES),
        allowNull: false,
        defaultValue: constants.SYSTEM_USER_ROLES.SYSTEM_ADMIN,
        validate: {
          isIn: [constants.SYSTEM_USER_ROLES.ALL_ROLES]
        }
      },

      permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional granular permissions'
      },

      // Status and security
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },

      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
      },

      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'failed_login_attempts'
      },

      lockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'locked_until'
      },

      // Password reset functionality
      passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'password_reset_token'
      },

      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'password_reset_expires'
      },

      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      // Model options
      tableName: 'system_users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      
      // Indexes for performance
      indexes: [
        {
          fields: ['email']
        },
        {
          fields: ['username']
        },
        {
          fields: ['role']
        },
        {
          fields: ['is_active']
        },
        {
          fields: ['last_login']
        }
      ],

      // Hooks for password hashing
      hooks: {
        beforeCreate: async (user) => {
          if (user.passwordHash) {
            // Q17: Use 12 salt rounds for bcrypt
            user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('passwordHash')) {
            // Q17: Use 12 salt rounds for bcrypt
            user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
          }
        }
      }
    }
  );

  // Q13 Compliance: Define associations
  SystemUser.associate = (models) => {
    // SystemUser has many SystemAuditLogs
    if (models.SystemAuditLog) {
      SystemUser.hasMany(models.SystemAuditLog, {
        foreignKey: 'userId',
        as: 'auditLogs',
        scope: { userType: 'SYSTEM_USER' },
        onDelete: 'SET NULL'
      });
    }
  };

  // Instance methods
  SystemUser.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    // Remove sensitive fields from JSON output
    delete values.passwordHash;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    return values;
  };

  SystemUser.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
  };

  SystemUser.prototype.isLocked = function() {
    return this.lockedUntil && this.lockedUntil > new Date();
  };

  SystemUser.prototype.incrementFailedAttempts = async function() {
    const maxAttempts = 5;
    const lockTime = 30 * 60 * 1000; // 30 minutes

    this.failedLoginAttempts += 1;
    
    if (this.failedLoginAttempts >= maxAttempts) {
      this.lockedUntil = new Date(Date.now() + lockTime);
    }
    
    await this.save();
  };

  SystemUser.prototype.resetFailedAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.lastLogin = new Date();
    await this.save();
  };

  // Class methods
  SystemUser.findByEmail = async function(email) {
    return await this.findOne({
      where: { 
        email: email.toLowerCase(),
        isActive: true
      }
    });
  };

  SystemUser.findByUsername = async function(username) {
    return await this.findOne({
      where: { 
        username: username,
        isActive: true
      }
    });
  };

  return SystemUser;
}

// Q19 Compliance: Joi validation schemas
const systemUserValidationSchemas = {
  create: Joi.object({
    username: Joi.string().min(3).max(100).alphanum().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    role: Joi.string().valid(...constants.SYSTEM_USER_ROLES.ALL_ROLES).default(constants.SYSTEM_USER_ROLES.SYSTEM_ADMIN),
    permissions: Joi.object().optional(),
    isActive: Joi.boolean().default(true)
  }),

  update: Joi.object({
    email: Joi.string().email().optional(),
    firstName: Joi.string().min(1).max(100).optional(),
    lastName: Joi.string().min(1).max(100).optional(),
    role: Joi.string().valid(...constants.SYSTEM_USER_ROLES.ALL_ROLES).optional(),
    permissions: Joi.object().optional(),
    isActive: Joi.boolean().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  })
};

module.exports = createSystemUserModel;
module.exports.validationSchemas = systemUserValidationSchemas;
