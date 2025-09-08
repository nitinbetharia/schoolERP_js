const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { logError } = require('../../utils/logger');
const TeachersService = require('../../services/TeachersService');

/**
 * Enhanced Teachers Management Routes
 * Complete teacher lifecycle management with subject assignments and qualification tracking
 * Phase 4 Implementation - Academic Structure Integration
 */

module.exports = function (middleware) {
   const router = express.Router();
   const { requireAuth, models } = middleware;

   // Initialize teachers service with models
   const teachersService = new TeachersService(models);

   // Configure multer for file uploads (CSV import and document uploads)
   const upload = multer({
      dest: 'uploads/teachers/',
      fileFilter: (req, file, cb) => {
         if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
         } else if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
         } else {
            cb(new Error('Only CSV, image, and PDF files are allowed'), false);
         }
      },
      limits: {
         fileSize: 10 * 1024 * 1024, // 10MB limit
      },
   });

   // Joi validation schemas
   const createTeacherSchema = Joi.object({
      first_name: Joi.string().min(2).max(50).required(),
      last_name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .optional()
         .allow(''),
      employee_code: Joi.string().min(3).max(20).optional().allow(''),
      department: Joi.string().max(100).optional().allow(''),
      specialization: Joi.string().max(200).optional().allow(''),
      hire_date: Joi.date().optional(),
      employment_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'SUSPENDED').optional(),
      is_active: Joi.boolean().optional(),
      address: Joi.string().max(500).optional().allow(''),
      date_of_birth: Joi.date().optional(),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
      emergency_contact_name: Joi.string().max(100).optional().allow(''),
      emergency_contact_phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .optional()
         .allow(''),
      qualifications: Joi.array()
         .items(
            Joi.object({
               degree: Joi.string().max(100).required(),
               field: Joi.string().max(100).required(),
               institution: Joi.string().max(200).required(),
               year_completed: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),
               grade: Joi.string().max(20).optional().allow(''),
               level: Joi.string().valid('DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORATE').optional(),
            })
         )
         .optional(),
      subject_assignments: Joi.array()
         .items(
            Joi.object({
               subject_id: Joi.number().integer().positive().required(),
               is_primary: Joi.boolean().optional(),
               qualification_level: Joi.string().valid('QUALIFIED', 'HIGHLY_QUALIFIED', 'EXPERT').optional(),
            })
         )
         .optional(),
   });

   const updateTeacherSchema = Joi.object({
      first_name: Joi.string().min(2).max(50).optional(),
      last_name: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .optional()
         .allow(''),
      employee_code: Joi.string().min(3).max(20).optional().allow(''),
      department: Joi.string().max(100).optional().allow(''),
      specialization: Joi.string().max(200).optional().allow(''),
      employment_status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED', 'SUSPENDED').optional(),
      is_active: Joi.boolean().optional(),
      address: Joi.string().max(500).optional().allow(''),
      emergency_contact_name: Joi.string().max(100).optional().allow(''),
      emergency_contact_phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .optional()
         .allow(''),
      qualifications: Joi.array()
         .items(
            Joi.object({
               degree: Joi.string().max(100).required(),
               field: Joi.string().max(100).required(),
               institution: Joi.string().max(200).required(),
               year_completed: Joi.number().integer().min(1950).max(new Date().getFullYear()).required(),
               grade: Joi.string().max(20).optional().allow(''),
               level: Joi.string().valid('DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORATE').optional(),
            })
         )
         .optional(),
      subject_assignments: Joi.array()
         .items(
            Joi.object({
               subject_id: Joi.number().integer().positive().required(),
               is_primary: Joi.boolean().optional(),
               qualification_level: Joi.string().valid('QUALIFIED', 'HIGHLY_QUALIFIED', 'EXPERT').optional(),
            })
         )
         .optional(),
   });

   /**
    * @route GET /teachers
    * @desc Enhanced teachers list page with advanced filtering
    * @access Private (School Admin, Trust Admin, System Admin)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges for teacher management.');
            return res.redirect('/dashboard');
         }

         // Get filters and pagination
         const filters = {
            search: req.query.search || '',
            department: req.query.department || '',
            subject_id: req.query.subject_id || '',
            employment_status: req.query.employment_status || '',
            qualification_level: req.query.qualification_level || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'first_name',
            sortOrder: req.query.sortOrder || 'ASC',
         };

         // Get teachers data from service
         const { teachers, pagination: paginationData } = await teachersService.getAllTeachers(
            filters,
            pagination,
            req.tenant?.code
         );

         // Get subjects for filter dropdown
         const subjects = await models.Subject.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code'],
            order: [['name', 'ASC']],
         });

         // Get statistics
         const stats = await teachersService.getTeachersStatistics(req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Teachers', url: '/teachers' },
         ];

         res.render('pages/teachers/index', {
            title: 'Teachers Management',
            description: 'Manage teacher profiles and assignments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teachers',
            teachers: teachers,
            subjects: subjects,
            filters: filters,
            pagination: paginationData,
            breadcrumb: breadcrumb,
            stats: stats,
            departments: ['SCIENCE', 'MATHEMATICS', 'ENGLISH', 'SOCIAL_STUDIES', 'ARTS', 'PHYSICAL_EDUCATION'],
            employmentStatuses: ['ACTIVE', 'INACTIVE', 'TERMINATED', 'SUSPENDED'],
            qualificationLevels: ['QUALIFIED', 'HIGHLY_QUALIFIED', 'EXPERT'],
         });
      } catch (error) {
         logError(error, { context: 'teachers index GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load teachers. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /teachers/new
    * @desc New teacher form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/new', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher creation privileges required.');
            return res.redirect('/teachers');
         }

         // Get subjects for assignment dropdown
         const subjects = await models.Subject.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code', 'category'],
            order: [['name', 'ASC']],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Teachers', url: '/teachers' },
            { title: 'Add New Teacher', url: '/teachers/new' },
         ];

         res.render('pages/teachers/new', {
            title: 'Add New Teacher',
            description: 'Create a new teacher profile and assign subjects',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teachers/new',
            subjects: subjects,
            breadcrumb: breadcrumb,
            formData: {},
            errors: {},
            departments: [
               { value: 'SCIENCE', label: 'Science' },
               { value: 'MATHEMATICS', label: 'Mathematics' },
               { value: 'ENGLISH', label: 'English' },
               { value: 'SOCIAL_STUDIES', label: 'Social Studies' },
               { value: 'ARTS', label: 'Arts' },
               { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' },
               { value: 'OTHER', label: 'Other' },
            ],
            qualificationLevels: [
               { value: 'DIPLOMA', label: 'Diploma' },
               { value: 'UNDERGRADUATE', label: 'Undergraduate' },
               { value: 'POSTGRADUATE', label: 'Postgraduate' },
               { value: 'DOCTORATE', label: 'Doctorate' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'teachers new GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load teacher creation form. Please try again.');
         res.redirect('/teachers');
      }
   });

   /**
    * @route POST /teachers
    * @desc Create new teacher with enhanced validation
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher creation privileges required.');
            return res.redirect('/teachers');
         }

         // Validate request data
         const { error, value } = createTeacherSchema.validate(req.body, { abortEarly: false });
         if (error) {
            const validationErrors = {};
            error.details.forEach((detail) => {
               const field = detail.path.join('.');
               validationErrors[field] = detail.message;
            });

            // Reload form with errors
            const subjects = await models.Subject.findAll({
               where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
               attributes: ['id', 'name', 'code', 'category'],
               order: [['name', 'ASC']],
            });

            return res.render('pages/teachers/new', {
               title: 'Add New Teacher',
               description: 'Create a new teacher profile and assign subjects',
               user: req.session.user,
               tenant: req.tenant,
               userType: userType,
               currentPath: '/teachers/new',
               subjects: subjects,
               breadcrumb: [
                  { title: 'Dashboard', url: '/dashboard' },
                  { title: 'Teachers', url: '/teachers' },
                  { title: 'Add New Teacher', url: '/teachers/new' },
               ],
               formData: req.body,
               errors: validationErrors,
               departments: [
                  { value: 'SCIENCE', label: 'Science' },
                  { value: 'MATHEMATICS', label: 'Mathematics' },
                  { value: 'ENGLISH', label: 'English' },
                  { value: 'SOCIAL_STUDIES', label: 'Social Studies' },
                  { value: 'ARTS', label: 'Arts' },
                  { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' },
                  { value: 'OTHER', label: 'Other' },
               ],
               qualificationLevels: [
                  { value: 'DIPLOMA', label: 'Diploma' },
                  { value: 'UNDERGRADUATE', label: 'Undergraduate' },
                  { value: 'POSTGRADUATE', label: 'Postgraduate' },
                  { value: 'DOCTORATE', label: 'Doctorate' },
               ],
            });
         }

         // Create teacher using service
         const teacherData = {
            ...value,
            tenant_code: req.tenant?.code,
            created_by: req.session.user.id,
         };

         const newTeacher = await teachersService.createTeacher(teacherData, req.tenant?.code);

         const successMsg = `Teacher ${newTeacher.first_name} ${newTeacher.last_name} has been created successfully!`;
         req.flash('success', successMsg);
         res.redirect(`/teachers/${newTeacher.id}`);
      } catch (error) {
         logError(error, { context: 'teachers create POST', tenant: req.tenant?.code });

         if (error.message.includes('already exists')) {
            req.flash('error', error.message);
         } else {
            req.flash('error', 'Failed to create teacher. Please check the form data and try again.');
         }
         res.redirect('/teachers/new');
      }
   });

   /**
    * @route GET /teachers/:id
    * @desc Enhanced teacher profile page with comprehensive information
    * @access Private (School Admin, Trust Admin, Teachers - own profile)
    */
   router.get('/:id', requireAuth, async (req, res) => {
      try {
         const teacherId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges to view teacher details.');
            return res.redirect('/teachers');
         }

         // Teachers can only view their own profile unless they're admin
         if (userType === 'teacher' && req.session.user.id !== parseInt(teacherId)) {
            req.flash('error', 'Access denied. You can only view your own profile.');
            return res.redirect('/dashboard');
         }

         // Get teacher details from service
         const teacher = await teachersService.getTeacherById(teacherId, req.tenant?.code);

         if (!teacher) {
            req.flash('error', 'Teacher not found.');
            return res.redirect('/teachers');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Teachers', url: '/teachers' },
            { title: `${teacher.first_name} ${teacher.last_name}`, url: `/teachers/${teacherId}` },
         ];

         res.render('pages/teachers/detail', {
            title: `${teacher.first_name} ${teacher.last_name} - Teacher Profile`,
            description: 'Teacher profile and assignment information',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/teachers/${teacherId}`,
            teacher: teacher,
            breadcrumb: breadcrumb,
            canEdit:
               ['system', 'trust', 'school'].includes(userType) ||
               (userType === 'teacher' && req.session.user.id === parseInt(teacherId)),
         });
      } catch (error) {
         const logContext = {
            context: 'teachers detail GET',
            teacherId: req.params.id,
            tenant: req.tenant?.code,
         };
         logError(error, logContext);
         req.flash('error', 'Unable to load teacher details. Please try again.');
         res.redirect('/teachers');
      }
   });

   /**
    * @route GET /teachers/:id/edit
    * @desc Edit teacher form page
    * @access Private (School Admin, Trust Admin, Teachers - own profile)
    */
   router.get('/:id/edit', requireAuth, async (req, res) => {
      try {
         const teacherId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher edit privileges required.');
            return res.redirect(`/teachers/${teacherId}`);
         }

         // Teachers can only edit their own profile unless they're admin
         if (userType === 'teacher' && req.session.user.id !== parseInt(teacherId)) {
            req.flash('error', 'Access denied. You can only edit your own profile.');
            return res.redirect(`/teachers/${teacherId}`);
         }

         // Get teacher data using service
         const teacher = await teachersService.getTeacherById(teacherId, req.tenant?.code);

         if (!teacher) {
            req.flash('error', 'Teacher not found.');
            return res.redirect('/teachers');
         }

         // Get subjects for assignment dropdown
         const subjects = await models.Subject.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code', 'category'],
            order: [['name', 'ASC']],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Teachers', url: '/teachers' },
            { title: `${teacher.first_name} ${teacher.last_name}`, url: `/teachers/${teacherId}` },
            { title: 'Edit', url: `/teachers/${teacherId}/edit` },
         ];

         res.render('pages/teachers/edit', {
            title: `Edit Teacher - ${teacher.first_name} ${teacher.last_name}`,
            description: 'Update teacher information and assignments',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/teachers/${teacherId}/edit`,
            teacher: teacher,
            subjects: subjects,
            breadcrumb: breadcrumb,
            formData: {
               ...teacher.dataValues,
               qualifications: teacher.qualifications || [],
               subject_assignments: teacher.subjects
                  ? teacher.subjects.map((subj) => ({
                       subject_id: subj.id,
                       is_primary: subj.assignment?.is_primary || false,
                       qualification_level: subj.assignment?.qualification_level || 'QUALIFIED',
                    }))
                  : [],
            },
            errors: {},
            departments: [
               { value: 'SCIENCE', label: 'Science' },
               { value: 'MATHEMATICS', label: 'Mathematics' },
               { value: 'ENGLISH', label: 'English' },
               { value: 'SOCIAL_STUDIES', label: 'Social Studies' },
               { value: 'ARTS', label: 'Arts' },
               { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' },
               { value: 'OTHER', label: 'Other' },
            ],
            qualificationLevels: [
               { value: 'DIPLOMA', label: 'Diploma' },
               { value: 'UNDERGRADUATE', label: 'Undergraduate' },
               { value: 'POSTGRADUATE', label: 'Postgraduate' },
               { value: 'DOCTORATE', label: 'Doctorate' },
            ],
         });
      } catch (error) {
         logError(error, { context: 'teacher edit GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load teacher edit page. Please try again.');
         res.redirect('/teachers');
      }
   });

   /**
    * @route PUT /teachers/:id
    * @desc Update teacher with enhanced validation
    * @access Private (School Admin, Trust Admin, Teachers - own profile)
    */
   router.put('/:id', requireAuth, async (req, res) => {
      try {
         const teacherId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Teacher edit privileges required.');
            return res.redirect(`/teachers/${teacherId}`);
         }

         // Teachers can only edit their own profile unless they're admin
         if (userType === 'teacher' && req.session.user.id !== parseInt(teacherId)) {
            req.flash('error', 'Access denied. You can only edit your own profile.');
            return res.redirect(`/teachers/${teacherId}`);
         }

         // Validate request data
         const { error, value } = updateTeacherSchema.validate(req.body, { abortEarly: false });
         if (error) {
            const validationErrors = {};
            error.details.forEach((detail) => {
               const field = detail.path.join('.');
               validationErrors[field] = detail.message;
            });

            // Reload form with errors
            const teacher = await teachersService.getTeacherById(teacherId, req.tenant?.code);
            const subjects = await models.Subject.findAll({
               where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
               attributes: ['id', 'name', 'code', 'category'],
               order: [['name', 'ASC']],
            });

            return res.render('pages/teachers/edit', {
               title: `Edit Teacher - ${teacher.first_name} ${teacher.last_name}`,
               description: 'Update teacher information and assignments',
               user: req.session.user,
               tenant: req.tenant,
               userType: userType,
               currentPath: `/teachers/${teacherId}/edit`,
               teacher: teacher,
               subjects: subjects,
               breadcrumb: [
                  { title: 'Dashboard', url: '/dashboard' },
                  { title: 'Teachers', url: '/teachers' },
                  { title: `${teacher.first_name} ${teacher.last_name}`, url: `/teachers/${teacherId}` },
                  { title: 'Edit', url: `/teachers/${teacherId}/edit` },
               ],
               formData: req.body,
               errors: validationErrors,
               departments: [
                  { value: 'SCIENCE', label: 'Science' },
                  { value: 'MATHEMATICS', label: 'Mathematics' },
                  { value: 'ENGLISH', label: 'English' },
                  { value: 'SOCIAL_STUDIES', label: 'Social Studies' },
                  { value: 'ARTS', label: 'Arts' },
                  { value: 'PHYSICAL_EDUCATION', label: 'Physical Education' },
                  { value: 'OTHER', label: 'Other' },
               ],
               qualificationLevels: [
                  { value: 'DIPLOMA', label: 'Diploma' },
                  { value: 'UNDERGRADUATE', label: 'Undergraduate' },
                  { value: 'POSTGRADUATE', label: 'Postgraduate' },
                  { value: 'DOCTORATE', label: 'Doctorate' },
               ],
            });
         }

         // Update teacher using service
         const updatedTeacher = await teachersService.updateTeacher(teacherId, value, req.tenant?.code);

         const successMsg = `Teacher ${updatedTeacher.first_name} ${updatedTeacher.last_name} has been updated successfully!`;
         req.flash('success', successMsg);
         res.redirect(`/teachers/${teacherId}`);
      } catch (error) {
         logError(error, { context: 'teachers update PUT', tenant: req.tenant?.code });

         if (error.message.includes('not found') || error.message.includes('already exists')) {
            req.flash('error', error.message);
         } else {
            req.flash('error', 'Failed to update teacher. Please try again.');
         }
         res.redirect(`/teachers/${req.params.id}/edit`);
      }
   });

   /**
    * @route DELETE /teachers/:id
    * @desc Delete teacher with validation
    * @access Private (School Admin, Trust Admin)
    */
   router.delete('/:id', requireAuth, async (req, res) => {
      try {
         const teacherId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            return res.status(403).json({
               success: false,
               message: 'Access denied. Teacher deletion privileges required.',
            });
         }

         // Delete teacher using service
         await teachersService.deleteTeacher(teacherId, req.tenant?.code);

         res.json({
            success: true,
            message: 'Teacher has been deleted successfully.',
         });
      } catch (error) {
         logError(error, { context: 'teachers delete DELETE', tenant: req.tenant?.code });

         const statusCode = error.message.includes('not found')
            ? 404
            : error.message.includes('Cannot delete')
              ? 400
              : 500;

         res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to delete teacher.',
         });
      }
   });

   /**
    * @route GET /teachers/import
    * @desc Bulk teacher import page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/import', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/teachers');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Teachers', url: '/teachers' },
            { title: 'Bulk Import', url: '/teachers/import' },
         ];

         res.render('pages/teachers/import', {
            title: 'Bulk Import Teachers',
            description: 'Import multiple teachers from CSV file',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/teachers/import',
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'teachers import GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load import page. Please try again.');
         res.redirect('/teachers');
      }
   });

   /**
    * @route POST /teachers/import
    * @desc Process bulk teacher import
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/import', requireAuth, upload.single('csvFile'), async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/teachers');
         }

         if (!req.file) {
            req.flash('error', 'Please select a CSV file to import.');
            return res.redirect('/teachers/import');
         }

         // Process CSV import using service
         const result = await teachersService.bulkImportFromCSV(req.file.path, req.tenant?.code, req.session.user.id);

         if (result.success) {
            const importMsg = `Successfully imported ${result.imported} teachers. `;
            const errorMsg = `${result.errors} errors.`;
            req.flash('success', importMsg + errorMsg);
         } else {
            req.flash('error', 'Import failed. Please check the CSV format and try again.');
         }

         res.redirect('/teachers');
      } catch (error) {
         logError(error, { context: 'teachers import POST', tenant: req.tenant?.code });
         req.flash('error', 'Import failed due to server error. Please try again.');
         res.redirect('/teachers/import');
      }
   });

   /**
    * @route GET /teachers/export
    * @desc Export teachers to CSV
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/export', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Export privileges required.');
            return res.redirect('/teachers');
         }

         // Get filters from query params
         const filters = {
            search: req.query.search || '',
            department: req.query.department || '',
            subject_id: req.query.subject_id || '',
            employment_status: req.query.employment_status || '',
         };

         // Export using service
         const csvData = await teachersService.exportToCSV(filters, req.tenant?.code);

         const filename = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
         res.send(csvData);
      } catch (error) {
         logError(error, { context: 'teachers export GET', tenant: req.tenant?.code });
         req.flash('error', 'Export failed. Please try again.');
         res.redirect('/teachers');
      }
   });

   return router;
};
