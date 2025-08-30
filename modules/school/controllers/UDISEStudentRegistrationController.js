const UDISEStudentService = require('../services/UDISEStudentService');
const { createValidationError } = require('../../../utils/errorHelpers');
const {
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
   DuplicateError,
} = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * UDISE+ Student Registration Controller
 * HTTP API layer for UDISE+ student registration operations
 * Handles individual and bulk student registration endpoints
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentRegistrationController() {
   /**
    * Register student with UDISE+ system
    * POST /api/v1/school/:tenantId/udise/students/register
    */
   async function registerStudent(req, res) {
      try {
         const tenantCode = req.params.tenantId;
         const { student_id, ...udiseData } = req.body;
         const createdBy = req.user ? req.user.id : null;

         if (!student_id) {
            throw (() => {
               const err = new Error('Student ID is required');
               err.statusCode = 400;
               return err;
            })();
         }

         const result = await UDISEStudentService.registerStudentWithUDISE(
            tenantCode,
            student_id,
            udiseData,
            createdBy
         );

         logger.info('UDISE+ student registration API success', {
            controller: 'udise-student-registration-controller',
            event: 'student_registered',
            tenant_code: tenantCode,
            student_id: student_id,
            udise_student_id: result.udise_student_id,
            user_id: createdBy,
         });

         res.status(201).json({
            success: true,
            message: 'Student successfully registered with UDISE+ system',
            data: {
               udise_student_id: result.udise_student_id,
               student_id: result.student_id,
               udise_school_id: result.udise_school_id,
               enrollment_date: result.enrollment_date,
               academic_session: result.academic_session,
               census_year: result.census_year,
               validation_status: result.data_validation_status,
               student_details: result.student,
               school_details: result.udiseSchool,
            },
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ student registration API failed', {
            controller: 'udise-student-registration-controller',
            event: 'registration_failed',
            tenant_code: req.params.tenantId,
            student_id: req.body.student_id,
            user_id: req.user ? req.user.id : null,
            error: error.message,
            stack: error.stack,
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

         if (error instanceof DuplicateError) {
            return res.status(409).json({
               success: false,
               error: {
                  code: 'DUPLICATE_ERROR',
                  message: error.message,
                  timestamp: new Date().toISOString(),
               },
            });
         }

         res.status(500).json({
            success: false,
            error: {
               code: 'INTERNAL_SERVER_ERROR',
               message: 'An unexpected error occurred during UDISE+ student registration',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   /**
    * Bulk register students with UDISE+
    * POST /api/v1/school/:tenantId/udise/students/bulk-register
    */
   async function bulkRegisterStudents(req, res) {
      try {
         const tenantCode = req.params.tenantId;
         const { registrations } = req.body;
         const createdBy = req.user ? req.user.id : null;

         if (!Array.isArray(registrations) || registrations.length === 0) {
            throw createValidationError('Registrations array is required and cannot be empty');
         }

         if (registrations.length > 500) {
            throw createValidationError('Maximum 500 students can be registered in one batch');
         }

         const results = await UDISEStudentService.bulkRegisterStudentsWithUDISE(tenantCode, registrations, createdBy);

         logger.info('UDISE+ bulk registration API success', {
            controller: 'udise-student-registration-controller',
            event: 'bulk_registration_completed',
            tenant_code: tenantCode,
            total_attempted: results.total,
            successful_count: results.successful.length,
            failed_count: results.failed.length,
            user_id: createdBy,
         });

         const successCount = results.successful.length;
         const failCount = results.failed.length;

         res.status(201).json({
            success: true,
            message: `Bulk registration completed: ${successCount} successful, ${failCount} failed`,
            data: {
               summary: {
                  total_attempted: results.total,
                  successful_count: successCount,
                  failed_count: failCount,
                  success_rate: ((successCount / results.total) * 100).toFixed(2) + '%',
               },
               successful_registrations: results.successful,
               failed_registrations: results.failed,
            },
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ bulk registration API failed', {
            controller: 'udise-student-registration-controller',
            event: 'bulk_registration_failed',
            tenant_code: req.params.tenantId,
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
               message: 'An unexpected error occurred during bulk registration',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   return {
      registerStudent,
      bulkRegisterStudents,
   };
}

module.exports = createUDISEStudentRegistrationController();
