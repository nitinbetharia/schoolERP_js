const { getTenantModels } = require('../../../models');
const { logger } = require('../../../utils/logger');
const { createValidationError, createConflictError } = require('../../../utils/errorHelpers');

/**
 * UDISE+ Student Registration Service
 * Business logic for UDISE+ student registration operations
 * Handles individual and bulk student registration with government compliance
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentRegistrationService() {
   /**
    * Register a student with UDISE+ system
    * Generates 12-digit UDISE+ student ID automatically
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {number} studentId - Internal student ID
    * @param {Object} udiseData - UDISE+ specific data
    * @param {number} createdBy - User ID who created the record
    * @returns {Promise<Object>} Created UDISE+ student registration
    */
   async function registerStudentWithUDISE(tenantCode, studentId, udiseData, createdBy) {
      try {
         const models = getTenantModels(tenantCode);
         const { UDISEStudent, UDISESchool, Student } = models;

         // Validate student exists
         const student = await Student.findByPk(studentId, {
            include: [
               {
                  model: models.School,
                  as: 'school',
                  include: [
                     {
                        model: UDISESchool,
                        as: 'udiseRegistration',
                        required: true,
                     },
                  ],
               },
            ],
         });

         if (!student) {
            throw (() => {
               const err = new Error(`Student with ID ${studentId} not found`);
               err.statusCode = 404;
               return err;
            })();
         }

         if (!student.school || !student.school.udiseRegistration) {
            throw createValidationError(
               'Student school must have UDISE+ registration before student can be registered'
            );
         }

         // Check if student already has UDISE+ registration
         const existingRegistration = await UDISEStudent.findOne({
            where: { student_id: studentId },
         });

         if (existingRegistration) {
            throw createConflictError('Student UDISE+ registration already exists');
         }

         const udiseSchool = student.school.udiseRegistration;
         const schoolUdiseCode = udiseSchool.udise_code;

         // Generate next sequence number for this school
         const lastStudent = await UDISEStudent.findOne({
            where: { udise_school_id: udiseSchool.id },
            order: [['udise_student_id', 'DESC']],
         });

         let sequenceNumber = 1;
         if (lastStudent && lastStudent.udise_student_id) {
            const lastSequence = parseInt(lastStudent.udise_student_id.slice(-1));
            sequenceNumber = lastSequence + 1;
         }

         // Generate 12-digit UDISE+ student ID
         const udiseStudentId = UDISEStudent.generateUDISEStudentId(schoolUdiseCode, sequenceNumber);

         // Validate Aadhaar number if provided
         if (udiseData.aadhaar_number && !UDISEStudent.validateAadhaarNumber(udiseData.aadhaar_number)) {
            throw createValidationError('Invalid Aadhaar number format or checksum');
         }

         // Create UDISE+ student registration
         const udiseStudentData = {
            student_id: studentId,
            udise_school_id: udiseSchool.id,
            udise_student_id: udiseStudentId,
            enrollment_date: udiseData.enrollment_date || student.admission_date,
            academic_session: udiseData.academic_session || student.academic_year,
            census_year: udiseData.census_year || new Date().getFullYear().toString(),
            enrollment_type: udiseData.enrollment_type || 'FRESH',
            data_validation_status: 'INCOMPLETE',
            is_active: true,
            created_by: createdBy,
            ...udiseData,
         };

         const udiseStudent = await UDISEStudent.create(udiseStudentData);

         logger.info('UDISE+ student registration created', {
            service: 'udise-student-registration-service',
            event: 'student_registered',
            tenant_code: tenantCode,
            student_id: studentId,
            udise_student_id: udiseStudentId,
            udise_school_id: udiseSchool.id,
            created_by: createdBy,
         });

         // Return with associations
         return await UDISEStudent.findByPk(udiseStudent.id, {
            include: [
               {
                  model: Student,
                  as: 'student',
                  include: [
                     { model: models.School, as: 'school' },
                     { model: models.Class, as: 'class' },
                     { model: models.Section, as: 'section' },
                  ],
               },
               {
                  model: UDISESchool,
                  as: 'udiseSchool',
               },
            ],
         });
      } catch (error) {
         logger.error('UDISE+ student registration failed', {
            service: 'udise-student-registration-service',
            event: 'registration_failed',
            tenant_code: tenantCode,
            student_id: studentId,
            error: error.message,
            stack: error.stack,
         });
         throw error;
      }
   }

   /**
    * Bulk register students with UDISE+ system
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {Array} studentRegistrations - Array of student registration data
    * @param {number} createdBy - User ID who created the records
    * @returns {Promise<Object>} Bulk registration results
    */
   async function bulkRegisterStudentsWithUDISE(tenantCode, studentRegistrations, createdBy) {
      try {
         const results = {
            total: studentRegistrations.length,
            successful: [],
            failed: [],
         };

         // Process each registration
         for (const registration of studentRegistrations) {
            try {
               const result = await registerStudentWithUDISE(
                  tenantCode,
                  registration.student_id,
                  registration.udise_data || {},
                  createdBy
               );

               results.successful.push({
                  student_id: registration.student_id,
                  udise_student_id: result.udise_student_id,
                  status: 'SUCCESS',
               });
            } catch (error) {
               results.failed.push({
                  student_id: registration.student_id,
                  error: error.message,
                  status: 'FAILED',
               });

               logger.warn('Individual student registration failed in bulk operation', {
                  service: 'udise-student-registration-service',
                  event: 'bulk_item_failed',
                  tenant_code: tenantCode,
                  student_id: registration.student_id,
                  error: error.message,
               });
            }
         }

         logger.info('Bulk UDISE+ student registration completed', {
            service: 'udise-student-registration-service',
            event: 'bulk_registration_completed',
            tenant_code: tenantCode,
            total_attempted: results.total,
            successful_count: results.successful.length,
            failed_count: results.failed.length,
            created_by: createdBy,
         });

         return results;
      } catch (error) {
         logger.error('Bulk UDISE+ student registration failed', {
            service: 'udise-student-registration-service',
            event: 'bulk_registration_failed',
            tenant_code: tenantCode,
            error: error.message,
         });
         throw error;
      }
   }

   return {
      registerStudentWithUDISE,
      bulkRegisterStudentsWithUDISE,
   };
}

module.exports = createUDISEStudentRegistrationService();
