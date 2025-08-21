const { DataTypes } = require("sequelize");

/**
 * Board Compliance Model
 * Base model for tracking board-specific compliance requirements
 */
const defineBoardCompliance = (sequelize) => {
  const BoardCompliance = sequelize.define(
    "BoardCompliance",
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
      board_type: {
        type: DataTypes.ENUM("CBSE", "CISCE", "STATE_BOARD", "INTERNATIONAL"),
        allowNull: false,
      },
      affiliation_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Board-specific affiliation code",
      },
      registration_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Board registration number",
      },
      affiliation_status: {
        type: DataTypes.ENUM(
          "APPLIED",
          "PROVISIONAL",
          "PERMANENT",
          "EXPIRED",
          "CANCELLED",
        ),
        allowNull: false,
        defaultValue: "APPLIED",
      },
      affiliation_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date of board affiliation",
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Affiliation expiry date",
      },
      compliance_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Board-specific compliance requirements and status",
      },
      nep_compatibility: {
        type: DataTypes.ENUM(
          "COMPATIBLE",
          "PARTIALLY_COMPATIBLE",
          "NOT_COMPATIBLE",
          "UNKNOWN",
        ),
        allowNull: false,
        defaultValue: "UNKNOWN",
        comment: "Board compatibility with NEP 2020 framework",
      },
      assessment_framework: {
        type: DataTypes.ENUM("TRADITIONAL", "NEP_2020", "HYBRID"),
        allowNull: false,
        defaultValue: "TRADITIONAL",
        comment: "Assessment framework being followed",
      },
      last_compliance_check: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Last compliance verification date",
      },
      compliance_officer: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "User ID of compliance officer",
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
      tableName: "board_compliance",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["school_id", "board_type"],
          name: "idx_board_compliance_school_board",
        },
        {
          fields: ["board_type"],
          name: "idx_board_compliance_type",
        },
        {
          fields: ["affiliation_status"],
          name: "idx_board_compliance_status",
        },
        {
          fields: ["assessment_framework"],
          name: "idx_board_compliance_framework",
        },
      ],
    },
  );

  // Define associations
  BoardCompliance.associate = (models) => {
    BoardCompliance.belongsTo(models.School, {
      foreignKey: "school_id",
      as: "school",
    });
  };

  return BoardCompliance;
};

module.exports = { defineBoardCompliance };
