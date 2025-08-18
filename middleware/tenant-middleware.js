/**
 * Multi-Tenant Middleware
 * Resolves tenant context and sets appropriate database connections
 */

const logger = require('../config/logger');
const appConfig = require('../config/app-config');
const dbService = require('../modules/data/database-service');

/**
 * Middleware to resolve tenant context from request
 * Sets req.tenant with tenant information
 */
async function resolveTenant(req, res, next) {
  try {
    // Initialize database service if not already done
    await dbService.init();

    const multiTenantConfig = appConfig.multiTenant;
    let trustCode = null;
    let isSystemRequest = false;

    // Strategy 1: Check for system context routes
    const systemPaths = multiTenantConfig.database.systemContextRequired;
    if (systemPaths.some(path => req.path.startsWith(path))) {
      isSystemRequest = true;
    }

    if (!isSystemRequest) {
      // Strategy 2: Check subdomain (e.g., trust1.schoolerp.com)
      if (
        multiTenantConfig.tenantResolution.strategy === 'subdomain' ||
        multiTenantConfig.tenantResolution.strategy === 'auto'
      ) {
        const subdomain = getSubdomain(req);
        if (subdomain && !multiTenantConfig.trustCodeValidation.reservedCodes.includes(subdomain)) {
          if (isValidTrustCode(subdomain)) {
            trustCode = subdomain;
          }
        }
      }

      // Strategy 3: Check custom header
      if (
        !trustCode &&
        (multiTenantConfig.tenantResolution.strategy === 'header' ||
          multiTenantConfig.tenantResolution.strategy === 'auto')
      ) {
        const headerTrustCode =
          req.headers[multiTenantConfig.tenantResolution.headerName.toLowerCase()];
        if (headerTrustCode && isValidTrustCode(headerTrustCode)) {
          trustCode = headerTrustCode;
        }
      }

      // Strategy 4: Check path-based routing (/trust/code/...)
      if (
        !trustCode &&
        (multiTenantConfig.tenantResolution.strategy === 'path' ||
          multiTenantConfig.tenantResolution.strategy === 'auto')
      ) {
        const pathMatch = req.path.match(multiTenantConfig.tenantResolution.pathPattern);
        if (pathMatch && pathMatch[1] && isValidTrustCode(pathMatch[1])) {
          trustCode = pathMatch[1];
        }
      }

      // Fallback to default trust code if none found
      if (!trustCode && multiTenantConfig.defaultTrustCode) {
        trustCode = multiTenantConfig.defaultTrustCode;
      }
    }

    // Validate trust exists (for trust requests)
    if (trustCode) {
      const trustExists = await validateTrust(trustCode);
      if (!trustExists) {
        return res.status(404).json({
          success: false,
          message: 'Trust not found',
          code: 'TRUST_NOT_FOUND'
        });
      }

      // Initialize trust database connection if not exists
      await dbService.initTrust(trustCode);
    }

    // Set tenant context
    req.tenant = {
      trustCode,
      isSystemRequest,
      dbContext: isSystemRequest ? 'system' : 'trust'
    };

    // Add helper methods to request
    req.getDbConnection = () => {
      if (isSystemRequest) {
        return dbService.querySystem.bind(dbService);
      } else {
        return (sql, params) => dbService.queryTrust(trustCode, sql, params);
      }
    };

    req.getDbTransaction = () => {
      if (isSystemRequest) {
        return dbService.transactionSystem.bind(dbService);
      } else {
        return callback => dbService.transactionTrust(trustCode, callback);
      }
    };

    logger.debug('Tenant resolved', {
      trustCode,
      isSystemRequest,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Tenant resolution failed:', error);
    res.status(500).json({
      success: false,
      message: 'Tenant resolution failed',
      code: 'TENANT_RESOLUTION_ERROR'
    });
  }
}

/**
 * Middleware specifically for system-level routes
 * Ensures requests are handled in system database context
 */
function requireSystemContext(req, res, next) {
  if (!req.tenant || !req.tenant.isSystemRequest) {
    return res.status(403).json({
      success: false,
      message: 'System access required',
      code: 'SYSTEM_ACCESS_REQUIRED'
    });
  }
  next();
}

/**
 * Middleware specifically for trust-level routes
 * Ensures requests are handled in trust database context
 */
function requireTrustContext(req, res, next) {
  if (!req.tenant || req.tenant.isSystemRequest || !req.tenant.trustCode) {
    return res.status(403).json({
      success: false,
      message: 'Trust access required',
      code: 'TRUST_ACCESS_REQUIRED'
    });
  }
  next();
}

/**
 * Extract subdomain from request
 */
function getSubdomain(req) {
  const host = req.get('host');
  if (!host) return null;

  const parts = host.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  return null;
}

/**
 * Validate trust code format
 */
function isValidTrustCode(trustCode) {
  if (!trustCode) return false;

  const validation = appConfig.multiTenant.trustCodeValidation;

  // Check length
  if (trustCode.length < validation.minLength || trustCode.length > validation.maxLength) {
    return false;
  }

  // Check pattern
  if (!validation.pattern.test(trustCode)) {
    return false;
  }

  // Check reserved codes
  if (validation.reservedCodes.includes(trustCode.toLowerCase())) {
    return false;
  }

  return true;
}

/**
 * Validate if trust exists in system database
 */
async function validateTrust(trustCode) {
  try {
    const result = await dbService.querySystem(
      'SELECT id FROM trusts WHERE trust_code = ? AND status = "ACTIVE"',
      [trustCode]
    );
    return result.length > 0;
  } catch (error) {
    logger.error('Trust validation failed:', error);
    return false;
  }
}

/**
 * Utility function to get trust configuration
 */
async function getTrustConfig(trustCode) {
  try {
    const result = await dbService.querySystem(
      'SELECT * FROM trusts WHERE trust_code = ? AND status = "ACTIVE"',
      [trustCode]
    );
    return result[0] || null;
  } catch (error) {
    logger.error('Get trust config failed:', error);
    return null;
  }
}

module.exports = {
  resolveTenant,
  requireSystemContext,
  requireTrustContext,
  getTrustConfig
};
