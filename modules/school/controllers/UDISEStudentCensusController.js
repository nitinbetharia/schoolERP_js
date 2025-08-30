const UDISEStudentService = require('../services/UDISEStudentService');
const {
   // Legacy classes for backward compatibility
   ValidationError,
} = require('../../../utils/validation');
const { logger } = require('../../../utils/logger');

/**
 * UDISE+ Student Census Controller
 * HTTP API layer for UDISE+ student census data generation operations
 * Handles government census report generation endpoints
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentCensusController() {
   /**
    * Generate student census data for government submission
    * GET /api/v1/school/:tenantId/udise/schools/:udiseSchoolId/census/:censusYear
    */
   async function generateCensusData(req, res) {
      try {
         const tenantCode = req.params.tenantId;
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const censusYear = req.params.censusYear;

         if (!udiseSchoolId || isNaN(udiseSchoolId)) {
            throw (() => {
               const err = new Error('Valid UDISE+ school ID is required');
               err.statusCode = 400;
               return err;
            })();
         }

         if (!censusYear) {
            throw (() => {
               const err = new Error('Census year is required');
               err.statusCode = 400;
               return err;
            })();
         }

         const censusData = await UDISEStudentService.generateStudentCensusData(tenantCode, udiseSchoolId, censusYear);

         logger.info('UDISE+ census generation API success', {
            controller: 'udise-student-census-controller',
            event: 'census_generated',
            tenant_code: tenantCode,
            udise_school_id: udiseSchoolId,
            census_year: censusYear,
            total_students: censusData.statistics.total_students,
            user_id: req.user ? req.user.id : null,
         });

         res.json({
            success: true,
            message: 'Student census data generated successfully',
            data: censusData,
            timestamp: new Date().toISOString(),
         });
      } catch (error) {
         logger.error('UDISE+ census generation API failed', {
            controller: 'udise-student-census-controller',
            event: 'census_generation_failed',
            tenant_code: req.params.tenantId,
            udise_school_id: req.params.udiseSchoolId,
            census_year: req.params.censusYear,
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
               message: 'An unexpected error occurred during census generation',
               timestamp: new Date().toISOString(),
            },
         });
      }
   }

   return {
      generateCensusData,
   };
}

module.exports = createUDISEStudentCensusController();
