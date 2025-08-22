const express = require('express');
const StudentFeeController = require('../controllers/StudentFeeController');
const auth = require('../../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * Student Fee Management Routes
 * These routes manage student fee assignments and payments
 */

// Assign fee configuration to a student
router.post('/:student_id/assign-fee', StudentFeeController.assignFeeToStudent);

// Get student's fee assignment details
router.get('/:student_id/fee-assignment', StudentFeeController.getStudentFeeAssignment);

// Update student fee assignment (adjustments, discounts)
router.put('/assignment/:assignment_id', StudentFeeController.updateStudentFeeAssignment);

// Apply discount to student
router.post('/assignment/:assignment_id/discount', StudentFeeController.applyDiscountToStudent);

// Process fee payment
router.post('/payment', StudentFeeController.processPayment);

// Get student payment history
router.get('/:student_id/payment-history', StudentFeeController.getStudentPaymentHistory);

// Calculate outstanding fees for student
router.get('/:student_id/outstanding-fees', StudentFeeController.getStudentOutstandingFees);

// Generate fee receipt
router.get('/receipt/:transaction_id', StudentFeeController.generateFeeReceipt);

// Reverse a payment transaction
router.post('/payment/:transaction_id/reverse', StudentFeeController.reversePayment);

// Lock student fee structure (prevent further changes)
router.post('/assignment/:assignment_id/lock', StudentFeeController.lockFeeStructure);

// Get class-wise fee collection summary
router.get('/reports/class-wise-collection', StudentFeeController.getClassWiseFeeCollection);

module.exports = router;
