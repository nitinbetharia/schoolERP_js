#!/usr/bin/env node

/**
 * ORM Status Check Script
 * Checks the status of the ORM system and databases
 */

const databaseManager = require('../config/database-orm');
const modelManager = require('../models/ModelManager');
const TrustRepository = require('../repositories/TrustRepository');

class ORMStatusCheck {
  constructor() {
    this.trustRepository = new TrustRepository();
  }

  /**
   * Check database connections
   */
  async checkConnections() {
    console.log('🔗 Database Connections');
    console.log('=======================');

    try {
      const results = await databaseManager.testConnections();

      console.log(`System Database: ${results.system ? '✅ Connected' : '❌ Failed'}`);
      console.log(`Trust Database: ${results.trust ? '✅ Connected' : '❌ Failed'}`);

      return results;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return { system: false, trust: false };
    }
  }

  /**
   * Check system models
   */
  async checkSystemModels() {
    console.log('\n📊 System Models');
    console.log('================');

    try {
      await modelManager.initializeSystemModels();
      console.log('✅ System models initialized successfully');

      // Check if Trust table exists and has data
      const TrustModel = await modelManager.getTrustModel();
      const trustCount = await TrustModel.count();
      console.log(`📈 Trusts in system: ${trustCount}`);

      return true;
    } catch (error) {
      console.error('❌ System models check failed:', error.message);
      return false;
    }
  }

  /**
   * Check trust statistics
   */
  async checkTrustStatistics() {
    console.log('\n📊 Trust Statistics');
    console.log('===================');

    try {
      const stats = await this.trustRepository.getTrustStatistics();

      console.log(`Total Trusts: ${stats.total}`);
      console.log(`Active: ${stats.active}`);
      console.log(`Pending: ${stats.pending}`);
      console.log(`Suspended: ${stats.suspended}`);
      console.log(`Error: ${stats.error}`);
      console.log(`Expiring Soon: ${stats.expiring_soon}`);

      return stats;
    } catch (error) {
      console.error('❌ Trust statistics check failed:', error.message);
      return null;
    }
  }

  /**
   * Check tenant databases
   */
  async checkTenantDatabases() {
    console.log('\n🏢 Tenant Databases');
    console.log('===================');

    try {
      const activeTrusts = await this.trustRepository.getActiveTrusts();

      if (activeTrusts.length === 0) {
        console.log('📝 No active trusts found');
        return true;
      }

      console.log(`Found ${activeTrusts.length} active trusts`);

      for (const trust of activeTrusts.slice(0, 5)) {
        // Check first 5 trusts
        try {
          const UserModel = await modelManager.getUserModel(trust.trust_code);
          const userCount = await UserModel.count();

          console.log(`  ${trust.trust_code}: ✅ ${userCount} users`);
        } catch (error) {
          console.log(`  ${trust.trust_code}: ❌ Connection failed`);
        }
      }

      if (activeTrusts.length > 5) {
        console.log(`  ... and ${activeTrusts.length - 5} more trusts`);
      }

      return true;
    } catch (error) {
      console.error('❌ Tenant database check failed:', error.message);
      return false;
    }
  }

  /**
   * Check ORM configuration
   */
  checkORMConfig() {
    console.log('\n⚙️  ORM Configuration');
    console.log('====================');

    try {
      const config = require('../config/app-config');

      console.log('✅ Database configuration loaded');
      console.log(`System DB: ${config.database.system.name}`);
      console.log(`Trust DB: ${config.database.system.name} (shared)`);
      console.log(`Tenant Prefix: ${config.database.trust.prefix}`);
      console.log(`Host: ${config.database.connection.host}:${config.database.connection.port}`);
      console.log(`User: ${config.database.connection.user}`);

      return true;
    } catch (error) {
      console.error('❌ Configuration check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate health report
   */
  generateHealthReport(results) {
    console.log('\n🏥 Health Report');
    console.log('================');

    const scores = {
      config: results.config ? 1 : 0,
      systemConnection: results.connections.system ? 1 : 0,
      trustConnection: results.connections.trust ? 1 : 0,
      systemModels: results.systemModels ? 1 : 0,
      tenantDatabases: results.tenantDatabases ? 1 : 0
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const maxScore = Object.keys(scores).length;
    const healthPercentage = Math.round((totalScore / maxScore) * 100);

    let healthStatus;
    if (healthPercentage >= 90) {
      healthStatus = '🟢 Excellent';
    } else if (healthPercentage >= 70) {
      healthStatus = '🟡 Good';
    } else if (healthPercentage >= 50) {
      healthStatus = '🟠 Fair';
    } else {
      healthStatus = '🔴 Poor';
    }

    console.log(`Overall Health: ${healthStatus} (${healthPercentage}%)`);
    console.log(`Score: ${totalScore}/${maxScore}`);

    if (totalScore < maxScore) {
      console.log('\n🔧 Issues Found:');
      if (!results.config) console.log('  - Configuration problems');
      if (!results.connections.system) console.log('  - System database connection failed');
      if (!results.connections.trust) console.log('  - Trust database connection failed');
      if (!results.systemModels) console.log('  - System models initialization failed');
      if (!results.tenantDatabases) console.log('  - Tenant database issues');
    }

    return healthPercentage;
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🩺 ORM System Status Check');
    console.log('==========================\n');

    const results = {
      config: false,
      connections: { system: false, trust: false },
      systemModels: false,
      tenantDatabases: false,
      trustStats: null
    };

    try {
      // Check configuration
      results.config = this.checkORMConfig();

      // Check database connections
      results.connections = await this.checkConnections();

      // Check system models (only if system connection works)
      if (results.connections.system) {
        results.systemModels = await this.checkSystemModels();

        // Check trust statistics (only if system models work)
        if (results.systemModels) {
          results.trustStats = await this.checkTrustStatistics();

          // Check tenant databases (only if we have trusts)
          if (results.trustStats && results.trustStats.total > 0) {
            results.tenantDatabases = await this.checkTenantDatabases();
          } else {
            results.tenantDatabases = true; // No tenants to check
          }
        }
      }

      // Generate health report
      const healthScore = this.generateHealthReport(results);

      // Exit with appropriate code
      process.exit(healthScore >= 90 ? 0 : 1);
    } catch (error) {
      console.error('\n💥 Status check failed:', error.message);
      process.exit(1);
    } finally {
      await databaseManager.closeAllConnections();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const statusCheck = new ORMStatusCheck();
  statusCheck.run().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

module.exports = ORMStatusCheck;
