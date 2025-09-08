const express = require('express');
const { logError } = require('../../utils/logger');
const FeeService = require('../../services/FeeService');
const PaymentService = require('../../services/PaymentService');

/**
 * Financial Dashboard Routes
 * Complete financial overview and analytics
 * Phase 5 Implementation - Fee Management System
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth, models } = middleware;

   // Initialize services with models
   const feeService = new FeeService(models);
   const paymentService = new PaymentService(models);

   /**
    * @route GET /finance
    * @desc Financial management dashboard
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Financial management privileges required.');
            return res.redirect('/dashboard');
         }

         // Get current academic year or use query parameter
         const currentYear = new Date().getFullYear();
         const academicYear = req.query.academic_year || `${currentYear}-${currentYear + 1}`;

         // Get date filters for current month by default
         const now = new Date();
         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
         const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

         const dateFilters = {
            date_from: req.query.date_from || startOfMonth.toISOString().split('T')[0],
            date_to: req.query.date_to || endOfMonth.toISOString().split('T')[0],
            academic_year: academicYear,
         };

         // Get comprehensive financial data
         const [collectionStats, paymentStats, feeStats, recentPayments, pendingAssignments, overdueAssignments] =
            await Promise.all([
               // Collection statistics
               feeService.getCollectionStatistics(dateFilters, req.tenant?.code),

               // Payment statistics
               paymentService.getPaymentStatistics(dateFilters, req.tenant?.code),

               // Fee structure statistics
               feeService.getFeeStatistics(academicYear, req.tenant?.code),

               // Recent payments (last 10)
               paymentService.getPaymentHistory(
                  { ...dateFilters, status: 'COMPLETED' },
                  { page: 1, limit: 10, sortBy: 'payment_date', sortOrder: 'DESC' },
                  req.tenant?.code
               ),

               // Pending fee assignments
               feeService.getFeeAssignments(
                  { status: 'PENDING', academic_year: academicYear },
                  { page: 1, limit: 10, sortBy: 'due_date', sortOrder: 'ASC' },
                  req.tenant?.code
               ),

               // Overdue assignments
               feeService.getFeeAssignments(
                  { status: 'OVERDUE', academic_year: academicYear },
                  { page: 1, limit: 10, sortBy: 'due_date', sortOrder: 'ASC' },
                  req.tenant?.code
               ),
            ]);

         // Calculate key metrics
         const totalExpected = collectionStats.total_expected || 0;
         const totalCollected = collectionStats.total_collected || 0;
         const collectionPercentage = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(2) : 0;

         const dashboardData = {
            overview: {
               total_expected: totalExpected,
               total_collected: totalCollected,
               outstanding_amount: totalExpected - totalCollected,
               collection_percentage: collectionPercentage,
               total_students: collectionStats.total_students || 0,
               paid_students: collectionStats.paid_students || 0,
               pending_students: collectionStats.pending_students || 0,
            },
            payments: {
               today: paymentStats.today || { count: 0, amount: 0 },
               this_week: paymentStats.this_week || { count: 0, amount: 0 },
               this_month: paymentStats.this_month || { count: 0, amount: 0 },
               by_method: paymentStats.by_method || [],
            },
            fees: {
               total_structures: feeStats.total_structures || 0,
               active_structures: feeStats.active_structures || 0,
               total_assignments: feeStats.total_assignments || 0,
               component_breakdown: feeStats.component_breakdown || [],
            },
            recent: {
               payments: recentPayments.payments || [],
               pending_assignments: pendingAssignments.assignments || [],
               overdue_assignments: overdueAssignments.assignments || [],
            },
         };

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
         ];

         res.render('pages/finance/dashboard', {
            title: 'Financial Dashboard',
            description: 'Complete financial overview and management',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/admin/finance',
            dashboardData: dashboardData,
            dateFilters: dateFilters,
            academicYear: academicYear,
            breadcrumb: breadcrumb,
            quickActions: [
               { title: 'Fee Structures', url: '/fees', icon: 'fas fa-money-bill-wave' },
               { title: 'Fee Assignments', url: '/fee-assignments', icon: 'fas fa-user-plus' },
               { title: 'Payment Collection', url: '/payments', icon: 'fas fa-cash-register' },
               { title: 'Reports', url: '/admin/finance/reports', icon: 'fas fa-chart-bar' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'finance dashboard GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load financial dashboard. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /finance/reports
    * @desc Financial reports page
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/reports', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Financial reports privileges required.');
            return res.redirect('/admin/finance');
         }

         // Get report parameters
         const reportType = req.query.type || 'collection';
         const currentYear = new Date().getFullYear();
         const academicYear = req.query.academic_year || `${currentYear}-${currentYear + 1}`;

         const filters = {
            academic_year: academicYear,
            class_id: req.query.class_id || '',
            section_id: req.query.section_id || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            payment_method: req.query.payment_method || '',
            status: req.query.status || '',
         };

         let reportData = {};

         // Generate different types of reports
         switch (reportType) {
            case 'collection':
               reportData = await generateCollectionReport(filters, req.tenant?.code);
               break;
            case 'outstanding':
               reportData = await generateOutstandingReport(filters, req.tenant?.code);
               break;
            case 'payment_method':
               reportData = await generatePaymentMethodReport(filters, req.tenant?.code);
               break;
            case 'class_wise':
               reportData = await generateClassWiseReport(filters, req.tenant?.code);
               break;
            case 'fee_component':
               reportData = await generateFeeComponentReport(filters, req.tenant?.code);
               break;
            default:
               reportData = await generateCollectionReport(filters, req.tenant?.code);
         }

         // Get supporting data for filters
         const [classes, sections] = await Promise.all([
            models.Class.findAll({
               where: {
                  is_active: true,
                  ...(req.tenant?.code && { tenant_code: req.tenant.code }),
               },
               order: [
                  ['standard', 'ASC'],
                  ['name', 'ASC'],
               ],
               attributes: ['id', 'name', 'standard'],
            }),
            models.Section.findAll({
               where: {
                  is_active: true,
                  ...(req.tenant?.code && { tenant_code: req.tenant.code }),
               },
               order: [['name', 'ASC']],
               attributes: ['id', 'name'],
               include: [
                  {
                     model: models.Class,
                     as: 'class',
                     attributes: ['id', 'name', 'standard'],
                  },
               ],
            }),
         ]);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Reports', url: '/admin/finance/reports' },
         ];

         res.render('pages/finance/reports', {
            title: 'Financial Reports',
            description: 'Comprehensive financial analytics and reports',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/admin/finance/reports',
            reportData: reportData,
            reportType: reportType,
            filters: filters,
            classes: classes,
            sections: sections,
            breadcrumb: breadcrumb,
            reportTypes: [
               { value: 'collection', label: 'Collection Report' },
               { value: 'outstanding', label: 'Outstanding Fees' },
               { value: 'payment_method', label: 'Payment Methods' },
               { value: 'class_wise', label: 'Class-wise Analysis' },
               { value: 'fee_component', label: 'Fee Components' },
            ],
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
         logError(error, { context: 'finance reports GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load financial reports. Please try again.');
         res.redirect('/admin/finance');
      }
   });

   /**
    * @route GET /finance/export/:type
    * @desc Export financial data
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/export/:type', requireAuth, async (req, res) => {
      try {
         const exportType = req.params.type;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Export privileges required.',
            });
         }

         const filters = {
            academic_year: req.query.academic_year || '',
            class_id: req.query.class_id || '',
            section_id: req.query.section_id || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            status: req.query.status || '',
         };

         let exportData;
         let filename;

         switch (exportType) {
            case 'fee-assignments':
               exportData = await feeService.exportFeeAssignments(filters, req.tenant?.code);
               filename = `fee-assignments-${Date.now()}.csv`;
               break;
            case 'payment-history':
               exportData = await paymentService.exportPaymentHistory(filters, req.tenant?.code);
               filename = `payment-history-${Date.now()}.csv`;
               break;
            case 'outstanding-fees':
               exportData = await feeService.exportOutstandingFees(filters, req.tenant?.code);
               filename = `outstanding-fees-${Date.now()}.csv`;
               break;
            case 'collection-summary':
               exportData = await feeService.exportCollectionSummary(filters, req.tenant?.code);
               filename = `collection-summary-${Date.now()}.csv`;
               break;
            default:
               return res.status(400).json({
                  success: false,
                  message: 'Invalid export type',
               });
         }

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
         res.send(exportData);
      } catch (error) {
         logError(error, { context: 'finance export GET', tenant: req.tenant?.code });
         res.status(500).json({
            success: false,
            message: 'Failed to export data',
         });
      }
   });

   // Helper functions for report generation
   async function generateCollectionReport(filters, tenantCode) {
      const collectionStats = await feeService.getCollectionStatistics(filters, tenantCode);
      const paymentStats = await paymentService.getPaymentStatistics(filters, tenantCode);

      return {
         title: 'Fee Collection Report',
         summary: collectionStats,
         payments: paymentStats,
         charts: {
            collection_trend: await getCollectionTrend(filters, tenantCode),
            payment_methods: paymentStats.by_method || [],
         },
      };
   }

   async function generateOutstandingReport(filters, tenantCode) {
      const outstandingData = await feeService.getOutstandingFees(filters, tenantCode);

      return {
         title: 'Outstanding Fees Report',
         summary: {
            total_outstanding: outstandingData.total_amount || 0,
            overdue_count: outstandingData.overdue_count || 0,
            pending_count: outstandingData.pending_count || 0,
         },
         details: outstandingData.assignments || [],
         charts: {
            overdue_trend: await getOverdueTrend(filters, tenantCode),
         },
      };
   }

   async function generatePaymentMethodReport(filters, tenantCode) {
      const paymentStats = await paymentService.getPaymentStatistics(filters, tenantCode);

      return {
         title: 'Payment Methods Report',
         by_method: paymentStats.by_method || [],
         charts: {
            method_distribution: paymentStats.by_method || [],
         },
      };
   }

   async function generateClassWiseReport(filters, tenantCode) {
      const classWiseData = await feeService.getClassWiseStatistics(filters, tenantCode);

      return {
         title: 'Class-wise Collection Report',
         by_class: classWiseData,
         charts: {
            class_performance: classWiseData,
         },
      };
   }

   async function generateFeeComponentReport(filters, tenantCode) {
      const componentStats = await feeService.getFeeComponentStatistics(filters, tenantCode);

      return {
         title: 'Fee Components Report',
         components: componentStats,
         charts: {
            component_breakdown: componentStats,
         },
      };
   }

   async function getCollectionTrend(filters, tenantCode) {
      // Implementation for collection trend chart data
      // This would fetch daily/weekly/monthly collection data
      return [];
   }

   async function getOverdueTrend(filters, tenantCode) {
      // Implementation for overdue trend chart data
      return [];
   }

   return router;
};
