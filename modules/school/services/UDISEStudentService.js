const { getTenantModels } = require('../../../models');
const { logger } = require('../../../utils/logger');
const {
   ErrorFactory,
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
   DuplicateError,
} = require('../../../utils/errors');

/**
 * UDISE+ Student Service
 * Business logic for individual student government compliance
 * Handles 12-digit UDISE+ student ID generation and government reporting
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentService() {
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
            throw ErrorFactory.notFound(`Student with ID ${studentId} not found`);
         }

         if (!student.school || !student.school.udiseRegistration) {
            throw ErrorFactory.validation(
               'Student school must have UDISE+ registration before student can be registered'
            );
         }

         // Check if student already has UDISE+ registration
         const existingRegistration = await UDISEStudent.findOne({
            where: { student_id: studentId },
         });

         if (existingRegistration) {
            throw ErrorFactory.conflict('Student already has UDISE+ registration already exists');
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
            throw ErrorFactory.validation('Invalid Aadhaar number format or checksum');
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
            service: 'udise-student-service',
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
            service: 'udise-student-service',
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
    * Update UDISE+ student information
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {string} udiseStudentId - UDISE+ student ID
    * @param {Object} updateData - Data to update
    * @param {number} updatedBy - User ID who updated
    * @returns {Promise<Object>} Updated UDISE+ student
    */
   async function updateUDISEStudent(tenantCode, udiseStudentId, updateData, updatedBy) {
      try {
         const models = getTenantModels(tenantCode);
         const { UDISEStudent, Student, UDISESchool } = models;

         const udiseStudent = await UDISEStudent.findOne({
            where: { udise_student_id: udiseStudentId },
            include: [
               {
                  model: Student,
                  as: 'student',
                  include: [{ model: models.School, as: 'school' }],
               },
               {
                  model: UDISESchool,
                  as: 'udiseSchool',
               },
            ],
         });

         if (!udiseStudent) {
            throw ErrorFactory.notFound(`UDISE+ student with ID ${udiseStudentId} not found`);
         }

         // Validate Aadhaar number if being updated
         if (updateData.aadhaar_number && !UDISEStudent.validateAadhaarNumber(updateData.aadhaar_number)) {
            throw ErrorFactory.validation('Invalid Aadhaar number format or checksum');
         }

         // Update the record
         await udiseStudent.update({
            ...updateData,
            updated_by: updatedBy,
            last_validated_at: null, // Reset validation when data changes
            data_validation_status: 'INCOMPLETE', // Reset validation status
         });

         logger.info('UDISE+ student updated', {
            service: 'udise-student-service',
            event: 'student_updated',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            student_id: udiseStudent.student_id,
            updated_by: updatedBy,
         });

         // Return updated record with associations
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
         logger.error('UDISE+ student update failed', {
            service: 'udise-student-service',
            event: 'update_failed',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get UDISE+ student by UDISE+ ID
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {string} udiseStudentId - UDISE+ student ID
    * @returns {Promise<Object>} UDISE+ student record
    */
   async function getUDISEStudentById(tenantCode, udiseStudentId) {
      try {
         const models = getTenantModels(tenantCode);
         const { UDISEStudent, Student, UDISESchool } = models;

         const udiseStudent = await UDISEStudent.findOne({
            where: { udise_student_id: udiseStudentId },
            include: [
               {
                  model: Student,
                  as: 'student',
                  include: [
                     { model: models.User, as: 'user' },
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

         if (!udiseStudent) {
            throw ErrorFactory.notFound(`UDISE+ student with ID ${udiseStudentId} not found`);
         }

         return udiseStudent;
      } catch (error) {
         logger.error('Get UDISE+ student failed', {
            service: 'udise-student-service',
            event: 'get_failed',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Get UDISE+ students by school
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {number} udiseSchoolId - UDISE+ school ID
    * @param {Object} options - Query options (pagination, filters)
    * @returns {Promise<Object>} List of UDISE+ students
    */
   async function getUDISEStudentsBySchool(tenantCode, udiseSchoolId, options = {}) {
      try {
         const models = getTenantModels(tenantCode);
         const { UDISEStudent, Student, UDISESchool } = models;

         const page = parseInt(options.page) || 1;
         const limit = parseInt(options.limit) || 50;
         const offset = (page - 1) * limit;

         const whereConditions = {
            udise_school_id: udiseSchoolId,
         };

         if (options.academic_session) {
            whereConditions.academic_session = options.academic_session;
         }

         if (options.census_year) {
            whereConditions.census_year = options.census_year;
         }

         if (options.validation_status) {
            whereConditions.data_validation_status = options.validation_status;
         }

         if (options.is_active !== undefined) {
            whereConditions.is_active = options.is_active;
         }

         const { count, rows } = await UDISEStudent.findAndCountAll({
            where: whereConditions,
            include: [
               {
                  model: Student,
                  as: 'student',
                  include: [
                     { model: models.User, as: 'user' },
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
            limit: limit,
            offset: offset,
            order: [['created_at', 'DESC']],
         });

         return {
            students: rows,
            pagination: {
               total: count,
               page: page,
               limit: limit,
               pages: Math.ceil(count / limit),
            },
         };
      } catch (error) {
         logger.error('Get UDISE+ students by school failed', {
            service: 'udise-student-service',
            event: 'get_by_school_failed',
            tenant_code: tenantCode,
            udise_school_id: udiseSchoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Validate student data for government submission
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {string} udiseStudentId - UDISE+ student ID
    * @returns {Promise<Object>} Validation result
    */
   async function validateStudentForSubmission(tenantCode, udiseStudentId) {
      try {
         const models = getTenantModels(tenantCode);
         const { UDISEStudent } = models;

         const udiseStudent = await UDISEStudent.findOne({
            where: { udise_student_id: udiseStudentId },
         });

         if (!udiseStudent) {
            throw ErrorFactory.notFound(`UDISE+ student with ID ${udiseStudentId} not found`);
         }

         const validationResult = udiseStudent.validateForSubmission();

         // Update validation status
         await udiseStudent.update({
            data_validation_status: validationResult.isValid ? 'VALID' : 'INVALID',
            validation_errors: validationResult.isValid ? null : validationResult.errors,
            last_validated_at: new Date(),
         });

         logger.info('UDISE+ student validation completed', {
            service: 'udise-student-service',
            event: 'validation_completed',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            is_valid: validationResult.isValid,
            error_count: validationResult.errors.length,
         });

         return validationResult;
      } catch (error) {
         logger.error('UDISE+ student validation failed', {
            service: 'udise-student-service',
            event: 'validation_failed',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Generate student census data for government submission
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {number} udiseSchoolId - UDISE+ school ID
    * @param {string} censusYear - Census year
    * @returns {Promise<Object>} Census data
    */
   async function generateStudentCensusData(tenantCode, udiseSchoolId, censusYear) {
      try {
         const models = getTenantModels(tenantCode);
         const { UDISEStudent, Student, UDISESchool } = models;

         // Get all valid students for the census year
         const students = await UDISEStudent.findAll({
            where: {
               udise_school_id: udiseSchoolId,
               census_year: censusYear,
               data_validation_status: 'VALID',
               is_active: true,
            },
            include: [
               {
                  model: Student,
                  as: 'student',
                  include: [
                     { model: models.User, as: 'user' },
                     { model: models.Class, as: 'class' },
                     { model: models.Section, as: 'section' },
                  ],
               },
               {
                  model: UDISESchool,
                  as: 'udiseSchool',
               },
            ],
            order: [['udise_student_id', 'ASC']],
         });

         // Generate census statistics
         const stats = {
            total_students: students.length,
            by_gender: {
               male: students.filter((s) => s.student.gender === 'MALE').length,
               female: students.filter((s) => s.student.gender === 'FEMALE').length,
               other: students.filter((s) => s.student.gender === 'OTHER').length,
            },
            by_category: {
               general: students.filter((s) => s.student.category === 'GENERAL').length,
               sc: students.filter((s) => s.student.category === 'SC').length,
               st: students.filter((s) => s.student.category === 'ST').length,
               obc: students.filter((s) => s.student.category === 'OBC').length,
               ews: students.filter((s) => s.student.category === 'EWS').length,
            },
            special_categories: {
               rte_beneficiaries: students.filter((s) => s.rte_beneficiary).length,
               cwsn_students: students.filter((s) => s.cwsn_status).length,
            },
            enrollment_types: {
               fresh: students.filter((s) => s.enrollment_type === 'FRESH').length,
               transfer: students.filter((s) => s.enrollment_type === 'TRANSFER').length,
               readmission: students.filter((s) => s.enrollment_type === 'READMISSION').length,
            },
         };

         logger.info('Student census data generated', {
            service: 'udise-student-service',
            event: 'census_generated',
            tenant_code: tenantCode,
            udise_school_id: udiseSchoolId,
            census_year: censusYear,
            total_students: stats.total_students,
         });

         return {
            school_udise_id: students.length > 0 ? students[0].udiseSchool.udise_code : null,
            census_year: censusYear,
            generation_date: new Date(),
            statistics: stats,
            students: students.map((student) => ({
               udise_student_id: student.udise_student_id,
               pen_number: student.pen_number,
               student_name: student.student.user ? student.student.user.full_name : '',
               gender: student.student.gender,
               date_of_birth: student.student.date_of_birth,
               category: student.student.category,
               admission_number: student.student.admission_number,
               class: student.student.class ? student.student.class.class_name : '',
               section: student.student.section ? student.student.section.section_name : '',
               enrollment_date: student.enrollment_date,
               enrollment_type: student.enrollment_type,
               mother_tongue: student.mother_tongue,
               aadhaar_number: student.aadhaar_number ? '**********' + student.aadhaar_number.slice(-2) : null, // Masked for privacy
               rte_beneficiary: student.rte_beneficiary,
               cwsn_status: student.cwsn_status,
               cwsn_disability_type: student.cwsn_disability_type,
            })),
         };
      } catch (error) {
         logger.error('Student census generation failed', {
            service: 'udise-student-service',
            event: 'census_generation_failed',
            tenant_code: tenantCode,
            udise_school_id: udiseSchoolId,
            census_year: censusYear,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Bulk register students with UDISE+
    *
    * @param {string} tenantCode - Tenant identifier
    * @param {Array} studentRegistrations - Array of student registration data
    * @param {number} createdBy - User ID who created
    * @returns {Promise<Object>} Bulk registration results
    */
   async function bulkRegisterStudentsWithUDISE(tenantCode, studentRegistrations, createdBy) {
      try {
         const results = {
            successful: [],
            failed: [],
            total: studentRegistrations.length,
         };

         for (const registration of studentRegistrations) {
            try {
               const result = await registerStudentWithUDISE(
                  tenantCode,
                  registration.student_id,
                  registration.udise_data,
                  createdBy
               );
               results.successful.push({
                  student_id: registration.student_id,
                  udise_student_id: result.udise_student_id,
               });
            } catch (error) {
               results.failed.push({
                  student_id: registration.student_id,
                  error: error.message,
               });
            }
         }

         logger.info('Bulk UDISE+ student registration completed', {
            service: 'udise-student-service',
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
            service: 'udise-student-service',
            event: 'bulk_registration_failed',
            tenant_code: tenantCode,
            error: error.message,
         });
         throw error;
      }
   }

   return {
      registerStudentWithUDISE,
      updateUDISEStudent,
      getUDISEStudentById,
      getUDISEStudentsBySchool,
      validateStudentForSubmission,
      generateStudentCensusData,
      bulkRegisterStudentsWithUDISE,
   };
}

module.exports = createUDISEStudentService();
