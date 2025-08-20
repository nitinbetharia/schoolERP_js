const logger = require('../../../utils/logger');
const {
   ErrorFactory,
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
   DuplicateError
} = require('../../../utils/errors');

/**
 * Class Service
 * Handles class management operations within a school
 */
function createClassService() {

   this.validStandards = [
   'NURSERY',
   'LKG',
   'UKG',
   'I',
   'II',
   'III',
   'IV',
   'V',
   'VI',
   'VII',
   'VIII',
   'IX',
   'X',
   'XI',
   'XII',
   ];
   

   /**
    * createClass method
    */
   async function createClass() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation('Class name is required');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation('School ID is required');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation('Class standard is required');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('School not found');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Class name already exists in this school already exists');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Class Service Error', {
      service: 'class-service',
      category: 'CLASS',
      event: 'Class creation failed',
      tenant_code: tenantCode,
      error: error.message,
      created_by: createdBy,
         
   }

   /**
    * getClassesBySchool method
    */
   async function getClassesBySchool() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      whereConditions.status = status;
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Class Service Error', {
      service: 'class-service',
      category: 'CLASS',
      event: 'Classes retrieval failed',
      tenant_code: tenantCode,
      school_id: schoolId,
      error: error.message,
         
   }

   /**
    * getClassById method
    */
   async function getClassById() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('Class not found');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Class Service Error', {
      service: 'class-service',
      category: 'CLASS',
      event: 'Class retrieval failed',
      tenant_code: tenantCode,
      class_id: classId,
      error: error.message,
         
   }

   /**
    * updateClass method
    */
   async function updateClass() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('Class not found');
         
   }

   /**
    * if method
    */
   async function if() {

      const existingClass = await Class.findOne({
      where: {
      school_id: classInstance.school_id,
      name: classData.name,
      id: { [require('sequelize').Op.ne]: classId
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Class name already exists in this school already exists');
            
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Class Service Error', {
      service: 'class-service',
      category: 'CLASS',
      event: 'Class update failed',
      tenant_code: tenantCode,
      class_id: classId,
      error: error.message,
      updated_by: updatedBy,
         
   }

   /**
    * deleteClass method
    */
   async function deleteClass() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('Class not found');
         
   }

   /**
    * if method
    */
   async function if() {

      const activeSections = classInstance.sections.filter((section) => section.status === 'ACTIVE');
      if (activeSections.length > 0) {
      throw ErrorFactory.validation(
      'Cannot delete class with active sections. Please remove or deactivate all sections first.'
      );
            
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Class Service Error', {
      service: 'class-service',
      category: 'CLASS',
      event: 'Class deletion failed',
      tenant_code: tenantCode,
      class_id: classId,
      error: error.message,
      deleted_by: deletedBy,
         
   }

   return {
      createClass,
      if,
      if,
      if,
      if,
      if,
      catch,
      getClassesBySchool,
      if,
      catch,
      getClassById,
      if,
      catch,
      updateClass,
      if,
      if,
      if,
      catch,
      deleteClass,
      if,
      if,
      catch
   };
}

module.exports = ClassService;
