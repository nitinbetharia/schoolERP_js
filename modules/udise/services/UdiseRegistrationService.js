const { logError, logSystem } = require('../../../utils/logger');
const { createValidationError, createNotFoundError, createDatabaseError } = require('../../../utils/errorHelpers');
const { dbManager } = require('../../../models/system/database');

/**
 * UDISE Registration Service
 * Handles school registration operations, validation, and status management
 */

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
      logError(error, { context: 'UdiseRegistrationService.getModels', tenantCode });
      throw createDatabaseError('Failed to get UDISE models', error);
   }
}

/**
 * Create new UDISE school registration
 * @param {string} tenantCode - Tenant code
 * @param {string} schoolId - School ID
 * @param {Object} registrationData - Registration data
 * @param {string} createdBy - User creating the registration
 * @returns {Object} - Created registration
 */
async function createRegistration(tenantCode, schoolId, registrationData, createdBy) {
   try {
      logSystem(`Creating UDISE registration for school: ${schoolId}`, {
         tenantCode,
      });

      const models = await getModels(tenantCode);

      // Check if registration already exists
      const existingRegistration = await models.UdiseSchoolRegistration.findOne({
         where: { school_id: schoolId },
      });

      if (existingRegistration) {
         throw createValidationError('UDISE registration already exists for this school');
      }

      // Create registration with initial status as draft
      const registration = await models.UdiseSchoolRegistration.create({
         school_id: schoolId,
         registration_status: 'draft',
         ...registrationData,
         created_by: createdBy,
      });

      logSystem(`UDISE registration created: ${registration.id}`, {
         tenantCode,
      });

      return registration;
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.createRegistration',
         tenantCode,
         schoolId,
      });
      throw error;
   }
}

/**
 * Update UDISE registration
 * @param {string} tenantCode - Tenant code
 * @param {number} registrationId - Registration ID
 * @param {Object} updateData - Update data
 * @param {string} updatedBy - User updating the registration
 * @returns {Object} - Updated registration
 */
async function updateRegistration(tenantCode, registrationId, updateData, updatedBy) {
   try {
      const models = await getModels(tenantCode);

      const registration = await models.UdiseSchoolRegistration.findByPk(registrationId);
      if (!registration) {
         throw createNotFoundError('UDISE registration not found');
      }

      // Prevent updating certain fields if already approved
      if (registration.registration_status === 'approved' && updateData.udise_code) {
         throw createValidationError('Cannot modify UDISE code for approved registration');
      }

      await registration.update({
         ...updateData,
         updated_by: updatedBy,
      });

      logSystem(`UDISE registration updated: ${registrationId}`, {
         tenantCode,
      });
      return registration;
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.updateRegistration',
         tenantCode,
         registrationId,
      });
      throw error;
   }
}

/**
 * Submit registration for approval
 * @param {string} tenantCode - Tenant code
 * @param {number} registrationId - Registration ID
 * @param {string} submittedBy - User submitting the registration
 * @returns {Object} - Updated registration
 */
async function submitRegistration(tenantCode, registrationId, submittedBy) {
   try {
      const models = await getModels(tenantCode);

      const registration = await models.UdiseSchoolRegistration.findByPk(registrationId);
      if (!registration) {
         throw createNotFoundError('UDISE registration not found');
      }

      // Validate registration before submission
      const validation = await validateRegistration(tenantCode, registrationId);
      if (!validation.isValid) {
         throw createValidationError('Registration validation failed: ' + validation.errors.join(', '));
      }

      await registration.update({
         registration_status: 'submitted',
         submitted_date: new Date(),
         submitted_by: submittedBy,
      });

      logSystem(`UDISE registration submitted: ${registrationId}`, {
         tenantCode,
      });

      return registration;
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.submitRegistration',
         tenantCode,
         registrationId,
      });
      throw error;
   }
}

/**
 * Get school registrations with filters
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @returns {Array} - Array of registrations
 */
async function getRegistrations(tenantCode, filters = {}) {
   try {
      const models = await getModels(tenantCode);

      const whereClause = {};

      if (filters.school_id) {
         whereClause.school_id = filters.school_id;
      }
      if (filters.registration_status) {
         whereClause.registration_status = filters.registration_status;
      }
      if (filters.state_code) {
         whereClause.state_code = filters.state_code;
      }
      if (filters.district_code) {
         whereClause.district_code = filters.district_code;
      }
      if (filters.academic_year) {
         whereClause.academic_year = filters.academic_year;
      }

      const registrations = await models.UdiseSchoolRegistration.findAll({
         where: whereClause,
         include: [
            {
               model: models.UdiseCensusData,
               as: 'census_data',
               required: false,
            },
            {
               model: models.UdiseComplianceRecord,
               as: 'compliance_records',
               required: false,
            },
         ],
         order: [['created_at', 'DESC']],
         limit: filters.limit || 50,
         offset: filters.offset || 0,
      });

      return registrations;
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.getRegistrations',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Get single registration by ID
 * @param {string} tenantCode - Tenant code
 * @param {number} registrationId - Registration ID
 * @returns {Object} - Registration object
 */
async function getRegistrationById(tenantCode, registrationId) {
   try {
      const models = await getModels(tenantCode);

      const registration = await models.UdiseSchoolRegistration.findByPk(registrationId, {
         include: [
            {
               model: models.UdiseCensusData,
               as: 'census_data',
               required: false,
            },
            {
               model: models.UdiseComplianceRecord,
               as: 'compliance_records',
               required: false,
            },
         ],
      });

      if (!registration) {
         throw createNotFoundError('UDISE registration not found');
      }

      return registration;
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.getRegistrationById',
         tenantCode,
         registrationId,
      });
      throw error;
   }
}

/**
 * Validate UDISE registration data
 * @param {string} tenantCode - Tenant code
 * @param {number} registrationId - Registration ID
 * @returns {Object} - Validation result with errors and warnings
 */
async function validateRegistration(tenantCode, registrationId) {
   try {
      const models = await getModels(tenantCode);

      const registration = await models.UdiseSchoolRegistration.findByPk(registrationId);
      if (!registration) {
         throw createNotFoundError('UDISE registration not found');
      }

      const errors = [];
      const warnings = [];

      // Required field validation
      if (!registration.school_name || registration.school_name.trim().length < 3) {
         errors.push('School name must be at least 3 characters');
      }

      if (!registration.principal_name) {
         errors.push('Principal name is required');
      }

      if (!registration.contact_phone || !/^\d{10}$/.test(registration.contact_phone)) {
         errors.push('Valid 10-digit contact phone is required');
      }

      if (!registration.school_address || registration.school_address.trim().length < 10) {
         errors.push('Complete school address is required');
      }

      // Infrastructure validation
      if (!registration.total_classrooms || registration.total_classrooms < 1) {
         errors.push('At least one classroom is required');
      }

      if (registration.total_classrooms > 0 && !registration.boundary_wall) {
         warnings.push('Boundary wall is recommended for school safety');
      }

      if (registration.toilet_boys + registration.toilet_girls < 1) {
         warnings.push('School should have toilet facilities');
      }

      if (!registration.drinking_water_available) {
         warnings.push('Drinking water facility is essential');
      }

      return {
         isValid: errors.length === 0,
         errors,
         warnings,
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.validateRegistration',
         tenantCode,
         registrationId,
      });
      throw error;
   }
}

/**
 * Delete registration (only if in draft status)
 * @param {string} tenantCode - Tenant code
 * @param {number} registrationId - Registration ID
 * @param {string} deletedBy - User deleting the registration
 * @returns {boolean} - Success status
 */
async function deleteRegistration(tenantCode, registrationId, deletedBy) {
   try {
      const models = await getModels(tenantCode);

      const registration = await models.UdiseSchoolRegistration.findByPk(registrationId);
      if (!registration) {
         throw createNotFoundError('UDISE registration not found');
      }

      if (registration.registration_status !== 'draft') {
         throw createValidationError('Can only delete registrations in draft status');
      }

      await registration.destroy();

      logSystem(`UDISE registration deleted: ${registrationId}`, {
         tenantCode,
         deletedBy,
      });

      return true;
   } catch (error) {
      logError(error, {
         context: 'UdiseRegistrationService.deleteRegistration',
         tenantCode,
         registrationId,
      });
      throw error;
   }
}

module.exports = {
   getModels,
   createRegistration,
   updateRegistration,
   submitRegistration,
   getRegistrations,
   getRegistrationById,
   validateRegistration,
   deleteRegistration,
};
