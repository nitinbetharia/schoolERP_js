const { DataTypes } = require('sequelize');

/**
 * UDISE+ Facilities Model - Consolidated
 * All modular components integrated directly for better maintainability
 */

// Infrastructure Fields
const getInfrastructureFields = () => ({
   building_condition: {
      type: DataTypes.ENUM('GOOD', 'SATISFACTORY', 'NEEDS_REPAIR', 'POOR'),
      defaultValue: 'SATISFACTORY',
   },
   classrooms_total: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   classrooms_usable: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   playground_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   playground_size_sqm: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
   library_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   library_books_count: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
});

// Water Sanitation Fields
const getWaterSanitationFields = () => ({
   drinking_water_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   water_source_type: { type: DataTypes.ENUM('HANDPUMP', 'BOREWELL', 'MUNICIPAL', 'OTHER'), allowNull: true },
   toilet_blocks_boys: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   toilet_blocks_girls: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   handwashing_facilities: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Technology Digital Fields
const getTechnologyDigitalFields = () => ({
   computers_available: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   internet_connectivity: { type: DataTypes.BOOLEAN, defaultValue: false },
   projector_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   digital_classroom_count: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
});

// Kitchen Nutrition Fields
const getKitchenNutritionFields = () => ({
   kitchen_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   midday_meal_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   kitchen_type: { type: DataTypes.ENUM('PUCCA', 'SEMI_PUCCA', 'KACHCHA', 'OTHER'), allowNull: true },
});

// Transportation Fields
const getTransportationFields = () => ({
   transport_facility_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   vehicle_count: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   transport_coverage_km: { type: DataTypes.DECIMAL(5, 2), allowNull: true, validate: { min: 0 } },
});

// Safety Security Fields
const getSafetySecurityFields = () => ({
   boundary_wall_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   security_guard_available: { type: DataTypes.BOOLEAN, defaultValue: false },
   cctv_cameras_count: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
   fire_safety_equipment: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// Compliance Assessment Fields
const getComplianceAssessmentFields = () => ({
   last_inspection_date: { type: DataTypes.DATE, allowNull: true },
   compliance_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true, validate: { min: 0, max: 100 } },
   improvement_areas: { type: DataTypes.JSON, allowNull: true },
});

// Calculation Methods
const getBasicFacilitiesScore = function () {
   let score = 0;
   if (this.building_condition === 'GOOD') {
      score += 20;
   }
   if (this.classrooms_usable >= this.classrooms_total * 0.8) {
      score += 20;
   }
   if (this.playground_available) {
      score += 20;
   }
   if (this.library_available) {
      score += 20;
   }
   if (this.drinking_water_available) {
      score += 20;
   }
   return score;
};

const getToiletComplianceScore = function () {
   let score = 0;
   if (this.toilet_blocks_boys > 0) {
      score += 50;
   }
   if (this.toilet_blocks_girls > 0) {
      score += 50;
   }
   return score;
};

const getDigitalInfrastructureScore = function () {
   let score = 0;
   if (this.computers_available > 0) {
      score += 25;
   }
   if (this.internet_connectivity) {
      score += 25;
   }
   if (this.projector_available) {
      score += 25;
   }
   if (this.digital_classroom_count > 0) {
      score += 25;
   }
   return score;
};

const getSafetySecurityScore = function () {
   let score = 0;
   if (this.boundary_wall_available) {
      score += 25;
   }
   if (this.security_guard_available) {
      score += 25;
   }
   if (this.cctv_cameras_count > 0) {
      score += 25;
   }
   if (this.fire_safety_equipment) {
      score += 25;
   }
   return score;
};

const getAccessibilityScore = function () {
   return this.transport_facility_available ? 100 : 0;
};

const calculateOverallComplianceScore = function () {
   const basic = getBasicFacilitiesScore.call(this);
   const toilet = getToiletComplianceScore.call(this);
   const digital = getDigitalInfrastructureScore.call(this);
   const safety = getSafetySecurityScore.call(this);
   const access = getAccessibilityScore.call(this);
   return Math.round((basic + toilet + digital + safety + access) / 5);
};

const getComplianceLevel = function () {
   const score = calculateOverallComplianceScore.call(this);
   if (score >= 80) {
      return 'EXCELLENT';
   }
   if (score >= 60) {
      return 'GOOD';
   }
   if (score >= 40) {
      return 'SATISFACTORY';
   }
   return 'NEEDS_IMPROVEMENT';
};

const getFacilityDeficiencies = function () {
   const deficiencies = [];
   if (!this.drinking_water_available) {
      deficiencies.push('Drinking water not available');
   }
   if (this.toilet_blocks_boys === 0) {
      deficiencies.push('No boys toilet blocks');
   }
   if (this.toilet_blocks_girls === 0) {
      deficiencies.push('No girls toilet blocks');
   }
   if (!this.playground_available) {
      deficiencies.push('Playground not available');
   }
   if (!this.library_available) {
      deficiencies.push('Library not available');
   }
   return deficiencies;
};

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

   const UDISEFacilities = sequelize.define('UDISEFacilities', allFields, {
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
            fields: ['drinking_water_available', 'boys_toilets_functional', 'girls_toilets_functional'],
         },
      ],
   });

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
