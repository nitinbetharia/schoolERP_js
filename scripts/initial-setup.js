const { initializeSystemModels } = require("../models");
const { systemAuthService } = require("../services/systemServices");
const { logger, logSystem } = require("../utils/logger");

/**
 * Initial system setup script
 * Creates default system administrator and sample data
 */
async function setupInitialData() {
  try {
    logSystem("Starting initial system setup");

    // Initialize system models first
    await initializeSystemModels();

    // Check if system admin already exists
    const { getSystemUserModel } = require("../models");
    const SystemUser = await getSystemUserModel();

    const existingAdmin = await SystemUser.findOne({
      where: { username: "admin" },
    });

    if (existingAdmin) {
      logSystem("System administrator already exists, skipping setup");
      return;
    }

    // Create default system administrator
    const systemAdmin = {
      username: "admin",
      email: "admin@system.local",
      password: "admin123",
      full_name: "System Administrator",
    };

    const createdAdmin = await systemAuthService.createSystemUser(systemAdmin);
    logSystem("Default system administrator created", {
      id: createdAdmin.id,
      username: createdAdmin.username,
      email: createdAdmin.email,
    });

    logSystem("Initial system setup completed successfully");
  } catch (error) {
    console.error("Initial setup failed:", error);
    process.exit(1);
  }
}

// Run if script is executed directly
if (require.main === module) {
  setupInitialData()
    .then(() => {
      console.log("\n✅ Initial setup completed successfully!");
      console.log("📋 Default System Admin Credentials:");
      console.log("   Username: admin");
      console.log("   Password: admin123");
      console.log("   Email: admin@system.local\n");
      console.log(
        "⚠️  Please change the default password after first login!\n",
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Initial setup failed:", error.message);
      process.exit(1);
    });
}

module.exports = setupInitialData;
