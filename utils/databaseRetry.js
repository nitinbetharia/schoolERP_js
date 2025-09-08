/**
 * Database Operation Retry Handler
 * Provides intelligent retry logic for database operations that may fail due to temporary issues
 */

const { logSystem, logError, logDB } = require('../utils/logger');
const appConfig = require('../config/app-config.json');

/**
 * Retry configuration - uses app config with fallback defaults
 */
const RETRY_CONFIG = {
   maxAttempts: appConfig.database?.retry?.maxAttempts || 3,
   baseDelayMs: appConfig.database?.retry?.baseDelayMs || 1000,
   maxDelayMs: appConfig.database?.retry?.maxDelayMs || 5000,
   backoffMultiplier: appConfig.database?.retry?.backoffMultiplier || 2,
   jitterRange: appConfig.database?.retry?.jitterRange || 0.1,
   enableForCriticalOps: appConfig.database?.retry?.enableForCriticalOps !== false,
   enableForHealthChecks: appConfig.database?.retry?.enableForHealthChecks !== false,
   enableForTenantOps: appConfig.database?.retry?.enableForTenantOps !== false,
};

/**
 * Errors that are retryable (temporary/transient errors)
 */
const RETRYABLE_ERRORS = [
   'PROTOCOL_CONNECTION_LOST',
   'ECONNRESET',
   'ETIMEDOUT',
   'ENOTFOUND',
   'ECONNREFUSED',
   'ER_CON_COUNT_ERROR', // Too many connections
   'ER_CONNECTION_KILLED',
   'ER_QUERY_INTERRUPTED',
   'SequelizeConnectionError',
   'SequelizeConnectionTimedOutError',
   'SequelizeConnectionRefusedError',
   'SequelizeHostNotFoundError',
   'SequelizeHostNotReachableError',
   'SequelizeInvalidConnectionError',
   'SequelizeConnectionAcquireTimeoutError',
];

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
   if (!error) {
      return false;
   }

   // Check error code
   if (error.code && RETRYABLE_ERRORS.includes(error.code)) {
      return true;
   }

   // Check error name
   if (error.name && RETRYABLE_ERRORS.includes(error.name)) {
      return true;
   }

   // Check original error (for wrapped errors)
   if (error.original && error.original.code && RETRYABLE_ERRORS.includes(error.original.code)) {
      return true;
   }

   // Check error message patterns
   const message = error.message?.toLowerCase() || '';
   if (
      message.includes('connection') &&
      (message.includes('lost') || message.includes('reset') || message.includes('timeout'))
   ) {
      return true;
   }

   return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt) {
   const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
   const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);

   // Add jitter to prevent thundering herd
   const jitter = cappedDelay * RETRY_CONFIG.jitterRange * (Math.random() * 2 - 1);

   return Math.max(cappedDelay + jitter, RETRY_CONFIG.baseDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for database operations
 * @param {Function} operation - The database operation to execute
 * @param {Object} context - Context information for logging
 * @param {Object} options - Retry options (optional)
 */
async function withRetry(operation, context = {}, options = {}) {
   const config = { ...RETRY_CONFIG, ...options };
   const operationName = context.operation || 'database_operation';
   const operationId = context.operationId || `${operationName}_${Date.now()}`;

   for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
         const startTime = Date.now();
         const result = await operation();
         const duration = Date.now() - startTime;

         // Log successful operation (only if it was retried)
         if (attempt > 1) {
            logSystem('Database operation succeeded after retry', {
               operationId,
               operation: operationName,
               attempt,
               duration,
               ...context,
            });
         }

         return result;
      } catch (error) {
         const isLastAttempt = attempt === config.maxAttempts;
         const shouldRetry = isRetryableError(error) && !isLastAttempt;

         logError(error, {
            operationId,
            operation: operationName,
            attempt,
            maxAttempts: config.maxAttempts,
            willRetry: shouldRetry,
            retryable: isRetryableError(error),
            ...context,
         });

         if (!shouldRetry) {
            throw error;
         }

         // Wait before retry with exponential backoff
         const delay = calculateDelay(attempt);
         logSystem(`Retrying database operation in ${delay}ms`, {
            operationId,
            operation: operationName,
            attempt: attempt + 1,
            delay,
         });

         await sleep(delay);
      }
   }
}

/**
 * Retry wrapper specifically for Sequelize operations
 */
async function withSequelizeRetry(sequelizeOperation, context = {}) {
   return withRetry(sequelizeOperation, {
      ...context,
      operation: context.operation || 'sequelize_operation',
   });
}

/**
 * Retry wrapper for critical business operations
 * Fixed to prevent hanging with proper timeout
 */
async function withCriticalRetry(operation, context = {}) {
   const startTime = Date.now();
   const timeout = context.timeout || 30000; // 30 second timeout

   return Promise.race([
      withRetry(
         operation,
         {
            ...context,
            operation: context.operation || 'critical_operation',
         },
         {
            maxAttempts: 3, // Reduced from 5 to prevent hanging
            baseDelayMs: 1000, // Reduced from 2000
            maxDelayMs: 5000, // Reduced from 10000
         }
      ),
      new Promise((_, reject) =>
         setTimeout(() => reject(new Error(`Critical operation timeout after ${timeout}ms`)), timeout)
      ),
   ]);
}

/**
 * Retry wrapper for transaction operations
 */
async function withTransactionRetry(transactionOperation, context = {}) {
   return withRetry(
      transactionOperation,
      {
         ...context,
         operation: context.operation || 'transaction_operation',
      },
      {
         maxAttempts: 3,
         baseDelayMs: 1500,
         maxDelayMs: 8000,
      }
   );
}

/**
 * Health check with retry for connection validation
 */
async function healthCheckWithRetry(healthCheckOperation, context = {}) {
   return withRetry(
      healthCheckOperation,
      {
         ...context,
         operation: context.operation || 'health_check',
      },
      {
         maxAttempts: 2, // Quick health checks, less retries
         baseDelayMs: 500,
         maxDelayMs: 2000,
      }
   );
}

module.exports = {
   withRetry,
   withSequelizeRetry,
   withCriticalRetry,
   withTransactionRetry,
   healthCheckWithRetry,
   isRetryableError,
   RETRY_CONFIG,
   RETRYABLE_ERRORS,
};
