const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { logError } = require('../../utils/logger');

/**
 * Inventory Management Routes
 * Complete inventory operations including stock management, procurement, and asset tracking
 * Phase 7 Implementation - Inventory Management System
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

   // Initialize inventory service
   const initInventoryService = (tenantCode) => {
      const models = getTenantModels(tenantCode);
      const InventoryService = require('../../services/InventoryService');
      return new InventoryService(models);
   };

   // Configure multer for CSV uploads
   const upload = multer({
      dest: 'uploads/inventory/',
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
   const itemSchema = Joi.object({
      name: Joi.string().min(2).max(200).required(),
      description: Joi.string().max(1000).optional().allow(''),
      category: Joi.string().max(50).required(),
      subcategory: Joi.string().max(50).optional().allow(''),
      unit: Joi.string().max(20).optional().allow(''),
      minimum_stock: Joi.number().integer().min(0).optional(),
      maximum_stock: Joi.number().integer().min(0).optional(),
      current_stock: Joi.number().integer().min(0).required(),
      unit_price: Joi.number().positive().precision(2).optional(),
      supplier: Joi.string().max(100).optional().allow(''),
      location: Joi.string().max(100).optional().allow(''),
      brand: Joi.string().max(50).optional().allow(''),
      model: Joi.string().max(50).optional().allow(''),
      item_code: Joi.string().optional().allow(''),
   });

   const transactionSchema = Joi.object({
      item_id: Joi.number().integer().positive().required(),
      transaction_type: Joi.string()
         .valid(
            'STOCK_IN',
            'STOCK_OUT',
            'PURCHASE',
            'ISSUE',
            'TRANSFER_IN',
            'TRANSFER_OUT',
            'ADJUSTMENT_IN',
            'ADJUSTMENT_OUT',
            'DAMAGED',
            'LOST'
         )
         .required(),
      quantity: Joi.number().integer().positive().required(),
      unit_price: Joi.number().positive().precision(2).optional(),
      reference_type: Joi.string().max(50).optional().allow(''),
      reference_number: Joi.string().max(100).optional().allow(''),
      remarks: Joi.string().max(500).optional().allow(''),
      transaction_date: Joi.date().optional(),
   });

   /**
    * @route GET /inventory
    * @desc Inventory dashboard
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Inventory management privileges required.');
            return res.redirect('/dashboard');
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            req.flash('error', 'Inventory service initialization failed. Please try again.');
            return res.redirect('/dashboard');
         }

         // Get current date filters (last 30 days)
         const today = new Date();
         const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

         const filters = {
            date_from: thirtyDaysAgo.toISOString().split('T')[0],
            date_to: today.toISOString().split('T')[0],
         };

         // Get inventory statistics
         const statistics = await inventoryService.getInventoryStatistics(filters, req.tenant?.code);

         // Get recent transactions
         const recentTransactions = await inventoryService.getTransactions(
            {},
            { page: 1, limit: 10, sortBy: 'transaction_date', sortOrder: 'DESC' },
            req.tenant?.code
         );

         // Get low stock items
         const lowStockItems = await inventoryService.getAllItems(
            { low_stock_only: true },
            { page: 1, limit: 10, sortBy: 'current_stock', sortOrder: 'ASC' },
            req.tenant?.code
         );

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Inventory Management', url: '/inventory' },
         ];

         res.render('pages/inventory/dashboard', {
            title: 'Inventory Management',
            description: 'Complete inventory operations and stock management',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/inventory',
            statistics: statistics,
            recentTransactions: recentTransactions.transactions,
            lowStockItems: lowStockItems.items,
            breadcrumb: breadcrumb,
            quickActions: [
               { title: 'Item Catalog', url: '/inventory/items', icon: 'fas fa-boxes' },
               { title: 'Stock Transaction', url: '/inventory/transactions/create', icon: 'fas fa-exchange-alt' },
               {
                  title: 'Low Stock Alert',
                  url: '/inventory/items?low_stock_only=true',
                  icon: 'fas fa-exclamation-triangle',
               },
               { title: 'Reports', url: '/inventory/reports', icon: 'fas fa-chart-line' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'inventory dashboard GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load inventory dashboard. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /inventory/items
    * @desc Inventory items listing
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.get('/items', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Inventory access privileges required.');
            return res.redirect('/inventory');
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            req.flash('error', 'Inventory service initialization failed.');
            return res.redirect('/inventory');
         }

         // Get filters and pagination
         const filters = {
            search: req.query.search || '',
            category: req.query.category || '',
            subcategory: req.query.subcategory || '',
            status: req.query.status || '',
            location: req.query.location || '',
            low_stock_only: req.query.low_stock_only === 'true',
            supplier: req.query.supplier || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'ASC',
         };

         // Get items from service
         const result = await inventoryService.getAllItems(filters, pagination, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Inventory Management', url: '/inventory' },
            { title: 'Item Catalog', url: '/inventory/items' },
         ];

         res.render('pages/inventory/items/index', {
            title: 'Inventory Items',
            description: 'Browse and manage inventory item catalog',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/inventory/items',
            items: result.items,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            canCreate: ['system', 'trust', 'school', 'inventory_manager'].includes(userType),
            canEdit: ['system', 'trust', 'school', 'inventory_manager'].includes(userType),
            categories: [
               'FURNITURE',
               'ELECTRONICS',
               'STATIONERY',
               'SPORTS',
               'LABORATORY',
               'BOOKS',
               'CONSUMABLES',
               'MAINTENANCE',
               'GENERAL',
            ],
            stockStatuses: [
               { value: 'NORMAL', label: 'Normal', color: 'success' },
               { value: 'LOW_STOCK', label: 'Low Stock', color: 'warning' },
               { value: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'danger' },
               { value: 'OVERSTOCK', label: 'Overstock', color: 'info' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'inventory items GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load inventory items. Please try again.');
         res.redirect('/inventory');
      }
   });

   /**
    * @route GET /inventory/items/create
    * @desc Add new inventory item form
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.get('/items/create', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Item creation privileges required.');
            return res.redirect('/inventory/items');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Inventory Management', url: '/inventory' },
            { title: 'Item Catalog', url: '/inventory/items' },
            { title: 'Add New Item', url: '/inventory/items/create' },
         ];

         res.render('pages/inventory/items/create', {
            title: 'Add New Inventory Item',
            description: 'Add a new item to the inventory catalog',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/inventory/items/create',
            breadcrumb: breadcrumb,
            categories: [
               { value: 'FURNITURE', label: 'Furniture' },
               { value: 'ELECTRONICS', label: 'Electronics' },
               { value: 'STATIONERY', label: 'Stationery' },
               { value: 'SPORTS', label: 'Sports Equipment' },
               { value: 'LABORATORY', label: 'Laboratory Equipment' },
               { value: 'BOOKS', label: 'Books & References' },
               { value: 'CONSUMABLES', label: 'Consumables' },
               { value: 'MAINTENANCE', label: 'Maintenance Supplies' },
               { value: 'GENERAL', label: 'General Items' },
            ],
            units: [
               { value: 'PIECES', label: 'Pieces' },
               { value: 'KILOGRAMS', label: 'Kilograms' },
               { value: 'LITERS', label: 'Liters' },
               { value: 'METERS', label: 'Meters' },
               { value: 'BOXES', label: 'Boxes' },
               { value: 'PACKETS', label: 'Packets' },
               { value: 'SETS', label: 'Sets' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'inventory items create GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load item creation form. Please try again.');
         res.redirect('/inventory/items');
      }
   });

   /**
    * @route POST /inventory/items
    * @desc Create new inventory item
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.post('/items', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Item creation privileges required.',
            });
         }

         // Validate item data
         const { error, value } = itemSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid item data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            return res.status(500).json({
               success: false,
               message: 'Inventory service initialization failed',
            });
         }

         // Add created_by information
         value.created_by = req.session.user.id;

         // Create item using service
         const item = await inventoryService.createItem(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Inventory item created successfully',
            item: item,
         });
      } catch (error) {
         logError(error, { context: 'inventory items create POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('already exists') ? 400 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create inventory item',
         });
      }
   });

   /**
    * @route GET /inventory/transactions
    * @desc Inventory transactions listing
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.get('/transactions', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Transaction access privileges required.');
            return res.redirect('/inventory');
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            req.flash('error', 'Inventory service initialization failed.');
            return res.redirect('/inventory');
         }

         // Get filters and pagination
         const filters = {
            item_id: req.query.item_id || '',
            transaction_type: req.query.transaction_type || '',
            reference_type: req.query.reference_type || '',
            date_from: req.query.date_from || '',
            date_to: req.query.date_to || '',
            user_id: req.query.user_id || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'transaction_date',
            sortOrder: req.query.sortOrder || 'DESC',
         };

         // Get transactions from service
         const result = await inventoryService.getTransactions(filters, pagination, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Inventory Management', url: '/inventory' },
            { title: 'Transactions', url: '/inventory/transactions' },
         ];

         res.render('pages/inventory/transactions/index', {
            title: 'Inventory Transactions',
            description: 'View and manage inventory stock transactions',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/inventory/transactions',
            transactions: result.transactions,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            transactionTypes: [
               { value: 'STOCK_IN', label: 'Stock In', color: 'success' },
               { value: 'STOCK_OUT', label: 'Stock Out', color: 'danger' },
               { value: 'PURCHASE', label: 'Purchase', color: 'info' },
               { value: 'ISSUE', label: 'Issue', color: 'warning' },
               { value: 'TRANSFER_IN', label: 'Transfer In', color: 'success' },
               { value: 'TRANSFER_OUT', label: 'Transfer Out', color: 'warning' },
               { value: 'ADJUSTMENT_IN', label: 'Adjustment In', color: 'info' },
               { value: 'ADJUSTMENT_OUT', label: 'Adjustment Out', color: 'secondary' },
               { value: 'DAMAGED', label: 'Damaged', color: 'danger' },
               { value: 'LOST', label: 'Lost', color: 'dark' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'inventory transactions GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load inventory transactions. Please try again.');
         res.redirect('/inventory');
      }
   });

   /**
    * @route POST /inventory/transactions
    * @desc Create inventory transaction
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.post('/transactions', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Transaction creation privileges required.',
            });
         }

         // Validate transaction data
         const { error, value } = transactionSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid transaction data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            return res.status(500).json({
               success: false,
               message: 'Inventory service initialization failed',
            });
         }

         // Add user information
         value.user_id = req.session.user.id;

         // Create transaction using service
         const transaction = await inventoryService.createTransaction(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Inventory transaction created successfully',
            transaction: transaction,
         });
      } catch (error) {
         logError(error, { context: 'inventory transactions create POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('Insufficient stock') || error.message.includes('Invalid transaction type')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create transaction',
         });
      }
   });

   /**
    * @route POST /inventory/items/import
    * @desc Import items from CSV
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.post('/items/import', requireAuth, upload.single('csvFile'), async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Import privileges required.',
            });
         }

         if (!req.file) {
            return res.status(400).json({
               success: false,
               message: 'CSV file is required',
            });
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            return res.status(500).json({
               success: false,
               message: 'Inventory service initialization failed',
            });
         }

         // Import items from CSV
         const results = await inventoryService.importItemsFromCSV(req.file.path, req.tenant?.code);

         // Clean up uploaded file
         require('fs').unlinkSync(req.file.path);

         res.json({
            success: true,
            message: `Import completed. ${results.successful} items added successfully.`,
            results: results,
         });
      } catch (error) {
         logError(error, { context: 'inventory items import POST', tenant: req.tenant?.code });

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
            message: 'Failed to import inventory items',
         });
      }
   });

   /**
    * @route GET /inventory/export/items
    * @desc Export items to CSV
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.get('/export/items', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Export privileges required.',
            });
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            return res.status(500).json({
               success: false,
               message: 'Inventory service initialization failed',
            });
         }

         const filters = {
            category: req.query.category || '',
            status: req.query.status || '',
            location: req.query.location || '',
         };

         const csvData = await inventoryService.exportItemsToCSV(filters, req.tenant?.code);

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader('Content-Disposition', `attachment; filename="inventory-items-${Date.now()}.csv"`);
         res.send(csvData);
      } catch (error) {
         logError(error, { context: 'inventory items export GET', tenant: req.tenant?.code });
         res.status(500).json({
            success: false,
            message: 'Failed to export inventory items',
         });
      }
   });

   /**
    * @route GET /inventory/reports
    * @desc Inventory reports and analytics
    * @access Private (Inventory Manager, School Admin, Trust Admin)
    */
   router.get('/reports', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'inventory_manager'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Reports access privileges required.');
            return res.redirect('/inventory');
         }

         const inventoryService = initInventoryService(req.tenant?.code);
         if (!inventoryService) {
            req.flash('error', 'Inventory service initialization failed.');
            return res.redirect('/inventory');
         }

         // Get report filters
         const filters = {
            date_from:
               req.query.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date_to: req.query.date_to || new Date().toISOString().split('T')[0],
            category: req.query.category || '',
         };

         // Get comprehensive statistics
         const statistics = await inventoryService.getInventoryStatistics(filters, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Inventory Management', url: '/inventory' },
            { title: 'Reports', url: '/inventory/reports' },
         ];

         res.render('pages/inventory/reports', {
            title: 'Inventory Reports',
            description: 'Comprehensive inventory analytics and reports',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/inventory/reports',
            statistics: statistics,
            filters: filters,
            breadcrumb: breadcrumb,
            categories: [
               'FURNITURE',
               'ELECTRONICS',
               'STATIONERY',
               'SPORTS',
               'LABORATORY',
               'BOOKS',
               'CONSUMABLES',
               'MAINTENANCE',
               'GENERAL',
            ],
         });
      } catch (error) {
         logError(error, { context: 'inventory reports GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load inventory reports. Please try again.');
         res.redirect('/inventory');
      }
   });

   return router;
};
