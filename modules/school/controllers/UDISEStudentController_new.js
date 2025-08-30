const registrationController = require('./UDISEStudentRegistrationController');
const retrievalController = require('./UDISEStudentRetrievalController');
const updateController = require('./UDISEStudentUpdateController');
const validationController = require('./UDISEStudentValidationController');
const censusController = require('./UDISEStudentCensusController');

/**
 * UDISE+ Student Controller Coordinator
 * Main entry point for all UDISE+ student operations
 * Provides a unified interface to all specialized student controllers
 *
 * Architecture:
 * - registrationController: Handle student registration and bulk operations
 * - retrievalController: Handle data fetching operations
 * - updateController: Handle data modification operations
 * - validationController: Handle compliance validation operations
 * - censusController: Handle government census data generation
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentController() {
   return {
      // Registration operations
      registerStudent: registrationController.registerStudent,
      bulkRegisterStudents: registrationController.bulkRegisterStudents,

      // Retrieval operations
      getStudentById: retrievalController.getStudentById,
      getStudentsBySchool: retrievalController.getStudentsBySchool,

      // Update operations
      updateStudent: updateController.updateStudent,

      // Validation operations
      validateStudent: validationController.validateStudent,

      // Census operations
      generateCensusData: censusController.generateCensusData,
   };
}

module.exports = createUDISEStudentController();
