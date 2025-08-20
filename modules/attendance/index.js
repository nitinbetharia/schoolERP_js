const AttendanceService = require('./services/AttendanceService');
const AttendanceController = require('./controllers/AttendanceController');
const attendanceRoutes = require('./routes/attendanceRoutes');

/**
 * Attendance Module Index
 * Main entry point for the attendance management module
 * Exports all attendance-related components for use in the main application
 * Following copilot instructions: CommonJS, modular architecture
 */

/**
 * Initialize attendance module models
 * @param {Object} sequelize - Sequelize instance
 * @returns {Object} Attendance models
 */
function initializeAttendanceModels(sequelize) {
   const StudentAttendance = require('./models/StudentAttendance')(sequelize);
   const TeacherAttendance = require('./models/TeacherAttendance')(sequelize);

   return {
      StudentAttendance,
      TeacherAttendance,
   };
}

/**
 * Setup attendance model associations
 * @param {Object} models - All application models
 */
function setupAttendanceAssociations(models) {
   // Setup StudentAttendance associations
   if (models.StudentAttendance && typeof models.StudentAttendance.associate === 'function') {
      models.StudentAttendance.associate(models);
   }

   // Setup TeacherAttendance associations
   if (models.TeacherAttendance && typeof models.TeacherAttendance.associate === 'function') {
      models.TeacherAttendance.associate(models);
   }
}

/**
 * Create attendance service instance
 * @param {Object} models - All application models
 * @returns {AttendanceService} Attendance service instance
 */
function createAttendanceService(models) {
   return new AttendanceService(models);
}

/**
 * Create attendance controller instance
 * @param {Object} models - All application models
 * @returns {AttendanceController} Attendance controller instance
 */
function createAttendanceController(models) {
   return new AttendanceController(models);
}

// Export attendance module components
module.exports = {
   // Model initialization
   initializeAttendanceModels,
   setupAttendanceAssociations,

   // Service and Controller factories
   createAttendanceService,
   createAttendanceController,

   // Route configuration
   routes: attendanceRoutes,

   // Direct exports for convenience
   AttendanceService,
   AttendanceController,

   // Model definitions
   StudentAttendanceModel: require('./models/StudentAttendance'),
   TeacherAttendanceModel: require('./models/TeacherAttendance'),

   // Module metadata
   moduleInfo: {
      name: 'Attendance Management',
      version: '1.0.0',
      description: 'Comprehensive attendance tracking for students and teachers',
      author: 'School ERP System',
      dependencies: ['Student', 'User', 'School', 'Class'],
      features: [
         'Student daily attendance tracking',
         'Teacher attendance with time tracking',
         'Bulk attendance marking',
         'Attendance statistics and reporting',
         'Leave management for teachers',
         'Substitute teacher tracking',
         'Comprehensive attendance analytics',
         'Dashboard summaries',
         'Multi-period attendance support',
         'Holiday and working day management',
      ],
      apiEndpoints: {
         student: [
            'POST /api/attendance/student',
            'POST /api/attendance/student/bulk',
            'PUT /api/attendance/student/:id',
            'GET /api/attendance/student',
            'GET /api/attendance/student/stats',
         ],
         teacher: [
            'POST /api/attendance/teacher',
            'PUT /api/attendance/teacher/:id/checkout',
            'GET /api/attendance/teacher',
            'GET /api/attendance/teacher/stats',
         ],
         reports: ['GET /api/attendance/report', 'GET /api/attendance/dashboard'],
      },
   },
};
