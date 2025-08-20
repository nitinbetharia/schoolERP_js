const SchoolService = require('../services/SchoolService');
const {
   ErrorFactory,
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
   DuplicateError
} = require('../../../utils/errors');
const logger = require('../../../utils/logger');

/**
 * School Controller
 * Handles HTTP requests for school management
 */
function createSchoolController() {

   this.schoolService = new SchoolService();
   

   /**
    * createSchool method
    */
   async function createSchool() {

      try {
      const tenantCode = req.tenantCode;
      const schoolData = req.body;
      const createdBy = req.user ? req.user.id : null;

      // Basic validation
      if (!schoolData.name) {
      throw ErrorFactory.validation('School name is required');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation('School code is required');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('School Controller Error', {
      service: 'school-controller',
      category: 'SCHOOL',
      event: 'School creation failed',
      tenant_code: req.tenantCode,
      error: error.message,
         
   }

   /**
    * if method
    */
   async function if() {

      return res.status(400).json({
      success: false,
      error: {
      code: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(409).json({
      success: false,
      error: {
      code: 'DUPLICATE_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * getSchools method
    */
   async function getSchools() {

      try {
      const tenantCode = req.tenantCode;
      const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      status: req.query.status,
      type: req.query.type,
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('School Controller Error', {
      service: 'school-controller',
      category: 'SCHOOL',
      event: 'Schools retrieval failed',
      tenant_code: req.tenantCode,
      error: error.message,
         
   }

   /**
    * getSchoolById method
    */
   async function getSchoolById() {

      try {
      const tenantCode = req.tenantCode;
      const schoolId = req.params.id;

      if (!schoolId || isNaN(schoolId)) {
      throw ErrorFactory.validation('Valid school ID is required');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('School Controller Error', {
      service: 'school-controller',
      category: 'SCHOOL',
      event: 'School retrieval failed',
      tenant_code: req.tenantCode,
      school_id: req.params.id,
      error: error.message,
         
   }

   /**
    * if method
    */
   async function if() {

      return res.status(400).json({
      success: false,
      error: {
      code: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(404).json({
      success: false,
      error: {
      code: 'NOT_FOUND',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * updateSchool method
    */
   async function updateSchool() {

      try {
      const tenantCode = req.tenantCode;
      const schoolId = req.params.id;
      const schoolData = req.body;
      const updatedBy = req.user ? req.user.id : null;

      if (!schoolId || isNaN(schoolId)) {
      throw ErrorFactory.validation('Valid school ID is required');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('School Controller Error', {
      service: 'school-controller',
      category: 'SCHOOL',
      event: 'School update failed',
      tenant_code: req.tenantCode,
      school_id: req.params.id,
      error: error.message,
         
   }

   /**
    * if method
    */
   async function if() {

      return res.status(400).json({
      success: false,
      error: {
      code: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(404).json({
      success: false,
      error: {
      code: 'NOT_FOUND',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(409).json({
      success: false,
      error: {
      code: 'DUPLICATE_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * deleteSchool method
    */
   async function deleteSchool() {

      try {
      const tenantCode = req.tenantCode;
      const schoolId = req.params.id;
      const deletedBy = req.user ? req.user.id : null;

      if (!schoolId || isNaN(schoolId)) {
      throw ErrorFactory.validation('Valid school ID is required');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('School Controller Error', {
      service: 'school-controller',
      category: 'SCHOOL',
      event: 'School deletion failed',
      tenant_code: req.tenantCode,
      school_id: req.params.id,
      error: error.message,
         
   }

   /**
    * if method
    */
   async function if() {

      return res.status(400).json({
      success: false,
      error: {
      code: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(404).json({
      success: false,
      error: {
      code: 'NOT_FOUND',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * getSchoolStats method
    */
   async function getSchoolStats() {

      try {
      const tenantCode = req.tenantCode;
      const schoolId = req.params.id;

      if (!schoolId || isNaN(schoolId)) {
      throw ErrorFactory.validation('Valid school ID is required');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('School Controller Error', {
      service: 'school-controller',
      category: 'SCHOOL',
      event: 'School statistics retrieval failed',
      tenant_code: req.tenantCode,
      school_id: req.params.id,
      error: error.message,
         
   }

   /**
    * if method
    */
   async function if() {

      return res.status(400).json({
      success: false,
      error: {
      code: 'VALIDATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   /**
    * if method
    */
   async function if() {

      return res.status(404).json({
      success: false,
      error: {
      code: 'NOT_FOUND',
      message: error.message,
      timestamp: new Date().toISOString(),
               
   }

   return {
      createSchool,
      if,
      catch,
      if,
      if,
      getSchools,
      catch,
      getSchoolById,
      catch,
      if,
      if,
      updateSchool,
      catch,
      if,
      if,
      if,
      deleteSchool,
      catch,
      if,
      if,
      getSchoolStats,
      catch,
      if,
      if
   };
}

module.exports = SchoolController;
