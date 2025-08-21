const { DataTypes } = require("sequelize");
const { logger } = require("../../../utils/logger");

/**
 * International Board Compliance Model
 * Handles compliance for international education boards and curricula
 * Covers IB, Cambridge, Edexcel, and other international programs
 */
const defineInternationalBoardCompliance = (sequelize) => {
  const InternationalBoardCompliance = sequelize.define(
    "InternationalBoardCompliance",
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
          model: "schools",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      // Board Identification
      international_board: {
        type: DataTypes.ENUM(
          "IB_PYP",
          "IB_MYP",
          "IB_DP",
          "IB_CP",
          "CAMBRIDGE_PRIMARY",
          "CAMBRIDGE_LOWER_SECONDARY",
          "CAMBRIDGE_IGCSE",
          "CAMBRIDGE_AS_A_LEVEL",
          "EDEXCEL_INTERNATIONAL",
          "PEARSON_EDEXCEL",
          "AMERICAN_CURRICULUM",
          "CANADIAN_CURRICULUM",
          "AUSTRALIAN_CURRICULUM",
          "FRENCH_BACCALAUREAT",
          "GERMAN_ABITUR",
          "MONTESSORI",
          "WALDORF_STEINER",
          "OTHER_INTERNATIONAL",
        ),
        allowNull: false,
        comment: "International education board/curriculum",
      },
      board_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Board-specific school code/ID",
      },
      authorization_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Board authorization/accreditation number",
      },

      // Authorization Status
      authorization_status: {
        type: DataTypes.ENUM(
          "INTERESTED",
          "CANDIDATE",
          "AUTHORIZED",
          "PROVISIONAL",
          "CONDITIONAL",
          "SUSPENDED",
          "WITHDRAWN",
          "EXPIRED",
        ),
        allowNull: false,
        defaultValue: "INTERESTED",
      },
      authorization_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date of board authorization",
      },
      authorization_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Authorization expiry date (if applicable)",
      },

      // Programme Details
      programmes_offered: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Specific programmes offered (PYP, MYP, DP, etc.)",
      },
      grade_levels_authorized: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Grade levels authorized for each programme",
      },
      languages_of_instruction: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Authorized languages of instruction",
      },

      // Curriculum Implementation
      curriculum_framework_adopted: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Details of curriculum framework implementation",
      },
      assessment_philosophy: {
        type: DataTypes.ENUM(
          "FORMATIVE_FOCUS",
          "SUMMATIVE_FOCUS",
          "BALANCED",
          "COMPETENCY_BASED",
        ),
        allowNull: false,
        defaultValue: "BALANCED",
      },
      learner_profile_implementation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Implementation of international learner profile",
      },

      // NEP 2020 Integration (for schools in India)
      nep_integration_approach: {
        type: DataTypes.ENUM(
          "NO_INTEGRATION",
          "SELECTIVE",
          "HYBRID",
          "FULL_INTEGRATION",
        ),
        allowNull: false,
        defaultValue: "NO_INTEGRATION",
      },
      indian_context_integration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Integration of Indian cultural and educational context",
      },
      multilingual_approach: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Implementation of multilingual education approach",
      },

      // Teacher Qualifications
      teacher_qualification_requirements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Board-specific teacher qualification requirements",
      },
      teacher_training_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Teacher training completion status",
      },
      professional_development_hours: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Annual professional development hours requirement",
      },

      // Assessment and Examinations
      internal_assessment_framework: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Internal assessment framework and standards",
      },
      external_examination_details: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "External examination details and schedules",
      },
      moderation_requirements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Assessment moderation requirements and compliance",
      },

      // Digital Infrastructure
      learning_management_system: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "LMS and digital learning platform details",
      },
      board_portal_access: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Access to board-specific portals and resources",
      },
      digital_assessment_capability: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Capability to conduct digital assessments",
      },

      // International Accreditation
      additional_accreditations: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional international accreditations (CIS, NEASC, etc.)",
      },
      quality_assurance_framework: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Quality assurance and continuous improvement framework",
      },

      // Student Services
      university_counseling_provision: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "University counseling and guidance services",
      },
      international_student_support: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Support services for international students",
      },
      extended_essay_supervision: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Extended essay supervision capability (IB specific)",
      },

      // Facilities and Resources
      specialized_facilities_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Specialized facilities required by international board",
      },
      library_resources_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "International curriculum library resources",
      },
      technology_integration_level: {
        type: DataTypes.ENUM("BASIC", "INTERMEDIATE", "ADVANCED", "INNOVATIVE"),
        allowNull: false,
        defaultValue: "BASIC",
      },

      // Financial Compliance
      annual_fees_to_board: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Annual fees and payments to international board",
      },
      examination_fees_structure: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Student examination fees structure",
      },
      financial_audit_requirements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Board-specific financial audit requirements",
      },

      // Compliance and Monitoring
      annual_reporting_requirements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Annual reporting requirements to board",
      },
      evaluation_visit_schedule: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Board evaluation visit schedule and reports",
      },
      action_plan_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Compliance with board action plans and recommendations",
      },

      // Transfer and Recognition
      credential_recognition_authority: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Authority to issue internationally recognized credentials",
      },
      transcript_format_compliance: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Compliance with international transcript formats",
      },
      university_recognition_status: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "University recognition status in different countries",
      },

      // Innovation and Research
      educational_research_participation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Participation in educational research initiatives",
      },
      pilot_programme_participation: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Participation in board pilot programmes",
      },

      // Regional Coordination
      regional_coordinator: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Regional coordinator contact information",
      },
      regional_workshops_attendance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Attendance at regional workshops and conferences",
      },

      // Performance Metrics
      student_performance_trends: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Historical student performance in board assessments",
      },
      university_admission_success: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "University admission success rates",
      },

      // Overall Compliance
      compliance_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Overall international board compliance score (0-100)",
      },
      compliance_rating: {
        type: DataTypes.ENUM(
          "EXEMPLARY",
          "PROFICIENT",
          "DEVELOPING",
          "BEGINNING",
          "NOT_MEETING",
        ),
        allowNull: false,
        defaultValue: "DEVELOPING",
      },

      // Contact Information
      board_representative: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Board representative contact information",
      },
      emergency_contact: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Emergency contact for board matters",
      },

      // Audit Fields
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "User who created this record",
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "User who last updated this record",
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
      tableName: "international_board_compliance",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["school_id", "international_board"],
          name: "intl_board_school_unique",
        },
        {
          fields: ["authorization_number"],
          name: "intl_auth_number_idx",
        },
        {
          fields: ["authorization_status"],
          name: "intl_auth_status_idx",
        },
        {
          fields: ["international_board"],
          name: "intl_board_type_idx",
        },
      ],
      hooks: {
        beforeValidate: (intlBoardCompliance) => {
          // Validate authorization expiry date
          if (
            intlBoardCompliance.authorization_expiry &&
            intlBoardCompliance.authorization_date
          ) {
            const authDate = new Date(intlBoardCompliance.authorization_date);
            const expiryDate = new Date(
              intlBoardCompliance.authorization_expiry,
            );
            if (expiryDate <= authDate) {
              throw new Error(
                "Authorization expiry date must be after authorization date",
              );
            }
          }
        },

        beforeSave: (intlBoardCompliance) => {
          // Auto-calculate compliance score
          let score = 0;

          // Authorization status (30 points)
          switch (intlBoardCompliance.authorization_status) {
            case "AUTHORIZED":
              score += 30;
              break;
            case "PROVISIONAL":
              score += 22;
              break;
            case "CONDITIONAL":
              score += 15;
              break;
            case "CANDIDATE":
              score += 10;
              break;
            case "INTERESTED":
              score += 5;
              break;
          }

          // Teacher compliance (20 points)
          const teacherCompliance =
            intlBoardCompliance.teacher_training_compliance || {};
          if (Object.keys(teacherCompliance).length > 0) score += 20;

          // Assessment framework (15 points)
          if (intlBoardCompliance.internal_assessment_framework) score += 8;
          if (intlBoardCompliance.digital_assessment_capability) score += 7;

          // Facilities and resources (15 points)
          const facilitiesCompliance =
            intlBoardCompliance.specialized_facilities_compliance || {};
          if (Object.keys(facilitiesCompliance).length > 0) score += 8;
          if (
            intlBoardCompliance.technology_integration_level === "ADVANCED" ||
            intlBoardCompliance.technology_integration_level === "INNOVATIVE"
          )
            score += 7;

          // International integration (10 points)
          if (intlBoardCompliance.university_counseling_provision) score += 5;
          if (intlBoardCompliance.international_student_support) score += 5;

          // Reporting and compliance (10 points)
          const reportingCompliance =
            intlBoardCompliance.annual_reporting_requirements || {};
          if (Object.keys(reportingCompliance).length > 0) score += 10;

          intlBoardCompliance.compliance_score = Math.min(score, 100);

          // Assign compliance rating based on score
          if (score >= 90) intlBoardCompliance.compliance_rating = "EXEMPLARY";
          else if (score >= 75)
            intlBoardCompliance.compliance_rating = "PROFICIENT";
          else if (score >= 60)
            intlBoardCompliance.compliance_rating = "DEVELOPING";
          else if (score >= 40)
            intlBoardCompliance.compliance_rating = "BEGINNING";
          else intlBoardCompliance.compliance_rating = "NOT_MEETING";
        },
      },
    },
  );

  return InternationalBoardCompliance;
};

module.exports = defineInternationalBoardCompliance;
