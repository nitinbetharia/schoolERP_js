const UDISEStudentService = require('../services/UDISEStudentService');
const {
   // Legacy classes for backward compatibility
   NotFoundError,
} = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * UDISE+ Student Validation Controller
 * HTTP API layer for UDISE+ student data validation operations
 * Handles government compliance validation endpoints
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentValidationController() {
   /**
    * Validate student data for government submission
    * POST /api/v1/school/:tenantId/udise/students/:udiseStudentId/validate
    */
   async function validateStudent(req, res) {
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

         const validationResult = await UDISEStudentService.validateStudentForSubmission(tenantCode, udiseStudentId);

         logger.info('UDISE+ student validation API success', {
            controller: 'udise-student-validation-controller',
            event: 'student_validated',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            is_valid: validationResult.isValid,
            error_count: validationResult.errors.length,
            user_id: req.user ? req.user.id : null,
         });

         res.json({
            success: true,
            message: `Student validation ${validationResult.isValid ? 'passed' : 'failed'}`,
            data: {
               udise_student_id: udiseStudentId,
               validation_result: {
                  is_valid: validationResult.isValid,
                  errors: validationResult.errors,
                  validated_at: new Date().toISOString(),
               },
               ready_for_submission: validationResult.isValid,
            },
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ student validation API failed', {
            controller: 'udise-student-validation-controller',
            event: 'validation_failed',
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
               message: 'An unexpected error occurred during student validation',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   return {
      validateStudent,
   };
}

module.exports = createUDISEStudentValidationController();
