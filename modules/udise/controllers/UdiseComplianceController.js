const { logError } = require('../../../utils/logger');
const createUdiseService = require('../services/UdiseService');

/**
 * UDISE Compliance Controller
 * Handles HTTP requests for UDISE compliance operations
 */

/**
 * Create compliance record
 * POST /api/v1/udise/compliance
 */
async function createComplianceRecord(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { udise_registration_id } = req.body;
      const createdBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      if (!udise_registration_id) {
         return res.status(400).json({
            success: false,
            message: 'udise_registration_id is required',
         });
      }

      const complianceRecord = await UdiseService.compliance.createComplianceRecord(
         tenantCode,
         udise_registration_id,
         req.body,
         createdBy
      );

      res.status(201).json({
         success: true,
         message: 'Compliance record created successfully',
         data: complianceRecord,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.createComplianceRecord',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Update compliance record
 * PUT /api/v1/udise/compliance/:id
 */
async function updateComplianceRecord(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const updatedBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      const complianceRecord = await UdiseService.compliance.updateComplianceRecord(
         tenantCode,
         id,
         req.body,
         updatedBy
      );

      res.json({
         success: true,
         message: 'Compliance record updated successfully',
         data: complianceRecord,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.updateComplianceRecord',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get compliance records
 * GET /api/v1/udise/compliance
 */
async function getComplianceRecords(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         udise_registration_id: req.query.udise_registration_id,
         compliance_grade: req.query.compliance_grade,
         min_score: req.query.min_score ? parseFloat(req.query.min_score) : undefined,
         limit: parseInt(req.query.limit) || 50,
         offset: parseInt(req.query.offset) || 0,
      };

      const complianceRecords = await UdiseService.compliance.getComplianceRecords(tenantCode, filters);

      res.json({
         success: true,
         message: 'Compliance records retrieved successfully',
         data: complianceRecords,
         pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: complianceRecords.length,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.getComplianceRecords',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get compliance checklist
 * GET /api/v1/udise/compliance/checklist
 */
async function getComplianceChecklist(req, res, next) {
   try {
      const UdiseService = createUdiseService();
      const checklist = UdiseService.compliance.getComplianceChecklist();

      res.json({
         success: true,
         message: 'Compliance checklist retrieved successfully',
         data: checklist,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.getComplianceChecklist',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Calculate compliance score
 * POST /api/v1/udise/compliance/calculate-score
 */
async function calculateComplianceScore(req, res, next) {
   try {
      const UdiseService = createUdiseService();
      const scoreResult = UdiseService.compliance.calculateComplianceScore(req.body);

      res.json({
         success: true,
         message: 'Compliance score calculated successfully',
         data: {
            input_data: req.body,
            score_result: scoreResult,
            calculated_at: new Date(),
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.calculateComplianceScore',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Validate compliance data
 * POST /api/v1/udise/compliance/validate
 */
async function validateComplianceData(req, res, next) {
   try {
      const UdiseService = createUdiseService();
      const validation = UdiseService.compliance.validateComplianceData(req.body);

      res.json({
         success: true,
         message: 'Compliance data validation completed',
         data: {
            input_data: req.body,
            validation,
            validated_at: new Date(),
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.validateComplianceData',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get compliance summary for multiple records
 * GET /api/v1/udise/compliance/summary
 */
async function getComplianceSummary(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         udise_registration_id: req.query.udise_registration_id,
         compliance_grade: req.query.compliance_grade,
         min_score: req.query.min_score ? parseFloat(req.query.min_score) : undefined,
      };

      const complianceRecords = await UdiseService.compliance.getComplianceRecords(tenantCode, filters);

      const summary = UdiseService.compliance.generateComplianceSummary(complianceRecords);

      res.json({
         success: true,
         message: 'Compliance summary generated successfully',
         data: {
            summary,
            filters_applied: filters,
            generated_at: new Date(),
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.getComplianceSummary',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get compliance record by school ID
 * GET /api/v1/udise/compliance/school/:schoolId
 */
async function getComplianceBySchool(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { schoolId } = req.params;
      const UdiseService = createUdiseService();

      const models = await UdiseService.getModels(tenantCode);

      // Get UDISE registration for this school first
      const registration = await models.UdiseSchoolRegistration.findOne({
         where: { school_id: schoolId },
      });

      if (!registration) {
         return res.status(404).json({
            success: false,
            message: 'School not found in UDISE system',
         });
      }

      // Get compliance records for this registration
      const complianceRecords = await models.UdiseComplianceRecord.findAll({
         where: { udise_registration_id: registration.id },
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: false,
            },
         ],
         order: [['created_at', 'DESC']],
      });

      res.json({
         success: true,
         message: 'Compliance records retrieved successfully',
         data: complianceRecords,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseComplianceController.getComplianceBySchool',
         user: req.user,
      });
      next(error);
   }
}

module.exports = {
   createComplianceRecord,
   updateComplianceRecord,
   getComplianceRecords,
   getComplianceChecklist,
   calculateComplianceScore,
   validateComplianceData,
   getComplianceSummary,
   getComplianceBySchool,
};
