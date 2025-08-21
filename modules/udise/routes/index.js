const express = require("express");
const udiseRoutes = require("./UdiseRoutes");

/**
 * UDISE Module Routes Index
 * Consolidates all UDISE-related routes
 */
function createUdiseModuleRoutes() {
  const router = express.Router();

  // Mount UDISE routes
  router.use("/", udiseRoutes());

  return router;
}

module.exports = createUdiseModuleRoutes;
