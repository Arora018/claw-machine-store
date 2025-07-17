#!/usr/bin/env node

// 🧪 Check Render.com Deployment Status
// Run this to test your Render deployment

const https = require('https');
const { URL } = require('url');

// UPDATE THIS WITH YOUR RENDER URL
const RENDER_URL = 'https://claw-machine-backend.onrender.com';

// Example: https://claw-machine-backend-a1b2c3.onrender.com

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
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
    req.setTimeout(15000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function checkDeployment() {
  console.log('🔍 Checking Render.com Deployment...\n');
  
  if (RENDER_URL.includes('xxxx')) {
    console.log('⚠️  Please update RENDER_URL in this script with your actual Render URL');
    console.log('📋 Your URL should look like: https://claw-machine-backend-a1b2c3.onrender.com');
    console.log('🔗 Find it in your Render dashboard: https://dashboard.render.com/');
    console.log('\n📝 Steps:');
    console.log('1. Go to Render dashboard');
    console.log('2. Click on your claw-machine-backend service');
    console.log('3. Copy the URL from the service page');
    console.log('4. Replace the URL in this script and run again');
    return;
  }
  
  try {
    console.log(`🌐 Testing: ${RENDER_URL}/health`);
    const response = await makeRequest(`${RENDER_URL}/health`);
    
    if (response.statusCode === 200) {
      console.log('✅ Render deployment: SUCCESS');
      try {
        const healthData = JSON.parse(response.data);
        console.log('   Status:', healthData.status);
        console.log('   Environment:', healthData.environment);
        console.log('   MongoDB:', healthData.status === 'healthy' ? 'Connected ✅' : 'Check logs ❌');
      } catch (e) {
        console.log('   Raw response:', response.data);
      }
      
      console.log('\n🎉 Your backend is live and working!');
      console.log(`📝 Backend URL: ${RENDER_URL}`);
      console.log('📝 Next steps:');
      console.log('1. Deploy admin dashboard to Vercel');
      console.log('2. Use this URL as REACT_APP_API_URL: ' + RENDER_URL + '/api');
      console.log('3. Test complete system');
      
    } else {
      console.log('❌ Render deployment: FAILED');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.data);
      console.log('\n🔧 Check:');
      console.log('- Render build logs for errors');
      console.log('- Environment variables are set correctly');
      console.log('- MongoDB connection string is valid');
    }
    
  } catch (error) {
    console.log('❌ Render deployment: ERROR');
    console.log('   Error:', error.message);
    console.log('\n🔧 Common issues:');
    console.log('- App is still building (wait 3-5 minutes)');
    console.log('- Build failed (check Render logs)');
    console.log('- MongoDB connection issues (should be fixed now)');
    console.log('- Environment variables missing');
  }
}

checkDeployment(); 