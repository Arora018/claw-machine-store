#!/usr/bin/env node

// 🧪 Test Cloud Deployment - Claw Machine Store
// Run this after deploying to Railway and Vercel

const https = require('https');
const http = require('http');
const { URL } = require('url');

// UPDATE THESE WITH YOUR ACTUAL DEPLOYMENT URLS
const BACKEND_URL = 'https://yourapp-production-xxxx.up.railway.app';
const ADMIN_URL = 'https://yourapp-xxxx.vercel.app';

// Example URLs (replace with your actual ones):
// BACKEND_URL = 'https://claw-machine-store-production-abc123.up.railway.app';
// ADMIN_URL = 'https://claw-machine-store-def456.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const module = urlObj.protocol === 'https:' ? https : http;
    
    const req = module.request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => req.abort());
    req.end();
  });
}

async function testBackend() {
  console.log('🔍 Testing Backend Health...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);
    if (response.statusCode === 200) {
      console.log('✅ Backend health check: PASSED');
      try {
        const healthData = JSON.parse(response.data);
        console.log('   Status:', healthData.status);
        console.log('   Environment:', healthData.environment);
      } catch (e) {
        console.log('   Raw response:', response.data);
      }
      return true;
    } else {
      console.log('❌ Backend health check: FAILED');
      console.log('   Status Code:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testAdmin() {
  console.log('\n🔍 Testing Admin Dashboard...');
  
  try {
    const response = await makeRequest(ADMIN_URL);
    if (response.statusCode === 200) {
      console.log('✅ Admin dashboard: ACCESSIBLE');
      if (response.data.includes('Claw Machine') || response.data.includes('admin')) {
        console.log('   Content: Contains expected elements');
      }
      return true;
    } else {
      console.log('❌ Admin dashboard: FAILED');
      console.log('   Status Code:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin dashboard: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

async function testAPI() {
  console.log('\n🔍 Testing API Endpoints...');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/products`);
    if (response.statusCode === 401) {
      console.log('✅ API security: WORKING (401 Unauthorized as expected)');
      return true;
    } else if (response.statusCode === 200) {
      console.log('✅ API endpoints: ACCESSIBLE');
      return true;
    } else {
      console.log('❌ API endpoints: UNEXPECTED RESPONSE');
      console.log('   Status Code:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ API endpoints: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Cloud Deployment...\n');
  
  // Check if URLs are updated
  if (BACKEND_URL.includes('yourapp-production-xxxx') || ADMIN_URL.includes('yourapp-xxxx')) {
    console.log('⚠️  Please update BACKEND_URL and ADMIN_URL in this script with your actual deployment URLs');
    console.log('📋 Your URLs should look like:');
    console.log('   Backend: https://claw-machine-store-production-abc123.up.railway.app');
    console.log('   Admin: https://claw-machine-store-def456.vercel.app');
    console.log('\n🔗 Find your URLs here:');
    console.log('   Railway: https://railway.app/dashboard');
    console.log('   Vercel: https://vercel.com/dashboard');
    return;
  }
  
  const backendResult = await testBackend();
  const adminResult = await testAdmin();
  const apiResult = await testAPI();
  
  console.log('\n📊 Test Results:');
  console.log(`Backend Health: ${backendResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Dashboard: ${adminResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Security: ${apiResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (backendResult && adminResult && apiResult) {
    console.log('\n🎉 All tests passed! Your cloud deployment is working!');
    console.log('\n📱 Next steps:');
    console.log('1. Update tablet-app/App.js with your Railway URL');
    console.log('2. Build APK using mobile hotspot or alternative network');
    console.log('3. Test complete system end-to-end');
    console.log('4. Go live! 🚀');
  } else {
    console.log('\n⚠️  Some tests failed. Check your deployment configuration.');
    console.log('💡 Common issues:');
    console.log('- MongoDB connection string not set correctly');
    console.log('- Environment variables missing in Railway/Vercel');
    console.log('- Build errors in deployment logs');
  }
}

runTests().catch(console.error); 