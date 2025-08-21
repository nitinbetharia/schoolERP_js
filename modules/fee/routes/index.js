const express = require('express');
const feeRoutes = require('./FeeRoutes');

/**
 * Fee Module Routes Index
 * Consolidates all fee-related routes
 */
function createFeeModuleRoutes() {
   const router = express.Router();

   // Mount fee routes
   router.use('/', feeRoutes());

   return router;
}

module.exports = createFeeModuleRoutes;
