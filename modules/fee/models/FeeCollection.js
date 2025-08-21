const { DataTypes } = require("sequelize");
const Joi = require("joi");
const { logger } = require("../../../utils/logger");

/**
 * Q59-ENFORCED: Comprehensive validation schemas for fee collection operations
 * These schemas enforce business rules and data integrity for all fee collection operations
 */
const feeCollectionValidationSchemas = {
  // Fee Collection/Payment Recording Validation
  recordPayment: Joi.object({
    receipt_number: Joi.string().max(50).required().messages({
      "string.max": "Receipt number cannot exceed 50 characters",
      "any.required": "Receipt number is required",
    }),
    student_id: Joi.number().integer().positive().required().messages({
      "number.base": "Student ID must be a number",
      "number.integer": "Student ID must be an integer",
      "number.positive": "Student ID must be positive",
      "any.required": "Student ID is required",
    }),
    student_fee_id: Joi.number().integer().positive().required().messages({
      "number.base": "Student fee ID must be a number",
      "number.integer": "Student fee ID must be an integer",
      "number.positive": "Student fee ID must be positive",
      "any.required": "Student fee ID is required",
    }),
    fee_structure_id: Joi.number().integer().positive().required().messages({
      "number.base": "Fee structure ID must be a number",
      "number.integer": "Fee structure ID must be an integer",
      "number.positive": "Fee structure ID must be positive",
      "any.required": "Fee structure ID is required",
    }),
    school_id: Joi.number().integer().positive().required().messages({
      "number.base": "School ID must be a number",
      "number.integer": "School ID must be an integer",
      "number.positive": "School ID must be positive",
      "any.required": "School ID is required",
    }),
    academic_year: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Academic year must be in format YYYY-YY (e.g., 2024-25)",
        "any.required": "Academic year is required",
      }),
    payment_date: Joi.date().required().messages({
      "any.required": "Payment date is required",
    }),
    payment_amount: Joi.number()
      .min(0.01)
      .max(999999.99)
      .precision(2)
      .required()
      .messages({
        "number.min": "Payment amount must be greater than 0",
        "number.max": "Payment amount cannot exceed 999,999.99",
        "any.required": "Payment amount is required",
      }),
    fee_amount: Joi.number()
      .min(0)
      .max(999999.99)
      .precision(2)
      .required()
      .messages({
        "number.min": "Fee amount cannot be negative",
        "number.max": "Fee amount cannot exceed 999,999.99",
        "any.required": "Fee amount is required",
      }),
    late_fee_amount: Joi.number()
      .min(0)
      .max(99999.99)
      .precision(2)
      .default(0)
      .messages({
        "number.min": "Late fee amount cannot be negative",
        "number.max": "Late fee amount cannot exceed 99,999.99",
      }),
    discount_amount: Joi.number()
      .min(0)
      .max(999999.99)
      .precision(2)
      .default(0)
      .messages({
        "number.min": "Discount amount cannot be negative",
        "number.max": "Discount amount cannot exceed 999,999.99",
      }),
    tax_amount: Joi.number()
      .min(0)
      .max(999999.99)
      .precision(2)
      .default(0)
      .messages({
        "number.min": "Tax amount cannot be negative",
        "number.max": "Tax amount cannot exceed 999,999.99",
      }),
    payment_method: Joi.string()
      .valid("CASH", "CHEQUE", "DD", "NEFT", "UPI", "CARD", "ONLINE", "WALLET")
      .required()
      .messages({
        "any.only":
          "Payment method must be CASH, CHEQUE, DD, NEFT, UPI, CARD, ONLINE, or WALLET",
        "any.required": "Payment method is required",
      }),
    reference_number: Joi.string().max(100).optional().allow(null, ""),
    bank_name: Joi.string().max(100).optional().allow(null, ""),
    branch_name: Joi.string().max(100).optional().allow(null, ""),
    cheque_date: Joi.date().optional().allow(null),
    payment_status: Joi.string()
      .valid("PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED")
      .default("COMPLETED")
      .messages({
        "any.only":
          "Payment status must be PENDING, COMPLETED, FAILED, CANCELLED, or REFUNDED",
      }),
    collected_by: Joi.number().integer().positive().required().messages({
      "number.positive": "Collected by user ID must be positive",
      "any.required": "Collected by user ID is required",
    }),
    verified_by: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        "number.positive": "Verified by user ID must be positive",
      }),
    remarks: Joi.string().max(500).optional().allow(null, ""),
    transaction_details: Joi.object().optional().allow(null),
    receipt_generated: Joi.boolean().default(false),
  }),

  // Fee Collection Update Validation
  updateCollection: Joi.object({
    payment_status: Joi.string()
      .valid("PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED")
      .optional()
      .messages({
        "any.only":
          "Payment status must be PENDING, COMPLETED, FAILED, CANCELLED, or REFUNDED",
      }),
    verified_by: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        "number.positive": "Verified by user ID must be positive",
      }),
    verification_date: Joi.date().optional().allow(null),
    remarks: Joi.string().max(500).optional().allow(null, ""),
    receipt_generated: Joi.boolean().optional(),
    transaction_details: Joi.object().optional().allow(null),
  }),

  // Fee Collection Query Validation
  queryCollections: Joi.object({
    student_id: Joi.number().integer().positive().optional().messages({
      "number.positive": "Student ID must be positive",
    }),
    school_id: Joi.number().integer().positive().optional().messages({
      "number.positive": "School ID must be positive",
    }),
    academic_year: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .optional()
      .messages({
        "string.pattern.base": "Academic year must be in format YYYY-YY",
      }),
    receipt_number: Joi.string().max(50).optional(),
    payment_method: Joi.string()
      .valid("CASH", "CHEQUE", "DD", "NEFT", "UPI", "CARD", "ONLINE", "WALLET")
      .optional(),
    payment_status: Joi.string()
      .valid("PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED")
      .optional(),
    payment_from: Joi.date().optional(),
    payment_to: Joi.date().optional(),
    amount_min: Joi.number().min(0).optional(),
    amount_max: Joi.number().min(0).optional(),
    collected_by: Joi.number().integer().positive().optional().messages({
      "number.positive": "Collected by user ID must be positive",
    }),
    verification_status: Joi.string()
      .valid("VERIFIED", "UNVERIFIED")
      .optional(),
    limit: Joi.number().integer().min(1).max(1000).default(50).messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 1000",
    }),
    offset: Joi.number().integer().min(0).default(0).messages({
      "number.min": "Offset cannot be negative",
    }),
    sortBy: Joi.string()
      .valid(
        "id",
        "payment_date",
        "payment_amount",
        "receipt_number",
        "created_at",
      )
      .default("id"),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  })
    .min(1)
    .messages({
      "object.min": "At least one filter parameter is required",
    }),

  // Bulk Payment Processing
  bulkPaymentProcessing: Joi.object({
    payments: Joi.array()
      .items(
        Joi.object({
          student_id: Joi.number().integer().positive().required(),
          student_fee_id: Joi.number().integer().positive().required(),
          payment_amount: Joi.number()
            .min(0.01)
            .max(999999.99)
            .precision(2)
            .required(),
          payment_method: Joi.string()
            .valid(
              "CASH",
              "CHEQUE",
              "DD",
              "NEFT",
              "UPI",
              "CARD",
              "ONLINE",
              "WALLET",
            )
            .required(),
          payment_date: Joi.date().required(),
          collected_by: Joi.number().integer().positive().required(),
        }),
      )
      .min(1)
      .max(200)
      .required()
      .messages({
        "array.min": "At least one payment is required",
        "array.max": "Maximum 200 payments allowed per bulk operation",
        "any.required": "Payments array is required",
      }),
  }),

  // Receipt Generation Validation
  generateReceipt: Joi.object({
    collection_id: Joi.number().integer().positive().required().messages({
      "number.positive": "Collection ID must be positive",
      "any.required": "Collection ID is required",
    }),
    receipt_format: Joi.string()
      .valid("PDF", "HTML", "THERMAL_PRINT")
      .default("PDF")
      .messages({
        "any.only": "Receipt format must be PDF, HTML, or THERMAL_PRINT",
      }),
    include_breakdown: Joi.boolean().default(true),
    include_school_logo: Joi.boolean().default(true),
  }),
};

/**
 * Fee Collection Model
 * Records all fee payments and transactions
 * Essential for financial tracking and receipt generation
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
function defineFeeCollection(sequelize) {
  const FeeCollection = sequelize.define(
    "FeeCollection",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      receipt_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Unique receipt number for this payment",
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        comment: "Reference to student who made payment",
      },
      student_fee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "student_fees",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        comment: "Reference to student fee being paid",
      },
      fee_structure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "fee_structures",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        comment: "Reference to fee structure (denormalized)",
      },
      school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        comment: "Reference to school (denormalized for performance)",
      },
      academic_year: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Academic year like "2024-25"',
      },
      payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Date when payment was made",
      },
      payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Amount paid in this transaction",
        validate: {
          min: {
            args: [0.01],
            msg: "Payment amount must be greater than 0",
          },
          max: {
            args: [999999.99],
            msg: "Payment amount cannot exceed 999999.99",
          },
        },
      },
      fee_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Actual fee amount (excluding late fee, etc.)",
      },
      late_fee_amount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Late fee amount paid",
      },
      discount_amount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Discount amount applied in this payment",
      },
      tax_amount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Tax amount paid",
      },
      adjustment_amount: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Any adjustment amount (positive or negative)",
      },
      payment_method: {
        type: DataTypes.ENUM,
        values: [
          "CASH",
          "CHEQUE",
          "DD",
          "BANK_TRANSFER",
          "ONLINE",
          "CARD",
          "UPI",
          "WALLET",
          "OTHER",
        ],
        allowNull: false,
        defaultValue: "CASH",
        comment: "Method of payment",
      },
      payment_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Reference number for non-cash payments",
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Bank name for cheque/DD/transfer payments",
      },
      cheque_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Cheque or DD number",
      },
      cheque_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date on cheque or DD",
      },
      transaction_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Online payment transaction ID",
      },
      gateway_response: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Payment gateway response data",
      },
      payment_status: {
        type: DataTypes.ENUM,
        values: [
          "SUCCESS",
          "PENDING",
          "FAILED",
          "CANCELLED",
          "REFUNDED",
          "BOUNCED",
        ],
        allowNull: false,
        defaultValue: "SUCCESS",
        comment: "Status of this payment",
      },
      collection_type: {
        type: DataTypes.ENUM,
        values: ["REGULAR", "ADVANCE", "PARTIAL", "REFUND", "ADJUSTMENT"],
        allowNull: false,
        defaultValue: "REGULAR",
        comment: "Type of fee collection",
      },
      installment_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Installment number if part of installment plan",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional remarks about the payment",
      },
      collected_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        comment: "User who collected the payment",
      },
      verified_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        comment: "User who verified the payment",
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when payment was verified",
      },
      reconciled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether payment has been reconciled with bank",
      },
      reconciled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when payment was reconciled",
      },
      receipt_printed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether receipt has been printed",
      },
      receipt_email_sent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether receipt email has been sent",
      },
      receipt_sms_sent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether receipt SMS has been sent",
      },
      refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Amount refunded (if any)",
      },
      refund_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date when refund was processed",
      },
      refund_reason: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: "Reason for refund",
      },
      refund_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Refund transaction reference",
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Timestamp when payment was cancelled",
      },
      cancelled_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        comment: "User who cancelled the payment",
      },
      cancellation_reason: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: "Reason for payment cancellation",
      },
      financial_year: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Financial year for accounting purposes",
      },
      accounting_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Date for accounting entry",
      },
      additional_info: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional payment information",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "fee_collections",
      timestamps: true,
      underscored: true,
      indexes: [
        // Primary query indexes
        {
          name: "idx_fee_collection_receipt",
          fields: ["receipt_number"],
          unique: true,
        },
        {
          name: "idx_fee_collection_student",
          fields: ["student_id", "academic_year", "payment_date"],
        },
        {
          name: "idx_fee_collection_school",
          fields: ["school_id", "payment_date", "payment_status"],
        },
        {
          name: "idx_fee_collection_status",
          fields: ["payment_status", "collection_type"],
        },
      ],
    },
  );

  // Model associations
  FeeCollection.associate = function (models) {
    // Belongs to Student
    FeeCollection.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
      onDelete: "CASCADE",
    });

    // Belongs to StudentFee
    FeeCollection.belongsTo(models.StudentFee, {
      foreignKey: "student_fee_id",
      as: "studentFee",
      onDelete: "RESTRICT",
    });

    // Belongs to FeeStructure
    FeeCollection.belongsTo(models.FeeStructure, {
      foreignKey: "fee_structure_id",
      as: "feeStructure",
      onDelete: "RESTRICT",
    });

    // Belongs to School
    FeeCollection.belongsTo(models.School, {
      foreignKey: "school_id",
      as: "school",
      onDelete: "CASCADE",
    });

    // Belongs to User (collected by)
    FeeCollection.belongsTo(models.User, {
      foreignKey: "collected_by",
      as: "collector",
      onDelete: "RESTRICT",
    });

    // Belongs to User (verified by)
    FeeCollection.belongsTo(models.User, {
      foreignKey: "verified_by",
      as: "verifier",
      onDelete: "SET NULL",
    });

    // Belongs to User (cancelled by)
    FeeCollection.belongsTo(models.User, {
      foreignKey: "cancelled_by",
      as: "canceller",
      onDelete: "SET NULL",
    });
  };

  // Instance methods for business logic
  FeeCollection.prototype.isSuccessful = function () {
    return this.payment_status === "SUCCESS";
  };

  FeeCollection.prototype.isPending = function () {
    return this.payment_status === "PENDING";
  };

  FeeCollection.prototype.isFailed = function () {
    return ["FAILED", "CANCELLED", "BOUNCED"].includes(this.payment_status);
  };

  FeeCollection.prototype.isRefunded = function () {
    return this.payment_status === "REFUNDED" || this.refund_amount > 0;
  };

  FeeCollection.prototype.canBeCancelled = function () {
    return (
      ["SUCCESS", "PENDING"].includes(this.payment_status) && !this.reconciled
    );
  };

  FeeCollection.prototype.canBeRefunded = function () {
    return (
      this.payment_status === "SUCCESS" &&
      this.refund_amount < this.payment_amount
    );
  };

  FeeCollection.prototype.generateReceiptData = function () {
    return {
      receipt_number: this.receipt_number,
      payment_date: this.payment_date,
      student_id: this.student_id,
      payment_amount: this.payment_amount,
      fee_amount: this.fee_amount,
      late_fee_amount: this.late_fee_amount,
      discount_amount: this.discount_amount,
      tax_amount: this.tax_amount,
      payment_method: this.payment_method,
      payment_reference: this.payment_reference,
      remarks: this.remarks,
      academic_year: this.academic_year,
      financial_year: this.financial_year,
    };
  };

  FeeCollection.prototype.getNetAmount = function () {
    return parseFloat(this.payment_amount) - parseFloat(this.refund_amount);
  };

  FeeCollection.prototype.markAsReconciled = function (reconciledBy) {
    this.reconciled = true;
    this.reconciled_at = new Date();
    this.reconciled_by = reconciledBy;
  };

  FeeCollection.prototype.processRefund = function (
    refundAmount,
    refundReason,
    refundReference,
  ) {
    this.refund_amount = parseFloat(refundAmount);
    this.refund_date = new Date();
    this.refund_reason = refundReason;
    this.refund_reference = refundReference;

    if (this.refund_amount >= this.payment_amount) {
      this.payment_status = "REFUNDED";
    }
  };

  // Class methods for business operations
  FeeCollection.generateReceiptNumber = async function (
    schoolId,
    academicYear,
  ) {
    try {
      const currentYear = academicYear.split("-")[0];
      const prefix = `FEE${schoolId}${currentYear}`;

      // Get the last receipt number for this pattern
      const lastReceipt = await this.findOne({
        where: {
          school_id: schoolId,
          academic_year: academicYear,
          receipt_number: {
            [require("sequelize").Op.like]: `${prefix}%`,
          },
        },
        order: [["receipt_number", "DESC"]],
      });

      let sequenceNumber = 1;
      if (lastReceipt) {
        const lastNumber = lastReceipt.receipt_number.replace(prefix, "");
        sequenceNumber = parseInt(lastNumber) + 1;
      }

      return `${prefix}${sequenceNumber.toString().padStart(6, "0")}`;
    } catch (error) {
      logger.error("Error generating receipt number", {
        school_id: schoolId,
        academic_year: academicYear,
        error: error.message,
      });
      throw error;
    }
  };

  FeeCollection.collectPayment = async function (paymentData, collectedBy) {
    const transaction = await this.sequelize.transaction();

    try {
      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(
        paymentData.school_id,
        paymentData.academic_year,
      );

      // Create payment record
      const collection = await this.create(
        {
          ...paymentData,
          receipt_number: receiptNumber,
          collected_by: collectedBy,
          accounting_date: paymentData.payment_date,
          financial_year: this.getFinancialYear(paymentData.payment_date),
        },
        { transaction },
      );

      // Update student fee record
      const studentFee = await this.sequelize.models.StudentFee.findByPk(
        paymentData.student_fee_id,
        {
          transaction,
        },
      );

      if (studentFee) {
        studentFee.recordPayment(paymentData.payment_amount);
        await studentFee.save({ transaction });
      }

      await transaction.commit();

      logger.info("Fee payment collected successfully", {
        receipt_number: receiptNumber,
        student_id: paymentData.student_id,
        amount: paymentData.payment_amount,
        collected_by: collectedBy,
      });

      return collection;
    } catch (error) {
      await transaction.rollback();
      logger.error("Error collecting fee payment", {
        student_id: paymentData.student_id,
        amount: paymentData.payment_amount,
        error: error.message,
      });
      throw error;
    }
  };

  FeeCollection.getDailyCollection = async function (schoolId, date) {
    try {
      const { fn, col } = require("sequelize");

      const result = await this.findAll({
        attributes: [
          "payment_method",
          [fn("COUNT", col("id")), "transaction_count"],
          [fn("SUM", col("payment_amount")), "total_amount"],
          [fn("SUM", col("fee_amount")), "fee_amount"],
          [fn("SUM", col("late_fee_amount")), "late_fee_amount"],
          [fn("SUM", col("tax_amount")), "tax_amount"],
        ],
        where: {
          school_id: schoolId,
          payment_date: date,
          payment_status: "SUCCESS",
        },
        group: ["payment_method"],
        raw: true,
      });

      const summary = {
        date: date,
        school_id: schoolId,
        payment_methods: result,
        total_transactions: result.reduce(
          (sum, item) => sum + parseInt(item.transaction_count),
          0,
        ),
        total_amount: result.reduce(
          (sum, item) => sum + parseFloat(item.total_amount),
          0,
        ),
      };

      return summary;
    } catch (error) {
      logger.error("Error getting daily collection", {
        school_id: schoolId,
        date: date,
        error: error.message,
      });
      throw error;
    }
  };

  FeeCollection.getCollectionStats = async function (
    schoolId,
    startDate,
    endDate,
  ) {
    try {
      const { Op, fn, col } = require("sequelize");

      const stats = await this.findAll({
        attributes: [
          [fn("COUNT", col("id")), "total_transactions"],
          [fn("SUM", col("payment_amount")), "total_collected"],
          [fn("SUM", col("fee_amount")), "fee_collected"],
          [fn("SUM", col("late_fee_amount")), "late_fee_collected"],
          [fn("SUM", col("discount_amount")), "discount_given"],
          [fn("COUNT", fn("DISTINCT", col("student_id"))), "unique_students"],
        ],
        where: {
          school_id: schoolId,
          payment_date: {
            [Op.between]: [startDate, endDate],
          },
          payment_status: "SUCCESS",
        },
        raw: true,
      });

      return {
        period: { start_date: startDate, end_date: endDate },
        school_id: schoolId,
        total_transactions: parseInt(stats[0]?.total_transactions || 0),
        total_collected: parseFloat(stats[0]?.total_collected || 0),
        fee_collected: parseFloat(stats[0]?.fee_collected || 0),
        late_fee_collected: parseFloat(stats[0]?.late_fee_collected || 0),
        discount_given: parseFloat(stats[0]?.discount_given || 0),
        unique_students: parseInt(stats[0]?.unique_students || 0),
      };
    } catch (error) {
      logger.error("Error getting collection stats", {
        school_id: schoolId,
        start_date: startDate,
        end_date: endDate,
        error: error.message,
      });
      throw error;
    }
  };

  // Utility methods
  FeeCollection.getFinancialYear = function (date) {
    const paymentDate = new Date(date);
    const year = paymentDate.getFullYear();
    const month = paymentDate.getMonth() + 1; // JavaScript months are 0-indexed

    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  // Model associations
  FeeCollection.associate = function (models) {
    // Belongs to Student
    FeeCollection.belongsTo(models.Student, {
      foreignKey: "student_id",
      as: "student",
      onDelete: "CASCADE",
    });

    // Belongs to Student Fee
    FeeCollection.belongsTo(models.StudentFee, {
      foreignKey: "student_fee_id",
      as: "studentFee",
      onDelete: "RESTRICT",
    });

    // Belongs to Fee Structure
    FeeCollection.belongsTo(models.FeeStructure, {
      foreignKey: "fee_structure_id",
      as: "feeStructure",
      onDelete: "RESTRICT",
    });

    // Belongs to School
    FeeCollection.belongsTo(models.School, {
      foreignKey: "school_id",
      as: "school",
      onDelete: "CASCADE",
    });

    // Belongs to User (collected by)
    FeeCollection.belongsTo(models.User, {
      foreignKey: "collected_by",
      as: "collector",
      onDelete: "RESTRICT",
    });

    // Belongs to User (verified by)
    FeeCollection.belongsTo(models.User, {
      foreignKey: "verified_by",
      as: "verifier",
      onDelete: "SET NULL",
    });
  };

  return FeeCollection;
}

// Q59-ENFORCED: Export validation schemas
module.exports = {
  defineFeeCollection,
  feeCollectionValidationSchemas,
};
