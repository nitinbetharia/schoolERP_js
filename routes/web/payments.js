const express = require('express');
const Joi = require('joi');
const { logError } = require('../../utils/logger');
const PaymentService = require('../../services/PaymentService');

/**
 * Payment Processing Routes
 * Complete payment management and transaction processing
 * Phase 5 Implementation - Fee Management System
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   // Import models dynamically based on tenant
   const getTenantModels = (tenantCode) => {
      if (!tenantCode) {
         return null;
      }
      const { dbManager } = require('../../models/system/database');
      const tenantDB = dbManager.getTenantDatabase(tenantCode);
      return tenantDB ? require('../../models')(tenantDB) : null;
   };

   // Initialize payment service - will be created per request with tenant models
   const initPaymentService = (tenantCode) => {
      const models = getTenantModels(tenantCode);
      const PaymentService = require('../../services/PaymentService');
      return new PaymentService(models);
   };

   // Joi validation schemas
   const processPaymentSchema = Joi.object({
      fee_assignment_id: Joi.number().integer().positive().required(),
      amount: Joi.number().positive().precision(2).required(),
      payment_method: Joi.string().valid('CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER').required(),
      payment_date: Joi.date().optional(),
      remarks: Joi.string().max(500).optional().allow(''),
      collected_by: Joi.number().integer().positive().optional(),
      component_payments: Joi.array()
         .items(
            Joi.object({
               component_id: Joi.number().integer().positive().required(),
               amount: Joi.number().positive().precision(2).required(),
            })
         )
         .optional(),
   });

   /**
    * @route GET /payments
    * @desc Payment history and management page
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Payment management privileges required.');
            return res.redirect('/dashboard');
         }

         // Get filters and pagination
         const filters = {
            student_id: req.query.student_id || '',
            fee_structure_id: req.query.fee_structure_id || '',
            payment_method: req.query.payment_method || '',
            status: req.query.status || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            search: req.query.search || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'payment_date',
            sortOrder: req.query.sortOrder || 'DESC',
         };

         // Get payment history from service
         const { payments, pagination: paginationData } = await paymentService.getPaymentHistory(
            filters,
            pagination,
            req.tenant?.code
         );

         // Get statistics
         const statistics = await paymentService.getPaymentStatistics(filters, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Payment Management', url: '/payments' },
         ];

         res.render('pages/payments/index', {
            title: 'Payment Management',
            description: 'View and manage payment transactions',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/payments',
            payments: payments,
            filters: filters,
            pagination: paginationData,
            breadcrumb: breadcrumb,
            statistics: statistics,
            paymentMethods: [
               { value: 'CASH', label: 'Cash' },
               { value: 'CARD', label: 'Card' },
               { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
               { value: 'UPI', label: 'UPI' },
               { value: 'CHEQUE', label: 'Cheque' },
               { value: 'OTHER', label: 'Other' },
            ],
            statuses: [
               { value: 'COMPLETED', label: 'Completed' },
               { value: 'PENDING', label: 'Pending' },
               { value: 'FAILED', label: 'Failed' },
               { value: 'CANCELLED', label: 'Cancelled' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'payments index GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load payment history. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route POST /payments
    * @desc Process new payment
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Payment processing privileges required.',
            });
         }

         // Validate payment data
         const { error, value } = processPaymentSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid payment data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         // Set collected_by to current user if not provided
         if (!value.collected_by) {
            value.collected_by = req.session.user.id;
         }

         // Process payment using service
         const result = await paymentService.processPayment(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Payment processed successfully',
            payment: result.payment,
            receipt: result.receipt,
         });
      } catch (error) {
         logError(error, { context: 'payments process POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found') ? 404 : error.message.includes('exceeds') ? 400 : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to process payment',
         });
      }
   });

   /**
    * @route GET /payments/:id
    * @desc Payment detail page with receipt
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/:id', requireAuth, async (req, res) => {
      try {
         const paymentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Payment view privileges required.');
            return res.redirect('/payments');
         }

         // Get payment details from service
         const payment = await paymentService.getPaymentById(paymentId, req.tenant?.code);

         if (!payment) {
            req.flash('error', 'Payment not found.');
            return res.redirect('/payments');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Payment Management', url: '/payments' },
            { title: `Payment #${payment.receipt_number}`, url: `/payments/${paymentId}` },
         ];

         res.render('pages/payments/detail', {
            title: `Payment #${payment.receipt_number}`,
            description: 'Payment transaction details and receipt',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/payments/${paymentId}`,
            payment: payment,
            breadcrumb: breadcrumb,
            canCancel: payment.status === 'PENDING' || payment.status === 'FAILED',
         });
      } catch (error) {
         logError(error, { context: 'payments detail GET', paymentId: req.params.id, tenant: req.tenant?.code });
         req.flash('error', 'Unable to load payment details. Please try again.');
         res.redirect('/payments');
      }
   });

   /**
    * @route POST /payments/:id/cancel
    * @desc Cancel payment
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/:id/cancel', requireAuth, async (req, res) => {
      try {
         const paymentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Payment cancellation privileges required.',
            });
         }

         const cancelData = {
            reason: req.body.reason || 'Cancelled by administrator',
            cancelled_by: req.session.user.id,
         };

         // Cancel payment using service
         const cancelledPayment = await paymentService.cancelPayment(paymentId, cancelData, req.tenant?.code);

         res.json({
            success: true,
            message: 'Payment has been cancelled successfully',
            payment: cancelledPayment,
         });
      } catch (error) {
         logError(error, { context: 'payments cancel POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('already') || error.message.includes('Only')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to cancel payment',
         });
      }
   });

   /**
    * @route GET /payments/:id/receipt
    * @desc Generate and download payment receipt
    * @access Private (School Admin, Trust Admin, Accounts, Students - own receipts)
    */
   router.get('/:id/receipt', requireAuth, async (req, res) => {
      try {
         const paymentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts', 'student'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Receipt download privileges required.');
            return res.redirect('/payments');
         }

         // Get receipt data from service
         const receipt = await paymentService.generateReceipt(paymentId, req.tenant?.code);

         // For students, check if they own this payment
         if (userType === 'student') {
            const payment = await paymentService.getPaymentById(paymentId, req.tenant?.code);
            if (payment.feeAssignment.student.id !== req.session.user.student_id) {
               req.flash('error', 'Access denied. You can only view your own receipts.');
               return res.redirect('/payments');
            }
         }

         res.render('pages/payments/receipt', {
            title: `Receipt #${receipt.receipt_number}`,
            description: 'Payment receipt for download or print',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/payments/${paymentId}/receipt`,
            receipt: receipt,
            layout: 'receipt', // Use a minimal layout for printing
         });
      } catch (error) {
         logError(error, { context: 'payments receipt GET', paymentId: req.params.id, tenant: req.tenant?.code });
         req.flash('error', 'Unable to generate receipt. Please try again.');
         res.redirect('/payments');
      }
   });

   /**
    * @route GET /payments/collect/:assignmentId
    * @desc Payment collection page for specific fee assignment
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/collect/:assignmentId', requireAuth, async (req, res) => {
      try {
         const assignmentId = req.params.assignmentId;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Payment collection privileges required.');
            return res.redirect('/dashboard');
         }

         // Get fee assignment details
         const assignment = await models.FeeAssignment.findOne({
            where: {
               id: assignmentId,
               ...(req.tenant?.code && { tenant_code: req.tenant.code }),
            },
            include: [
               {
                  model: models.Student,
                  as: 'student',
                  attributes: ['id', 'first_name', 'last_name', 'admission_number'],
               },
               {
                  model: models.FeeStructure,
                  as: 'feeStructure',
                  include: [
                     {
                        model: models.Class,
                        as: 'class',
                        attributes: ['id', 'name', 'standard'],
                     },
                     {
                        model: models.FeeComponent,
                        as: 'components',
                        attributes: ['id', 'name', 'amount', 'is_mandatory'],
                     },
                  ],
               },
               {
                  model: models.FeePayment,
                  as: 'payments',
                  where: { status: 'COMPLETED' },
                  required: false,
               },
            ],
         });

         if (!assignment) {
            req.flash('error', 'Fee assignment not found.');
            return res.redirect('/dashboard');
         }

         // Calculate payment status
         const totalPaid = assignment.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
         const remainingBalance = parseFloat(assignment.total_amount) - totalPaid;

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Payment Management', url: '/payments' },
            { title: 'Collect Payment', url: `/payments/collect/${assignmentId}` },
         ];

         res.render('pages/payments/collect', {
            title: 'Collect Payment',
            description: 'Process fee payment for student',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/payments/collect/${assignmentId}`,
            assignment: assignment,
            totalPaid: totalPaid,
            remainingBalance: remainingBalance,
            breadcrumb: breadcrumb,
            paymentMethods: [
               { value: 'CASH', label: 'Cash' },
               { value: 'CARD', label: 'Card' },
               { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
               { value: 'UPI', label: 'UPI' },
               { value: 'CHEQUE', label: 'Cheque' },
               { value: 'OTHER', label: 'Other' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'payments collect GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load payment collection page. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /payments/statistics
    * @desc Payment statistics and reports
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/statistics', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Payment statistics privileges required.');
            return res.redirect('/dashboard');
         }

         // Get date filters
         const filters = {
            date_from: req.query.date_from || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
            date_to: req.query.date_to || new Date().toISOString().split('T')[0],
         };

         // Get payment statistics
         const statistics = await paymentService.getPaymentStatistics(filters, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Payment Management', url: '/payments' },
            { title: 'Statistics', url: '/payments/statistics' },
         ];

         res.render('pages/payments/statistics', {
            title: 'Payment Statistics',
            description: 'Payment analytics and reports',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/payments/statistics',
            statistics: statistics,
            filters: filters,
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'payments statistics GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load payment statistics. Please try again.');
         res.redirect('/payments');
      }
   });

   return router;
};
