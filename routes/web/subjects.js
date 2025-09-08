const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { logError } = require('../../utils/logger');
const SubjectsService = require('../../services/SubjectsService');

/**
 * Enhanced Subjects Management Routes
 * Complete subject lifecycle management with class assignments and teacher relationships
 * Phase 4 Implementation - Academic Structure Integration
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth, models } = middleware;

   // Initialize subjects service with models
   const subjectsService = new SubjectsService(models);

   // Configure multer for file uploads (CSV import)
   const upload = multer({
      dest: 'uploads/subjects/',
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
   const createSubjectSchema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      code: Joi.string().min(2).max(10).optional().allow(''),
      description: Joi.string().max(500).optional().allow(''),
      category: Joi.string().valid('CORE', 'ELECTIVE', 'CO_CURRICULAR', 'OPTIONAL').required(),
      credits: Joi.number().min(0).max(10).optional(),
      is_active: Joi.boolean().optional(),
      class_assignments: Joi.array()
         .items(
            Joi.object({
               class_id: Joi.number().integer().positive().required(),
               is_mandatory: Joi.boolean().optional(),
               hours_per_week: Joi.number().min(0).max(20).optional(),
               credits: Joi.number().min(0).max(10).optional(),
            })
         )
         .optional(),
   });

   const updateSubjectSchema = Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      code: Joi.string().min(2).max(10).optional().allow(''),
      description: Joi.string().max(500).optional().allow(''),
      category: Joi.string().valid('CORE', 'ELECTIVE', 'CO_CURRICULAR', 'OPTIONAL').optional(),
      credits: Joi.number().min(0).max(10).optional(),
      is_active: Joi.boolean().optional(),
      class_assignments: Joi.array()
         .items(
            Joi.object({
               class_id: Joi.number().integer().positive().required(),
               is_mandatory: Joi.boolean().optional(),
               hours_per_week: Joi.number().min(0).max(20).optional(),
               credits: Joi.number().min(0).max(10).optional(),
            })
         )
         .optional(),
   });

   /**
    * @route GET /subjects
    * @desc Enhanced subjects list page with advanced filtering
    * @access Private (School Admin, Trust Admin, Teachers)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges for subject management.');
            return res.redirect('/dashboard');
         }

         // Get filters and pagination
         const filters = {
            search: req.query.search || '',
            category: req.query.category || '',
            class_id: req.query.class_id || '',
            is_active: req.query.is_active || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'ASC',
         };

         // Get subjects data from service
         const { subjects, pagination: paginationData } = await subjectsService.getAllSubjects(
            filters,
            pagination,
            req.tenant?.code
         );

         // Get classes for filter dropdown
         const classes = await models.Class.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code'],
            order: [['name', 'ASC']],
         });

         // Get statistics
         const stats = await subjectsService.getSubjectsStatistics(req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Subjects', url: '/subjects' },
         ];

         res.render('pages/subjects/index', {
            title: 'Subjects Management',
            description: 'Manage subjects and class assignments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/subjects',
            subjects: subjects,
            classes: classes,
            filters: filters,
            pagination: paginationData,
            breadcrumb: breadcrumb,
            stats: stats,
            categories: ['CORE', 'ELECTIVE', 'CO_CURRICULAR', 'OPTIONAL'],
         });
      } catch (error) {
         logError(error, { context: 'subjects index GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load subjects. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /subjects/new
    * @desc New subject form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/new', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Subject creation privileges required.');
            return res.redirect('/subjects');
         }

         // Get classes for assignment dropdown
         const classes = await models.Class.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code', 'level'],
            order: [['name', 'ASC']],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Subjects', url: '/subjects' },
            { title: 'Add New Subject', url: '/subjects/new' },
         ];

         res.render('pages/subjects/new', {
            title: 'Add New Subject',
            description: 'Create a new subject and assign to classes',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/subjects/new',
            classes: classes,
            breadcrumb: breadcrumb,
            formData: {},
            errors: {},
            categories: [
               { value: 'CORE', label: 'Core Subject' },
               { value: 'ELECTIVE', label: 'Elective Subject' },
               { value: 'CO_CURRICULAR', label: 'Co-curricular Activity' },
               { value: 'OPTIONAL', label: 'Optional Subject' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'subjects new GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load subject creation form. Please try again.');
         res.redirect('/subjects');
      }
   });

   /**
    * @route POST /subjects
    * @desc Create new subject with enhanced validation
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Subject creation privileges required.');
            return res.redirect('/subjects');
         }

         // Validate request data
         const { error, value } = createSubjectSchema.validate(req.body, { abortEarly: false });
         if (error) {
            const validationErrors = {};
            error.details.forEach((detail) => {
               const field = detail.path.join('.');
               validationErrors[field] = detail.message;
            });

            // Reload form with errors
            const classes = await models.Class.findAll({
               where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
               attributes: ['id', 'name', 'code', 'level'],
               order: [['name', 'ASC']],
            });

            return res.render('pages/subjects/new', {
               title: 'Add New Subject',
               description: 'Create a new subject and assign to classes',
               user: req.session.user,
               tenant: req.tenant,
               userType: userType,
               currentPath: '/subjects/new',
               classes: classes,
               breadcrumb: [
                  { title: 'Dashboard', url: '/dashboard' },
                  { title: 'Subjects', url: '/subjects' },
                  { title: 'Add New Subject', url: '/subjects/new' },
               ],
               formData: req.body,
               errors: validationErrors,
               categories: [
                  { value: 'CORE', label: 'Core Subject' },
                  { value: 'ELECTIVE', label: 'Elective Subject' },
                  { value: 'CO_CURRICULAR', label: 'Co-curricular Activity' },
                  { value: 'OPTIONAL', label: 'Optional Subject' },
               ],
            });
         }

         // Create subject using service
         const subjectData = {
            ...value,
            tenant_code: req.tenant?.code,
            created_by: req.session.user.id,
         };

         const newSubject = await subjectsService.createSubject(subjectData, req.tenant?.code);

         const successMsg = `Subject "${newSubject.name}" has been created successfully!`;
         req.flash('success', successMsg);
         res.redirect(`/subjects/${newSubject.id}`);
      } catch (error) {
         logError(error, { context: 'subjects create POST', tenant: req.tenant?.code });

         if (error.message.includes('already exists')) {
            req.flash('error', error.message);
         } else {
            req.flash('error', 'Failed to create subject. Please check the form data and try again.');
         }
         res.redirect('/subjects/new');
      }
   });

   /**
    * @route GET /subjects/:id
    * @desc Enhanced subject detail page with comprehensive information
    * @access Private (School Admin, Trust Admin, Teachers)
    */
   router.get('/:id', requireAuth, async (req, res) => {
      try {
         const subjectId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges to view subject details.');
            return res.redirect('/subjects');
         }

         // Get subject details from service
         const subject = await subjectsService.getSubjectById(subjectId, req.tenant?.code);

         if (!subject) {
            req.flash('error', 'Subject not found.');
            return res.redirect('/subjects');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Subjects', url: '/subjects' },
            { title: subject.name, url: `/subjects/${subjectId}` },
         ];

         res.render('pages/subjects/detail', {
            title: `${subject.name} - Subject Details`,
            description: 'Subject information and assignments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/subjects/${subjectId}`,
            subject: subject,
            breadcrumb: breadcrumb,
            canEdit: ['system', 'trust', 'school'].includes(userType),
         });
      } catch (error) {
         const logContext = {
            context: 'subjects detail GET',
            subjectId: req.params.id,
            tenant: req.tenant?.code,
         };
         logError(error, logContext);
         req.flash('error', 'Unable to load subject details. Please try again.');
         res.redirect('/subjects');
      }
   });

   /**
    * @route GET /subjects/:id/edit
    * @desc Edit subject form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/:id/edit', requireAuth, async (req, res) => {
      try {
         const subjectId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Subject edit privileges required.');
            return res.redirect(`/subjects/${subjectId}`);
         }

         // Get subject data using service
         const subject = await subjectsService.getSubjectById(subjectId, req.tenant?.code);

         if (!subject) {
            req.flash('error', 'Subject not found.');
            return res.redirect('/subjects');
         }

         // Get classes for assignment dropdown
         const classes = await models.Class.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code', 'level'],
            order: [['name', 'ASC']],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Subjects', url: '/subjects' },
            { title: subject.name, url: `/subjects/${subjectId}` },
            { title: 'Edit', url: `/subjects/${subjectId}/edit` },
         ];

         res.render('pages/subjects/edit', {
            title: `Edit Subject - ${subject.name}`,
            description: 'Update subject information and assignments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/subjects/${subjectId}/edit`,
            subject: subject,
            classes: classes,
            breadcrumb: breadcrumb,
            formData: {
               ...subject.dataValues,
               class_assignments: subject.classes
                  ? subject.classes.map((cls) => ({
                       class_id: cls.id,
                       is_mandatory: cls.assignment?.is_mandatory || false,
                       hours_per_week: cls.assignment?.hours_per_week || 0,
                       credits: cls.assignment?.credits || 0,
                    }))
                  : [],
            },
            errors: {},
            categories: [
               { value: 'CORE', label: 'Core Subject' },
               { value: 'ELECTIVE', label: 'Elective Subject' },
               { value: 'CO_CURRICULAR', label: 'Co-curricular Activity' },
               { value: 'OPTIONAL', label: 'Optional Subject' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'subject edit GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load subject edit page. Please try again.');
         res.redirect('/subjects');
      }
   });

   /**
    * @route PUT /subjects/:id
    * @desc Update subject with enhanced validation
    * @access Private (School Admin, Trust Admin)
    */
   router.put('/:id', requireAuth, async (req, res) => {
      try {
         const subjectId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Subject edit privileges required.');
            return res.redirect(`/subjects/${subjectId}`);
         }

         // Validate request data
         const { error, value } = updateSubjectSchema.validate(req.body, { abortEarly: false });
         if (error) {
            const validationErrors = {};
            error.details.forEach((detail) => {
               const field = detail.path.join('.');
               validationErrors[field] = detail.message;
            });

            // Reload form with errors
            const subject = await subjectsService.getSubjectById(subjectId, req.tenant?.code);
            const classes = await models.Class.findAll({
               where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
               attributes: ['id', 'name', 'code', 'level'],
               order: [['name', 'ASC']],
            });

            return res.render('pages/subjects/edit', {
               title: `Edit Subject - ${subject.name}`,
               description: 'Update subject information and assignments',
               user: req.session.user,
               tenant: req.tenant,
               userType: userType,
               currentPath: `/subjects/${subjectId}/edit`,
               subject: subject,
               classes: classes,
               breadcrumb: [
                  { title: 'Dashboard', url: '/dashboard' },
                  { title: 'Subjects', url: '/subjects' },
                  { title: subject.name, url: `/subjects/${subjectId}` },
                  { title: 'Edit', url: `/subjects/${subjectId}/edit` },
               ],
               formData: req.body,
               errors: validationErrors,
               categories: [
                  { value: 'CORE', label: 'Core Subject' },
                  { value: 'ELECTIVE', label: 'Elective Subject' },
                  { value: 'CO_CURRICULAR', label: 'Co-curricular Activity' },
                  { value: 'OPTIONAL', label: 'Optional Subject' },
               ],
            });
         }

         // Update subject using service
         const updatedSubject = await subjectsService.updateSubject(subjectId, value, req.tenant?.code);

         const successMsg = `Subject "${updatedSubject.name}" has been updated successfully!`;
         req.flash('success', successMsg);
         res.redirect(`/subjects/${subjectId}`);
      } catch (error) {
         logError(error, { context: 'subjects update PUT', tenant: req.tenant?.code });

         if (error.message.includes('not found') || error.message.includes('already exists')) {
            req.flash('error', error.message);
         } else {
            req.flash('error', 'Failed to update subject. Please try again.');
         }
         res.redirect(`/subjects/${req.params.id}/edit`);
      }
   });

   /**
    * @route DELETE /subjects/:id
    * @desc Delete subject with validation
    * @access Private (School Admin, Trust Admin)
    */
   router.delete('/:id', requireAuth, async (req, res) => {
      try {
         const subjectId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Subject deletion privileges required.',
            });
         }

         // Delete subject using service
         await subjectsService.deleteSubject(subjectId, req.tenant?.code);

         res.json({
            success: true,
            message: 'Subject has been deleted successfully.',
         });
      } catch (error) {
         logError(error, { context: 'subjects delete DELETE', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('Cannot delete')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to delete subject.',
         });
      }
   });

   /**
    * @route GET /subjects/import
    * @desc Bulk subject import page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/import', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/subjects');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Subjects', url: '/subjects' },
            { title: 'Bulk Import', url: '/subjects/import' },
         ];

         res.render('pages/subjects/import', {
            title: 'Bulk Import Subjects',
            description: 'Import multiple subjects from CSV file',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/subjects/import',
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'subjects import GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load import page. Please try again.');
         res.redirect('/subjects');
      }
   });

   /**
    * @route POST /subjects/import
    * @desc Process bulk subject import
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/import', requireAuth, upload.single('csvFile'), async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/subjects');
         }

         if (!req.file) {
            req.flash('error', 'Please select a CSV file to import.');
            return res.redirect('/subjects/import');
         }

         // Process CSV import using service
         const result = await subjectsService.bulkImportFromCSV(req.file.path, req.tenant?.code, req.session.user.id);

         if (result.success) {
            const importMsg = `Successfully imported ${result.imported} subjects. `;
            const errorMsg = `${result.errors} errors.`;
            req.flash('success', importMsg + errorMsg);
         } else {
            req.flash('error', 'Import failed. Please check the CSV format and try again.');
         }

         res.redirect('/subjects');
      } catch (error) {
         logError(error, { context: 'subjects import POST', tenant: req.tenant?.code });
         req.flash('error', 'Import failed due to server error. Please try again.');
         res.redirect('/subjects/import');
      }
   });

   /**
    * @route GET /subjects/export
    * @desc Export subjects to CSV
    * @access Private (School Admin, Trust Admin, Teachers)
    */
   router.get('/export', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Export privileges required.');
            return res.redirect('/subjects');
         }

         // Get filters from query params
         const filters = {
            search: req.query.search || '',
            category: req.query.category || '',
            class_id: req.query.class_id || '',
            is_active: req.query.is_active || '',
         };

         // Export using service
         const csvData = await subjectsService.exportToCSV(filters, req.tenant?.code);

         const filename = `subjects_export_${new Date().toISOString().split('T')[0]}.csv`;

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
         res.send(csvData);
      } catch (error) {
         logError(error, { context: 'subjects export GET', tenant: req.tenant?.code });
         req.flash('error', 'Export failed. Please try again.');
         res.redirect('/subjects');
      }
   });

   return router;
};
