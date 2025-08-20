const express = require('express');
const FeeController = require('../controllers/FeeController');
const { requireAuth, requireRole } = require('../../../middleware/auth');
const { requireTenant } = require('../../../middleware/tenant');
const { validateInput } = require('../../../middleware');

/**
 * Fee Routes
 * Handles routing for fee management operations
 */
function createFeeRoutes() {
   const router = express.Router();
   const feeController = new FeeController();

   // Apply middleware to all routes
   router.use(requireTenant);
   router.use(requireAuth);

   // Fee Structure Routes
   router.post(
      '/structures',
      requireRole(['admin', 'teacher']),
      validateInput('fee-structure'),
      feeController.createFeeStructure
   );

   router.get(
      '/structures/school/:schoolId',
      requireRole(['admin', 'teacher']),
      feeController.getFeeStructuresBySchool
   );

   // Student Fee Routes
   router.post(
      '/student-fees',
      requireRole(['admin', 'teacher']),
      validateInput('student-fee'),
      feeController.createStudentFee
   );

   router.get(
      '/student-fees/student/:studentId',
      requireRole(['admin', 'teacher', 'student', 'parent']),
      feeController.getStudentFees
   );

   // Fee Payment Routes
   router.post(
      '/payments',
      requireRole(['admin', 'teacher']),
      validateInput('fee-payment'),
      feeController.processFeePayment
   );

   router.get('/collections', requireRole(['admin', 'teacher']), feeController.getFeeCollections);

   // Fee Discount Routes
   router.post('/discounts', requireRole(['admin']), validateInput('fee-discount'), feeController.createFeeDiscount);

   router.post(
      '/discounts/apply',
      requireRole(['admin']),
      validateInput('student-discount'),
      feeController.applyStudentDiscount
   );

   // Fee Reports Routes
   router.get('/reports', requireRole(['admin', 'teacher']), feeController.getFeeReports);

   // Bulk Operations Routes
   router.post('/bulk', requireRole(['admin']), validateInput('bulk-fee-operation'), feeController.bulkFeeOperations);

   return router;
}

module.exports = createFeeRoutes;
