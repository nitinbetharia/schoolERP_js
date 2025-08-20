const { DataTypes } = require('sequelize');

/**
 * UDISE+ Class Infrastructure Model
 * Class-wise enrollment and infrastructure data for government reporting
 */
function defineUDISEClassInfrastructure(sequelize) {
   const UDISEClassInfrastructure = sequelize.define(
      'UDISEClassInfrastructure',
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
         academic_year: {
            type: DataTypes.STRING(9),
            allowNull: false,
            comment: 'Academic year (e.g., 2024-2025)',
         },

         // Class Information
         class_name: {
            type: DataTypes.ENUM(
               'PRE_PRIMARY',
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
               'XII'
            ),
            allowNull: false,
            comment: 'Class/Grade name as per UDISE+ classification',
         },
         class_type: {
            type: DataTypes.ENUM('REGULAR', 'SPECIAL_TRAINING', 'BRIDGE_COURSE', 'OTHER'),
            allowNull: false,
            defaultValue: 'REGULAR',
            comment: 'Type of class instruction',
         },

         // Enrollment Data by Gender
         boys_enrolled: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
               min: 0,
            },
            comment: 'Number of boys enrolled',
         },
         girls_enrolled: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
               min: 0,
            },
            comment: 'Number of girls enrolled',
         },
         transgender_enrolled: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
               min: 0,
            },
            comment: 'Number of transgender students enrolled',
         },

         // Category-wise Enrollment (Social Categories)
         general_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
         },
         general_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
         },
         sc_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Scheduled Caste boys',
         },
         sc_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Scheduled Caste girls',
         },
         st_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Scheduled Tribe boys',
         },
         st_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Scheduled Tribe girls',
         },
         obc_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Other Backward Classes boys',
         },
         obc_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Other Backward Classes girls',
         },
         minority_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Minority community boys',
         },
         minority_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Minority community girls',
         },

         // Children with Special Needs (CWSN)
         cwsn_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Children with Special Needs - boys',
         },
         cwsn_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Children with Special Needs - girls',
         },

         // Repetition and Drop-out Data
         repeaters_boys: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Boys repeating the class',
         },
         repeaters_girls: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 },
            comment: 'Girls repeating the class',
         },

         // Age-wise Enrollment
         age_wise_enrollment: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Age-wise breakdown of enrollment',
            /* Example structure:
            {
               "age_5": {"boys": 10, "girls": 8},
               "age_6": {"boys": 15, "girls": 12},
               "age_7": {"boys": 20, "girls": 18},
               "above_age": {"boys": 5, "girls": 3}
            }
            */
         },

         // Class Infrastructure Details
         number_of_sections: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
               min: 1,
               max: 10,
            },
            comment: 'Number of sections for this class',
         },
         average_attendance_boys: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            validate: {
               min: 0,
               max: 100,
            },
            comment: 'Average attendance percentage for boys',
         },
         average_attendance_girls: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            validate: {
               min: 0,
               max: 100,
            },
            comment: 'Average attendance percentage for girls',
         },

         // Teaching Resources
         textbooks_received: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether textbooks received for this class',
         },
         textbook_details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Subject-wise textbook availability',
            /* Example structure:
            {
               "mathematics": {"received": true, "quantity": 50},
               "science": {"received": true, "quantity": 48},
               "english": {"received": false, "quantity": 0}
            }
            */
         },

         // Medium of Instruction for this Class
         medium_of_instruction: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Languages used for instruction in this class',
            /* Example structure:
            {
               "primary_language": "HINDI",
               "secondary_language": "ENGLISH", 
               "regional_language": "MARATHI"
            }
            */
         },

         // Examination Results (for classes with board exams)
         examination_results: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Class-wise examination results',
            /* Example structure for Class X/XII:
            {
               "appeared": {"boys": 45, "girls": 38},
               "passed": {"boys": 42, "girls": 36},
               "distinction": {"boys": 15, "girls": 18},
               "first_class": {"boys": 20, "girls": 15},
               "second_class": {"boys": 7, "girls": 3}
            }
            */
         },

         // Special Programs
         special_programs: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Special programs running for this class',
            /* Example structure:
            {
               "mid_day_meal": true,
               "uniforms_provided": true,
               "scholarships": ["merit", "sc_st"],
               "remedial_teaching": true,
               "computer_education": false
            }
            */
         },

         // Data Quality Indicators
         data_collection_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date when enrollment data was collected',
         },
         verified_by: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Name of person who verified the data',
         },
         verification_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when data was verified',
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
         tableName: 'udise_class_infrastructure',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               name: 'idx_udise_class_school_year',
               fields: ['udise_school_id', 'academic_year'],
            },
            {
               name: 'idx_udise_class_name_year',
               fields: ['udise_school_id', 'class_name', 'academic_year'],
               unique: true,
            },
            {
               name: 'idx_udise_class_enrollment',
               fields: ['academic_year', 'boys_enrolled', 'girls_enrolled'],
            },
         ],
      }
   );

   // Model associations
   UDISEClassInfrastructure.associate = function (models) {
      // Belongs to UDISE School
      UDISEClassInfrastructure.belongsTo(models.UDISESchool, {
         foreignKey: 'udise_school_id',
         as: 'udiseSchool',
         onDelete: 'CASCADE',
         onUpdate: 'CASCADE',
      });
   };

   // Instance methods
   UDISEClassInfrastructure.prototype.getTotalEnrollment = function () {
      return this.boys_enrolled + this.girls_enrolled + this.transgender_enrolled;
   };

   UDISEClassInfrastructure.prototype.getGenderRatio = function () {
      const total = this.getTotalEnrollment();
      if (total === 0) return { boys: 0, girls: 0 };

      return {
         boys: ((this.boys_enrolled / total) * 100).toFixed(2),
         girls: ((this.girls_enrolled / total) * 100).toFixed(2),
      };
   };

   UDISEClassInfrastructure.prototype.getCategoryWiseTotal = function () {
      return {
         general: this.general_boys + this.general_girls,
         sc: this.sc_boys + this.sc_girls,
         st: this.st_boys + this.st_girls,
         obc: this.obc_boys + this.obc_girls,
         minority: this.minority_boys + this.minority_girls,
         cwsn: this.cwsn_boys + this.cwsn_girls,
      };
   };

   return UDISEClassInfrastructure;
}

module.exports = { defineUDISEClassInfrastructure };
