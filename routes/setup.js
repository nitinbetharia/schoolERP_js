/**
 * Setup Routes - System Setup Wizard
 * Initial configuration and setup workflows
 */

const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();

/**
 * GET /setup - Setup wizard entry point
 */
router.get('/', asyncHandler(async (req, res) => {
  // TODO: Implement setup wizard logic
  res.render('setup/index', {
    title: 'Setup Wizard',
    hideNavigation: true,
    pageHeader: {
      title: 'School ERP Setup',
      description: 'Configure your school management system'
    }
  });
}));

module.exports = router;