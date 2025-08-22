/**
 * Configuration Helper Utility
 * Handles conversion of human-readable time strings to milliseconds
 */
const ms = require('ms');
const appConfigRaw = require('../config/app-config.json');

/**
 * Recursively process configuration object to convert time strings to milliseconds
 * @param {Object} obj - Configuration object
 * @param {Array} timeFields - Array of field names that should be converted from time strings to ms
 * @returns {Object} - Processed configuration with ms values
 */
function processTimeValues(obj, timeFields = []) {
   if (typeof obj !== 'object' || obj === null) {
      return obj;
   }

   const processed = {};

   for (const [key, value] of Object.entries(obj)) {
      if (timeFields.includes(key) && typeof value === 'string') {
         // Convert time string to milliseconds
         const msValue = ms(value);
         if (msValue === undefined) {
            throw new Error(`Invalid time format for ${key}: ${value}`);
         }
         processed[key] = msValue;
      } else if (typeof value === 'object' && value !== null) {
         // Recursively process nested objects
         processed[key] = processTimeValues(value, timeFields);
      } else {
         processed[key] = value;
      }
   }

   return processed;
}

// Define which fields should be converted from time strings to milliseconds
const TIME_FIELDS = [
   'lockoutTime',
   'sessionMaxAge',
   'rememberMeMaxAge',
   'windowMs',
   'connectTimeout',
   'acquire',
   'idle',
   'evict',
   'acquireTimeout',
   'timeout',
   'idleTimeout',
   'baseDelayMs',
   'maxDelayMs',
];

// Process the configuration and convert time strings to milliseconds
const appConfig = processTimeValues(appConfigRaw, TIME_FIELDS);

module.exports = appConfig;
