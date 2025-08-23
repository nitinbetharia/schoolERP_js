const { DataTypes } = require('sequelize');
const Joi = require('joi');
const { commonSchemas } = require('../utils/validation');

/**
 * Tenant User Model
 * Represents users within a specific tenant/trust database
 * Handles TRUST_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, etc.
 */
const defineTenantUserModel = (sequelize) => {
   const User = sequelize.define(
      'User',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },

         username: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
         },

         email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
               isEmail: true,
            },
         },

         password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
         },

         first_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },

         last_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
         },

         full_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
         },

         role: {
            type: DataTypes.STRING(50),
            allowNull: false,
            // Common roles: TRUST_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT, ACCOUNTANT
         },

         user_type: {
            type: DataTypes.ENUM('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF'),
            allowNull: true,
         },

         status: {
            type: DataTypes.STRING(20),
            defaultValue: 'ACTIVE',
         },

         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
         },

         phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
         },

         date_of_birth: {
            type: DataTypes.DATE,
            allowNull: true,
         },

         gender: {
            type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
            allowNull: true,
         },

         address: {
            type: DataTypes.TEXT,
            allowNull: true,
         },

         last_login_at: {
            type: DataTypes.DATE,
            allowNull: true,
         },

         created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },

         updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'users',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               fields: ['role'],
               name: 'idx_users_role',
            },
            {
               fields: ['user_type', 'is_active'],
               name: 'idx_users_type_active',
            },
            {
               fields: ['status'],
               name: 'idx_users_status',
            },
         ],
      }
   );

   // Instance methods
   User.prototype.isActive = function () {
      return this.is_active && this.status === 'ACTIVE';
   };

   User.prototype.getFullName = function () {
      if (this.full_name) {
         return this.full_name;
      }

      const parts = [];
      if (this.first_name) {
         parts.push(this.first_name);
      }
      if (this.last_name) {
         parts.push(this.last_name);
      }

      return parts.length > 0 ? parts.join(' ') : this.username || this.email;
   };

   return User;
};

/**
 * Tenant User Validation Schemas
 * Following Q59-ENFORCED pattern - reusable across API and web routes
 */
const tenantUserValidationSchemas = {
   login: Joi.object({
      username: Joi.string().trim().required().messages({
         'string.empty': 'Username/Email is required',
         'any.required': 'Username/Email is required',
      }),
      password: Joi.string().required().messages({
         'string.empty': 'Password is required',
         'any.required': 'Password is required',
      }),
   }),

   create: Joi.object({
      username: Joi.string().trim().min(3).max(100).optional().allow(null).messages({
         'string.min': 'Username must be at least 3 characters',
         'string.max': 'Username cannot exceed 100 characters',
      }),

      email: commonSchemas.email,

      password: commonSchemas.password,

      first_name: Joi.string().trim().min(2).max(100).optional().allow(null).messages({
         'string.min': 'First name must be at least 2 characters',
         'string.max': 'First name cannot exceed 100 characters',
      }),

      last_name: Joi.string().trim().min(2).max(100).optional().allow(null).messages({
         'string.min': 'Last name must be at least 2 characters',
         'string.max': 'Last name cannot exceed 100 characters',
      }),

      full_name: Joi.string().trim().min(2).max(200).optional().allow(null).messages({
         'string.min': 'Full name must be at least 2 characters',
         'string.max': 'Full name cannot exceed 200 characters',
      }),

      role: Joi.string().trim().max(50).required().messages({
         'string.empty': 'Role is required',
         'any.required': 'Role is required',
      }),

      user_type: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF').optional(),

      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').default('ACTIVE').optional(),

      phone: Joi.string()
         .pattern(/^\d{10,15}$/)
         .optional()
         .allow(null)
         .messages({
            'string.pattern.base': 'Phone number must be 10-15 digits',
         }),
   }),

   update: Joi.object({
      username: Joi.string().trim().min(3).max(100).optional(),

      email: Joi.string().email().max(255).optional(),

      first_name: Joi.string().trim().min(2).max(100).optional().allow(null),

      last_name: Joi.string().trim().min(2).max(100).optional().allow(null),

      full_name: Joi.string().trim().min(2).max(200).optional().allow(null),

      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),

      phone: Joi.string()
         .pattern(/^\d{10,15}$/)
         .optional()
         .allow(null),
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
   defineTenantUserModel,
   tenantUserValidationSchemas,
};
