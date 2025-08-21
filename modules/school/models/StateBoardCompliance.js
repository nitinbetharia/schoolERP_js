const { DataTypes } = require("sequelize");

/**
 * State Board Compliance Model
 * Handles compliance for various Indian state education boards
 * Covers state-specific curriculum, examination patterns, and NEP 2020 implementation
 */
const defineStateBoardCompliance = (sequelize) => {
  const StateBoardCompliance = sequelize.define(
    "StateBoardCompliance",
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
      state_board: {
        type: DataTypes.ENUM(
          "MAHARASHTRA",
          "TAMIL_NADU",
          "KARNATAKA",
          "ANDHRA_PRADESH",
          "TELANGANA",
          "KERALA",
          "GUJARAT",
          "RAJASTHAN",
          "UTTAR_PRADESH",
          "MADHYA_PRADESH",
          "BIHAR",
          "WEST_BENGAL",
          "ODISHA",
          "JHARKHAND",
          "CHHATTISGARH",
          "HARYANA",
          "PUNJAB",
          "HIMACHAL_PRADESH",
          "UTTARAKHAND",
          "ASSAM",
          "MANIPUR",
          "MEGHALAYA",
          "MIZORAM",
          "NAGALAND",
          "SIKKIM",
          "TRIPURA",
          "ARUNACHAL_PRADESH",
          "GOA",
          "DELHI",
          "JAMMU_KASHMIR",
          "LADAKH",
        ),
        allowNull: false,
        comment: "State education board",
      },
      board_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "State board school code/registration number",
      },
      affiliation_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "State board affiliation/recognition number",
      },

      // Registration Details
      registration_status: {
        type: DataTypes.ENUM(
          "APPLIED",
          "PROVISIONAL",
          "PERMANENT",
          "TEMPORARY",
          "SUSPENDED",
          "CANCELLED",
        ),
        allowNull: false,
        defaultValue: "APPLIED",
      },
      recognition_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date of board recognition/affiliation",
      },
      renewal_due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Next renewal due date",
      },

      // Educational Levels
      approved_classes: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Classes approved by state board (Pre-KG to XII)",
      },
      medium_of_instruction: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Approved mediums of instruction",
      },

      // Curriculum and Assessment
      curriculum_framework: {
        type: DataTypes.ENUM(
          "STATE_CURRICULUM",
          "NCF_2005",
          "NEP_2020_ALIGNED",
          "HYBRID",
        ),
        allowNull: false,
        defaultValue: "STATE_CURRICULUM",
      },
      assessment_pattern: {
        type: DataTypes.ENUM(
          "ANNUAL",
          "SEMESTER",
          "CONTINUOUS_COMPREHENSIVE",
          "COMPETENCY_BASED",
        ),
        allowNull: false,
        defaultValue: "ANNUAL",
      },
      grading_system: {
        type: DataTypes.ENUM(
          "PERCENTAGE",
          "GRADE_POINTS",
          "LETTER_GRADES",
          "DESCRIPTIVE",
        ),
        allowNull: false,
        defaultValue: "PERCENTAGE",
      },

      // NEP 2020 Implementation
      nep_implementation_status: {
        type: DataTypes.ENUM(
          "NOT_STARTED",
          "PLANNING",
          "PILOT",
          "PARTIAL",
          "FULL",
        ),
        allowNull: false,
        defaultValue: "NOT_STARTED",
      },
      foundational_literacy_numeracy: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "FLN mission implementation status",
      },
      mother_tongue_education: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Mother tongue/local language as medium of instruction",
      },
      vocational_education_integration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Integration of vocational education",
      },
      art_integrated_learning: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Implementation of art-integrated learning",
      },

      // Examination System
      board_examination_classes: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Classes with board examinations (typically X, XII)",
      },
      internal_assessment_weightage: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Internal assessment weightage by class/subject",
      },
      practical_examination_requirements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Practical examination requirements and facilities",
      },

      // Digital Infrastructure
      digital_board_integration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Integration with state board digital systems",
      },
      online_examination_capability: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Capability to conduct online examinations",
      },
      digital_content_access: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Access to state board digital content and resources",
      },

      // Teacher Requirements
      teacher_eligibility_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Teacher eligibility as per state norms (TET, etc.)",
      },
      teacher_training_requirements: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Mandatory teacher training requirements",
      },

      // Infrastructure Compliance
      infrastructure_norms_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Compliance with state infrastructure norms",
      },
      safety_security_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Safety and security compliance as per state guidelines",
      },

      // Financial Compliance
      fee_structure_approval: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "State board approved fee structure",
      },
      financial_audit_status: {
        type: DataTypes.ENUM("NOT_REQUIRED", "PENDING", "COMPLETED", "OVERDUE"),
        allowNull: false,
        defaultValue: "NOT_REQUIRED",
      },

      // Reporting Requirements
      annual_report_submission: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Annual report submission status and details",
      },
      statistical_data_submission: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Statistical data submission to state board",
      },

      // Transfer Certificates
      tc_format_compliance: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Compliance with state board TC format",
      },
      migration_certificate_authority: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Authority to issue migration certificates",
      },

      // Regional Administration
      district_education_office: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Associated district education office",
      },
      block_education_office: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Associated block education office",
      },
      inspection_authority: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Details of inspection authority",
      },

      // Inspection and Monitoring
      last_inspection_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date of last official inspection",
      },
      inspection_report: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Latest inspection report and findings",
      },
      compliance_deficiencies: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Identified deficiencies and action taken",
      },

      // Performance Metrics
      board_exam_results: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Historical board examination results",
      },
      quality_indicators: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Quality indicators and performance metrics",
      },

      // Special Programs
      special_programs_participation: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Participation in state special programs (sports, arts, etc.)",
      },
      scholarship_programs: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "State scholarship programs student participation",
      },

      // Overall Compliance
      compliance_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Overall state board compliance score (0-100)",
      },
      compliance_status: {
        type: DataTypes.ENUM(
          "EXCELLENT",
          "GOOD",
          "SATISFACTORY",
          "NEEDS_IMPROVEMENT",
          "POOR",
        ),
        allowNull: false,
        defaultValue: "SATISFACTORY",
      },

      // Contact Information
      nodal_officer: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "School nodal officer for state board matters",
      },
      board_liaison_contact: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "State board liaison contact information",
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
      tableName: "state_board_compliance",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["school_id", "state_board"],
          name: "state_board_school_unique",
        },
        {
          fields: ["board_code"],
          name: "state_board_code_idx",
        },
        {
          fields: ["state_board", "registration_status"],
          name: "state_board_status_idx",
        },
        {
          fields: ["nep_implementation_status"],
          name: "nep_status_idx",
        },
      ],
      hooks: {
        beforeValidate: (stateBoardCompliance) => {
          // Validate renewal date is in future
          if (stateBoardCompliance.renewal_due_date) {
            const renewalDate = new Date(stateBoardCompliance.renewal_due_date);
            const today = new Date();
            if (renewalDate <= today) {
              console.warn(
                "Renewal due date should be in the future for active compliance",
              );
            }
          }
        },

        beforeSave: (stateBoardCompliance) => {
          // Auto-calculate compliance score
          let score = 0;

          // Registration status (25 points)
          if (stateBoardCompliance.registration_status === "PERMANENT")
            score += 25;
          else if (stateBoardCompliance.registration_status === "PROVISIONAL")
            score += 18;
          else if (stateBoardCompliance.registration_status === "TEMPORARY")
            score += 12;

          // NEP implementation (25 points)
          switch (stateBoardCompliance.nep_implementation_status) {
            case "FULL":
              score += 25;
              break;
            case "PARTIAL":
              score += 18;
              break;
            case "PILOT":
              score += 12;
              break;
            case "PLANNING":
              score += 6;
              break;
          }

          // Digital integration (15 points)
          if (stateBoardCompliance.digital_board_integration) score += 8;
          if (stateBoardCompliance.online_examination_capability) score += 7;

          // Teacher compliance (15 points)
          const teacherCompliance =
            stateBoardCompliance.teacher_eligibility_compliance || {};
          if (Object.keys(teacherCompliance).length > 0) score += 15;

          // Infrastructure compliance (10 points)
          const infraCompliance =
            stateBoardCompliance.infrastructure_norms_compliance || {};
          if (Object.keys(infraCompliance).length > 0) score += 10;

          // Reporting compliance (10 points)
          const annualReport =
            stateBoardCompliance.annual_report_submission || {};
          const statisticalData =
            stateBoardCompliance.statistical_data_submission || {};
          if (annualReport.status === "SUBMITTED") score += 5;
          if (statisticalData.status === "SUBMITTED") score += 5;

          stateBoardCompliance.compliance_score = Math.min(score, 100);

          // Assign compliance status based on score
          if (score >= 90) stateBoardCompliance.compliance_status = "EXCELLENT";
          else if (score >= 75) stateBoardCompliance.compliance_status = "GOOD";
          else if (score >= 60)
            stateBoardCompliance.compliance_status = "SATISFACTORY";
          else if (score >= 40)
            stateBoardCompliance.compliance_status = "NEEDS_IMPROVEMENT";
          else stateBoardCompliance.compliance_status = "POOR";
        },
      },
    },
  );

  return StateBoardCompliance;
};

module.exports = defineStateBoardCompliance;
