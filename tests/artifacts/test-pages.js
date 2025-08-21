#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testPages() {
    console.log('🧪 Testing Page Rendering');
    console.log('='.repeat(40));
    
    const pages = [
        { name: 'Login Page', url: '/auth/login' },
        { name: 'System Dashboard (unauthenticated)', url: '/admin/system' },
        { name: 'Profile Page (unauthenticated)', url: '/admin/system/profile' }
    ];

    for (const page of pages) {
        try {
            console.log(`\n📄 Testing ${page.name}`);
            const response = await fetch(`${BASE_URL}${page.url}`);
            
            if (response.ok) {
                const html = await response.text();
                const hasHtml = html.includes('<html');
                const hasTailwind = html.includes('tailwindcss');
                const hasFontAwesome = html.includes('font-awesome');
                const hasAlpine = html.includes('alpinejs');
                const hasError = html.includes('Error') || html.includes('500');
                
                console.log(`✅ Status: ${response.status} ${response.statusText}`);
                console.log(`📝 HTML Document: ${hasHtml ? '✅' : '❌'}`);
                console.log(`🎨 Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`);  
                console.log(`🎯 Font Awesome: ${hasFontAwesome ? '✅' : '❌'}`);
                console.log(`⚡ Alpine.js: ${hasAlpine ? '✅' : '❌'}`);
                console.log(`❗ Has Errors: ${hasError ? '❌ YES' : '✅ NO'}`);
                
                if (hasError && html.length < 1000) {
                    console.log('📋 Error Preview:');
                    console.log(html.substring(0, 300) + '...');
                }
            } else {
                console.log(`❌ Status: ${response.status} ${response.statusText}`);
                if (response.status === 302) {
                    console.log(`🔄 Redirect to: ${response.headers.get('location')}`);
                }
            }
        } catch (error) {
            console.log(`❌ Network Error: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(40));
    console.log('✅ Page Testing Complete');
}

testPages();