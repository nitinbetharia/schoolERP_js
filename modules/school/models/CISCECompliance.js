const { DataTypes } = require("sequelize");
const { logger } = require("../../../utils/logger");

/**
 * CISCE Board Compliance Model
 * Council for the Indian School Certificate Examinations (ICSE/ISC)
 * Handles CISCE affiliation, assessment frameworks, and examination requirements
 */
const defineCISCECompliance = (sequelize) => {
  const CISCECompliance = sequelize.define(
    "CISCECompliance",
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
      cisce_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: "CISCE school code (4-character alphabetic + 4-digit numeric)",
      },
      affiliation_type: {
        type: DataTypes.ENUM("ICSE_ONLY", "ISC_ONLY", "ICSE_ISC_BOTH"),
        allowNull: false,
        comment: "Type of CISCE affiliation",
      },
      affiliation_status: {
        type: DataTypes.ENUM(
          "APPLIED",
          "PROVISIONAL",
          "PERMANENT",
          "CONDITIONAL",
          "SUSPENDED",
          "WITHDRAWN",
        ),
        allowNull: false,
        defaultValue: "APPLIED",
      },
      affiliation_granted_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date when affiliation was granted",
      },

      // Examination Details
      first_icse_exam_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Year of first ICSE examination conducted",
      },
      first_isc_exam_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Year of first ISC examination conducted",
      },
      examination_center_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: "CISCE examination center code",
      },

      // Curriculum and Assessment
      icse_curriculum_adopted: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "ICSE curriculum adoption details for classes VI-X",
      },
      isc_curriculum_adopted: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "ISC curriculum adoption details for classes XI-XII",
      },
      assessment_pattern: {
        type: DataTypes.ENUM(
          "TRADITIONAL",
          "INTERNAL_ASSESSMENT",
          "CONTINUOUS_EVALUATION",
        ),
        allowNull: false,
        defaultValue: "TRADITIONAL",
      },

      // NEP 2020 Alignment
      nep_compatibility_assessment: {
        type: DataTypes.ENUM(
          "NOT_ASSESSED",
          "COMPATIBLE",
          "PARTIALLY_COMPATIBLE",
          "NOT_COMPATIBLE",
        ),
        allowNull: false,
        defaultValue: "NOT_ASSESSED",
      },
      skill_development_integration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Integration of skill development as per NEP 2020",
      },
      multilingual_approach: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Implementation of multilingual education approach",
      },

      // Subject Combinations
      icse_subjects_offered: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "List of ICSE subjects offered with language options",
      },
      isc_streams_offered: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "ISC streams and subjects offered (Science, Commerce, Arts)",
      },
      language_combinations: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Approved language combinations for examinations",
      },

      // Examination Administration
      chief_superintendent: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Details of appointed chief superintendent",
      },
      examination_fee_structure: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Current examination fee structure",
      },
      practical_examination_facilities: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Facilities for practical examinations",
      },

      // Compliance Requirements
      teacher_qualification_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Teacher qualifications as per CISCE norms",
      },
      infrastructure_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Infrastructure compliance with CISCE requirements",
      },
      library_compliance: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Library resources compliance",
      },

      // Digital Integration
      cisce_web_services_access: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Access to CISCE web services and portals",
      },
      online_result_processing: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Capability for online result processing",
      },
      digital_certificates: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Support for digital certificates",
      },

      // Transfer Certificates
      tc_format_compliance: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Compliance with CISCE TC format requirements",
      },
      migration_certificate_authority: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Authority to issue migration certificates",
      },

      // Financial Compliance
      examination_fees_paid: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Record of examination fees payment",
      },
      affiliation_fees_status: {
        type: DataTypes.ENUM("PENDING", "PARTIAL", "COMPLETE", "OVERDUE"),
        allowNull: false,
        defaultValue: "PENDING",
      },

      // Inspection and Monitoring
      last_inspection_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date of last CISCE inspection",
      },
      inspection_report: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Latest inspection report and recommendations",
      },
      compliance_deficiencies: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Identified compliance deficiencies and remedial actions",
      },

      // Regional Office Details
      regional_office: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Assigned CISCE regional office",
      },
      regional_coordinator: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Regional coordinator contact details",
      },

      // Annual Requirements
      annual_return_submitted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Whether annual return has been submitted",
      },
      statistical_return_submitted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Whether statistical return has been submitted",
      },

      // Quality Metrics
      pass_percentage_trend: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Historical pass percentage trends",
      },
      academic_excellence_awards: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Academic excellence awards received",
      },

      // Overall Compliance Score
      compliance_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Overall CISCE compliance score (0-100)",
      },
      compliance_grade: {
        type: DataTypes.ENUM("A+", "A", "B+", "B", "C", "D", "PENDING"),
        allowNull: false,
        defaultValue: "PENDING",
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
      tableName: "cisce_compliance",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        // Note: cisce_code already has unique: true in field definition
        // Only adding non-unique indexes here
        {
          fields: ["school_id"],
          name: "cisce_school_idx",
        },
        {
          fields: ["affiliation_status", "is_active"],
          name: "cisce_status_idx",
        },
        {
          fields: ["affiliation_type"],
          name: "cisce_type_idx",
        },
      ],
      hooks: {
        beforeValidate: (cisceCompliance) => {
          // Validate CISCE code format (4 letters + 4 digits)
          if (cisceCompliance.cisce_code) {
            const cisceCodeRegex = /^[A-Z]{4}\d{4}$/;
            if (!cisceCodeRegex.test(cisceCompliance.cisce_code)) {
              throw new Error(
                "CISCE code must be 4 uppercase letters followed by 4 digits",
              );
            }
          }

          // Validate examination years
          const currentYear = new Date().getFullYear();
          if (
            cisceCompliance.first_icse_exam_year &&
            cisceCompliance.first_icse_exam_year > currentYear + 1
          ) {
            throw new Error(
              "First ICSE exam year cannot be more than 1 year in the future",
            );
          }
          if (
            cisceCompliance.first_isc_exam_year &&
            cisceCompliance.first_isc_exam_year > currentYear + 1
          ) {
            throw new Error(
              "First ISC exam year cannot be more than 1 year in the future",
            );
          }
        },

        beforeSave: (cisceCompliance) => {
          // Auto-calculate compliance score
          let score = 0;

          // Basic affiliation (25 points)
          if (cisceCompliance.affiliation_status === "PERMANENT") score += 25;
          else if (cisceCompliance.affiliation_status === "PROVISIONAL")
            score += 15;
          else if (cisceCompliance.affiliation_status === "CONDITIONAL")
            score += 10;

          // NEP compatibility (20 points)
          if (cisceCompliance.nep_compatibility_assessment === "COMPATIBLE")
            score += 20;
          else if (
            cisceCompliance.nep_compatibility_assessment ===
            "PARTIALLY_COMPATIBLE"
          )
            score += 12;

          // Digital integration (15 points)
          if (cisceCompliance.online_result_processing) score += 7;
          if (cisceCompliance.digital_certificates) score += 8;

          // Compliance requirements (20 points)
          const teacherCompliance =
            cisceCompliance.teacher_qualification_compliance || {};
          const infraCompliance =
            cisceCompliance.infrastructure_compliance || {};
          if (Object.keys(teacherCompliance).length > 0) score += 10;
          if (Object.keys(infraCompliance).length > 0) score += 10;

          // Annual requirements (20 points)
          if (cisceCompliance.annual_return_submitted) score += 10;
          if (cisceCompliance.statistical_return_submitted) score += 10;

          cisceCompliance.compliance_score = Math.min(score, 100);

          // Assign compliance grade based on score
          if (score >= 90) cisceCompliance.compliance_grade = "A+";
          else if (score >= 80) cisceCompliance.compliance_grade = "A";
          else if (score >= 70) cisceCompliance.compliance_grade = "B+";
          else if (score >= 60) cisceCompliance.compliance_grade = "B";
          else if (score >= 50) cisceCompliance.compliance_grade = "C";
          else if (score > 0) cisceCompliance.compliance_grade = "D";
          else cisceCompliance.compliance_grade = "PENDING";
        },
      },
    },
  );

  return CISCECompliance;
};

module.exports = defineCISCECompliance;
