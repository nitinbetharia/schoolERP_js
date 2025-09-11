const express = require('express');
const { logError } = require('../../../utils/logger');

/**
 * Utility Routes Module
 * Handles testing, maintenance, and utility routes
 * File size: ~200 lines (within industry standards)
 */

module.exports = function (_middleware) {
   const router = express.Router();

   /**
    * @route GET /frontend
    * @desc Frontend test redirect (file removed during cleanup)
    * @access Public
    */
   router.get('/frontend', (req, res) => {
      res.redirect('/auth/login?message=Frontend test file was removed during codebase cleanup');
   });

   /**
    * @route GET /error-handler
    * @desc Test error handling
    * @access Public
    */
   router.get('/error-handler', (req, res) => {
      try {
         res.render('pages/test/error-handler', {
            title: 'Error Handler Test',
            description: 'Test different error scenarios and flash message types',
            user: req.session?.user || null,
            tenant: req.session?.tenant || req.tenant || null,
            userType: req.session?.userType || null,
         });
      } catch (error) {
         logError(error, { context: 'test/error-handler GET' });
         res.status(500).send('Error loading error handler test page');
      }
   });

   /**
    * @route GET /500-error
    * @desc Test 500 error
    * @access Public
    */
   router.get('/500-error', (_req, _res) => {
      throw new Error('This is a test 500 error for testing error handling middleware');
   });

   /**
    * @route GET /generic-error
    * @desc Test generic error
    * @access Public
    */
   router.get('/generic-error', (_req, _res) => {
      const error = new Error('This is a generic test error with additional context');
      error.statusCode = 400;
      error.userMessage = 'This is a user-friendly error message for testing';
      throw error;
   });

   /**
    * @route GET /long-message
    * @desc Test long error message
    * @access Public
    */
   router.get('/long-message', (req, res) => {
      try {
         const longMessage =
            'This is an extremely long error message that is designed to test ' +
            'how the error handling system deals with verbose error descriptions. ' +
            'It contains multiple sentences and detailed information that might be ' +
            'important for developers and administrators who need to see full error ' +
            'information for debugging purposes. The message should be properly formatted ' +
            'and displayed without breaking the user interface or causing layout issues.';

         req.flash('error', longMessage);
         res.redirect('/test/error-handler');
      } catch (error) {
         logError(error, { context: 'test/long-message GET' });
         res.status(500).send('Error during long message test');
      }
   });

   return router;
};
