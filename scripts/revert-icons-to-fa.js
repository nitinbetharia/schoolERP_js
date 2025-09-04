const fs = require('fs');
const path = require('path');

/**
 * Revert Bootstrap Icons back to Font Awesome Icons
 * Fixing the incorrect icon library replacement
 */

const iconReversions = {
   // Revert Bootstrap Icons back to Font Awesome
   'bi bi-house': 'fas fa-home',
   'bi bi-bank': 'fas fa-school',
   'bi bi-list': 'fas fa-list',
   'bi bi-plus-circle': 'fas fa-plus',
   'bi bi-easel': 'fas fa-chalkboard',
   'bi bi-diagram-3': 'fas fa-layer-group',
   'bi bi-mortarboard': 'fas fa-user-graduate',
   'bi bi-person-plus': 'fas fa-user-plus',
   'bi bi-file-earmark-arrow-up': 'fas fa-file-import',
   'bi bi-clipboard-check': 'fas fa-clipboard-list',
   'bi bi-folder2-open': 'fas fa-folder-open',
   'bi bi-people': 'fas fa-users',
   'bi bi-person-workspace': 'fas fa-chalkboard-teacher',
   'bi bi-clock': 'fas fa-clock',
   'bi bi-search': 'fas fa-search',
   'bi bi-funnel': 'fas fa-filter',
   'bi bi-arrow-clockwise': 'fas fa-refresh',
   'bi bi-download': 'fas fa-download',
   'bi bi-upload': 'fas fa-upload',
   'bi bi-gear': 'fas fa-cog',
   'bi bi-sliders': 'fas fa-sliders-h',
   'bi bi-bar-chart': 'fas fa-chart-bar',
   'bi bi-graph-up': 'fas fa-chart-line',
   'bi bi-envelope': 'fas fa-envelope',
   'bi bi-telephone': 'fas fa-phone',
   'bi bi-building': 'fas fa-building',
   'bi bi-shield-check': 'fas fa-shield-alt',
   'bi bi-server': 'fas fa-server',
   'bi bi-heart-pulse': 'fas fa-heartbeat',
   'bi bi-check-circle': 'fas fa-check-circle',
   'bi bi-x-circle': 'fas fa-times-circle',
   'bi bi-exclamation-circle': 'fas fa-exclamation-circle',
   'bi bi-exclamation-triangle': 'fas fa-exclamation-triangle',
   'bi bi-info-circle': 'fas fa-info-circle',
   'bi bi-question-circle': 'fas fa-question-circle',
   'bi bi-pencil-square': 'fas fa-edit',
   'bi bi-trash': 'fas fa-trash',
   'bi bi-floppy': 'fas fa-save',
   'bi bi-x': 'fas fa-times',
   'bi bi-arrow-left': 'fas fa-arrow-left',
   'bi bi-arrow-right': 'fas fa-arrow-right',
   'bi bi-chevron-left': 'fas fa-chevron-left',
   'bi bi-chevron-right': 'fas fa-chevron-right',
   'bi bi-book': 'fas fa-book',
   'bi bi-person': 'fas fa-user',
   'bi bi-person-circle': 'fas fa-user-circle',
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

function revertIconsInFile(filePath) {
   try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changes = 0;

      // Revert Bootstrap Icons back to Font Awesome
      for (const [bootstrapIcon, fontAwesomeIcon] of Object.entries(iconReversions)) {
         const regex = new RegExp(bootstrapIcon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
         const matches = content.match(regex);
         if (matches) {
            content = content.replace(regex, fontAwesomeIcon);
            changes += matches.length;
         }
      }

      if (changes > 0) {
         fs.writeFileSync(filePath, content, 'utf8');
         console.log(`✅ ${filePath.replace(process.cwd(), '.')}: ${changes} icons reverted to Font Awesome`);
         return changes;
      }

      return 0;
   } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return 0;
   }
}

function main() {
   console.log('🔄 Reverting Bootstrap Icons back to Font Awesome...\n');

   const viewsDir = path.join(process.cwd(), 'views');
   console.log('Views directory:', viewsDir);

   if (!fs.existsSync(viewsDir)) {
      console.error('Views directory not found!');
      return;
   }

   const ejsFiles = findEJSFiles(viewsDir);
   console.log(`Found ${ejsFiles.length} EJS files to process\n`);

   let totalChanges = 0;
   let filesChanged = 0;

   for (const file of ejsFiles) {
      const changes = revertIconsInFile(file);
      if (changes > 0) {
         totalChanges += changes;
         filesChanged++;
      }
   }

   console.log('\n📊 Icon Reversion Summary:');
   console.log(`   Files processed: ${ejsFiles.length}`);
   console.log(`   Files changed: ${filesChanged}`);
   console.log(`   Total icons reverted: ${totalChanges}`);
   console.log('\n✅ All icons reverted back to Font Awesome!');
}

if (require.main === module) {
   main();
}

module.exports = { iconReversions, revertIconsInFile };
