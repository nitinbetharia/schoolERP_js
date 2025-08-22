const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Global test configuration
global.TEST_TIMEOUT = 30000;
global.API_BASE_URL = 'http://localhost:3000';

// Mock console to reduce noise during tests
global.console = {
   ...console,
   log: jest.fn(),
   debug: jest.fn(),
   info: jest.fn(),
   warn: console.warn,
   error: console.error,
};

// Global setup for all tests
beforeAll(async () => {
   // Setup any global test dependencies
   console.log = jest.fn(); // Mock console.log for cleaner test output
});

afterAll(async () => {
   // Cleanup after all tests
   await new Promise(resolve => setTimeout(resolve, 1000));
});