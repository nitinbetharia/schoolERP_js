/**
 * Icon Standardization and Management Utility
 *
 * This module provides consistent icon usage across the application
 * using Bootstrap Icons as the primary icon library.
 *
 * Usage in EJS templates:
 * <i class="<%= icons.dashboard %>"></i>
 * <i class="<%= icons.user %>"></i>
 */

const icons = {
   // Navigation & Dashboard
   dashboard: 'bi bi-speedometer2',
   home: 'bi bi-house',
   menu: 'bi bi-list',
   back: 'bi bi-arrow-left',

   // User & Authentication
   user: 'bi bi-person',
   users: 'bi bi-people',
   login: 'bi bi-box-arrow-in-right',
   logout: 'bi bi-box-arrow-left',
   profile: 'bi bi-person-circle',

   // Data Management
   add: 'bi bi-plus-circle',
   create: 'bi bi-plus-circle',
   edit: 'bi bi-pencil-square',
   delete: 'bi bi-trash',
   save: 'bi bi-floppy',
   cancel: 'bi bi-x-circle',

   // Actions
   search: 'bi bi-search',
   filter: 'bi bi-funnel',
   refresh: 'bi bi-arrow-clockwise',
   reset: 'bi bi-arrow-counterclockwise',
   download: 'bi bi-download',
   upload: 'bi bi-upload',
   export: 'bi bi-file-earmark-arrow-down',
   import: 'bi bi-file-earmark-arrow-up',

   // Status & Feedback
   success: 'bi bi-check-circle',
   error: 'bi bi-exclamation-triangle',
   warning: 'bi bi-exclamation-circle',
   info: 'bi bi-info-circle',
   loading: 'bi bi-arrow-repeat',

   // Educational System
   school: 'bi bi-bank',
   student: 'bi bi-mortarboard',
   teacher: 'bi bi-person-workspace',
   class: 'bi bi-collection',
   subject: 'bi bi-book',
   grade: 'bi bi-journal-text',

   // Administrative
   trust: 'bi bi-building',
   management: 'bi bi-diagram-3',
   settings: 'bi bi-gear',
   config: 'bi bi-sliders',
   admin: 'bi bi-shield-check',

   // Reports & Analytics
   reports: 'bi bi-graph-up',
   analytics: 'bi bi-bar-chart',
   chart: 'bi bi-graph-up-arrow',
   performance: 'bi bi-speedometer',

   // Communication
   email: 'bi bi-envelope',
   phone: 'bi bi-telephone',
   message: 'bi bi-chat',
   notification: 'bi bi-bell',

   // Files & Documents
   file: 'bi bi-file-text',
   folder: 'bi bi-folder',
   document: 'bi bi-file-earmark-text',
   image: 'bi bi-image',

   // Navigation Controls
   previous: 'bi bi-chevron-left',
   next: 'bi bi-chevron-right',
   up: 'bi bi-chevron-up',
   down: 'bi bi-chevron-down',

   // System
   database: 'bi bi-server',
   security: 'bi bi-shield-lock',
   health: 'bi bi-heart-pulse',
   logs: 'bi bi-journal-code',

   // UI Elements
   close: 'bi bi-x',
   minimize: 'bi bi-dash',
   maximize: 'bi bi-square',
   help: 'bi bi-question-circle',

   // Status Indicators
   active: 'bi bi-check-circle-fill text-success',
   inactive: 'bi bi-x-circle-fill text-danger',
   pending: 'bi bi-clock-fill text-warning',
   suspended: 'bi bi-pause-circle-fill text-warning',
};

/**
 * Legacy icon mapping for gradual migration
 * Maps old Font Awesome icons to Bootstrap Icons
 */
const legacyIconMap = {
   'fas fa-home': icons.home,
   'fas fa-user': icons.user,
   'fas fa-users': icons.users,
   'fas fa-plus': icons.add,
   'fas fa-edit': icons.edit,
   'fas fa-trash': icons.delete,
   'fas fa-search': icons.search,
   'fas fa-download': icons.download,
   'fas fa-upload': icons.upload,
   'fas fa-cog': icons.settings,
   'fas fa-chart-bar': icons.analytics,
   'fas fa-graduation-cap': icons.student,
   'fas fa-school': icons.school,
   'fas fa-building': icons.trust,
   'fas fa-check-circle': icons.success,
   'fas fa-exclamation-circle': icons.error,
   'fas fa-info-circle': icons.info,
   'fas fa-times': icons.close,
};

/**
 * Get icon class by name
 * @param {string} iconName - Name of the icon
 * @param {string} fallback - Fallback icon if not found
 * @returns {string} Bootstrap icon class
 */
function getIcon(iconName, fallback = 'bi bi-question-circle') {
   return icons[iconName] || fallback;
}

/**
 * Migrate legacy Font Awesome icon to Bootstrap Icon
 * @param {string} legacyIcon - Font Awesome icon class
 * @returns {string} Bootstrap icon class
 */
function migrateLegacyIcon(legacyIcon) {
   return legacyIconMap[legacyIcon] || legacyIcon;
}

module.exports = {
   icons,
   legacyIconMap,
   getIcon,
   migrateLegacyIcon,
};
