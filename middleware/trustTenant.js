const { dbManager } = require('../models/system/database');
const logger = require('../utils/logger');

/**
 * Trust-scoped tenant middleware
 * Sets up tenant context based on trustId parameter
 */
const tenant = async (req, res, next) => {
   try {
      const trustId = req.params.trustId;

      if (!trustId) {
         return res.status(400).json({
            success: false,
            error: {
               code: 'TRUST_ID_REQUIRED',
               message: 'Trust ID is required in URL parameters',
               timestamp: new Date().toISOString(),
            },
         });
      }

      // Get the trust to verify it exists and get trust_code
      const systemModels = await dbManager.getSystemModels();
      const Trust = systemModels.Trust;

      const trust = await Trust.findByPk(trustId);

      if (!trust) {
         return res.status(404).json({
            success: false,
            error: {
               code: 'TRUST_NOT_FOUND',
               message: `Trust with ID '${trustId}' not found`,
               timestamp: new Date().toISOString(),
            },
         });
      }

      // Check if trust setup is completed
      if (trust.status !== 'COMPLETED') {
         return res.status(400).json({
            success: false,
            error: {
               code: 'TRUST_SETUP_INCOMPLETE',
               message: 'Trust setup must be completed before accessing tenant resources',
               timestamp: new Date().toISOString(),
            },
         });
      }

      // Set trust context
      req.trust = trust;
      req.tenantCode = trust.trust_code;

      // Initialize or get tenant models
      try {
         const tenantModels = await dbManager.getTenantModels(trust.trust_code);
         req.tenantModels = tenantModels;

         logger.info('Tenant context initialized', {
            middleware: 'tenant',
            trust_id: trustId,
            trust_code: trust.trust_code,
            trust_name: trust.trust_name,
         });
      } catch (modelError) {
         // Try to initialize tenant models if they don't exist
         logger.warn('Tenant models not found, attempting to initialize', {
            middleware: 'tenant',
            trust_code: trust.trust_code,
            error: modelError.message,
         });

         try {
            const tenantModels = await dbManager.initializeTenantModels(trust.trust_code);
            req.tenantModels = tenantModels;

            logger.info('Tenant models initialized successfully', {
               middleware: 'tenant',
               trust_code: trust.trust_code,
            });
         } catch (initError) {
            logger.error('Failed to initialize tenant models', {
               middleware: 'tenant',
               trust_code: trust.trust_code,
               error: initError.message,
            });

            return res.status(500).json({
               success: false,
               error: {
                  code: 'TENANT_MODELS_INITIALIZATION_FAILED',
                  message: `Failed to initialize tenant models for trust: ${trust.trust_code}`,
                  timestamp: new Date().toISOString(),
               },
            });
         }
      }

      next();
   } catch (error) {
      logger.error('Tenant middleware error', {
         middleware: 'tenant',
         trust_id: req.params.trustId,
         error: error.message,
         stack: error.stack,
      });

      return res.status(500).json({
         success: false,
         error: {
            code: 'TENANT_MIDDLEWARE_ERROR',
            message: 'Failed to set up tenant context',
            timestamp: new Date().toISOString(),
         },
      });
   }
};

module.exports = { tenant };
