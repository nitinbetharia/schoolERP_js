const fs = require('fs');
const path = require('path');

// Direct Font Awesome to Bootstrap Icons replacements
const replacements = [
   // Staff & User related
   ['fas fa-user-plus', 'bi bi-person-plus'],
   ['fas fa-users', 'bi bi-people'],
   ['fas fa-user', 'bi bi-person'],
   ['fas fa-user-graduate', 'bi bi-mortarboard'],
   ['fas fa-chalkboard-teacher', 'bi bi-person-workspace'],

   // Navigation & Actions
   ['fas fa-home', 'bi bi-house'],
   ['fas fa-list', 'bi bi-list'],
   ['fas fa-plus', 'bi bi-plus-circle'],
   ['fas fa-clock', 'bi bi-clock'],
   ['fas fa-cog', 'bi bi-gear'],

   // Educational
   ['fas fa-school', 'bi bi-bank'],
   ['fas fa-graduation-cap', 'bi bi-mortarboard'],
   ['fas fa-chalkboard', 'bi bi-easel'],
   ['fas fa-book', 'bi bi-book'],

   // Files & Documents
   ['fas fa-file-import', 'bi bi-file-earmark-arrow-up'],
   ['fas fa-folder-open', 'bi bi-folder2-open'],
   ['fas fa-clipboard-list', 'bi bi-clipboard-check'],

   // Money & Finance
   ['fas fa-money-bill-wave', 'bi bi-cash-stack'],
   ['fas fa-cash-register', 'bi bi-calculator'],
   ['fas fa-dollar-sign', 'bi bi-currency-dollar'],

   // Charts & Reports
   ['fas fa-chart-bar', 'bi bi-bar-chart'],
   ['fas fa-chart-line', 'bi bi-graph-up'],
   ['fas fa-chart-pie', 'bi bi-pie-chart'],

   // Status & Alerts
   ['fas fa-exclamation-triangle', 'bi bi-exclamation-triangle'],
   ['fas fa-check-square', 'bi bi-check-square'],
   ['fas fa-calendar-check', 'bi bi-calendar-check'],

   // Misc
   ['fas fa-question-circle', 'bi bi-question-circle'],
   ['fas fa-star', 'bi bi-star'],
   ['fas fa-eye', 'bi bi-eye'],

   // URL parameter replacements (in href attributes)
   ['icon=fas fa-chalkboard', 'icon=bi bi-easel'],
   ['icon=fas fa-layer-group', 'icon=bi bi-diagram-3'],
   ['icon=fas fa-file-import', 'icon=bi bi-file-earmark-arrow-up'],
   ['icon=fas fa-clipboard-list', 'icon=bi bi-clipboard-check'],
   ['icon=fas fa-folder-open', 'icon=bi bi-folder2-open'],
   ['icon=fas fa-chalkboard-teacher', 'icon=bi bi-person-workspace'],
   ['icon=fas fa-user-plus', 'icon=bi bi-person-plus'],
   ['icon=fas fa-clock', 'icon=bi bi-clock'],
];

function findEJSFiles(dir) {
   let ejsFiles = [];

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

   return ejsFiles;
}

function replaceIconsInFile(filePath) {
   let content = fs.readFileSync(filePath, 'utf8');
   let changes = 0;

   for (const [oldIcon, newIcon] of replacements) {
      if (content.includes(oldIcon)) {
         content = content.replace(new RegExp(oldIcon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newIcon);
         changes++;
      }
   }

   if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${changes} icons replaced`);
   }

   return changes;
}

console.log('🚀 Direct Font Awesome to Bootstrap Icons replacement...\n');

const viewsDir = path.join(process.cwd(), 'views');
const ejsFiles = findEJSFiles(viewsDir);

let totalChanges = 0;
let filesChanged = 0;

for (const file of ejsFiles) {
   const changes = replaceIconsInFile(file);
   if (changes > 0) {
      totalChanges += changes;
      filesChanged++;
   }
}

console.log('\n📊 Replacement Summary:');
console.log(`Files processed: ${ejsFiles.length}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Total replacements: ${totalChanges}`);
console.log('\n✅ Icon replacement completed!');
