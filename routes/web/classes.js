const express = require('express');
const Joi = require('joi');
const { logError } = require('../../utils/logger');

/**
 * Classes Management Routes
 * Handles CRUD operations for academic classes
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

   // Joi validation schema for class creation/update
   const classSchema = Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string().max(500).optional().allow(''),
      class_order: Joi.number().integer().min(1).max(12).required(),
      is_active: Joi.boolean().optional(),
   });

   /**
    * @route GET /admin/classes
    * @desc List all classes
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Class management privileges required.');
            return res.redirect('/dashboard');
         }

         const models = getTenantModels(req.tenant?.code);
         if (!models) {
            req.flash('error', 'Unable to access class data. Please try again.');
            return res.redirect('/dashboard');
         }

         // Get all classes with basic information
         const classes = await models.Class.findAll({
            where: {
               tenant_code: req.tenant?.code,
            },
            order: [
               ['class_order', 'ASC'],
               ['name', 'ASC'],
            ],
            attributes: ['id', 'name', 'description', 'class_order', 'is_active', 'created_at'],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Classes Management', url: '/admin/classes' },
         ];

         res.render('pages/admin/classes/index', {
            title: 'Classes Management',
            description: 'Manage academic classes and their settings',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/admin/classes',
            classes: classes || [],
            breadcrumb: breadcrumb,
            canCreate: ['system', 'trust', 'school'].includes(userType),
            canEdit: ['system', 'trust', 'school'].includes(userType),
         });
      } catch (error) {
         logError(error, { context: 'classes list GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load classes. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route POST /admin/classes
    * @desc Create new class
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Class creation privileges required.',
            });
         }

         // Validate input data
         const { error, value } = classSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid class data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         const models = getTenantModels(req.tenant?.code);
         if (!models) {
            return res.status(500).json({
               success: false,
               message: 'Unable to access database. Please try again.',
            });
         }

         // Check if class name already exists
         const existingClass = await models.Class.findOne({
            where: {
               name: value.name,
               tenant_code: req.tenant?.code,
            },
         });

         if (existingClass) {
            return res.status(400).json({
               success: false,
               message: 'A class with this name already exists',
            });
         }

         // Create the class
         const classData = {
            ...value,
            tenant_code: req.tenant?.code,
            created_by: req.session.user.id,
         };

         const newClass = await models.Class.create(classData);

         res.json({
            success: true,
            message: 'Class created successfully',
            class: {
               id: newClass.id,
               name: newClass.name,
               description: newClass.description,
               class_order: newClass.class_order,
            },
         });
      } catch (error) {
         logError(error, { context: 'classes create POST', tenant: req.tenant?.code });
         res.status(500).json({
            success: false,
            message: 'Failed to create class. Please try again.',
         });
      }
   });

   return router;
};
