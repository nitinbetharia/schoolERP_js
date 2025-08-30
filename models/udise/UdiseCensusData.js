const { Model } = require('sequelize');
const { sequelize } = require('./database');

// Import modular components
const { 
   allFields, 
   modelOptions 
} = require('./UdiseCensusFields');

const { 
   createCensusDataSchema, 
   updateCensusDataSchema,
   validateEnrollmentData,
   validateTeacherData,
   validateInfrastructureData 
} = require('./UdiseCensusValidation');

const { 
   generateSchoolReport,
   calculateEnrollmentSummary,
   generateTeacherReport,
   generateInfrastructureReport 
} = require('./UdiseCensusReports');

/**
 * UDISE Census Data Model
 * Coordinator model for comprehensive UDISE+ census data collection
 * Uses modular architecture for field definitions, validation, and reporting
 */
class UdiseCensusData extends Model {
   /**
    * Generate comprehensive school report
    * @returns {Object} - Complete school report with all metrics
    */
   async generateReport() {
      const censusData = this.toJSON();
      return generateSchoolReport(censusData);
   }

   /**
    * Get enrollment summary
    * @returns {Object} - Enrollment summary by class levels
    */
   getEnrollmentSummary() {
      return calculateEnrollmentSummary(this.toJSON());
   }

   /**
    * Get teacher report
    * @returns {Object} - Teacher statistics and ratios
    */
   getTeacherReport() {
      return generateTeacherReport(this.toJSON());
   }

   /**
    * Get infrastructure report
    * @returns {Object} - Infrastructure status and facility analysis
    */
   getInfrastructureReport() {
      return generateInfrastructureReport(this.toJSON());
   }

   /**
    * Validate census data for creation
    * @param {Object} data - Data to validate
    * @returns {Promise} - Joi validation result
    */
   static async validateForCreate(data) {
      return createCensusDataSchema.validateAsync(data);
   }

   /**
    * Validate census data for update
    * @param {Object} data - Data to validate
    * @returns {Promise} - Joi validation result
    */
   static async validateForUpdate(data) {
      return updateCensusDataSchema.validateAsync(data);
   }

   /**
    * Perform comprehensive business rule validation
    * @param {Object} data - Census data to validate
    * @returns {Object} - Validation results with any errors
    */
   static validateBusinessRules(data) {
      const results = {
         isValid: true,
         errors: [],
      };

      // Validate enrollment data consistency
      const enrollmentValidation = validateEnrollmentData(data);
      if (!enrollmentValidation.isValid) {
         results.isValid = false;
         results.errors.push(...enrollmentValidation.errors);
      }

      // Validate teacher data consistency
      const teacherValidation = validateTeacherData(data);
      if (!teacherValidation.isValid) {
         results.isValid = false;
         results.errors.push(...teacherValidation.errors);
      }

      // Validate infrastructure data consistency
      const infrastructureValidation = validateInfrastructureData(data);
      if (!infrastructureValidation.isValid) {
         results.isValid = false;
         results.errors.push(...infrastructureValidation.errors);
      }

      return results;
   }
}

// Initialize model with field definitions and options
UdiseCensusData.init(allFields, {
   sequelize,
   ...modelOptions,
});

module.exports = UdiseCensusData;
