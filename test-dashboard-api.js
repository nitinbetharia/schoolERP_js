/**
 * Test script to verify login and dashboard functionality
 */

const axios = require('axios');
const qs = require('querystring');

class DashboardTester {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.cookieJar = '';
  }

  async testLogin() {
    try {
      console.log('🔐 Testing login...');

      // First get the login page to establish session
      const loginPageResponse = await axios.get(`${this.baseURL}/auth/login`);
      console.log('✅ Login page accessible');

      // Extract cookies
      const cookies = loginPageResponse.headers['set-cookie'];
      if (cookies) {
        this.cookieJar = cookies.map(cookie => cookie.split(';')[0]).join('; ');
      }

      // Attempt login
      const loginData = qs.stringify({
        username: 'admin',
        password: 'admin123'
      });

      const loginResponse = await axios.post(`${this.baseURL}/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.cookieJar
        },
        maxRedirects: 0,
        validateStatus: status => status < 400
      });

      // Update cookies
      const newCookies = loginResponse.headers['set-cookie'];
      if (newCookies) {
        this.cookieJar = newCookies.map(cookie => cookie.split(';')[0]).join('; ');
      }

      console.log('✅ Login response received:', loginResponse.status);
      console.log('📍 Redirect location:', loginResponse.headers.location);

      return true;
    } catch (error) {
      console.error('❌ Login test failed:', error.message);
      return false;
    }
  }

  async testDashboard() {
    try {
      console.log('📊 Testing dashboard access...');

      const dashboardResponse = await axios.get(`${this.baseURL}/dashboard`, {
        headers: {
          Cookie: this.cookieJar
        },
        maxRedirects: 5
      });

      console.log('✅ Dashboard accessible:', dashboardResponse.status);
      console.log('📄 Dashboard content length:', dashboardResponse.data.length);

      // Check for key elements
      const content = dashboardResponse.data;
      const hasIcons =
        content.includes('fa-') || content.includes('fas ') || content.includes('far ');
      const hasStats =
        content.includes('stats') || content.includes('count') || content.includes('total');
      const hasDashboard = content.includes('dashboard') || content.includes('Dashboard');

      console.log('🔍 Content analysis:');
      console.log('   Icons present:', hasIcons ? '✅' : '❌');
      console.log('   Statistics present:', hasStats ? '✅' : '❌');
      console.log('   Dashboard elements:', hasDashboard ? '✅' : '❌');

      return true;
    } catch (error) {
      console.error('❌ Dashboard test failed:', error.message);
      if (error.response) {
        console.log('📍 Error status:', error.response.status);
        console.log('📍 Error location:', error.response.headers.location);
      }
      return false;
    }
  }

  async runTests() {
    console.log('🚀 Starting School ERP Dashboard Tests\n');

    const loginSuccess = await this.testLogin();
    if (loginSuccess) {
      await this.testDashboard();
    }

    console.log('\n✅ Tests completed!');
  }
}

// Run tests
const tester = new DashboardTester();
tester.runTests().catch(console.error);
