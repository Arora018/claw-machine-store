#!/usr/bin/env node

// 🧪 Test MongoDB Atlas Connection
// Run this to verify MongoDB connection works

const mongoose = require('mongoose');

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://clawstore:clawstore123@claw-machine-cluster.mo3wjdm.mongodb.net/clawstore?retryWrites=true&w=majority';

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  
  try {
    console.log('🌐 Connecting to MongoDB Atlas...');
    
    // Connect with timeout
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('✅ MongoDB connection: SUCCESS');
    console.log('   Database:', mongoose.connection.db.databaseName);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   Collections:', collections.length, 'found');
    
    console.log('\n🎉 MongoDB Atlas is working correctly!');
    console.log('📝 This means:');
    console.log('- IP whitelist is configured properly');
    console.log('- Credentials are correct');
    console.log('- Database is accessible');
    console.log('- Render deployment should work now');
    
  } catch (error) {
    console.log('❌ MongoDB connection: FAILED');
    console.log('   Error:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n🔧 IP Whitelist Issue:');
      console.log('1. Go to MongoDB Atlas → Network Access');
      console.log('2. Add IP address: 0.0.0.0/0 (Allow access from anywhere)');
      console.log('3. Wait 1-2 minutes for changes to apply');
      console.log('4. Try again');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔧 Authentication Issue:');
      console.log('1. Check username: clawstore');
      console.log('2. Check password: clawstore123');
      console.log('3. Verify user exists in Database Access');
    } else {
      console.log('\n🔧 Other Issues:');
      console.log('- Check if cluster is running');
      console.log('- Verify connection string is correct');
      console.log('- Check MongoDB Atlas status');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n📝 Connection closed.');
  }
}

testConnection(); 