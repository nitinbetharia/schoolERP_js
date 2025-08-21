const { DataTypes } = require("sequelize");

/**
 * UDISE Compliance Record Model
 * Tracks compliance with various government regulations and policies
 * Essential for maintaining school recognition and funding
 */
module.exports = (sequelize) => {
  const UdiseComplianceRecord = sequelize.define(
    "UdiseComplianceRecord",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: "Primary key for UDISE compliance record",
      },

      // Reference to UDISE Registration
      udise_registration_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Reference to UDISE school registration",
      },
      school_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "Reference to school in school management system",
      },

      // Compliance Period
      academic_year: {
        type: DataTypes.STRING(7),
        allowNull: false,
        comment: "Academic year for compliance record (e.g., 2024-25)",
      },
      compliance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Date when compliance was assessed",
      },

      // RTE (Right to Education) Act Compliance
      rte_compliance_status: {
        type: DataTypes.ENUM(
          "compliant",
          "partially_compliant",
          "non_compliant",
          "under_review",
        ),
        allowNull: false,
        comment: "Overall RTE Act compliance status",
      },
      rte_25_percent_admission: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment:
          "25% admission for economically weaker sections (EWS) implemented",
      },
      rte_infrastructure_norms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "RTE infrastructure norms compliance",
      },
      rte_teacher_qualification: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "RTE teacher qualification norms compliance",
      },
      rte_ptr_compliance: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Pupil-Teacher Ratio (PTR) compliance as per RTE",
      },

      // NEP 2020 (National Education Policy) Implementation
      nep_2020_implementation: {
        type: DataTypes.ENUM(
          "fully_implemented",
          "partially_implemented",
          "not_started",
          "not_applicable",
        ),
        allowNull: false,
        defaultValue: "not_started",
        comment: "NEP 2020 implementation status",
      },
      foundational_literacy_numeracy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Foundational Literacy and Numeracy program implementation",
      },
      multilingual_education: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Multilingual education approach adopted",
      },
      assessment_reforms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Assessment and evaluation reforms implemented",
      },
      vocational_education: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Vocational education integrated",
      },

      // Infrastructure Compliance
      building_safety_certificate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Valid building safety certificate available",
      },
      fire_safety_certificate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Valid fire safety certificate available",
      },
      playground_space_adequate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Adequate playground space as per norms",
      },
      library_books_adequate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Adequate library books as per student strength",
      },
      drinking_water_safe: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Safe drinking water quality certified",
      },
      toilet_facilities_adequate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Adequate toilet facilities (separate for boys/girls)",
      },

      // Teacher & Staff Compliance
      teacher_verification_complete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Background verification of all teachers completed",
      },
      teacher_training_updated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "All teachers have updated professional training",
      },
      staff_police_verification: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Police verification of all staff completed",
      },

      // Financial Compliance
      fee_structure_approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Fee structure approved by competent authority",
      },
      financial_audit_current: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Current financial audit completed",
      },
      grant_utilization_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Government grants utilized as per guidelines",
      },
      transparency_financial: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Financial transparency maintained (RTI compliance)",
      },

      // Academic Compliance
      curriculum_board_approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Curriculum follows approved board guidelines",
      },
      textbooks_prescribed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Only prescribed textbooks used",
      },
      assessment_system_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Assessment system follows board norms",
      },
      academic_calendar_followed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Academic calendar followed as prescribed",
      },

      // Child Protection & Safety
      child_protection_policy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Child protection policy implemented",
      },
      anti_ragging_measures: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Anti-ragging measures in place",
      },
      pocso_awareness: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "POCSO Act awareness and compliance",
      },
      grievance_mechanism: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Student/parent grievance mechanism exists",
      },

      // Digital & Technology Compliance
      digital_learning_implemented: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Digital learning tools implemented",
      },
      data_privacy_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Student data privacy norms followed",
      },
      technology_policy_exists: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Technology usage policy exists",
      },

      // Environmental & Health Compliance
      green_practices_adopted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Environmental friendly practices adopted",
      },
      waste_management_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Waste management system in place",
      },
      health_checkup_regular: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Regular health checkups conducted",
      },
      nutrition_program_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Mid-day meal/nutrition program compliant",
      },

      // Overall Compliance Score
      compliance_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: "Overall compliance score (0-100)",
      },
      compliance_grade: {
        type: DataTypes.ENUM("A+", "A", "B+", "B", "C+", "C", "D", "F"),
        allowNull: false,
        defaultValue: "F",
        comment: "Overall compliance grade",
      },

      // Action Items & Remediation
      non_compliance_areas: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Areas of non-compliance (JSON array)",
      },
      action_plan: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Action plan for compliance improvement",
      },
      remediation_timeline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Timeline for compliance remediation",
      },
      follow_up_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date scheduled for compliance follow-up",
      },

      // Inspection & Verification
      inspection_officer: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Name of inspection officer",
      },
      inspection_agency: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Government agency conducting inspection",
      },
      verification_documents: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "List of verification documents (JSON array)",
      },

      // Status & Remarks
      record_status: {
        type: DataTypes.ENUM(
          "draft",
          "submitted",
          "under_review",
          "approved",
          "rejected",
        ),
        allowNull: false,
        defaultValue: "draft",
        comment: "Status of compliance record",
      },
      inspector_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Remarks from inspection officer",
      },
      school_response: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "School response to compliance findings",
      },

      // Metadata
      created_by: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "User who created this record",
      },
      updated_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "User who last updated this record",
      },
    },
    {
      tableName: "udise_compliance_records",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["school_id"],
        },
      ],
      comment: "UDISE+ compliance tracking and government regulation adherence",
    },
  );

  // Model associations will be defined in index.js
  UdiseComplianceRecord.associate = function (models) {
    // Association with UDISE School Registration
    UdiseComplianceRecord.belongsTo(models.UdiseSchoolRegistration, {
      foreignKey: "udise_registration_id",
      as: "udise_registration",
    });
  };

  return UdiseComplianceRecord;
};
