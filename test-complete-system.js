#!/usr/bin/env node

// 🧪 Complete System Test - Claw Machine Store
// Test backend, admin dashboard, and API integration

const https = require('https');
const { URL } = require('url');

// Your actual deployment URLs
const BACKEND_URL = 'https://claw-machine-backend.onrender.com';
const ADMIN_URL = 'https://claw-machine-store.vercel.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => req.abort());
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testBackend() {
  console.log('🔍 Testing Backend API...');
  
  try {
    // Test health endpoint
    const healthResponse = await makeRequest(`${BACKEND_URL}/health`);
    if (healthResponse.statusCode === 200) {
      console.log('✅ Backend health: PASSED');
      const healthData = JSON.parse(healthResponse.data);
      console.log('   Status:', healthData.status);
      console.log('   Environment:', healthData.environment);
    } else {
      console.log('❌ Backend health: FAILED');
      return false;
    }

    // Test API authentication
    const authResponse = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (authResponse.statusCode === 200) {
      console.log('✅ API authentication: PASSED');
      const authData = JSON.parse(authResponse.data);
      console.log('   Token received:', authData.token ? 'Yes' : 'No');
      console.log('   User:', authData.user?.username || 'Unknown');
      return authData.token;
    } else {
      console.log('❌ API authentication: FAILED');
      console.log('   Status:', authResponse.statusCode);
      console.log('   Response:', authResponse.data);
      return false;
    }

  } catch (error) {
    console.log('❌ Backend test: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testAdminDashboard() {
  console.log('\n🔍 Testing Admin Dashboard...');
  
  try {
    const response = await makeRequest(ADMIN_URL);
    if (response.statusCode === 200) {
      console.log('✅ Admin dashboard: ACCESSIBLE');
      
      // Check if it's a React app
      if (response.data.includes('react') || response.data.includes('React')) {
        console.log('   Type: React application detected');
      }
      
      // Check if it redirects to login
      if (response.data.includes('login') || response.data.includes('Login')) {
        console.log('   Authentication: Login page detected');
      }
      
      return true;
    } else {
      console.log('❌ Admin dashboard: FAILED');
      console.log('   Status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin dashboard: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testAPIWithAuth(token) {
  console.log('\n🔍 Testing API with Authentication...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.statusCode === 200) {
      console.log('✅ Authenticated API: PASSED');
      const products = JSON.parse(response.data);
      console.log('   Products found:', products.length);
      return true;
    } else {
      console.log('❌ Authenticated API: FAILED');
      console.log('   Status:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Authenticated API: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete System Test...\n');
  
  // Test backend and get auth token
  const token = await testBackend();
  
  // Test admin dashboard
  const adminResult = await testAdminDashboard();
  
  // Test authenticated API
  let apiResult = false;
  if (token) {
    apiResult = await testAPIWithAuth(token);
  }
  
  console.log('\n📊 Complete System Test Results:');
  console.log(`Backend API: ${token ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Dashboard: ${adminResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authenticated API: ${apiResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (token && adminResult && apiResult) {
    console.log('\n🎉 COMPLETE SYSTEM SUCCESS!');
    console.log('\n📱 Your claw machine store is fully functional:');
    console.log(`   Backend: ${BACKEND_URL}`);
    console.log(`   Admin Dashboard: ${ADMIN_URL}`);
    console.log(`   Login: admin / admin123`);
    console.log('\n🎯 Next steps:');
    console.log('1. Test admin dashboard login in browser');
    console.log('2. Add some products and test functionality');
    console.log('3. Build APK for tablet POS');
    console.log('4. Test complete offline/online workflow');
    console.log('5. Go live with your store! 🚀');
  } else {
    console.log('\n⚠️  Some components failed. Check the details above.');
  }
}

runCompleteTest().catch(console.error); 