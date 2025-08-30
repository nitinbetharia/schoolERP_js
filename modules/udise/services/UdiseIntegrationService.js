const { logError, logSystem } = require('../../../utils/logger');
const { createValidationError } = require('../../../utils/errorHelpers');

/**
 * UDISE Integration Service
 * Handles integration logging, external API calls, and report generation
 */

/**
 * Log integration activity
 * @param {string} tenantCode - Tenant code
 * @param {string} schoolId - School ID
 * @param {Object} integrationData - Integration activity data
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Created integration log
 */
async function logIntegration(tenantCode, schoolId, integrationData, getModels) {
   try {
      const models = await getModels(tenantCode);

      const integrationLog = await models.UdiseIntegrationLog.create({
         school_id: schoolId,
         integration_type: integrationData.integration_type,
         operation_name: integrationData.operation_name,
         operation_status: integrationData.operation_status || 'pending',
         request_data: integrationData.request_data || {},
         response_data: integrationData.response_data || {},
         error_message: integrationData.error_message,
         initiated_by: integrationData.initiated_by || 'system',
      });

      logSystem(`UDISE integration logged: ${integrationLog.id}`, {
         tenantCode,
         schoolId,
         operation: integrationData.operation_name,
      });

      return integrationLog;
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.logIntegration',
         tenantCode,
         schoolId,
      });
      // Don't throw here to prevent breaking main operations
      return null;
   }
}

/**
 * Get integration logs with filters
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Array} - Array of integration logs
 */
async function getIntegrationLogs(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const whereClause = {};

      if (filters.school_id) {
         whereClause.school_id = filters.school_id;
      }
      if (filters.integration_type) {
         whereClause.integration_type = filters.integration_type;
      }
      if (filters.operation_status) {
         whereClause.operation_status = filters.operation_status;
      }
      if (filters.date_from && filters.date_to) {
         whereClause.created_at = {
            [require('sequelize').Op.between]: [filters.date_from, filters.date_to],
         };
      }

      const integrationLogs = await models.UdiseIntegrationLog.findAll({
         where: whereClause,
         order: [['created_at', 'DESC']],
         limit: filters.limit || 100,
         offset: filters.offset || 0,
      });

      return integrationLogs;
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.getIntegrationLogs',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Generate registration summary report
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Registration summary report
 */
async function generateRegistrationSummary(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const registrations = await models.UdiseSchoolRegistration.findAll({
         where: filters.where || {},
         attributes: ['registration_status', [models.sequelize.fn('COUNT', '*'), 'count']],
         group: ['registration_status'],
      });

      const statusCounts = {};
      let totalRegistrations = 0;

      registrations.forEach((reg) => {
         const status = reg.get('registration_status');
         const count = parseInt(reg.get('count'));
         statusCounts[status] = count;
         totalRegistrations += count;
      });

      return {
         report_type: 'registration_summary',
         generated_at: new Date(),
         filters: filters,
         data: {
            total_registrations: totalRegistrations,
            status_breakdown: statusCounts,
            completion_rate:
               totalRegistrations > 0
                  ? Math.round(((statusCounts.approved || 0) / totalRegistrations) * 10000) / 100
                  : 0,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.generateRegistrationSummary',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Generate enrollment statistics report
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Enrollment statistics report
 */
async function generateEnrollmentReport(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const censusData = await models.UdiseCensusData.findAll({
         where: filters.where || {},
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: true,
            },
         ],
      });

      let totalEnrollment = 0;
      let totalBoys = 0;
      let totalGirls = 0;
      let totalTeachers = 0;
      const totalSchools = censusData.length;

      const levelEnrollment = {
         pre_primary: 0,
         primary: 0,
         upper_primary: 0,
         secondary: 0,
         higher_secondary: 0,
      };

      censusData.forEach((census) => {
         // Calculate totals for this school
         const schoolBoys = [
            'enrollment_pre_primary_boys',
            'enrollment_class_1_boys',
            'enrollment_class_2_boys',
            'enrollment_class_3_boys',
            'enrollment_class_4_boys',
            'enrollment_class_5_boys',
            'enrollment_class_6_boys',
            'enrollment_class_7_boys',
            'enrollment_class_8_boys',
            'enrollment_class_9_boys',
            'enrollment_class_10_boys',
            'enrollment_class_11_boys',
            'enrollment_class_12_boys',
         ].reduce((sum, field) => sum + (census[field] || 0), 0);

         const schoolGirls = [
            'enrollment_pre_primary_girls',
            'enrollment_class_1_girls',
            'enrollment_class_2_girls',
            'enrollment_class_3_girls',
            'enrollment_class_4_girls',
            'enrollment_class_5_girls',
            'enrollment_class_6_girls',
            'enrollment_class_7_girls',
            'enrollment_class_8_girls',
            'enrollment_class_9_girls',
            'enrollment_class_10_girls',
            'enrollment_class_11_girls',
            'enrollment_class_12_girls',
         ].reduce((sum, field) => sum + (census[field] || 0), 0);

         totalBoys += schoolBoys;
         totalGirls += schoolGirls;
         totalEnrollment += schoolBoys + schoolGirls;
         totalTeachers += census.total_teachers || 0;

         // Level-wise enrollment
         levelEnrollment.pre_primary +=
            (census.enrollment_pre_primary_boys || 0) + (census.enrollment_pre_primary_girls || 0);
         levelEnrollment.primary += ['1', '2', '3', '4', '5'].reduce(
            (sum, cls) =>
               sum + (census[`enrollment_class_${cls}_boys`] || 0) + (census[`enrollment_class_${cls}_girls`] || 0),
            0
         );
         levelEnrollment.upper_primary += ['6', '7', '8'].reduce(
            (sum, cls) =>
               sum + (census[`enrollment_class_${cls}_boys`] || 0) + (census[`enrollment_class_${cls}_girls`] || 0),
            0
         );
         levelEnrollment.secondary += ['9', '10'].reduce(
            (sum, cls) =>
               sum + (census[`enrollment_class_${cls}_boys`] || 0) + (census[`enrollment_class_${cls}_girls`] || 0),
            0
         );
         levelEnrollment.higher_secondary += ['11', '12'].reduce(
            (sum, cls) =>
               sum + (census[`enrollment_class_${cls}_boys`] || 0) + (census[`enrollment_class_${cls}_girls`] || 0),
            0
         );
      });

      const genderRatio = totalBoys > 0 ? (totalGirls / totalBoys) * 100 : 0;
      const averagePTR = totalTeachers > 0 ? totalEnrollment / totalTeachers : 0;

      return {
         report_type: 'enrollment_statistics',
         generated_at: new Date(),
         filters: filters,
         data: {
            total_schools: totalSchools,
            total_enrollment: totalEnrollment,
            total_boys: totalBoys,
            total_girls: totalGirls,
            total_teachers: totalTeachers,
            gender_ratio: Math.round(genderRatio * 100) / 100,
            average_ptr: Math.round(averagePTR * 100) / 100,
            level_enrollment: levelEnrollment,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.generateEnrollmentReport',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Generate compliance dashboard report
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Compliance dashboard report
 */
async function generateComplianceReport(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const complianceRecords = await models.UdiseComplianceRecord.findAll({
         where: filters.where || {},
         include: [
            {
               model: models.UdiseSchoolRegistration,
               as: 'udise_registration',
               required: true,
            },
         ],
      });

      const gradeDistribution = {};
      let totalScore = 0;
      const totalRecords = complianceRecords.length;

      complianceRecords.forEach((record) => {
         if (!gradeDistribution[record.compliance_grade]) {
            gradeDistribution[record.compliance_grade] = 0;
         }
         gradeDistribution[record.compliance_grade]++;
         totalScore += record.compliance_score || 0;
      });

      const averageScore = totalRecords > 0 ? totalScore / totalRecords : 0;

      return {
         report_type: 'compliance_dashboard',
         generated_at: new Date(),
         filters: filters,
         data: {
            total_schools: totalRecords,
            average_compliance_score: Math.round(averageScore * 100) / 100,
            grade_distribution: gradeDistribution,
            compliance_categories: {
               excellent: (gradeDistribution['A+'] || 0) + (gradeDistribution['A'] || 0),
               good: (gradeDistribution['B+'] || 0) + (gradeDistribution['B'] || 0),
               needs_improvement:
                  (gradeDistribution['C+'] || 0) +
                  (gradeDistribution['C'] || 0) +
                  (gradeDistribution['D'] || 0) +
                  (gradeDistribution['F'] || 0),
            },
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.generateComplianceReport',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Generate integration status report
 * @param {string} tenantCode - Tenant code
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Integration status report
 */
async function generateIntegrationReport(tenantCode, filters = {}, getModels) {
   try {
      const models = await getModels(tenantCode);

      const integrationLogs = await models.UdiseIntegrationLog.findAll({
         where: filters.where || {},
         attributes: ['integration_type', 'operation_status', [models.sequelize.fn('COUNT', '*'), 'count']],
         group: ['integration_type', 'operation_status'],
      });

      const statusBreakdown = {};
      let totalOperations = 0;

      integrationLogs.forEach((log) => {
         const type = log.get('integration_type');
         const status = log.get('operation_status');
         const count = parseInt(log.get('count'));

         if (!statusBreakdown[type]) {
            statusBreakdown[type] = {};
         }
         statusBreakdown[type][status] = count;
         totalOperations += count;
      });

      return {
         report_type: 'integration_status',
         generated_at: new Date(),
         filters: filters,
         data: {
            total_operations: totalOperations,
            status_breakdown: statusBreakdown,
         },
      };
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.generateIntegrationReport',
         tenantCode,
      });
      throw error;
   }
}

/**
 * Generate comprehensive UDISE report
 * @param {string} tenantCode - Tenant code
 * @param {string} reportType - Type of report to generate
 * @param {Object} filters - Filter parameters
 * @param {Function} getModels - Function to get models
 * @returns {Object} - Generated report
 */
async function generateReport(tenantCode, reportType, filters = {}, getModels) {
   try {
      switch (reportType) {
         case 'registration_summary':
            return await generateRegistrationSummary(tenantCode, filters, getModels);

         case 'enrollment_statistics':
            return await generateEnrollmentReport(tenantCode, filters, getModels);

         case 'compliance_dashboard':
            return await generateComplianceReport(tenantCode, filters, getModels);

         case 'integration_status':
            return await generateIntegrationReport(tenantCode, filters, getModels);

         default:
            throw createValidationError('Invalid report type');
      }
   } catch (error) {
      logError(error, {
         context: 'UdiseIntegrationService.generateReport',
         tenantCode,
         reportType,
      });
      throw error;
   }
}

module.exports = {
   logIntegration,
   getIntegrationLogs,
   generateRegistrationSummary,
   generateEnrollmentReport,
   generateComplianceReport,
   generateIntegrationReport,
   generateReport,
};
