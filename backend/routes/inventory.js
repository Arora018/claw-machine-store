const express = require('express');
const { Inventory, StockMovement } = require('../models/Inventory');
const Product = require('../models/Product');
const Machine = require('../models/Machine');
const { auth, managerAuth } = require('../middleware/auth');

const router = express.Router();

// Get inventory overview
router.get('/', auth, async (req, res) => {
  try {
    const { location, lowStock } = req.query;
    const query = {};

    if (location && location !== 'all') {
      query.location = location;
    }

    const inventory = await Inventory.find(query)
      .populate('product', 'name category price sku')
      .populate('machine', 'machineId name')
      .populate('updatedBy', 'username')
      .sort({ lastUpdated: -1 });

    let filteredInventory = inventory;

    if (lowStock === 'true') {
      filteredInventory = inventory.filter(item => 
        item.currentStock <= item.minStockLevel
      );
    }

    res.json(filteredInventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get inventory for specific product
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find({ product: req.params.productId })
      .populate('product', 'name category price')
      .populate('machine', 'machineId name location')
      .populate('updatedBy', 'username');

    res.json(inventory);
  } catch (error) {
    console.error('Get product inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add stock (stock in)
router.post('/stock-in', auth, async (req, res) => {
  try {
    const { productId, machineId, quantity, reason, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const location = machineId ? 'machine' : 'warehouse';
    const query = { product: productId, location };
    
    if (machineId) {
      query.machine = machineId;
    }

    // Find or create inventory record
    let inventory = await Inventory.findOne(query);
    
    if (!inventory) {
      inventory = new Inventory({
        product: productId,
        machine: machineId,
        currentStock: 0,
        location,
        updatedBy: req.user._id
      });
    }

    inventory.currentStock += quantity;
    inventory.lastUpdated = new Date();
    inventory.updatedBy = req.user._id;
    await inventory.save();

    // Create stock movement record
    const stockMovement = new StockMovement({
      product: productId,
      machine: machineId,
      movementType: 'stock_in',
      quantity,
      toLocation: location,
      reason,
      notes,
      performedBy: req.user._id
    });
    await stockMovement.save();

    await inventory.populate([
      { path: 'product', select: 'name category' },
      { path: 'machine', select: 'machineId name' }
    ]);

    res.status(201).json({
      message: 'Stock added successfully',
      inventory,
      stockMovement
    });
  } catch (error) {
    console.error('Stock in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transfer stock between locations
router.post('/transfer', auth, async (req, res) => {
  try {
    const { productId, fromMachineId, toMachineId, quantity, reason, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Determine locations
    const fromLocation = fromMachineId ? 'machine' : 'warehouse';
    const toLocation = toMachineId ? 'machine' : 'warehouse';

    // Find source inventory
    const fromQuery = { product: productId, location: fromLocation };
    if (fromMachineId) fromQuery.machine = fromMachineId;

    const fromInventory = await Inventory.findOne(fromQuery);
    if (!fromInventory || fromInventory.currentStock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock for transfer' });
    }

    // Find or create destination inventory
    const toQuery = { product: productId, location: toLocation };
    if (toMachineId) toQuery.machine = toMachineId;

    let toInventory = await Inventory.findOne(toQuery);
    if (!toInventory) {
      toInventory = new Inventory({
        product: productId,
        machine: toMachineId,
        currentStock: 0,
        location: toLocation,
        updatedBy: req.user._id
      });
    }

    // Update inventories
    fromInventory.currentStock -= quantity;
    fromInventory.lastUpdated = new Date();
    fromInventory.updatedBy = req.user._id;

    toInventory.currentStock += quantity;
    toInventory.lastUpdated = new Date();
    toInventory.updatedBy = req.user._id;

    await Promise.all([fromInventory.save(), toInventory.save()]);

    // Create stock movement record
    const stockMovement = new StockMovement({
      product: productId,
      machine: toMachineId,
      movementType: 'transfer',
      quantity,
      fromLocation,
      toLocation,
      reason,
      notes,
      performedBy: req.user._id
    });
    await stockMovement.save();

    res.json({
      message: 'Stock transferred successfully',
      fromInventory,
      toInventory,
      stockMovement
    });
  } catch (error) {
    console.error('Transfer stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Adjust stock (for corrections)
router.post('/adjust', managerAuth, async (req, res) => {
  try {
    const { productId, machineId, newQuantity, reason, notes } = req.body;

    const location = machineId ? 'machine' : 'warehouse';
    const query = { product: productId, location };
    
    if (machineId) {
      query.machine = machineId;
    }

    const inventory = await Inventory.findOne(query);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    const oldQuantity = inventory.currentStock;
    const adjustment = newQuantity - oldQuantity;

    inventory.currentStock = newQuantity;
    inventory.lastUpdated = new Date();
    inventory.updatedBy = req.user._id;
    await inventory.save();

    // Create stock movement record
    const stockMovement = new StockMovement({
      product: productId,
      machine: machineId,
      movementType: 'adjustment',
      quantity: adjustment,
      fromLocation: 'adjustment',
      toLocation: 'adjustment',
      reason: `Adjustment: ${reason}`,
      notes: `Old: ${oldQuantity}, New: ${newQuantity}. ${notes}`,
      performedBy: req.user._id
    });
    await stockMovement.save();

    await inventory.populate([
      { path: 'product', select: 'name category' },
      { path: 'machine', select: 'machineId name' }
    ]);

    res.json({
      message: 'Stock adjusted successfully',
      inventory,
      stockMovement
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stock movements
router.get('/movements', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, machineId, movementType } = req.query;
    const query = {};

    if (productId) query.product = productId;
    if (machineId) query.machine = machineId;
    if (movementType && movementType !== 'all') query.movementType = movementType;

    const movements = await StockMovement.find(query)
      .populate('product', 'name category sku')
      .populate('machine', 'machineId name')
      .populate('performedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StockMovement.countDocuments(query);

    res.json({
      movements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMovements: total
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', auth, async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    })
      .populate('product', 'name category price sku')
      .populate('machine', 'machineId name location')
      .sort({ currentStock: 1 });

    res.json(lowStockItems);
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
