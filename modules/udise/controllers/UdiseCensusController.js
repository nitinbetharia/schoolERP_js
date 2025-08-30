const { logError } = require('../../../utils/logger');
const createUdiseService = require('../services/UdiseService');

/**
 * UDISE Census Controller
 * Handles HTTP requests for UDISE census data operations
 */

/**
 * Create census data
 * POST /api/v1/udise/census
 */
async function createCensusData(req, res, next) {
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

      const censusData = await UdiseService.census.createCensusData(
         tenantCode,
         udise_registration_id,
         req.body,
         createdBy
      );

      res.status(201).json({
         success: true,
         message: 'Census data created successfully',
         data: censusData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.createCensusData',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Update census data
 * PUT /api/v1/udise/census/:id
 */
async function updateCensusData(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const updatedBy = req.user.user_id || req.user.email;
      const UdiseService = createUdiseService();

      const censusData = await UdiseService.census.updateCensusData(tenantCode, id, req.body, updatedBy);

      res.json({
         success: true,
         message: 'Census data updated successfully',
         data: censusData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.updateCensusData',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get census data with filters
 * GET /api/v1/udise/census
 */
async function getCensusData(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         udise_registration_id: req.query.udise_registration_id,
         academic_year: req.query.academic_year,
         data_collection_phase: req.query.data_collection_phase,
         status: req.query.status,
         limit: parseInt(req.query.limit) || 50,
         offset: parseInt(req.query.offset) || 0,
      };

      const censusData = await UdiseService.census.getCensusData(tenantCode, filters);

      res.json({
         success: true,
         message: 'Census data retrieved successfully',
         data: censusData,
         pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: censusData.length,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.getCensusData',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get census data by ID
 * GET /api/v1/udise/census/:id
 */
async function getCensusById(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const UdiseService = createUdiseService();

      const censusData = await UdiseService.census.getCensusById(tenantCode, id);

      res.json({
         success: true,
         message: 'Census data retrieved successfully',
         data: censusData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.getCensusById',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get census data by school ID
 * GET /api/v1/udise/census/school/:schoolId
 */
async function getCensusDataBySchool(req, res, next) {
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

      // Get census data for this registration
      const censusData = await models.UdiseCensusData.findAll({
         where: { udise_registration_id: registration.id },
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: false,
            },
         ],
         order: [['census_date', 'DESC']],
      });

      res.json({
         success: true,
         message: 'Census data retrieved successfully',
         data: censusData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.getCensusDataBySchool',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Calculate enrollment statistics
 * GET /api/v1/udise/census/:id/statistics
 */
async function getEnrollmentStatistics(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const UdiseService = createUdiseService();

      const censusData = await UdiseService.census.getCensusById(tenantCode, id);
      const statistics = UdiseService.census.calculateEnrollmentStats(tenantCode, censusData);

      res.json({
         success: true,
         message: 'Enrollment statistics calculated successfully',
         data: {
            census_id: id,
            statistics,
            calculated_at: new Date(),
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.getEnrollmentStatistics',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Validate census data
 * POST /api/v1/udise/census/:id/validate
 */
async function validateCensusData(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { id } = req.params;
      const UdiseService = createUdiseService();

      const censusData = await UdiseService.census.getCensusById(tenantCode, id);
      const validation = UdiseService.census.validateCensusData(censusData);

      res.json({
         success: true,
         message: 'Census data validation completed',
         data: {
            census_id: id,
            validation,
            validated_at: new Date(),
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.validateCensusData',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Generate enrollment trends
 * GET /api/v1/udise/census/trends/:schoolId
 */
async function getEnrollmentTrends(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { schoolId } = req.params;
      const UdiseService = createUdiseService();

      const models = await UdiseService.getModels(tenantCode);

      // Get UDISE registration for this school
      const registration = await models.UdiseSchoolRegistration.findOne({
         where: { school_id: schoolId },
      });

      if (!registration) {
         return res.status(404).json({
            success: false,
            message: 'School not found in UDISE system',
         });
      }

      // Get historical census data
      const censusHistory = await models.UdiseCensusData.findAll({
         where: { udise_registration_id: registration.id },
         order: [['census_date', 'ASC']],
      });

      const trends = UdiseService.census.generateEnrollmentTrends(tenantCode, censusHistory);

      res.json({
         success: true,
         message: 'Enrollment trends generated successfully',
         data: {
            school_id: schoolId,
            trends,
            generated_at: new Date(),
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseCensusController.getEnrollmentTrends',
         user: req.user,
      });
      next(error);
   }
}

module.exports = {
   createCensusData,
   updateCensusData,
   getCensusData,
   getCensusById,
   getCensusDataBySchool,
   getEnrollmentStatistics,
   validateCensusData,
   getEnrollmentTrends,
};
