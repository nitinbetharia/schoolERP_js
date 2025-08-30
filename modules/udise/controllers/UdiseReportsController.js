const { logError } = require('../../../utils/logger');
const createUdiseService = require('../services/UdiseService');

/**
 * UDISE Reports Controller
 * Handles HTTP requests for UDISE reporting and dashboard operations
 */

/**
 * Generate UDISE reports
 * GET /api/v1/udise/reports/:reportType
 */
async function generateReport(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { reportType } = req.params;
      const UdiseService = createUdiseService();

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
      logError(error, {
         context: 'UdiseReportsController.generateReport',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get dashboard summary
 * GET /api/v1/udise/dashboard
 */
async function getDashboard(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { academic_year } = req.query;
      const UdiseService = createUdiseService();

      const models = await UdiseService.getModels(tenantCode);

      // Build base where clause
      const baseWhere = {};
      if (academic_year) {
         baseWhere.academic_year = academic_year;
      }

      // Get registration statistics
      const registrationStats = await models.UdiseSchoolRegistration.findAll({
         where: baseWhere,
         attributes: ['registration_status', [models.sequelize.fn('COUNT', '*'), 'count']],
         group: ['registration_status'],
         raw: true,
      });

      // Get compliance statistics
      const complianceStats = await models.UdiseComplianceRecord.findAll({
         attributes: [
            'compliance_grade',
            [models.sequelize.fn('COUNT', '*'), 'count'],
            [models.sequelize.fn('AVG', models.sequelize.col('compliance_score')), 'avg_score'],
         ],
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
      logError(error, {
         context: 'UdiseReportsController.getDashboard',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get registration summary report
 * GET /api/v1/udise/reports/registration-summary
 */
async function getRegistrationSummary(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         where: {},
      };

      if (req.query.academic_year) {
         filters.where.academic_year = req.query.academic_year;
      }
      if (req.query.state_code) {
         filters.where.state_code = req.query.state_code;
      }
      if (req.query.district_code) {
         filters.where.district_code = req.query.district_code;
      }

      const reportData = await UdiseService.generateReports(tenantCode, 'registration_summary', filters);

      res.json({
         success: true,
         message: 'Registration summary report generated successfully',
         data: reportData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseReportsController.getRegistrationSummary',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get enrollment statistics report
 * GET /api/v1/udise/reports/enrollment-statistics
 */
async function getEnrollmentStatistics(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         where: {},
      };

      if (req.query.academic_year) {
         filters.where.academic_year = req.query.academic_year;
      }
      if (req.query.data_collection_phase) {
         filters.where.data_collection_phase = req.query.data_collection_phase;
      }

      const reportData = await UdiseService.generateReports(tenantCode, 'enrollment_statistics', filters);

      res.json({
         success: true,
         message: 'Enrollment statistics report generated successfully',
         data: reportData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseReportsController.getEnrollmentStatistics',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get compliance dashboard report
 * GET /api/v1/udise/reports/compliance-dashboard
 */
async function getComplianceDashboard(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         where: {},
      };

      if (req.query.compliance_grade) {
         filters.where.compliance_grade = req.query.compliance_grade;
      }
      if (req.query.min_score) {
         filters.where.compliance_score = {
            [require('sequelize').Op.gte]: parseFloat(req.query.min_score),
         };
      }

      const reportData = await UdiseService.generateReports(tenantCode, 'compliance_dashboard', filters);

      res.json({
         success: true,
         message: 'Compliance dashboard report generated successfully',
         data: reportData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseReportsController.getComplianceDashboard',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get integration status report
 * GET /api/v1/udise/reports/integration-status
 */
async function getIntegrationStatus(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         where: {},
      };

      if (req.query.integration_type) {
         filters.where.integration_type = req.query.integration_type;
      }
      if (req.query.operation_status) {
         filters.where.operation_status = req.query.operation_status;
      }
      if (req.query.date_from && req.query.date_to) {
         filters.where.created_at = {
            [require('sequelize').Op.between]: [req.query.date_from, req.query.date_to],
         };
      }

      const reportData = await UdiseService.generateReports(tenantCode, 'integration_status', filters);

      res.json({
         success: true,
         message: 'Integration status report generated successfully',
         data: reportData,
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseReportsController.getIntegrationStatus',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Get integration logs
 * GET /api/v1/udise/integration-logs
 */
async function getIntegrationLogs(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const UdiseService = createUdiseService();

      const filters = {
         school_id: req.query.school_id,
         integration_type: req.query.integration_type,
         operation_status: req.query.operation_status,
         date_from: req.query.date_from,
         date_to: req.query.date_to,
         limit: parseInt(req.query.limit) || 100,
         offset: parseInt(req.query.offset) || 0,
      };

      const integrationLogs = await UdiseService.getIntegrationLogs(tenantCode, filters);

      res.json({
         success: true,
         message: 'Integration logs retrieved successfully',
         data: integrationLogs,
         pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: integrationLogs.length,
         },
      });
   } catch (error) {
      logError(error, {
         context: 'UdiseReportsController.getIntegrationLogs',
         user: req.user,
      });
      next(error);
   }
}

/**
 * Export report data
 * GET /api/v1/udise/reports/:reportType/export
 */
async function exportReport(req, res, next) {
   try {
      const { tenantCode } = req.user;
      const { reportType } = req.params;
      const { format = 'json' } = req.query;
      const UdiseService = createUdiseService();

      const filters = {
         academic_year: req.query.academic_year,
         state_code: req.query.state_code,
         district_code: req.query.district_code,
         school_id: req.query.school_id,
         date_from: req.query.date_from,
         date_to: req.query.date_to,
      };

      const reportData = await UdiseService.generateReports(tenantCode, reportType, filters);

      if (format === 'csv') {
         res.setHeader('Content-Type', 'text/csv');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.csv"`
         );

         // Simple CSV conversion (would need proper CSV library for production)
         const csvData = JSON.stringify(reportData.data);
         res.send(csvData);
      } else {
         res.json({
            success: true,
            message: `${reportType} report exported successfully`,
            data: reportData,
            exported_at: new Date().toISOString(),
            format,
         });
      }
   } catch (error) {
      logError(error, {
         context: 'UdiseReportsController.exportReport',
         user: req.user,
      });
      next(error);
   }
}

module.exports = {
   generateReport,
   getDashboard,
   getRegistrationSummary,
   getEnrollmentStatistics,
   getComplianceDashboard,
   getIntegrationStatus,
   getIntegrationLogs,
   exportReport,
};
