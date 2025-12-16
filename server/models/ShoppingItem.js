const mongoose = require('mongoose');

const ShoppingItemSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  is_checked: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ShoppingItem', ShoppingItemSchema);
