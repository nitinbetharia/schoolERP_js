# GitHub Copilot Instructions - School ERP System (SINGLE SOURCE)

## 🚨 SINGLE INSTRUCTION FILE NOTICE (August 2025)

**THIS IS THE ONLY COPILOT INSTRUCTION FILE - ALL OTHERS HAVE BEEN REMOVED**

- ✅ **This File**: `.github/copilot_instructions.md` - COMPLETE Copilot instructions
- ✅ **Documentation**: `docs/COMPLETE_DOCUMENTATION.md` - Technical decisions and architecture
- ❌ **Removed**: All other instruction files (.copilot-instructions.md, instructions.md, etc.)
- ✅ **Standard Location**: GitHub Copilot automatically reads this .github/ location

## 🚨 DOCUMENTATION CONSOLIDATION NOTICE (August 2025)

**ALL DOCUMENTATION HAS BEEN CONSOLIDATED**

- ✅ **Single Master Document**: `docs/COMPLETE_DOCUMENTATION.md` contains ALL technical decisions, architecture, development standards, API reference, and setup guides
- ✅ **Historical Preservation**: Original individual files moved to `docs/archived/`
- ✅ **Automated Tools**: Documentation consistency validation and auto-fix scripts available
- ❌ **DO NOT** reference individual architecture/developer/setup files - they are archived

## 🔒 CRITICAL: SINGLE SOURCE OF TRUTH ENFORCEMENT

**ALL technical decisions are FINAL and documented in
`docs/COMPLETE_DOCUMENTATION.md`**

Before generating ANY code, you MUST:

1. ✅ Read `docs/COMPLETE_DOCUMENTATION.md` for the specific Q&A
   decision
2. ✅ Use ONLY the implementation pattern specified in that decision
3. ❌ NEVER use any pattern marked as "FORBIDDEN"
4. ✅ Follow the exact technical specifications documented

## 🚨 CRITICAL: FRONTEND VALIDATION APPROACH (Q59-ENFORCED)

**NEVER create custom validation in web routes. ALWAYS reuse existing API endpoint validation schemas.**

### ✅ **MANDATORY Pattern for Web Routes:**

```javascript
// Import existing validation schemas from models
const { systemUserValidationSchemas } = require('../models/SystemUser');
const { validators } = require('../utils/errors');

// Use existing validation middleware - NEVER custom validation
router.post('/auth/login', validators.validateBody(systemUserValidationSchemas.login), async (req, res, next) => {
   // Validation already handled - req.body is sanitized
});
```

### ❌ **FORBIDDEN - Custom Validation in Web Routes:**

```javascript
// DO NOT DO THIS - breaks consistency with API endpoints
router.post('/auth/login', async (req, res, next) => {
   if (!req.body.username || !req.body.password) {
      return res.status(400).json({ error: 'Missing fields' });
   }
});
```

**WHY ENFORCED**: Ensures consistency with API endpoints, single source of truth for validation, same error handling, and leverages existing test coverage.

## 🚨 CRITICAL: COMMONJS ONLY - NO ES6 IMPORTS/CLASSES

**ALL JavaScript code MUST use CommonJS patterns:**

### **✅ CORRECT CommonJS Patterns:**

```javascript
// ✅ CORRECT - CommonJS modules
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const winston = require('winston');

// ✅ CORRECT - Function-based patterns (not classes)
function createStudentService() {
   const db = require('../data/database-service');
   const validator = require('./validation-schemas');

   async function createStudent(studentData) {
      try {
         const validated = await validator.validateStudentData(studentData);
         const student = await db.executeWithRetry('INSERT INTO students SET ?', [validated]);
         return { success: true, data: student };
      } catch (error) {
         logger.error('Student creation failed', error);
         throw error;
      }
   }

   return {
      createStudent,
      updateStudent,
      deleteStudent,
   };
}

module.exports = createStudentService();

// ✅ CORRECT - Module exports
module.exports = {
   createStudent,
   getStudentById,
   updateStudent,
};
```

### **❌ FORBIDDEN Patterns:**

```javascript
// ❌ NEVER USE - ES6 imports
import express from 'express';
import { createStudent } from './student-service';

// ❌ NEVER USE - ES6 classes
class StudentService {
   constructor() {
      // FORBIDDEN
   }
}

// ❌ NEVER USE - ES6 exports
export default StudentService;
export { createStudent };

// ❌ NEVER USE - Arrow functions for main functions
const createStudent = async (data) => {
   // Use regular functions instead
};
```

## 📋 CRITICAL: TODO LIST MANAGEMENT (LIKE CLAUDE CODER)

**BEFORE starting ANY development activity, you MUST:**

1. ✅ **Create/Update TODO List** - List all sub-tasks for the requested feature
2. ✅ **Check Off Completed Items** - Mark tasks as complete as you progress
3. ✅ **Show Progress** - Display current progress (e.g., "3/7 tasks completed")
4. ✅ **Explain Next Steps** - Always explain what task you're working on next
5. ✅ **Update List Dynamically** - Add new tasks if discovered during
   implementation

**Format Example:**

```
TODO: Implement User Authentication Module
- [x] Create user model with INTEGER primary key
- [x] Set up bcryptjs password hashing (12 salt rounds)
- [ ] Create authentication middleware
- [ ] Add login/logout routes
- [ ] Create login form with EJS template
- [ ] Add session management
- [ ] Test authentication flow

Current: Working on authentication middleware (3/7 completed)
```

## 🚨 CRITICAL: ASYNC/AWAIT + TRY-CATCH ENFORCEMENT (Q57-Q58)

**ALL JavaScript code MUST follow these patterns:**

### **MANDATORY: Async/Await Pattern (Q57)**

```javascript
// ✅ CORRECT - Always use async/await with CommonJS
async function processStudentData(studentId) {
   try {
      const student = await Student.findByPk(studentId);
      const result = await performOperation(student);
      return result;
   } catch (error) {
      logger.error('Student processing failed', {
         studentId: studentId,
         error: error.message,
      });
      throw error;
   }
}

// ❌ FORBIDDEN - No callbacks or raw promises
function processStudentData(studentId, callback) {
   // NEVER USE
   Student.findByPk(studentId)
      .then(function (student) {
         // NEVER USE
         callback(null, student);
      })
      .catch(callback); // NEVER USE
}
```

### **MANDATORY: Try-Catch Pattern (Q58)**

```javascript
// ✅ CORRECT - Every async function has try-catch
async function createStudent(studentData) {
   try {
      const validated = sanitizeStudentInput(studentData);
      const student = await db.executeWithRetry('INSERT INTO students SET ?', [validated]);
      logger.info('Student created successfully', { studentId: student.insertId });
      return student;
   } catch (error) {
      logger.error('Student creation failed', {
         studentData: sanitizeForLog(studentData),
         error: error.message,
      });
      throw new AppError('Failed to create student', 400);
   }
}

// ❌ FORBIDDEN - No unhandled async operations
async function createStudent(studentData) {
   // NEVER USE
   const student = await db.query('INSERT INTO students SET ?', [studentData]); // No try-catch = VIOLATION
   return student;
}
```

### **MANDATORY: Controller Pattern**

```javascript
// ✅ CORRECT - All controllers use async/await + try-catch + CommonJS
function createStudentController() {
   return async function (req, res, next) {
      try {
         const studentData = req.body;
         const studentService = require('../services/student-service');
         const student = await studentService.createStudent(studentData);
         res.status(201).json({ success: true, data: student });
      } catch (error) {
         next(error); // Pass to centralized error handler
      }
   };
}

module.exports = {
   create: createStudentController(),
   update: updateStudentController(),
   delete: deleteStudentController(),
};

// ❌ FORBIDDEN - No sync controllers or missing error handling
function createStudentController(req, res) {
   // NEVER USE - not async
   const student = studentService.createStudent(req.body); // No await = VIOLATION
   res.json(student);
}
```

## 🚨 CRITICAL: HIGH-CONCURRENCY DATABASE PATTERNS (10,000+ USERS)

**ALL database operations MUST use high-concurrency patterns:**

### **MANDATORY: High-Concurrency Connection Pool**

```javascript
// ✅ CORRECT - Database service for 10K+ concurrent users
function createDatabaseService() {
   const mysql = require('mysql2/promise');
   const logger = require('../utils/logger');

   // High-concurrency pool configuration
   const poolConfig = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // Critical: High-concurrency settings
      connectionLimit: 100, // Much higher for 10K users
      acquireTimeout: 15000, // Faster acquisition
      timeout: 30000, // Query timeout
      reconnect: true, // Auto-reconnect
      idleTimeout: 120000, // 2 minute idle timeout
      queueLimit: 500, // Queue up to 500 requests
      // MySQL optimizations
      charset: 'utf8mb4',
      timezone: '+00:00',
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: false,
      debug: false,
      trace: false,
      // Connection optimizations
      acquireTimeout: 15000,
      createTimeout: 30000,
      destroyTimeout: 5000,
      reapIntervalMillis: 60000, // Check connections every minute
      // Performance optimizations
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
   };

   const pool = mysql.createPool(poolConfig);

   // High-concurrency query execution with retry
   async function executeWithRetry(query, params, options) {
      const maxRetries = options && options.maxRetries ? options.maxRetries : 3;
      const retryDelay = options && options.retryDelay ? options.retryDelay : 1000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         let connection = null;
         try {
            const startTime = Date.now();
            connection = await pool.getConnection();

            const result = await connection.execute(query, params);
            const duration = Date.now() - startTime;

            // Log slow queries for optimization
            if (duration > 500) {
               logger.warn('Slow query detected', {
                  duration: duration,
                  attempt: attempt,
                  queryLength: query.length,
                  paramCount: params ? params.length : 0,
               });
            }

            return result;
         } catch (error) {
            logger.error('Database query attempt failed', {
               attempt: attempt,
               error: error.message,
               code: error.code,
               errno: error.errno,
            });

            if (attempt === maxRetries) {
               throw error;
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await new Promise(function (resolve) {
               setTimeout(resolve, delay);
            });
         } finally {
            if (connection) {
               connection.release();
            }
         }
      }
   }

   // Transaction with retry for high concurrency
   async function transaction(operations) {
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
         let connection = null;
         try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const results = await operations(connection);

            await connection.commit();
            return results;
         } catch (error) {
            if (connection) {
               try {
                  await connection.rollback();
               } catch (rollbackError) {
                  logger.error('Transaction rollback failed', rollbackError);
               }
            }

            if (attempt === maxRetries) {
               throw error;
            }

            // Wait before retry
            await new Promise(function (resolve) {
               setTimeout(resolve, 1000 * attempt);
            });
         } finally {
            if (connection) {
               connection.release();
            }
         }
      }
   }

   // Health check for connection pool
   async function healthCheck() {
      try {
         const startTime = Date.now();
         await executeWithRetry('SELECT 1 as health', []);
         const responseTime = Date.now() - startTime;

         return {
            status: 'healthy',
            responseTime: responseTime,
            poolConnections: pool.pool.allConnections.length,
            poolFree: pool.pool.freeConnections.length,
            poolUsed: pool.pool.allConnections.length - pool.pool.freeConnections.length,
         };
      } catch (error) {
         return {
            status: 'unhealthy',
            error: error.message,
            poolConnections: pool.pool.allConnections.length,
         };
      }
   }

   return {
      executeWithRetry: executeWithRetry,
      transaction: transaction,
      healthCheck: healthCheck,
      getPool: function () {
         return pool;
      },
   };
}

module.exports = createDatabaseService();

// ❌ FORBIDDEN - Low concurrency patterns
const pool = mysql.createPool({
   connectionLimit: 10, // Too low for 10K users
   acquireTimeout: 60000, // Too slow
});
```

### **MANDATORY: Tenant Connection Management for Scale**

```javascript
// ✅ CORRECT - Multi-tenant connection manager for 10K+ users
function createTenantConnectionManager() {
   const connections = new Map();
   const connectionStats = new Map();
   const maxGlobalConnections = 500; // Total across all tenants

   function getTenantDatabase(trustCode) {
      if (!connections.has(trustCode)) {
         // Check global connection limit
         const totalConnections = Array.from(connections.values()).reduce(function (sum, pool) {
            return sum + (pool.pool.allConnections ? pool.pool.allConnections.length : 0);
         }, 0);

         if (totalConnections >= maxGlobalConnections) {
            throw new Error('Maximum global connection limit reached');
         }

         const mysql = require('mysql2/promise');
         const poolConfig = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'school_erp_trust_' + trustCode,
            // Per-tenant connection limits
            connectionLimit: 25, // 25 connections per tenant
            acquireTimeout: 10000, // Fast acquisition for tenant
            timeout: 20000,
            reconnect: true,
            idleTimeout: 180000, // 3 minute idle per tenant
            queueLimit: 100, // Smaller queue per tenant
            charset: 'utf8mb4',
            timezone: '+00:00',
         };

         const pool = mysql.createPool(poolConfig);
         connections.set(trustCode, pool);

         // Initialize stats
         connectionStats.set(trustCode, {
            created: new Date(),
            queries: 0,
            errors: 0,
            lastActivity: new Date(),
         });
      }

      return connections.get(trustCode);
   }

   async function executeForTenant(trustCode, query, params) {
      try {
         const pool = getTenantDatabase(trustCode);
         const connection = await pool.getConnection();

         try {
            const result = await connection.execute(query, params);

            // Update stats
            const stats = connectionStats.get(trustCode);
            if (stats) {
               stats.queries = stats.queries + 1;
               stats.lastActivity = new Date();
            }

            return result;
         } finally {
            connection.release();
         }
      } catch (error) {
         const stats = connectionStats.get(trustCode);
         if (stats) {
            stats.errors = stats.errors + 1;
         }
         throw error;
      }
   }

   // Cleanup idle tenant connections
   function startConnectionCleanup() {
      setInterval(
         function () {
            const idleTimeout = 30 * 60 * 1000; // 30 minutes
            const now = Date.now();

            for (const entry of connectionStats.entries()) {
               const trustCode = entry[0];
               const stats = entry[1];

               if (now - stats.lastActivity.getTime() > idleTimeout) {
                  const pool = connections.get(trustCode);
                  if (pool) {
                     pool
                        .end()
                        .then(function () {
                           logger.info('Closed idle tenant connection', { trustCode: trustCode });
                           connections.delete(trustCode);
                           connectionStats.delete(trustCode);
                        })
                        .catch(function (error) {
                           logger.error('Error closing tenant connection', {
                              trustCode: trustCode,
                              error: error.message,
                           });
                        });
                  }
               }
            }
         },
         10 * 60 * 1000
      ); // Check every 10 minutes
   }

   async function healthCheckAllTenants() {
      const results = {};
      let totalConnections = 0;
      let healthyTenants = 0;

      for (const entry of connections.entries()) {
         const trustCode = entry[0];
         const pool = entry[1];

         try {
            const connection = await pool.getConnection();
            await connection.execute('SELECT 1');
            connection.release();

            const poolSize = pool.pool.allConnections ? pool.pool.allConnections.length : 0;
            totalConnections = totalConnections + poolSize;
            healthyTenants = healthyTenants + 1;

            results[trustCode] = {
               status: 'healthy',
               poolSize: poolSize,
               poolUsed: poolSize - (pool.pool.freeConnections ? pool.pool.freeConnections.length : 0),
            };
         } catch (error) {
            results[trustCode] = {
               status: 'unhealthy',
               error: error.message,
            };
         }
      }

      return {
         status: healthyTenants === connections.size ? 'healthy' : 'degraded',
         totalTenants: connections.size,
         healthyTenants: healthyTenants,
         totalConnections: totalConnections,
         maxGlobalConnections: maxGlobalConnections,
         tenantDetails: results,
      };
   }

   // Start cleanup on initialization
   startConnectionCleanup();

   return {
      getTenantDatabase: getTenantDatabase,
      executeForTenant: executeForTenant,
      healthCheckAllTenants: healthCheckAllTenants,
      getConnectionStats: function () {
         const stats = {};
         for (const entry of connectionStats.entries()) {
            stats[entry[0]] = entry[1];
         }
         return stats;
      },
   };
}

module.exports = createTenantConnectionManager();
```

## 🚀 HIGH-CONCURRENCY LOW-MAINTENANCE PATTERNS (MANDATORY)

### **Self-Healing Database Connections for 10K+ Users**

```javascript
// ✅ MANDATORY: High-concurrency database service with self-healing
function createHighConcurrencyDatabaseService() {
   const mysql = require('mysql2/promise');
   const logger = require('../utils/logger');

   let reconnectAttempts = 0;
   const maxReconnectAttempts = 5;
   const backoffMultiplier = 1000;

   function shouldRetry(error) {
      const retryableCodes = [
         'PROTOCOL_CONNECTION_LOST',
         'ECONNRESET',
         'ETIMEDOUT',
         'ENOTFOUND',
         'ECONNREFUSED',
         'ER_CON_COUNT_ERROR', // Too many connections
      ];
      return retryableCodes.indexOf(error.code) !== -1;
   }

   async function handleReconnect(operation, params) {
      if (reconnectAttempts >= maxReconnectAttempts) {
         throw new Error('Max reconnection attempts reached');
      }

      reconnectAttempts = reconnectAttempts + 1;
      const delay = backoffMultiplier * reconnectAttempts;

      logger.warn('Database reconnecting', {
         attempt: reconnectAttempts,
         delayMs: delay,
      });

      await new Promise(function (resolve) {
         setTimeout(resolve, delay);
      });

      try {
         const result = await operation(params);
         reconnectAttempts = 0; // Reset on success
         return result;
      } catch (reconnectError) {
         return await handleReconnect(operation, params);
      }
   }

   async function executeWithRetry(query, params, options) {
      try {
         const db = require('./database-service');
         return await db.executeWithRetry(query, params, options);
      } catch (error) {
         if (shouldRetry(error)) {
            return await handleReconnect(function (retryParams) {
               const db = require('./database-service');
               return db.executeWithRetry(query, retryParams, options);
            }, params);
         }
         throw error;
      }
   }

   return {
      executeWithRetry: executeWithRetry,
      handleReconnect: handleReconnect,
   };
}

module.exports = createHighConcurrencyDatabaseService();
```

### **Automatic Resource Cleanup for Scale**

```javascript
// ✅ MANDATORY: All services must include cleanup methods for 10K+ users
function createServiceBase() {
   const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
   let cleanupTimer = null;

   function startCleanup(performCleanup) {
      cleanupTimer = setInterval(function () {
         try {
            performCleanup()
               .then(function () {
                  logger.info('Service cleanup completed');
               })
               .catch(function (error) {
                  logger.error('Service cleanup failed', error);
               });
         } catch (error) {
            logger.error('Service cleanup error', error);
         }
      }, cleanupInterval);
   }

   function stopCleanup() {
      if (cleanupTimer) {
         clearInterval(cleanupTimer);
         cleanupTimer = null;
      }
   }

   return {
      startCleanup: startCleanup,
      stopCleanup: stopCleanup,
   };
}

// ✅ MANDATORY: High-performance cache with automatic cleanup
function createManagedCache(ttl, maxItems) {
   const cache = new Map();
   const ttlMs = ttl || 600000; // 10 minutes default
   const maxCacheItems = maxItems || 10000; // Higher limit for 10K users

   function set(key, value) {
      // Prevent memory overflow
      if (cache.size >= maxCacheItems) {
         // Remove oldest 10% of entries
         const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(maxCacheItems * 0.1));
         for (let i = 0; i < keysToDelete.length; i++) {
            cache.delete(keysToDelete[i]);
         }
      }

      cache.set(key, {
         value: value,
         timestamp: Date.now(),
      });
   }

   function get(key) {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() - item.timestamp > ttlMs) {
         cache.delete(key);
         return null;
      }

      return item.value;
   }

   function cleanup() {
      const now = Date.now();
      let cleaned = 0;

      for (const entry of cache.entries()) {
         const key = entry[0];
         const item = entry[1];

         if (now - item.timestamp > ttlMs) {
            cache.delete(key);
            cleaned = cleaned + 1;
         }
      }

      if (cleaned > 0) {
         logger.debug('Cache cleanup completed', { itemsRemoved: cleaned });
      }
   }

   function getStats() {
      return {
         size: cache.size,
         maxSize: maxCacheItems,
         ttlMs: ttlMs,
      };
   }

   // Auto-cleanup every hour
   setInterval(cleanup, 60 * 60 * 1000);

   return {
      set: set,
      get: get,
      cleanup: cleanup,
      getStats: getStats,
      clear: function () {
         cache.clear();
      },
   };
}

module.exports = {
   createServiceBase: createServiceBase,
   createManagedCache: createManagedCache,
};
```

### **Built-in Health Checks for High Concurrency**

```javascript
// ✅ MANDATORY: All modules must expose health check methods for 10K+ users
function createHealthMonitor() {
   const checks = new Map();
   const history = new Map();

   function addCheck(name, checkFunction) {
      checks.set(name, checkFunction);
      history.set(name, []);
   }

   async function runAllChecks() {
      const results = {};
      let overallStatus = 'healthy';
      const startTime = Date.now();

      for (const entry of checks.entries()) {
         const name = entry[0];
         const checkFunction = entry[1];

         try {
            const checkStart = Date.now();
            const result = await checkFunction();
            const checkDuration = Date.now() - checkStart;

            results[name] = {
               status: result.status,
               timestamp: new Date(),
               duration: checkDuration,
               data: result,
            };

            // Update history
            const checkHistory = history.get(name);
            checkHistory.push({
               status: result.status,
               timestamp: new Date(),
               duration: checkDuration,
            });

            // Keep only last 100 checks for memory efficiency
            if (checkHistory.length > 100) {
               checkHistory.shift();
            }

            if (result.status === 'unhealthy') {
               overallStatus = 'unhealthy';
            } else if (result.status === 'warning' && overallStatus === 'healthy') {
               overallStatus = 'warning';
            }
         } catch (error) {
            results[name] = {
               status: 'error',
               error: error.message,
               timestamp: new Date(),
            };
            overallStatus = 'unhealthy';
         }
      }

      const totalDuration = Date.now() - startTime;

      return {
         status: overallStatus,
         checks: results,
         uptime: Math.floor(process.uptime()),
         timestamp: new Date(),
         checkDuration: totalDuration,
      };
   }

   // Setup default checks for high concurrency
   function setupDefaultChecks() {
      addCheck('database', async function () {
         try {
            const db = require('../data/database-service');
            const health = await db.healthCheck();
            return health;
         } catch (error) {
            return { status: 'unhealthy', error: error.message };
         }
      });

      addCheck('memory', async function () {
         const usage = process.memoryUsage();
         const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
         const threshold = parseInt(process.env.MEMORY_THRESHOLD_MB) || 1500; // Higher for 10K users

         return {
            status: heapUsedMB > threshold ? 'warning' : 'healthy',
            heapUsedMB: heapUsedMB,
            threshold: threshold,
            heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
            externalMB: Math.round(usage.external / 1024 / 1024),
         };
      });

      addCheck('connections', async function () {
         try {
            const tenantManager = require('../data/tenant-connection-manager');
            const health = await tenantManager.healthCheckAllTenants();
            return health;
         } catch (error) {
            return { status: 'unhealthy', error: error.message };
         }
      });
   }

   // Start periodic checks every 2 minutes
   function startPeriodicChecks() {
      setInterval(
         function () {
            runAllChecks()
               .then(function (health) {
                  if (health.status === 'unhealthy') {
                     logger.error('System health check failed', health);
                  } else if (health.status === 'warning') {
                     logger.warn('System health check warning', health);
                  }

                  // Trigger garbage collection if memory usage is high
                  if (health.checks.memory && health.checks.memory.data.status === 'warning' && global.gc) {
                     global.gc();
                     logger.info('Triggered garbage collection due to high memory usage');
                  }
               })
               .catch(function (error) {
                  logger.error('Health check system failed', error);
               });
         },
         2 * 60 * 1000
      );
   }

   setupDefaultChecks();

   return {
      addCheck: addCheck,
      runAllChecks: runAllChecks,
      startPeriodicChecks: startPeriodicChecks,
      getHistory: function (checkName) {
         return history.get(checkName) || [];
      },
   };
}

module.exports = createHealthMonitor();
```

### **Performance Monitoring for 10K+ Users**

```javascript
// ✅ MANDATORY: All routes must include performance tracking for high concurrency
function createPerformanceMonitor() {
   const metrics = {
      requests: 0,
      errors: 0,
      slowRequests: 0,
      avgResponseTime: 0,
      responseTimes: [],
   };

   function middleware() {
      return function (req, res, next) {
         const start = Date.now();

         res.on('finish', function () {
            const duration = Date.now() - start;
            recordMetric(req, res, duration);

            // Log slow requests (lower threshold for high concurrency)
            if (duration > 500) {
               // 500ms instead of 1000ms
               metrics.slowRequests = metrics.slowRequests + 1;
               logger.warn('Slow request detected', {
                  method: req.method,
                  url: req.url,
                  duration: duration + 'ms',
                  userAgent: req.get('User-Agent'),
                  ip: req.ip,
               });
            }
         });

         next();
      };
   }

   function recordMetric(req, res, duration) {
      metrics.requests = metrics.requests + 1;

      if (res.statusCode >= 400) {
         metrics.errors = metrics.errors + 1;
      }

      metrics.responseTimes.push(duration);

      // Keep only last 5000 response times for high concurrency
      if (metrics.responseTimes.length > 5000) {
         metrics.responseTimes = metrics.responseTimes.slice(-5000);
      }

      // Calculate rolling average
      const sum = metrics.responseTimes.reduce(function (a, b) {
         return a + b;
      }, 0);
      metrics.avgResponseTime = sum / metrics.responseTimes.length;
   }

   function getStats() {
      return {
         requests: metrics.requests,
         errors: metrics.errors,
         slowRequests: metrics.slowRequests,
         errorRate: metrics.requests > 0 ? ((metrics.errors / metrics.requests) * 100).toFixed(2) : 0,
         slowRequestRate: metrics.requests > 0 ? ((metrics.slowRequests / metrics.requests) * 100).toFixed(2) : 0,
         avgResponseTime: Math.round(metrics.avgResponseTime),
         uptime: Math.floor(process.uptime()),
         memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      };
   }

   function resetStats() {
      metrics.requests = 0;
      metrics.errors = 0;
      metrics.slowRequests = 0;
      metrics.avgResponseTime = 0;
      metrics.responseTimes = [];
   }

   return {
      middleware: middleware,
      getStats: getStats,
      resetStats: resetStats,
   };
}

module.exports = createPerformanceMonitor();
```

## 🚨 CRITICAL: BUSINESS CONSTANTS ENFORCEMENT (Q59)

**NO hardcoded business values allowed anywhere in code:**

### **MANDATORY: Use Business Constants (Q59)**

```javascript
// ✅ CORRECT - Use business constants from config
const config = require('../config/index');
const constants = config.get('constants');

// Model with constants
const statusEnum = constants.USER_STATUS.ALL_STATUS;
const defaultStatus = constants.USER_STATUS.ACTIVE;

// Joi validation with constants
const roleValidation = constants.USER_ROLES.ALL_ROLES;

// Business logic with constants
if (user.role === constants.USER_ROLES.ADMIN) {
   // Admin logic
}

// ❌ FORBIDDEN - No hardcoded business values
const statusEnum = ['ACTIVE', 'INACTIVE', 'LOCKED']; // NEVER USE
const defaultStatus = 'ACTIVE'; // NEVER USE

const roleValidation = ['ADMIN', 'TEACHER', 'STUDENT']; // NEVER USE

if (user.role === 'ADMIN') {
   // NEVER USE
   // Logic
}
```

### **MANDATORY: Business Constants Categories**

- `USER_ROLES` - All user role types
- `USER_STATUS` - User account status values
- `ACADEMIC_STATUS` - Academic entity status
- `PAYMENT_STATUS` - Payment transaction status
- `COMMUNICATION_STATUS` - Message/notification status
- `ATTENDANCE_STATUS` - Attendance tracking values

## 🚨 CRITICAL: CODE CONSISTENCY RULES (AVOID REITERATION)

**ALWAYS check existing code before creating new code**:

1. ✅ **Check existing models** in `modules/*/models/` for:
   - Model names, field names, data types
   - Table naming conventions (snake_case)
   - Primary key strategies (UUID vs integers)
   - Association patterns and foreign keys

2. ✅ **Check existing database connections** in `modules/data/`:
   - Connection patterns and pool settings
   - Multi-tenant database naming (school*erp_trust*{code})
   - Query patterns and transaction handling

3. ✅ **Use existing codebase APIs**:
   - Database service: `modules/data/database-service.js`
   - Configuration: `config/index.js`
   - Authentication: `modules/auth/`
   - Validation: Use existing Joi schemas

4. ✅ **Maintain consistency**:
   - Route patterns: `/api/v1/{module}/{action}`
   - Error handling: Use existing error response format
   - Middleware chain: Follow established order
   - File organization: Follow existing module structure

5. ✅ **All seedings and DB operations**:
   - MUST use existing connection objects from
     `modules/data/database-service.js`
   - MUST follow existing query patterns
   - MUST use established transaction methods

## 🏗️ HYBRID ARCHITECTURE STRUCTURE (ENFORCED)

**Follow DRY principles with clear separation between SHARED and MODULE-SPECIFIC
code:**

### **SHARED RESPONSIBILITY (Root Level)**

- **`models/`** - Core entities only (User, Student, School, Trust, Permission)
- **`middleware/`** - Cross-cutting concerns (auth, tenant, validation, logging)
- **`routes/`** - Main router registration and API routing
- **`views/layouts/`** - Common layouts and shell templates
- **`config/`** - Configuration files and RBAC
- **`utils/`** - Shared utilities and helpers

### **MODULE RESPONSIBILITY**

- **`modules/{name}/services/`** - Business logic specific to that domain
- **`modules/{name}/controllers/`** - HTTP handlers for that module
- **`modules/{name}/models/`** - Domain-specific models (FeeRule,
  AttendanceRecord)
- **`modules/{name}/views/`** - Module-specific UI components
- **`modules/{name}/business/`** - Complex business logic classes

### **DRY ENFORCEMENT RULES**

1. ✅ **Models can reference other models** (Student → User)
2. ✅ **Modules can call other module services** (Fees → Student service)
3. ❌ **NO direct module-to-module model access** (use services)
4. ✅ **Shared utilities in utils/**, module utilities in
   `modules/{name}/utils/`
5. ❌ **NO duplicate code** - Always check existing implementations first

## 📁 FILE ORGANIZATION (ENFORCED)

**Root folder should have MINIMUM files**. New files MUST go in appropriate
folders:

- **Documentation**: `docs/` folder only
   - **Primary**: `docs/COMPLETE_DOCUMENTATION.md` (single source of truth)
   - **Historical**: `docs/archived/` (preserved original files)
   - **Tools**: `docs/DOCUMENTATION_*.md` (consolidation summaries)
- **Code**: Organized by module in `modules/`
- **Configuration**: `config/` folder only
- **Scripts**: `scripts/` folder only

**⚠️ CRITICAL**: All individual architecture, developer, and setup documentation has been consolidated. Use `docs/COMPLETE_DOCUMENTATION.md` for all technical decisions and implementation patterns.

## 📋 Architecture Overview

This is a **School ERP system** with these IMMUTABLE decisions:

- **Database**: High-concurrency MySQL with connection pooling for 10K+ users
- **Modules**: CommonJS only (Q2) - NO ES6 imports/exports
- **Multi-Tenant**: Separate databases per tenant with connection management
- **Authentication**: bcryptjs + express-session (Q6, Q17)
- **Frontend**: EJS + Tailwind CSS + Alpine.js (Q26-Q28)
- **Validation**: Joi + Sequelize + custom rules (Q8)
- **Scalability**: 10,000+ concurrent users supported

## 🚨 Code Generation Rules

### ALWAYS USE:

- `const module = require('path')` - CommonJS modules (Q2)
- `function createService() { return {}; }` - Function-based patterns
- High-concurrency database pool settings for 10K+ users
- `module.exports = serviceInstance` - CommonJS exports
- `underscored: true` - Snake_case DB, camelCase JS (Q16)

### NEVER USE:

- `import`/`export` statements - Violates Q2
- `class ClassName {}` - Use functions instead
- Low-concurrency database settings - Violates scalability requirements
- ES6 arrow functions for main functions - Use regular functions
- Hardcoded connection limits below high-concurrency thresholds

## 📁 Key Reference Files (UPDATED LOCATIONS)

1. **`docs/COMPLETE_DOCUMENTATION.md`** - ALL 56 Q&A decisions + Complete Architecture + Development Standards (MASTER DOCUMENT)
2. **`docs/archived/COPILOT_INSTRUCTIONS.md`** - Historical Copilot instructions (archived)
3. **`docs/archived/API_SITEMAP.md`** - API documentation (archived)
4. **`README.md`** - Quick start and project overview

**⚠️ IMPORTANT**: All individual architecture, developer, and setup documentation has been consolidated into `docs/COMPLETE_DOCUMENTATION.md`. Always refer to this single source of truth.

## 🏗️ Business Logic Patterns

### Fee Calculation (Enhanced)

- Use `createConfigurableFeeCalculator()` function with tenant-specific rules
- Support late fees, scholarships, waivers, custom formulas
- Frontend-configurable rules engine

### Communication System

- Use `createCommunicationEngine()` with multiple providers
- Support Email (SendGrid/Nodemailer), SMS (Twilio), WhatsApp

### Academic Calendar

- Use `createConfigurableAcademicCalendar()` with flexible structures
- Support Semester/Trimester/Quarter/Custom periods

## 🔧 Implementation Commands

- `npm run validate:decisions` - Validate code against Q&A decisions
- `npm run validate:all` - Full validation including technical decisions

## ⚠️ VIOLATION = BUILD FAILURE

Any code that violates the Q&A technical decisions or uses ES6 patterns will cause build/deployment
failure. The configuration system enforces these decisions automatically.

---

**STATUS**: All 56 technical decisions FINAL and ENFORCED  
**DOCUMENTATION**: Consolidated into single master document (August 2025)  
**SCALABILITY**: 10,000+ concurrent users supported  
**PATTERNS**: Pure CommonJS only - NO ES6  
**VERSION**: IMMUTABLE - DO NOT MODIFY  
**LAST UPDATED**: 2025-08-19
