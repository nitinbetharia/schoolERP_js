const { getTenantModels, initializeTenantModels } = require('../models');
const { dbManager } = require('../models/database');
const { logSystem, logError } = require('../utils/logger');
const {
   ErrorFactory,
   // Legacy classes for backward compatibility
   AuthenticationError,
} = require('../utils/errors');
const appConfig = require('../config/app-config.json');

/**
 * Tenant detection middleware
 * Detects tenant from subdomain and initializes tenant context
 */
const tenantDetection = async (req, res, next) => {
   try {
      let tenantCode = null;

      // Extract tenant from subdomain
      const host = req.get('host');
      const subdomain = extractSubdomain(host);

      if (subdomain && subdomain !== 'www') {
         tenantCode = subdomain;
      } else {
         // Fallback to default tenant for development
         tenantCode = appConfig.multiTenant.defaultTrustCode;
      }

      // Set tenant context
      req.tenantCode = tenantCode;
      req.subdomain = subdomain;

      // Skip tenant database initialization for system admin routes
      if (req.path.startsWith('/api/v1/admin/system') || req.path.startsWith('/admin/system')) {
         return next();
      }

      // Skip tenant validation for health check
      if (req.path === '/api/v1/health' || req.path === '/health') {
         return next();
      }

      // Skip for status endpoint
      if (req.path === '/api/v1/status' || req.path === '/status') {
         return next();
      }

      // Skip for auth routes to allow login without tenant initialization
      if (req.path === '/auth/login' || req.path.startsWith('/auth/')) {
         req.tenantCode = tenantCode; // Set tenant code but don't initialize models
         return next();
      }

      // Skip for static files
      if (req.path.startsWith('/static/')) {
         return next();
      }

      // Skip for logout
      if (req.path === '/logout' || req.path === '/auth/logout') {
         return next();
      }

      // Initialize tenant models if not already done
      try {
         const tenantModels = getTenantModels(tenantCode);
         req.tenantModels = tenantModels;
      } catch (error) {
         // Models not initialized, try to initialize
         logSystem(`Initializing tenant models for: ${tenantCode}`);

         // Check if tenant database exists
         const dbExists = await dbManager.tenantDatabaseExists(tenantCode);

         if (!dbExists) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'TENANT_NOT_FOUND',
                  message: `Tenant '${tenantCode}' not found`,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         // Initialize tenant models
         const tenantModels = await initializeTenantModels(tenantCode);
         req.tenantModels = tenantModels;
      }

      logSystem(`Request routed to tenant: ${tenantCode}`, {
         host,
         subdomain,
         path: req.path,
      });

      next();
   } catch (error) {
      logError(error, { context: 'tenantDetection', host: req.get('host') });
      return res.status(500).json({
         success: false,
         error: {
            code: 'TENANT_DETECTION_FAILED',
            message: 'Failed to detect tenant',
            timestamp: new Date().toISOString(),
         },
      });
   }
};

/**
 * Extract subdomain from host header
 */
function extractSubdomain(host) {
   if (!host) return null;

   // Remove port if present
   const hostWithoutPort = host.split(':')[0];

   // Split by dots
   const parts = hostWithoutPort.split('.');

   // If localhost or IP address, no subdomain
   if (parts[0] === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
      return null;
   }

   // If only domain.com, no subdomain
   if (parts.length <= 2) {
      return null;
   }

   // Return first part as subdomain
   return parts[0];
}

/**
 * Tenant validation middleware
 * Validates that the tenant exists and is active
 */
const validateTenant = async (req, res, next) => {
   try {
      // Skip for system admin routes
      if (req.path.startsWith('/admin/system')) {
         return next();
      }

      const { getTrustModel } = require('../models');
      const Trust = await getTrustModel();

      // Find trust by subdomain or tenant code
      const trust = await Trust.findOne({
         where: {
            [req.subdomain ? 'subdomain' : 'trust_code']: req.tenantCode,
         },
      });

      if (!trust) {
         return res.status(404).json({
            success: false,
            error: {
               code: 'TENANT_NOT_FOUND',
               message: `Tenant '${req.tenantCode}' not found`,
               timestamp: new Date().toISOString(),
            },
         });
      }

      if (!trust.isActive()) {
         return res.status(403).json({
            success: false,
            error: {
               code: 'TENANT_INACTIVE',
               message: `Tenant '${req.tenantCode}' is not active`,
               timestamp: new Date().toISOString(),
            },
         });
      }

      // Set trust context
      req.trust = trust;

      next();
   } catch (error) {
      logError(error, { context: 'validateTenant', tenantCode: req.tenantCode });
      return res.status(500).json({
         success: false,
         error: {
            code: 'TENANT_VALIDATION_FAILED',
            message: 'Failed to validate tenant',
            timestamp: new Date().toISOString(),
         },
      });
   }
};

/**
 * Require tenant middleware
 * Ensures tenant context is available for protected routes
 */
const requireTenant = (req, res, next) => {
   if (!req.tenantCode) {
      return res.status(400).json({
         success: false,
         error: {
            code: 'TENANT_REQUIRED',
            message: 'Tenant context is required',
            timestamp: new Date().toISOString(),
         },
      });
   }

   if (!req.tenantModels) {
      return res.status(500).json({
         success: false,
         error: {
            code: 'TENANT_MODELS_NOT_INITIALIZED',
            message: 'Tenant models not initialized',
            timestamp: new Date().toISOString(),
         },
      });
   }

   next();
};

module.exports = {
   tenantDetection,
   validateTenant,
   requireTenant,
   extractSubdomain,
};
