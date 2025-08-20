const UDISEService = require('../services/UDISEService');
const logger = require('../../../utils/logger');
const { formatErrorResponse, getErrorStatusCode } = require('../../../utils/errors');

/**
 * UDISE+ Controller
 * Handles HTTP requests for UDISE+ school registration and census reporting
 */
class UDISEController {
   constructor() {
      this.udiseService = new UDISEService();
   }

   /**
    * Register school with UDISE+ system
    */
   async registerSchool(req, res) {
      try {
         const schoolId = parseInt(req.params.schoolId);
         const userId = req.user?.id;
         const udiseData = req.body;

         if (!schoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_SCHOOL_ID',
                  message: 'Valid school ID is required',
               },
            });
         }

         const udiseSchool = await this.udiseService.registerSchoolWithUDISE(schoolId, udiseData, userId);

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'REGISTRATION',
            event: 'School registered with UDISE+',
            school_id: schoolId,
            udise_code: udiseSchool.udise_code,
            user_id: userId,
         });

         res.status(201).json({
            success: true,
            data: udiseSchool,
            message: 'School registered with UDISE+ successfully',
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'REGISTRATION',
            event: 'School registration failed',
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
    * Get UDISE+ school information
    */
   async getSchoolUDISEInfo(req, res) {
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

         const { UDISESchool } = require('../../../models');
         const udiseSchool = await UDISESchool.findOne({
            where: { school_id: schoolId },
            include: ['school', 'facilities', 'classInfrastructure'],
         });

         if (!udiseSchool) {
            return res.status(404).json({
               success: false,
               error: {
                  code: 'UDISE_NOT_REGISTERED',
                  message: 'School not registered with UDISE+',
               },
            });
         }

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'INFO_RETRIEVAL',
            event: 'Get UDISE school info',
            school_id: schoolId,
            udise_code: udiseSchool.udise_code,
         });

         res.json({
            success: true,
            data: udiseSchool,
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'INFO_RETRIEVAL',
            event: 'Get UDISE school info failed',
            school_id: req.params.schoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Update class-wise enrollment data
    */
   async updateClassEnrollment(req, res) {
      try {
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const userId = req.user?.id;
         const classData = req.body;

         if (!udiseSchoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_UDISE_SCHOOL_ID',
                  message: 'Valid UDISE school ID is required',
               },
            });
         }

         const classInfra = await this.udiseService.updateClassEnrollment(udiseSchoolId, classData, userId);

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'ENROLLMENT',
            event: 'Class enrollment updated',
            udise_school_id: udiseSchoolId,
            class_name: classData.class_name,
            total_enrollment: classInfra.getTotalEnrollment(),
            user_id: userId,
         });

         res.json({
            success: true,
            data: classInfra,
            message: 'Class enrollment data updated successfully',
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'ENROLLMENT',
            event: 'Class enrollment update failed',
            udise_school_id: req.params.udiseSchoolId,
            user_id: req.user?.id,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get class-wise enrollment report
    */
   async getClassEnrollmentReport(req, res) {
      try {
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();

         if (!udiseSchoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_UDISE_SCHOOL_ID',
                  message: 'Valid UDISE school ID is required',
               },
            });
         }

         const enrollmentSummary = await this.udiseService.calculateEnrollmentSummary(udiseSchoolId, academicYear);

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'REPORTING',
            event: 'Class enrollment report generated',
            udise_school_id: udiseSchoolId,
            academic_year: academicYear,
            total_students: enrollmentSummary.total_students,
         });

         res.json({
            success: true,
            data: {
               udise_school_id: udiseSchoolId,
               academic_year: academicYear,
               enrollment_summary: enrollmentSummary,
               generated_at: new Date(),
            },
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'REPORTING',
            event: 'Class enrollment report failed',
            udise_school_id: req.params.udiseSchoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Update school facilities data
    */
   async updateFacilities(req, res) {
      try {
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const userId = req.user?.id;
         const facilitiesData = req.body;

         if (!udiseSchoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_UDISE_SCHOOL_ID',
                  message: 'Valid UDISE school ID is required',
               },
            });
         }

         const { UDISEFacilities } = require('../../../models');
         const currentYear = this.udiseService.getCurrentAcademicYear();

         const [facilities, created] = await UDISEFacilities.findOrCreate({
            where: {
               udise_school_id: udiseSchoolId,
               assessment_year: facilitiesData.assessment_year || currentYear,
            },
            defaults: {
               ...facilitiesData,
               assessment_date: new Date(),
               created_by: userId,
            },
         });

         if (!created) {
            await facilities.update({
               ...facilitiesData,
               assessment_date: new Date(),
               updated_by: userId,
            });
         }

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'FACILITIES',
            event: 'School facilities updated',
            udise_school_id: udiseSchoolId,
            compliance_score: facilities.compliance_score,
            user_id: userId,
         });

         res.json({
            success: true,
            data: facilities,
            message: 'School facilities data updated successfully',
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'FACILITIES',
            event: 'Facilities update failed',
            udise_school_id: req.params.udiseSchoolId,
            user_id: req.user?.id,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Generate annual census report
    */
   async generateCensusReport(req, res) {
      try {
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();

         if (!udiseSchoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_UDISE_SCHOOL_ID',
                  message: 'Valid UDISE school ID is required',
               },
            });
         }

         const censusReport = await this.udiseService.generateAnnualCensusReport(udiseSchoolId, academicYear);

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'CENSUS',
            event: 'Annual census report generated',
            udise_school_id: udiseSchoolId,
            academic_year: academicYear,
            total_enrollment: censusReport.enrollment_summary.total_students,
         });

         res.json({
            success: true,
            data: censusReport,
            message: 'Annual census report generated successfully',
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'CENSUS',
            event: 'Census report generation failed',
            udise_school_id: req.params.udiseSchoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Export UDISE+ data for submission
    */
   async exportUDISEData(req, res) {
      try {
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();
         const format = req.query.format?.toUpperCase() || 'JSON';

         if (!udiseSchoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_UDISE_SCHOOL_ID',
                  message: 'Valid UDISE school ID is required',
               },
            });
         }

         const exportData = await this.udiseService.exportUDISEData(udiseSchoolId, academicYear, format);

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'DATA_EXPORT',
            event: 'UDISE data exported',
            udise_school_id: udiseSchoolId,
            academic_year: academicYear,
            format: format,
         });

         // Set appropriate content type for download
         if (format === 'XML') {
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="udise_${udiseSchoolId}_${academicYear}.xml"`);
         } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="udise_${udiseSchoolId}_${academicYear}.json"`);
         }

         res.json({
            success: true,
            data: exportData,
            message: `UDISE+ data exported in ${format} format`,
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'DATA_EXPORT',
            event: 'UDISE data export failed',
            udise_school_id: req.params.udiseSchoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }

   /**
    * Get compliance status
    */
   async getComplianceStatus(req, res) {
      try {
         const udiseSchoolId = parseInt(req.params.udiseSchoolId);
         const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();

         if (!udiseSchoolId) {
            return res.status(400).json({
               success: false,
               error: {
                  code: 'INVALID_UDISE_SCHOOL_ID',
                  message: 'Valid UDISE school ID is required',
               },
            });
         }

         const complianceStatus = await this.udiseService.calculateComplianceScore(udiseSchoolId, academicYear);
         const dataCompleteness = await this.udiseService.assessDataCompleteness(udiseSchoolId, academicYear);

         logger.info('UDISE Controller Success', {
            controller: 'udise-controller',
            category: 'COMPLIANCE',
            event: 'Compliance status retrieved',
            udise_school_id: udiseSchoolId,
            compliance_level: complianceStatus.compliance_level,
            data_completeness: dataCompleteness.overall_percentage,
         });

         res.json({
            success: true,
            data: {
               udise_school_id: udiseSchoolId,
               academic_year: academicYear,
               compliance_status: complianceStatus,
               data_completeness: dataCompleteness,
               assessment_date: new Date(),
            },
         });
      } catch (error) {
         logger.error('UDISE Controller Error', {
            controller: 'udise-controller',
            category: 'COMPLIANCE',
            event: 'Compliance status retrieval failed',
            udise_school_id: req.params.udiseSchoolId,
            error: error.message,
         });

         const statusCode = getErrorStatusCode(error);
         const errorResponse = formatErrorResponse(error);
         res.status(statusCode).json(errorResponse);
      }
   }
}

module.exports = UDISEController;
