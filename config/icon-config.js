/**
 * Standardized Icon Configuration
 * This file ensures consistent icons across the entire application
 */

const ICONS = {
  // User Types
  USERS: 'fas fa-users',
  USER: 'fas fa-user',
  ADMIN: 'fas fa-user-shield',
  TEACHER: 'fas fa-chalkboard-teacher',
  STUDENT: 'fas fa-user-graduate',
  PARENT: 'fas fa-user-friends',

  // Educational Entities
  SCHOOL: 'fas fa-school',
  SCHOOLS: 'fas fa-building',
  CLASS: 'fas fa-door-open',
  CLASSES: 'fas fa-th-large',
  SUBJECT: 'fas fa-book',
  SUBJECTS: 'fas fa-books',

  // Academic Functions
  ATTENDANCE: 'fas fa-calendar-check',
  GRADES: 'fas fa-graduation-cap',
  ASSIGNMENTS: 'fas fa-clipboard-list',
  EXAMS: 'fas fa-file-alt',
  TIMETABLE: 'fas fa-calendar-alt',

  // Administrative
  DASHBOARD: 'fas fa-tachometer-alt',
  REPORTS: 'fas fa-chart-line',
  ANALYTICS: 'fas fa-chart-bar',
  SETTINGS: 'fas fa-cog',
  CONFIGURATION: 'fas fa-tools',

  // Financial
  FEES: 'fas fa-rupee-sign',
  PAYMENTS: 'fas fa-credit-card',
  FINANCE: 'fas fa-money-bill-wave',
  ACCOUNTING: 'fas fa-calculator',

  // Communication
  MESSAGES: 'fas fa-envelope',
  NOTIFICATIONS: 'fas fa-bell',
  ANNOUNCEMENTS: 'fas fa-bullhorn',
  COMMUNICATION: 'fas fa-comments',

  // System Functions
  SYSTEM_HEALTH: 'fas fa-heartbeat',
  DATABASE: 'fas fa-database',
  BACKUP: 'fas fa-save',
  SECURITY: 'fas fa-shield-alt',
  AUDIT: 'fas fa-search',
  LOGS: 'fas fa-file-alt',

  // Navigation & Actions
  HOME: 'fas fa-home',
  LOGOUT: 'fas fa-sign-out-alt',
  LOGIN: 'fas fa-sign-in-alt',
  PROFILE: 'fas fa-user-circle',
  MENU: 'fas fa-bars',
  CLOSE: 'fas fa-times',

  // Status Icons
  SUCCESS: 'fas fa-check-circle',
  ERROR: 'fas fa-exclamation-triangle',
  WARNING: 'fas fa-exclamation-circle',
  INFO: 'fas fa-info-circle',
  LOADING: 'fas fa-spinner',

  // Actions
  ADD: 'fas fa-plus',
  EDIT: 'fas fa-edit',
  DELETE: 'fas fa-trash',
  VIEW: 'fas fa-eye',
  DOWNLOAD: 'fas fa-download',
  UPLOAD: 'fas fa-upload',
  PRINT: 'fas fa-print',
  REFRESH: 'fas fa-sync-alt',

  // Other Common Icons
  CALENDAR: 'fas fa-calendar',
  CLOCK: 'fas fa-clock',
  LOCATION: 'fas fa-map-marker-alt',
  PHONE: 'fas fa-phone',
  EMAIL: 'fas fa-envelope',
  WEBSITE: 'fas fa-globe',

  // Role Specific
  SYSTEM_ADMIN: 'fas fa-crown',
  SUPER_ADMIN: 'fas fa-shield-alt',
  SCHOOL_ADMIN: 'fas fa-user-tie',

  // Statistics & Metrics
  TOTAL_COUNT: 'fas fa-hashtag',
  ACTIVE_COUNT: 'fas fa-circle',
  PERCENTAGE: 'fas fa-percent',
  GROWTH: 'fas fa-arrow-up',
  DECLINE: 'fas fa-arrow-down'
};

// Helper function to get icon for a specific entity/action
const getIcon = entity => {
  const entityUpper = entity.toUpperCase();
  return ICONS[entityUpper] || 'fas fa-question-circle';
};

// Helper function to get icon with specific styling
const getIconWithClass = (entity, additionalClasses = '') => {
  const icon = getIcon(entity);
  return additionalClasses ? `${icon} ${additionalClasses}` : icon;
};

module.exports = {
  ICONS,
  getIcon,
  getIconWithClass
};
