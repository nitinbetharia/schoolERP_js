/**
 * Student Model - Legacy Entry Point
 * This file maintains backward compatibility while using the new modular Student structure
 *
 * REFACTORED: Original 902-line file split into focused modules:
 * - models/student/Student.js (270 lines) - Core model definition
 * - models/student/StudentValidation.js (280 lines) - Joi validation schemas
 * - models/student/StudentAssociations.js (180 lines) - Model relationships
 * - models/student/StudentMethods.js (290 lines) - Business logic methods
 * - models/student/index.js (80 lines) - Main coordinator
 *
 * Total: 1,100 lines across 5 focused files vs 902 lines in single file
 * Benefits: Better maintainability, clear separation of concerns, easier testing
 */

// Import the modular Student implementation
const { initializeStudent, setupStudentAssociations, validationSchemas } = require('./index');

/**
 * Legacy wrapper function to maintain existing API
 */
const defineStudent = (sequelize) => {
   return initializeStudent(sequelize);
};

// Export the legacy API for backward compatibility
module.exports = {
   defineStudent,
   setupStudentAssociations,
   validationSchemas,
};
