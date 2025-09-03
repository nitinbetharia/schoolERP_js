const express = require('express');
const { logError } = require('../../utils/logger');

/**
 * Fee Management Routes
 * Core ERP functionality for fee structure and collection management
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   /**
    * @route GET /fees
    * @desc Fee management dashboard
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee management privileges required.');
            return res.redirect('/dashboard');
         }

         // Mock fee statistics
         const feeStats = {
            totalCollected: 125000,
            totalPending: 45000,
            totalOverdue: 15000,
            collectionRate: 87.5,
            studentsWithPendingFees: 23,
            studentsWithOverdueFees: 8,
         };

         const recentPayments = [
            {
               id: 1,
               studentName: 'John Doe',
               rollNumber: 'ST001',
               amount: 5000,
               paymentDate: '2024-01-15',
               feeType: 'Monthly Fee',
               status: 'Paid',
            },
            {
               id: 2,
               studentName: 'Jane Smith',
               rollNumber: 'ST002',
               amount: 7500,
               paymentDate: '2024-01-14',
               feeType: 'Admission Fee',
               status: 'Paid',
            },
         ];

         res.render('pages/fees/index', {
            title: 'Fee Management',
            description: 'Manage fee structure and collection',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees',
            feeStats,
            recentPayments,
         });
      } catch (error) {
         logError(error, { context: 'fees index GET' });
         req.flash('error', 'Unable to load fees dashboard');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /fees/structure
    * @desc Fee structure management page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/structure', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee structure management privileges required.');
            return res.redirect('/fees');
         }

         // Mock fee structure data
         const feeStructures = [
            {
               id: 1,
               class: '10th',
               feeType: 'Tuition Fee',
               amount: 5000,
               frequency: 'Monthly',
               dueDate: 5,
               status: 'Active',
            },
            {
               id: 2,
               class: '10th',
               feeType: 'Development Fee',
               amount: 1000,
               frequency: 'Quarterly',
               dueDate: 15,
               status: 'Active',
            },
            {
               id: 3,
               class: '9th',
               feeType: 'Tuition Fee',
               amount: 4500,
               frequency: 'Monthly',
               dueDate: 5,
               status: 'Active',
            },
         ];

         res.render('pages/fees/structure', {
            title: 'Fee Structure Management',
            description: 'Define and manage fee structures for different classes',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/structure',
            feeStructures,
         });
      } catch (error) {
         logError(error, { context: 'fee structure GET' });
         req.flash('error', 'Unable to load fee structure page');
         res.redirect('/fees');
      }
   });

   /**
    * @route GET /fees/collection
    * @desc Fee collection management page
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/collection', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee collection privileges required.');
            return res.redirect('/fees');
         }

         // Mock collection data
         const collections = [
            {
               id: 1,
               studentName: 'John Doe',
               rollNumber: 'ST001',
               class: '10th',
               section: 'A',
               totalDue: 5000,
               totalPaid: 5000,
               balance: 0,
               lastPayment: '2024-01-15',
               status: 'Paid',
            },
            {
               id: 2,
               studentName: 'Jane Smith',
               rollNumber: 'ST002',
               class: '10th',
               section: 'B',
               totalDue: 5000,
               totalPaid: 3000,
               balance: 2000,
               lastPayment: '2024-01-10',
               status: 'Pending',
            },
            {
               id: 3,
               studentName: 'Mike Johnson',
               rollNumber: 'ST003',
               class: '9th',
               section: 'A',
               totalDue: 4500,
               totalPaid: 0,
               balance: 4500,
               lastPayment: null,
               status: 'Overdue',
            },
         ];

         const filters = {
            search: req.query.search || '',
            class: req.query.class || '',
            status: req.query.status || 'All',
         };

         res.render('pages/fees/collection', {
            title: 'Fee Collection',
            description: 'Track and manage fee payments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/collection',
            collections,
            filters,
         });
      } catch (error) {
         logError(error, { context: 'fee collection GET' });
         req.flash('error', 'Unable to load fee collection page');
         res.redirect('/fees');
      }
   });

   /**
    * @route GET /fees/payment/:studentId
    * @desc Payment collection form for specific student
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/payment/:studentId', requireAuth, async (req, res) => {
      try {
         const studentId = req.params.studentId;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Payment collection privileges required.');
            return res.redirect('/fees/collection');
         }

         // Mock student and fee data
         const student = {
            id: studentId,
            firstName: 'John',
            lastName: 'Doe',
            rollNumber: 'ST001',
            class: '10th',
            section: 'A',
         };

         const feeDetails = [
            {
               id: 1,
               feeType: 'Tuition Fee',
               amount: 5000,
               dueDate: '2024-01-05',
               status: 'Pending',
            },
            {
               id: 2,
               feeType: 'Development Fee',
               amount: 1000,
               dueDate: '2024-01-15',
               status: 'Pending',
            },
         ];

         const totalDue = feeDetails.reduce((sum, fee) => sum + fee.amount, 0);

         res.render('pages/fees/payment', {
            title: `Fee Payment - ${student.firstName} ${student.lastName}`,
            description: 'Collect fee payment from student',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/fees/payment/${studentId}`,
            student,
            feeDetails,
            totalDue,
         });
      } catch (error) {
         logError(error, { context: 'fee payment form GET' });
         req.flash('error', 'Unable to load payment form');
         res.redirect('/fees/collection');
      }
   });

   /**
    * @route POST /fees/payment
    * @desc Process fee payment
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.post('/payment', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Payment processing privileges required.');
            return res.redirect('/fees/collection');
         }

         // TODO: Process payment logic here
         console.log('Payment processing data:', req.body);

         req.flash('success', 'Payment processed successfully!');
         res.redirect('/fees/collection');
      } catch (error) {
         logError(error, { context: 'fee payment POST' });
         req.flash('error', 'Failed to process payment');
         res.redirect('/fees/collection');
      }
   });

   /**
    * @route GET /fees/installments
    * @desc Installment management page
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/installments', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Installment management privileges required.');
            return res.redirect('/dashboard');
         }

         // Mock installment data
         const installmentData = {
            totalStudents: 150,
            studentsOnInstallments: 78,
            overdueInstallments: 12,
            upcomingInstallments: 25,
            installmentPlans: [
               {
                  id: 1,
                  studentName: 'John Doe',
                  rollNumber: 'ST001',
                  totalFee: 50000,
                  installments: 4,
                  paidInstallments: 2,
                  nextDueDate: '2024-02-15',
                  nextAmount: 12500,
                  status: 'active'
               },
               {
                  id: 2,
                  studentName: 'Jane Smith',
                  rollNumber: 'ST002',
                  totalFee: 45000,
                  installments: 3,
                  paidInstallments: 1,
                  nextDueDate: '2024-02-10',
                  nextAmount: 15000,
                  status: 'overdue'
               }
            ]
         };

         res.render('pages/fees/installments', {
            title: 'Fee Installments',
            description: 'Manage student fee installment plans',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/installments',
            installmentData,
         });
      } catch (error) {
         logError(error, { context: 'fee installments GET' });
         req.flash('error', 'Unable to load installment management');
         res.redirect('/fees');
      }
   });

   /**
    * @route POST /fees/installments/create
    * @desc Create installment plan for a student
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.post('/installments/create', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Installment creation privileges required.');
            return res.redirect('/fees/installments');
         }

         const { studentId, totalAmount, numberOfInstallments, startDate, penaltyRate } = req.body;

         // Calculate installment plan
         const installmentAmount = Math.ceil(totalAmount / numberOfInstallments);
         const dueDates = [];
         
         for (let i = 0; i < numberOfInstallments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDates.push(dueDate.toISOString().split('T')[0]);
         }

         // Here you would call the AdvancedFeeManagementService
         // const advancedFeeService = new AdvancedFeeManagementService();
         // await advancedFeeService.createInstallmentPlan(studentId, feeConfigId, {
         //    numberOfInstallments, installmentAmount, dueDates, penaltyRate
         // }, tenantDb);

         req.flash('success', `Installment plan created for ${numberOfInstallments} installments`);
         res.redirect('/fees/installments');
      } catch (error) {
         logError(error, { context: 'installment plan creation' });
         req.flash('error', 'Failed to create installment plan');
         res.redirect('/fees/installments');
      }
   });

   /**
    * @route GET /fees/advanced-reports
    * @desc Advanced fee analytics and reports
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/advanced-reports', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Advanced reports access required.');
            return res.redirect('/fees');
         }

         // Mock advanced analytics data
         const analyticsData = {
            collectionTrends: {
               labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
               collected: [450000, 520000, 480000, 550000, 500000, 530000],
               outstanding: [50000, 45000, 60000, 40000, 55000, 35000]
            },
            feeTypeBreakdown: {
               labels: ['Tuition Fee', 'Transport Fee', 'Library Fee', 'Lab Fee', 'Sports Fee'],
               data: [600000, 120000, 30000, 45000, 25000]
            },
            penaltyAnalysis: {
               totalPenalty: 15000,
               penaltyWaivedOff: 5000,
               penaltyCollected: 8000,
               outstandingPenalty: 2000
            },
            installmentAnalysis: {
               totalInstallmentPlans: 78,
               activeInstallments: 65,
               completedInstallments: 13,
               overdueInstallments: 12
            }
         };

         res.render('pages/fees/advanced-reports', {
            title: 'Advanced Fee Analytics',
            description: 'Comprehensive fee collection analytics and insights',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/advanced-reports',
            analyticsData,
         });
      } catch (error) {
         logError(error, { context: 'advanced fee reports GET' });
         req.flash('error', 'Unable to load advanced reports');
         res.redirect('/fees');
      }
   });

   /**
    * @route GET /fees/structure-setup
    * @desc Advanced fee structure setup
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/structure-setup', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee structure setup privileges required.');
            return res.redirect('/fees');
         }

         // Mock fee types and structure data
         const feeStructureData = {
            availableFeeTypes: [
               { id: 'tuition', name: 'Tuition Fee', mandatory: true },
               { id: 'transport', name: 'Transport Fee', mandatory: false },
               { id: 'library', name: 'Library Fee', mandatory: true },
               { id: 'lab', name: 'Laboratory Fee', mandatory: true },
               { id: 'sports', name: 'Sports Fee', mandatory: false },
               { id: 'exam', name: 'Examination Fee', mandatory: true },
               { id: 'development', name: 'Development Fee', mandatory: false }
            ],
            frequencyOptions: [
               { value: 'monthly', label: 'Monthly' },
               { value: 'quarterly', label: 'Quarterly' },
               { value: 'half-yearly', label: 'Half-Yearly' },
               { value: 'annual', label: 'Annual' }
            ],
            classes: [
               { id: 1, name: '10th Grade' },
               { id: 2, name: '9th Grade' },
               { id: 3, name: '8th Grade' }
            ]
         };

         res.render('pages/fees/structure-setup', {
            title: 'Fee Structure Setup',
            description: 'Configure advanced fee structures with multiple fee types',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/structure-setup',
            feeStructureData,
         });
      } catch (error) {
         logError(error, { context: 'fee structure setup GET' });
         req.flash('error', 'Unable to load fee structure setup');
         res.redirect('/fees');
      }
   });

   /**
    * @route POST /fees/structure-setup
    * @desc Save advanced fee structure
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/structure-setup', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee structure setup privileges required.');
            return res.redirect('/fees/structure-setup');
         }

         const { classId, academicYearId, feeTypes } = req.body;

         // Parse fee types from form data
         const parsedFeeTypes = JSON.parse(feeTypes);

         // Here you would call the AdvancedFeeManagementService
         // const advancedFeeService = new AdvancedFeeManagementService();
         // await advancedFeeService.generateAdvancedFeeStructure(
         //    classId, academicYearId, parsedFeeTypes, tenantDb
         // );

         req.flash('success', 'Advanced fee structure saved successfully');
         res.redirect('/fees/structure-setup');
      } catch (error) {
         logError(error, { context: 'fee structure setup POST' });
         req.flash('error', 'Failed to save fee structure');
         res.redirect('/fees/structure-setup');
      }
   });

   /**
    * @route GET /fees/reports
    * @desc Fee reports and analytics
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/reports', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee reports access required.');
            return res.redirect('/fees');
         }

         // Mock report data
         const reportData = {
            monthlyCollection: {
               labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
               data: [45000, 52000, 48000, 55000, 50000, 53000],
            },
            classWiseCollection: {
               labels: ['10th', '9th', '8th', '7th', '6th'],
               data: [25000, 22000, 20000, 18000, 15000],
            },
            paymentMethods: {
               labels: ['Cash', 'Online', 'Cheque', 'Bank Transfer'],
               data: [40, 35, 15, 10],
            },
         };

         res.render('pages/fees/reports', {
            title: 'Fee Reports',
            description: 'Fee collection analytics and reports',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/reports',
            reportData,
         });
      } catch (error) {
         logError(error, { context: 'fee reports GET' });
         req.flash('error', 'Unable to load fee reports');
         res.redirect('/fees');
      }
   });

   return router;
};
