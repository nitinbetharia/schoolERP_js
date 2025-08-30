const { dbManager } = require('../models/system/database');
const { logSystem, logError } = require('../utils/logger');

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
         // No subdomain means system admin access
         tenantCode = null;
      }

      // Set tenant context
      req.tenantCode = tenantCode;
      req.subdomain = subdomain;

      console.log('🔍 TENANT DETECTION DEBUG:', {
         path: req.path,
         host: req.get('host'),
         extractedSubdomain: subdomain,
         tenantCode: tenantCode,
         settingSystemAdmin: !tenantCode,
      });

      // Skip tenant detection for system admin access (no subdomain)
      if (!tenantCode) {
         req.isSystemAdmin = true;
         console.log('✅ Set isSystemAdmin = true for no subdomain');
         return next();
      }

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
      // BUT still fetch tenant info for login pages
      if (req.path.startsWith('/auth/') && req.path !== '/auth/login') {
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

      // Skip tenant initialization for dashboard if user is system admin
      if (req.path === '/dashboard' && req.session && req.session.userType === 'system') {
         return next();
      }

      // Skip tenant initialization for root route - handled by web routes
      if (req.path === '/') {
         return next();
      }

      // Skip for favicon and other browser requests
      if (req.path === '/favicon.ico') {
         return next();
      }

      // For login pages, fetch tenant info but don't initialize models
      if (req.path === '/login' || req.path === '/auth/login') {
         console.log('🔍 Fetching tenant info for login page:', req.path, 'tenantCode:', tenantCode);
         try {
            const { dbManager } = require('../models/system/database');
            const { defineTrustModel } = require('../models/tenant/Trust');
            const systemDB = await dbManager.getSystemDB();
            const Trust = defineTrustModel(systemDB);

            const trust = await Trust.findOne({
               where: { trust_code: tenantCode },
               attributes: ['id', 'trust_name', 'trust_code', 'subdomain', 'contact_email', 'address', 'tenant_config'],
            });

            if (trust) {
               // Convert Sequelize model to plain object and set tenant
               req.tenant = {
                  id: trust.id,
                  name: trust.trust_name,
                  trust_code: trust.trust_code,
                  subdomain: trust.subdomain,
                  contact_email: trust.contact_email,
                  address: trust.address,
               };

               // Parse tenant config for branding
               if (trust.tenant_config) {
                  try {
                     // Handle both JSON string and direct object
                     const config =
                        typeof trust.tenant_config === 'string' ? JSON.parse(trust.tenant_config) : trust.tenant_config;
                     req.tenant.branding = config.theme || null;
                     console.log('🎨 Loaded tenant branding:', req.tenant.branding);
                  } catch (e) {
                     console.log('Error parsing tenant_config:', e.message);
                  }
               } else {
                  console.log('⚠️ No tenant_config found for tenant:', tenantCode);
               }

               // For tenant logins, also fetch schools if available
               // TODO: Query schools from appropriate database once schema is clarified
               req.tenant.schools = [];
               console.log('✅ Set tenant info for login:', req.tenant.name);
            } else {
               console.log('⚠️ Trust not found for tenant code:', tenantCode);
            }
         } catch (error) {
            console.error('❌ Error fetching tenant info:', error.message);
         }
         return next();
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
   if (!host) {
      return null;
   }

   // Remove port if present
   const hostWithoutPort = host.split(':')[0];

   // Split by dots
   const parts = hostWithoutPort.split('.');

   // Handle localhost development
   if (hostWithoutPort.includes('localhost')) {
      // For patterns like demo.localhost, app.localhost, etc.
      if (parts.length === 2 && parts[1] === 'localhost') {
         return parts[0]; // Return 'demo' from 'demo.localhost'
      }
      // For just localhost (no subdomain)
      if (parts.length === 1 && parts[0] === 'localhost') {
         return null;
      }
   }

   // Handle IP addresses (no subdomain possible)
   if (/^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
      return null;
   }

   // For production domains like demo.example.com
   if (parts.length >= 3) {
      return parts[0]; // Return first part as subdomain
   }

   // For domain.com (2 parts), no subdomain
   if (parts.length <= 2) {
      return null;
   }

   return null;
}

/**
 * Tenant validation middleware
 * Validates that the tenant exists and is active
 */
const validateTenant = async (req, res, next) => {
   try {
      console.log('🏛️ VALIDATE TENANT DEBUG:', {
         path: req.path,
         host: req.get('host'),
         isSystemAdmin: req.isSystemAdmin,
         tenantCode: req.tenantCode,
         subdomain: req.subdomain,
      });

      // Skip for system admin access (no subdomain/tenant)
      if (req.isSystemAdmin || !req.tenantCode) {
         console.log('✅ Skipping tenant validation - system admin or no tenant');
         return next();
      }

      // Skip for system admin routes
      if (req.path.startsWith('/admin/system')) {
         return next();
      }

      const systemModels = await dbManager.getSystemModels();
      const Trust = systemModels.Trust;

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

      // Check if this is a web request (HTML) or API request (JSON)
      const acceptsHTML = req.headers.accept && req.headers.accept.includes('text/html');
      const isAPIRequest = req.path.startsWith('/api/');

      if (acceptsHTML && !isAPIRequest) {
         // Return user-friendly error page for web requests
         req.flash('error', 'Unable to access this tenant. Please check your URL or contact support.');
         return res.redirect('/auth/login');
      } else {
         // Return JSON for API requests
         return res.status(500).json({
            success: false,
            error: {
               code: 'TENANT_VALIDATION_FAILED',
               message: 'Failed to validate tenant',
               timestamp: new Date().toISOString(),
            },
         });
      }
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
