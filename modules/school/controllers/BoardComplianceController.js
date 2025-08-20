const BoardComplianceService = require('../services/BoardComplianceService');
const logger = require('../../../utils/logger');
const { formatErrorResponse, getErrorStatusCode } = require('../../../utils/errors');

/**
 * Board Compliance Controller
 * Handles HTTP requests for board affiliation and NEP adoption
 */
class BoardComplianceController {
   constructor() {
      this.boardComplianceService = new BoardComplianceService();
   }

   /**
    * Get effective NEP policy for a school
    */
   async getEffectiveNEPPolicy(req, res) {
      try {
         const schoolId = parseInt(req.params.schoolId);

         if (!schoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_SCHOOL_ID',
                  message: 'Valid school ID is required',
               },
            });
         }

         const nepPolicy = await this.boardComplianceService.getEffectiveNEPPolicy(schoolId);

         logger.info('Board Compliance Controller Success', {
            controller: 'board-compliance-controller',
            category: 'NEP_POLICY',
            event: 'Get effective NEP policy',
            school_id: schoolId,
            policy: nepPolicy.effective_policy.policy,
         });

         res.json({
            success: true,
            data: nepPolicy,
         });
      } catch (error) {
         logger.error('Board Compliance Controller Error', {
            controller: 'board-compliance-controller',
            category: 'NEP_POLICY',
            event: 'Get effective NEP policy failed',
            school_id: req.params.schoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Set NEP adoption policy at school level
    */
   async setSchoolNEPPolicy(req, res) {
      try {
         const schoolId = parseInt(req.params.schoolId);
         const userId = req.user?.id;
         const nepConfig = req.body;

         if (!schoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_SCHOOL_ID',
                  message: 'Valid school ID is required',
               },
            });
         }

         const result = await this.boardComplianceService.setSchoolNEPPolicy(schoolId, nepConfig, userId);

         logger.info('Board Compliance Controller Success', {
            controller: 'board-compliance-controller',
            category: 'NEP_POLICY',
            event: 'Set school NEP policy',
            school_id: schoolId,
            policy: nepConfig.policy,
            user_id: userId,
         });

         res.json({
            success: true,
            data: result,
            message: 'School NEP policy updated successfully',
         });
      } catch (error) {
         logger.error('Board Compliance Controller Error', {
            controller: 'board-compliance-controller',
            category: 'NEP_POLICY',
            event: 'Set school NEP policy failed',
            school_id: req.params.schoolId,
            user_id: req.user?.id,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Set trust-wide NEP adoption policy
    */
   async setTrustNEPPolicy(req, res) {
      try {
         const trustId = req.tenantId; // From middleware
         const userId = req.user?.id;
         const nepConfig = req.body;

         if (!trustId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_TRUST_ID',
                  message: 'Valid trust context is required',
               },
            });
         }

         const result = await this.boardComplianceService.setTrustNEPPolicy(trustId, nepConfig, userId);

         logger.info('Board Compliance Controller Success', {
            controller: 'board-compliance-controller',
            category: 'NEP_POLICY',
            event: 'Set trust NEP policy',
            trust_id: trustId,
            policy: nepConfig.policy,
            user_id: userId,
         });

         res.json({
            success: true,
            data: result,
            message: 'Trust NEP policy updated successfully',
         });
      } catch (error) {
         logger.error('Board Compliance Controller Error', {
            controller: 'board-compliance-controller',
            category: 'NEP_POLICY',
            event: 'Set trust NEP policy failed',
            trust_id: req.tenantId,
            user_id: req.user?.id,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get board affiliation compliance status
    */
   async getBoardCompliance(req, res) {
      try {
         const schoolId = parseInt(req.params.schoolId);

         if (!schoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_SCHOOL_ID',
                  message: 'Valid school ID is required',
               },
            });
         }

         const compliance = await this.boardComplianceService.getBoardCompliance(schoolId);

         logger.info('Board Compliance Controller Success', {
            controller: 'board-compliance-controller',
            category: 'BOARD_COMPLIANCE',
            event: 'Get board compliance',
            school_id: schoolId,
            board: compliance.affiliation_board,
         });

         res.json({
            success: true,
            data: compliance,
         });
      } catch (error) {
         logger.error('Board Compliance Controller Error', {
            controller: 'board-compliance-controller',
            category: 'BOARD_COMPLIANCE',
            event: 'Get board compliance failed',
            school_id: req.params.schoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Set board affiliation for a school
    */
   async setBoardAffiliation(req, res) {
      try {
         const schoolId = parseInt(req.params.schoolId);
         const userId = req.user?.id;
         const boardConfig = req.body;

         if (!schoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_SCHOOL_ID',
                  message: 'Valid school ID is required',
               },
            });
         }

         const result = await this.boardComplianceService.setBoardAffiliation(schoolId, boardConfig, userId);

         logger.info('Board Compliance Controller Success', {
            controller: 'board-compliance-controller',
            category: 'BOARD_COMPLIANCE',
            event: 'Set board affiliation',
            school_id: schoolId,
            board_type: boardConfig.board_type,
            user_id: userId,
         });

         res.json({
            success: true,
            data: result,
            message: 'Board affiliation updated successfully',
         });
      } catch (error) {
         logger.error('Board Compliance Controller Error', {
            controller: 'board-compliance-controller',
            category: 'BOARD_COMPLIANCE',
            event: 'Set board affiliation failed',
            school_id: req.params.schoolId,
            user_id: req.user?.id,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get NEP compliance report
    */
   async getNEPComplianceReport(req, res) {
      try {
         const filters = {
            adoption_status: req.query.adoption_status,
         };

         const report = await this.boardComplianceService.getNEPComplianceReport(filters);

         logger.info('Board Compliance Controller Success', {
            controller: 'board-compliance-controller',
            category: 'REPORTS',
            event: 'Generate NEP compliance report',
            total_schools: report.total_schools,
         });

         res.json({
            success: true,
            data: report,
         });
      } catch (error) {
         logger.error('Board Compliance Controller Error', {
            controller: 'board-compliance-controller',
            category: 'REPORTS',
            event: 'Generate NEP compliance report failed',
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }
}

module.exports = BoardComplianceController;
