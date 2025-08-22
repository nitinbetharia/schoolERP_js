const TenantConfigurationService = require('../services/TenantConfigurationService');
const { logger } = require('../utils/logger');

/**
 * Tenant Configuration Middleware
 * Loads tenant configuration and makes it available in request context
 */
const tenantConfigurationMiddleware = async (req, res, next) => {
   try {
      // Skip if no tenant context is available
      if (!req.tenant || !req.tenant.id) {
         return next();
      }

      // Skip if system database is not available
      if (!req.systemDb) {
         logger.warn('System database not available in request context');
         return next();
      }

      const trustId = req.tenant.id;

      // Load tenant configuration
      const tenantConfig = await TenantConfigurationService.getTenantConfiguration(trustId, req.systemDb);

      // Add configuration to request context
      req.tenantConfig = tenantConfig;

      // Add helper methods to request
      req.getCustomFields = async (entityType) => {
         return await TenantConfigurationService.getCustomFields(trustId, entityType, req.systemDb);
      };

      req.validateCustomFields = async (entityType, fieldValues) => {
         return await TenantConfigurationService.validateCustomFieldValues(
            trustId,
            entityType,
            fieldValues,
            req.systemDb
         );
      };

      req.generateFormSchema = async (entityType) => {
         return await TenantConfigurationService.generateFormSchema(trustId, entityType, req.systemDb);
      };

      next();
   } catch (error) {
      logger.error('Error in tenant configuration middleware:', error);
      // Don't fail the request, just log the error and continue
      next();
   }
};

/**
 * Helper middleware to ensure tenant configuration is loaded
 * Use this in routes that require configuration
 */
const requireTenantConfig = (req, res, next) => {
   if (!req.tenantConfig) {
      return res.status(500).json({
         success: false,
         message: 'Tenant configuration not available',
         code: 'TENANT_CONFIG_UNAVAILABLE',
      });
   }
   next();
};

/**
 * Helper function to get student configuration from request
 */
const getStudentConfig = (req) => {
   if (!req.tenantConfig) {
      throw new Error('Tenant configuration not available');
   }
   return req.tenantConfig.getStudentConfig();
};

/**
 * Helper function to get school configuration from request
 */
const getSchoolConfig = (req) => {
   if (!req.tenantConfig) {
      throw new Error('Tenant configuration not available');
   }
   return req.tenantConfig.getSchoolConfig();
};

/**
 * Helper function to check if a module is enabled
 */
const isModuleEnabled = (req, moduleName) => {
   if (!req.tenantConfig) {
      return false;
   }
   return req.tenantConfig.isModuleEnabled(moduleName);
};

/**
 * Helper function to check if a feature is enabled
 */
const isFeatureEnabled = (req, featureName) => {
   if (!req.tenantConfig) {
      return false;
   }
   return req.tenantConfig.isFeatureEnabled(featureName);
};

/**
 * Express helper to add configuration data to template locals
 */
const addConfigToLocals = (req, res, next) => {
   if (req.tenantConfig) {
      res.locals.tenantConfig = req.tenantConfig;
      res.locals.isModuleEnabled = (moduleName) => isModuleEnabled(req, moduleName);
      res.locals.isFeatureEnabled = (featureName) => isFeatureEnabled(req, featureName);
      res.locals.getStudentConfig = () => getStudentConfig(req);
      res.locals.getSchoolConfig = () => getSchoolConfig(req);
   }
   next();
};

module.exports = {
   tenantConfigurationMiddleware,
   requireTenantConfig,
   getStudentConfig,
   getSchoolConfig,
   isModuleEnabled,
   isFeatureEnabled,
   addConfigToLocals,
};
