const { 
   getSchoolFields,
   getSchoolTableOptions,
   applySchoolInstanceMethods,
   setupSchoolAssociations,
   getSchoolValidationSchemas,
} = require('./school-fields');

/**
 * School Model
 * Manages individual schools within a trust
 * 
 * Modularized: Field definitions moved to specialized modules in school-fields/
 */
const defineSchool = (sequelize) => {
   const School = sequelize.define(
      'School',
      getSchoolFields(),
      getSchoolTableOptions()
   );

   // Apply instance methods
   applySchoolInstanceMethods(School);

   // Define associations
   School.associate = function(models) {
      setupSchoolAssociations(models, School);
   };

   return School;
};

// Export both model definition and validation schemas
module.exports = { 
   defineSchool, 
   schoolValidationSchemas: getSchoolValidationSchemas(),
};
