const logger = require('../../../utils/logger');
const {
   ErrorFactory,
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
   DuplicateError
} = require('../../../utils/errors');

/**
 * Section Service
 * Handles section management operations within a class
 */
function createSectionService() {

   this.defaultSectionNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
   

   /**
    * createSection method
    */
   async function createSection() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation('Section name is required');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation('Class ID is required');
         
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

      throw ErrorFactory.conflict('Section name already exists in this class already exists');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Section Service Error', {
      service: 'section-service',
      category: 'SECTION',
      event: 'Section creation failed',
      tenant_code: tenantCode,
      error: error.message,
      created_by: createdBy,
         
   }

   /**
    * getSectionsByClass method
    */
   async function getSectionsByClass() {

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

      logger.error('Section Service Error', {
      service: 'section-service',
      category: 'SECTION',
      event: 'Sections retrieval failed',
      tenant_code: tenantCode,
      class_id: classId,
      error: error.message,
         
   }

   /**
    * getSectionById method
    */
   async function getSectionById() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('Section not found');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Section Service Error', {
      service: 'section-service',
      category: 'SECTION',
      event: 'Section retrieval failed',
      tenant_code: tenantCode,
      section_id: sectionId,
      error: error.message,
         
   }

   /**
    * updateSection method
    */
   async function updateSection() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('Section not found');
         
   }

   /**
    * if method
    */
   async function if() {

      const existingSection = await Section.findOne({
      where: {
      class_id: section.class_id,
      name: sectionData.name,
      id: { [require('sequelize').Op.ne]: sectionId
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Section name already exists in this class already exists');
            
   }

   /**
    * if method
    */
   async function if() {

      if (sectionData.current_strength > sectionData.capacity) {
      throw ErrorFactory.validation('Current strength cannot exceed capacity');
            
   }

   /**
    * if method
    */
   async function if() {

      if (sectionData.current_strength > section.capacity) {
      throw ErrorFactory.validation('Current strength cannot exceed capacity');
            
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Section Service Error', {
      service: 'section-service',
      category: 'SECTION',
      event: 'Section update failed',
      tenant_code: tenantCode,
      section_id: sectionId,
      error: error.message,
      updated_by: updatedBy,
         
   }

   /**
    * deleteSection method
    */
   async function deleteSection() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('Section not found');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.validation(
      'Cannot delete section with students. Please transfer students to another section first.'
      );
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Section Service Error', {
      service: 'section-service',
      category: 'SECTION',
      event: 'Section deletion failed',
      tenant_code: tenantCode,
      section_id: sectionId,
      error: error.message,
      deleted_by: deletedBy,
         
   }

   /**
    * bulkCreateSections method
    */
   async function bulkCreateSections() {

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

      const existingNames = existingSections.map((s) => s.name);
      throw ErrorFactory.conflict(`Sections already exist: ${existingNames.join(', ')
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Section Service Error', {
      service: 'section-service',
      category: 'SECTION',
      event: 'Sections bulk creation failed',
      tenant_code: tenantCode,
      class_id: classId,
      error: error.message,
      created_by: createdBy,
         
   }

   return {
      createSection,
      if,
      if,
      if,
      if,
      catch,
      getSectionsByClass,
      if,
      catch,
      getSectionById,
      if,
      catch,
      updateSection,
      if,
      if,
      if,
      if,
      if,
      catch,
      deleteSection,
      if,
      if,
      catch,
      bulkCreateSections,
      if,
      if,
      catch
   };
}

module.exports = SectionService;
