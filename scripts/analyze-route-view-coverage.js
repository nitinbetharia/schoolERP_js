const fs = require('fs');
const path = require('path');

/**
 * Route-View Coverage Analyzer
 * Analyzes routes and views to identify missing endpoints
 */
class RouteViewAnalyzer {
   constructor() {
      this.projectRoot = path.join(__dirname, '..');
      this.routesDir = path.join(this.projectRoot, 'routes', 'web');
      this.viewsDir = path.join(this.projectRoot, 'views');
      this.routes = new Map();
      this.views = new Set();
      this.missingRoutes = [];
      this.missingViews = [];
      this.analysis = {};
   }

   async analyze() {
      console.log('🔍 Analyzing route-view coverage...');

      await this.scanRoutes();
      await this.scanViews();
      this.crossReference();
      this.generateAnalysis();

      return this.analysis;
   }

   async scanRoutes() {
      console.log('📁 Scanning routes...');

      const routeFiles = fs.readdirSync(this.routesDir).filter((f) => f.endsWith('.js'));

      for (const file of routeFiles) {
         const filePath = path.join(this.routesDir, file);
         const content = fs.readFileSync(filePath, 'utf8');

         // Extract route definitions
         const routePatterns = [
            /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /router\.(get|post|put|patch|delete)\s*\(\s*\/([^\/\s,]+)/g,
         ];

         for (const pattern of routePatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
               const method = match[1].toUpperCase();
               const route = match[2];

               if (!this.routes.has(route)) {
                  this.routes.set(route, []);
               }
               this.routes.get(route).push({
                  method,
                  file,
                  hasHandler: content.includes('res.render'),
               });
            }
         }

         // Look for res.render calls to identify expected views
         const renderPattern = /res\.render\s*\(\s*['"`]([^'"`]+)['"`]/g;
         let renderMatch;
         while ((renderMatch = renderPattern.exec(content)) !== null) {
            const viewPath = renderMatch[1];
            this.views.add(viewPath);
         }
      }

      console.log(`✅ Found ${this.routes.size} unique routes`);
   }

   async scanViews() {
      console.log('👀 Scanning views...');

      const scanDir = (dir, prefix = '') => {
         const items = fs.readdirSync(dir);

         for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
               scanDir(fullPath, prefix ? `${prefix}/${item}` : item);
            } else if (item.endsWith('.ejs')) {
               const viewName = prefix ? `${prefix}/${item.replace('.ejs', '')}` : item.replace('.ejs', '');
               this.views.add(viewName);
            }
         }
      };

      scanDir(this.viewsDir);
      console.log(`✅ Found ${this.views.size} view templates`);
   }

   crossReference() {
      console.log('🔗 Cross-referencing routes and views...');

      // Check for routes without handlers
      const routesWithoutViews = [];
      const routesWithViews = [];

      this.routes.forEach((methods, route) => {
         const hasRenderHandler = methods.some((m) => m.hasHandler);
         if (hasRenderHandler) {
            routesWithViews.push(route);
         } else {
            routesWithoutViews.push(route);
         }
      });

      // Analyze common patterns
      const expectedPages = [
         'pages/dashboard/system-admin',
         'pages/system/trusts/index',
         'pages/system/trusts/new',
         'pages/system/trusts/edit',
         'pages/system/schools/index',
         'pages/system/schools/new',
         'pages/system/schools/edit',
         'pages/system/users/roles',
         'pages/system/users/permissions',
         'pages/system/config/index',
         'pages/auth/login',
         'pages/auth/register',
         'pages/errors/404',
         'pages/errors/500',
      ];

      this.missingViews = expectedPages.filter((page) => !this.views.has(page));

      // Check navigation patterns
      this.analyzeNavigationCoverage();
   }

   analyzeNavigationCoverage() {
      console.log('🧭 Analyzing navigation coverage...');

      // Read navigation files to extract expected routes
      const navFiles = [
         'views/partials/nav/system-admin.ejs',
         'views/partials/nav/trust-admin.ejs',
         'views/partials/nav/teacher.ejs',
         'views/partials/nav/default.ejs',
      ];

      const navLinks = new Set();

      for (const navFile of navFiles) {
         const navPath = path.join(this.projectRoot, navFile);
         if (fs.existsSync(navPath)) {
            const content = fs.readFileSync(navPath, 'utf8');

            // Extract href attributes
            const hrefPattern = /href\s*=\s*['"`]([^'"`#]+)['"`]/g;
            let match;
            while ((match = hrefPattern.exec(content)) !== null) {
               const link = match[1];
               if (link.startsWith('/') && !link.includes('coming-soon')) {
                  navLinks.add(link);
               }
            }
         }
      }

      this.navLinks = Array.from(navLinks);
      console.log(`✅ Found ${this.navLinks.length} navigation links`);
   }

   generateAnalysis() {
      const routesList = Array.from(this.routes.keys());
      const viewsList = Array.from(this.views);

      this.analysis = {
         summary: {
            totalRoutes: routesList.length,
            totalViews: viewsList.length,
            totalNavLinks: this.navLinks.length,
            coverage: {
               routesWithViews: routesList.filter((route) => {
                  const methods = this.routes.get(route);
                  return methods.some((m) => m.hasHandler);
               }).length,
               missingViews: this.missingViews.length,
            },
         },
         routes: routesList.sort(),
         views: viewsList.sort(),
         navLinks: this.navLinks.sort(),
         missingViews: this.missingViews,
         gaps: this.identifyGaps(),
         recommendations: this.generateRecommendations(),
      };
   }

   identifyGaps() {
      const gaps = {
         missingRoutes: [],
         missingViews: [],
         brokenNavLinks: [],
      };

      // Check navigation links against routes
      for (const link of this.navLinks) {
         const route = link.replace(/^\//, '');
         if (!this.routes.has(route) && !this.routes.has(link)) {
            gaps.brokenNavLinks.push(link);
         }
      }

      // Common missing patterns
      const expectedRoutePatterns = [
         { route: 'students', view: 'pages/students/index' },
         { route: 'students/new', view: 'pages/students/new' },
         { route: 'fees/structure', view: 'pages/fees/structure' },
         { route: 'fees/collection', view: 'pages/fees/collection' },
         { route: 'reports/system', view: 'pages/reports/system' },
         { route: 'settings', view: 'pages/settings/index' },
      ];

      for (const pattern of expectedRoutePatterns) {
         if (!this.routes.has(pattern.route)) {
            gaps.missingRoutes.push(pattern.route);
         }
         if (!this.views.has(pattern.view)) {
            gaps.missingViews.push(pattern.view);
         }
      }

      return gaps;
   }

   generateRecommendations() {
      const recommendations = [];

      if (this.analysis?.gaps?.brokenNavLinks?.length > 0) {
         recommendations.push({
            priority: 'high',
            category: 'Navigation',
            title: 'Fix Broken Navigation Links',
            description: `${this.analysis.gaps.brokenNavLinks.length} navigation links point to non-existent routes`,
            actions: [
               'Implement missing route handlers',
               'Add placeholder/coming-soon pages',
               'Update navigation to remove invalid links',
            ],
         });
      }

      if (this.missingViews.length > 0) {
         recommendations.push({
            priority: 'medium',
            category: 'Views',
            title: 'Create Missing View Templates',
            description: `${this.missingViews.length} expected view templates are missing`,
            actions: [
               'Create missing EJS templates',
               'Ensure consistent layout structure',
               'Add proper error handling views',
            ],
         });
      }

      // Check for coming-soon dependencies
      const comingSoonCount = this.navLinks.filter((link) => link.includes('coming-soon')).length;

      if (comingSoonCount > 0) {
         recommendations.push({
            priority: 'low',
            category: 'Features',
            title: 'Implement Coming Soon Features',
            description: `${comingSoonCount} features are marked as "coming soon"`,
            actions: [
               'Prioritize feature development',
               'Create development roadmap',
               'Replace placeholders with actual functionality',
            ],
         });
      }

      return recommendations;
   }

   async saveReport() {
      const reportPath = path.join(this.projectRoot, 'reports', 'route-view-analysis.json');
      const reportDir = path.dirname(reportPath);

      if (!fs.existsSync(reportDir)) {
         fs.mkdirSync(reportDir, { recursive: true });
      }

      fs.writeFileSync(reportPath, JSON.stringify(this.analysis, null, 2));
      console.log(`📋 Analysis report saved to: ${reportPath}`);

      return reportPath;
   }

   printSummary() {
      const { summary, gaps, recommendations } = this.analysis;

      console.log('\n📊 ROUTE-VIEW ANALYSIS SUMMARY');
      console.log('===============================');
      console.log(`🛣️  Total Routes: ${summary.totalRoutes}`);
      console.log(`👀 Total Views: ${summary.totalViews}`);
      console.log(`🧭 Navigation Links: ${summary.totalNavLinks}`);
      console.log(`✅ Routes with Views: ${summary.coverage.routesWithViews}`);
      console.log(`❌ Missing Views: ${summary.coverage.missingViews}`);

      if (gaps.brokenNavLinks.length > 0) {
         console.log('\n❌ BROKEN NAVIGATION LINKS:');
         gaps.brokenNavLinks.forEach((link, index) => {
            console.log(`${index + 1}. ${link}`);
         });
      }

      if (gaps.missingRoutes.length > 0) {
         console.log('\n🚫 MISSING ROUTES:');
         gaps.missingRoutes.forEach((route, index) => {
            console.log(`${index + 1}. /${route}`);
         });
      }

      if (recommendations.length > 0) {
         console.log('\n💡 RECOMMENDATIONS:');
         recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
            console.log(`   Category: ${rec.category}`);
            console.log(`   ${rec.description}`);
            rec.actions.forEach((action) => {
               console.log(`   • ${action}`);
            });
            console.log();
         });
      }
   }

   async run() {
      try {
         await this.analyze();
         await this.saveReport();
         this.printSummary();

         return this.analysis;
      } catch (error) {
         console.error('❌ Route-view analysis failed:', error);
         throw error;
      }
   }
}

// CLI execution
if (require.main === module) {
   const analyzer = new RouteViewAnalyzer();
   analyzer
      .run()
      .then(() => {
         console.log('✅ Route-view analysis completed successfully');
         process.exit(0);
      })
      .catch((error) => {
         console.error('❌ Analysis failed:', error);
         process.exit(1);
      });
}

module.exports = RouteViewAnalyzer;
