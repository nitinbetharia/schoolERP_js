const registrationService = require('./UDISEStudentRegistrationService');
// Import other services when created
// const retrievalService = require('./UDISEStudentRetrievalService');
// const updateService = require('./UDISEStudentUpdateService');
// const validationService = require('./UDISEStudentValidationService');
// const censusService = require('./UDISEStudentCensusService');

// For now, import the original full service for unimplemented functions
const originalService = require('./UDISEStudentService_backup');

/**
 * UDISE+ Student Service Coordinator
 * Main entry point for all UDISE+ student business operations
 * Provides a unified interface to all specialized student services
 *
 * Architecture:
 * - registrationService: Handle student registration and bulk operations
 * - retrievalService: Handle data fetching operations (TODO)
 * - updateService: Handle data modification operations (TODO)
 * - validationService: Handle compliance validation operations (TODO)
 * - censusService: Handle government census data generation (TODO)
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentService() {
   return {
      // Registration operations (IMPLEMENTED)
      registerStudentWithUDISE: registrationService.registerStudentWithUDISE,
      bulkRegisterStudentsWithUDISE: registrationService.bulkRegisterStudentsWithUDISE,

      // Retrieval operations (TODO - using original for now)
      getUDISEStudentById: originalService.getUDISEStudentById,
      getUDISEStudentsBySchool: originalService.getUDISEStudentsBySchool,

      // Update operations (TODO - using original for now)
      updateUDISEStudent: originalService.updateUDISEStudent,

      // Validation operations (TODO - using original for now)
      validateStudentForSubmission: originalService.validateStudentForSubmission,

      // Census operations (TODO - using original for now)
      generateStudentCensusData: originalService.generateStudentCensusData,
   };
}

module.exports = createUDISEStudentService;
