const express = require("express");
const UdiseController = require("../controllers/UdiseController")();

// Q59-ENFORCED: Import validation schemas for UDISE operations
const { validators } = require("../../../middleware");
const {
  udiseSchoolRegistrationValidationSchemas,
  udiseCensusDataValidationSchemas,
} = require("../../../models/index");

/**
 * UDISE Routes
 * Defines all routes for UDISE+ School Registration System
 * Includes registration, census data, compliance, and reporting endpoints
 */
function createUdiseRoutes() {
  const router = express.Router();

  // ================================
  // UDISE SCHOOL REGISTRATION ROUTES
  // ================================

  /**
   * @route   POST /api/v1/udise/registration
   * @desc    Create new UDISE school registration
   * @access  Private (School Admin, System Admin)
   */
  router.post(
    "/registration",
    validators.validateBody(
      udiseSchoolRegistrationValidationSchemas.createRegistration,
    ), // Q59-ENFORCED validation
    UdiseController.registration.createRegistration,
  );

  /**
   * @route   PUT /api/v1/udise/registration/:id
   * @desc    Update UDISE registration
   * @access  Private (School Admin, System Admin)
   */
  router.put(
    "/registration/:id",
    validators.validateBody(
      udiseSchoolRegistrationValidationSchemas.updateRegistration,
    ), // Q59-ENFORCED validation
    UdiseController.registration.updateRegistration,
  );

  /**
   * @route   POST /api/v1/udise/registration/:id/submit
   * @desc    Submit registration for approval
   * @access  Private (School Admin, System Admin)
   */
  router.post(
    "/registration/:id/submit",
    UdiseController.registration.submitRegistration,
  );

  /**
   * @route   GET /api/v1/udise/registration
   * @desc    Get UDISE registrations with filters
   * @access  Private (All authenticated users)
   * @query   school_id, registration_status, state_code, district_code, academic_year, limit, offset
   */
  router.get("/registration", UdiseController.registration.getRegistrations);

  /**
   * @route   GET /api/v1/udise/registration/:id
   * @desc    Get single UDISE registration with related data
   * @access  Private (All authenticated users)
   */
  router.get("/registration/:id", UdiseController.registration.getRegistration);

  /**
   * @route   POST /api/v1/udise/registration/:id/validate
   * @desc    Validate registration completeness and compliance
   * @access  Private (School Admin, System Admin)
   */
  router.post(
    "/registration/:id/validate",
    UdiseController.registration.validateRegistration,
  );

  // ================================
  // UDISE CENSUS DATA ROUTES
  // ================================

  /**
   * @route   POST /api/v1/udise/census
   * @desc    Create census data record
   * @access  Private (School Admin, Data Entry Operator)
   */
  router.post(
    "/census",
    validators.validateBody(udiseCensusDataValidationSchemas.createCensusData), // Q59-ENFORCED validation
    UdiseController.census.createCensusData,
  );

  /**
   * @route   PUT /api/v1/udise/census/:id
   * @desc    Update census data
   * @access  Private (School Admin, Data Entry Operator)
   */
  router.put(
    "/census/:id",
    validators.validateBody(udiseCensusDataValidationSchemas.updateCensusData), // Q59-ENFORCED validation
    UdiseController.census.updateCensusData,
  );

  /**
   * @route   GET /api/v1/udise/census/:id/stats
   * @desc    Get enrollment statistics from census data
   * @access  Private (All authenticated users)
   */
  router.get("/census/:id/stats", UdiseController.census.getEnrollmentStats);

  /**
   * @route   GET /api/v1/udise/census/school/:schoolId
   * @desc    Get census data by school
   * @access  Private (All authenticated users)
   * @query   academic_year
   */
  router.get(
    "/census/school/:schoolId",
    UdiseController.census.getCensusDataBySchool,
  );

  // ================================
  // UDISE COMPLIANCE ROUTES
  // ================================

  /**
   * @route   POST /api/v1/udise/compliance
   * @desc    Create compliance record
   * @access  Private (School Admin, Compliance Officer)
   */
  router.post("/compliance", UdiseController.compliance.createComplianceRecord);

  /**
   * @route   PUT /api/v1/udise/compliance/:id
   * @desc    Update compliance record
   * @access  Private (School Admin, Compliance Officer)
   */
  router.put(
    "/compliance/:id",
    UdiseController.compliance.updateComplianceRecord,
  );

  /**
   * @route   GET /api/v1/udise/compliance/school/:schoolId
   * @desc    Get compliance records by school
   * @access  Private (All authenticated users)
   * @query   academic_year
   */
  router.get(
    "/compliance/school/:schoolId",
    UdiseController.compliance.getComplianceBySchool,
  );

  // ================================
  // UDISE REPORTS & DASHBOARD ROUTES
  // ================================

  /**
   * @route   GET /api/v1/udise/reports/:reportType
   * @desc    Generate various UDISE reports
   * @access  Private (School Admin, System Admin, Report Viewer)
   * @param   reportType - registration_summary, enrollment_statistics, compliance_dashboard, integration_status
   * @query   academic_year, state_code, district_code, school_id, date_from, date_to
   */
  router.get("/reports/:reportType", UdiseController.reports.generateReport);

  /**
   * @route   GET /api/v1/udise/dashboard
   * @desc    Get UDISE dashboard summary data
   * @access  Private (All authenticated users)
   * @query   academic_year
   */
  router.get("/dashboard", UdiseController.reports.getDashboard);

  // ================================
  // HEALTH CHECK & STATUS ROUTES
  // ================================

  /**
   * @route   GET /api/v1/udise/health
   * @desc    Health check for UDISE module
   * @access  Public
   */
  router.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "UDISE+ module is operational",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    });
  });

  /**
   * @route   GET /api/v1/udise/status
   * @desc    Get UDISE module status and configuration
   * @access  Private (System Admin only)
   */
  router.get("/status", (req, res) => {
    res.json({
      success: true,
      message: "UDISE+ module status",
      data: {
        module: "UDISE+ School Registration System",
        version: "2.0.0",
        features: [
          "School Registration Management",
          "Annual Census Data Collection",
          "Compliance Tracking & Monitoring",
          "Government Integration APIs",
          "Comprehensive Reporting Dashboard",
        ],
        endpoints: {
          registration: 6,
          census: 4,
          compliance: 3,
          reports: 2,
          health: 2,
        },
        compliance_frameworks: [
          "Right to Education (RTE) Act",
          "National Education Policy (NEP) 2020",
          "UDISE+ Government Guidelines",
          "State Education Department Norms",
        ],
        integration_systems: [
          "UDISE+ Portal",
          "State Education Department",
          "Central Government APIs",
          "Verification Services",
        ],
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createUdiseRoutes;
