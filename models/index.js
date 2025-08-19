const { dbManager } = require('./database');
const { defineTrustModel } = require('./Trust');
const { defineSystemUserModel, defineSystemAuditLogModel } = require('./SystemUser');
const { defineSetupConfiguration } = require('../modules/setup/models/SetupConfiguration');
const { defineUserProfile } = require('../modules/user/models/UserProfile');
const { logger, logSystem, logError } = require('../utils/logger');

/**
 * Model registry for system and tenant databases
 * Manages model definitions and associations
 */
class ModelRegistry {
   constructor() {
      this.systemModels = {};
      this.tenantModels = new Map();
      this.initialized = false;
   }

   /**
    * Initialize system models
    */
   async initializeSystemModels() {
      try {
         if (this.initialized) {
            return this.systemModels;
         }

         logSystem('Initializing system models');

         // Get system database connection
         const systemDB = await dbManager.initializeSystemDB();

         // Define system models
         this.systemModels.Trust = defineTrustModel(systemDB);
         this.systemModels.SystemUser = defineSystemUserModel(systemDB);
         this.systemModels.SystemAuditLog = defineSystemAuditLogModel(systemDB);
         this.systemModels.SetupConfiguration = defineSetupConfiguration(systemDB);

         // Set up associations
         this.setupSystemAssociations();

         // Sync database schema in development
         if (process.env.NODE_ENV === 'development') {
            await systemDB.sync({ alter: true });
            logSystem('System database schema synchronized');
         }

         this.initialized = true;
         logSystem('System models initialized successfully');

         return this.systemModels;
      } catch (error) {
         logError(error, { context: 'initializeSystemModels' });
         throw error;
      }
   }

   /**
    * Setup system model associations
    */
   setupSystemAssociations() {
      const { Trust, SystemUser, SystemAuditLog } = this.systemModels;

      // SystemUser associations
      if (SystemUser.associate) {
         SystemUser.associate(this.systemModels);
      }

      // SystemAuditLog associations
      if (SystemAuditLog.associate) {
         SystemAuditLog.associate(this.systemModels);
      }

      logSystem('System model associations configured');
   }

   /**
    * Get system models
    */
   getSystemModels() {
      if (!this.initialized) {
         throw new Error('System models not initialized');
      }
      return this.systemModels;
   }

   /**
    * Initialize tenant models for a specific tenant
    */
   async initializeTenantModels(tenantCode) {
      try {
         logSystem(`Initializing tenant models for: ${tenantCode}`);

         // Get tenant database connection
         const tenantDB = await dbManager.getTenantDB(tenantCode);

         // Define tenant models (will be expanded in later phases)
         const tenantModels = {
            // User model (tenant-specific users)
            User: this.defineTenantUserModel(tenantDB),

            // User profile model
            UserProfile: defineUserProfile(tenantDB),

            // Audit log for tenant operations
            AuditLog: this.defineTenantAuditLogModel(tenantDB),
         };

         // Set up tenant associations
         this.setupTenantAssociations(tenantModels);

         // Sync database schema in development
         if (process.env.NODE_ENV === 'development') {
            await tenantDB.sync({ alter: true });
            logSystem(`Tenant database schema synchronized for: ${tenantCode}`);
         }

         // Store tenant models
         this.tenantModels.set(tenantCode, tenantModels);

         logSystem(`Tenant models initialized successfully for: ${tenantCode}`);
         return tenantModels;
      } catch (error) {
         logError(error, { context: 'initializeTenantModels', tenantCode });
         throw error;
      }
   }

   /**
    * Define tenant user model (Phase 2B expansion)
    */
   defineTenantUserModel(sequelize) {
      const { DataTypes } = require('sequelize');
      const { USER_ROLES, USER_STATUS } = require('../config/business-constants');

      return sequelize.define(
         'User',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
            },
            username: {
               type: DataTypes.STRING(100),
               allowNull: false,
               unique: true,
            },
            email: {
               type: DataTypes.STRING(255),
               allowNull: true,
               unique: true,
               validate: { isEmail: true },
            },
            password: {
               type: DataTypes.STRING(255),
               allowNull: false,
            },
            role: {
               type: DataTypes.STRING(50),
               allowNull: false,
               defaultValue: 'STUDENT',
               validate: {
                  isIn: [['STUDENT', 'TEACHER', 'STAFF', 'PRINCIPAL', 'ADMIN', 'TRUST_ADMIN']],
               },
            },
            is_active: {
               type: DataTypes.BOOLEAN,
               defaultValue: true,
            },
            last_login_at: {
               type: DataTypes.DATE,
               allowNull: true,
            },
            created_by: {
               type: DataTypes.INTEGER,
               allowNull: true,
            },
            updated_by: {
               type: DataTypes.INTEGER,
               allowNull: true,
            },
         },
         {
            tableName: 'users',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
         }
      );
   }

   /**
    * Define tenant audit log model
    */
   defineTenantAuditLogModel(sequelize) {
      const { DataTypes } = require('sequelize');

      return sequelize.define(
         'AuditLog',
         {
            id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
            },
            user_id: {
               type: DataTypes.INTEGER,
               allowNull: true,
            },
            action: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            entity_type: {
               type: DataTypes.STRING(100),
               allowNull: false,
            },
            entity_id: {
               type: DataTypes.STRING(50),
               allowNull: true,
            },
            changes: {
               type: DataTypes.JSON,
               allowNull: true,
            },
            ip_address: {
               type: DataTypes.STRING(45),
               allowNull: true,
            },
            metadata: {
               type: DataTypes.JSON,
               allowNull: true,
            },
         },
         {
            tableName: 'audit_logs',
            timestamps: false,
            createdAt: 'created_at',
         }
      );
   }

   /**
    * Setup tenant model associations
    */
   setupTenantAssociations(tenantModels) {
      const { User, UserProfile, AuditLog } = tenantModels;

      // User has one UserProfile
      User.hasOne(UserProfile, {
         foreignKey: 'user_id',
         as: 'profile',
      });

      // UserProfile belongs to User
      UserProfile.belongsTo(User, {
         foreignKey: 'user_id',
         as: 'user',
      });

      // AuditLog belongs to User
      AuditLog.belongsTo(User, {
         foreignKey: 'user_id',
         as: 'user',
      });

      // User has many AuditLogs
      User.hasMany(AuditLog, {
         foreignKey: 'user_id',
         as: 'auditLogs',
      });
   }

   /**
    * Get tenant models for a specific tenant
    */
   getTenantModels(tenantCode) {
      if (!this.tenantModels.has(tenantCode)) {
         throw new Error(`Tenant models not initialized for: ${tenantCode}`);
      }
      return this.tenantModels.get(tenantCode);
   }

   /**
    * Health check for model registry
    */
   async healthCheck() {
      const health = {
         systemModels: Object.keys(this.systemModels).length,
         tenantModels: this.tenantModels.size,
         initialized: this.initialized,
         activeTenants: Array.from(this.tenantModels.keys()),
      };

      return health;
   }
}

// Create singleton instance
const modelRegistry = new ModelRegistry();

// Export convenience functions
module.exports = {
   ModelRegistry,
   modelRegistry,

   // System model getters
   getSystemModels: () => modelRegistry.getSystemModels(),
   getTrustModel: () => modelRegistry.getSystemModels().Trust,
   getSystemUserModel: () => modelRegistry.getSystemModels().SystemUser,
   getSystemAuditLogModel: () => modelRegistry.getSystemModels().SystemAuditLog,

   // Tenant model getters
   getTenantModels: (tenantCode) => modelRegistry.getTenantModels(tenantCode),

   // Initialize functions
   initializeSystemModels: () => modelRegistry.initializeSystemModels(),
   initializeTenantModels: (tenantCode) => modelRegistry.initializeTenantModels(tenantCode),
};
