const { defineStudent } = require('./Student');
const { defineStudentAssociations, defineStudentMethods } = require('./StudentAssociations');
const StudentMethods = require('./StudentMethods');
const {
   createStudentSchema,
   updateStudentSchema,
   queryStudentSchema,
   transferStudentSchema,
   graduateStudentSchema,
   bulkStudentSchema,
   commonValidation,
} = require('./StudentValidation');

/**
 * Student Model - Main Index
 * Combines all Student model components into a cohesive module
 * File size: ~80 lines (within industry standards)
 */

let Student = null;

/**
 * Initialize the Student model with all its components
 */
const initializeStudent = (sequelize, models) => {
   // Define the base model
   Student = defineStudent(sequelize);

   // Add instance methods
   Object.assign(Student.prototype, {
      getFullName: StudentMethods.getFullName,
      getAge: StudentMethods.getAge,
      isActive: StudentMethods.isActive,
      isAdmissionApproved: StudentMethods.isAdmissionApproved,
      getPrimaryContact: StudentMethods.getPrimaryContact,
      getAllContacts: StudentMethods.getAllContacts,
      hasSpecialMedicalNeeds: StudentMethods.hasSpecialMedicalNeeds,
      getMedicalSummary: StudentMethods.getMedicalSummary,
      requiresTransport: StudentMethods.requiresTransport,
      getTransportDetails: StudentMethods.getTransportDetails,
      isHostelStudent: StudentMethods.isHostelStudent,
      getHostelDetails: StudentMethods.getHostelDetails,
      hasScholarship: StudentMethods.hasScholarship,
      getScholarshipDetails: StudentMethods.getScholarshipDetails,
      getFormattedAddress: StudentMethods.getFormattedAddress,
      canBePromoted: StudentMethods.canBePromoted,
      canBeTransferred: StudentMethods.canBeTransferred,
      getDisplayName: StudentMethods.getDisplayName,
      getAcademicSession: StudentMethods.getAcademicSession,
   });

   // Add static methods
   Object.assign(Student, {
      generateAdmissionNumber: StudentMethods.generateAdmissionNumber,
      getStatsBySchool: StudentMethods.getStatsBySchool,
      bulkUpdateStatus: StudentMethods.bulkUpdateStatus,
      findStudentsDueForPromotion: StudentMethods.findStudentsDueForPromotion,
   });

   // Define associations if models are available
   if (models) {
      defineStudentAssociations({ ...models, Student });
      defineStudentMethods({ ...models, Student });
   }

   return Student;
};

/**
 * Set up associations after all models are loaded
 */
const setupStudentAssociations = (models) => {
   if (Student && models) {
      defineStudentAssociations({ ...models, Student });
      defineStudentMethods({ ...models, Student });
   }
};

module.exports = {
   initializeStudent,
   setupStudentAssociations,

   // Export validation schemas for external use
   validationSchemas: {
      create: createStudentSchema,
      update: updateStudentSchema,
      query: queryStudentSchema,
      transfer: transferStudentSchema,
      graduate: graduateStudentSchema,
      bulk: bulkStudentSchema,
      common: commonValidation,
   },

   // Export getter for the Student model (after initialization)
   get Student() {
      return Student;
   },
};
