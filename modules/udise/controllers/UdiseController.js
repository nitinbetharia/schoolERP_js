const { ErrorFactory } = require('../../../utils/errors');
const { logger, logError, logSystem } = require('../../../utils/logger');
const UdiseService = require('../services/UdiseService')();

/**
 * UDISE Controller
 * Handles HTTP requests for UDISE+ School Registration System
 * Manages registration, census data, compliance, and reporting endpoints
 */
function createUdiseController() {
   /**
    * UDISE School Registration Endpoints
    */
   const registrationController = {
      /**
       * Create new UDISE school registration
       * POST /api/v1/udise/registration
       */
      async createRegistration(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { school_id } = req.body;
            const createdBy = req.user.user_id || req.user.email;

            // Validate required fields
            if (!school_id) {
               return res.status(400).json({
                  success: false,
                  message: 'school_id is required',
               });
            }

            const registration = await UdiseService.registration.createRegistration(
               tenantCode,
               school_id,
               req.body,
               createdBy
            );

            res.status(201).json({
               success: true,
               message: 'UDISE registration created successfully',
               data: registration,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.createRegistration', user: req.user });
            next(error);
         }
      },

      /**
       * Update UDISE registration
       * PUT /api/v1/udise/registration/:id
       */
      async updateRegistration(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;
            const updatedBy = req.user.user_id || req.user.email;

            const registration = await UdiseService.registration.updateRegistration(
               tenantCode,
               id,
               req.body,
               updatedBy
            );

            res.json({
               success: true,
               message: 'UDISE registration updated successfully',
               data: registration,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.updateRegistration', user: req.user });
            next(error);
         }
      },

      /**
       * Submit registration for approval
       * POST /api/v1/udise/registration/:id/submit
       */
      async submitRegistration(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;
            const submittedBy = req.user.user_id || req.user.email;

            const registration = await UdiseService.registration.submitRegistration(tenantCode, id, submittedBy);

            res.json({
               success: true,
               message: 'UDISE registration submitted for approval',
               data: registration,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.submitRegistration', user: req.user });
            next(error);
         }
      },

      /**
       * Get UDISE registrations
       * GET /api/v1/udise/registration
       */
      async getRegistrations(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const filters = {
               school_id: req.query.school_id,
               registration_status: req.query.registration_status,
               state_code: req.query.state_code,
               district_code: req.query.district_code,
               academic_year: req.query.academic_year,
               limit: parseInt(req.query.limit) || 50,
               offset: parseInt(req.query.offset) || 0,
            };

            const registrations = await UdiseService.registration.getRegistrations(tenantCode, filters);

            res.json({
               success: true,
               message: 'UDISE registrations retrieved successfully',
               data: registrations,
               pagination: {
                  limit: filters.limit,
                  offset: filters.offset,
                  total: registrations.length,
               },
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.getRegistrations', user: req.user });
            next(error);
         }
      },

      /**
       * Get single UDISE registration
       * GET /api/v1/udise/registration/:id
       */
      async getRegistration(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;

            const models = await UdiseService.getModels(tenantCode);
            const registration = await models.UdiseSchoolRegistration.findByPk(id, {
               include: [
                  {
                     model: models.UdiseCensusData,
                     as: 'census_data',
                  },
                  {
                     model: models.UdiseComplianceRecord,
                     as: 'compliance_records',
                  },
               ],
            });

            if (!registration) {
               return res.status(404).json({
                  success: false,
                  message: 'UDISE registration not found',
               });
            }

            res.json({
               success: true,
               message: 'UDISE registration retrieved successfully',
               data: registration,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.getRegistration', user: req.user });
            next(error);
         }
      },

      /**
       * Validate registration
       * POST /api/v1/udise/registration/:id/validate
       */
      async validateRegistration(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;

            const validation = await UdiseService.registration.validateRegistration(tenantCode, id);

            res.json({
               success: true,
               message: 'Registration validation completed',
               data: validation,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.validateRegistration', user: req.user });
            next(error);
         }
      },
   };

   /**
    * UDISE Census Data Endpoints
    */
   const censusController = {
      /**
       * Create census data
       * POST /api/v1/udise/census
       */
      async createCensusData(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { udise_registration_id } = req.body;
            const createdBy = req.user.user_id || req.user.email;

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
            logError(error, { context: 'UdiseController.createCensusData', user: req.user });
            next(error);
         }
      },

      /**
       * Update census data
       * PUT /api/v1/udise/census/:id
       */
      async updateCensusData(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;
            const updatedBy = req.user.user_id || req.user.email;

            const models = await UdiseService.getModels(tenantCode);
            const censusData = await models.UdiseCensusData.findByPk(id);

            if (!censusData) {
               return res.status(404).json({
                  success: false,
                  message: 'Census data not found',
               });
            }

            await censusData.update({
               ...req.body,
               updated_by: updatedBy,
            });

            res.json({
               success: true,
               message: 'Census data updated successfully',
               data: censusData,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.updateCensusData', user: req.user });
            next(error);
         }
      },

      /**
       * Get enrollment statistics
       * GET /api/v1/udise/census/:id/stats
       */
      async getEnrollmentStats(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;

            const stats = await UdiseService.census.calculateEnrollmentStats(tenantCode, id);

            res.json({
               success: true,
               message: 'Enrollment statistics calculated successfully',
               data: stats,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.getEnrollmentStats', user: req.user });
            next(error);
         }
      },

      /**
       * Get census data by school
       * GET /api/v1/udise/census/school/:schoolId
       */
      async getCensusDataBySchool(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { schoolId } = req.params;
            const { academic_year } = req.query;

            const models = await UdiseService.getModels(tenantCode);

            const whereClause = { school_id: schoolId };
            if (academic_year) whereClause.academic_year = academic_year;

            const censusData = await models.UdiseCensusData.findAll({
               where: whereClause,
               include: [
                  {
                     model: models.UdiseSchoolRegistration,
                     as: 'udise_registration',
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
            logError(error, { context: 'UdiseController.getCensusDataBySchool', user: req.user });
            next(error);
         }
      },
   };

   /**
    * UDISE Compliance Endpoints
    */
   const complianceController = {
      /**
       * Create compliance record
       * POST /api/v1/udise/compliance
       */
      async createComplianceRecord(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { udise_registration_id } = req.body;
            const createdBy = req.user.user_id || req.user.email;

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
            logError(error, { context: 'UdiseController.createComplianceRecord', user: req.user });
            next(error);
         }
      },

      /**
       * Update compliance record
       * PUT /api/v1/udise/compliance/:id
       */
      async updateComplianceRecord(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { id } = req.params;
            const updatedBy = req.user.user_id || req.user.email;

            const models = await UdiseService.getModels(tenantCode);
            const complianceRecord = await models.UdiseComplianceRecord.findByPk(id);

            if (!complianceRecord) {
               return res.status(404).json({
                  success: false,
                  message: 'Compliance record not found',
               });
            }

            // Recalculate compliance score with updated data
            const score = UdiseService.compliance.calculateComplianceScore({
               ...complianceRecord.toJSON(),
               ...req.body,
            });

            await complianceRecord.update({
               ...req.body,
               compliance_score: score.score,
               compliance_grade: score.grade,
               updated_by: updatedBy,
            });

            res.json({
               success: true,
               message: 'Compliance record updated successfully',
               data: complianceRecord,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.updateComplianceRecord', user: req.user });
            next(error);
         }
      },

      /**
       * Get compliance records by school
       * GET /api/v1/udise/compliance/school/:schoolId
       */
      async getComplianceBySchool(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { schoolId } = req.params;
            const { academic_year } = req.query;

            const models = await UdiseService.getModels(tenantCode);

            const whereClause = { school_id: schoolId };
            if (academic_year) whereClause.academic_year = academic_year;

            const complianceRecords = await models.UdiseComplianceRecord.findAll({
               where: whereClause,
               include: [
                  {
                     model: models.UdiseSchoolRegistration,
                     as: 'udise_registration',
                  },
               ],
               order: [['compliance_date', 'DESC']],
            });

            res.json({
               success: true,
               message: 'Compliance records retrieved successfully',
               data: complianceRecords,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.getComplianceBySchool', user: req.user });
            next(error);
         }
      },
   };

   /**
    * UDISE Reports Endpoints
    */
   const reportsController = {
      /**
       * Generate UDISE reports
       * GET /api/v1/udise/reports/:reportType
       */
      async generateReport(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { reportType } = req.params;

            const filters = {
               academic_year: req.query.academic_year,
               state_code: req.query.state_code,
               district_code: req.query.district_code,
               school_id: req.query.school_id,
               date_from: req.query.date_from,
               date_to: req.query.date_to,
            };

            const reportData = await UdiseService.generateReports(tenantCode, reportType, filters);

            res.json({
               success: true,
               message: `${reportType} report generated successfully`,
               data: reportData,
               generated_at: new Date().toISOString(),
               filters_applied: filters,
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.generateReport', user: req.user });
            next(error);
         }
      },

      /**
       * Get dashboard summary
       * GET /api/v1/udise/dashboard
       */
      async getDashboard(req, res, next) {
         try {
            const { tenantCode } = req.user;
            const { academic_year } = req.query;

            const models = await UdiseService.getModels(tenantCode);

            // Get registration summary
            const registrationStats = await models.UdiseSchoolRegistration.findAll({
               attributes: [
                  'registration_status',
                  [models.UdiseSchoolRegistration.sequelize.fn('COUNT', '*'), 'count'],
               ],
               where: academic_year ? { academic_year } : {},
               group: ['registration_status'],
               raw: true,
            });

            // Get compliance summary
            const complianceStats = await models.UdiseComplianceRecord.findAll({
               attributes: [
                  'compliance_grade',
                  [models.UdiseComplianceRecord.sequelize.fn('COUNT', '*'), 'count'],
                  [
                     models.UdiseComplianceRecord.sequelize.fn(
                        'AVG',
                        models.UdiseComplianceRecord.sequelize.col('compliance_score')
                     ),
                     'avg_score',
                  ],
               ],
               where: academic_year ? { academic_year } : {},
               group: ['compliance_grade'],
               raw: true,
            });

            // Get recent integration logs
            const recentIntegrations = await models.UdiseIntegrationLog.findAll({
               limit: 10,
               order: [['created_at', 'DESC']],
               attributes: ['integration_type', 'operation_status', 'created_at', 'processing_time_ms'],
            });

            res.json({
               success: true,
               message: 'UDISE dashboard data retrieved successfully',
               data: {
                  registration_summary: registrationStats,
                  compliance_summary: complianceStats,
                  recent_integrations: recentIntegrations,
                  generated_at: new Date().toISOString(),
               },
            });
         } catch (error) {
            logError(error, { context: 'UdiseController.getDashboard', user: req.user });
            next(error);
         }
      },
   };

   return {
      registration: registrationController,
      census: censusController,
      compliance: complianceController,
      reports: reportsController,
   };
}

module.exports = createUdiseController;
