const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for cloud deployment
const corsOptions = {
  origin: [
    'http://localhost:3000', // Local development
    'http://localhost:3001',
    'https://claw-machine-store.vercel.app', // Old admin URL
    'https://claw-machine-store.vercel.app/login', // Old login page
    'https://yanoi-admin-dashboard.vercel.app', // New admin URL
    'https://yanoi-admin-dashboard.vercel.app/login', // New login page
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// MongoDB Atlas connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // In production, exit if we can't connect to database
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: false },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'cashier'], default: 'cashier' },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['coins', 'plush_toy', 'figurine', 'candy', 'electronics', 'stationery', 'other']
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Sale Schema
const saleSchema = new mongoose.Schema({
  saleNumber: { type: String, required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['cash', 'upi', 'card']
  },
  total: { type: Number, required: true },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  // For offline sync
  clientId: { type: String, unique: true, sparse: true },
  syncedAt: { type: Date, default: Date.now }
});

// Machine Schema
const machineSchema = new mongoose.Schema({
  machineId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  coinCount: { type: Number, default: 0 },
  currentToyCount: { type: Number, default: 0 },
  maxCapacity: { type: Number, default: 100 },
  lastUpdated: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Sale = mongoose.model('Sale', saleSchema);
const Machine = mongoose.model('Machine', machineSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Initialize database with default data
const initializeDatabase = async () => {
  try {
    // Create admin user if doesn't exist
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yanoi.com';
    
    const adminExists = await User.findOne({ username: adminUsername });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Admin user created with username:', adminUsername);
    }

    // Create default products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const defaultProducts = [
        { name: '1 Coin', price: 100, category: 'coins' },
        { name: '7 Coins', price: 500, category: 'coins' },
        { name: '15 Coins', price: 1000, category: 'coins' },
        { name: 'Teddy Bear', price: 250, category: 'plush_toy' },
        { name: 'Pokemon Figure', price: 400, category: 'figurine' },
        { name: 'Hello Kitty Plush', price: 350, category: 'plush_toy' },
        { name: 'Gummy Bears', price: 80, category: 'candy' },
        { name: 'Toy Car', price: 200, category: 'other' },
        { name: 'Keychain', price: 50, category: 'stationery' },
        { name: 'Mini Puzzle', price: 120, category: 'other' }
      ];

      await Product.insertMany(defaultProducts);
      console.log('✅ Default products created');
    }

    // Create default machines if none exist
    const machineCount = await Machine.countDocuments();
    if (machineCount === 0) {
      const defaultMachines = [
        { machineId: 'CLW001', name: 'Main Floor Machine 1', location: 'Entrance Area', coinCount: 150, currentToyCount: 85, maxCapacity: 100 },
        { machineId: 'CLW002', name: 'Main Floor Machine 2', location: 'Center Area', coinCount: 200, currentToyCount: 92, maxCapacity: 100 },
        { machineId: 'CLW003', name: 'Kids Zone Machine', location: 'Kids Corner', coinCount: 75, currentToyCount: 45, maxCapacity: 80 }
      ];

      await Machine.insertMany(defaultMachines);
      console.log('✅ Default machines created');
    }

  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Product Routes
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/products', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/products/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { isActive: false }, 
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sale Routes
app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { items, paymentMethod, total, clientId } = req.body;

    // Generate sale number
    const saleCount = await Sale.countDocuments();
    const saleNumber = `SAL${String(saleCount + 1).padStart(6, '0')}`;

    const sale = new Sale({
      saleNumber,
      items,
      paymentMethod,
      total,
      cashier: req.user.id,
      clientId
    });

    await sale.save();
    await sale.populate('items.product');
    
    res.status(201).json(sale);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate clientId - sale already exists
      return res.status(200).json({ message: 'Sale already processed' });
    }
    console.error('Sale creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query)
      .populate('items.product')
      .populate('cashier', 'username')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSales = await Sale.countDocuments(query);
    
    res.json({
      sales,
      totalPages: Math.ceil(totalSales / limit),
      currentPage: page,
      totalSales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync Routes for APK
app.post('/api/sync/sales/bulk', authenticateToken, async (req, res) => {
  try {
    const { sales } = req.body;
    const results = [];

    for (const saleData of sales) {
      try {
        // Check if sale already exists
        const existingSale = await Sale.findOne({ clientId: saleData.clientId });
        if (existingSale) {
          results.push({ clientId: saleData.clientId, status: 'already_exists' });
          continue;
        }

        // Generate sale number
        const saleCount = await Sale.countDocuments();
        const saleNumber = `SAL${String(saleCount + 1).padStart(6, '0')}`;

        const sale = new Sale({
          saleNumber,
          items: saleData.items,
          paymentMethod: saleData.paymentMethod,
          total: saleData.total,
          cashier: req.user.id,
          clientId: saleData.clientId,
          timestamp: new Date(saleData.timestamp)
        });

        await sale.save();
        results.push({ clientId: saleData.clientId, status: 'created', saleNumber });
      } catch (error) {
        results.push({ clientId: saleData.clientId, status: 'error', error: error.message });
      }
    }

    res.json({ results, message: `Processed ${results.length} sales` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Machine Routes
app.get('/api/machines', authenticateToken, async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/machines/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, lastUpdated: new Date() }, 
      { new: true }
    );
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json(machine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Analytics Routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalSales,
      todaySales,
      monthSales,
      totalRevenue,
      todayRevenue,
      monthRevenue
    ] = await Promise.all([
      Sale.countDocuments(),
      Sale.countDocuments({ timestamp: { $gte: startOfDay } }),
      Sale.countDocuments({ timestamp: { $gte: startOfMonth } }),
      Sale.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Sale.aggregate([
        { $match: { timestamp: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Sale.aggregate([
        { $match: { timestamp: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    res.json({
      totalSales,
      todaySales,
      monthSales,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📱 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
