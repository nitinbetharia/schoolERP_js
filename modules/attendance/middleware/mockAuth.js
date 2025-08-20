/**
 * Mock Middleware for Attendance Module Testing
 * Provides basic middleware functions for development
 */

// Mock authentication middleware
const authenticateToken = (req, res, next) => {
   // Mock user for testing
   req.user = {
      id: 1,
      username: 'test_user',
      role: 'ADMIN',
   };
   next();
};

// Mock role authorization
const authorizeRoles = (allowedRoles) => {
   return (req, res, next) => {
      // Allow all roles for testing
      next();
   };
};

module.exports = {
   authenticateToken,
   authorizeRoles,
};
