const { Op } = require("sequelize");
const { logger, logDB, logError, logSystem } = require("../../../utils/logger");
const { ErrorFactory } = require("../../../utils/errors");
const { dbManager } = require("../../../models/database");

/**
 * UDISE Service
 * Comprehensive service for managing UDISE+ School Registration System
 * Handles registration, census data, compliance, and external system integration
 */
function createUdiseService() {
  /**
   * Get UDISE models for a specific tenant
   */
  async function getModels(tenantCode) {
    try {
      const tenantDB = await dbManager.getTenantDB(tenantCode);
      const models = require("../../../models")(tenantDB);

      return {
        UdiseSchoolRegistration: models.UdiseSchoolRegistration,
        UdiseCensusData: models.UdiseCensusData,
        UdiseComplianceRecord: models.UdiseComplianceRecord,
        UdiseIntegrationLog: models.UdiseIntegrationLog,
      };
    } catch (error) {
      logError(error, { context: "UdiseService.getModels", tenantCode });
      throw ErrorFactory.createDatabaseError(
        "Failed to get UDISE models",
        error,
      );
    }
  }

  /**
   * UDISE School Registration Operations
   */
  const registrationService = {
    /**
     * Create new UDISE school registration
     */
    async createRegistration(
      tenantCode,
      schoolId,
      registrationData,
      createdBy,
    ) {
      try {
        logSystem(`Creating UDISE registration for school: ${schoolId}`, {
          tenantCode,
        });

        const models = await getModels(tenantCode);

        // Check if registration already exists
        const existingRegistration =
          await models.UdiseSchoolRegistration.findOne({
            where: { school_id: schoolId },
          });

        if (existingRegistration) {
          throw ErrorFactory.createValidationError(
            "UDISE registration already exists for this school",
          );
        }

        // Validate required fields
        const requiredFields = [
          "school_name_english",
          "state_code",
          "district_code",
          "block_code",
          "school_category",
          "school_management",
          "school_type",
          "recognition_status",
          "academic_year",
        ];
        for (const field of requiredFields) {
          if (!registrationData[field]) {
            throw ErrorFactory.createValidationError(
              `${field} is required for UDISE registration`,
            );
          }
        }

        const registration = await models.UdiseSchoolRegistration.create({
          school_id: schoolId,
          ...registrationData,
          registration_status: "draft",
          created_by: createdBy,
        });

        // Log integration event
        await this.logIntegration(tenantCode, schoolId, {
          integration_type: "registration_submit",
          operation_name: "Create UDISE Registration",
          operation_status: "success",
          records_processed: 1,
          initiated_by: "user",
          user_id: createdBy,
        });

        logSystem(
          `UDISE registration created successfully: ${registration.id}`,
          { tenantCode, schoolId },
        );
        return registration;
      } catch (error) {
        logError(error, {
          context: "UdiseService.createRegistration",
          tenantCode,
          schoolId,
        });

        // Log failed integration
        await this.logIntegration(tenantCode, schoolId, {
          integration_type: "registration_submit",
          operation_name: "Create UDISE Registration",
          operation_status: "failure",
          error_message: error.message,
          initiated_by: "user",
        }).catch(() => {}); // Ignore logging errors

        throw error;
      }
    },

    /**
     * Update UDISE registration
     */
    async updateRegistration(
      tenantCode,
      registrationId,
      updateData,
      updatedBy,
    ) {
      try {
        const models = await getModels(tenantCode);

        const registration =
          await models.UdiseSchoolRegistration.findByPk(registrationId);
        if (!registration) {
          throw ErrorFactory.createNotFoundError(
            "UDISE registration not found",
          );
        }

        // Prevent updating certain fields if already approved
        if (
          registration.registration_status === "approved" &&
          updateData.udise_code
        ) {
          throw ErrorFactory.createValidationError(
            "Cannot modify UDISE code for approved registration",
          );
        }

        await registration.update({
          ...updateData,
          updated_by: updatedBy,
        });

        logSystem(`UDISE registration updated: ${registrationId}`, {
          tenantCode,
        });
        return registration;
      } catch (error) {
        logError(error, {
          context: "UdiseService.updateRegistration",
          tenantCode,
          registrationId,
        });
        throw error;
      }
    },

    /**
     * Submit registration for approval
     */
    async submitRegistration(tenantCode, registrationId, submittedBy) {
      try {
        const models = await getModels(tenantCode);

        const registration =
          await models.UdiseSchoolRegistration.findByPk(registrationId);
        if (!registration) {
          throw ErrorFactory.createNotFoundError(
            "UDISE registration not found",
          );
        }

        if (registration.registration_status !== "draft") {
          throw ErrorFactory.createValidationError(
            "Only draft registrations can be submitted",
          );
        }

        // Validate completeness before submission
        const validationResult = await this.validateRegistration(
          tenantCode,
          registrationId,
        );
        if (!validationResult.isValid) {
          throw ErrorFactory.createValidationError(
            "Registration validation failed",
            validationResult.errors,
          );
        }

        await registration.update({
          registration_status: "submitted",
          registration_date: new Date(),
          submitted_by: submittedBy,
          updated_by: submittedBy,
        });

        // Log integration event
        await this.logIntegration(tenantCode, registration.school_id, {
          integration_type: "registration_submit",
          operation_name: "Submit UDISE Registration",
          operation_status: "success",
          records_processed: 1,
          initiated_by: "user",
          user_id: submittedBy,
        });

        logSystem(`UDISE registration submitted: ${registrationId}`, {
          tenantCode,
        });
        return registration;
      } catch (error) {
        logError(error, {
          context: "UdiseService.submitRegistration",
          tenantCode,
          registrationId,
        });
        throw error;
      }
    },

    /**
     * Get school registrations with filters
     */
    async getRegistrations(tenantCode, filters = {}) {
      try {
        const models = await getModels(tenantCode);

        const whereClause = {};

        if (filters.school_id) whereClause.school_id = filters.school_id;
        if (filters.registration_status)
          whereClause.registration_status = filters.registration_status;
        if (filters.state_code) whereClause.state_code = filters.state_code;
        if (filters.district_code)
          whereClause.district_code = filters.district_code;
        if (filters.academic_year)
          whereClause.academic_year = filters.academic_year;

        const registrations = await models.UdiseSchoolRegistration.findAll({
          where: whereClause,
          include: [
            {
              model: models.UdiseCensusData,
              as: "census_data",
              required: false,
            },
            {
              model: models.UdiseComplianceRecord,
              as: "compliance_records",
              required: false,
            },
          ],
          order: [["created_at", "DESC"]],
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        });

        return registrations;
      } catch (error) {
        logError(error, {
          context: "UdiseService.getRegistrations",
          tenantCode,
        });
        throw error;
      }
    },

    /**
     * Validate registration completeness
     */
    async validateRegistration(tenantCode, registrationId) {
      try {
        const models = await getModels(tenantCode);

        const registration =
          await models.UdiseSchoolRegistration.findByPk(registrationId);
        if (!registration) {
          throw ErrorFactory.createNotFoundError(
            "UDISE registration not found",
          );
        }

        const errors = [];
        const warnings = [];

        // Required field validation
        const requiredFields = [
          "school_name_english",
          "state_code",
          "district_code",
          "block_code",
          "school_category",
          "school_management",
          "school_type",
          "recognition_status",
          "academic_year",
          "total_classrooms",
        ];

        for (const field of requiredFields) {
          if (!registration[field] || registration[field] === "") {
            errors.push(`${field} is required`);
          }
        }

        // Business rule validation
        if (
          registration.school_management === "private_unaided" &&
          !registration.affiliation_board
        ) {
          errors.push("Private unaided schools must specify affiliation board");
        }

        if (registration.total_classrooms < 1) {
          errors.push("School must have at least 1 classroom");
        }

        if (registration.toilet_boys + registration.toilet_girls < 1) {
          warnings.push("School should have toilet facilities");
        }

        if (!registration.drinking_water_available) {
          warnings.push("Drinking water facility is essential");
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      } catch (error) {
        logError(error, {
          context: "UdiseService.validateRegistration",
          tenantCode,
          registrationId,
        });
        throw error;
      }
    },
  };

  /**
   * UDISE Census Data Operations
   */
  const censusService = {
    /**
     * Create census data record
     */
    async createCensusData(
      tenantCode,
      udiseRegistrationId,
      censusData,
      createdBy,
    ) {
      try {
        const models = await getModels(tenantCode);

        // Check if census data already exists for this period
        const existingCensus = await models.UdiseCensusData.findOne({
          where: {
            udise_registration_id: udiseRegistrationId,
            academic_year: censusData.academic_year,
            data_collection_phase: censusData.data_collection_phase,
          },
        });

        if (existingCensus) {
          throw ErrorFactory.createValidationError(
            "Census data already exists for this period",
          );
        }

        const census = await models.UdiseCensusData.create({
          udise_registration_id: udiseRegistrationId,
          ...censusData,
          data_status: "draft",
          created_by: createdBy,
        });

        logSystem(`Census data created: ${census.id}`, { tenantCode });
        return census;
      } catch (error) {
        logError(error, {
          context: "UdiseService.createCensusData",
          tenantCode,
        });
        throw error;
      }
    },

    /**
     * Calculate enrollment statistics
     */
    async calculateEnrollmentStats(tenantCode, censusId) {
      try {
        const models = await getModels(tenantCode);

        const census = await models.UdiseCensusData.findByPk(censusId);
        if (!census) {
          throw ErrorFactory.createNotFoundError("Census data not found");
        }

        // Calculate totals
        const totalBoys = [
          "enrollment_class_1_boys",
          "enrollment_class_2_boys",
          "enrollment_class_3_boys",
          "enrollment_class_4_boys",
          "enrollment_class_5_boys",
          "enrollment_class_6_boys",
          "enrollment_class_7_boys",
          "enrollment_class_8_boys",
          "enrollment_class_9_boys",
          "enrollment_class_10_boys",
          "enrollment_class_11_boys",
          "enrollment_class_12_boys",
        ].reduce((sum, field) => sum + (census[field] || 0), 0);

        const totalGirls = [
          "enrollment_class_1_girls",
          "enrollment_class_2_girls",
          "enrollment_class_3_girls",
          "enrollment_class_4_girls",
          "enrollment_class_5_girls",
          "enrollment_class_6_girls",
          "enrollment_class_7_girls",
          "enrollment_class_8_girls",
          "enrollment_class_9_girls",
          "enrollment_class_10_girls",
          "enrollment_class_11_girls",
          "enrollment_class_12_girls",
        ].reduce((sum, field) => sum + (census[field] || 0), 0);

        const totalEnrollment = totalBoys + totalGirls;

        // Calculate special categories
        const totalSC =
          (census.sc_students_boys || 0) + (census.sc_students_girls || 0);
        const totalST =
          (census.st_students_boys || 0) + (census.st_students_girls || 0);
        const totalOBC =
          (census.obc_students_boys || 0) + (census.obc_students_girls || 0);
        const totalMinority =
          (census.minority_students_boys || 0) +
          (census.minority_students_girls || 0);
        const totalCWSN =
          (census.cwsn_students_boys || 0) + (census.cwsn_students_girls || 0);

        // Calculate ratios
        const genderRatio = totalBoys > 0 ? (totalGirls / totalBoys) * 100 : 0;
        const ptrRatio =
          census.total_teachers > 0
            ? totalEnrollment / census.total_teachers
            : 0;

        return {
          total_enrollment: totalEnrollment,
          total_boys: totalBoys,
          total_girls: totalGirls,
          gender_ratio: Math.round(genderRatio * 100) / 100,
          ptr_ratio: Math.round(ptrRatio * 100) / 100,
          special_categories: {
            sc: totalSC,
            st: totalST,
            obc: totalOBC,
            minority: totalMinority,
            cwsn: totalCWSN,
          },
        };
      } catch (error) {
        logError(error, {
          context: "UdiseService.calculateEnrollmentStats",
          tenantCode,
        });
        throw error;
      }
    },
  };

  /**
   * UDISE Compliance Operations
   */
  const complianceService = {
    /**
     * Create compliance record
     */
    async createComplianceRecord(
      tenantCode,
      udiseRegistrationId,
      complianceData,
      createdBy,
    ) {
      try {
        const models = await getModels(tenantCode);

        // Calculate compliance score
        const score = this.calculateComplianceScore(complianceData);

        const compliance = await models.UdiseComplianceRecord.create({
          udise_registration_id: udiseRegistrationId,
          ...complianceData,
          compliance_score: score.score,
          compliance_grade: score.grade,
          record_status: "draft",
          created_by: createdBy,
        });

        logSystem(`Compliance record created: ${compliance.id}`, {
          tenantCode,
        });
        return compliance;
      } catch (error) {
        logError(error, {
          context: "UdiseService.createComplianceRecord",
          tenantCode,
        });
        throw error;
      }
    },

    /**
     * Calculate compliance score
     */
    calculateComplianceScore(complianceData) {
      const criteriaWeights = {
        // RTE Compliance (30%)
        rte_25_percent_admission: 5,
        rte_infrastructure_norms: 8,
        rte_teacher_qualification: 10,
        rte_ptr_compliance: 7,

        // Infrastructure (25%)
        building_safety_certificate: 5,
        fire_safety_certificate: 3,
        playground_space_adequate: 4,
        library_books_adequate: 3,
        drinking_water_safe: 5,
        toilet_facilities_adequate: 5,

        // Academic & Teacher (20%)
        teacher_verification_complete: 5,
        teacher_training_updated: 5,
        curriculum_board_approved: 5,
        assessment_system_compliant: 5,

        // Child Safety (15%)
        child_protection_policy: 4,
        anti_ragging_measures: 3,
        pocso_awareness: 4,
        grievance_mechanism: 4,

        // Others (10%)
        financial_audit_current: 3,
        fee_structure_approved: 2,
        digital_learning_implemented: 2,
        green_practices_adopted: 3,
      };

      let totalScore = 0;
      let maxScore = 0;

      for (const [criterion, weight] of Object.entries(criteriaWeights)) {
        maxScore += weight;
        if (complianceData[criterion] === true) {
          totalScore += weight;
        }
      }

      const percentage = (totalScore / maxScore) * 100;

      let grade;
      if (percentage >= 90) grade = "A+";
      else if (percentage >= 85) grade = "A";
      else if (percentage >= 80) grade = "B+";
      else if (percentage >= 75) grade = "B";
      else if (percentage >= 70) grade = "C+";
      else if (percentage >= 60) grade = "C";
      else if (percentage >= 50) grade = "D";
      else grade = "F";

      return {
        score: Math.round(percentage * 100) / 100,
        grade,
      };
    },
  };

  /**
   * Integration Logging
   */
  async function logIntegration(tenantCode, schoolId, logData) {
    try {
      const models = await getModels(tenantCode);

      const integrationLog = await models.UdiseIntegrationLog.create({
        school_id: schoolId,
        external_system: "udise_plus_portal",
        request_timestamp: new Date(),
        response_timestamp: new Date(),
        environment: process.env.NODE_ENV || "development",
        ...logData,
        created_by: logData.user_id || "system",
      });

      return integrationLog;
    } catch (error) {
      logError(error, {
        context: "UdiseService.logIntegration",
        tenantCode,
        schoolId,
      });
      // Don't throw here to prevent breaking main operations
    }
  }

  /**
   * Generate UDISE Reports
   */
  async function generateReports(tenantCode, reportType, filters = {}) {
    try {
      const models = await getModels(tenantCode);

      switch (reportType) {
        case "registration_summary":
          return await this.generateRegistrationSummary(tenantCode, filters);

        case "enrollment_statistics":
          return await this.generateEnrollmentReport(tenantCode, filters);

        case "compliance_dashboard":
          return await this.generateComplianceReport(tenantCode, filters);

        case "integration_status":
          return await this.generateIntegrationReport(tenantCode, filters);

        default:
          throw ErrorFactory.createValidationError("Invalid report type");
      }
    } catch (error) {
      logError(error, {
        context: "UdiseService.generateReports",
        tenantCode,
        reportType,
      });
      throw error;
    }
  }

  return {
    registration: registrationService,
    census: censusService,
    compliance: complianceService,
    logIntegration,
    generateReports,
    getModels,
  };
}

module.exports = createUdiseService;
