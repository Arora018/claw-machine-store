#!/usr/bin/env node

// 🧪 Claw Machine Store - Deployment Test Script
// Run this script to verify your deployment is working correctly

const axios = require('axios');

// Update these URLs with your actual deployment URLs
const BACKEND_URL = 'https://your-backend.railway.app';
const ADMIN_URL = 'https://your-admin.vercel.app';

async function testBackend() {
  console.log('🔍 Testing Backend...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend health check:', healthResponse.data);
    
    // Test auth endpoint
    const authResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('✅ Authentication working:', authResponse.data.user ? 'Success' : 'Failed');
    
    // Test products endpoint
    const token = authResponse.data.token;
    const productsResponse = await axios.get(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Products API working:', productsResponse.data.length, 'products found');
    
    return true;
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    return false;
  }
}

async function testAdmin() {
  console.log('\n🔍 Testing Admin Dashboard...');
  
  try {
    const response = await axios.get(ADMIN_URL);
    console.log('✅ Admin dashboard accessible:', response.status === 200 ? 'Success' : 'Failed');
    return true;
  } catch (error) {
    console.error('❌ Admin dashboard test failed:', error.message);
    return false;
  }
}

async function testDatabase() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/analytics/dashboard`);
    console.log('✅ Database connection working:', response.data ? 'Success' : 'Failed');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Claw Machine Store Deployment Tests...\n');
  
  // Update URLs reminder
  if (BACKEND_URL.includes('your-backend') || ADMIN_URL.includes('your-admin')) {
    console.log('⚠️  Please update BACKEND_URL and ADMIN_URL in this script with your actual URLs\n');
    return;
  }
  
  const backendResult = await testBackend();
  const adminResult = await testAdmin();
  const databaseResult = await testDatabase();
  
  console.log('\n📊 Test Results:');
  console.log(`Backend: ${backendResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Dashboard: ${adminResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database: ${databaseResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (backendResult && adminResult && databaseResult) {
    console.log('\n🎉 All tests passed! Your deployment is ready for production.');
    console.log('\n📱 Next steps:');
    console.log('1. Build APK with EAS CLI');
    console.log('2. Test APK on Android device');
    console.log('3. Verify offline/online sync');
    console.log('4. Change default admin password');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your deployment configuration.');
  }
}

runTests().catch(console.error); 