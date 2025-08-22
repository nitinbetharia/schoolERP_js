const Joi = require('joi');
const { dbManager } = require('./database');
const { defineTrustModel } = require('./Trust');
const {
   defineSystemUserModel,
   defineSystemAuditLogModel,
} = require('./SystemUser');
const { defineStudentModel, studentValidationSchemas } = require('./Student');
const { logger, logSystem, logError } = require('../utils/logger');

/**
 * Simplified Model Registry
 * Centralized model management for multi-tenant system
 * Removed factory patterns and modular imports
 */

class ModelRegistry {
   constructor() {
      this.systemModels = new Map();
      this.tenantModels = new Map();
      this.initialized = false;
   }

   /**
    * Initialize system models (Trust, SystemUser)
    */
   async initializeSystemModels() {
      try {
         const systemConnection = await dbManager.getSystemDB();
         
         // Initialize system models
         const Trust = defineTrustModel(systemConnection);
         const SystemUser = defineSystemUserModel(systemConnection);
         const SystemAuditLog = defineSystemAuditLogModel(systemConnection);

         // Set up associations
         Trust.hasMany(SystemUser, { foreignKey: 'trust_id' });
         SystemUser.belongsTo(Trust, { foreignKey: 'trust_id' });

         // Store system models
         this.systemModels.set('Trust', Trust);
         this.systemModels.set('SystemUser', SystemUser);
         this.systemModels.set('SystemAuditLog', SystemAuditLog);

         logSystem('System models initialized successfully');
         return true;
      } catch (error) {
         logError(error, { context: 'initializeSystemModels' });
         throw error;
      }
   }

   /**
    * Initialize tenant models for specific tenant
    */
   async initializeTenantModels(tenantCode) {
      try {
         const tenantConnection = await dbManager.getTenantDB(tenantCode);
         
         // Initialize tenant models
         const Student = defineStudentModel(tenantConnection);

         // Store tenant models
         if (!this.tenantModels.has(tenantCode)) {
            this.tenantModels.set(tenantCode, new Map());
         }
         
         this.tenantModels.get(tenantCode).set('Student', Student);

         logSystem(`Tenant models initialized for ${tenantCode}`);
         return true;
      } catch (error) {
         logError(error, { context: 'initializeTenantModels', tenantCode });
         throw error;
      }
   }

   /**
    * Get system model by name
    */
   getSystemModel(modelName) {
      const model = this.systemModels.get(modelName);
      if (!model) {
         throw new Error(`System model '${modelName}' not found`);
      }
      return model;
   }

   /**
    * Get tenant model by name and tenant code
    */
   getTenantModel(tenantCode, modelName) {
      const tenantModels = this.tenantModels.get(tenantCode);
      if (!tenantModels) {
         throw new Error(`Tenant models for '${tenantCode}' not initialized`);
      }
      
      const model = tenantModels.get(modelName);
      if (!model) {
         throw new Error(`Tenant model '${modelName}' not found for tenant '${tenantCode}'`);
      }
      return model;
   }

   /**
    * Initialize all models
    */
   async initialize() {
      if (this.initialized) {
         return true;
      }

      try {
         // Initialize system models first
         await this.initializeSystemModels();
         
         this.initialized = true;
         logSystem('Model registry initialized successfully');
         return true;
      } catch (error) {
         logError(error, { context: 'ModelRegistry.initialize' });
         throw error;
      }
   }

   /**
    * Health check
    */
   async healthCheck() {
      try {
         const systemHealth = {
            modelsLoaded: this.systemModels.size,
            modelNames: Array.from(this.systemModels.keys())
         };

         const tenantHealth = {
            tenantsLoaded: this.tenantModels.size,
            tenantCodes: Array.from(this.tenantModels.keys())
         };

         return {
            system: systemHealth,
            tenants: tenantHealth,
            initialized: this.initialized
         };
      } catch (error) {
         logError(error, { context: 'ModelRegistry.healthCheck' });
         throw error;
      }
   }
}

// Create singleton instance
const modelRegistry = new ModelRegistry();

// Export validation schemas for direct use
const validationSchemas = {
   student: studentValidationSchemas,
   // Add other validation schemas as needed
};

module.exports = {
   modelRegistry,
   dbManager,
   validationSchemas,
   
   // Direct model definitions for backward compatibility
   defineTrustModel,
   defineSystemUserModel,
   defineSystemAuditLogModel,
   defineStudentModel,
   
   // Validation schemas
   studentValidationSchemas,
   
   // System initialization function for backward compatibility
   initializeSystemModels: () => modelRegistry.initialize(),
};