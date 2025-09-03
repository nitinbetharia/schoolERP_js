#!/usr/bin/env node

const FrontendLinkChecker = require('./check-frontend-links');
const RouteViewAnalyzer = require('./analyze-route-view-coverage');
const fs = require('fs');
const path = require('path');

/**
 * Master Frontend Coverage Checker
 * Runs comprehensive analysis of frontend endpoints, routes, and views
 */
class FrontendCoverageChecker {
   constructor() {
      this.projectRoot = path.join(__dirname, '..');
      this.reportsDir = path.join(this.projectRoot, 'reports');
   }

   async runFullAnalysis() {
      console.log('🚀 Starting comprehensive frontend coverage analysis...\n');

      // Ensure reports directory exists
      if (!fs.existsSync(this.reportsDir)) {
         fs.mkdirSync(this.reportsDir, { recursive: true });
      }

      const results = {
         timestamp: new Date().toISOString(),
         linkCheck: null,
         routeAnalysis: null,
         combined: null,
      };

      try {
         // Step 1: Static analysis of routes and views
         console.log('📊 Phase 1: Static Route-View Analysis');
         console.log('=====================================');
         const analyzer = new RouteViewAnalyzer();
         results.routeAnalysis = await analyzer.run();

         console.log('\n');

         // Step 2: Live link checking (requires server to be running)
         console.log('🔗 Phase 2: Live Link Checking');
         console.log('===============================');
         console.log('Note: This requires the server to be running on http://localhost:3000\n');

         try {
            const checker = new FrontendLinkChecker();
            results.linkCheck = await checker.run();
         } catch (error) {
            console.log('⚠️  Live link checking failed (server may not be running)');
            console.log('   To run live checks, start the server with: npm start');
            console.log(`   Error: ${error.message}\n`);
            results.linkCheck = { error: error.message, skipped: true };
         }

         // Step 3: Combined analysis
         console.log('🔄 Phase 3: Combined Analysis');
         console.log('=============================');
         results.combined = this.combineAnalysis(results);

         // Save comprehensive report
         const reportPath = path.join(this.reportsDir, 'frontend-coverage-report.json');
         fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

         // Generate summary
         this.generateSummaryReport(results);

         console.log(`\n📋 Complete report saved to: ${reportPath}`);

         return results;
      } catch (error) {
         console.error('❌ Frontend coverage analysis failed:', error);
         throw error;
      }
   }

   combineAnalysis(results) {
      const combined = {
         overallHealth: 'unknown',
         criticalIssues: [],
         implementationPriority: [],
         developmentStatus: {},
      };

      // Analyze route-view coverage
      if (results.routeAnalysis) {
         const { gaps, summary } = results.routeAnalysis;

         if (gaps.brokenNavLinks?.length > 0) {
            combined.criticalIssues.push({
               type: 'navigation',
               severity: 'high',
               count: gaps.brokenNavLinks.length,
               description: 'Navigation links pointing to non-existent routes',
            });
         }

         // Add implementation priorities
         if (gaps.missingRoutes?.length > 0) {
            combined.implementationPriority.push({
               category: 'Backend Routes',
               items: gaps.missingRoutes,
               priority: 'high',
               effort: 'medium',
            });
         }

         if (gaps.missingViews?.length > 0) {
            combined.implementationPriority.push({
               category: 'Frontend Views',
               items: gaps.missingViews,
               priority: 'medium',
               effort: 'low',
            });
         }

         combined.developmentStatus.staticAnalysis = {
            routes: summary.totalRoutes,
            views: summary.totalViews,
            navLinks: summary.totalNavLinks,
            coverage: summary.coverage,
         };
      }

      // Analyze live link results
      if (results.linkCheck && !results.linkCheck.skipped) {
         const { summary, brokenLinks } = results.linkCheck;

         if (brokenLinks?.length > 0) {
            combined.criticalIssues.push({
               type: 'broken_links',
               severity: 'high',
               count: brokenLinks.length,
               description: 'Live links returning errors or 404s',
            });
         }

         combined.developmentStatus.liveCheck = {
            totalChecked: summary.totalLinks,
            working: summary.workingLinks,
            broken: summary.brokenLinks,
            successRate: summary.successRate,
         };

         // Determine overall health
         const successRate = parseFloat(summary.successRate);
         if (successRate >= 95) {
            combined.overallHealth = 'excellent';
         } else if (successRate >= 85) {
            combined.overallHealth = 'good';
         } else if (successRate >= 70) {
            combined.overallHealth = 'fair';
         } else {
            combined.overallHealth = 'poor';
         }
      }

      return combined;
   }

   generateSummaryReport(results) {
      console.log('\n🎯 FRONTEND COVERAGE SUMMARY');
      console.log('============================');

      const { combined, linkCheck } = results;

      // Overall health
      if (combined.overallHealth !== 'unknown') {
         const healthEmoji = {
            excellent: '🟢',
            good: '🟡',
            fair: '🟠',
            poor: '🔴',
         };
         const healthText = combined.overallHealth.toUpperCase();
         console.log(`${healthEmoji[combined.overallHealth]} Overall Health: ${healthText}`);
      }

      // Development status
      if (combined.developmentStatus.staticAnalysis) {
         const staticData = combined.developmentStatus.staticAnalysis;
         console.log('\n📊 Static Analysis:');
         console.log(`   • Routes: ${staticData.routes}`);
         console.log(`   • Views: ${staticData.views}`);
         console.log(`   • Navigation Links: ${staticData.navLinks}`);
         console.log(`   • Routes with Views: ${staticData.coverage.routesWithViews}`);
      }

      if (combined.developmentStatus.liveCheck) {
         const live = combined.developmentStatus.liveCheck;
         console.log('\n🔗 Live Check:');
         console.log(`   • Links Tested: ${live.totalChecked}`);
         console.log(`   • Working: ${live.working}`);
         console.log(`   • Broken: ${live.broken}`);
         console.log(`   • Success Rate: ${live.successRate}%`);
      }

      // Critical issues
      if (combined.criticalIssues.length > 0) {
         console.log('\n❌ Critical Issues:');
         combined.criticalIssues.forEach((issue, index) => {
            const severity = issue.severity.toUpperCase();
            console.log(`   ${index + 1}. [${severity}] ${issue.description} (${issue.count})`);
         });
      }

      // Implementation priorities
      if (combined.implementationPriority.length > 0) {
         console.log('\n🎯 Implementation Priorities:');
         combined.implementationPriority.forEach((priority, index) => {
            const priorityText = priority.priority;
            const effortText = priority.effort;
            const categoryText = `${index + 1}. ${priority.category}`;
            console.log(`   ${categoryText} (${priorityText} priority, ${effortText} effort)`);
            console.log(`      Items: ${priority.items.length}`);
         });
      }

      // Development recommendations
      console.log('\n💡 Immediate Actions:');

      if (linkCheck?.skipped) {
         console.log('   • Start the server and run live link check');
      }

      if (combined.criticalIssues.some((i) => i.type === 'navigation')) {
         console.log('   • Fix broken navigation links');
      }

      if (combined.criticalIssues.some((i) => i.type === 'broken_links')) {
         console.log('   • Implement missing route handlers');
      }

      if (combined.implementationPriority.some((p) => p.category === 'Frontend Views')) {
         console.log('   • Create missing view templates');
      }

      console.log('   • Review the detailed reports for specific items to fix');
   }

   // Helper method to check if server is running
   async checkServerStatus() {
      const http = require('http');

      return new Promise((resolve) => {
         const req = http.get('http://localhost:3000/health', (res) => {
            resolve(res.statusCode === 200);
         });

         req.on('error', () => {
            resolve(false);
         });

         req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
         });
      });
   }

   async run() {
      const serverRunning = await this.checkServerStatus();

      if (!serverRunning) {
         console.log('⚠️  Server is not running on localhost:3000');
         console.log('   Some checks will be limited to static analysis only');
         console.log('   To run full checks, start the server with: npm start\n');
      }

      return await this.runFullAnalysis();
   }
}

// CLI execution
if (require.main === module) {
   const checker = new FrontendCoverageChecker();
   checker
      .run()
      .then(() => {
         console.log('\n✅ Frontend coverage analysis completed successfully');
         process.exit(0);
      })
      .catch((error) => {
         console.error('\n❌ Frontend coverage analysis failed:', error);
         process.exit(1);
      });
}

module.exports = FrontendCoverageChecker;
