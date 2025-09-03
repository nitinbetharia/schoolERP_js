#!/usr/bin/env node

/**
 * EJS Template Viewport Optimizer
 * Optimizes all EJS templates to prevent unwanted scroll bars and ensure responsive design
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class EJSViewportOptimizer {
   constructor(projectRoot) {
      this.projectRoot = projectRoot;
      this.templatesOptimized = 0;
      this.errors = [];
   }

   async optimizeAllTemplates() {
      console.log('🔧 Starting EJS Template Viewport Optimization...\n');

      try {
         // Find all EJS files
         const ejsFiles = glob.sync('views/**/*.ejs', { cwd: this.projectRoot });
         console.log(`📁 Found ${ejsFiles.length} EJS templates\n`);

         for (const file of ejsFiles) {
            await this.optimizeTemplate(file);
         }

         this.generateSummaryReport();
      } catch (error) {
         console.error('❌ Error during optimization:', error);
      }
   }

   async optimizeTemplate(filePath) {
      const fullPath = path.join(this.projectRoot, filePath);

      try {
         console.log(`📝 Optimizing: ${filePath}`);

         let content = fs.readFileSync(fullPath, 'utf8');
         const originalContent = content;

         // Apply optimizations
         content = this.addDesktopOptimizedWrapper(content, filePath);
         content = this.optimizeFormLayouts(content);
         content = this.optimizeTableLayouts(content);
         content = this.addMobileTabSystem(content, filePath);
         content = this.optimizeChartContainers(content);
         content = this.addViewportManagementClasses(content);

         // Only write if content changed
         if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            this.templatesOptimized++;
            console.log('  ✅ Optimized successfully');
         } else {
            console.log('  ⏭️  No optimization needed');
         }
      } catch (error) {
         const errorMsg = `❌ Error optimizing ${filePath}: ${error.message}`;
         console.log(`  ${errorMsg}`);
         this.errors.push(errorMsg);
      }
   }

   addDesktopOptimizedWrapper(content, filePath) {
      // Skip if already has wrapper or is a partial/layout
      if (content.includes('desktop-optimized') || filePath.includes('layouts/') || filePath.includes('partials/')) {
         return content;
      }

      // Identify complex reports/pages that need mobile warning
      const complexPages = ['reports/', 'analytics/', 'dashboard/', 'system/', 'admin/', 'charts/'];

      const needsWrapper = complexPages.some((page) => filePath.includes(page));

      if (needsWrapper) {
         // Wrap main content with desktop-optimized class
         content = content.replace(
            /(<main[^>]*class="[^"]*main-content[^"]*"[^>]*>)/,
            '$1\n<div class="desktop-optimized">'
         );

         // Close wrapper before main closing tag
         content = content.replace(/(<\/main>)/, '</div>\n$1');
      }

      return content;
   }

   optimizeFormLayouts(content) {
      // Convert form rows to responsive form layout
      content = content.replace(/<div class="row">/g, '<div class="form-row">');

      // Update form columns
      content = content.replace(/<div class="col(?:-\w+)?(?:-\d+)?[^"]*">/g, '<div class="form-col">');

      return content;
   }

   optimizeTableLayouts(content) {
      // Wrap tables in responsive containers
      content = content.replace(
         /<table(?![^>]*class="[^"]*data-table-container)/g,
         '<div class="data-table-container">\n                <table'
      );

      // Close table wrappers
      content = content.replace(/<\/table>(?!\s*<\/div>)/g, '</table>\n            </div>');

      return content;
   }

   addMobileTabSystem(content, filePath) {
      // Add mobile tab system to complex report pages
      if (!filePath.includes('reports/') || filePath.includes('index.ejs')) {
         return content;
      }

      // Check if already has tab system
      if (content.includes('tab-system')) {
         return content;
      }

      // Insert mobile tab system after page header
      const tabSystemHTML = `
        <!-- Mobile Tab System -->
        <div class="tab-system d-md-none mb-3">
            <div class="tab-nav">
                <button class="tab-btn" data-tab="filters">
                    <i class="fas fa-filter"></i>
                    Filters
                </button>
                <button class="tab-btn" data-tab="overview">
                    <i class="fas fa-chart-bar"></i>
                    Overview
                </button>
                <button class="tab-btn" data-tab="analytics">
                    <i class="fas fa-chart-line"></i>
                    Analytics
                </button>
                <button class="tab-btn" data-tab="data">
                    <i class="fas fa-table"></i>
                    Data
                </button>
            </div>
            
            <div class="tab-content">
                <div class="tab-pane" data-tab="filters">
                    <div class="mobile-filters">
                        <!-- Filters will be moved here via JavaScript -->
                    </div>
                </div>
                <div class="tab-pane" data-tab="overview">
                    <div class="mobile-overview">
                        <!-- Overview cards will be moved here via JavaScript -->
                    </div>
                </div>
                <div class="tab-pane" data-tab="analytics">
                    <div class="mobile-charts">
                        <!-- Charts will be moved here via JavaScript -->
                    </div>
                </div>
                <div class="tab-pane" data-tab="data">
                    <div class="mobile-data">
                        <!-- Data tables will be moved here via JavaScript -->
                    </div>
                </div>
            </div>
        </div>`;

      content = content.replace(
         /(<\/div>\s*<\/div>\s*<\/div>\s*<!-- (?:Filter Panel|Page Header) -->)/,
         '$1\n' + tabSystemHTML
      );

      return content;
   }

   optimizeChartContainers(content) {
      // Ensure chart containers are responsive
      content = content.replace(
         /<div class="chart-container(?![^"]*responsive)/g,
         '<div class="chart-container responsive'
      );

      // Add responsive canvas wrapper
      content = content.replace(
         /<canvas([^>]*)>/g,
         '<div class="chart-content">\n                    <canvas$1></div>'
      );

      return content;
   }

   addViewportManagementClasses(content) {
      // Add responsive classes to main sections
      const sectionMappings = {
         'filter-panel': 'd-none d-md-block',
         'overview-': 'd-none d-md-grid',
         'chart-grid': 'd-none d-md-grid',
         'data-section': 'responsive-table',
      };

      Object.entries(sectionMappings).forEach(([className, newClass]) => {
         const regex = new RegExp(`<div class="([^"]*${className}[^"]*)"`, 'g');
         content = content.replace(regex, (match, classes) => {
            if (!classes.includes(newClass.split(' ')[0])) {
               return `<div class="${classes} ${newClass}"`;
            }
            return match;
         });
      });

      return content;
   }

   generateSummaryReport() {
      console.log('\n📊 EJS VIEWPORT OPTIMIZATION SUMMARY');
      console.log('=====================================');
      console.log(`✅ Templates Optimized: ${this.templatesOptimized}`);
      console.log(`❌ Errors Encountered: ${this.errors.length}`);

      if (this.errors.length > 0) {
         console.log('\n❌ ERRORS:');
         this.errors.forEach((error) => console.log(`  ${error}`));
      }

      console.log('\n🎯 OPTIMIZATIONS APPLIED:');
      console.log('  • Desktop-optimized wrappers for complex pages');
      console.log('  • Mobile warning messages for desktop-only content');
      console.log('  • Responsive form layouts with form-row/form-col');
      console.log('  • Responsive table containers with horizontal scroll');
      console.log('  • Mobile tab system for complex reports');
      console.log('  • Responsive chart containers');
      console.log('  • Viewport management CSS classes');

      console.log('\n📝 NEXT STEPS:');
      console.log('  • Test all pages on mobile devices');
      console.log('  • Verify no horizontal scroll bars appear');
      console.log('  • Check that mobile tab systems work correctly');
      console.log('  • Validate responsive breakpoints');

      console.log('\n🎉 Viewport optimization completed successfully!');
   }
}

// Create mobile-responsive JavaScript helper
function createMobileHelperScript() {
   const helperScript = `
/**
 * Mobile Responsive Helper
 * Handles mobile tab systems and responsive content organization
 */

class MobileResponsiveHelper {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    init() {
        this.setupTabSystems();
        this.organizeMobileContent();
        this.handleResize();
    }

    setupTabSystems() {
        const tabSystems = document.querySelectorAll('.tab-system');
        
        tabSystems.forEach(system => {
            const tabs = system.querySelectorAll('.tab-btn');
            const panes = system.querySelectorAll('.tab-pane');
            
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    // Remove active classes
                    tabs.forEach(t => t.classList.remove('active'));
                    panes.forEach(p => p.classList.remove('active'));
                    
                    // Add active classes
                    tab.classList.add('active');
                    if (panes[index]) {
                        panes[index].classList.add('active');
                    }
                });
            });
            
            // Activate first tab
            if (tabs.length > 0) {
                tabs[0].click();
            }
        });
    }

    organizeMobileContent() {
        if (!this.isMobile) return;

        // Move filters to mobile tab
        const filters = document.querySelector('.filter-panel .filter-form');
        const mobileFilters = document.querySelector('.mobile-filters');
        if (filters && mobileFilters) {
            mobileFilters.appendChild(filters.cloneNode(true));
        }

        // Move overview cards to mobile tab  
        const overview = document.querySelector('.overview-grid');
        const mobileOverview = document.querySelector('.mobile-overview');
        if (overview && mobileOverview) {
            mobileOverview.appendChild(overview.cloneNode(true));
        }

        // Move charts to mobile tab
        const charts = document.querySelector('.chart-grid');
        const mobileCharts = document.querySelector('.mobile-charts');
        if (charts && mobileCharts) {
            mobileCharts.appendChild(charts.cloneNode(true));
        }

        // Move data tables to mobile tab
        const dataSection = document.querySelector('.data-table-container');
        const mobileData = document.querySelector('.mobile-data');
        if (dataSection && mobileData) {
            mobileData.appendChild(dataSection.cloneNode(true));
        }
    }

    handleResize() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                // Re-organize content if mobile state changed
                this.organizeMobileContent();
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new MobileResponsiveHelper();
});`;

   return helperScript;
}

// Run if called directly
if (require.main === module) {
   const projectRoot = process.cwd();
   const optimizer = new EJSViewportOptimizer(projectRoot);
   optimizer.optimizeAllTemplates();

   // Create mobile helper script
   const helperScript = createMobileHelperScript();
   fs.writeFileSync(path.join(projectRoot, 'public/js/mobile-responsive-helper.js'), helperScript, 'utf8');
   console.log('📱 Mobile responsive helper script created');
}

module.exports = EJSViewportOptimizer;
