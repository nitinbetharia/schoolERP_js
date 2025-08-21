/**
 * Simple Models Export for Attendance Module
 * Temporary solution to bypass corrupted models/index.js
 */

// Export a simple models object that the attendance module can use
const models = {};

// Mock models for development/testing
const mockStudent = {
  findOne: async () => ({ id: 1, name: "Test Student" }),
  findByPk: async () => ({ id: 1, name: "Test Student" }),
};

const mockUser = {
  findOne: async () => ({ id: 1, name: "Test User" }),
  findByPk: async () => ({ id: 1, name: "Test User" }),
};

const mockSchool = {
  findOne: async () => ({ id: 1, name: "Test School" }),
  findByPk: async () => ({ id: 1, name: "Test School" }),
};

const mockClass = {
  findOne: async () => ({ id: 1, name: "Test Class" }),
  findByPk: async () => ({ id: 1, name: "Test Class" }),
};

// Create mock attendance models
const mockStudentAttendance = {
  findOne: async () => null,
  findAll: async () => [],
  findByPk: async () => null,
  create: async (data) => ({ id: 1, ...data }),
  count: async () => 0,
  update: async () => [1],
};

const mockTeacherAttendance = {
  findOne: async () => null,
  findAll: async () => [],
  findByPk: async () => null,
  create: async (data) => ({ id: 1, ...data }),
  count: async () => 0,
  update: async () => [1],
};

// Simple sequelize mock
const sequelize = {
  transaction: async () => ({
    commit: async () => {},
    rollback: async () => {},
  }),
  query: async () => [[]],
};

// Export models object
module.exports = {
  Student: mockStudent,
  User: mockUser,
  School: mockSchool,
  Class: mockClass,
  StudentAttendance: mockStudentAttendance,
  TeacherAttendance: mockTeacherAttendance,
  sequelize,
};
