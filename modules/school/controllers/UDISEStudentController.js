const UDISEStudentService = require("../services/UDISEStudentService");
const {
  ErrorFactory,
  // Legacy classes for backward compatibility
  ValidationError,
  NotFoundError,
  DuplicateError,
} = require("../../../utils/errors");
const { logger } = require("../../../utils/logger");

/**
 * UDISE+ Student Controller
 * HTTP API layer for individual student government compliance
 * Handles all UDISE+ student registration and reporting endpoints
 *
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function createUDISEStudentController() {
  /**
   * Register student with UDISE+ system
   * POST /api/v1/school/:tenantId/udise/students/register
   */
  async function registerStudent(req, res) {
    try {
      const tenantCode = req.params.tenantId;
      const { student_id, ...udiseData } = req.body;
      const createdBy = req.user ? req.user.id : null;

      if (!student_id) {
        throw ErrorFactory.validation("Student ID is required");
      }

      const result = await UDISEStudentService.registerStudentWithUDISE(
        tenantCode,
        student_id,
        udiseData,
        createdBy,
      );

      logger.info("UDISE+ student registration API success", {
        controller: "udise-student-controller",
        event: "student_registered",
        tenant_code: tenantCode,
        student_id: student_id,
        udise_student_id: result.udise_student_id,
        user_id: createdBy,
      });

      res.status(201).json({
        success: true,
        message: "Student successfully registered with UDISE+ system",
        data: {
          udise_student_id: result.udise_student_id,
          student_id: result.student_id,
          udise_school_id: result.udise_school_id,
          enrollment_date: result.enrollment_date,
          academic_session: result.academic_session,
          census_year: result.census_year,
          validation_status: result.data_validation_status,
          student_details: result.student,
          school_details: result.udiseSchool,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ student registration API failed", {
        controller: "udise-student-controller",
        event: "registration_failed",
        tenant_code: req.params.tenantId,
        student_id: req.body.student_id,
        user_id: req.user ? req.user.id : null,
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof DuplicateError) {
        return res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unexpected error occurred during UDISE+ student registration",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get UDISE+ student by UDISE+ student ID
   * GET /api/v1/school/:tenantId/udise/students/:udiseStudentId
   */
  async function getStudentById(req, res) {
    try {
      const tenantCode = req.params.tenantId;
      const udiseStudentId = req.params.udiseStudentId;

      if (!udiseStudentId) {
        throw ErrorFactory.validation("UDISE+ student ID is required");
      }

      const student = await UDISEStudentService.getUDISEStudentById(
        tenantCode,
        udiseStudentId,
      );

      logger.info("UDISE+ student retrieval API success", {
        controller: "udise-student-controller",
        event: "student_retrieved",
        tenant_code: tenantCode,
        udise_student_id: udiseStudentId,
        user_id: req.user ? req.user.id : null,
      });

      res.json({
        success: true,
        message: "UDISE+ student retrieved successfully",
        data: {
          udise_registration: {
            udise_student_id: student.udise_student_id,
            pen_number: student.pen_number,
            enrollment_date: student.enrollment_date,
            enrollment_type: student.enrollment_type,
            academic_session: student.academic_session,
            census_year: student.census_year,
            validation_status: student.data_validation_status,
            validation_errors: student.validation_errors,
            last_validated_at: student.last_validated_at,
            // Government IDs (masked for security)
            aadhaar_verified: student.aadhaar_verified,
            aadhaar_verification_date: student.aadhaar_verification_date,
            saral_id: student.saral_id,
            emis_id: student.emis_id,
            cbse_uid: student.cbse_uid,
            cisce_uid: student.cisce_uid,
            // Special categories
            rte_beneficiary: student.rte_beneficiary,
            rte_beneficiary_id: student.rte_beneficiary_id,
            cwsn_status: student.cwsn_status,
            cwsn_disability_type: student.cwsn_disability_type,
            // Educational background
            mother_tongue: student.mother_tongue,
            previous_school_type: student.previous_school_type,
            previous_class: student.previous_class,
            transfer_certificate_number: student.transfer_certificate_number,
            // Learning assessment
            foundational_literacy_level: student.foundational_literacy_level,
            foundational_numeracy_level: student.foundational_numeracy_level,
            digital_literacy_level: student.digital_literacy_level,
            // Metadata
            is_active: student.is_active,
            remarks: student.remarks,
            created_at: student.created_at,
            updated_at: student.updated_at,
          },
          student_details: student.student,
          school_details: student.udiseSchool,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ student retrieval API failed", {
        controller: "udise-student-controller",
        event: "retrieval_failed",
        tenant_code: req.params.tenantId,
        udise_student_id: req.params.udiseStudentId,
        user_id: req.user ? req.user.id : null,
        error: error.message,
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unexpected error occurred while retrieving UDISE+ student",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Update UDISE+ student information
   * PUT /api/v1/school/:tenantId/udise/students/:udiseStudentId
   */
  async function updateStudent(req, res) {
    try {
      const tenantCode = req.params.tenantId;
      const udiseStudentId = req.params.udiseStudentId;
      const updateData = req.body;
      const updatedBy = req.user ? req.user.id : null;

      if (!udiseStudentId) {
        throw ErrorFactory.validation("UDISE+ student ID is required");
      }

      const updatedStudent = await UDISEStudentService.updateUDISEStudent(
        tenantCode,
        udiseStudentId,
        updateData,
        updatedBy,
      );

      logger.info("UDISE+ student update API success", {
        controller: "udise-student-controller",
        event: "student_updated",
        tenant_code: tenantCode,
        udise_student_id: udiseStudentId,
        user_id: updatedBy,
      });

      res.json({
        success: true,
        message: "UDISE+ student updated successfully",
        data: {
          udise_student_id: updatedStudent.udise_student_id,
          validation_status: updatedStudent.data_validation_status,
          last_updated: updatedStudent.updated_at,
          updated_fields: Object.keys(updateData),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ student update API failed", {
        controller: "udise-student-controller",
        event: "update_failed",
        tenant_code: req.params.tenantId,
        udise_student_id: req.params.udiseStudentId,
        user_id: req.user ? req.user.id : null,
        error: error.message,
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while updating UDISE+ student",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get UDISE+ students by school
   * GET /api/v1/school/:tenantId/udise/schools/:udiseSchoolId/students
   */
  async function getStudentsBySchool(req, res) {
    try {
      const tenantCode = req.params.tenantId;
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        academic_session: req.query.academic_session,
        census_year: req.query.census_year,
        validation_status: req.query.validation_status,
        is_active: req.query.is_active,
      };

      if (!udiseSchoolId || isNaN(udiseSchoolId)) {
        throw ErrorFactory.validation("Valid UDISE+ school ID is required");
      }

      const result = await UDISEStudentService.getUDISEStudentsBySchool(
        tenantCode,
        udiseSchoolId,
        options,
      );

      logger.info("UDISE+ students by school retrieval API success", {
        controller: "udise-student-controller",
        event: "students_by_school_retrieved",
        tenant_code: tenantCode,
        udise_school_id: udiseSchoolId,
        total_students: result.students.length,
        user_id: req.user ? req.user.id : null,
      });

      res.json({
        success: true,
        message: "UDISE+ students retrieved successfully",
        data: {
          students: result.students.map((student) => ({
            udise_student_id: student.udise_student_id,
            pen_number: student.pen_number,
            enrollment_date: student.enrollment_date,
            enrollment_type: student.enrollment_type,
            academic_session: student.academic_session,
            census_year: student.census_year,
            validation_status: student.data_validation_status,
            student_name: student.student?.user?.full_name || "",
            admission_number: student.student?.admission_number || "",
            class: student.student?.class?.class_name || "",
            section: student.student?.section?.section_name || "",
            gender: student.student?.gender || "",
            category: student.student?.category || "",
            rte_beneficiary: student.rte_beneficiary,
            cwsn_status: student.cwsn_status,
            is_active: student.is_active,
            created_at: student.created_at,
            updated_at: student.updated_at,
          })),
          pagination: result.pagination,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ students by school retrieval API failed", {
        controller: "udise-student-controller",
        event: "students_by_school_failed",
        tenant_code: req.params.tenantId,
        udise_school_id: req.params.udiseSchoolId,
        user_id: req.user ? req.user.id : null,
        error: error.message,
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unexpected error occurred while retrieving UDISE+ students",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Validate student data for government submission
   * POST /api/v1/school/:tenantId/udise/students/:udiseStudentId/validate
   */
  async function validateStudent(req, res) {
    try {
      const tenantCode = req.params.tenantId;
      const udiseStudentId = req.params.udiseStudentId;

      if (!udiseStudentId) {
        throw ErrorFactory.validation("UDISE+ student ID is required");
      }

      const validationResult =
        await UDISEStudentService.validateStudentForSubmission(
          tenantCode,
          udiseStudentId,
        );

      logger.info("UDISE+ student validation API success", {
        controller: "udise-student-controller",
        event: "student_validated",
        tenant_code: tenantCode,
        udise_student_id: udiseStudentId,
        is_valid: validationResult.isValid,
        error_count: validationResult.errors.length,
        user_id: req.user ? req.user.id : null,
      });

      res.json({
        success: true,
        message: `Student validation ${validationResult.isValid ? "passed" : "failed"}`,
        data: {
          udise_student_id: udiseStudentId,
          validation_result: {
            is_valid: validationResult.isValid,
            errors: validationResult.errors,
            validated_at: new Date().toISOString(),
          },
          ready_for_submission: validationResult.isValid,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ student validation API failed", {
        controller: "udise-student-controller",
        event: "validation_failed",
        tenant_code: req.params.tenantId,
        udise_student_id: req.params.udiseStudentId,
        user_id: req.user ? req.user.id : null,
        error: error.message,
      });

      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during student validation",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

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
        throw ErrorFactory.validation("Valid UDISE+ school ID is required");
      }

      if (!censusYear) {
        throw ErrorFactory.validation("Census year is required");
      }

      const censusData = await UDISEStudentService.generateStudentCensusData(
        tenantCode,
        udiseSchoolId,
        censusYear,
      );

      logger.info("UDISE+ census generation API success", {
        controller: "udise-student-controller",
        event: "census_generated",
        tenant_code: tenantCode,
        udise_school_id: udiseSchoolId,
        census_year: censusYear,
        total_students: censusData.statistics.total_students,
        user_id: req.user ? req.user.id : null,
      });

      res.json({
        success: true,
        message: "Student census data generated successfully",
        data: censusData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ census generation API failed", {
        controller: "udise-student-controller",
        event: "census_generation_failed",
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
            code: "VALIDATION_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during census generation",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Bulk register students with UDISE+
   * POST /api/v1/school/:tenantId/udise/students/bulk-register
   */
  async function bulkRegisterStudents(req, res) {
    try {
      const tenantCode = req.params.tenantId;
      const { registrations } = req.body;
      const createdBy = req.user ? req.user.id : null;

      if (!Array.isArray(registrations) || registrations.length === 0) {
        throw ErrorFactory.validation(
          "Registrations array is required and cannot be empty",
        );
      }

      if (registrations.length > 500) {
        throw ErrorFactory.validation(
          "Maximum 500 students can be registered in one batch",
        );
      }

      const results = await UDISEStudentService.bulkRegisterStudentsWithUDISE(
        tenantCode,
        registrations,
        createdBy,
      );

      logger.info("UDISE+ bulk registration API success", {
        controller: "udise-student-controller",
        event: "bulk_registration_completed",
        tenant_code: tenantCode,
        total_attempted: results.total,
        successful_count: results.successful.length,
        failed_count: results.failed.length,
        user_id: createdBy,
      });

      res.status(201).json({
        success: true,
        message: `Bulk registration completed: ${results.successful.length} successful, ${results.failed.length} failed`,
        data: {
          summary: {
            total_attempted: results.total,
            successful_count: results.successful.length,
            failed_count: results.failed.length,
            success_rate:
              ((results.successful.length / results.total) * 100).toFixed(2) +
              "%",
          },
          successful_registrations: results.successful,
          failed_registrations: results.failed,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("UDISE+ bulk registration API failed", {
        controller: "udise-student-controller",
        event: "bulk_registration_failed",
        tenant_code: req.params.tenantId,
        user_id: req.user ? req.user.id : null,
        error: error.message,
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during bulk registration",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  return {
    registerStudent,
    getStudentById,
    updateStudent,
    getStudentsBySchool,
    validateStudent,
    generateCensusData,
    bulkRegisterStudents,
  };
}

module.exports = createUDISEStudentController();
