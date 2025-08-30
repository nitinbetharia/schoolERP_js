const { logError, logSystem } = require('../../../utils/logger');
const { createValidationError, createNotFoundError } = require('../../../utils/errorHelpers');

/**
 * UDISE Census Service
 * Handles census data collection, validation, and statistical analysis
 */

/**
 * Create census data record
 * @param {string} tenantCode - Tenant code
 * @param {number} udiseRegistrationId - UDISE registration ID
 * @param {Object} censusData - Census data
 * @param {string} createdBy - User creating the record
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Created census record
 */
async function createCensusData(tenantCode, udiseRegistrationId, censusData, createdBy, getModels) {
   try {
      const models = await getModels(tenantCode);

      // Check if census data already exists for this period
      const existingCensus = await models.UdiseCensusData.findOne({
         where: {
            udise_registration_id: udiseRegistrationId,
            academic_year: censusData.academic_year,
            data_collection_phase: censusData.data_collection_phase,
         },
      });

      if (existingCensus) {
         throw createValidationError('Census data already exists for this period');
      }

      const census = await models.UdiseCensusData.create({
         udise_registration_id: udiseRegistrationId,
         ...censusData,
         created_by: createdBy,
      });

      logSystem(`UDISE census data created: ${census.id}`, {
         tenantCode,
      });

      return census;
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusService.createCensusData',
         tenantCode,
         udiseRegistrationId,
      });
      throw error;
   }
}

/**
 * Update census data record
 * @param {string} tenantCode - Tenant code
 * @param {number} censusId - Census ID
 * @param {Object} updateData - Update data
 * @param {string} updatedBy - User updating the record
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Updated census record
 */
async function updateCensusData(tenantCode, censusId, updateData, updatedBy, getModels) {
   try {
      const models = await getModels(tenantCode);

      const census = await models.UdiseCensusData.findByPk(censusId);
      if (!census) {
         throw createNotFoundError('Census data not found');
      }

      // Prevent updating if already approved
      if (census.status === 'approved') {
         throw createValidationError('Cannot modify approved census data');
      }

      await census.update({
         ...updateData,
         updated_by: updatedBy,
      });

      logSystem(`UDISE census data updated: ${censusId}`, {
         tenantCode,
      });

      return census;
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusService.updateCensusData',
         tenantCode,
         censusId,
      });
      throw error;
   }
}

/**
 * Get census data with filters
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Array} - Array of census records
 */
async function getCensusData(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const whereClause = {};

      if (filters.udise_registration_id) {
         whereClause.udise_registration_id = filters.udise_registration_id;
      }
      if (filters.academic_year) {
         whereClause.academic_year = filters.academic_year;
      }
      if (filters.data_collection_phase) {
         whereClause.data_collection_phase = filters.data_collection_phase;
      }
      if (filters.status) {
         whereClause.status = filters.status;
      }

      const censusRecords = await models.UdiseCensusData.findAll({
         where: whereClause,
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: false,
            },
         ],
         order: [['created_at', 'DESC']],
         limit: filters.limit || 50,
         offset: filters.offset || 0,
      });

      return censusRecords;
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusService.getCensusData',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Get census data by ID
 * @param {string} tenantCode - Tenant code
 * @param {number} censusId - Census ID
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Census record
 */
async function getCensusById(tenantCode, censusId, getModels) {
   try {
      const models = await getModels(tenantCode);

      const census = await models.UdiseCensusData.findByPk(censusId, {
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: false,
            },
         ],
      });

      if (!census) {
         throw createNotFoundError('Census data not found');
      }

      return census;
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusService.getCensusById',
         tenantCode,
         censusId,
      });
      throw error;
   }
}

/**
 * Calculate enrollment statistics from census data
 * @param {string} tenantCode - Tenant code
 * @param {Object} census - Census data object
 * @returns {Object} - Enrollment statistics
 */
function calculateEnrollmentStats(tenantCode, census) {
   try {
      // Calculate total boys enrollment
      const totalBoys = [
         'enrollment_pre_primary_boys',
         'enrollment_class_1_boys',
         'enrollment_class_2_boys',
         'enrollment_class_3_boys',
         'enrollment_class_4_boys',
         'enrollment_class_5_boys',
         'enrollment_class_6_boys',
         'enrollment_class_7_boys',
         'enrollment_class_8_boys',
         'enrollment_class_9_boys',
         'enrollment_class_10_boys',
         'enrollment_class_11_boys',
         'enrollment_class_12_boys',
      ].reduce((sum, field) => sum + (census[field] || 0), 0);

      // Calculate total girls enrollment
      const totalGirls = [
         'enrollment_pre_primary_girls',
         'enrollment_class_1_girls',
         'enrollment_class_2_girls',
         'enrollment_class_3_girls',
         'enrollment_class_4_girls',
         'enrollment_class_5_girls',
         'enrollment_class_6_girls',
         'enrollment_class_7_girls',
         'enrollment_class_8_girls',
         'enrollment_class_9_girls',
         'enrollment_class_10_girls',
         'enrollment_class_11_girls',
         'enrollment_class_12_girls',
      ].reduce((sum, field) => sum + (census[field] || 0), 0);

      const totalEnrollment = totalBoys + totalGirls;

      // Calculate special categories
      const totalSC = (census.sc_students_boys || 0) + (census.sc_students_girls || 0);
      const totalST = (census.st_students_boys || 0) + (census.st_students_girls || 0);
      const totalOBC = (census.obc_students_boys || 0) + (census.obc_students_girls || 0);
      const totalMinority = (census.minority_students_boys || 0) + (census.minority_students_girls || 0);
      const totalCWSN = (census.cwsn_students_boys || 0) + (census.cwsn_students_girls || 0);

      // Calculate ratios
      const genderRatio = totalBoys > 0 ? (totalGirls / totalBoys) * 100 : 0;
      const ptrRatio = census.total_teachers > 0 ? totalEnrollment / census.total_teachers : 0;

      return {
         total_enrollment: totalEnrollment,
         total_boys: totalBoys,
         total_girls: totalGirls,
         gender_ratio: Math.round(genderRatio * 100) / 100,
         ptr_ratio: Math.round(ptrRatio * 100) / 100,
         special_categories: {
            sc: totalSC,
            st: totalST,
            obc: totalOBC,
            minority: totalMinority,
            cwsn: totalCWSN,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusService.calculateEnrollmentStats',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Validate census data completeness and consistency
 * @param {Object} censusData - Census data to validate
 * @returns {Object} - Validation result
 */
function validateCensusData(censusData) {
   const errors = [];
   const warnings = [];

   // Check for negative values
   const numericFields = [
      'total_teachers',
      'male_teachers',
      'female_teachers',
      'trained_teachers',
      'total_classrooms',
      'classrooms_good_condition',
      'classrooms_minor_repair',
      'classrooms_major_repair',
   ];

   numericFields.forEach((field) => {
      if (censusData[field] !== undefined && censusData[field] < 0) {
         errors.push(`${field} cannot be negative`);
      }
   });

   // Validate teacher consistency
   if (censusData.total_teachers) {
      const maleTeachers = censusData.male_teachers || 0;
      const femaleTeachers = censusData.female_teachers || 0;

      if (maleTeachers + femaleTeachers !== censusData.total_teachers) {
         errors.push('Sum of male and female teachers must equal total teachers');
      }

      if (censusData.trained_teachers > censusData.total_teachers) {
         errors.push('Trained teachers cannot exceed total teachers');
      }
   }

   // Validate classroom consistency
   if (censusData.total_classrooms) {
      const goodCondition = censusData.classrooms_good_condition || 0;
      const minorRepair = censusData.classrooms_minor_repair || 0;
      const majorRepair = censusData.classrooms_major_repair || 0;

      if (goodCondition + minorRepair + majorRepair !== censusData.total_classrooms) {
         warnings.push('Sum of classroom conditions should equal total classrooms');
      }
   }

   // Check for minimum required facilities
   if (!censusData.drinking_water_available) {
      warnings.push('Drinking water facility is essential for students');
   }

   if (!censusData.toilet_facility_available) {
      warnings.push('Toilet facilities are required for student health and hygiene');
   }

   return {
      isValid: errors.length === 0,
      errors,
      warnings,
   };
}

/**
 * Generate enrollment trends report
 * @param {string} tenantCode - Tenant code
 * @param {Array} censusHistory - Historical census data
 * @returns {Object} - Enrollment trends analysis
 */
function generateEnrollmentTrends(tenantCode, censusHistory) {
   try {
      if (!censusHistory || censusHistory.length < 2) {
         return {
            message: 'Insufficient data for trend analysis',
            trends: {},
         };
      }

      const trends = {};
      const sortedHistory = censusHistory.sort((a, b) => new Date(a.census_date) - new Date(b.census_date));

      // Calculate year-over-year changes
      for (let i = 1; i < sortedHistory.length; i++) {
         const current = calculateEnrollmentStats(tenantCode, sortedHistory[i]);
         const previous = calculateEnrollmentStats(tenantCode, sortedHistory[i - 1]);

         const year = sortedHistory[i].academic_year;
         trends[year] = {
            total_change: current.total_enrollment - previous.total_enrollment,
            boys_change: current.total_boys - previous.total_boys,
            girls_change: current.total_girls - previous.total_girls,
            ptr_change: current.ptr_ratio - previous.ptr_ratio,
            gender_ratio_change: current.gender_ratio - previous.gender_ratio,
         };
      }

      return {
         message: 'Enrollment trends calculated successfully',
         trends,
         summary: {
            total_years: sortedHistory.length,
            latest_enrollment: calculateEnrollmentStats(tenantCode, sortedHistory[sortedHistory.length - 1]),
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusService.generateEnrollmentTrends',
         tenantCode,
      });
      throw error;
   }
}

module.exports = {
   createCensusData,
   updateCensusData,
   getCensusData,
   getCensusById,
   calculateEnrollmentStats,
   validateCensusData,
   generateEnrollmentTrends,
};
