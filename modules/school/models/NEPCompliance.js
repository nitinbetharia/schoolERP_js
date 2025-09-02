const { DataTypes } = require('sequelize');

/**
 * NEP 2020 Compliance Model
 * Tracks NEP 2020 adoption and implementation status
 */
const defineNEPCompliance = (sequelize) => {
   const NEPCompliance = sequelize.define(
      'NEPCompliance',
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
         adoption_status: {
            type: DataTypes.ENUM(
               'NOT_ADOPTED',
               'PLANNING',
               'PARTIAL',
               'FULL',
               'CERTIFIED',
            ),
            allowNull: false,
            defaultValue: 'NOT_ADOPTED',
         },
         adoption_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Date when NEP 2020 adoption started',
         },
         target_completion_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Target date for full NEP implementation',
         },
         academic_year_from: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment:
          'Academic year from which NEP is implemented (e.g., "2024-25")',
         },
         implementation_phases: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               foundational_stage: { implemented: false, date: null },
               preparatory_stage: { implemented: false, date: null },
               middle_stage: { implemented: false, date: null },
               secondary_stage: { implemented: false, date: null },
            },
            comment: 'Stage-wise NEP implementation tracking',
         },
         assessment_framework: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               competency_based: false,
               portfolio_assessment: false,
               peer_assessment: false,
               self_assessment: false,
               formative_assessment: false,
               summative_assessment: true,
            },
            comment: 'Assessment methods being used',
         },
         curriculum_compliance: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               multidisciplinary: false,
               experiential_learning: false,
               critical_thinking: false,
               creativity_focus: false,
               life_skills: false,
               values_education: false,
            },
            comment: 'Curriculum compliance with NEP guidelines',
         },
         language_policy: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               mother_tongue_education: false,
               three_language_formula: false,
               multilingual_support: false,
               regional_language: null,
               languages_offered: [],
            },
            comment: 'Language education policy implementation',
         },
         teacher_training: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               nep_orientation_completed: 0,
               total_teachers: 0,
               training_completion_percentage: 0,
               last_training_date: null,
            },
            comment: 'Teacher training status for NEP implementation',
         },
         infrastructure_readiness: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
               digital_infrastructure: false,
               science_labs: false,
               computer_labs: false,
               library_updated: false,
               playground_facilities: false,
               art_integration_space: false,
            },
            comment: 'Infrastructure readiness for NEP implementation',
         },
         compliance_score: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.0,
            comment: 'Overall NEP compliance score (0-100)',
         },
         last_assessment_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last NEP compliance assessment date',
         },
         assessment_officer: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID of NEP assessment officer',
         },
         challenges: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Implementation challenges and notes',
         },
         is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
         },
         created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
         },
         updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
         tableName: 'nep_compliance',
         timestamps: true,
         createdAt: 'created_at',
         updatedAt: 'updated_at',
         indexes: [
            {
               unique: true,
               fields: ['school_id'],
               name: 'idx_nep_compliance_school',
            },
            {
               fields: ['adoption_status'],
               name: 'idx_nep_compliance_status',
            },
            {
               fields: ['academic_year_from'],
               name: 'idx_nep_compliance_year',
            },
            {
               fields: ['compliance_score'],
               name: 'idx_nep_compliance_score',
            },
         ],
      },
   );

   // Define associations
   NEPCompliance.associate = (models) => {
      NEPCompliance.belongsTo(models.School, {
         foreignKey: 'school_id',
         as: 'school',
      });
   };

   return NEPCompliance;
};

module.exports = { defineNEPCompliance };
