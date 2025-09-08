const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { logError } = require('../../utils/logger');

/**
 * Library Management Routes
 * Complete library operations including book catalog, circulation, and member management
 * Phase 6 Implementation - Library Management System
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

   // Initialize library service
   const initLibraryService = (tenantCode) => {
      const models = getTenantModels(tenantCode);
      const LibraryService = require('../../services/LibraryService');
      return new LibraryService(models);
   };

   // Configure multer for CSV uploads
   const upload = multer({
      dest: 'uploads/library/',
      fileFilter: (req, file, cb) => {
         if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
         } else {
            cb(new Error('Only CSV files are allowed'), false);
         }
      },
      limits: {
         fileSize: 5 * 1024 * 1024, // 5MB limit
      },
   });

   // Joi validation schemas
   const bookSchema = Joi.object({
      title: Joi.string().min(2).max(200).required(),
      author: Joi.string().min(2).max(100).required(),
      isbn: Joi.string().optional().allow(''),
      publisher: Joi.string().max(100).optional().allow(''),
      publication_year: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional(),
      category: Joi.string().max(50).optional().allow(''),
      description: Joi.string().max(1000).optional().allow(''),
      total_copies: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().precision(2).optional(),
      language: Joi.string().max(50).optional().allow(''),
      accession_number: Joi.string().optional().allow(''),
   });

   const circulationSchema = Joi.object({
      book_id: Joi.number().integer().positive().required(),
      student_id: Joi.number().integer().positive().required(),
      issue_date: Joi.date().optional(),
      due_date: Joi.date().min('now').optional(),
      remarks: Joi.string().max(500).optional().allow(''),
   });

   /**
    * @route GET /library
    * @desc Library dashboard
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Library access privileges required.');
            return res.redirect('/dashboard');
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            req.flash('error', 'Library service initialization failed. Please try again.');
            return res.redirect('/dashboard');
         }

         // Get current date filters (last 30 days)
         const today = new Date();
         const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

         const filters = {
            date_from: thirtyDaysAgo.toISOString().split('T')[0],
            date_to: today.toISOString().split('T')[0],
         };

         // Get library statistics
         const statistics = await libraryService.getLibraryStatistics(filters, req.tenant?.code);

         // Get recent circulations
         const recentCirculations = await libraryService.getCirculationHistory(
            {},
            { page: 1, limit: 10, sortBy: 'issue_date', sortOrder: 'DESC' },
            req.tenant?.code
         );

         // Get overdue books
         const overdueCirculations = await libraryService.getCirculationHistory(
            { overdue_only: true },
            { page: 1, limit: 10, sortBy: 'due_date', sortOrder: 'ASC' },
            req.tenant?.code
         );

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Library Management', url: '/library' },
         ];

         res.render('pages/library/dashboard', {
            title: 'Library Management',
            description: 'Complete library operations and book management',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/library',
            statistics: statistics,
            recentCirculations: recentCirculations.circulations,
            overdueCirculations: overdueCirculations.circulations,
            breadcrumb: breadcrumb,
            quickActions: [
               { title: 'Book Catalog', url: '/library/books', icon: 'fas fa-book' },
               { title: 'Issue Book', url: '/library/circulation/issue', icon: 'fas fa-hand-holding' },
               { title: 'Return Book', url: '/library/circulation/return', icon: 'fas fa-undo' },
               { title: 'Reports', url: '/library/reports', icon: 'fas fa-chart-bar' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'library dashboard GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load library dashboard. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /library/books
    * @desc Book catalog listing
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.get('/books', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Library access privileges required.');
            return res.redirect('/library');
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            req.flash('error', 'Library service initialization failed.');
            return res.redirect('/library');
         }

         // Get filters and pagination
         const filters = {
            search: req.query.search || '',
            category: req.query.category || '',
            author: req.query.author || '',
            publisher: req.query.publisher || '',
            status: req.query.status || '',
            publication_year: req.query.publication_year || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'title',
            sortOrder: req.query.sortOrder || 'ASC',
         };

         // Get books from service
         const result = await libraryService.getAllBooks(filters, pagination, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Library Management', url: '/library' },
            { title: 'Book Catalog', url: '/library/books' },
         ];

         res.render('pages/library/books/index', {
            title: 'Book Catalog',
            description: 'Browse and manage library book collection',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/library/books',
            books: result.books,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            canCreate: ['system', 'trust', 'school', 'librarian'].includes(userType),
            canEdit: ['system', 'trust', 'school', 'librarian'].includes(userType),
            categories: [
               'FICTION',
               'NON_FICTION',
               'SCIENCE',
               'MATHEMATICS',
               'HISTORY',
               'GEOGRAPHY',
               'LITERATURE',
               'REFERENCE',
               'TEXTBOOK',
               'GENERAL',
            ],
         });
      } catch (error) {
         logError(error, { context: 'library books GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load book catalog. Please try again.');
         res.redirect('/library');
      }
   });

   /**
    * @route GET /library/books/create
    * @desc Add new book form
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.get('/books/create', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Book creation privileges required.');
            return res.redirect('/library/books');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Library Management', url: '/library' },
            { title: 'Book Catalog', url: '/library/books' },
            { title: 'Add New Book', url: '/library/books/create' },
         ];

         res.render('pages/library/books/create', {
            title: 'Add New Book',
            description: 'Add a new book to the library catalog',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/library/books/create',
            breadcrumb: breadcrumb,
            categories: [
               { value: 'FICTION', label: 'Fiction' },
               { value: 'NON_FICTION', label: 'Non-Fiction' },
               { value: 'SCIENCE', label: 'Science' },
               { value: 'MATHEMATICS', label: 'Mathematics' },
               { value: 'HISTORY', label: 'History' },
               { value: 'GEOGRAPHY', label: 'Geography' },
               { value: 'LITERATURE', label: 'Literature' },
               { value: 'REFERENCE', label: 'Reference' },
               { value: 'TEXTBOOK', label: 'Textbook' },
               { value: 'GENERAL', label: 'General' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'library books create GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load book creation form. Please try again.');
         res.redirect('/library/books');
      }
   });

   /**
    * @route POST /library/books
    * @desc Create new book
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.post('/books', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Book creation privileges required.',
            });
         }

         // Validate book data
         const { error, value } = bookSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid book data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            return res.status(500).json({
               success: false,
               message: 'Library service initialization failed',
            });
         }

         // Create book using service
         const book = await libraryService.createBook(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Book added to catalog successfully',
            book: book,
         });
      } catch (error) {
         logError(error, { context: 'library books create POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('already exists') ? 400 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create book',
         });
      }
   });

   /**
    * @route GET /library/circulation
    * @desc Circulation management
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.get('/circulation', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Circulation management privileges required.');
            return res.redirect('/library');
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            req.flash('error', 'Library service initialization failed.');
            return res.redirect('/library');
         }

         // Get filters and pagination
         const filters = {
            student_id: req.query.student_id || '',
            book_id: req.query.book_id || '',
            status: req.query.status || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            overdue_only: req.query.overdue_only === 'true',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'issue_date',
            sortOrder: req.query.sortOrder || 'DESC',
         };

         // Get circulation history
         const result = await libraryService.getCirculationHistory(filters, pagination, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Library Management', url: '/library' },
            { title: 'Circulation Management', url: '/library/circulation' },
         ];

         res.render('pages/library/circulation/index', {
            title: 'Circulation Management',
            description: 'Manage book issues and returns',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/library/circulation',
            circulations: result.circulations,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            statuses: [
               { value: 'ISSUED', label: 'Issued' },
               { value: 'RETURNED', label: 'Returned' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'library circulation GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load circulation management. Please try again.');
         res.redirect('/library');
      }
   });

   /**
    * @route POST /library/circulation/issue
    * @desc Issue book to student
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.post('/circulation/issue', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Book issue privileges required.',
            });
         }

         // Validate circulation data
         const { error, value } = circulationSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid circulation data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            return res.status(500).json({
               success: false,
               message: 'Library service initialization failed',
            });
         }

         // Add issued_by information
         value.issued_by = req.session.user.id;

         // Issue book using service
         const circulation = await libraryService.issueBook(value.book_id, value.student_id, value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Book issued successfully',
            circulation: circulation,
         });
      } catch (error) {
         logError(error, { context: 'library circulation issue POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('not available') ||
                error.message.includes('overdue') ||
                error.message.includes('limit')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to issue book',
         });
      }
   });

   /**
    * @route POST /library/circulation/:id/return
    * @desc Return book
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.post('/circulation/:id/return', requireAuth, async (req, res) => {
      try {
         const circulationId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Book return privileges required.',
            });
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            return res.status(500).json({
               success: false,
               message: 'Library service initialization failed',
            });
         }

         const returnData = {
            return_date: req.body.return_date || new Date(),
            condition: req.body.condition || 'GOOD',
            remarks: req.body.remarks || '',
            returned_by: req.session.user.id,
         };

         // Return book using service
         const circulation = await libraryService.returnBook(circulationId, returnData, req.tenant?.code);

         res.json({
            success: true,
            message: 'Book returned successfully',
            circulation: circulation,
            fine_amount: circulation.fine_amount || 0,
         });
      } catch (error) {
         logError(error, {
            context: 'library circulation return POST',
            circulationId: req.params.id,
            tenant: req.tenant?.code,
         });

         const statusCode = error.message.includes('not found') ? 404 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to return book',
         });
      }
   });

   /**
    * @route POST /library/books/import
    * @desc Import books from CSV
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.post('/books/import', requireAuth, upload.single('csvFile'), async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Book import privileges required.',
            });
         }

         if (!req.file) {
            return res.status(400).json({
               success: false,
               message: 'CSV file is required',
            });
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            return res.status(500).json({
               success: false,
               message: 'Library service initialization failed',
            });
         }

         // Import books from CSV
         const results = await libraryService.importBooksFromCSV(req.file.path, req.tenant?.code);

         // Clean up uploaded file
         require('fs').unlinkSync(req.file.path);

         res.json({
            success: true,
            message: `Import completed. ${results.successful} books added successfully.`,
            results: results,
         });
      } catch (error) {
         logError(error, { context: 'library books import POST', tenant: req.tenant?.code });

         // Clean up uploaded file on error
         if (req.file && req.file.path) {
            try {
               require('fs').unlinkSync(req.file.path);
            } catch (cleanupError) {
               logError(cleanupError, { context: 'file cleanup error' });
            }
         }

         res.status(500).json({
            success: false,
            message: 'Failed to import books',
         });
      }
   });

   /**
    * @route GET /library/export/books
    * @desc Export books to CSV
    * @access Private (Librarian, School Admin, Trust Admin)
    */
   router.get('/export/books', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'librarian'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Export privileges required.',
            });
         }

         const libraryService = initLibraryService(req.tenant?.code);
         if (!libraryService) {
            return res.status(500).json({
               success: false,
               message: 'Library service initialization failed',
            });
         }

         const filters = {
            category: req.query.category || '',
            status: req.query.status || '',
            author: req.query.author || '',
         };

         const csvData = await libraryService.exportBooksToCSV(filters, req.tenant?.code);

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader('Content-Disposition', `attachment; filename="books-${Date.now()}.csv"`);
         res.send(csvData);
      } catch (error) {
         logError(error, { context: 'library books export GET', tenant: req.tenant?.code });
         res.status(500).json({
            success: false,
            message: 'Failed to export books',
         });
      }
   });

   return router;
};
