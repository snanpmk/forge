const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  due_date: {
    type: Date,
    required: true,
  },
  goal_link_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
  },
  source_thought_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrainDump',
    default: null
  },
  estimated_cost: {
    type: Number,
    default: 0
  },
  actual_cost: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient sorting and querying
TaskSchema.index({ user: 1 });
TaskSchema.index({ due_date: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ goal_link_id: 1 });

module.exports = mongoose.model('Task', TaskSchema);
