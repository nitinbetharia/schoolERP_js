const { DataTypes } = require("sequelize");

/**
 * User Profile Model
 * Manages tenant user profiles and extended information
 */
const defineUserProfile = (sequelize) => {
  const UserProfile = sequelize.define(
    "UserProfile",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      employee_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Employee ID for staff members",
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      middle_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM("M", "F", "O"),
        allowNull: true,
        comment: "M = Male, F = Female, O = Other",
      },
      phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      alternate_phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: "India",
      },
      profile_photo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      emergency_contact_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      emergency_contact_phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      emergency_contact_relationship: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      qualification: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Educational qualifications",
      },
      experience_years: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Years of experience for staff",
      },
      joining_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date of joining for staff",
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Department for staff members",
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Job designation for staff",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      additional_info: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional flexible information",
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
      tableName: "user_profiles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "user_profile_user_id_idx",
          fields: ["user_id"],
          unique: true,
        },
        {
          name: "user_profile_employee_id_idx",
          fields: ["employee_id"],
        },
        {
          name: "user_profile_name_idx",
          fields: ["first_name", "last_name"],
        },
        {
          name: "user_profile_phone_idx",
          fields: ["phone"],
        },
        {
          name: "user_profile_department_idx",
          fields: ["department"],
        },
      ],
    },
  );

  return UserProfile;
};

module.exports = { defineUserProfile };
