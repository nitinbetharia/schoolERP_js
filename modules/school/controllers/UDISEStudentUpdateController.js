const UDISEStudentService = require('../services/UDISEStudentService');
const {
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
} = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * UDISE+ Student Update Controller
 * HTTP API layer for UDISE+ student data modification operations
 * Handles student information update endpoints
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentUpdateController() {
   /**
    * Update UDISE+ student information
    * PUT /api/v1/school/:tenantId/udise/students/:udiseStudentId
    */
   async function updateStudent(req, res) {
      try {
         const tenantCode = req.params.tenantId;
         const udiseStudentId = req.params.udiseStudentId;
         const updateData = req.body;
         const updatedBy = req.user ? req.user.id : null;

         if (!udiseStudentId) {
            throw (() => {
               const err = new Error('UDISE+ student ID is required');
               err.statusCode = 400;
               return err;
            })();
         }

         const updatedStudent = await UDISEStudentService.updateUDISEStudent(
            tenantCode,
            udiseStudentId,
            updateData,
            updatedBy
         );

         logger.info('UDISE+ student update API success', {
            controller: 'udise-student-update-controller',
            event: 'student_updated',
            tenant_code: tenantCode,
            udise_student_id: udiseStudentId,
            user_id: updatedBy,
         });

         res.json({
            success: true,
            message: 'UDISE+ student updated successfully',
            data: {
               udise_student_id: updatedStudent.udise_student_id,
               validation_status: updatedStudent.data_validation_status,
               last_updated: updatedStudent.updated_at,
               updated_fields: Object.keys(updateData),
            },
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ student update API failed', {
            controller: 'udise-student-update-controller',
            event: 'update_failed',
            tenant_code: req.params.tenantId,
            udise_student_id: req.params.udiseStudentId,
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
               message: 'An unexpected error occurred while updating UDISE+ student',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   return {
      updateStudent,
   };
}

module.exports = createUDISEStudentUpdateController();
