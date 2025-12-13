const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  category: {
    type: String, // e.g. "Food", "Transport"
    required: true,
  },
  user: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
  },
  limit: {
    type: Number,
    required: true,
  },
  month: {
    type: String, // Format: "YYYY-MM"
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Composite index to ensure one budget per category per month
BudgetSchema.index({ category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
