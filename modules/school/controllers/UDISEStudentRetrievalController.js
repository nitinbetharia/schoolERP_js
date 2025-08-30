const UDISEStudentService = require('../services/UDISEStudentService');
const {
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
} = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * UDISE+ Student Retrieval Controller
 * HTTP API layer for UDISE+ student data retrieval operations
 * Handles individual student and school-based student list endpoints
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentRetrievalController() {
   /**
    * Get UDISE+ student by UDISE+ student ID
    * GET /api/v1/school/:tenantId/udise/students/:udiseStudentId
    */
   async function getStudentById(req, res) {
      try {
         const tenantCode = req.params.tenantId;
         const udiseStudentId = req.params.udiseStudentId;

         if (!udiseStudentId) {
            throw (() => {
               const err = new Error('UDISE+ student ID is required');
               err.statusCode = 400;
               return err;
            })();
         }

         const student = await UDISEStudentService.getUDISEStudentById(tenantCode, udiseStudentId);

         logger.info('UDISE+ student retrieval API success', {
            controller: 'udise-student-retrieval-controller',
            event: 'student_retrieved',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            user_id: req.user ? req.user.id : null,
         });

         res.json({
            success: true,
            message: 'UDISE+ student retrieved successfully',
            data: {
               udise_registration: {
                  udise_student_id: student.udise_student_id,
                  pen_number: student.pen_number,
                  enrollment_date: student.enrollment_date,
                  enrollment_type: student.enrollment_type,
                  academic_session: student.academic_session,
                  census_year: student.census_year,
                  validation_status: student.data_validation_status,
                  validation_errors: student.validation_errors,
                  last_validated_at: student.last_validated_at,
                  // Government IDs (masked for security)
                  aadhaar_verified: student.aadhaar_verified,
                  aadhaar_verification_date: student.aadhaar_verification_date,
                  saral_id: student.saral_id,
                  emis_id: student.emis_id,
                  cbse_uid: student.cbse_uid,
                  cisce_uid: student.cisce_uid,
                  // Special categories
                  rte_beneficiary: student.rte_beneficiary,
                  rte_beneficiary_id: student.rte_beneficiary_id,
                  cwsn_status: student.cwsn_status,
                  cwsn_disability_type: student.cwsn_disability_type,
                  // Educational background
                  mother_tongue: student.mother_tongue,
                  previous_school_type: student.previous_school_type,
                  previous_class: student.previous_class,
                  transfer_certificate_number: student.transfer_certificate_number,
                  // Learning assessment
                  foundational_literacy_level: student.foundational_literacy_level,
                  foundational_numeracy_level: student.foundational_numeracy_level,
                  digital_literacy_level: student.digital_literacy_level,
                  // Metadata
                  is_active: student.is_active,
                  remarks: student.remarks,
                  created_at: student.created_at,
                  updated_at: student.updated_at,
               },
               student_details: student.student,
               school_details: student.udiseSchool,
            },
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ student retrieval API failed', {
            controller: 'udise-student-retrieval-controller',
            event: 'retrieval_failed',
            tenant_code: req.params.tenantId,
            udise_student_id: req.params.udiseStudentId,
            user_id: req.user ? req.user.id : null,
            error: error.message,
         });

         if (error instanceof NotFoundError) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred while retrieving UDISE+ student',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Get UDISE+ students by school
    * GET /api/v1/school/:tenantId/udise/schools/:udiseSchoolId/students
    */
   async function getStudentsBySchool(req, res) {
      try {
         const tenantCode = req.params.tenantId;
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const options = {
            page: req.query.page,
            limit: req.query.limit,
            academic_session: req.query.academic_session,
            census_year: req.query.census_year,
            validation_status: req.query.validation_status,
            is_active: req.query.is_active,
         };

         if (!udiseSchoolId || isNaN(udiseSchoolId)) {
            throw (() => {
               const err = new Error('Valid UDISE+ school ID is required');
               err.statusCode = 400;
               return err;
            })();
         }

         const result = await UDISEStudentService.getUDISEStudentsBySchool(tenantCode, udiseSchoolId, options);

         logger.info('UDISE+ students by school retrieval API success', {
            controller: 'udise-student-retrieval-controller',
            event: 'students_by_school_retrieved',
            tenant_code: tenantCode,
            udise_school_id: udiseSchoolId,
            total_students: result.students.length,
            user_id: req.user ? req.user.id : null,
         });

         res.json({
            success: true,
            message: 'UDISE+ students retrieved successfully',
            data: {
               students: result.students.map((student) => ({
                  udise_student_id: student.udise_student_id,
                  pen_number: student.pen_number,
                  enrollment_date: student.enrollment_date,
                  enrollment_type: student.enrollment_type,
                  academic_session: student.academic_session,
                  census_year: student.census_year,
                  validation_status: student.data_validation_status,
                  student_name: student.student?.user?.full_name || '',
                  admission_number: student.student?.admission_number || '',
                  class: student.student?.class?.class_name || '',
                  section: student.student?.section?.section_name || '',
                  gender: student.student?.gender || '',
                  category: student.student?.category || '',
                  rte_beneficiary: student.rte_beneficiary,
                  cwsn_status: student.cwsn_status,
                  is_active: student.is_active,
                  created_at: student.created_at,
                  updated_at: student.updated_at,
               })),
               pagination: result.pagination,
            },
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ students by school retrieval API failed', {
            controller: 'udise-student-retrieval-controller',
            event: 'students_by_school_failed',
            tenant_code: req.params.tenantId,
            udise_school_id: req.params.udiseSchoolId,
            user_id: req.user ? req.user.id : null,
            error: error.message,
         });

         if (error instanceof ValidationError) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred while retrieving UDISE+ students',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   return {
      getStudentById,
      getStudentsBySchool,
   };
}

module.exports = createUDISEStudentRetrievalController();
