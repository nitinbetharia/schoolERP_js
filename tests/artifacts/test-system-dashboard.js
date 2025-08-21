#!/usr/bin/env node

/**
 * System Admin Dashboard Test Script
 * Tests the main API endpoints used by the system admin dashboard
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1/admin/system`;

async function testSystemAdminDashboard() {
    console.log('🧪 Testing System Admin Dashboard Endpoints');
    console.log('='.repeat(50));
    
    let sessionCookie = null;
    
    try {
        // Test 1: Login
        console.log('1. Testing System Admin Login...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });
        
        if (loginResponse.ok) {
            const setCookieHeader = loginResponse.headers.get('set-cookie');
            if (setCookieHeader) {
                sessionCookie = setCookieHeader.split(';')[0];
                console.log('✅ Login successful');
            } else {
                console.log('⚠️ Login succeeded but no session cookie received');
            }
        } else {
            console.log('❌ Login failed:', loginResponse.status, loginResponse.statusText);
            const errorText = await loginResponse.text();
            console.log('Error:', errorText);
            return;
        }
        
        if (!sessionCookie) {
            console.log('❌ Cannot proceed without session cookie');
            return;
        }
        
        // Test 2: Get System Stats
        console.log('\n2. Testing System Stats Endpoint...');
        const statsResponse = await fetch(`${API_BASE}/stats`, {
            headers: {
                'Accept': 'application/json',
                'Cookie': sessionCookie
            }
        });
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Stats endpoint working');
            console.log('📊 Stats:', JSON.stringify(statsData.data, null, 2));
        } else {
            console.log('❌ Stats endpoint failed:', statsResponse.status, statsResponse.statusText);
            const errorText = await statsResponse.text();
            console.log('Error:', errorText);
        }
        
        // Test 3: Get Trusts
        console.log('\n3. Testing Trusts Listing Endpoint...');
        const trustsResponse = await fetch(`${API_BASE}/trusts`, {
            headers: {
                'Accept': 'application/json',
                'Cookie': sessionCookie
            }
        });
        
        if (trustsResponse.ok) {
            const trustsData = await trustsResponse.json();
            console.log('✅ Trusts endpoint working');
            console.log('🏫 Found', trustsData.data?.length || 0, 'trusts');
            if (trustsData.data?.length > 0) {
                console.log('First trust:', trustsData.data[0].trust_name);
            }
        } else {
            console.log('❌ Trusts endpoint failed:', trustsResponse.status, trustsResponse.statusText);
            const errorText = await trustsResponse.text();
            console.log('Error:', errorText);
        }
        
        // Test 4: Test Health Check (System-wide)
        console.log('\n4. Testing Health Check...');
        const healthResponse = await fetch(`${BASE_URL}/api/v1/admin/system/health`);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health check working');
            console.log('💚 System Status:', healthData.status);
        } else {
            console.log('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 System Admin Dashboard Test Complete!');
        console.log('✨ The dashboard should now work properly.');
        console.log('\n💡 To test manually:');
        console.log('1. Start server: npm run dev');
        console.log('2. Go to: http://localhost:3000/admin/system/dashboard');
        console.log('3. Login with: admin / admin123');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
if (require.main === module) {
    testSystemAdminDashboard().catch(console.error);
}

module.exports = { testSystemAdminDashboard };