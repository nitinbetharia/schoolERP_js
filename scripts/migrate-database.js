const { initializeSystemModels } = require('../models');
const { logger, logSystem, logError } = require('../utils/logger');

/**
 * Database migration script
 * Creates all system database tables
 */
async function createSystemTables() {
   try {
      logSystem('Starting database migration');

      // Initialize system models
      const systemModels = await initializeSystemModels();

      // Force sync to create tables
      const { dbManager } = require('../models/database');
      const systemDB = dbManager.getSystemDB();

      logSystem('Creating database tables...');
      await systemDB.sync({ force: false, alter: true });

      logSystem('Database tables created successfully');

      // Close connections
      await dbManager.closeAllConnections();

      logSystem('Database migration completed');
   } catch (error) {
      logError(error, { context: 'createSystemTables' });
      console.error('Database migration failed:', error.message);
      process.exit(1);
   }
}

// Run if script is executed directly
if (require.main === module) {
   createSystemTables()
      .then(() => {
         console.log('\n✅ Database migration completed successfully!');
         process.exit(0);
      })
      .catch((error) => {
         console.error('\n❌ Database migration failed:', error.message);
         process.exit(1);
      });
}

module.exports = createSystemTables;
