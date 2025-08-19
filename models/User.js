/**
 * User Model - Q&A Compliant Implementation
 * Following Q12 (sequelize.define), Q14 (INTEGER PK), Q16 (underscored), Q19 (Joi validation)
 * Following Q59 (Business constants - no hardcoded values)
 * Matches exactly with users table schema
 */

const { DataTypes } = require('sequelize');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

// Q59 Compliant: Use business constants instead of hardcoded values
const config = require('../config/index');
const constants = config.get('constants');

module.exports = sequelize => {
  // Q12 Compliant: Direct sequelize.define() (not class-based)
  const User = sequelize.define(
    'User',
    {
      // Q14 Compliant: INTEGER primary key
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // Employee identification
      employeeId: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        field: 'employee_id'
      },

      // Personal information
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name'
      },

      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name'
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },

      // Authentication
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
      },

      role: {
        type: DataTypes.ENUM(...constants.USER_ROLES.ALL_ROLES), // Q59: Use business constants
        allowNull: false,
        validate: {
          isIn: [constants.USER_ROLES.ALL_ROLES] // Q59: Use business constants
        }
      },

      status: {
        type: DataTypes.ENUM(...constants.USER_STATUS.ALL_STATUS), // Q59: Use business constants
        allowNull: false,
        defaultValue: constants.USER_STATUS.ACTIVE, // Q59: Use business constants
        validate: {
          isIn: [constants.USER_STATUS.ALL_STATUS] // Q59: Use business constants
        }
      },

      // School association (Q13: Foreign key for associations)
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'school_id',
        references: {
          model: 'schools',
          key: 'id'
        }
      },

      // Professional information
      department: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      designation: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      dateOfJoining: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_joining'
      },

      // Personal details
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth'
      },

      gender: {
        type: DataTypes.ENUM(...constants.GENDER.ALL_GENDERS),
        allowNull: true,
        validate: {
          isIn: [constants.GENDER.ALL_GENDERS]
        }
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      city: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      state: {
        type: DataTypes.STRING(100),
        allowNull: true
      },

      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'postal_code'
      },

      // Emergency contact
      emergencyContactName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'emergency_contact_name'
      },

      emergencyContactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'emergency_contact_phone'
      },

      // Security and tracking
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login'
      },

      lastActivity: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_activity'
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

      // Verification status
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'email_verified'
      },

      phoneVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'phone_verified'
      },

      // Q16 Compliant: Timestamps handled by Sequelize with underscored: true
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
      sequelize,
      modelName: 'User',
      tableName: 'users',
      // Q16 Compliant: underscored naming
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['email']
        },
        {
          unique: true,
          fields: ['employee_id']
        },
        {
          fields: ['role']
        },
        {
          fields: ['status']
        },
        {
          fields: ['school_id']
        }
      ]
    }
  );

  // Q19 Compliant: Joi validation schemas within model
  User.validationSchemas = {
    create: Joi.object({
      employeeId: Joi.string().max(20).optional().allow(null),
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().min(1).max(100).required(),
      email: Joi.string().email().max(255).required(),
      phone: Joi.string().max(20).optional().allow(null),
      password: Joi.string().min(8).max(100).required(),
      role: Joi.string()
        .valid(...constants.USER_ROLES.ALL_ROLES) // Q59: Use business constants
        .required(),
      status: Joi.string()
        .valid(...constants.USER_STATUS.ALL_STATUS) // Q59: Use business constants
        .default(constants.USER_STATUS.ACTIVE), // Q59: Use business constants
      schoolId: Joi.number().integer().positive().optional().allow(null),
      department: Joi.string().max(100).optional().allow(null),
      designation: Joi.string().max(100).optional().allow(null),
      dateOfJoining: Joi.date().optional().allow(null),
      dateOfBirth: Joi.date().max('now').optional().allow(null),
      gender: Joi.string()
        .valid(...constants.GENDER.ALL_GENDERS)
        .optional()
        .allow(null),
      address: Joi.string().optional().allow(null),
      city: Joi.string().max(100).optional().allow(null),
      state: Joi.string().max(100).optional().allow(null),
      postalCode: Joi.string().max(20).optional().allow(null),
      emergencyContactName: Joi.string().max(200).optional().allow(null),
      emergencyContactPhone: Joi.string().max(20).optional().allow(null)
    }),

    update: Joi.object({
      employeeId: Joi.string().max(20).optional().allow(null),
      firstName: Joi.string().min(1).max(100).optional(),
      lastName: Joi.string().min(1).max(100).optional(),
      email: Joi.string().email().max(255).optional(),
      phone: Joi.string().max(20).optional().allow(null),
      password: Joi.string().min(8).max(100).optional(),
      role: Joi.string()
        .valid(...constants.USER_ROLES.ALL_ROLES) // Q59: Use business constants
        .optional(),
      status: Joi.string()
        .valid(...constants.USER_STATUS.ALL_STATUS) // Q59: Use business constants
        .optional(),
      schoolId: Joi.number().integer().positive().optional().allow(null),
      department: Joi.string().max(100).optional().allow(null),
      designation: Joi.string().max(100).optional().allow(null),
      dateOfJoining: Joi.date().optional().allow(null),
      dateOfBirth: Joi.date().max('now').optional().allow(null),
      gender: Joi.string()
        .valid(...constants.GENDER.ALL_GENDERS)
        .optional()
        .allow(null),
      address: Joi.string().optional().allow(null),
      city: Joi.string().max(100).optional().allow(null),
      state: Joi.string().max(100).optional().allow(null),
      postalCode: Joi.string().max(20).optional().allow(null),
      emergencyContactName: Joi.string().max(200).optional().allow(null),
      emergencyContactPhone: Joi.string().max(20).optional().allow(null)
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  };

  // Q19 Compliant: Validation methods + Q57-Q58 Compliant: async/await + try-catch
  User.sanitizeInput = async function (data, schema = 'create') {
    try {
      const validationSchema = this.validationSchemas[schema];
      if (!validationSchema) {
        throw new Error(`Invalid validation schema: ${schema}`);
      }

      const { error, value } = validationSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => detail.message).join(', ');
        throw new Error(`Validation failed: ${details}`);
      }

      return value;
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('User input validation failed', {
        data: { ...data, password: '[REDACTED]' },
        schema,
        error: error.message
      });
      throw error;
    }
  };

  // Business logic methods with Q57-Q58 compliance
  User.hashPassword = async function (password) {
    try {
      // Q6 Compliant: bcryptjs with 12 salt rounds
      return await bcrypt.hash(password, 12);
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Password hashing failed', { error: error.message });
      throw new Error('Password hashing failed');
    }
  };

  User.prototype.validatePassword = async function (password) {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Password validation failed', { userId: this.id, error: error.message });
      throw new Error('Password validation failed');
    }
  };

  User.prototype.isLocked = function () {
    return (
      this.status === constants.USER_STATUS.LOCKED ||
      (this.lockedUntil && this.lockedUntil > new Date())
    );
  };

  User.prototype.incrementFailedAttempts = async function () {
    try {
      this.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts (Q&A decision)
      if (this.failedLoginAttempts >= 5) {
        this.status = constants.USER_STATUS.LOCKED;
        this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await this.save();

      const logger = require('../config/logger');
      logger.security('failed_login_attempts', 'medium', {
        userId: this.id,
        email: this.email,
        attempts: this.failedLoginAttempts,
        locked: this.status === constants.USER_STATUS.LOCKED
      });
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Failed to increment failed attempts', {
        userId: this.id,
        error: error.message
      });
      throw error;
    }
  };

  User.prototype.resetFailedAttempts = async function () {
    try {
      if (this.failedLoginAttempts > 0 || this.status === constants.USER_STATUS.LOCKED) {
        this.failedLoginAttempts = 0;
        this.status = constants.USER_STATUS.ACTIVE; // Q59: Use business constants
        this.lockedUntil = null;
        await this.save();

        const logger = require('../config/logger');
        logger.auth('account_unlocked', this.id, this.email);
      }
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Failed to reset failed attempts', { userId: this.id, error: error.message });
      throw error;
    }
  };

  User.findByEmail = async function (email) {
    try {
      return await User.findOne({
        where: { email: email.toLowerCase() },
        include: ['school'] // Q13: Include associations
      });
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Failed to find user by email', { email, error: error.message });
      throw error;
    }
  };

  User.findByEmployeeId = async function (employeeId) {
    try {
      return await User.findOne({
        where: { employeeId },
        include: ['school']
      });
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Failed to find user by employee ID', { employeeId, error: error.message });
      throw error;
    }
  };

  User.findActiveByRole = async function (role, schoolId = null) {
    try {
      const whereClause = {
        role,
        status: constants.USER_STATUS.ACTIVE // Q59: Use business constants
      };

      if (schoolId) {
        whereClause.schoolId = schoolId;
      }

      return await User.findAll({
        where: whereClause,
        include: ['school'],
        order: [
          ['firstName', 'ASC'],
          ['lastName', 'ASC']
        ]
      });
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('Failed to find active users by role', { role, schoolId, error: error.message });
      throw error;
    }
  };

  User.createUser = async function (userData) {
    try {
      const sanitized = await this.sanitizeInput(userData, 'create');

      const user = await this.create(sanitized);

      const logger = require('../config/logger');
      logger.business('user_created', 'User', user.id, {
        role: user.role,
        schoolId: user.schoolId
      });

      return user;
    } catch (error) {
      const logger = require('../config/logger');
      logger.error('User creation failed', {
        userData: { ...userData, password: '[REDACTED]' },
        error: error.message
      });
      throw error;
    }
  };

  // Q13 Compliant: Associations defined inline
  User.associate = models => {
    // User belongs to School
    User.belongsTo(models.School, {
      foreignKey: 'schoolId',
      as: 'school'
    });

    // User has many Student records (for parents)
    User.hasMany(models.Student, {
      foreignKey: 'parentId',
      as: 'children'
    });
  };

  return User;
};
