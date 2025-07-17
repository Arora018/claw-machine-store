const express = require('express');
const Machine = require('../models/Machine');
const { auth, managerAuth } = require('../middleware/auth');

const router = express.Router();

// Get all machines
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const machines = await Machine.find(query).sort({ createdAt: -1 });

    res.json(machines);
  } catch (error) {
    console.error('Get machines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single machine
router.get('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    console.error('Get machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new machine
router.post('/', managerAuth, async (req, res) => {
  try {
    const machine = new Machine(req.body);
    await machine.save();

    res.status(201).json({
      message: 'Machine created successfully',
      machine
    });
  } catch (error) {
    console.error('Create machine error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Machine ID already exists' 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update machine
router.put('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    Object.assign(machine, req.body);
    await machine.save();

    res.json({
      message: 'Machine updated successfully',
      machine
    });
  } catch (error) {
    console.error('Update machine error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update coin count
router.patch('/:id/coins', auth, async (req, res) => {
  try {
    const { coinCount } = req.body;
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    machine.coinCount = coinCount;
    machine.lastCoinCountUpdate = new Date();
    await machine.save();

    res.json({
      message: 'Coin count updated successfully',
      machine
    });
  } catch (error) {
    console.error('Update coin count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update toy count
router.patch('/:id/toys', auth, async (req, res) => {
  try {
    const { currentToyCount } = req.body;
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    machine.currentToyCount = currentToyCount;
    machine.lastToyCountUpdate = new Date();
    await machine.save();

    res.json({
      message: 'Toy count updated successfully',
      machine
    });
  } catch (error) {
    console.error('Update toy count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete machine
router.delete('/:id', managerAuth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    await Machine.findByIdAndDelete(req.params.id);

    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    console.error('Delete machine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get machine status summary
router.get('/summary/status', auth, async (req, res) => {
  try {
    const summary = await Machine.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCoins: { $sum: '$coinCount' },
          totalToys: { $sum: '$currentToyCount' }
        }
      }
    ]);

    const result = {
      active: 0,
      maintenance: 0,
      out_of_order: 0,
      totalCoins: 0,
      totalToys: 0
    };

    summary.forEach(item => {
      result[item._id] = item.count;
      result.totalCoins += item.totalCoins;
      result.totalToys += item.totalToys;
    });

    res.json(result);
  } catch (error) {
    console.error('Get machine summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
