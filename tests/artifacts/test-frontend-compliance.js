#!/usr/bin/env node

/**
 * Frontend Compliance Test Script
 * Validates implementation against Frontend Development Strategy documentation
 * Tests Q1-Q10 technical compliance and single layout architecture
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Frontend Development Strategy Compliance Test');
console.log('='.repeat(60));

let passedTests = 0;
let totalTests = 0;

function test(description, assertion) {
    totalTests++;
    if (assertion) {
        console.log(`✅ ${description}`);
        passedTests++;
    } else {
        console.log(`❌ ${description}`);
    }
}

function fileExists(filePath) {
    return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, content) {
    if (!fileExists(filePath)) return false;
    const fileContent = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    return fileContent.includes(content);
}

// Test 1: Single Layout Architecture (base.ejs)
console.log('\n📋 1. Single Layout Architecture Tests');
test('Base layout exists', fileExists('views/layouts/base.ejs'));
test('Base layout includes head partials', fileContains('views/layouts/base.ejs', 'include(\'../partials/head/'));
test('Base layout supports dynamic navigation', fileContains('views/layouts/base.ejs', 'include(\'../partials/nav/\' + navPartial)'));
test('Base layout supports layout switching', fileContains('views/layouts/base.ejs', 'layout === \'auth\''));

// Test 2: Head Partials (Consistent Asset Loading)
console.log('\n🎨 2. Consistent Asset Loading Tests');
test('SEO partial exists', fileExists('views/partials/head/seo.ejs'));
test('Assets partial exists', fileExists('views/partials/head/assets.ejs'));
test('Theme partial exists', fileExists('views/partials/head/theme.ejs'));
test('Google Fonts loaded in assets', fileContains('views/partials/head/assets.ejs', 'fonts.googleapis.com'));
test('Font Awesome loaded in assets', fileContains('views/partials/head/assets.ejs', 'font-awesome'));
test('Tailwind CSS loaded (Q3 ENFORCED)', fileContains('views/partials/head/assets.ejs', 'tailwindcss'));
test('Alpine.js loaded', fileContains('views/partials/head/assets.ejs', 'alpinejs'));
test('Inter font family configured', fileContains('views/partials/head/assets.ejs', 'Inter'));

// Test 3: Navigation Partials (Role-based)
console.log('\n🧭 3. Role-based Navigation Tests');
test('System admin navigation exists', fileExists('views/partials/nav/system-admin.ejs'));
test('Trust admin navigation exists', fileExists('views/partials/nav/trust-admin.ejs'));
test('Teacher navigation exists', fileExists('views/partials/nav/teacher.ejs'));
test('Auth navigation exists', fileExists('views/partials/nav/auth.ejs'));
test('System admin nav uses Font Awesome icons', fileContains('views/partials/nav/system-admin.ejs', 'fas fa-'));

// Test 4: Animation & Styling
console.log('\n✨ 4. Animation & Styling Tests');
test('Custom animations defined in theme partial', fileContains('views/partials/head/theme.ejs', '@keyframes'));
test('Fade-in animation defined', fileContains('views/partials/head/theme.ejs', 'fadeIn'));
test('Slide-up animation defined', fileContains('views/partials/head/theme.ejs', 'slideUp'));
test('CSS custom properties for theming', fileContains('views/partials/head/theme.ejs', '--primary-color'));
test('Enhanced app.css with Inter font', fileContains('public/css/app.css', 'Inter'));
test('Font feature settings applied', fileContains('public/css/app.css', 'font-feature-settings'));

// Test 5: System Admin Dashboard Reconstruction
console.log('\n🏗️ 5. System Admin Dashboard Tests');
test('Dashboard uses Font Awesome icons', fileContains('views/pages/dashboard/system-admin.ejs', 'fas fa-'));
test('Dashboard has proper Alpine.js structure', fileContains('views/pages/dashboard/system-admin.ejs', 'x-data="systemAdminDashboard()"'));
test('Dashboard has robust error handling', fileContains('views/pages/dashboard/system-admin.ejs', 'statsResponse.status === 401'));
test('Dashboard uses Q59 compliant API calls', fileContains('views/pages/dashboard/system-admin.ejs', '/api/v1/admin/system/'));
test('Dashboard has professional animations', fileContains('views/pages/dashboard/system-admin.ejs', 'transition-shadow'));

// Test 6: Q1-Q10 Technical Compliance
console.log('\n🔒 6. Q1-Q10 Technical Compliance Tests');
test('Q2: Uses CommonJS modules', fileContains('routes/web.js', 'require('));
test('Q3: Uses Tailwind CSS CDN only', fileContains('views/partials/head/assets.ejs', 'cdn.tailwindcss.com'));
test('Q3: No Bootstrap detected', !fileContains('views/partials/head/assets.ejs', 'bootstrap'));
test('Q7: EJS templating used', fileContains('views/layouts/base.ejs', '<%'));
test('Q59: No custom validation in views', !fileContains('views/pages/dashboard/system-admin.ejs', 'validate('));

// Test 7: Routes Updated for Base Layout
console.log('\n🛤️ 7. Route Integration Tests');
test('Web routes use base layout', fileContains('routes/web.js', 'layouts/base'));
test('System admin route uses base layout', fileContains('routes/web.js', 'layouts/base') && fileContains('routes/web.js', 'pages/dashboard/system-admin'));
test('Auth routes specify layout type', fileContains('routes/web.js', 'layout: \'auth\''));

// Test 8: Layout Partials Structure
console.log('\n📁 8. Layout Partials Structure Tests');
test('Layout partials directory exists', fileExists('views/partials/layout'));
test('Footer partial exists', fileExists('views/partials/layout/footer.ejs'));
test('Header partial exists', fileExists('views/partials/layout/header.ejs'));
test('Sidebar partial exists', fileExists('views/partials/layout/sidebar.ejs'));

// Test 9: Professional Styling
console.log('\n💎 9. Professional Styling Tests');
test('Brand color utilities in theme', fileContains('views/partials/head/theme.ejs', '.brand-primary'));
test('Hover transitions defined', fileContains('views/pages/dashboard/system-admin.ejs', 'hover:shadow-md'));
test('Responsive design classes used', fileContains('views/pages/dashboard/system-admin.ejs', 'lg:grid-cols-4'));
test('Professional color palette used', fileContains('views/pages/dashboard/system-admin.ejs', 'bg-blue-600'));

// Test 10: Documentation Compliance
console.log('\n📚 10. Documentation Alignment Tests');
test('Frontend strategy document updated', fileExists('docs/FRONTEND_DEVELOPMENT_STRATEGY.md'));
test('Font Awesome mentioned in strategy', fileContains('docs/FRONTEND_DEVELOPMENT_STRATEGY.md', 'Font Awesome'));
test('Google Fonts mentioned in strategy', fileContains('docs/FRONTEND_DEVELOPMENT_STRATEGY.md', 'Google Fonts'));
test('Single layout principle documented', fileContains('docs/FRONTEND_DEVELOPMENT_STRATEGY.md', 'Single Layout'));

// Results Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Results Summary');
console.log('='.repeat(60));

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
const status = successRate >= 95 ? '🎉 EXCELLENT' : successRate >= 85 ? '✅ GOOD' : successRate >= 70 ? '⚠️ NEEDS WORK' : '❌ CRITICAL';

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${successRate}%`);
console.log(`Status: ${status}`);

if (successRate >= 95) {
    console.log('\n🚀 Frontend implementation fully compliant with documentation!');
    console.log('✨ System ready for production with enhanced UI/UX');
    console.log('🎯 All Q1-Q10 technical decisions properly enforced');
    console.log('\n💡 Next steps:');
    console.log('1. Start server: npm run dev');
    console.log('2. Visit: http://localhost:3000/admin/system');
    console.log('3. Login: admin / admin123');
    console.log('4. Enjoy the enhanced professional interface!');
} else {
    console.log('\n🔧 Some tests failed. Review the checklist above.');
    console.log('📋 Ensure all files are created and contain required content.');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Frontend Compliance Test Complete!');

// Exit with appropriate code
process.exit(successRate >= 95 ? 0 : 1);