const { DataTypes } = require('sequelize');
const { logger } = require('../../../utils/logger');

/**
 * CBSE Board Compliance Model
 * Specific compliance tracking for Central Board of Secondary Education
 * Handles CBSE affiliation, assessment frameworks, and submission requirements
 */
const defineCBSECompliance = (sequelize) => {
   const CBSECompliance = sequelize.define(
      'CBSECompliance',
      {
         id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
         },
         school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: 'schools',
               key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
         },
         affiliation_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            comment: 'CBSE affiliation number (11-digit)',
         },
         school_code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: 'CBSE school code',
         },
         affiliation_level: {
            type: DataTypes.ENUM(
               'PRIMARY',
               'SECONDARY',
               'SENIOR_SECONDARY',
               'PRIMARY_SECONDARY',
               'SECONDARY_SENIOR_SECONDARY',
               'PRIMARY_SECONDARY_SENIOR_SECONDARY'
            ),
            allowNull: false,
            comment: 'Level of CBSE affiliation',
         },
         affiliation_status: {
            type: DataTypes.ENUM('APPLIED', 'PROVISIONAL', 'REGULAR', 'SUSPENDED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'APPLIED',
         },
         validity_period: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Start and end dates for affiliation validity',
         },
         region_code: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: 'CBSE regional office code',
         },
         zone: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'CBSE zone (Delhi, Chennai, Allahabad, etc.)',
         },

         // Academic Structure
         curriculum_adopted: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'CBSE curriculum adoption details by class',
         },
         assessment_framework: {
            type: DataTypes.ENUM('CCE', 'CBSE_ASSESSMENT', 'NEP_2020_COMPATIBLE'),
            allowNull: false,
            defaultValue: 'CBSE_ASSESSMENT',
            comment: 'Assessment framework being followed',
         },
         examination_schedule: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Board examination schedules and internal assessment dates',
         },

         // NEP 2020 Integration
         nep_adoption_status: {
            type: DataTypes.ENUM('NOT_ADOPTED', 'PARTIAL', 'FULL', 'IN_PROGRESS'),
            allowNull: false,
            defaultValue: 'NOT_ADOPTED',
         },
         holistic_progress_card: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether school uses NEP 2020 holistic progress cards',
         },
         competency_based_assessment: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Implementation of competency-based assessment',
         },

         // Submission Requirements
         mandatory_submissions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Track mandatory CBSE submissions (LOC, SOA, etc.)',
         },
         last_loc_submission: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last List of Candidates submission date',
         },
         last_soa_submission: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last Scheme of Assessment submission date',
         },

         // Infrastructure Compliance
         infrastructure_compliance: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'CBSE infrastructure requirements compliance status',
         },
         teacher_qualification_compliance: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Teacher qualification as per CBSE norms',
         },

         // Digital Integration
         cbse_web_portal_access: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'CBSE web portal access credentials and status',
         },
         digilocker_integration: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Integration with DigiLocker for certificates',
         },
         academic_repository_sync: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Synchronization with CBSE Academic Repository',
         },

         // Transfer Certificates
         tc_generation_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Ability to generate CBSE format transfer certificates',
         },
         tc_template_version: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: 'Version of CBSE TC template being used',
         },

         // Compliance Tracking
         last_inspection_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last CBSE inspection date',
         },
         inspection_report: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Latest inspection report details',
         },
         compliance_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Overall compliance score (0-100)',
         },

         // Contact Information
         nodal_officer: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'CBSE nodal officer details',
         },
         regional_office_contact: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Regional office contact information',
         },

         // Audit Fields
         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User who created this record',
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User who last updated this record',
         },
         created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
      {
         tableName: 'cbse_compliance',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               unique: true,
               fields: ['affiliation_number'],
               name: 'cbse_affiliation_unique',
            },
            {
               fields: ['school_id'],
               name: 'cbse_school_idx',
            },
            {
               fields: ['affiliation_status', 'is_active'],
               name: 'cbse_status_idx',
            },
            {
               fields: ['region_code', 'zone'],
               name: 'cbse_region_idx',
            },
         ],
         hooks: {
            beforeValidate: (cbseCompliance) => {
               // Validate affiliation number format (11 digits)
               if (cbseCompliance.affiliation_number) {
                  const affiliationRegex = /^\d{11}$/;
                  if (!affiliationRegex.test(cbseCompliance.affiliation_number)) {
                     throw new Error('CBSE affiliation number must be 11 digits');
                  }
               }

               // Validate school code format
               if (cbseCompliance.school_code) {
                  const schoolCodeRegex = /^\d{8}$/;
                  if (!schoolCodeRegex.test(cbseCompliance.school_code)) {
                     throw new Error('CBSE school code must be 8 digits');
                  }
               }
            },

            beforeSave: (cbseCompliance) => {
               // Auto-set compliance score based on various factors
               let score = 0;

               // Basic affiliation (20 points)
               if (cbseCompliance.affiliation_status === 'REGULAR') score += 20;
               else if (cbseCompliance.affiliation_status === 'PROVISIONAL') score += 10;

               // NEP adoption (20 points)
               if (cbseCompliance.nep_adoption_status === 'FULL') score += 20;
               else if (cbseCompliance.nep_adoption_status === 'PARTIAL') score += 10;

               // Digital integration (20 points)
               if (cbseCompliance.digilocker_integration) score += 10;
               if (cbseCompliance.academic_repository_sync) score += 10;

               // Assessment framework (20 points)
               if (cbseCompliance.assessment_framework === 'NEP_2020_COMPATIBLE') score += 20;
               else if (cbseCompliance.assessment_framework === 'CBSE_ASSESSMENT') score += 15;

               // Submissions compliance (20 points)
               const submissions = cbseCompliance.mandatory_submissions || {};
               const completedSubmissions = Object.values(submissions).filter((s) => s === 'COMPLETED').length;
               const totalSubmissions = Object.keys(submissions).length;
               if (totalSubmissions > 0) {
                  score += Math.round((completedSubmissions / totalSubmissions) * 20);
               }

               cbseCompliance.compliance_score = Math.min(score, 100);
            },
         },
      }
   );

   return CBSECompliance;
};

module.exports = defineCBSECompliance;
