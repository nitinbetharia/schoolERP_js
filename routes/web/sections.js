const express = require('express');
const Joi = require('joi');
const { logError } = require('../../utils/logger');

/**
 * Sections Management Routes
 * Basic sections functionality
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth } = middleware;

   // Helper to get tenant models
   const getTenantModels = (tenantCode) => {
      if (!tenantCode) {
         return null;
      }

      const { dbManager } = require('../../models/system/database');
      const tenantDB = dbManager.getTenantDatabase(tenantCode);
      return tenantDB ? tenantDB.models : null;
   };

   // Sections list page
   router.get('/', requireAuth, async (req, res) => {
      try {
         const models = getTenantModels(req.tenant?.code);
         if (!models) {
            return res.status(500).render('error', {
               title: 'Database Error',
               message: 'Unable to connect to tenant database',
            });
         }

         // Get sections with class information
         const sections = await models.Section.findAll({
            include: [
               {
                  model: models.Class,
                  as: 'class',
                  attributes: ['id', 'name', 'standard'],
               },
            ],
            order: [['name', 'ASC']],
         });

         // Get classes for dropdown
         const classes = await models.Class.findAll({
            attributes: ['id', 'name', 'standard'],
            order: [
               ['standard', 'ASC'],
               ['name', 'ASC'],
            ],
         });

         res.render('pages/admin/sections/list', {
            title: 'Sections Management',
            user: req.session.user,
            tenant: req.tenant,
            sections: sections || [],
            classes: classes || [],
         });
      } catch (error) {
         logError(error, { context: 'sections list' });
         res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load sections',
         });
      }
   });

   // Create section
   router.post('/', requireAuth, async (req, res) => {
      try {
         const models = getTenantModels(req.tenant?.code);
         if (!models) {
            return res.status(500).json({
               success: false,
               error: 'Unable to connect to tenant database',
            });
         }

         const schema = Joi.object({
            name: Joi.string().min(1).max(50).required(),
            class_id: Joi.number().integer().positive().required(),
            capacity: Joi.number().integer().min(1).max(100).optional().allow(''),
            description: Joi.string().max(255).optional().allow(''),
         });

         const { error, value } = schema.validate(req.body);
         if (error) {
            return res.status(400).json({
               success: false,
               error: error.details[0].message,
            });
         }

         const newSection = await models.Section.create(value);

         res.json({
            success: true,
            message: 'Section created successfully',
            section: newSection,
         });
      } catch (error) {
         logError(error, { context: 'create section' });
         res.status(500).json({
            success: false,
            error: 'Failed to create section',
         });
      }
   });

   return router;
};
