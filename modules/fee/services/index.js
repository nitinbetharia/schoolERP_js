const { logger } = require("../../../utils/logger");
const FeeService = require("./FeeService");

/**
 * Fee Module Services Index
 * Centralizes all fee-related service exports
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */

/**
 * Initialize fee services with models
 * @param {Object} models - Object containing all models
 * @returns {Object} Object containing all fee services
 */
function initializeFeeServices(models) {
  try {
    logger.info("Initializing fee module services");

    // Initialize fee service
    const feeService = new FeeService(models);

    const services = {
      feeService,
      // Add more services here as needed
    };

    logger.info("Fee module services initialized successfully", {
      services_count: Object.keys(services).length,
      service_names: Object.keys(services),
    });

    return services;
  } catch (error) {
    logger.error("Error initializing fee module services", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get service configurations and metadata
 * @returns {Object} Object containing service configurations
 */
function getFeeServiceConfigs() {
  return {
    FeeService: {
      description: "Central business logic for fee management operations",
      methods: [
        "createFeeStructure",
        "getFeeStructures",
        "updateFeeStructure",
        "assignFeeToStudent",
        "getStudentFees",
        "getStudentFeeSummary",
        "processPayment",
        "getPaymentHistory",
        "createFeeDiscount",
        "applyDiscountToStudentFee",
        "getDueInstallments",
        "getOverdueInstallments",
        "processAutoLateFees",
        "getFeeCollectionSummary",
        "getDailyCollectionReport",
        "getOutstandingFeesReport",
        "getDiscountUtilizationReport",
        "bulkAssignFees",
        "generateReceiptData",
      ],
      dependencies: [
        "FeeStructure",
        "StudentFee",
        "FeeCollection",
        "FeeInstallment",
        "FeeDiscount",
        "StudentFeeDiscount",
        "Student",
        "School",
        "User",
      ],
    },
  };
}

/**
 * Get service method documentation
 * @returns {Object} Object containing method documentation
 */
function getFeeServiceDocs() {
  return {
    FeeService: {
      createFeeStructure: {
        description: "Create a new fee structure for a school",
        parameters: ["feeStructureData", "createdBy"],
        returns: "FeeStructure object",
      },
      getFeeStructures: {
        description: "Get fee structures for a school with optional filters",
        parameters: ["schoolId", "filters"],
        returns: "Array of FeeStructure objects",
      },
      updateFeeStructure: {
        description: "Update an existing fee structure",
        parameters: ["feeStructureId", "updateData", "updatedBy"],
        returns: "Updated FeeStructure object",
      },
      assignFeeToStudent: {
        description: "Assign a fee structure to a student",
        parameters: [
          "studentId",
          "feeStructureId",
          "academicYear",
          "assignedBy",
        ],
        returns: "StudentFee object",
      },
      getStudentFees: {
        description: "Get all fees for a student",
        parameters: ["studentId", "academicYear"],
        returns: "Array of StudentFee objects with associations",
      },
      getStudentFeeSummary: {
        description: "Get fee summary statistics for a student",
        parameters: ["studentId", "academicYear"],
        returns: "Fee summary object with totals",
      },
      processPayment: {
        description: "Process a fee payment transaction",
        parameters: ["paymentData", "collectedBy"],
        returns: "FeeCollection object",
      },
      getPaymentHistory: {
        description: "Get payment history for a student",
        parameters: ["studentId", "academicYear"],
        returns: "Array of FeeCollection objects",
      },
      createFeeDiscount: {
        description: "Create a new fee discount scheme",
        parameters: ["discountData", "createdBy"],
        returns: "FeeDiscount object",
      },
      applyDiscountToStudentFee: {
        description: "Apply a discount to student fee",
        parameters: ["studentFeeId", "discountId", "appliedBy", "options"],
        returns: "StudentFeeDiscount object",
      },
      getDueInstallments: {
        description: "Get installments due within specified days",
        parameters: ["schoolId", "daysAhead"],
        returns: "Array of FeeInstallment objects",
      },
      getOverdueInstallments: {
        description: "Get overdue installments for a school",
        parameters: ["schoolId", "graceDays"],
        returns: "Array of overdue FeeInstallment objects",
      },
      processAutoLateFees: {
        description: "Process automatic late fees for overdue installments",
        parameters: ["schoolId"],
        returns: "Array of late fee processing results",
      },
      getFeeCollectionSummary: {
        description: "Get fee collection statistics for a date range",
        parameters: ["schoolId", "startDate", "endDate"],
        returns: "Collection summary object",
      },
      getDailyCollectionReport: {
        description: "Get daily collection report for a specific date",
        parameters: ["schoolId", "date"],
        returns: "Daily collection summary object",
      },
      getOutstandingFeesReport: {
        description: "Get report of outstanding fees for academic year",
        parameters: ["schoolId", "academicYear"],
        returns: "Outstanding fees report object",
      },
      getDiscountUtilizationReport: {
        description: "Get discount utilization statistics",
        parameters: ["schoolId", "academicYear"],
        returns: "Discount utilization report object",
      },
      bulkAssignFees: {
        description: "Assign fees to multiple students at once",
        parameters: [
          "studentIds",
          "feeStructureId",
          "academicYear",
          "assignedBy",
        ],
        returns: "Bulk assignment results object",
      },
      generateReceiptData: {
        description: "Generate receipt data for printing",
        parameters: ["receiptNumber"],
        returns: "Receipt data object with student and school info",
      },
    },
  };
}

/**
 * Validate service initialization
 * @param {Object} services - Initialized services object
 * @returns {Boolean} True if valid, throws error otherwise
 */
function validateFeeServices(services) {
  try {
    if (!services || typeof services !== "object") {
      throw new Error("Services object is required");
    }

    if (!services.feeService || !(services.feeService instanceof FeeService)) {
      throw new Error("FeeService instance is required");
    }

    // Validate service methods
    const requiredMethods = getFeeServiceConfigs().FeeService.methods;
    for (const method of requiredMethods) {
      if (typeof services.feeService[method] !== "function") {
        throw new Error(`FeeService missing required method: ${method}`);
      }
    }

    logger.info("Fee services validation passed");
    return true;
  } catch (error) {
    logger.error("Fee services validation failed", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get service health check information
 * @param {Object} services - Services object
 * @returns {Object} Health check results
 */
function getFeeServicesHealthCheck(services) {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      services: {},
    };

    // Check FeeService
    if (services.feeService) {
      healthCheck.services.feeService = {
        status: "healthy",
        type: "FeeService",
        methods_available: Object.getOwnPropertyNames(
          Object.getPrototypeOf(services.feeService),
        ).filter(
          (name) =>
            name !== "constructor" &&
            typeof services.feeService[name] === "function",
        ).length,
      };
    } else {
      healthCheck.services.feeService = {
        status: "unhealthy",
        error: "FeeService not initialized",
      };
      healthCheck.status = "unhealthy";
    }

    return healthCheck;
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      status: "unhealthy",
      error: error.message,
    };
  }
}

module.exports = {
  initializeFeeServices,
  getFeeServiceConfigs,
  getFeeServiceDocs,
  validateFeeServices,
  getFeeServicesHealthCheck,
  FeeService,
};
