const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out_of_order'],
    default: 'active'
  },
  coinCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCoinCountUpdate: {
    type: Date,
    default: Date.now
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  currentToyCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastToyCountUpdate: {
    type: Date,
    default: Date.now
  },
  pricePerPlay: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Machine', machineSchema);
