const registrationController = require('./UdiseRegistrationController');
const censusController = require('./UdiseCensusController');
const complianceController = require('./UdiseComplianceController');
const reportsController = require('./UdiseReportsController');

/**
 * UDISE Controller
 * Main coordinator controller for UDISE+ School Registration System
 * Orchestrates registration, census, compliance, and reporting endpoints
 */
function createUdiseController() {
   return {
      // Registration endpoints
      registration: registrationController,

      // Census endpoints
      census: censusController,

      // Compliance endpoints
      compliance: complianceController,

      // Reports endpoints
      reports: reportsController,
   };
}

module.exports = createUdiseController;
