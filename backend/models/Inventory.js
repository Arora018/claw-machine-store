const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 5,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 50,
    min: 1
  },
  location: {
    type: String,
    enum: ['warehouse', 'machine', 'sold'],
    default: 'warehouse'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  movementType: {
    type: String,
    enum: ['stock_in', 'stock_out', 'transfer', 'adjustment', 'sale'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  fromLocation: {
    type: String,
    enum: ['warehouse', 'machine', 'supplier', 'adjustment']
  },
  toLocation: {
    type: String,
    enum: ['warehouse', 'machine', 'sold', 'damaged', 'adjustment']
  },
  reason: {
    type: String,
    required: true
  },
  reference: {
    type: String // Can be sale ID, transfer ID, etc.
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
inventorySchema.index({ product: 1, machine: 1 }, { unique: true, sparse: true });
inventorySchema.index({ product: 1, location: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);
const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

module.exports = { Inventory, StockMovement };
