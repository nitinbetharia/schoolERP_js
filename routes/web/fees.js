const express = require('express');
const Joi = require('joi');
const { logError } = require('../../utils/logger');

/**
 * Fee Structure Management Routes
 * Complete fee structure and component management
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

   // Initialize fee service - will be created per request with tenant models
   const initFeeService = (tenantCode) => {
      const models = getTenantModels(tenantCode);
      const FeeService = require('../../services/FeeService');
      return new FeeService(models);
   };

   // Joi validation schemas
   const feeStructureSchema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().max(500).allow('').optional(),
      class_id: Joi.number().integer().positive().required(),
      academic_year: Joi.string()
         .pattern(/^\d{4}-\d{4}$/)
         .required(),
      is_active: Joi.boolean().default(true),
      components: Joi.array()
         .items(
            Joi.object({
               name: Joi.string().min(2).max(100).required(),
               description: Joi.string().max(500).allow('').optional(),
               amount: Joi.number().positive().precision(2).required(),
               is_mandatory: Joi.boolean().default(true),
               display_order: Joi.number().integer().positive().optional(),
            })
         )
         .min(1)
         .required(),
   });

   /**
    * @route GET /fees
    * @desc Fee structures listing and management page
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

         const feeService = initFeeService(req.tenant?.code);
         if (!feeService) {
            req.flash('error', 'Service initialization failed. Please try again.');
            return res.redirect('/dashboard');
         }

         // Get filters and pagination
         const filters = {
            class_id: req.query.class_id || '',
            academic_year: req.query.academic_year || '',
            is_active: req.query.is_active || '',
            search: req.query.search || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'created_at',
            sortOrder: req.query.sortOrder || 'DESC',
         };

         // Get fee structures from service
         const result = await feeService.getFeeStructures(filters, pagination, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Fee Structures', url: '/fees' },
         ];

         res.render('pages/fees/index', {
            title: 'Fee Structures',
            description: 'Manage fee structures and components',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees',
            feeStructures: result.feeStructures,
            filters: filters,
            pagination: result.pagination,
            breadcrumb: breadcrumb,
            canCreate: ['system', 'trust', 'school'].includes(userType),
            canEdit: ['system', 'trust', 'school'].includes(userType),
            canDelete: ['system', 'trust'].includes(userType),
         });
      } catch (error) {
         logError(error, { context: 'fees index GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load fee structures. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /fees/create
    * @desc Fee structure creation page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/create', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee creation privileges required.');
            return res.redirect('/fees');
         }

         const models = getTenantModels(req.tenant?.code);
         if (!models) {
            req.flash('error', 'Database connection failed. Please try again.');
            return res.redirect('/fees');
         }

         // Get classes for dropdown
         const classes = await models.Class.findAll({
            where: {
               is_active: true,
               ...(req.tenant?.code && { tenant_code: req.tenant.code }),
            },
            order: [
               ['standard', 'ASC'],
               ['name', 'ASC'],
            ],
            attributes: ['id', 'name', 'standard'],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Fee Structures', url: '/fees' },
            { title: 'Create Fee Structure', url: '/fees/create' },
         ];

         res.render('pages/fees/create', {
            title: 'Create Fee Structure',
            description: 'Create new fee structure with components',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fees/create',
            classes: classes,
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'fees create GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load fee creation page. Please try again.');
         res.redirect('/fees');
      }
   });

   /**
    * @route POST /fees
    * @desc Create new fee structure
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Fee creation privileges required.',
            });
         }

         // Validate fee structure data
         const { error, value } = feeStructureSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid fee structure data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const feeService = initFeeService(req.tenant?.code);
         if (!feeService) {
            return res.status(500).json({
               success: false,
               message: 'Service initialization failed',
            });
         }

         // Create fee structure using service
         const feeStructure = await feeService.createFeeStructure(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Fee structure created successfully',
            feeStructure: feeStructure,
         });
      } catch (error) {
         logError(error, { context: 'fees create POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('already exists') ? 400 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create fee structure',
         });
      }
   });

   return router;
};
