const { DataTypes } = require('sequelize');

/**
 * UserPermission Model
 * Manages granular user permissions for different modules and actions
 */

module.exports = (sequelize, _tenant) => {
   const UserPermission = sequelize.define(
      'UserPermission',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
         },
         user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'TenantUsers',
               key: 'id',
            },
         },
         module: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Module name (e.g., students, fees, reports)',
         },
         action: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Action name (e.g., create, read, update, delete, export)',
         },
         granted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: 'Whether permission is granted or denied',
         },
         granted_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
               model: 'TenantUsers',
               key: 'id',
            },
            comment: 'User who granted this permission',
         },
         granted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Permission expiration date (null = no expiry)',
         },
         conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional conditions for the permission (JSON)',
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'user_permissions',
         timestamps: false,
         indexes: [
            {
               name: 'idx_user_permission_user',
               fields: ['user_id'],
            },
            {
               name: 'idx_user_permission_module',
               fields: ['module'],
            },
            {
               name: 'idx_user_permission_lookup',
               fields: ['user_id', 'module', 'action'],
               unique: true,
            },
         ],
      }
   );

   // Instance Methods
   UserPermission.prototype.isExpired = function() {
      if (!this.expires_at) {
         return false;
      }
      return new Date() > new Date(this.expires_at);
   };

   UserPermission.prototype.isValid = function() {
      return this.granted && !this.isExpired();
   };

   // Class Methods
   UserPermission.checkPermission = async function(userId, module, action) {
      const permission = await this.findOne({
         where: {
            user_id: userId,
            module: module,
            action: action,
         },
      });

      if (!permission) {
         return false;
      }
      return permission.isValid();
   };

   UserPermission.getUserPermissions = async function(userId) {
      const permissions = await this.findAll({
         where: { user_id: userId },
         order: [['module', 'ASC'], ['action', 'ASC']],
      });

      const permissionMap = {};
      permissions.forEach(permission => {
         if (!permissionMap[permission.module]) {
            permissionMap[permission.module] = {};
         }
         permissionMap[permission.module][permission.action] = permission.isValid();
      });

      return permissionMap;
   };

   UserPermission.bulkSetPermissions = async function(userId, permissions, grantedBy) {
      const transaction = await sequelize.transaction();

      try {
         // Remove existing permissions
         await this.destroy({
            where: { user_id: userId },
            transaction,
         });

         // Add new permissions
         const permissionRecords = permissions.map(permission => ({
            user_id: userId,
            module: permission.module,
            action: permission.action,
            granted: permission.granted,
            granted_by: grantedBy,
            granted_at: new Date(),
            expires_at: permission.expiresAt || null,
            conditions: permission.conditions || null,
         }));

         const created = await this.bulkCreate(permissionRecords, { transaction });

         await transaction.commit();
         return created;

      } catch (error) {
         await transaction.rollback();
         throw error;
      }
   };

   // Hooks
   UserPermission.addHook('beforeSave', (permission, _options) => {
      permission.updated_at = new Date();
   });

   return UserPermission;
};
