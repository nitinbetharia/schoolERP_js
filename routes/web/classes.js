const express = require('express');
const router = express.Router();
const Joi = require('joi');
const authMiddleware = require('../../middleware/auth');
const tenantMiddleware = require('../../middleware/tenant');
const trustTenantMiddleware = require('../../middleware/trustTenant');

// Import models
const { getTenantDB } = require('../../utils/tenantDbManager');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(trustTenantMiddleware);

/**
 * Classes Management Routes
 * Handles CRUD operations for academic classes
 */

// List all classes
router.get('/', async (req, res) => {
   try {
      const tenantDb = await getTenantDB(req.session.user.trust_id);
      const Class = tenantDb.models.Class;
      const School = tenantDb.models.School;
      
      // Get all classes with school information
      const classes = await Class.findAll({
         include: [
            {
               model: School,
               attributes: ['name', 'code']
            }
         ],
         order: [['class_order', 'ASC'], ['name', 'ASC']]
      });

      res.render('pages/admin/classes/index', {
         title: 'Classes Management',
         classes: classes || [],
         breadcrumb: [
            { title: 'Dashboard', url: '/' },
            { title: 'Classes', url: '/admin/classes' }
         ]
      });

   } catch (error) {
      console.error('Classes list error:', error);
      req.flash('error', 'Error loading classes: ' + error.message);
      res.redirect('/');
   }
});

// Show create class form
router.get('/create', async (req, res) => {
   try {
      const tenantDb = await getTenantDB(req.session.user.trust_id);
      const School = tenantDb.models.School;
      const AcademicYear = tenantDb.models.AcademicYear;
      
      // Get schools and academic years for dropdowns
      const schools = await School.findAll({
         where: { is_active: true },
         order: [['name', 'ASC']]
      });

      const academicYears = await AcademicYear.findAll({
         order: [['start_date', 'DESC']]
      });

      res.render('pages/admin/classes/create', {
         title: 'Create New Class',
         schools: schools || [],
         academicYears: academicYears || [],
         breadcrumb: [
            { title: 'Dashboard', url: '/' },
            { title: 'Classes', url: '/admin/classes' },
            { title: 'Create Class', url: '/admin/classes/create' }
         ]
      });

   } catch (error) {
      console.error('Classes create form error:', error);
      req.flash('error', 'Error loading create form: ' + error.message);
      res.redirect('/admin/classes');
   }
});

// Create new class
router.post('/', async (req, res) => {
   try {
      const tenantDb = await getTenantDB(req.session.user.trust_id);
      const Class = tenantDb.models.Class;
      
      // Import validation schema from the model file
      const { classValidationSchemas } = require('../../modules/school/models/Class');
      
      // Validate input
      const { error, value } = classValidationSchemas.create.validate(req.body);
      
      if (error) {
         req.flash('error', error.details[0].message);
         return res.redirect('/admin/classes/create');
      }

      // Add created_by user
      value.created_by = req.session.user.id;
      value.updated_by = req.session.user.id;

      // Create the class
      const newClass = await Class.create(value);

      req.flash('success', `Class "${newClass.name}" created successfully`);
      res.redirect('/admin/classes');

   } catch (error) {
      console.error('Classes create error:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
         req.flash('error', 'A class with this code already exists for this school');
      } else {
         req.flash('error', 'Error creating class: ' + error.message);
      }
      
      res.redirect('/admin/classes/create');
   }
});

// Show edit class form
router.get('/:id/edit', async (req, res) => {
   try {
      const tenantDb = await getTenantDB(req.session.user.trust_id);
      const Class = tenantDb.models.Class;
      const School = tenantDb.models.School;
      const AcademicYear = tenantDb.models.AcademicYear;
      
      const classId = parseInt(req.params.id);
      
      // Find the class
      const classRecord = await Class.findByPk(classId, {
         include: [
            {
               model: School,
               attributes: ['id', 'name', 'code']
            }
         ]
      });

      if (!classRecord) {
         req.flash('error', 'Class not found');
         return res.redirect('/admin/classes');
      }

      // Get schools and academic years for dropdowns
      const schools = await School.findAll({
         where: { is_active: true },
         order: [['name', 'ASC']]
      });

      const academicYears = await AcademicYear.findAll({
         order: [['start_date', 'DESC']]
      });

      res.render('pages/admin/classes/edit', {
         title: 'Edit Class',
         classRecord: classRecord,
         schools: schools || [],
         academicYears: academicYears || [],
         breadcrumb: [
            { title: 'Dashboard', url: '/' },
            { title: 'Classes', url: '/admin/classes' },
            { title: 'Edit Class', url: `/admin/classes/${classId}/edit` }
         ]
      });

   } catch (error) {
      console.error('Classes edit form error:', error);
      req.flash('error', 'Error loading edit form: ' + error.message);
      res.redirect('/admin/classes');
   }
});

// Update class
router.put('/:id', async (req, res) => {
   try {
      const tenantDb = await getTenantDB(req.session.user.trust_id);
      const Class = tenantDb.models.Class;
      
      const classId = parseInt(req.params.id);
      
      // Import validation schema from the model file
      const { classValidationSchemas } = require('../../modules/school/models/Class');
      
      // Validate input
      const { error, value } = classValidationSchemas.update.validate(req.body);
      
      if (error) {
         req.flash('error', error.details[0].message);
         return res.redirect(`/admin/classes/${classId}/edit`);
      }

      // Find and update the class
      const classRecord = await Class.findByPk(classId);
      
      if (!classRecord) {
         req.flash('error', 'Class not found');
         return res.redirect('/admin/classes');
      }

      // Add updated_by user
      value.updated_by = req.session.user.id;

      await classRecord.update(value);

      req.flash('success', `Class "${classRecord.name}" updated successfully`);
      res.redirect('/admin/classes');

   } catch (error) {
      console.error('Classes update error:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
         req.flash('error', 'A class with this code already exists for this school');
      } else {
         req.flash('error', 'Error updating class: ' + error.message);
      }
      
      res.redirect(`/admin/classes/${req.params.id}/edit`);
   }
});

// Delete class
router.delete('/:id', async (req, res) => {
   try {
      const tenantDb = await getTenantDB(req.session.user.trust_id);
      const Class = tenantDb.models.Class;
      const Section = tenantDb.models.Section;
      
      const classId = parseInt(req.params.id);
      
      // Check if class has associated sections
      const sectionsCount = await Section.count({
         where: { class_id: classId }
      });

      if (sectionsCount > 0) {
         req.flash('error', 'Cannot delete class with existing sections. Please delete sections first.');
         return res.redirect('/admin/classes');
      }

      // Find and delete the class
      const classRecord = await Class.findByPk(classId);
      
      if (!classRecord) {
         req.flash('error', 'Class not found');
         return res.redirect('/admin/classes');
      }

      const className = classRecord.name;
      await classRecord.destroy();

      req.flash('success', `Class "${className}" deleted successfully`);
      res.redirect('/admin/classes');

   } catch (error) {
      console.error('Classes delete error:', error);
      req.flash('error', 'Error deleting class: ' + error.message);
      res.redirect('/admin/classes');
   }
});

module.exports = function(middleware) {
   return router;
};
