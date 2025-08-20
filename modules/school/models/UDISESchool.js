const { DataTypes } = require('sequelize');

/**
 * UDISE+ School Registration Model
 * Comprehensive school master data as per UDISE+ requirements
 * Government compliance for annual school census reporting
 */
function defineUDISESchool(sequelize) {
   const UDISESchool = sequelize.define(
      'UDISESchool',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
               model: 'schools',
               key: 'id',
            },
            comment: 'Reference to internal school record',
         },

         // UDISE+ Core Identifiers
         udise_code: {
            type: DataTypes.STRING(11),
            allowNull: false,
            unique: true,
            validate: {
               len: [11, 11],
               isNumeric: true,
            },
            comment: '11-digit UDISE+ school code (State+District+Block+Village+School)',
         },
         udise_school_id: {
            type: DataTypes.STRING(14),
            allowNull: true,
            unique: true,
            comment: 'Extended UDISE+ school identifier',
         },
         pen_code: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: 'Permanent Education Number - School Level',
         },

         // School Basic Information
         school_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Official school name as per government records',
         },
         school_name_hindi: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'School name in Hindi/Regional language',
         },
         school_type: {
            type: DataTypes.ENUM(
               'PRIMARY_ONLY',
               'PRIMARY_WITH_UPPER_PRIMARY',
               'PRIMARY_WITH_UPPER_PRIMARY_SEC_HSEC',
               'UPPER_PRIMARY_ONLY',
               'UPPER_PRIMARY_WITH_SECONDARY',
               'UPPER_PRIMARY_WITH_SEC_HSEC',
               'SECONDARY_ONLY',
               'SECONDARY_WITH_HIGHER_SECONDARY',
               'HIGHER_SECONDARY_ONLY',
               'PRE_PRIMARY_TO_XII'
            ),
            allowNull: false,
            comment: 'School level configuration as per UDISE+ classification',
         },
         school_category: {
            type: DataTypes.ENUM('GOVERNMENT', 'GOVERNMENT_AIDED', 'PRIVATE_UNAIDED', 'CENTRAL_GOVERNMENT', 'OTHER'),
            allowNull: false,
            comment: 'School management category',
         },
         school_management: {
            type: DataTypes.ENUM(
               'DEPARTMENT_OF_EDUCATION',
               'TRIBAL_WELFARE_DEPT',
               'SOCIAL_WELFARE_DEPT',
               'PRIVATE_AIDED',
               'PRIVATE_UNAIDED',
               'CENTRAL_GOVT',
               'AUTONOMOUS_BODY',
               'OTHER'
            ),
            allowNull: false,
            comment: 'Detailed school management type',
         },

         // Location Details
         address_line1: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'School address line 1',
         },
         address_line2: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'School address line 2',
         },
         village_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Village/Ward name',
         },
         block_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Block/Tehsil name',
         },
         district_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'District name',
         },
         state_code: {
            type: DataTypes.STRING(2),
            allowNull: false,
            validate: {
               len: [2, 2],
               isNumeric: true,
            },
            comment: 'State code as per UDISE+ classification',
         },
         pincode: {
            type: DataTypes.STRING(6),
            allowNull: false,
            validate: {
               len: [6, 6],
               isNumeric: true,
            },
            comment: 'PIN code',
         },

         // Administrative Details
         assembly_constituency: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Assembly constituency',
         },
         parliament_constituency: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Parliament constituency',
         },
         municipality_ward: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Municipality/Ward number',
         },

         // School Recognition & Affiliation
         recognition_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Recognition details by education department',
            /* Example structure:
            {
               "primary": {
                  "recognized": true,
                  "recognition_date": "2010-04-01",
                  "recognition_number": "EDU/REC/2010/123"
               },
               "secondary": {
                  "recognized": true,
                  "recognition_date": "2015-04-01",
                  "recognition_number": "EDU/REC/2015/456"
               }
            }
            */
         },
         affiliation_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Board affiliation details',
            /* Example structure:
            {
               "board_type": "CBSE",
               "affiliation_number": "1234567",
               "affiliation_date": "2015-04-01",
               "validity_period": "2025-03-31"
            }
            */
         },

         // School Infrastructure Status
         building_status: {
            type: DataTypes.ENUM(
               'GOVERNMENT',
               'GOVERNMENT_SCHOOL_IN_RENT_FREE_BUILDING',
               'GOVERNMENT_SCHOOL_IN_RENTED_BUILDING',
               'PRIVATE',
               'OTHER'
            ),
            allowNull: false,
            comment: 'School building ownership status',
         },
         building_type: {
            type: DataTypes.ENUM('PUCCA', 'PARTLY_PUCCA', 'KUCCHA', 'TENT', 'OTHER'),
            allowNull: false,
            comment: 'Type of school building',
         },

         // School Timings & Working Days
         academic_session: {
            type: DataTypes.ENUM('APRIL_MARCH', 'JUNE_MAY', 'JANUARY_DECEMBER'),
            allowNull: false,
            defaultValue: 'APRIL_MARCH',
            comment: 'Academic session pattern',
         },
         working_days_per_year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 220,
            validate: {
               min: 180,
               max: 250,
            },
            comment: 'Number of working days per academic year',
         },
         school_timings: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'School timing details for different shifts',
            /* Example structure:
            {
               "shift_1": {
                  "start_time": "08:00",
                  "end_time": "14:00",
                  "classes": ["I", "II", "III", "IV", "V"]
               },
               "shift_2": {
                  "start_time": "14:30", 
                  "end_time": "20:30",
                  "classes": ["VI", "VII", "VIII", "IX", "X"]
               }
            }
            */
         },

         // Special Categories
         minority_status: {
            type: DataTypes.ENUM('MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'PARSI', 'JAIN', 'NONE'),
            allowNull: false,
            defaultValue: 'NONE',
            comment: 'Minority community status',
         },
         is_special_school: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'School for children with special needs (CWSN)',
         },
         is_residential: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Residential school/hostel facility',
         },
         is_shift_school: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'School running in shifts',
         },

         // Medium of Instruction
         medium_of_instruction: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Languages used for instruction',
            /* Example structure:
            {
               "primary": ["HINDI", "ENGLISH"],
               "secondary": ["ENGLISH"],
               "regional_languages": ["MARATHI", "GUJARATI"]
            }
            */
         },

         // UDISE+ Data Reporting
         last_census_year: {
            type: DataTypes.STRING(9),
            allowNull: true,
            comment: 'Last UDISE+ census submission (e.g., 2024-2025)',
         },
         census_submission_status: {
            type: DataTypes.ENUM('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'),
            allowNull: false,
            defaultValue: 'PENDING',
            comment: 'Annual census data submission status',
         },
         data_verification_status: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'UDISE+ data verification details',
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
         tableName: 'udise_schools',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            // Note: udise_code, school_id, and udise_school_id already have unique: true in field definitions
            // Only adding non-unique indexes here
            {
               name: 'idx_udise_schools_location',
               fields: ['state_code', 'district_name', 'block_name'],
            },
            {
               name: 'idx_udise_schools_category',
               fields: ['school_category', 'school_type'],
            },
            {
               name: 'idx_udise_schools_census',
               fields: ['last_census_year', 'census_submission_status'],
            },
         ],
      }
   );

   // Model associations
   UDISESchool.associate = function (models) {
      // One-to-one relationship with School
      UDISESchool.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
         onDelete: 'CASCADE',
         onUpdate: 'CASCADE',
      });

      // One-to-many relationship with UDISE facilities
      if (models.UDISEFacilities) {
         UDISESchool.hasMany(models.UDISEFacilities, {
            foreignKey: 'udise_school_id',
            as: 'facilities',
         });
      }

      // One-to-many relationship with UDISE class infrastructure
      if (models.UDISEClassInfrastructure) {
         UDISESchool.hasMany(models.UDISEClassInfrastructure, {
            foreignKey: 'udise_school_id',
            as: 'classInfrastructure',
         });
      }
   };

   return UDISESchool;
}

module.exports = { defineUDISESchool };
