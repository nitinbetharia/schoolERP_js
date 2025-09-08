const express = require('express');
const Joi = require('joi');
const { logError } = require('../../utils/logger');
const FeeService = require('../../services/FeeService');

/**
 * Fee Assignment Management Routes
 * Handles bulk and individual student fee assignments
 * Phase 5 Implementation - Fee Management System
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth, models } = middleware;

   // Initialize fee service with models
   const feeService = new FeeService(models);

   // Joi validation schemas
   const bulkAssignSchema = Joi.object({
      fee_structure_id: Joi.number().integer().positive().required(),
      criteria: Joi.object({
         class_id: Joi.number().integer().positive().optional(),
         section_id: Joi.number().integer().positive().optional(),
         student_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
         academic_year: Joi.string()
            .pattern(/^\d{4}-\d{4}$/)
            .optional(),
         filter_type: Joi.string().valid('all', 'class', 'section', 'individual').required(),
      }).required(),
      assignment_date: Joi.date().optional(),
      due_date: Joi.date().min('now').optional(),
   });

   const individualAssignSchema = Joi.object({
      student_id: Joi.number().integer().positive().required(),
      fee_structure_id: Joi.number().integer().positive().required(),
      assignment_date: Joi.date().optional(),
      due_date: Joi.date().min('now').optional(),
      custom_amount: Joi.number().positive().precision(2).optional(),
      component_overrides: Joi.array()
         .items(
            Joi.object({
               component_id: Joi.number().integer().positive().required(),
               amount: Joi.number().positive().precision(2).required(),
            })
         )
         .optional(),
   });

   /**
    * @route GET /fee-assignments
    * @desc Fee assignment management page
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee assignment privileges required.');
            return res.redirect('/dashboard');
         }

         // Get filters and pagination
         const filters = {
            class_id: req.query.class_id || '',
            section_id: req.query.section_id || '',
            fee_structure_id: req.query.fee_structure_id || '',
            status: req.query.status || '',
            academic_year: req.query.academic_year || '',
            search: req.query.search || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'created_at',
            sortOrder: req.query.sortOrder || 'DESC',
         };

         // Get fee assignments from service
         const result = await feeService.getFeeAssignments(filters, pagination, req.tenant?.code);

         // Get supporting data
         const [classes, feeStructures] = await Promise.all([
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
            models.FeeStructure.findAll({
               where: {
                  is_active: true,
                  ...(req.tenant?.code && { tenant_code: req.tenant.code }),
               },
               order: [['created_at', 'DESC']],
               attributes: ['id', 'name', 'academic_year'],
               include: [
                  {
                     model: models.Class,
                     as: 'class',
                     attributes: ['name', 'standard'],
                  },
               ],
            }),
         ]);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Fee Assignments', url: '/fee-assignments' },
         ];

         res.render('pages/fee-assignments/index', {
            title: 'Fee Assignments',
            description: 'Manage student fee assignments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fee-assignments',
            assignments: result.assignments,
            filters: filters,
            pagination: result.pagination,
            classes: classes,
            feeStructures: feeStructures,
            breadcrumb: breadcrumb,
            statuses: [
               { value: 'PENDING', label: 'Pending' },
               { value: 'PARTIAL', label: 'Partially Paid' },
               { value: 'PAID', label: 'Paid' },
               { value: 'OVERDUE', label: 'Overdue' },
               { value: 'CANCELLED', label: 'Cancelled' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments index GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load fee assignments. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /fee-assignments/bulk
    * @desc Bulk fee assignment page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/bulk', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk assignment privileges required.');
            return res.redirect('/fee-assignments');
         }

         // Get supporting data
         const [classes, feeStructures, sections] = await Promise.all([
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
            models.FeeStructure.findAll({
               where: {
                  is_active: true,
                  ...(req.tenant?.code && { tenant_code: req.tenant.code }),
               },
               order: [['created_at', 'DESC']],
               include: [
                  {
                     model: models.Class,
                     as: 'class',
                     attributes: ['name', 'standard'],
                  },
                  {
                     model: models.FeeComponent,
                     as: 'components',
                     attributes: ['id', 'name', 'amount', 'is_mandatory'],
                  },
               ],
            }),
            models.Section.findAll({
               where: {
                  is_active: true,
                  ...(req.tenant?.code && { tenant_code: req.tenant.code }),
               },
               order: [['name', 'ASC']],
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
            { title: 'Fee Assignments', url: '/fee-assignments' },
            { title: 'Bulk Assignment', url: '/fee-assignments/bulk' },
         ];

         res.render('pages/fee-assignments/bulk', {
            title: 'Bulk Fee Assignment',
            description: 'Assign fees to multiple students at once',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fee-assignments/bulk',
            classes: classes,
            sections: sections,
            feeStructures: feeStructures,
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments bulk GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load bulk assignment page. Please try again.');
         res.redirect('/fee-assignments');
      }
   });

   /**
    * @route POST /fee-assignments/bulk
    * @desc Process bulk fee assignment
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/bulk', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Bulk assignment privileges required.',
            });
         }

         // Validate bulk assignment data
         const { error, value } = bulkAssignSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid assignment data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         // Process bulk assignment using service
         const result = await feeService.bulkAssignFees(value, req.tenant?.code);

         res.json({
            success: true,
            message: `Successfully assigned fees to ${result.assigned_count} students`,
            assigned_count: result.assigned_count,
            failed_assignments: result.failed_assignments,
            details: result.details,
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments bulk POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found') ? 404 : 500;
         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to process bulk assignment',
         });
      }
   });

   /**
    * @route GET /fee-assignments/individual
    * @desc Individual fee assignment page
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.get('/individual', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Fee assignment privileges required.');
            return res.redirect('/fee-assignments');
         }

         const studentId = req.query.student_id;

         // Get supporting data
         const [feeStructures, student] = await Promise.all([
            models.FeeStructure.findAll({
               where: {
                  is_active: true,
                  ...(req.tenant?.code && { tenant_code: req.tenant.code }),
               },
               order: [['created_at', 'DESC']],
               include: [
                  {
                     model: models.Class,
                     as: 'class',
                     attributes: ['name', 'standard'],
                  },
                  {
                     model: models.FeeComponent,
                     as: 'components',
                     attributes: ['id', 'name', 'amount', 'is_mandatory'],
                  },
               ],
            }),
            studentId
               ? models.Student.findOne({
                    where: {
                       id: studentId,
                       ...(req.tenant?.code && { tenant_code: req.tenant.code }),
                    },
                    attributes: ['id', 'first_name', 'last_name', 'admission_number'],
                    include: [
                       {
                          model: models.Class,
                          as: 'class',
                          attributes: ['id', 'name', 'standard'],
                       },
                       {
                          model: models.Section,
                          as: 'section',
                          attributes: ['id', 'name'],
                       },
                    ],
                 })
               : null,
         ]);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Financial Management', url: '/admin/finance' },
            { title: 'Fee Assignments', url: '/fee-assignments' },
            { title: 'Individual Assignment', url: '/fee-assignments/individual' },
         ];

         res.render('pages/fee-assignments/individual', {
            title: 'Individual Fee Assignment',
            description: 'Assign fee to individual student with customization',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/fee-assignments/individual',
            feeStructures: feeStructures,
            student: student,
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments individual GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load individual assignment page. Please try again.');
         res.redirect('/fee-assignments');
      }
   });

   /**
    * @route POST /fee-assignments/individual
    * @desc Process individual fee assignment
    * @access Private (School Admin, Trust Admin, Accounts)
    */
   router.post('/individual', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'accounts'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Fee assignment privileges required.',
            });
         }

         // Validate assignment data
         const { error, value } = individualAssignSchema.validate(req.body, { abortEarly: false });
         if (error) {
            return res.status(400).json({
               success: false,
               message: 'Invalid assignment data',
               errors: error.details.map((detail) => detail.message),
            });
         }

         // Process individual assignment using service
         const result = await feeService.assignFeeToStudent(value, req.tenant?.code);

         res.json({
            success: true,
            message: 'Fee assigned successfully to student',
            assignment: result,
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments individual POST', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('already assigned')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to assign fee',
         });
      }
   });

   /**
    * @route GET /fee-assignments/preview
    * @desc Preview students that would be affected by bulk assignment
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/preview', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Preview privileges required.',
            });
         }

         const criteria = {
            filter_type: req.query.filter_type,
            class_id: req.query.class_id ? parseInt(req.query.class_id) : undefined,
            section_id: req.query.section_id ? parseInt(req.query.section_id) : undefined,
            student_ids: req.query.student_ids ? req.query.student_ids.split(',').map((id) => parseInt(id)) : undefined,
            academic_year: req.query.academic_year,
         };

         // Get preview data from service
         const preview = await feeService.previewBulkAssignment(criteria, req.tenant?.code);

         res.json({
            success: true,
            preview: preview,
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments preview GET', tenant: req.tenant?.code });
         res.status(500).json({
            success: false,
            message: 'Failed to generate preview',
         });
      }
   });

   /**
    * @route DELETE /fee-assignments/:id
    * @desc Cancel fee assignment
    * @access Private (School Admin, Trust Admin)
    */
   router.delete('/:id', requireAuth, async (req, res) => {
      try {
         const assignmentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Assignment cancellation privileges required.',
            });
         }

         // Cancel assignment using service
         await feeService.cancelFeeAssignment(assignmentId, req.tenant?.code);

         res.json({
            success: true,
            message: 'Fee assignment cancelled successfully',
         });
      } catch (error) {
         logError(error, { context: 'fee-assignments DELETE', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('cannot be cancelled')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to cancel assignment',
         });
      }
   });

   return router;
};
