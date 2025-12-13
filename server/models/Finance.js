const mongoose = require('mongoose');

const FinanceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense', 'invested', 'lended', 'borrowed'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  goal_link_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null, // Link savings/investment to a specific goal (e.g. "Car Fund")
  },
  task_link_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  related_entity: {
    type: String, // E.g. "John Doe" (for Lended To), "Bank of America" (for Invested In)
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
FinanceSchema.index({ date: 1 });
FinanceSchema.index({ type: 1 });

module.exports = mongoose.model('Finance', FinanceSchema);
