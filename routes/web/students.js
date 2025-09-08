const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { logError } = require('../../utils/logger');
const StudentsService = require('../../services/StudentsService');

/**
 * Enhanced Student Management Routes
 * Complete student lifecycle management with bulk operations
 * Phase 3 Implementation - Enhanced Students Management System
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

   // Configure multer for file uploads
   const upload = multer({
      dest: 'uploads/students/',
      fileFilter: (req, file, cb) => {
         if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
         } else {
            cb(new Error('Only CSV files are allowed'), false);
         }
      },
      limits: {
         fileSize: 5 * 1024 * 1024, // 5MB limit
      },
   });

   // Validation schemas
   const createStudentSchema = Joi.object({
      first_name: Joi.string().min(2).max(50).required(),
      last_name: Joi.string().min(2).max(50).required(),
      date_of_birth: Joi.date().max('now').required(),
      gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
      email: Joi.string().email().optional().allow(''),
      phone: Joi.string()
         .pattern(/^[0-9]{10}$/)
         .optional()
         .allow(''),
      address: Joi.string().max(255).optional().allow(''),
      section_id: Joi.number().integer().positive().optional().allow(null),
      blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
      medical_conditions: Joi.string().max(500).optional().allow(''),
      emergency_contact: Joi.string().max(100).optional().allow(''),
      parents: Joi.array()
         .items(
            Joi.object({
               relationship: Joi.string().valid('FATHER', 'MOTHER', 'GUARDIAN').required(),
               first_name: Joi.string().min(2).max(50).required(),
               last_name: Joi.string().min(2).max(50).required(),
               phone: Joi.string()
                  .pattern(/^[0-9]{10}$/)
                  .required(),
               email: Joi.string().email().optional().allow(''),
               occupation: Joi.string().max(100).optional().allow(''),
               address: Joi.string().max(255).optional().allow(''),
            })
         )
         .optional(),
   });

   /**
    * @route GET /students
    * @desc Enhanced students list page with advanced filtering
    * @access Private (School Admin, Trust Admin, Teachers)
    */
   router.get('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges for student management.');
            return res.redirect('/dashboard');
         }

         // Get filters and pagination
         const filters = {
            search: req.query.search || '',
            class_id: req.query.class_id || '',
            section_id: req.query.section_id || '',
            admission_status: req.query.admission_status || '',
            gender: req.query.gender || '',
         };

         const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: 20,
            sortBy: req.query.sortBy || 'created_at',
            sortOrder: req.query.sortOrder || 'DESC',
         };

         // Get students data from service
         const { students, pagination: paginationData } = await studentsService.getAllStudents(
            filters,
            pagination,
            req.tenant?.code
         );

         // Get classes and sections for filter dropdowns
         const classes = await models.Class.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code'],
            order: [['name', 'ASC']],
         });

         const sections = await models.Section.findAll({
            where: req.tenant?.code ? {} : {}, // Add tenant filtering if needed
            include: [
               {
                  model: models.Class,
                  as: 'class',
                  attributes: ['name'],
               },
            ],
            attributes: ['id', 'name', 'class_id'],
            order: [
               ['class_id', 'ASC'],
               ['name', 'ASC'],
            ],
         });

         // Get statistics
         const stats = await studentsService.getStudentsStatistics(req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Students', url: '/students' },
         ];

         res.render('pages/students/index', {
            title: 'Students Management',
            description: 'Manage student information and enrollment',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/students',
            students: students,
            classes: classes,
            sections: sections,
            filters: filters,
            pagination: paginationData,
            breadcrumb: breadcrumb,
            stats: stats,
         });
      } catch (error) {
         logError(error, { context: 'students index GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load students. Please try again.');
         res.redirect('/dashboard');
      }
   });

   /**
    * @route GET /students/new
    * @desc New student form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/new', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Student creation privileges required.');
            return res.redirect('/students');
         }

         // Initialize empty arrays for classes and sections
         let classes = [];
         let sections = [];
         let schools = [];

         try {
            // Get tenant models for dynamic data fetching
            const { dbManager } = require('../../models/system/database');
            const tenantModels = await dbManager.getTenantModels(req.tenant.code);

            // Fetch active classes from tenant database
            classes = await tenantModels.Class.findAll({
               where: { is_active: true },
               order: [['class_order', 'ASC']],
               attributes: ['id', 'name', 'code', 'level', 'class_order'],
            });

            // Fetch active sections from tenant database
            sections = await tenantModels.Section.findAll({
               where: { is_active: true },
               order: [['name', 'ASC']],
               attributes: ['id', 'name', 'code', 'class_id'],
            });

            // For system/trust admins, also fetch schools within tenant
            if (userType === 'system' || userType === 'trust') {
               schools = await tenantModels.School.findAll({
                  where: { status: 'ACTIVE' },
                  order: [['name', 'ASC']],
                  attributes: ['id', 'name', 'code'],
               });
            }

            const tenantCode = req.tenant.code;
            const msg = `Loaded ${classes.length} classes, ${sections.length} sections`;
            console.log(`${msg} for ${tenantCode}`);
         } catch (serviceError) {
            logError(serviceError, {
               context: 'students/new tenant data fetch',
               tenant: req.tenant?.code,
               userType,
            });
            const warningMsg = 'Using fallback options. Contact administrator if limited.';
            req.flash('warning', warningMsg);
         }

         res.render('pages/students/new', {
            title: 'Add New Student',
            description: 'Register a new student in the system',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/students/new',
            classes: classes, // Pass classes to template
            sections: sections, // Pass sections to template
            schools: schools, // Pass schools to template
         });
      } catch (error) {
         logError(error, { context: 'students new GET' });
         req.flash('error', 'Unable to load new student page');
         res.redirect('/students');
      }
   });

   /**
    * @route POST /students
    * @desc Create new student with enhanced validation
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Student creation privileges required.');
            return res.redirect('/students');
         }

         // Validate request data
         const { error, value } = createStudentSchema.validate(req.body, { abortEarly: false });
         if (error) {
            const validationErrors = {};
            error.details.forEach((detail) => {
               const field = detail.path.join('.');
               validationErrors[field] = detail.message;
            });

            // Reload form with errors
            const classes = await models.Class.findAll({
               where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
               attributes: ['id', 'name', 'code'],
               order: [['name', 'ASC']],
            });

            const sections = await models.Section.findAll({
               where: req.tenant?.code ? {} : {},
               include: [
                  {
                     model: models.Class,
                     as: 'class',
                     attributes: ['name'],
                     where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
                  },
               ],
               attributes: ['id', 'name', 'class_id'],
               order: [
                  ['class_id', 'ASC'],
                  ['name', 'ASC'],
               ],
            });

            return res.render('pages/students/new', {
               title: 'Add New Student',
               description: 'Create a new student record',
               user: req.session.user,
               tenant: req.tenant,
               userType: userType,
               currentPath: '/students/new',
               classes: classes,
               sections: sections,
               breadcrumb: [
                  { title: 'Dashboard', url: '/dashboard' },
                  { title: 'Students', url: '/students' },
                  { title: 'Add New Student', url: '/students/new' },
               ],
               formData: req.body,
               errors: validationErrors,
            });
         }

         // Create student using service
         const studentData = {
            ...value,
            tenant_code: req.tenant?.code,
            created_by: req.session.user.id,
            admission_number: await studentsService.generateAdmissionNumber(req.tenant?.code),
         };

         const newStudent = await studentsService.createStudent(studentData, req.tenant?.code);

         const fullName = `${newStudent.first_name} ${newStudent.last_name}`;
         req.flash('success', `Student ${fullName} has been created successfully!`);
         res.redirect(`/students/${newStudent.id}`);
      } catch (error) {
         logError(error, { context: 'students create POST', tenant: req.tenant?.code });
         req.flash('error', 'Failed to create student. Please check the form data and try again.');
         res.redirect('/students/new');
      }
   });

   /**
    * @route GET /students/:id
    * @desc Enhanced student profile page with comprehensive details
    * @access Private (School Admin, Trust Admin, Teachers, Parents)
    */
   router.get('/:id', requireAuth, async (req, res) => {
      try {
         const studentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher', 'parent'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Insufficient privileges to view student details.');
            return res.redirect('/students');
         }

         // Get student details from service
         const student = await studentsService.getStudentById(studentId, req.tenant?.code);

         if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/students');
         }

         // Check parent access - parents can only view their own children
         if (userType === 'parent') {
            const hasAccess = await studentsService.checkParentAccess(req.session.user.id, studentId, req.tenant?.code);
            if (!hasAccess) {
               req.flash('error', "Access denied. You can only view your own child's profile.");
               return res.redirect('/dashboard');
            }
         }

         // Get additional data
         const academicHistory = await studentsService.getStudentAcademicHistory(studentId, req.tenant?.code);
         const attendanceStats = await studentsService.getStudentAttendanceStats(studentId, req.tenant?.code);

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Academic Management', url: '/admin/academic' },
            { title: 'Students', url: '/students' },
            { title: `${student.first_name} ${student.last_name}`, url: `/students/${studentId}` },
         ];

         res.render('pages/students/detail', {
            title: `${student.first_name} ${student.last_name} - Student Profile`,
            description: 'Student profile and academic information',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/students/${studentId}`,
            student: student,
            academicHistory: academicHistory,
            attendanceStats: attendanceStats,
            breadcrumb: breadcrumb,
            canEdit: ['system', 'trust', 'school'].includes(userType),
         });
      } catch (error) {
         const logContext = {
            context: 'students detail GET',
            studentId: req.params.id,
            tenant: req.tenant?.code,
         };
         logError(error, logContext);
         req.flash('error', 'Unable to load student details. Please try again.');
         res.redirect('/students');
      }
   });

   /**
    * @route GET /students/import
    * @desc Bulk student import page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/import', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/students');
         }

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Students', url: '/students' },
            { title: 'Bulk Import', url: '/students/import' },
         ];

         res.render('pages/students/import', {
            title: 'Bulk Import Students',
            description: 'Import multiple students from CSV file',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: '/students/import',
            breadcrumb: breadcrumb,
         });
      } catch (error) {
         logError(error, { context: 'students import GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load import page. Please try again.');
         res.redirect('/students');
      }
   });

   /**
    * @route POST /students/import
    * @desc Process bulk student import
    * @access Private (School Admin, Trust Admin)
    */
   router.post('/import', requireAuth, upload.single('csvFile'), async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Bulk import privileges required.');
            return res.redirect('/students');
         }

         if (!req.file) {
            req.flash('error', 'Please select a CSV file to import.');
            return res.redirect('/students/import');
         }

         // Process CSV import using service
         const result = await studentsService.bulkImportFromCSV(req.file.path, req.tenant?.code, req.session.user.id);

         if (result.success) {
            const importMsg = `Successfully imported ${result.imported} students. `;
            const errorMsg = `${result.errors} errors.`;
            req.flash('success', importMsg + errorMsg);
         } else {
            req.flash('error', 'Import failed. Please check the CSV format and try again.');
         }

         res.redirect('/students');
      } catch (error) {
         logError(error, { context: 'students import POST', tenant: req.tenant?.code });
         req.flash('error', 'Import failed due to server error. Please try again.');
         res.redirect('/students/import');
      }
   });

   /**
    * @route GET /students/export
    * @desc Export students to CSV
    * @access Private (School Admin, Trust Admin, Teachers)
    */
   router.get('/export', requireAuth, async (req, res) => {
      try {
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school', 'teacher'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Export privileges required.');
            return res.redirect('/students');
         }

         // Get filters from query params
         const filters = {
            search: req.query.search || '',
            class_id: req.query.class_id || '',
            section_id: req.query.section_id || '',
            admission_status: req.query.admission_status || '',
         };

         // Export using service
         const csvData = await studentsService.exportToCSV(filters, req.tenant?.code);

         const filename = `students_export_${new Date().toISOString().split('T')[0]}.csv`;

         res.setHeader('Content-Type', 'text/csv');
         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
         res.send(csvData);
      } catch (error) {
         logError(error, { context: 'students export GET', tenant: req.tenant?.code });
         req.flash('error', 'Export failed. Please try again.');
         res.redirect('/students');
      }
   });

   /**
    * @route GET /students/:id/edit
    * @desc Edit student form page
    * @access Private (School Admin, Trust Admin)
    */
   router.get('/:id/edit', requireAuth, async (req, res) => {
      try {
         const studentId = req.params.id;
         const userType = req.session.userType;
         const allowedTypes = ['system', 'trust', 'school'];

         if (!allowedTypes.includes(userType)) {
            req.flash('error', 'Access denied. Student edit privileges required.');
            return res.redirect(`/students/${studentId}`);
         }

         // Get student data using service
         const student = await studentsService.getStudentById(studentId, req.tenant?.code);

         if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/students');
         }

         // Get classes and sections for dropdowns
         const classes = await models.Class.findAll({
            where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
            attributes: ['id', 'name', 'code'],
            order: [['name', 'ASC']],
         });

         const sections = await models.Section.findAll({
            where: req.tenant?.code ? {} : {},
            include: [
               {
                  model: models.Class,
                  as: 'class',
                  attributes: ['name'],
                  where: req.tenant?.code ? { tenant_code: req.tenant.code } : {},
               },
            ],
            attributes: ['id', 'name', 'class_id'],
            order: [
               ['class_id', 'ASC'],
               ['name', 'ASC'],
            ],
         });

         const breadcrumb = [
            { title: 'Dashboard', url: '/dashboard' },
            { title: 'Students', url: '/students' },
            { title: `${student.first_name} ${student.last_name}`, url: `/students/${studentId}` },
            { title: 'Edit', url: `/students/${studentId}/edit` },
         ];

         res.render('pages/students/edit', {
            title: `Edit Student - ${student.first_name} ${student.last_name}`,
            description: 'Update student information',
            user: req.session.user,
            tenant: req.tenant,
            userType: userType,
            currentPath: `/students/${studentId}/edit`,
            student: student,
            classes: classes,
            sections: sections,
            breadcrumb: breadcrumb,
            formData: student,
            errors: {},
         });
      } catch (error) {
         logError(error, { context: 'student edit GET', tenant: req.tenant?.code });
         req.flash('error', 'Unable to load student edit page. Please try again.');
         res.redirect('/students');
      }
   });

   return router;
};
