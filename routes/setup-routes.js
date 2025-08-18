const express = require('express');
const router = express.Router();
const setupService = require('../modules/setup/setup-service');
const wizardEngine = require('../modules/setup/wizard-engine');
const validationMiddleware = require('../middleware/validation-middleware');
const authMiddleware = require('../middleware/auth-middleware');
const errorHandler = require('../middleware/error-handler');

// Middleware to check setup permissions
const checkSetupPermission = authMiddleware.requirePermission('setup', 'create');

// Get available wizard configurations
router.get('/wizards', 
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const wizards = await wizardEngine.getAvailableWizards();
      res.success(wizards, 'Available wizards retrieved');
    } catch (error) {
      res.error(error.message, 'WIZARD_FETCH_FAILED', 500);
    }
  })
);

// Start a new wizard session
router.post('/wizards/:wizardType/start',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { wizardType } = req.params;
      const userId = req.session.userId;
      
      const session = await wizardEngine.startWizard(wizardType, userId);
      
      res.success(session, 'Wizard session started');
    } catch (error) {
      res.error(error.message, 'WIZARD_START_FAILED', 400);
    }
  })
);

// Get wizard session details
router.get('/wizards/session/:sessionId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await wizardEngine.getWizardSession(sessionId);
      
      res.success(session, 'Wizard session retrieved');
    } catch (error) {
      res.error(error.message, 'WIZARD_SESSION_FETCH_FAILED', 404);
    }
  })
);

// Process wizard step
router.post('/wizards/session/:sessionId/step',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  validationMiddleware.custom(async (req) => {
    const { sessionId } = req.params;
    const session = await wizardEngine.getWizardSession(sessionId);
    
    if (!session) {
      return { error: 'Wizard session not found' };
    }
    
    // Validate step data based on current step configuration
    const currentStep = session.currentStep;
    const stepConfig = session.steps.find(s => s.id === currentStep);
    
    if (!stepConfig) {
      return { error: 'Invalid wizard step' };
    }
    
    // Additional validation can be added here based on step configuration
    return { valid: true };
  }),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stepData = req.body;
      
      const result = await wizardEngine.processStep(sessionId, stepData);
      
      res.success(result, 'Wizard step processed');
    } catch (error) {
      res.error(error.message, 'WIZARD_STEP_FAILED', 400);
    }
  })
);

// Complete wizard
router.post('/wizards/session/:sessionId/complete',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const result = await wizardEngine.completeWizard(sessionId);
      
      res.success(result, 'Wizard completed successfully');
    } catch (error) {
      res.error(error.message, 'WIZARD_COMPLETION_FAILED', 400);
    }
  })
);

// Create new trust
router.post('/trusts',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN']),
  validationMiddleware.validate('setup.createTrust'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const trustData = req.body;
      const createdBy = req.session.userId;
      
      const result = await setupService.createTrust(trustData, createdBy);
      
      res.success(result, 'Trust created successfully');
    } catch (error) {
      res.error(error.message, 'TRUST_CREATION_FAILED', 400);
    }
  })
);

// Get all trusts
router.get('/trusts',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'SUPER_ADMIN', 'SYS_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const trusts = await setupService.getTrusts(filters);
      
      res.success(trusts, 'Trusts retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TRUSTS_FETCH_FAILED', 500);
    }
  })
);

// Get trust by ID
router.get('/trusts/:trustId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { trustId } = req.params;
      
      const trust = await setupService.getTrustById(trustId);
      
      res.success(trust, 'Trust retrieved successfully');
    } catch (error) {
      res.error(error.message, 'TRUST_FETCH_FAILED', 404);
    }
  })
);

// Update trust
router.put('/trusts/:trustId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN']),
  validationMiddleware.validate('setup.updateTrust'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { trustId } = req.params;
      const updateData = req.body;
      
      const result = await setupService.updateTrust(trustId, updateData);
      
      res.success(result, 'Trust updated successfully');
    } catch (error) {
      res.error(error.message, 'TRUST_UPDATE_FAILED', 400);
    }
  })
);

// Create new school
router.post('/schools',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN']),
  validationMiddleware.validate('setup.createSchool'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const schoolData = req.body;
      const createdBy = req.session.userId;
      
      const result = await setupService.createSchool(schoolData, createdBy, req.trustCode);
      
      res.success(result, 'School created successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOL_CREATION_FAILED', 400);
    }
  })
);

// Get schools
router.get('/schools',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const schools = await setupService.getSchools(filters, req.trustCode);
      
      res.success(schools, 'Schools retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOLS_FETCH_FAILED', 500);
    }
  })
);

// Get school by ID
router.get('/schools/:schoolId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'GROUP_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { schoolId } = req.params;
      
      const school = await setupService.getSchoolById(schoolId, req.trustCode);
      
      res.success(school, 'School retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOL_FETCH_FAILED', 404);
    }
  })
);

// Update school
router.put('/schools/:schoolId',
  authMiddleware.requireRole(['SYSTEM_ADMIN', 'TRUST_ADMIN', 'SCHOOL_ADMIN']),
  validationMiddleware.validate('setup.updateSchool'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { schoolId } = req.params;
      const updateData = req.body;
      
      const result = await setupService.updateSchool(schoolId, updateData, req.trustCode);
      
      res.success(result, 'School updated successfully');
    } catch (error) {
      res.error(error.message, 'SCHOOL_UPDATE_FAILED', 400);
    }
  })
);

// Create academic year
router.post('/academic-years',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  validationMiddleware.validate('setup.createAcademicYear'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const yearData = req.body;
      const createdBy = req.session.userId;
      
      const result = await setupService.createAcademicYear(yearData, createdBy, req.trustCode);
      
      res.success(result, 'Academic year created successfully');
    } catch (error) {
      res.error(error.message, 'ACADEMIC_YEAR_CREATION_FAILED', 400);
    }
  })
);

// Get academic years
router.get('/academic-years',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const academicYears = await setupService.getAcademicYears(filters, req.trustCode);
      
      res.success(academicYears, 'Academic years retrieved successfully');
    } catch (error) {
      res.error(error.message, 'ACADEMIC_YEARS_FETCH_FAILED', 500);
    }
  })
);

// Create class
router.post('/classes',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  validationMiddleware.validate('setup.createClass'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const classData = req.body;
      const createdBy = req.session.userId;
      
      const result = await setupService.createClass(classData, createdBy, req.trustCode);
      
      res.success(result, 'Class created successfully');
    } catch (error) {
      res.error(error.message, 'CLASS_CREATION_FAILED', 400);
    }
  })
);

// Get classes
router.get('/classes',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const classes = await setupService.getClasses(filters, req.trustCode);
      
      res.success(classes, 'Classes retrieved successfully');
    } catch (error) {
      res.error(error.message, 'CLASSES_FETCH_FAILED', 500);
    }
  })
);

// Create section
router.post('/sections',
  authMiddleware.requireRole(['TRUST_ADMIN', 'SCHOOL_ADMIN']),
  validationMiddleware.validate('setup.createSection'),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const sectionData = req.body;
      const createdBy = req.session.userId;
      
      const result = await setupService.createSection(sectionData, createdBy, req.trustCode);
      
      res.success(result, 'Section created successfully');
    } catch (error) {
      res.error(error.message, 'SECTION_CREATION_FAILED', 400);
    }
  })
);

// Get sections
router.get('/sections',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const filters = req.query;
      const sections = await setupService.getSections(filters, req.trustCode);
      
      res.success(sections, 'Sections retrieved successfully');
    } catch (error) {
      res.error(error.message, 'SECTIONS_FETCH_FAILED', 500);
    }
  })
);

// Initialize trust database
router.post('/trusts/:trustCode/initialize',
  authMiddleware.requireRole(['SYSTEM_ADMIN']),
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const { trustCode } = req.params;
      
      const result = await setupService.initializeTrustDatabase(trustCode);
      
      res.success(result, 'Trust database initialized successfully');
    } catch (error) {
      res.error(error.message, 'DATABASE_INITIALIZATION_FAILED', 500);
    }
  })
);

// Get setup status
router.get('/status',
  errorHandler.asyncHandler(async (req, res) => {
    try {
      const status = await setupService.getSetupStatus(req.trustCode);
      
      res.success(status, 'Setup status retrieved successfully');
    } catch (error) {
      res.error(error.message, 'STATUS_FETCH_FAILED', 500);
    }
  })
);

module.exports = router;