const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Icon Migration Script
 * Converts Font Awesome icons to Bootstrap Icons throughout the codebase
 */

const iconMappings = {
   // Basic Navigation
   'fas fa-home': 'bi bi-house',
   'fas fa-dashboard': 'bi bi-speedometer2',
   'fas fa-bars': 'bi bi-list',
   'fas fa-menu': 'bi bi-list',

   // User & Auth
   'fas fa-user': 'bi bi-person',
   'fas fa-users': 'bi bi-people',
   'fas fa-sign-in-alt': 'bi bi-box-arrow-in-right',
   'fas fa-sign-out-alt': 'bi bi-box-arrow-left',
   'fas fa-user-circle': 'bi bi-person-circle',

   // Actions & Controls
   'fas fa-plus': 'bi bi-plus-circle',
   'fas fa-plus-circle': 'bi bi-plus-circle',
   'fas fa-edit': 'bi bi-pencil-square',
   'fas fa-pencil-alt': 'bi bi-pencil-square',
   'fas fa-trash': 'bi bi-trash',
   'fas fa-delete': 'bi bi-trash',
   'fas fa-save': 'bi bi-floppy',
   'fas fa-times': 'bi bi-x',
   'fas fa-close': 'bi bi-x',

   // Search & Filter
   'fas fa-search': 'bi bi-search',
   'fas fa-filter': 'bi bi-funnel',
   'fas fa-refresh': 'bi bi-arrow-clockwise',
   'fas fa-reload': 'bi bi-arrow-clockwise',
   'fas fa-undo': 'bi bi-arrow-counterclockwise',

   // File Operations
   'fas fa-download': 'bi bi-download',
   'fas fa-upload': 'bi bi-upload',
   'fas fa-file': 'bi bi-file-text',
   'fas fa-folder': 'bi bi-folder',
   'fas fa-image': 'bi bi-image',

   // Status Icons
   'fas fa-check': 'bi bi-check',
   'fas fa-check-circle': 'bi bi-check-circle',
   'fas fa-times-circle': 'bi bi-x-circle',
   'fas fa-exclamation': 'bi bi-exclamation',
   'fas fa-exclamation-circle': 'bi bi-exclamation-circle',
   'fas fa-exclamation-triangle': 'bi bi-exclamation-triangle',
   'fas fa-info': 'bi bi-info',
   'fas fa-info-circle': 'bi bi-info-circle',
   'fas fa-warning': 'bi bi-exclamation-triangle',

   // Educational System
   'fas fa-school': 'bi bi-bank',
   'fas fa-graduation-cap': 'bi bi-mortarboard',
   'fas fa-chalkboard': 'bi bi-easel',
   'fas fa-chalkboard-teacher': 'bi bi-person-workspace',
   'fas fa-book': 'bi bi-book',
   'fas fa-books': 'bi bi-journals',
   'fas fa-layer-group': 'bi bi-diagram-3',
   'fas fa-list': 'bi bi-list',
   'fas fa-list-alt': 'bi bi-list-task',

   // Administrative
   'fas fa-building': 'bi bi-building',
   'fas fa-cog': 'bi bi-gear',
   'fas fa-cogs': 'bi bi-gears',
   'fas fa-settings': 'bi bi-sliders',
   'fas fa-sliders-h': 'bi bi-sliders',
   'fas fa-shield-alt': 'bi bi-shield-check',
   'fas fa-lock': 'bi bi-lock',
   'fas fa-unlock': 'bi bi-unlock',

   // Charts & Analytics
   'fas fa-chart-bar': 'bi bi-bar-chart',
   'fas fa-chart-line': 'bi bi-graph-up',
   'fas fa-chart-area': 'bi bi-graph-up-arrow',
   'fas fa-analytics': 'bi bi-graph-up',
   'fas fa-percentage': 'bi bi-percent',

   // Communication
   'fas fa-envelope': 'bi bi-envelope',
   'fas fa-phone': 'bi bi-telephone',
   'fas fa-comment': 'bi bi-chat',
   'fas fa-comments': 'bi bi-chat-dots',
   'fas fa-bell': 'bi bi-bell',

   // Navigation
   'fas fa-arrow-left': 'bi bi-arrow-left',
   'fas fa-arrow-right': 'bi bi-arrow-right',
   'fas fa-arrow-up': 'bi bi-arrow-up',
   'fas fa-arrow-down': 'bi bi-arrow-down',
   'fas fa-chevron-left': 'bi bi-chevron-left',
   'fas fa-chevron-right': 'bi bi-chevron-right',
   'fas fa-chevron-up': 'bi bi-chevron-up',
   'fas fa-chevron-down': 'bi bi-chevron-down',

   // System
   'fas fa-server': 'bi bi-server',
   'fas fa-database': 'bi bi-server',
   'fas fa-cloud': 'bi bi-cloud',
   'fas fa-wifi': 'bi bi-wifi',
   'fas fa-signal': 'bi bi-reception-4',
   'fas fa-heart': 'bi bi-heart',
   'fas fa-heartbeat': 'bi bi-heart-pulse',

   // Table & Data
   'fas fa-table': 'bi bi-table',
   'fas fa-th': 'bi bi-grid-3x3',
   'fas fa-th-large': 'bi bi-grid',
   'fas fa-th-list': 'bi bi-list-ul',

   // Misc
   'fas fa-question': 'bi bi-question',
   'fas fa-question-circle': 'bi bi-question-circle',
   'fas fa-lightbulb': 'bi bi-lightbulb',
   'fas fa-star': 'bi bi-star',
   'fas fa-calendar': 'bi bi-calendar',
   'fas fa-clock': 'bi bi-clock',
   'fas fa-eye': 'bi bi-eye',
   'fas fa-eye-slash': 'bi bi-eye-slash',
};

function findEJSFiles(dir) {
   let ejsFiles = [];

   try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
         const fullPath = path.join(dir, item);
         const stat = fs.statSync(fullPath);

         if (stat.isDirectory()) {
            ejsFiles = ejsFiles.concat(findEJSFiles(fullPath));
         } else if (item.endsWith('.ejs')) {
            ejsFiles.push(fullPath);
         }
      }
   } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
   }

   return ejsFiles;
}

function migrateIconsInFile(filePath) {
   try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changes = 0;

      // Replace each Font Awesome icon with Bootstrap Icons
      for (const [oldIcon, newIcon] of Object.entries(iconMappings)) {
         const regex = new RegExp(oldIcon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
         const matches = content.match(regex);
         if (matches) {
            content = content.replace(regex, newIcon);
            changes += matches.length;
         }
      }

      if (changes > 0) {
         fs.writeFileSync(filePath, content, 'utf8');
         console.log(`✅ ${filePath.replace(__dirname, '.')}: ${changes} icons migrated`);
         return changes;
      }

      return 0;
   } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return 0;
   }
}

function main() {
   console.log('🔄 Starting comprehensive icon migration...\n');

   const viewsDir = path.join(process.cwd(), 'views');
   console.log('Views directory:', viewsDir);

   const ejsFiles = findEJSFiles(viewsDir);

   console.log(`Found ${ejsFiles.length} EJS files to process\n`);

   let totalChanges = 0;
   let filesChanged = 0;

   for (const file of ejsFiles) {
      const changes = migrateIconsInFile(file);
      if (changes > 0) {
         totalChanges += changes;
         filesChanged++;
      }
   }

   console.log('\n📊 Migration Summary:');
   console.log(`   Files processed: ${ejsFiles.length}`);
   console.log(`   Files changed: ${filesChanged}`);
   console.log(`   Total icons migrated: ${totalChanges}`);
   console.log('\n✅ Icon migration completed successfully!');
}

if (require.main === module) {
   main();
}

module.exports = { iconMappings, migrateIconsInFile };
