#!/usr/bin/env node

/**
 * ORM List Trusts Script
 * Lists all trusts with their status using Sequelize ORM
 */

const TrustRepository = require('../repositories/TrustRepository');
const logger = require('../config/logger');

class ORMListTrusts {
  constructor() {
    this.trustRepository = new TrustRepository();
  }

  /**
   * Format trust information for display
   */
  formatTrustInfo(trust) {
    const statusEmoji = {
      active: '✅',
      pending: '⏳',
      suspended: '⚠️',
      error: '❌',
      creating: '🔄'
    };

    const subscriptionStatus = trust.getSubscriptionStatus();
    const subscriptionEmoji = {
      active: '✅',
      expiring_soon: '⚠️',
      expiring_month: '🟡',
      expired: '❌',
      unlimited: '♾️'
    };

    return {
      code: trust.trust_code,
      name: trust.trust_name,
      status: `${statusEmoji[trust.database_status] || '❓'} ${trust.database_status}`,
      subscription: `${subscriptionEmoji[subscriptionStatus] || '❓'} ${subscriptionStatus}`,
      database: trust.database_name,
      created: trust.created_at.toLocaleDateString(),
      contact: trust.contact_person || 'N/A',
      email: trust.email || 'N/A'
    };
  }

  /**
   * Display trusts in table format
   */
  displayTrusts(trusts) {
    if (trusts.length === 0) {
      console.log('📝 No trusts found.');
      return;
    }

    console.log('📋 Trusts List');
    console.log('==============\n');

    // Calculate column widths
    const formatted = trusts.map(trust => this.formatTrustInfo(trust));
    const widths = {
      code: Math.max(4, ...formatted.map(t => t.code.length)),
      name: Math.max(20, ...formatted.map(t => t.name.length)),
      status: Math.max(8, ...formatted.map(t => t.status.length)),
      subscription: Math.max(12, ...formatted.map(t => t.subscription.length)),
      contact: Math.max(15, ...formatted.map(t => t.contact.length)),
      created: 12
    };

    // Header
    console.log(
      [
        'CODE'.padEnd(widths.code),
        'NAME'.padEnd(widths.name),
        'STATUS'.padEnd(widths.status),
        'SUBSCRIPTION'.padEnd(widths.subscription),
        'CONTACT'.padEnd(widths.contact),
        'CREATED'.padEnd(widths.created)
      ].join(' | ')
    );

    console.log(
      [
        '-'.repeat(widths.code),
        '-'.repeat(widths.name),
        '-'.repeat(widths.status),
        '-'.repeat(widths.subscription),
        '-'.repeat(widths.contact),
        '-'.repeat(widths.created)
      ].join('-|-')
    );

    // Rows
    formatted.forEach(trust => {
      console.log(
        [
          trust.code.padEnd(widths.code),
          trust.name.padEnd(widths.name),
          trust.status.padEnd(widths.status),
          trust.subscription.padEnd(widths.subscription),
          trust.contact.padEnd(widths.contact),
          trust.created.padEnd(widths.created)
        ].join(' | ')
      );
    });

    console.log(`\n📊 Total: ${trusts.length} trusts`);
  }

  /**
   * Display trust statistics
   */
  async displayStatistics() {
    try {
      const stats = await this.trustRepository.getTrustStatistics();

      console.log('\n📊 Trust Statistics');
      console.log('==================');
      console.log(`Total Trusts: ${stats.total}`);
      console.log(`Active: ${stats.active}`);
      console.log(`Pending: ${stats.pending}`);
      console.log(`Suspended: ${stats.suspended}`);
      console.log(`Error: ${stats.error}`);
      console.log(`Expiring Soon: ${stats.expiring_soon}`);

      // Database statistics
      const dbStats = await this.trustRepository.getDatabaseStatistics();

      console.log('\n📈 Database Status Distribution:');
      dbStats.by_status.forEach(stat => {
        console.log(`  ${stat.database_status}: ${stat.count}`);
      });

      console.log('\n💼 Subscription Plan Distribution:');
      dbStats.by_plan.forEach(stat => {
        console.log(`  ${stat.subscription_plan}: ${stat.count}`);
      });
    } catch (error) {
      console.error('❌ Failed to get statistics:', error.message);
    }
  }

  /**
   * List trusts with filters
   */
  async listTrusts(options = {}) {
    try {
      const { status, plan, search, all = false, stats = false, limit = 50 } = options;

      if (stats) {
        await this.displayStatistics();
        return;
      }

      let filters = {};

      if (status) {
        filters.database_status = status;
      }

      if (plan) {
        filters.subscription_plan = plan;
      }

      if (search) {
        filters.search = search;
      }

      if (all) {
        const trusts = await this.trustRepository.findAll(filters, {
          order: [['trust_name', 'ASC']]
        });
        this.displayTrusts(trusts);
      } else {
        const result = await this.trustRepository.getTrustsWithPagination(filters, {
          limit: limit,
          page: 1
        });

        this.displayTrusts(result.rows);

        if (result.count > limit) {
          console.log(`\n📄 Showing ${result.rows.length} of ${result.count} trusts`);
          console.log('💡 Use --all flag to see all trusts');
        }
      }
    } catch (error) {
      console.error('❌ Failed to list trusts:', error.message);
      process.exit(1);
    }
  }

  /**
   * Main execution
   */
  async run() {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--status':
          options.status = args[++i];
          break;
        case '--plan':
          options.plan = args[++i];
          break;
        case '--search':
          options.search = args[++i];
          break;
        case '--all':
          options.all = true;
          break;
        case '--stats':
          options.stats = true;
          break;
        case '--limit':
          options.limit = parseInt(args[++i]);
          break;
        case '--help':
          this.showHelp();
          return;
      }
    }

    await this.listTrusts(options);
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('📋 ORM List Trusts - Usage');
    console.log('==========================\n');
    console.log('node scripts/orm-list-trusts.js [options]\n');
    console.log('Options:');
    console.log(
      '  --status <status>    Filter by database status (active, pending, suspended, error)'
    );
    console.log(
      '  --plan <plan>        Filter by subscription plan (basic, standard, premium, enterprise)'
    );
    console.log('  --search <text>      Search in trust code, name, or contact person');
    console.log('  --all                Show all trusts (default: limit 50)');
    console.log('  --stats              Show trust statistics');
    console.log('  --limit <number>     Limit number of results (default: 50)');
    console.log('  --help               Show this help message\n');
    console.log('Examples:');
    console.log('  npm run trust:list');
    console.log('  npm run trust:list -- --status active');
    console.log('  npm run trust:list -- --search "demo"');
    console.log('  npm run trust:list -- --stats');
  }
}

// Run if called directly
if (require.main === module) {
  const listTrusts = new ORMListTrusts();
  listTrusts.run().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

module.exports = ORMListTrusts;
