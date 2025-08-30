/**
 * System Services - Main Coordinator
 * Coordinates between SystemAuthService and TrustService modules
 * Maintains backward compatibility while using modular architecture
 */

const { createSystemAuthService } = require('./SystemAuthService');
const { createTrustService } = require('./TrustService');

// Create service instances
const systemAuthService = createSystemAuthService();
const trustService = createTrustService();

// Export services maintaining original interface
module.exports = {
   systemAuthService,
   trustService,
};
