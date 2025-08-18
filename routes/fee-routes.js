const express = require('express');
const router = express.Router();
const feeService = require('../modules/fees/fees-service');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Fee Structure Management

// Create fee structure
router.post(
  '/structures',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.createStructure'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const structureData = req.body;
      const createdBy = req.session.userId;

      const result = await feeService.createFeeStructure(structureData, createdBy, req.trustCode);

      res.success(result, 'Fee structure created successfully');
    } catch (error) {
      res.error(error.message, 'FEE_STRUCTURE_CREATION_FAILED', 400);
    }
  })
);

// Get fee structures
router.get(
  '/structures',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.listStructures'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;

      const structures = await feeService.getFeeStructures(filters, req.trustCode);

      res.success(structures, 'Fee structures retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_STRUCTURES_FETCH_FAILED', 500);
    }
  })
);

// Get fee structure by ID
router.get(
  '/structures/:structureId',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateParams('fee.structureId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { structureId } = req.params;

      const structure = await feeService.getFeeStructureById(structureId, req.trustCode);

      res.success(structure, 'Fee structure retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_STRUCTURE_FETCH_FAILED', 404);
    }
  })
);

// Update fee structure
router.put(
  '/structures/:structureId',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'update'),
  validationMiddleware.validateParams('fee.structureId'),
  validationMiddleware.validate('fee.updateStructure'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { structureId } = req.params;
      const updateData = req.body;
      const updatedBy = req.session.userId;

      const result = await feeService.updateFeeStructure(
        structureId,
        updateData,
        updatedBy,
        req.trustCode
      );

      res.success(result, 'Fee structure updated successfully');
    } catch (error) {
      res.error(error.message, 'FEE_STRUCTURE_UPDATE_FAILED', 400);
    }
  })
);

// Student Fee Assignments

// Assign fee structure to student
router.post(
  '/assignments',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.assignToStudent'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const assignmentData = req.body;
      const assignedBy = req.session.userId;

      const result = await feeService.assignFeeToStudent(assignmentData, assignedBy, req.trustCode);

      res.success(result, 'Fee assigned to student successfully');
    } catch (error) {
      res.error(error.message, 'FEE_ASSIGNMENT_FAILED', 400);
    }
  })
);

// Get student fee assignments
router.get(
  '/assignments',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.listAssignments'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const assignments = await feeService.getStudentFeeAssignments(
        filters,
        userRole,
        userId,
        req.trustCode
      );

      res.success(assignments, 'Fee assignments retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_ASSIGNMENTS_FETCH_FAILED', 500);
    }
  })
);

// Bulk assign fees to students
router.post(
  '/assignments/bulk',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.bulkAssign'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { assignments } = req.body;
      const assignedBy = req.session.userId;

      const result = await feeService.bulkAssignFees(assignments, assignedBy, req.trustCode);

      res.success(result, 'Bulk fee assignment completed');
    } catch (error) {
      res.error(error.message, 'BULK_FEE_ASSIGNMENT_FAILED', 400);
    }
  })
);

// Fee Collection

// Collect fee payment
router.post(
  '/payments',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.collectPayment'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const paymentData = req.body;
      const collectedBy = req.session.userId;

      const result = await feeService.collectFeePayment(paymentData, collectedBy, req.trustCode);

      res.success(result, 'Fee payment collected successfully');
    } catch (error) {
      res.error(error.message, 'FEE_PAYMENT_FAILED', 400);
    }
  })
);

// Get fee receipts
router.get(
  '/receipts',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.listReceipts'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const receipts = await feeService.getFeeReceipts(filters, userRole, userId, req.trustCode);

      res.success(receipts, 'Fee receipts retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_RECEIPTS_FETCH_FAILED', 500);
    }
  })
);

// Get receipt by ID
router.get(
  '/receipts/:receiptId',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateParams('fee.receiptId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { receiptId } = req.params;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const receipt = await feeService.getFeeReceiptById(
        receiptId,
        userRole,
        userId,
        req.trustCode
      );

      res.success(receipt, 'Fee receipt retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_RECEIPT_FETCH_FAILED', 404);
    }
  })
);

// Generate receipt PDF
router.get(
  '/receipts/:receiptId/pdf',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateParams('fee.receiptId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { receiptId } = req.params;

      const pdfResult = await feeService.generateReceiptPDF(receiptId, req.trustCode);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename}"`);
      res.send(pdfResult.data);
    } catch (error) {
      res.error(error.message, 'PDF_GENERATION_FAILED', 500);
    }
  })
);

// Discounts and Concessions

// Apply discount to student
router.post(
  '/discounts',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'update'),
  validationMiddleware.validate('fee.applyDiscount'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const discountData = req.body;
      const appliedBy = req.session.userId;

      const result = await feeService.applyDiscount(discountData, appliedBy, req.trustCode);

      res.success(result, 'Discount applied successfully');
    } catch (error) {
      res.error(error.message, 'DISCOUNT_APPLICATION_FAILED', 400);
    }
  })
);

// Get student discounts
router.get(
  '/discounts',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.listDiscounts'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;

      const discounts = await feeService.getStudentDiscounts(filters, req.trustCode);

      res.success(discounts, 'Student discounts retrieved successfully');
    } catch (error) {
      res.error(error.message, 'DISCOUNTS_FETCH_FAILED', 500);
    }
  })
);

// Remove discount
router.delete(
  '/discounts/:discountId',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'delete'),
  validationMiddleware.validateParams('fee.discountId'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { discountId } = req.params;
      const removedBy = req.session.userId;

      const result = await feeService.removeDiscount(discountId, removedBy, req.trustCode);

      res.success(result, 'Discount removed successfully');
    } catch (error) {
      res.error(error.message, 'DISCOUNT_REMOVAL_FAILED', 400);
    }
  })
);

// Fee Categories

// Create fee category
router.post(
  '/categories',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.createCategory'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const categoryData = req.body;
      const createdBy = req.session.userId;

      const result = await feeService.createFeeCategory(categoryData, createdBy, req.trustCode);

      res.success(result, 'Fee category created successfully');
    } catch (error) {
      res.error(error.message, 'FEE_CATEGORY_CREATION_FAILED', 400);
    }
  })
);

// Get fee categories
router.get(
  '/categories',
  authMiddleware.requirePermission('fees', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const categories = await feeService.getFeeCategories(req.trustCode);

      res.success(categories, 'Fee categories retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_CATEGORIES_FETCH_FAILED', 500);
    }
  })
);

// Reports and Statistics

// Get fee collection summary
router.get(
  '/reports/collection-summary',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.collectionSummary'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const summary = await feeService.getFeeCollectionSummary(
        filters,
        userRole,
        userId,
        req.trustCode
      );

      res.success(summary, 'Fee collection summary retrieved successfully');
    } catch (error) {
      res.error(error.message, 'COLLECTION_SUMMARY_FETCH_FAILED', 500);
    }
  })
);

// Get outstanding fees report
router.get(
  '/reports/outstanding',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.outstandingReport'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const outstandingFees = await feeService.getOutstandingFeesReport(
        filters,
        userRole,
        userId,
        req.trustCode
      );

      res.success(outstandingFees, 'Outstanding fees report retrieved successfully');
    } catch (error) {
      res.error(error.message, 'OUTSTANDING_FEES_FETCH_FAILED', 500);
    }
  })
);

// Get fee collection statistics
router.get(
  '/stats/overview',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.statsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const stats = await feeService.getFeeStats(filters, userRole, userId, req.trustCode);

      res.success(stats, 'Fee statistics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'FEE_STATS_FETCH_FAILED', 500);
    }
  })
);

// Export fee data
router.get(
  '/export/:format',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateParams('common.exportFormat'),
  validationMiddleware.validateQuery('fee.export'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { format } = req.params;
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const result = await feeService.exportFeeData(
        format,
        filters,
        userRole,
        userId,
        req.trustCode
      );

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      res.error(error.message, 'FEE_EXPORT_FAILED', 500);
    }
  })
);

// Payment Methods and Online Payments

// Get available payment methods
router.get(
  '/payment-methods',
  authMiddleware.requirePermission('fees', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const paymentMethods = await feeService.getPaymentMethods(req.trustCode);

      res.success(paymentMethods, 'Payment methods retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PAYMENT_METHODS_FETCH_FAILED', 500);
    }
  })
);

// Generate payment link for online payment
router.post(
  '/payment-links',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.generatePaymentLink'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const linkData = req.body;
      const generatedBy = req.session.userId;

      const result = await feeService.generatePaymentLink(linkData, generatedBy, req.trustCode);

      res.success(result, 'Payment link generated successfully');
    } catch (error) {
      res.error(error.message, 'PAYMENT_LINK_GENERATION_FAILED', 400);
    }
  })
);

// Enhanced Payment Processing Routes

// Initiate online payment
router.post(
  '/payments/initiate',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT']),
  authMiddleware.requirePermission('fees', 'create'),
  validationMiddleware.validate('fee.initiatePayment'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const paymentData = req.body;
      const initiatedBy = req.session.userId;

      // Add user context to payment data
      paymentData.initiated_by = initiatedBy;
      paymentData.user_role = req.session.userRole;

      const result = await feeService.initiateOnlinePayment(paymentData, req.trustCode);

      res.success(result, 'Payment initiated successfully');
    } catch (error) {
      res.error(error.message, 'PAYMENT_INITIATION_FAILED', 400);
    }
  })
);

// Payment callback handler (webhook endpoint)
router.post(
  '/payments/callback/:gateway',
  // Note: This endpoint should not require authentication as it's called by payment gateways
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { gateway } = req.params;
      const callbackData = req.body;

      // Log the callback for debugging
      console.log(`Payment callback received for ${gateway}:`, callbackData);

      const result = await feeService.handlePaymentCallback(callbackData, req.trustCode, gateway);

      // Return appropriate response based on gateway requirements
      const gatewayResponses = {
        RAZORPAY: { status: 'ok' },
        PAYTM: { RESPCODE: '01', RESPMSG: 'txn success' },
        PAYU: { status: 1, message: 'success' },
        default: { success: true, message: 'Payment processed' }
      };

      const response = gatewayResponses[gateway.toUpperCase()] || gatewayResponses.default;
      res.json(response);
    } catch (error) {
      console.error('Payment callback error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
        message: 'Payment processing failed'
      });
    }
  })
);

// Verify payment status
router.post(
  '/payments/verify',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT', 'STUDENT']),
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validate('fee.verifyPayment'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { transaction_id, gateway_name } = req.body;

      const result = await feeService.verifyPaymentStatus(
        transaction_id,
        gateway_name,
        req.trustCode
      );

      res.success(result, 'Payment status verified');
    } catch (error) {
      res.error(error.message, 'PAYMENT_VERIFICATION_FAILED', 400);
    }
  })
);

// Get payment transactions for a student
router.get(
  '/payments/transactions',
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.listTransactions'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      // Restrict access based on user role
      if (userRole === 'PARENT' || userRole === 'STUDENT') {
        // Parents and students can only see their own transactions
        filters.user_id = userId;
      }

      const transactions = await feeService.getPaymentTransactions(filters, req.trustCode);

      res.success(transactions, 'Payment transactions retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TRANSACTIONS_FETCH_FAILED', 500);
    }
  })
);

// Refund payment
router.post(
  '/payments/refund',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'update'),
  validationMiddleware.validate('fee.refundPayment'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const refundData = req.body;
      const processedBy = req.session.userId;

      refundData.processed_by = processedBy;

      const result = await feeService.refundPayment(refundData, req.trustCode);

      res.success(result, 'Payment refund processed successfully');
    } catch (error) {
      res.error(error.message, 'PAYMENT_REFUND_FAILED', 400);
    }
  })
);

// Get available payment gateways
router.get(
  '/payment-gateways',
  authMiddleware.requirePermission('fees', 'read'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const setupService = require('../modules/setup/setup-service');
      const gateways = await setupService.getPaymentGateways(true); // Only enabled gateways

      res.success(gateways, 'Payment gateways retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PAYMENT_GATEWAYS_FETCH_FAILED', 500);
    }
  })
);

// Test payment gateway connection
router.post(
  '/payment-gateways/:gatewayName/test',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  authMiddleware.requirePermission('fees', 'update'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { gatewayName } = req.params;

      const result = await feeService.testPaymentGateway(gatewayName, req.trustCode);

      res.success(result, 'Payment gateway test completed');
    } catch (error) {
      res.error(error.message, 'PAYMENT_GATEWAY_TEST_FAILED', 400);
    }
  })
);

// Get payment analytics
router.get(
  '/payments/analytics',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']),
  authMiddleware.requirePermission('fees', 'read'),
  validationMiddleware.validateQuery('fee.analyticsFilters'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const userRole = req.session.userRole;
      const userId = req.session.userId;

      const analytics = await feeService.getPaymentAnalytics(
        filters,
        userRole,
        userId,
        req.trustCode
      );

      res.success(analytics, 'Payment analytics retrieved successfully');
    } catch (error) {
      res.error(error.message, 'PAYMENT_ANALYTICS_FETCH_FAILED', 500);
    }
  })
);

module.exports = router;
