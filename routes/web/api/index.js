const express = require('express');

/**
 * API Routes Module - Main Router
 * Coordinates all API sub-modules
 * File size: ~80 lines (within standards)
 */

module.exports = function (middleware) {
   const router = express.Router();

   // Import API sub-modules
   const userApiRoutes = require('./users');
   const bulkApiRoutes = require('./bulk');
   const statsApiRoutes = require('./stats');

   // Mount API sub-routes
   router.use('/admin/users', userApiRoutes(middleware));
   router.use('/admin/users/bulk', bulkApiRoutes(middleware));
   router.use('/admin/users', statsApiRoutes(middleware));

   // API health check
   router.get('/health', (req, res) => {
      res.json({
         success: true,
         message: 'API routes are healthy',
         timestamp: new Date().toISOString(),
         routes: {
            users: 'mounted',
            bulk: 'mounted',
            stats: 'mounted',
         },
      });
   });

   return router;
};
