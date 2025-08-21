const { logger } = require("../../../utils/logger");
const { ErrorFactory } = require("../../../utils/errors");

/**
 * Fee Service
 * Central business logic for fee management operations
 * Handles fee structures, student fees, payments, discounts, and installments
 * Following copilot instructions: CommonJS, async/await, try-catch patterns
 */
class FeeService {
  constructor(models) {
    this.models = models;
    this.FeeStructure = models.FeeStructure;
    this.StudentFee = models.StudentFee;
    this.FeeCollection = models.FeeCollection;
    this.FeeInstallment = models.FeeInstallment;
    this.FeeDiscount = models.FeeDiscount;
    this.StudentFeeDiscount = models.StudentFeeDiscount;
    this.Student = models.Student;
    this.School = models.School;
    this.User = models.User;
  }

  // ============= FEE STRUCTURE MANAGEMENT =============

  /**
   * Create a new fee structure
   */
  async createFeeStructure(feeStructureData, createdBy) {
    try {
      logger.info("Creating fee structure", {
        fee_name: feeStructureData.fee_name,
        created_by: createdBy,
      });

      // Validate required data
      if (
        !feeStructureData.fee_name ||
        !feeStructureData.fee_category ||
        !feeStructureData.amount
      ) {
        throw ErrorFactory.badRequest(
          "Fee name, category, and amount are required",
        );
      }

      // Check for duplicate fee structure
      const existingFee = await this.FeeStructure.findOne({
        where: {
          school_id: feeStructureData.school_id,
          fee_name: feeStructureData.fee_name,
          fee_category: feeStructureData.fee_category,
          class_name: feeStructureData.class_name,
          academic_year: feeStructureData.academic_year,
          is_active: true,
        },
      });

      if (existingFee) {
        throw ErrorFactory.conflict(
          "Fee structure already exists for this class and category",
        );
      }

      // Create fee structure
      const feeStructure = await this.FeeStructure.create({
        ...feeStructureData,
        created_by: createdBy,
      });

      logger.info("Fee structure created successfully", {
        fee_structure_id: feeStructure.id,
        fee_name: feeStructure.fee_name,
      });

      return feeStructure;
    } catch (error) {
      logger.error("Error creating fee structure", {
        fee_name: feeStructureData?.fee_name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get fee structures for a school
   */
  async getFeeStructures(schoolId, filters = {}) {
    try {
      const where = { school_id: schoolId };

      // Apply filters
      if (filters.class_name) where.class_name = filters.class_name;
      if (filters.fee_category) where.fee_category = filters.fee_category;
      if (filters.academic_year) where.academic_year = filters.academic_year;
      if (filters.is_active !== undefined) where.is_active = filters.is_active;

      const feeStructures = await this.FeeStructure.findAll({
        where: where,
        include: [
          {
            model: this.User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
          {
            model: this.User,
            as: "updater",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [
          ["class_name", "ASC"],
          ["fee_category", "ASC"],
        ],
      });

      return feeStructures;
    } catch (error) {
      logger.error("Error getting fee structures", {
        school_id: schoolId,
        filters: filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update fee structure
   */
  async updateFeeStructure(feeStructureId, updateData, updatedBy) {
    try {
      const feeStructure = await this.FeeStructure.findByPk(feeStructureId);
      if (!feeStructure) {
        throw ErrorFactory.notFound("Fee structure not found");
      }

      await feeStructure.update({
        ...updateData,
        updated_by: updatedBy,
      });

      logger.info("Fee structure updated", {
        fee_structure_id: feeStructureId,
        updated_by: updatedBy,
      });

      return feeStructure;
    } catch (error) {
      logger.error("Error updating fee structure", {
        fee_structure_id: feeStructureId,
        error: error.message,
      });
      throw error;
    }
  }

  // ============= STUDENT FEE MANAGEMENT =============

  /**
   * Assign fee to student
   */
  async assignFeeToStudent(
    studentId,
    feeStructureId,
    academicYear,
    assignedBy,
  ) {
    try {
      logger.info("Assigning fee to student", {
        student_id: studentId,
        fee_structure_id: feeStructureId,
        academic_year: academicYear,
      });

      // Get student and fee structure
      const student = await this.Student.findByPk(studentId);
      const feeStructure = await this.FeeStructure.findByPk(feeStructureId);

      if (!student) throw ErrorFactory.notFound("Student not found");
      if (!feeStructure) throw ErrorFactory.notFound("Fee structure not found");

      // Check if fee is already assigned
      const existingFee = await this.StudentFee.findOne({
        where: {
          student_id: studentId,
          fee_structure_id: feeStructureId,
          academic_year: academicYear,
        },
      });

      if (existingFee) {
        throw ErrorFactory.conflict("Fee is already assigned to this student");
      }

      // Create student fee
      const studentFee = await this.StudentFee.create({
        student_id: studentId,
        fee_structure_id: feeStructureId,
        school_id: student.school_id,
        academic_year: academicYear,
        total_amount: feeStructure.amount,
        due_amount: feeStructure.amount,
        fee_category: feeStructure.fee_category,
        assigned_by: assignedBy,
      });

      // Create installments if fee structure has installment plan
      if (
        feeStructure.installment_plan &&
        feeStructure.installment_plan.length > 0
      ) {
        await this.FeeInstallment.createInstallments(
          studentFee.id,
          feeStructure,
          studentFee,
        );
      }

      // Apply auto-discounts
      await this.applyAutoDiscounts(studentFee.id, assignedBy);

      logger.info("Fee assigned to student successfully", {
        student_fee_id: studentFee.id,
        student_id: studentId,
        total_amount: studentFee.total_amount,
      });

      return studentFee;
    } catch (error) {
      logger.error("Error assigning fee to student", {
        student_id: studentId,
        fee_structure_id: feeStructureId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get student fees
   */
  async getStudentFees(studentId, academicYear = null) {
    try {
      const where = { student_id: studentId };
      if (academicYear) where.academic_year = academicYear;

      const studentFees = await this.StudentFee.findAll({
        where: where,
        include: [
          {
            model: this.FeeStructure,
            as: "feeStructure",
          },
          {
            model: this.FeeInstallment,
            as: "installments",
            separate: true,
            order: [["installment_number", "ASC"]],
          },
          {
            model: this.StudentFeeDiscount,
            as: "discounts",
            include: [
              {
                model: this.FeeDiscount,
                as: "feeDiscount",
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return studentFees;
    } catch (error) {
      logger.error("Error getting student fees", {
        student_id: studentId,
        academic_year: academicYear,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get fee summary for student
   */
  async getStudentFeeSummary(studentId, academicYear) {
    try {
      const { Op, fn, col } = require("sequelize");

      const summary = await this.StudentFee.findAll({
        attributes: [
          [fn("SUM", col("total_amount")), "total_fees"],
          [fn("SUM", col("paid_amount")), "total_paid"],
          [fn("SUM", col("due_amount")), "total_due"],
          [fn("SUM", col("discount_amount")), "total_discount"],
          [fn("COUNT", col("id")), "fee_count"],
        ],
        where: {
          student_id: studentId,
          academic_year: academicYear,
        },
        raw: true,
      });

      const overdueFees = await this.StudentFee.count({
        where: {
          student_id: studentId,
          academic_year: academicYear,
          payment_status: "OVERDUE",
        },
      });

      return {
        student_id: studentId,
        academic_year: academicYear,
        total_fees: parseFloat(summary[0]?.total_fees || 0),
        total_paid: parseFloat(summary[0]?.total_paid || 0),
        total_due: parseFloat(summary[0]?.total_due || 0),
        total_discount: parseFloat(summary[0]?.total_discount || 0),
        fee_count: parseInt(summary[0]?.fee_count || 0),
        overdue_fees: overdueFees,
      };
    } catch (error) {
      logger.error("Error getting student fee summary", {
        student_id: studentId,
        academic_year: academicYear,
        error: error.message,
      });
      throw error;
    }
  }

  // ============= PAYMENT MANAGEMENT =============

  /**
   * Process fee payment
   */
  async processPayment(paymentData, collectedBy) {
    try {
      logger.info("Processing fee payment", {
        student_id: paymentData.student_id,
        amount: paymentData.payment_amount,
        method: paymentData.payment_method,
      });

      // Validate student fee
      const studentFee = await this.StudentFee.findByPk(
        paymentData.student_fee_id,
      );
      if (!studentFee) {
        throw ErrorFactory.notFound("Student fee not found");
      }

      if (studentFee.payment_status === "PAID") {
        throw ErrorFactory.badRequest("Fee is already fully paid");
      }

      // Validate payment amount
      if (paymentData.payment_amount > studentFee.due_amount) {
        throw ErrorFactory.badRequest("Payment amount exceeds due amount");
      }

      // Create payment record
      const collection = await this.FeeCollection.collectPayment(
        paymentData,
        collectedBy,
      );

      logger.info("Fee payment processed successfully", {
        collection_id: collection.id,
        receipt_number: collection.receipt_number,
        amount: collection.payment_amount,
      });

      return collection;
    } catch (error) {
      logger.error("Error processing payment", {
        student_id: paymentData?.student_id,
        amount: paymentData?.payment_amount,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get payment history for student
   */
  async getPaymentHistory(studentId, academicYear = null) {
    try {
      const where = { student_id: studentId };
      if (academicYear) {
        const studentFeeIds = await this.StudentFee.findAll({
          where: { student_id: studentId, academic_year: academicYear },
          attributes: ["id"],
          raw: true,
        });
        where.student_fee_id = studentFeeIds.map((sf) => sf.id);
      }

      const payments = await this.FeeCollection.findAll({
        where: where,
        include: [
          {
            model: this.StudentFee,
            as: "studentFee",
            include: [
              {
                model: this.FeeStructure,
                as: "feeStructure",
                attributes: ["fee_name", "fee_category"],
              },
            ],
          },
          {
            model: this.User,
            as: "collector",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["payment_date", "DESC"]],
      });

      return payments;
    } catch (error) {
      logger.error("Error getting payment history", {
        student_id: studentId,
        academic_year: academicYear,
        error: error.message,
      });
      throw error;
    }
  }

  // ============= DISCOUNT MANAGEMENT =============

  /**
   * Apply auto-discounts to student fee
   */
  async applyAutoDiscounts(studentFeeId, appliedBy) {
    try {
      const studentFee = await this.StudentFee.findByPk(studentFeeId, {
        include: [
          {
            model: this.Student,
            as: "student",
          },
        ],
      });

      if (!studentFee) return;

      // Get auto-apply discounts for the school
      const discounts = await this.FeeDiscount.getAutoApplyDiscounts(
        studentFee.school_id,
      );

      for (const discount of discounts) {
        try {
          // Check eligibility
          const eligibility = discount.checkEligibility(
            studentFee.student,
            studentFee,
          );
          if (eligibility.eligible) {
            await this.StudentFeeDiscount.applyDiscount(
              studentFeeId,
              discount.id,
              appliedBy,
              {
                auto_applied: true,
              },
            );
          }
        } catch (error) {
          logger.error("Error applying auto-discount", {
            student_fee_id: studentFeeId,
            discount_id: discount.id,
            error: error.message,
          });
        }
      }
    } catch (error) {
      logger.error("Error applying auto-discounts", {
        student_fee_id: studentFeeId,
        error: error.message,
      });
    }
  }

  /**
   * Create fee discount
   */
  async createFeeDiscount(discountData, createdBy) {
    try {
      logger.info("Creating fee discount", {
        discount_name: discountData.discount_name,
        discount_type: discountData.discount_type,
      });

      // Check for duplicate discount code
      const existingDiscount = await this.FeeDiscount.findOne({
        where: {
          discount_code: discountData.discount_code,
          school_id: discountData.school_id,
        },
      });

      if (existingDiscount) {
        throw ErrorFactory.conflict("Discount code already exists");
      }

      const discount = await this.FeeDiscount.create({
        ...discountData,
        created_by: createdBy,
      });

      logger.info("Fee discount created successfully", {
        discount_id: discount.id,
        discount_code: discount.discount_code,
      });

      return discount;
    } catch (error) {
      logger.error("Error creating fee discount", {
        discount_code: discountData?.discount_code,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Apply discount to student fee
   */
  async applyDiscountToStudentFee(
    studentFeeId,
    discountId,
    appliedBy,
    options = {},
  ) {
    try {
      return await this.StudentFeeDiscount.applyDiscount(
        studentFeeId,
        discountId,
        appliedBy,
        options,
      );
    } catch (error) {
      logger.error("Error applying discount to student fee", {
        student_fee_id: studentFeeId,
        discount_id: discountId,
        error: error.message,
      });
      throw error;
    }
  }

  // ============= INSTALLMENT MANAGEMENT =============

  /**
   * Get due installments for school
   */
  async getDueInstallments(schoolId, daysAhead = 7) {
    try {
      return await this.FeeInstallment.getDueInstallments(schoolId, daysAhead);
    } catch (error) {
      logger.error("Error getting due installments", {
        school_id: schoolId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get overdue installments for school
   */
  async getOverdueInstallments(schoolId, graceDays = 0) {
    try {
      return await this.FeeInstallment.getOverdueInstallments(
        schoolId,
        graceDays,
      );
    } catch (error) {
      logger.error("Error getting overdue installments", {
        school_id: schoolId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process auto late fees
   */
  async processAutoLateFees(schoolId) {
    try {
      logger.info("Processing auto late fees", { school_id: schoolId });

      const results = await this.FeeInstallment.processAutoLateFees(schoolId);

      logger.info("Auto late fees processed", {
        school_id: schoolId,
        processed_count: results.length,
        applied_count: results.filter((r) => r.late_fee_applied).length,
      });

      return results;
    } catch (error) {
      logger.error("Error processing auto late fees", {
        school_id: schoolId,
        error: error.message,
      });
      throw error;
    }
  }

  // ============= REPORTING AND ANALYTICS =============

  /**
   * Get fee collection summary
   */
  async getFeeCollectionSummary(schoolId, startDate, endDate) {
    try {
      const stats = await this.FeeCollection.getCollectionStats(
        schoolId,
        startDate,
        endDate,
      );
      return stats;
    } catch (error) {
      logger.error("Error getting fee collection summary", {
        school_id: schoolId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get daily collection report
   */
  async getDailyCollectionReport(schoolId, date) {
    try {
      return await this.FeeCollection.getDailyCollection(schoolId, date);
    } catch (error) {
      logger.error("Error getting daily collection report", {
        school_id: schoolId,
        date: date,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get outstanding fees report
   */
  async getOutstandingFeesReport(schoolId, academicYear) {
    try {
      const { Op } = require("sequelize");

      const outstandingFees = await this.StudentFee.findAll({
        where: {
          school_id: schoolId,
          academic_year: academicYear,
          payment_status: {
            [Op.in]: ["PENDING", "PARTIAL", "OVERDUE"],
          },
          due_amount: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: this.Student,
            as: "student",
            attributes: [
              "id",
              "admission_number",
              "first_name",
              "last_name",
              "class_name",
            ],
          },
          {
            model: this.FeeStructure,
            as: "feeStructure",
            attributes: ["fee_name", "fee_category"],
          },
        ],
        order: [["due_date", "ASC"]],
      });

      const summary = {
        school_id: schoolId,
        academic_year: academicYear,
        total_outstanding_amount: outstandingFees.reduce(
          (sum, fee) => sum + parseFloat(fee.due_amount),
          0,
        ),
        total_outstanding_fees: outstandingFees.length,
        overdue_fees: outstandingFees.filter(
          (fee) => fee.payment_status === "OVERDUE",
        ).length,
        fees: outstandingFees,
      };

      return summary;
    } catch (error) {
      logger.error("Error getting outstanding fees report", {
        school_id: schoolId,
        academic_year: academicYear,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get discount utilization report
   */
  async getDiscountUtilizationReport(schoolId, academicYear) {
    try {
      const discountStats = await this.StudentFeeDiscount.getDiscountStatistics(
        schoolId,
        academicYear,
      );

      const discountBreakdown = await this.StudentFeeDiscount.findAll({
        attributes: [
          [
            this.models.sequelize.fn(
              "COUNT",
              this.models.sequelize.col("StudentFeeDiscount.id"),
            ),
            "usage_count",
          ],
          [
            this.models.sequelize.fn(
              "SUM",
              this.models.sequelize.col("StudentFeeDiscount.discount_amount"),
            ),
            "total_discount",
          ],
        ],
        where: {
          school_id: schoolId,
          academic_year: academicYear,
          application_status: "APPROVED",
        },
        include: [
          {
            model: this.FeeDiscount,
            as: "feeDiscount",
            attributes: [
              "id",
              "discount_name",
              "discount_type",
              "discount_code",
            ],
          },
        ],
        group: ["fee_discount_id"],
        raw: false,
      });

      return {
        ...discountStats,
        discount_breakdown: discountBreakdown,
      };
    } catch (error) {
      logger.error("Error getting discount utilization report", {
        school_id: schoolId,
        academic_year: academicYear,
        error: error.message,
      });
      throw error;
    }
  }

  // ============= UTILITY METHODS =============

  /**
   * Bulk assign fees to students
   */
  async bulkAssignFees(studentIds, feeStructureId, academicYear, assignedBy) {
    try {
      logger.info("Bulk assigning fees to students", {
        student_count: studentIds.length,
        fee_structure_id: feeStructureId,
        academic_year: academicYear,
      });

      const results = [];

      for (const studentId of studentIds) {
        try {
          const studentFee = await this.assignFeeToStudent(
            studentId,
            feeStructureId,
            academicYear,
            assignedBy,
          );
          results.push({
            student_id: studentId,
            success: true,
            student_fee_id: studentFee.id,
          });
        } catch (error) {
          results.push({
            student_id: studentId,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;

      logger.info("Bulk fee assignment completed", {
        total_students: studentIds.length,
        successful: successCount,
        failed: studentIds.length - successCount,
      });

      return {
        total_processed: studentIds.length,
        successful: successCount,
        failed: studentIds.length - successCount,
        results: results,
      };
    } catch (error) {
      logger.error("Error in bulk fee assignment", {
        student_count: studentIds?.length,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate receipt data
   */
  async generateReceiptData(receiptNumber) {
    try {
      const collection = await this.FeeCollection.findOne({
        where: { receipt_number: receiptNumber },
        include: [
          {
            model: this.Student,
            as: "student",
            attributes: [
              "id",
              "admission_number",
              "first_name",
              "last_name",
              "class_name",
            ],
          },
          {
            model: this.FeeStructure,
            as: "feeStructure",
            attributes: ["fee_name", "fee_category"],
          },
          {
            model: this.School,
            as: "school",
            attributes: ["id", "school_name", "address", "phone", "email"],
          },
        ],
      });

      if (!collection) {
        throw ErrorFactory.notFound("Receipt not found");
      }

      return {
        receipt: collection.generateReceiptData(),
        student: collection.student,
        fee_structure: collection.feeStructure,
        school: collection.school,
      };
    } catch (error) {
      logger.error("Error generating receipt data", {
        receipt_number: receiptNumber,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = FeeService;
