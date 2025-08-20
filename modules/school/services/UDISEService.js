const { DatabaseError, ValidationError, NotFoundError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * UDISE+ Service Layer
 * Business logic for UDISE+ school registration, census reporting, and compliance
 */
class UDISEService {
   constructor() {
      this.currentAcademicYear = this.getCurrentAcademicYear();
   }

   /**
    * Get current academic year in UDISE+ format (YYYY-YYYY)
    */
   getCurrentAcademicYear() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 0-indexed

      // Academic year starts from April (month 4)
      if (month >= 4) {
         return `${year}-${year + 1}`;
      } else {
         return `${year - 1}-${year}`;
      }
   }

   /**
    * Generate UDISE+ school code
    * Format: State(2) + District(2) + Block(3) + Village(2) + School(2) = 11 digits
    */
   async generateUDISECode(locationData) {
      try {
         const { UDISESchool } = require('../../../models');
         const { state_code, district_code, block_code, village_code } = locationData;

         if (!state_code || !district_code || !block_code || !village_code) {
            throw new ValidationError('All location codes are required for UDISE+ code generation');
         }

         // Get next school sequence number for this village
         const existingSchools = await UDISESchool.count({
            where: {
               udise_code: {
                  [require('sequelize').Op.like]: `${state_code}${district_code}${block_code}${village_code}%`,
               },
            },
         });

         const schoolSequence = String(existingSchools + 1).padStart(2, '0');
         const udiseCode = `${state_code}${district_code}${block_code}${village_code}${schoolSequence}`;

         // Verify uniqueness
         const existing = await UDISESchool.findOne({ where: { udise_code: udiseCode } });
         if (existing) {
            throw new ValidationError(`UDISE+ code ${udiseCode} already exists`);
         }

         return udiseCode;
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'generateUDISECode',
            error: error.message,
            locationData,
         });
         throw error;
      }
   }

   /**
    * Register school with UDISE+ system
    */
   async registerSchoolWithUDISE(schoolId, udiseData, userId) {
      try {
         // Get models dynamically to avoid circular dependency
         const { UDISESchool, School } = require('../../../models');

         // Validate school exists
         const school = await School.findByPk(schoolId);
         if (!school) {
            throw new NotFoundError(`School with ID ${schoolId} not found`);
         }

         // Check if already registered
         const existingUDISE = await UDISESchool.findOne({ where: { school_id: schoolId } });
         if (existingUDISE) {
            throw new ValidationError(`School ${schoolId} already registered with UDISE+`);
         }

         // Generate UDISE+ code if not provided
         if (!udiseData.udise_code) {
            udiseData.udise_code = await this.generateUDISECode({
               state_code: udiseData.state_code,
               district_code: udiseData.district_code || '01',
               block_code: udiseData.block_code || '001',
               village_code: udiseData.village_code || '01',
            });
         }

         // Create UDISE+ school record
         const udiseSchool = await UDISESchool.create({
            school_id: schoolId,
            ...udiseData,
            census_submission_status: 'PENDING',
            last_census_year: this.currentAcademicYear,
            created_by: userId,
         });

         // Initialize basic facilities record
         await this.initializeFacilities(udiseSchool.id, userId);

         logger.info('UDISE Service Success', {
            service: 'udise-service',
            method: 'registerSchoolWithUDISE',
            school_id: schoolId,
            udise_code: udiseSchool.udise_code,
            user_id: userId,
         });

         return udiseSchool;
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'registerSchoolWithUDISE',
            school_id: schoolId,
            error: error.message,
            user_id: userId,
         });
         throw error;
      }
   }

   /**
    * Initialize facilities record for UDISE+ school
    */
   async initializeFacilities(udiseSchoolId, userId) {
      try {
         const { UDISEFacilities } = require('../../../models');
         const facilitiesData = {
            udise_school_id: udiseSchoolId,
            assessment_year: this.currentAcademicYear,
            assessment_date: new Date(),
            created_by: userId,
         };

         return await UDISEFacilities.create(facilitiesData);
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'initializeFacilities',
            udise_school_id: udiseSchoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Update class-wise enrollment data
    */
   async updateClassEnrollment(udiseSchoolId, classData, userId) {
      try {
         const { UDISEClassInfrastructure } = require('../../../models');
         const { class_name, academic_year = this.currentAcademicYear } = classData;

         // Find or create class infrastructure record
         const [classInfra, created] = await UDISEClassInfrastructure.findOrCreate({
            where: {
               udise_school_id: udiseSchoolId,
               class_name,
               academic_year,
            },
            defaults: {
               ...classData,
               data_collection_date: new Date(),
               created_by: userId,
            },
         });

         if (!created) {
            // Update existing record
            await classInfra.update({
               ...classData,
               data_collection_date: new Date(),
               updated_by: userId,
            });
         }

         // Validate enrollment consistency
         await this.validateEnrollmentData(classInfra);

         logger.info('UDISE Service Success', {
            service: 'udise-service',
            method: 'updateClassEnrollment',
            udise_school_id: udiseSchoolId,
            class_name,
            total_enrollment: classInfra.getTotalEnrollment(),
         });

         return classInfra;
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'updateClassEnrollment',
            udise_school_id: udiseSchoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Validate enrollment data consistency
    */
   async validateEnrollmentData(classInfra) {
      const totalEnrolled = classInfra.boys_enrolled + classInfra.girls_enrolled + classInfra.transgender_enrolled;
      const categoryTotal =
         classInfra.general_boys +
         classInfra.general_girls +
         classInfra.sc_boys +
         classInfra.sc_girls +
         classInfra.st_boys +
         classInfra.st_girls +
         classInfra.obc_boys +
         classInfra.obc_girls +
         classInfra.minority_boys +
         classInfra.minority_girls;

      if (categoryTotal > totalEnrolled) {
         throw new ValidationError(
            `Category-wise enrollment (${categoryTotal}) exceeds total enrollment (${totalEnrolled}) for class ${classInfra.class_name}`
         );
      }

      return true;
   }

   /**
    * Generate UDISE+ annual census report
    */
   async generateAnnualCensusReport(udiseSchoolId, academicYear = this.currentAcademicYear) {
      try {
         const { UDISESchool, UDISEClassInfrastructure, UDISEFacilities, School } = require('../../../models');
         const udiseSchool = await UDISESchool.findByPk(udiseSchoolId, {
            include: [
               {
                  model: School,
                  as: 'school',
               },
               {
                  model: UDISEClassInfrastructure,
                  as: 'classInfrastructure',
                  where: { academic_year: academicYear },
                  required: false,
               },
               {
                  model: UDISEFacilities,
                  as: 'facilities',
                  where: { assessment_year: academicYear },
                  required: false,
               },
            ],
         });

         if (!udiseSchool) {
            throw new NotFoundError(`UDISE+ school with ID ${udiseSchoolId} not found`);
         }

         // Calculate summary statistics
         const enrollmentSummary = await this.calculateEnrollmentSummary(udiseSchoolId, academicYear);
         const facilitySummary = await this.calculateFacilitySummary(udiseSchoolId, academicYear);

         const censusReport = {
            school_basic_info: {
               udise_code: udiseSchool.udise_code,
               school_name: udiseSchool.school_name,
               school_type: udiseSchool.school_type,
               school_category: udiseSchool.school_category,
               academic_year: academicYear,
            },
            enrollment_summary: enrollmentSummary,
            facility_summary: facilitySummary,
            class_wise_data: udiseSchool.classInfrastructure,
            facilities_data: udiseSchool.facilities[0] || null,
            compliance_status: await this.calculateComplianceScore(udiseSchoolId, academicYear),
            report_generated_on: new Date(),
            data_completeness: await this.assessDataCompleteness(udiseSchoolId, academicYear),
         };

         logger.info('UDISE Service Success', {
            service: 'udise-service',
            method: 'generateAnnualCensusReport',
            udise_school_id: udiseSchoolId,
            academic_year: academicYear,
            total_enrollment: enrollmentSummary.total_students,
         });

         return censusReport;
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'generateAnnualCensusReport',
            udise_school_id: udiseSchoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Calculate enrollment summary statistics
    */
   async calculateEnrollmentSummary(udiseSchoolId, academicYear) {
      const { UDISEClassInfrastructure } = require('../../../models');
      const classData = await UDISEClassInfrastructure.findAll({
         where: {
            udise_school_id: udiseSchoolId,
            academic_year: academicYear,
         },
      });

      const summary = {
         total_students: 0,
         boys: 0,
         girls: 0,
         transgender: 0,
         category_wise: {
            general: 0,
            sc: 0,
            st: 0,
            obc: 0,
            minority: 0,
         },
         cwsn: 0,
         repeaters: 0,
         class_wise: {},
      };

      classData.forEach((classInfra) => {
         summary.total_students += classInfra.getTotalEnrollment();
         summary.boys += classInfra.boys_enrolled;
         summary.girls += classInfra.girls_enrolled;
         summary.transgender += classInfra.transgender_enrolled;

         const categoryWise = classInfra.getCategoryWiseTotal();
         summary.category_wise.general += categoryWise.general;
         summary.category_wise.sc += categoryWise.sc;
         summary.category_wise.st += categoryWise.st;
         summary.category_wise.obc += categoryWise.obc;
         summary.category_wise.minority += categoryWise.minority;

         summary.cwsn += categoryWise.cwsn;
         summary.repeaters += classInfra.repeaters_boys + classInfra.repeaters_girls;

         summary.class_wise[classInfra.class_name] = {
            total: classInfra.getTotalEnrollment(),
            boys: classInfra.boys_enrolled,
            girls: classInfra.girls_enrolled,
            sections: classInfra.number_of_sections,
         };
      });

      return summary;
   }

   /**
    * Calculate facility summary statistics
    */
   async calculateFacilitySummary(udiseSchoolId, academicYear) {
      const { UDISEFacilities } = require('../../../models');
      const facilities = await UDISEFacilities.findOne({
         where: {
            udise_school_id: udiseSchoolId,
            assessment_year: academicYear,
         },
      });

      if (!facilities) {
         return { status: 'NOT_ASSESSED', message: 'Facility data not available' };
      }

      return {
         basic_infrastructure: {
            total_classrooms: facilities.total_classrooms,
            functional_classrooms: facilities.classrooms_in_good_condition,
            drinking_water: facilities.drinking_water_available,
            electricity: facilities.electricity_connection,
            playground: facilities.playground_available,
         },
         toilet_facilities: {
            boys_toilets: facilities.boys_toilets_functional,
            girls_toilets: facilities.girls_toilets_functional,
            cwsn_toilet: facilities.cwsn_toilet_available,
            water_connection: facilities.toilet_water_source === 'CONNECTED_TO_WATER_SUPPLY',
         },
         digital_infrastructure: {
            computers: facilities.computers_functional,
            internet: facilities.internet_connection !== 'NONE',
            digital_classroom: facilities.digital_classroom,
         },
         scores: {
            basic_facilities: facilities.getBasicFacilitiesScore(),
            toilet_compliance: facilities.getToiletComplianceScore(),
            digital_infrastructure: facilities.getDigitalInfrastructureScore(),
         },
         overall_compliance: facilities.compliance_score,
      };
   }

   /**
    * Calculate overall compliance score
    */
   async calculateComplianceScore(udiseSchoolId, academicYear) {
      try {
         const { UDISEClassInfrastructure, UDISEFacilities } = require('../../../models');
         const enrollmentData = await UDISEClassInfrastructure.count({
            where: { udise_school_id: udiseSchoolId, academic_year: academicYear },
         });

         const facilitiesData = await UDISEFacilities.findOne({
            where: { udise_school_id: udiseSchoolId, assessment_year: academicYear },
         });

         let score = 0;
         let maxScore = 100;

         // Enrollment data completeness (30%)
         if (enrollmentData > 0) score += 30;

         // Facility data completeness (70%)
         if (facilitiesData) {
            const facilityScore = facilitiesData.getBasicFacilitiesScore();
            score += ((facilityScore * 0.7) / 100) * 70;
         }

         return {
            overall_score: Math.round(score),
            max_score: maxScore,
            compliance_level:
               score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'NEEDS_IMPROVEMENT' : 'CRITICAL',
            last_updated: new Date(),
         };
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'calculateComplianceScore',
            udise_school_id: udiseSchoolId,
            error: error.message,
         });
         return {
            overall_score: 0,
            max_score: 100,
            compliance_level: 'ERROR',
            error: error.message,
         };
      }
   }

   /**
    * Assess data completeness for UDISE+ submission
    */
   async assessDataCompleteness(udiseSchoolId, academicYear) {
      const { UDISEClassInfrastructure, UDISEFacilities } = require('../../../models');
      const completeness = {
         school_basic_info: true, // Always true if UDISE school exists
         enrollment_data: false,
         facility_data: false,
         missing_classes: [],
         overall_percentage: 0,
      };

      // Check enrollment data
      const classData = await UDISEClassInfrastructure.findAll({
         where: { udise_school_id: udiseSchoolId, academic_year: academicYear },
      });

      if (classData.length > 0) {
         completeness.enrollment_data = true;
      }

      // Check facility data
      const facilityData = await UDISEFacilities.findOne({
         where: { udise_school_id: udiseSchoolId, assessment_year: academicYear },
      });

      if (facilityData) {
         completeness.facility_data = true;
      }

      // Calculate overall percentage
      let score = 0;
      if (completeness.school_basic_info) score += 33.33;
      if (completeness.enrollment_data) score += 33.33;
      if (completeness.facility_data) score += 33.34;

      completeness.overall_percentage = Math.round(score);
      completeness.submission_ready = completeness.overall_percentage >= 90;

      return completeness;
   }

   /**
    * Export data in UDISE+ XML format
    */
   async exportUDISEData(udiseSchoolId, academicYear, format = 'JSON') {
      try {
         const censusReport = await this.generateAnnualCensusReport(udiseSchoolId, academicYear);

         if (format === 'XML') {
            return this.convertToXMLFormat(censusReport);
         }

         return {
            format: 'JSON',
            data: censusReport,
            export_timestamp: new Date(),
            academic_year: academicYear,
         };
      } catch (error) {
         logger.error('UDISE Service Error', {
            service: 'udise-service',
            method: 'exportUDISEData',
            udise_school_id: udiseSchoolId,
            error: error.message,
         });
         throw error;
      }
   }

   /**
    * Convert census report to XML format (placeholder for actual XML conversion)
    */
   convertToXMLFormat(censusReport) {
      // This would implement actual XML conversion logic
      // For now, returning JSON wrapped in XML structure
      return {
         format: 'XML',
         xml_structure: 'UDISE_SCHOOL_CENSUS_DATA',
         data: censusReport,
         note: 'XML conversion implementation pending',
      };
   }
}

module.exports = UDISEService;
