const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Machine = require('../models/Machine');
const { Inventory } = require('../models/Inventory');
const { auth, managerAuth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Dashboard overview
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    const thisWeek = moment().startOf('week');
    const thisMonth = moment().startOf('month');

    // Today's sales
    const todaySales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: today.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    // This week's sales
    const weekSales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: thisWeek.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    // This month's sales
    const monthSales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth.toDate() },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);

    // Active machines count
    const machineStats = await Machine.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCoins: { $sum: '$coinCount' }
        }
      }
    ]);

    // Low stock products
    const lowStockCount = await Inventory.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    });

    // Total products
    const totalProducts = await Product.countDocuments({ isActive: true });

    const result = {
      today: todaySales[0] || { totalSales: 0, totalRevenue: 0 },
      week: weekSales[0] || { totalSales: 0, totalRevenue: 0 },
      month: monthSales[0] || { totalSales: 0, totalRevenue: 0 },
      machines: {
        active: machineStats.find(m => m._id === 'active')?.count || 0,
        maintenance: machineStats.find(m => m._id === 'maintenance')?.count || 0,
        outOfOrder: machineStats.find(m => m._id === 'out_of_order')?.count || 0,
        totalCoins: machineStats.reduce((sum, m) => sum + m.totalCoins, 0)
      },
      inventory: {
        totalProducts,
        lowStockItems: lowStockCount
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sales analytics
router.get('/sales', auth, async (req, res) => {
  try {
    const { period = '7d', startDate, endDate } = req.query;
    
    let dateFilter = {};
    let groupBy = {};

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const days = parseInt(period.replace('d', ''));
      dateFilter = {
        createdAt: { $gte: moment().subtract(days, 'days').toDate() }
      };
    }

    // Daily sales trend
    const salesTrend = await Sale.aggregate([
      {
        $match: { ...dateFilter, status: 'completed' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgSaleValue: { $avg: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Payment method breakdown
    const paymentMethods = await Sale.aggregate([
      {
        $match: { ...dateFilter, status: 'completed' }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      {
        $match: { ...dateFilter, status: 'completed' }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      salesTrend,
      paymentMethods,
      topProducts
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Machine performance analytics
router.get('/machines', managerAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = parseInt(period.replace('d', ''));
    const dateFilter = {
      createdAt: { $gte: moment().subtract(days, 'days').toDate() }
    };

    // Sales by machine
    const machinePerformance = await Sale.aggregate([
      {
        $match: { ...dateFilter, status: 'completed', machine: { $exists: true } }
      },
      {
        $group: {
          _id: '$machine',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      },
      {
        $lookup: {
          from: 'machines',
          localField: '_id',
          foreignField: '_id',
          as: 'machine'
        }
      },
      { $unwind: '$machine' },
      {
        $project: {
          machineId: '$machine.machineId',
          machineName: '$machine.name',
          location: '$machine.location',
          totalSales: 1,
          totalRevenue: 1,
          coinCount: '$machine.coinCount',
          toyCount: '$machine.currentToyCount'
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ machinePerformance });
  } catch (error) {
    console.error('Machine analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Inventory analytics
router.get('/inventory', auth, async (req, res) => {
  try {
    // Stock levels by category
    const stockByCategory = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalStock: { $sum: '$currentStock' },
          totalValue: { 
            $sum: { $multiply: ['$currentStock', '$product.price'] }
          },
          uniqueProducts: { $addToSet: '$product._id' }
        }
      },
      {
        $project: {
          category: '$_id',
          totalStock: 1,
          totalValue: 1,
          uniqueProducts: { $size: '$uniqueProducts' }
        }
      }
    ]);

    // Low stock items
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    })
      .populate('product', 'name category price')
      .populate('machine', 'machineId name')
      .sort({ currentStock: 1 })
      .limit(10);

    // Inventory value
    const totalValue = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: null,
          totalValue: { 
            $sum: { $multiply: ['$currentStock', '$product.cost'] }
          },
          retailValue: {
            $sum: { $multiply: ['$currentStock', '$product.price'] }
          }
        }
      }
    ]);

    res.json({
      stockByCategory,
      lowStockItems,
      totalValue: totalValue[0] || { totalValue: 0, retailValue: 0 }
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
