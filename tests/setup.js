// Jest test setup
require('dotenv').config({ path: '.env' });

// Set test environment
process.env.NODE_ENV = 'test';

// Suppress console logs during testing unless specifically needed
if (process.env.SHOW_LOGS !== 'true') {
   console.log = jest.fn();
   console.warn = jest.fn();
   console.error = jest.fn();
}

// Global test timeout
jest.setTimeout(30000);
