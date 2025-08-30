const { getInternationalBoardComplianceFields, getTableOptions } = require('./international-board-compliance');

/**
 * International Board Compliance Model
 * Handles compliance for international education boards and curricula
 * Covers IB, Cambridge, Edexcel, and other international programs
 *
 * Modularized: Field definitions moved to specialized modules in international-board-compliance/
 */
const defineInternationalBoardCompliance = (sequelize) => {
   const InternationalBoardCompliance = sequelize.define(
      'InternationalBoardCompliance',
      getInternationalBoardComplianceFields(),
      getTableOptions()
   );

   // Add model associations (if any)
   InternationalBoardCompliance.associate = function (models) {
      // Association with School model
      InternationalBoardCompliance.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
      });
   };

   return InternationalBoardCompliance;
};

module.exports = defineInternationalBoardCompliance;
