const { dbManager } = require('../../../models/system/database');
const { logError, logSystem } = require('../../../utils/logger');
const { createDatabaseError } = require('../../../utils/errorHelpers');

// Import modular services
const registrationService = require('./UdiseRegistrationService');
const censusService = require('./UdiseCensusService');
const complianceService = require('./UdiseComplianceService');
const integrationService = require('./UdiseIntegrationService');

/**
 * UDISE Service
 * Main coordinator service for UDISE+ School Registration System
 * Orchestrates registration, census, compliance, and integration operations
 */
function createUdiseService() {
   /**
    * Get UDISE models for a specific tenant
    * @param {string} tenantCode - Tenant code
    * @returns {Object} - Models object
    */
   async function getModels(tenantCode) {
      try {
         const tenantDB = await dbManager.getTenantDB(tenantCode);
         const models = require('../../../models')(tenantDB);

         return {
            UdiseSchoolRegistration: models.UdiseSchoolRegistration,
            UdiseCensusData: models.UdiseCensusData,
            UdiseComplianceRecord: models.UdiseComplianceRecord,
            UdiseIntegrationLog: models.UdiseIntegrationLog,
         };
      } catch (error) {
         logError(error, { context: 'UdiseService.getModels', tenantCode });
         throw createDatabaseError('Failed to get UDISE models', error);
      }
   }

   /**
    * UDISE Registration Operations
    * Wrapper for registration service methods with model injection
    */
   const registration = {
      async createRegistration(tenantCode, schoolId, registrationData, createdBy) {
         return registrationService.createRegistration(tenantCode, schoolId, registrationData, createdBy);
      },

      async updateRegistration(tenantCode, registrationId, updateData, updatedBy) {
         return registrationService.updateRegistration(tenantCode, registrationId, updateData, updatedBy);
      },

      async submitRegistration(tenantCode, registrationId, submittedBy) {
         return registrationService.submitRegistration(tenantCode, registrationId, submittedBy);
      },

      async getRegistrations(tenantCode, filters = {}) {
         return registrationService.getRegistrations(tenantCode, filters);
      },

      async getRegistrationById(tenantCode, registrationId) {
         return registrationService.getRegistrationById(tenantCode, registrationId);
      },

      async validateRegistration(tenantCode, registrationId) {
         return registrationService.validateRegistration(tenantCode, registrationId);
      },

      async deleteRegistration(tenantCode, registrationId, deletedBy) {
         return registrationService.deleteRegistration(tenantCode, registrationId, deletedBy);
      },
   };

   /**
    * UDISE Census Operations
    * Wrapper for census service methods with model injection
    */
   const census = {
      async createCensusData(tenantCode, udiseRegistrationId, censusData, createdBy) {
         return censusService.createCensusData(tenantCode, udiseRegistrationId, censusData, createdBy, getModels);
      },

      async updateCensusData(tenantCode, censusId, updateData, updatedBy) {
         return censusService.updateCensusData(tenantCode, censusId, updateData, updatedBy, getModels);
      },

      async getCensusData(tenantCode, filters = {}) {
         return censusService.getCensusData(tenantCode, filters, getModels);
      },

      async getCensusById(tenantCode, censusId) {
         return censusService.getCensusById(tenantCode, censusId, getModels);
      },

      calculateEnrollmentStats(tenantCode, census) {
         return censusService.calculateEnrollmentStats(tenantCode, census);
      },

      validateCensusData(censusData) {
         return censusService.validateCensusData(censusData);
      },

      generateEnrollmentTrends(tenantCode, censusHistory) {
         return censusService.generateEnrollmentTrends(tenantCode, censusHistory);
      },
   };

   /**
    * UDISE Compliance Operations
    * Wrapper for compliance service methods with model injection
    */
   const compliance = {
      async createComplianceRecord(tenantCode, udiseRegistrationId, complianceData, createdBy) {
         return complianceService.createComplianceRecord(
            tenantCode,
            udiseRegistrationId,
            complianceData,
            createdBy,
            getModels
         );
      },

      async updateComplianceRecord(tenantCode, complianceId, updateData, updatedBy) {
         return complianceService.updateComplianceRecord(tenantCode, complianceId, updateData, updatedBy, getModels);
      },

      async getComplianceRecords(tenantCode, filters = {}) {
         return complianceService.getComplianceRecords(tenantCode, filters, getModels);
      },

      calculateComplianceScore(complianceData) {
         return complianceService.calculateComplianceScore(complianceData);
      },

      getComplianceChecklist() {
         return complianceService.getComplianceChecklist();
      },

      validateComplianceData(complianceData) {
         return complianceService.validateComplianceData(complianceData);
      },

      generateComplianceSummary(complianceRecords) {
         return complianceService.generateComplianceSummary(complianceRecords);
      },
   };

   /**
    * Integration and Reporting Operations
    * Wrapper for integration service methods with model injection
    */
   async function logIntegration(tenantCode, schoolId, integrationData) {
      return integrationService.logIntegration(tenantCode, schoolId, integrationData, getModels);
   }

   async function getIntegrationLogs(tenantCode, filters = {}) {
      return integrationService.getIntegrationLogs(tenantCode, filters, getModels);
   }

   /**
    * Generate UDISE Reports
    * @param {string} tenantCode - Tenant code
    * @param {string} reportType - Type of report
    * @param {Object} filters - Filter parameters
    * @returns {Object} - Generated report
    */
   async function generateReports(tenantCode, reportType, filters = {}) {
      try {
         return await integrationService.generateReport(tenantCode, reportType, filters, getModels);
      } catch (error) {
         logError(error, {
            context: 'UdiseService.generateReports',
            tenantCode,
            reportType,
         });
         throw error;
      }
   }

   /**
    * Health check for UDISE service
    * @param {string} tenantCode - Tenant code
    * @returns {Object} - Health check result
    */
   async function healthCheck(tenantCode) {
      try {
         const models = await getModels(tenantCode);

         // Test basic model access
         const registrationCount = await models.UdiseSchoolRegistration.count();
         const censusCount = await models.UdiseCensusData.count();
         const complianceCount = await models.UdiseComplianceRecord.count();

         logSystem(`UDISE service health check passed for ${tenantCode}`, {
            tenantCode,
            registrationCount,
            censusCount,
            complianceCount,
         });

         return {
            status: 'healthy',
            tenant: tenantCode,
            timestamp: new Date(),
            statistics: {
               registrations: registrationCount,
               census_records: censusCount,
               compliance_records: complianceCount,
            },
         };
      } catch (error) {
         logError(error, {
            context: 'UdiseService.healthCheck',
            tenantCode,
         });

         return {
            status: 'unhealthy',
            tenant: tenantCode,
            timestamp: new Date(),
            error: error.message,
         };
      }
   }

   // Return the service interface
   return {
      // Core services
      registration,
      census,
      compliance,

      // Utility functions
      logIntegration,
      getIntegrationLogs,
      generateReports,
      getModels,
      healthCheck,

      // Legacy compatibility (if needed)
      registrationService: registration,
      censusService: census,
      complianceService: compliance,
   };
}

module.exports = createUdiseService;
