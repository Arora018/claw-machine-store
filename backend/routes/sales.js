const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { Inventory, StockMovement } = require('../models/Inventory');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all sales
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, status, paymentMethod } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    const sales = await Sale.find(query)
      .populate('items.product', 'name price category')
      .populate('machine', 'machineId name location')
      .populate('cashier', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalSales: total
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single sale
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product', 'name price category sku')
      .populate('machine', 'machineId name location')
      .populate('cashier', 'username email');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new sale
router.post('/', auth, async (req, res) => {
  try {
    const { items, paymentMethod, machine, customerInfo, notes } = req.body;

    // Validate and calculate totals
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          message: `Product ${item.product} not found or inactive` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      saleItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Create sale
    const sale = new Sale({
      items: saleItems,
      subtotal,
      tax,
      total,
      paymentMethod,
      machine,
      cashier: req.user._id,
      customerInfo,
      notes
    });

    await sale.save();

    // Update inventory and create stock movements
    for (const item of saleItems) {
      // Find inventory record
      const inventory = await Inventory.findOne({
        product: item.product,
        location: 'warehouse'
      });

      if (inventory && inventory.currentStock >= item.quantity) {
        inventory.currentStock -= item.quantity;
        inventory.lastUpdated = new Date();
        inventory.updatedBy = req.user._id;
        await inventory.save();

        // Create stock movement record
        const stockMovement = new StockMovement({
          product: item.product,
          movementType: 'sale',
          quantity: -item.quantity,
          fromLocation: 'warehouse',
          toLocation: 'sold',
          reason: `Sale: ${sale.saleNumber}`,
          reference: sale._id,
          performedBy: req.user._id
        });
        await stockMovement.save();
      }
    }

    await sale.populate([
      { path: 'items.product', select: 'name price category' },
      { path: 'machine', select: 'machineId name location' },
      { path: 'cashier', select: 'username' }
    ]);

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales summary
router.get('/summary/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const summary = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgSaleValue: { $avg: '$total' }
        }
      }
    ]);

    const result = summary[0] || {
      totalSales: 0,
      totalRevenue: 0,
      avgSaleValue: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
