const { DataTypes } = require('sequelize');

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

module.exports = {
   defineTenantUserModel,
};
