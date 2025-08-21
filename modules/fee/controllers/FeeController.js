const FeeService = require("../services/FeeService");
const logger = require("../../../utils/logger");
const {
  ErrorFactory,
  formatErrorResponse,
  getErrorStatusCode,
} = require("../../../utils/errors");

/**
 * Fee Controller
 * Handles HTTP requests for fee management operations
 */
function createFeeController() {
  const feeService = new FeeService();

  /**
   * Create fee structure
   */
  async function createFeeStructure(req, res) {
    try {
      const { tenantCode, userId } = req.session;
      const feeStructureData = req.body;

      if (!tenantCode) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context required",
        );
      }

      const feeStructure = await feeService.createFeeStructure(
        tenantCode,
        feeStructureData,
        userId,
      );

      logger.info("Fee Controller Success", {
        controller: "fee-controller",
        category: "FEE_STRUCTURE",
        event: "Fee structure created successfully",
        tenant_code: tenantCode,
        fee_structure_id: feeStructure.id,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        message: "Fee structure created successfully",
        data: feeStructure,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "FEE_STRUCTURE",
        event: "Fee structure creation failed",
        tenant_code: req.session?.tenantCode,
        user_id: req.session?.userId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get fee structures for a school
   */
  async function getFeeStructuresBySchool(req, res) {
    try {
      const { tenantCode } = req.session;
      const { schoolId } = req.params;
      const { academic_year, fee_type } = req.query;

      if (!tenantCode || !schoolId) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context and school ID required",
        );
      }

      const feeStructures = await feeService.getFeeStructuresBySchool(
        tenantCode,
        parseInt(schoolId),
        {
          academic_year,
          fee_type,
        },
      );

      res.json({
        success: true,
        data: feeStructures,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "FEE_STRUCTURE",
        event: "Fee structures retrieval failed",
        tenant_code: req.session?.tenantCode,
        school_id: req.params?.schoolId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Create student fee record
   */
  async function createStudentFee(req, res) {
    try {
      const { tenantCode, userId } = req.session;
      const studentFeeData = req.body;

      if (!tenantCode) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context required",
        );
      }

      const studentFee = await feeService.createStudentFee(
        tenantCode,
        studentFeeData,
        userId,
      );

      logger.info("Fee Controller Success", {
        controller: "fee-controller",
        category: "STUDENT_FEE",
        event: "Student fee created successfully",
        tenant_code: tenantCode,
        student_fee_id: studentFee.id,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        message: "Student fee created successfully",
        data: studentFee,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "STUDENT_FEE",
        event: "Student fee creation failed",
        tenant_code: req.session?.tenantCode,
        user_id: req.session?.userId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get student fees
   */
  async function getStudentFees(req, res) {
    try {
      const { tenantCode } = req.session;
      const { studentId } = req.params;
      const { academic_year, status } = req.query;

      if (!tenantCode || !studentId) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context and student ID required",
        );
      }

      const studentFees = await feeService.getStudentFees(
        tenantCode,
        parseInt(studentId),
        {
          academic_year,
          status,
        },
      );

      res.json({
        success: true,
        data: studentFees,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "STUDENT_FEE",
        event: "Student fees retrieval failed",
        tenant_code: req.session?.tenantCode,
        student_id: req.params?.studentId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Process fee payment
   */
  async function processFeePayment(req, res) {
    try {
      const { tenantCode, userId } = req.session;
      const paymentData = req.body;

      if (!tenantCode) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context required",
        );
      }

      const paymentResult = await feeService.processFeePayment(
        tenantCode,
        paymentData,
        userId,
      );

      logger.info("Fee Controller Success", {
        controller: "fee-controller",
        category: "FEE_PAYMENT",
        event: "Fee payment processed successfully",
        tenant_code: tenantCode,
        collection_id: paymentResult.id,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        message: "Fee payment processed successfully",
        data: paymentResult,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "FEE_PAYMENT",
        event: "Fee payment processing failed",
        tenant_code: req.session?.tenantCode,
        user_id: req.session?.userId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get fee collections
   */
  async function getFeeCollections(req, res) {
    try {
      const { tenantCode } = req.session;
      const {
        student_id,
        school_id,
        from_date,
        to_date,
        payment_method,
        limit = 50,
        offset = 0,
      } = req.query;

      if (!tenantCode) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context required",
        );
      }

      const filters = {
        student_id: student_id ? parseInt(student_id) : undefined,
        school_id: school_id ? parseInt(school_id) : undefined,
        from_date,
        to_date,
        payment_method,
      };

      const collections = await feeService.getFeeCollections(
        tenantCode,
        filters,
        {
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      );

      res.json({
        success: true,
        data: collections,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "FEE_COLLECTION",
        event: "Fee collections retrieval failed",
        tenant_code: req.session?.tenantCode,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Create fee discount
   */
  async function createFeeDiscount(req, res) {
    try {
      const { tenantCode, userId } = req.session;
      const discountData = req.body;

      if (!tenantCode) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context required",
        );
      }

      const discount = await feeService.createFeeDiscount(
        tenantCode,
        discountData,
        userId,
      );

      logger.info("Fee Controller Success", {
        controller: "fee-controller",
        category: "FEE_DISCOUNT",
        event: "Fee discount created successfully",
        tenant_code: tenantCode,
        discount_id: discount.id,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        message: "Fee discount created successfully",
        data: discount,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "FEE_DISCOUNT",
        event: "Fee discount creation failed",
        tenant_code: req.session?.tenantCode,
        user_id: req.session?.userId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Apply discount to student
   */
  async function applyStudentDiscount(req, res) {
    try {
      const { tenantCode, userId } = req.session;
      const discountApplicationData = req.body;

      if (!tenantCode) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context required",
        );
      }

      const studentDiscount = await feeService.applyStudentDiscount(
        tenantCode,
        discountApplicationData,
        userId,
      );

      logger.info("Fee Controller Success", {
        controller: "fee-controller",
        category: "STUDENT_DISCOUNT",
        event: "Student discount applied successfully",
        tenant_code: tenantCode,
        student_discount_id: studentDiscount.id,
        user_id: userId,
      });

      res.status(201).json({
        success: true,
        message: "Student discount applied successfully",
        data: studentDiscount,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "STUDENT_DISCOUNT",
        event: "Student discount application failed",
        tenant_code: req.session?.tenantCode,
        user_id: req.session?.userId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Get fee reports
   */
  async function getFeeReports(req, res) {
    try {
      const { tenantCode } = req.session;
      const { report_type, school_id, academic_year, from_date, to_date } =
        req.query;

      if (!tenantCode || !report_type || !school_id) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context, report type, and school ID required",
        );
      }

      const filters = {
        school_id: parseInt(school_id),
        academic_year,
        from_date,
        to_date,
      };

      let reportData;

      switch (report_type) {
        case "collection_summary":
          reportData = await feeService.generateCollectionSummaryReport(
            tenantCode,
            filters,
          );
          break;
        case "outstanding_fees":
          reportData = await feeService.generateOutstandingFeesReport(
            tenantCode,
            filters,
          );
          break;
        case "defaulter_list":
          reportData = await feeService.generateDefaulterListReport(
            tenantCode,
            filters,
          );
          break;
        case "discount_summary":
          reportData = await feeService.generateDiscountSummaryReport(
            tenantCode,
            filters,
          );
          break;
        default:
          throw ErrorFactory.createError(
            "ValidationError",
            "Invalid report type",
          );
      }

      res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "FEE_REPORTS",
        event: "Fee report generation failed",
        tenant_code: req.session?.tenantCode,
        report_type: req.query?.report_type,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Bulk fee operations
   */
  async function bulkFeeOperations(req, res) {
    try {
      const { tenantCode, userId } = req.session;
      const { operation, data } = req.body;

      if (!tenantCode || !operation || !data) {
        throw ErrorFactory.createError(
          "ValidationError",
          "Tenant context, operation, and data required",
        );
      }

      let result;

      switch (operation) {
        case "create_student_fees":
          result = await feeService.bulkCreateStudentFees(
            tenantCode,
            data,
            userId,
          );
          break;
        case "apply_discounts":
          result = await feeService.bulkApplyDiscounts(
            tenantCode,
            data,
            userId,
          );
          break;
        case "generate_installments":
          result = await feeService.bulkGenerateInstallments(
            tenantCode,
            data,
            userId,
          );
          break;
        default:
          throw ErrorFactory.createError(
            "ValidationError",
            "Invalid bulk operation",
          );
      }

      logger.info("Fee Controller Success", {
        controller: "fee-controller",
        category: "BULK_OPERATIONS",
        event: `Bulk ${operation} completed successfully`,
        tenant_code: tenantCode,
        operation,
        processed_count: result.processed || 0,
        user_id: userId,
      });

      res.json({
        success: true,
        message: `Bulk ${operation} completed successfully`,
        data: result,
      });
    } catch (error) {
      logger.error("Fee Controller Error", {
        controller: "fee-controller",
        category: "BULK_OPERATIONS",
        event: "Bulk fee operation failed",
        tenant_code: req.session?.tenantCode,
        operation: req.body?.operation,
        user_id: req.session?.userId,
        error: error.message,
      });

      const statusCode = getErrorStatusCode(error);
      res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  return {
    createFeeStructure,
    getFeeStructuresBySchool,
    createStudentFee,
    getStudentFees,
    processFeePayment,
    getFeeCollections,
    createFeeDiscount,
    applyStudentDiscount,
    getFeeReports,
    bulkFeeOperations,
  };
}

module.exports = createFeeController;
