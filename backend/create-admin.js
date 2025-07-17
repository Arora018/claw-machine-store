const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yanoi.com';
    
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }
    
    const admin = new User({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
