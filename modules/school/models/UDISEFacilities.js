const { DataTypes } = require('sequelize');

/**
 * UDISE+ Facilities Model
 * School facilities and infrastructure tracking as per UDISE+ requirements
 */
function defineUDISEFacilities(sequelize) {
   const UDISEFacilities = sequelize.define(
      'UDISEFacilities',
      {
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

         // Basic Infrastructure
         total_classrooms: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Total number of classrooms',
         },
         classrooms_in_good_condition: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Classrooms in good condition',
         },
         classrooms_requiring_major_repair: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Classrooms requiring major repair',
         },
         classrooms_requiring_minor_repair: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Classrooms requiring minor repair',
         },

         // Building and Rooms
         other_rooms: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Other rooms (office, store, etc.)',
         },
         covered_area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Total covered area in square meters',
         },
         playground_area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Playground area in square meters',
         },

         // Boundary and Security
         boundary_wall: {
            type: DataTypes.ENUM('COMPLETE', 'PARTIAL', 'NONE'),
            allowNull: false,
            defaultValue: 'NONE',
            comment: 'Boundary wall status',
         },
         gate_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'School gate availability',
         },

         // Water Facilities
         drinking_water_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Drinking water facility available',
         },
         drinking_water_source: {
            type: DataTypes.ENUM(
               'TAP_WATER',
               'HAND_PUMP',
               'WELL',
               'PACKAGED_WATER',
               'NO_WATER_FACILITY',
               'OTHER',
            ),
            allowNull: true,
            comment: 'Source of drinking water',
         },
         water_purifier: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Water purifier/treatment available',
         },
         hand_wash_facility: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Hand wash facility with soap/sanitizer',
         },

         // Toilet Facilities - Critical for UDISE+
         boys_toilet_blocks: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Number of boys toilet blocks',
         },
         girls_toilet_blocks: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Number of girls toilet blocks',
         },
         boys_toilets_functional: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Functional boys toilets',
         },
         girls_toilets_functional: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Functional girls toilets',
         },
         cwsn_toilet_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'CWSN (Disabled-friendly) toilet available',
         },
         toilet_water_source: {
            type: DataTypes.ENUM(
               'CONNECTED_TO_WATER_SUPPLY',
               'NOT_CONNECTED',
               'NO_TOILET',
            ),
            allowNull: false,
            defaultValue: 'NO_TOILET',
            comment: 'Toilet water connection status',
         },

         // Electricity and Power
         electricity_connection: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Electricity connection available',
         },
         solar_panels: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Solar panels installed',
         },
         generator_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Generator/alternate power source available',
         },

         // Laboratory Facilities
         science_laboratory: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Science laboratory available',
         },
         mathematics_laboratory: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Mathematics laboratory available',
         },
         computer_laboratory: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Computer laboratory available',
         },
         language_laboratory: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Language laboratory available',
         },

         // Library and Learning Resources
         library_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Library facility available',
         },
         library_books_total: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 0 },
            comment: 'Total number of books in library',
         },
         reading_room_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Separate reading room available',
         },

         // Digital Infrastructure
         computers_available: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Total number of computers',
         },
         computers_functional: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Number of functional computers',
         },
         internet_connection: {
            type: DataTypes.ENUM('BROADBAND', 'DIAL_UP', 'MOBILE_DATA', 'NONE'),
            allowNull: false,
            defaultValue: 'NONE',
            comment: 'Internet connectivity type',
         },
         digital_classroom: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Digital classroom/smart board available',
         },

         // Kitchen and Nutrition
         kitchen_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Kitchen for mid-day meals available',
         },
         kitchen_type: {
            type: DataTypes.ENUM('PUCCA', 'PARTLY_PUCCA', 'KUCCHA', 'NO_KITCHEN'),
            allowNull: false,
            defaultValue: 'NO_KITCHEN',
            comment: 'Type of kitchen facility',
         },
         cooking_gas_connection: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'LPG/cooking gas connection available',
         },

         // Transportation
         school_transport_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'School transport facility available',
         },
         number_of_vehicles: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Number of school vehicles',
         },

         // Medical and Health
         medical_checkup_facility: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Medical checkup facility available',
         },
         first_aid_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'First aid facility available',
         },

         // Ramp and Accessibility
         ramp_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Ramp for disabled access available',
         },
         handrails_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Handrails for disabled access available',
         },

         // Sports and Recreation
         playground_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Playground facility available',
         },
         sports_equipment: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Available sports equipment inventory',
            /* Example structure:
            {
               "indoor": ["chess", "carrom", "table_tennis"],
               "outdoor": ["cricket", "football", "volleyball"],
               "athletics": ["running_track", "long_jump_pit"]
            }
            */
         },

         // Additional Facilities
         auditorium_available: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Auditorium/multipurpose hall available',
         },
         staff_quarters: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Number of staff quarters',
         },

         // Maintenance and Safety
         fire_extinguisher: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Fire safety equipment available',
         },
         cctv_cameras: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Number of CCTV cameras installed',
         },

         // Assessment Details
         assessment_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date of facility assessment',
         },
         assessed_by: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Person/authority who assessed facilities',
         },
         next_assessment_due: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Next facility assessment due date',
         },

         // Compliance and Remarks
         compliance_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            validate: { min: 0, max: 100 },
            comment: 'Overall facility compliance score (0-100)',
         },
         deficiencies: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'List of facility deficiencies identified',
         },
         improvement_plan: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Facility improvement action plan',
         },

         // Audit Trail
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who created the record',
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who last updated the record',
         },
      },
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

   // Instance methods
   UDISEFacilities.prototype.getBasicFacilitiesScore = function () {
      let score = 0;
      const basicFacilities = [
         'drinking_water_available',
         'electricity_connection',
         'boundary_wall',
         'playground_available',
      ];

      basicFacilities.forEach((facility) => {
         if (this[facility] === true || this[facility] === 'COMPLETE') {
            score += 25;
         }
      });

      return score;
   };

   UDISEFacilities.prototype.getToiletComplianceScore = function () {
      let score = 0;

      // Boys toilet compliance
      if (this.boys_toilets_functional > 0) {score += 25;}

      // Girls toilet compliance
      if (this.girls_toilets_functional > 0) {score += 25;}

      // CWSN toilet compliance
      if (this.cwsn_toilet_available) {score += 25;}

      // Water connection to toilets
      if (this.toilet_water_source === 'CONNECTED_TO_WATER_SUPPLY') {score += 25;}

      return score;
   };

   UDISEFacilities.prototype.getDigitalInfrastructureScore = function () {
      let score = 0;

      if (this.computers_functional > 0) {score += 30;}
      if (this.internet_connection !== 'NONE') {score += 30;}
      if (this.digital_classroom) {score += 40;}

      return score;
   };

   return UDISEFacilities;
}

module.exports = { defineUDISEFacilities };
