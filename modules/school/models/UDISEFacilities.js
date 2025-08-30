const { DataTypes } = require('sequelize');

// Import specialized field modules
const { getInfrastructureFields } = require('./udise-facilities/InfrastructureFields');
const { getWaterSanitationFields } = require('./udise-facilities/WaterSanitationFields');
const { getTechnologyDigitalFields } = require('./udise-facilities/TechnologyDigitalFields');
const { getKitchenNutritionFields } = require('./udise-facilities/KitchenNutritionFields');
const { getTransportationFields } = require('./udise-facilities/TransportationFields');
const { getSafetySecurityFields } = require('./udise-facilities/SafetySecurityFields');
const { getComplianceAssessmentFields } = require('./udise-facilities/ComplianceAssessmentFields');

// Import calculation methods
const {
   getBasicFacilitiesScore,
   getToiletComplianceScore,
   getDigitalInfrastructureScore,
   getSafetySecurityScore,
   getAccessibilityScore,
   calculateOverallComplianceScore,
   getComplianceLevel,
   getFacilityDeficiencies,
} = require('./udise-facilities/CalculationMethods');

/**
 * UDISE+ Facilities Model - Main Coordinator
 * School facilities and infrastructure tracking as per UDISE+ requirements
 * 
 * Following modular architecture established by copilot refactoring:
 * - InfrastructureFields: Basic classroom and building infrastructure
 * - WaterSanitationFields: Water supply and toilet facilities
 * - TechnologyDigitalFields: Computer labs, internet connectivity
 * - KitchenNutritionFields: Mid-day meal facilities
 * - TransportationFields: School transport facilities
 * - SafetySecurityFields: Safety, security, and accessibility
 * - ComplianceAssessmentFields: Scoring and audit fields
 * - CalculationMethods: Scoring calculation methods
 */
function defineUDISEFacilities(sequelize) {
   // Combine all field definitions
   const allFields = {
      // Core identification fields
      id: {
         type: DataTypes.INTEGER,
         primaryKey: true,
         autoIncrement: true,
      },
      udise_school_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         references: {
            model: 'udise_schools',
            key: 'id',
         },
         comment: 'Reference to UDISE school record',
      },
      assessment_year: {
         type: DataTypes.STRING(9),
         allowNull: false,
         comment: 'Academic year for facility assessment (e.g., 2024-2025)',
      },

      // Import all specialized field groups
      ...getInfrastructureFields(),
      ...getWaterSanitationFields(),
      ...getTechnologyDigitalFields(),
      ...getKitchenNutritionFields(),
      ...getTransportationFields(),
      ...getSafetySecurityFields(),
      ...getComplianceAssessmentFields(),
   };

   const UDISEFacilities = sequelize.define(
      'UDISEFacilities',
      allFields,
      {
         tableName: 'udise_facilities',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'idx_udise_facilities_school_year',
               fields: ['udise_school_id', 'assessment_year'],
               unique: true,
            },
            {
               name: 'idx_udise_facilities_compliance',
               fields: ['compliance_score', 'assessment_date'],
            },
            {
               name: 'idx_udise_facilities_basic',
               fields: [
                  'drinking_water_available',
                  'boys_toilets_functional',
                  'girls_toilets_functional',
               ],
            },
         ],
      },
   );

   // Model associations
   UDISEFacilities.associate = function (models) {
      // Belongs to UDISE School
      UDISEFacilities.belongsTo(models.UDISESchool, {
         foreignKey: 'udise_school_id',
         as: 'udiseSchool',
         onDelete: 'CASCADE',
         onUpdate: 'CASCADE',
      });
   };

   // Add instance methods from CalculationMethods module
   UDISEFacilities.prototype.getBasicFacilitiesScore = getBasicFacilitiesScore;
   UDISEFacilities.prototype.getToiletComplianceScore = getToiletComplianceScore;
   UDISEFacilities.prototype.getDigitalInfrastructureScore = getDigitalInfrastructureScore;
   UDISEFacilities.prototype.getSafetySecurityScore = getSafetySecurityScore;
   UDISEFacilities.prototype.getAccessibilityScore = getAccessibilityScore;
   UDISEFacilities.prototype.calculateOverallComplianceScore = calculateOverallComplianceScore;
   UDISEFacilities.prototype.getComplianceLevel = getComplianceLevel;
   UDISEFacilities.prototype.getFacilityDeficiencies = getFacilityDeficiencies;

   return UDISEFacilities;
}

module.exports = { defineUDISEFacilities };
