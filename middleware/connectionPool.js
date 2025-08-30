/**
 * Connection Pool Monitoring Middleware
 * Tracks and manages database connection pool usage to prevent exhaustion
 */

const { logSystem, logError, logApp } = require('../utils/logger');
const { dbManager } = require('../models/system/database');

/**
 * Middleware to monitor connection pool usage
 */
function connectionPoolMonitor(req, res, next) {
   // Add request timestamp for tracking
   req.connectionPoolStart = Date.now();

   // Override res.end to log connection pool status
   const originalEnd = res.end;
   res.end = function (...args) {
      const duration = Date.now() - req.connectionPoolStart;

      // Log slow requests that might indicate connection pool issues
      if (duration > 5000) {
         logApp(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`, {
            url: req.url,
            method: req.method,
            duration,
            userAgent: req.get('user-agent'),
            ip: req.ip,
         });
      }

      originalEnd.apply(this, args);
   };

   next();
}

/**
 * Periodic connection pool health check
 */
async function checkConnectionPoolHealth() {
   try {
      const health = await dbManager.healthCheck();

      // Log connection pool status
      logSystem('Connection Pool Status', {
         systemDB: health.systemDB,
         tenantConnections: health.tenantConnections,
         activeTenants: health.activeTenants.length,
         poolStatus: health.connectionPoolStatus,
      });

      // Check for potential issues
      let totalConnections = 0;
      if (health.connectionPoolStatus.system?.used) {
         totalConnections += health.connectionPoolStatus.system.used;
      }

      health.connectionPoolStatus.tenants.forEach((tenant) => {
         if (tenant.used) {
            totalConnections += tenant.used;
         }
      });

      // Warning if connection usage is high
      if (totalConnections > 25) {
         logSystem(`WARNING: High connection usage detected: ${totalConnections} total connections`, {
            totalConnections,
            systemConnections: health.connectionPoolStatus.system?.used || 0,
            tenantConnections: health.connectionPoolStatus.tenants.length,
         });
      }

      return health;
   } catch (error) {
      logError(error, { context: 'checkConnectionPoolHealth' });
      return null;
   }
}

/**
 * Start periodic connection pool monitoring
 */
function startConnectionPoolMonitoring() {
   // Check connection pool health every 2 minutes
   setInterval(checkConnectionPoolHealth, 2 * 60 * 1000);

   logSystem('Started connection pool monitoring');
}

/**
 * Emergency connection pool cleanup
 */
async function emergencyCleanup() {
   try {
      logSystem('Performing emergency connection pool cleanup');

      // Force cleanup of idle connections
      await dbManager.cleanupIdleConnections();

      // Run garbage collection if available
      if (global.gc) {
         global.gc();
      }

      logSystem('Emergency cleanup completed');
   } catch (error) {
      logError(error, { context: 'emergencyCleanup' });
   }
}

module.exports = {
   connectionPoolMonitor,
   checkConnectionPoolHealth,
   startConnectionPoolMonitoring,
   emergencyCleanup,
};
