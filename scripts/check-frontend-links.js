const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Frontend Link Checker
 * Crawls all pages and verifies endpoint availability
 */
class FrontendLinkChecker {
   constructor() {
      this.baseUrl = process.env.APP_URL || 'http://localhost:3000';
      this.results = {
         pages: [],
         links: [],
         broken: [],
         working: [],
         summary: {},
      };
      this.browser = null;
      this.page = null;
      this.visitedUrls = new Set();
      this.crawledPages = new Set();
   }

   async initialize() {
      console.log('🚀 Initializing Frontend Link Checker...');
      this.browser = await puppeteer.launch({
         headless: 'new',
         args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.page = await this.browser.newPage();

      // Set user agent
      await this.page.setUserAgent('SchoolERP-LinkChecker/1.0');

      // Set viewport
      await this.page.setViewport({ width: 1280, height: 720 });

      // Handle console logs
      this.page.on('console', (msg) => {
         if (msg.type() === 'error') {
            console.log('❌ Browser Console Error:', msg.text());
         }
      });
   }

   async checkEndpointExists(url) {
      try {
         const response = await this.page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000,
         });

         const status = response.status();
         const isWorking = status >= 200 && status < 400;

         const hasContent = await this.page.$eval('body', (el) => el.textContent.length > 100).catch(() => false);

         return {
            url,
            status,
            isWorking,
            error: null,
            title: await this.page.title(),
            hasContent,
         };
      } catch (error) {
         return {
            url,
            status: null,
            isWorking: false,
            error: error.message,
            title: null,
            hasContent: false,
         };
      }
   }

   async extractLinksFromPage(url) {
      try {
         console.log(`📖 Crawling: ${url}`);
         const response = await this.page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000,
         });

         if (response.status() >= 400) {
            console.log(`❌ Failed to load: ${url} (${response.status()})`);
            return [];
         }

         // Extract all links from the page
         const links = await this.page.evaluate(() => {
            /* global document */
            const anchors = Array.from(document.querySelectorAll('a[href]'));
            const forms = Array.from(document.querySelectorAll('form[action]'));

            const linkData = [];

            // Process anchor tags
            anchors.forEach((anchor) => {
               const href = anchor.getAttribute('href');
               if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                  const closestParent = anchor.closest('.nav-item, .dropdown-menu, .card, .btn-group');
                  linkData.push({
                     type: 'link',
                     url: href,
                     text: anchor.textContent?.trim() || '',
                     classes: anchor.className || '',
                     parent: closestParent?.className || '',
                  });
               }
            });

            // Process form actions
            forms.forEach((form) => {
               const action = form.getAttribute('action');
               if (action) {
                  linkData.push({
                     type: 'form',
                     url: action,
                     method: form.getAttribute('method') || 'GET',
                     text: `Form: ${action}`,
                     classes: form.className || '',
                  });
               }
            });

            return linkData;
         });

         this.crawledPages.add(url);

         // Store page info
         this.results.pages.push({
            url,
            title: await this.page.title(),
            linksCount: links.length,
            status: response.status(),
         });

         return links;
      } catch (error) {
         console.log(`❌ Error crawling ${url}: ${error.message}`);
         return [];
      }
   }

   normalizeUrl(url, baseUrl) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
         return url;
      }
      if (url.startsWith('/')) {
         return baseUrl + url;
      }
      return baseUrl + '/' + url;
   }

   async checkAllLinks() {
      console.log('🔍 Starting comprehensive link check...');

      // Define starting pages to crawl
      const startPages = [
         '/',
         '/auth/login',
         '/dashboard',
         '/system',
         '/system/trusts',
         '/system/schools',
         '/system/users/roles',
         '/system/users/permissions',
         '/system/config/general',
         '/admin/user-management',
      ];

      const allLinks = new Set();

      // Extract links from all starting pages
      for (const startPage of startPages) {
         const fullUrl = this.normalizeUrl(startPage, this.baseUrl);
         if (!this.visitedUrls.has(fullUrl)) {
            const pageLinks = await this.extractLinksFromPage(fullUrl);
            pageLinks.forEach((link) => {
               const normalizedUrl = this.normalizeUrl(link.url, this.baseUrl);
               const baseDomain = this.baseUrl.replace('http://', '').replace('https://', '');
               if (normalizedUrl.includes(baseDomain)) {
                  allLinks.add(JSON.stringify({ ...link, url: normalizedUrl }));
               }
            });
            this.visitedUrls.add(fullUrl);
         }
      }

      // Convert back to objects and deduplicate
      const uniqueLinks = Array.from(allLinks).map((link) => JSON.parse(link));
      const uniqueUrls = [...new Set(uniqueLinks.map((link) => link.url))];

      console.log(`📊 Found ${uniqueUrls.length} unique URLs to check`);

      // Check each unique URL
      for (let i = 0; i < uniqueUrls.length; i++) {
         const url = uniqueUrls[i];
         console.log(`🔗 Checking (${i + 1}/${uniqueUrls.length}): ${url}`);

         const result = await this.checkEndpointExists(url);
         this.results.links.push(result);

         if (result.isWorking) {
            this.results.working.push(result);
            console.log(`✅ ${url} - ${result.status}`);
         } else {
            this.results.broken.push(result);
            const errorMsg = result.error || 'Unknown error';
            console.log(`❌ ${url} - ${result.status || 'ERROR'}: ${errorMsg}`);
         }

         // Small delay to avoid overwhelming the server
         await new Promise((resolve) => setTimeout(resolve, 100));
      }
   }

   generateReport() {
      const total = this.results.links.length;
      const working = this.results.working.length;
      const broken = this.results.broken.length;

      this.results.summary = {
         totalLinks: total,
         workingLinks: working,
         brokenLinks: broken,
         successRate: total > 0 ? ((working / total) * 100).toFixed(2) : 0,
         pagesScanned: this.results.pages.length,
         timestamp: new Date().toISOString(),
      };

      // Generate detailed report
      const report = {
         summary: this.results.summary,
         pages: this.results.pages,
         workingLinks: this.results.working.map((link) => ({
            url: link.url,
            status: link.status,
            title: link.title,
         })),
         brokenLinks: this.results.broken.map((link) => ({
            url: link.url,
            status: link.status,
            error: link.error,
            title: link.title,
         })),
         linksByType: this.categorizeLinks(),
         recommendations: this.generateRecommendations(),
      };

      return report;
   }

   categorizeLinks() {
      const categories = {
         system: [],
         auth: [],
         dashboard: [],
         api: [],
         static: [],
         external: [],
         other: [],
      };

      this.results.links.forEach((link) => {
         const url = link.url.toLowerCase();
         if (url.includes('/system')) {
            categories.system.push(link);
         } else if (url.includes('/auth')) {
            categories.auth.push(link);
         } else if (url.includes('/dashboard')) {
            categories.dashboard.push(link);
         } else if (url.includes('/api')) {
            categories.api.push(link);
         } else if (url.includes('/static') || url.includes('/css') || url.includes('/js') || url.includes('/images')) {
            categories.static.push(link);
         } else if (!url.includes(this.baseUrl)) {
            categories.external.push(link);
         } else {
            categories.other.push(link);
         }
      });

      return categories;
   }

   generateRecommendations() {
      const recommendations = [];

      if (this.results.broken.length > 0) {
         const brokenCount = this.results.broken.length;
         recommendations.push({
            type: 'critical',
            title: 'Fix Broken Links',
            description: `${brokenCount} broken links found that need immediate attention`,
            action: 'Review broken links list and implement missing routes or fix redirects',
         });
      }

      const missingPages = this.results.broken.filter(
         (link) => link.status === 404 && !link.url.includes('/coming-soon')
      );

      if (missingPages.length > 0) {
         recommendations.push({
            type: 'high',
            title: 'Implement Missing Pages',
            description: `${missingPages.length} pages return 404 and may need implementation`,
            action: 'Create missing route handlers and view templates',
         });
      }

      const comingSoonPages = this.results.working.filter(
         (link) => link.url.includes('/coming-soon') || (link.title && link.title.toLowerCase().includes('coming soon'))
      );

      if (comingSoonPages.length > 0) {
         recommendations.push({
            type: 'medium',
            title: 'Complete Coming Soon Features',
            description: `${comingSoonPages.length} features are marked as "coming soon"`,
            action: 'Prioritize and implement placeholder features',
         });
      }

      return recommendations;
   }

   async cleanup() {
      if (this.browser) {
         await this.browser.close();
      }
   }

   async run() {
      try {
         await this.initialize();
         await this.checkAllLinks();
         const report = this.generateReport();

         // Save report to file
         const reportPath = path.join(__dirname, '..', 'reports', 'frontend-link-check.json');
         const reportDir = path.dirname(reportPath);

         if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
         }

         fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

         // Print summary
         console.log('\n📊 FRONTEND LINK CHECK SUMMARY');
         console.log('===============================');
         console.log(`🔗 Total Links Checked: ${report.summary.totalLinks}`);
         console.log(`✅ Working Links: ${report.summary.workingLinks}`);
         console.log(`❌ Broken Links: ${report.summary.brokenLinks}`);
         console.log(`📄 Pages Scanned: ${report.summary.pagesScanned}`);
         console.log(`📈 Success Rate: ${report.summary.successRate}%`);

         if (report.brokenLinks.length > 0) {
            console.log('\n❌ BROKEN LINKS:');
            report.brokenLinks.forEach((link, index) => {
               const status = link.status || 'ERROR';
               const error = link.error || 'Unknown';
               console.log(`${index + 1}. ${link.url} - ${status}: ${error}`);
            });
         }

         if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, index) => {
               console.log(`${index + 1}. [${rec.type.toUpperCase()}] ${rec.title}`);
               console.log(`   ${rec.description}`);
               console.log(`   Action: ${rec.action}\n`);
            });
         }

         console.log(`📋 Full report saved to: ${reportPath}`);

         return report;
      } catch (error) {
         console.error('❌ Link checker failed:', error);
         throw error;
      } finally {
         await this.cleanup();
      }
   }
}

// CLI execution
if (require.main === module) {
   const checker = new FrontendLinkChecker();
   checker
      .run()
      .then(() => {
         console.log('✅ Frontend link check completed successfully');
         process.exit(0);
      })
      .catch((error) => {
         console.error('❌ Frontend link check failed:', error);
         process.exit(1);
      });
}

module.exports = FrontendLinkChecker;
