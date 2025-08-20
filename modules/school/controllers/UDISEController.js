const UDISEService = require('../services/UDISEService');
const logger = require('../../../utils/logger');
const {
   ErrorFactory,
   formatErrorResponse,
   getErrorStatusCode
} = require('../../../utils/errors');

/**
 * UDISE+ Controller
 * Handles HTTP requests for UDISE+ school registration and census reporting
 */
function createUDISEController() {

   this.udiseService = new UDISEService();
   

   /**
    * registerSchool method
    */
   async function registerSchool() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;
      const udiseData = req.body;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'REGISTRATION',
      event: 'School registration failed',
      school_id: req.params.schoolId,
      user_id: req.user?.id,
      error: error.message,
         
   }

   /**
    * getSchoolUDISEInfo method
    */
   async function getSchoolUDISEInfo() {

      try {
      const schoolId = parseInt(req.params.schoolId);

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(404).json({
      success: false,
      error: {
      code: 'UDISE_NOT_REGISTERED',
      message: 'School not registered with UDISE+',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'INFO_RETRIEVAL',
      event: 'Get UDISE school info failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * updateClassEnrollment method
    */
   async function updateClassEnrollment() {

      try {
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const userId = req.user?.id;
      const classData = req.body;

      if (!udiseSchoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_UDISE_SCHOOL_ID',
      message: 'Valid UDISE school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'ENROLLMENT',
      event: 'Class enrollment update failed',
      udise_school_id: req.params.udiseSchoolId,
      user_id: req.user?.id,
      error: error.message,
         
   }

   /**
    * getClassEnrollmentReport method
    */
   async function getClassEnrollmentReport() {

      try {
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();

      if (!udiseSchoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_UDISE_SCHOOL_ID',
      message: 'Valid UDISE school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'REPORTING',
      event: 'Class enrollment report failed',
      udise_school_id: req.params.udiseSchoolId,
      error: error.message,
         
   }

   /**
    * updateFacilities method
    */
   async function updateFacilities() {

      try {
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const userId = req.user?.id;
      const facilitiesData = req.body;

      if (!udiseSchoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_UDISE_SCHOOL_ID',
      message: 'Valid UDISE school ID is required',
               
   }

   /**
    * if method
    */
   async function if() {

      await facilities.update({
      ...facilitiesData,
      assessment_date: new Date(),
      updated_by: userId,
            
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'FACILITIES',
      event: 'Facilities update failed',
      udise_school_id: req.params.udiseSchoolId,
      user_id: req.user?.id,
      error: error.message,
         
   }

   /**
    * generateCensusReport method
    */
   async function generateCensusReport() {

      try {
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();

      if (!udiseSchoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_UDISE_SCHOOL_ID',
      message: 'Valid UDISE school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'CENSUS',
      event: 'Census report generation failed',
      udise_school_id: req.params.udiseSchoolId,
      error: error.message,
         
   }

   /**
    * exportUDISEData method
    */
   async function exportUDISEData() {

      try {
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();
      const format = req.query.format?.toUpperCase() || 'JSON';

      if (!udiseSchoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_UDISE_SCHOOL_ID',
      message: 'Valid UDISE school ID is required',
               
   }

   /**
    * if method
    */
   async function if() {

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="udise_${udiseSchoolId
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'DATA_EXPORT',
      event: 'UDISE data export failed',
      udise_school_id: req.params.udiseSchoolId,
      error: error.message,
         
   }

   /**
    * getComplianceStatus method
    */
   async function getComplianceStatus() {

      try {
      const udiseSchoolId = parseInt(req.params.udiseSchoolId);
      const academicYear = req.query.academic_year || this.udiseService.getCurrentAcademicYear();

      if (!udiseSchoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_UDISE_SCHOOL_ID',
      message: 'Valid UDISE school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('UDISE Controller Error', {
      controller: 'udise-controller',
      category: 'COMPLIANCE',
      event: 'Compliance status retrieval failed',
      udise_school_id: req.params.udiseSchoolId,
      error: error.message,
         
   }

   return {
      registerSchool,
      catch,
      getSchoolUDISEInfo,
      if,
      catch,
      updateClassEnrollment,
      catch,
      getClassEnrollmentReport,
      catch,
      updateFacilities,
      if,
      catch,
      generateCensusReport,
      catch,
      exportUDISEData,
      if,
      catch,
      getComplianceStatus,
      catch
   };
}

module.exports = UDISEController;
