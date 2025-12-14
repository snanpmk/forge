const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const GoalSchema = new mongoose.Schema({
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
  category: {
    type: String,
    default: 'Personal', // Personal, Career, Financial, etc.
  },
  priority: {
    type: String, // Low, Medium, High
    default: 'Medium',
  },
  status: {
    type: String, // Active, Completed, Archived
    default: 'Active',
  },
  smart_criteria: {
    specific: { type: String, default: '' },
    measurable: { type: String, default: '' },
    achievable: { type: String, default: '' },
    relevant: { type: String, default: '' },
    time_bound: { type: String, default: '' },
  },
  source_thought_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrainDump',
    default: null
  },
  budget_allocated: {
    type: Number,
    default: 0
  },
  completed_at: {
    type: Date,
  },
  target_date: {
    type: Date,
  },
  milestones: [MilestoneSchema],
  total_weight: {
    type: Number,
    default: 100, // Total percentage points this goal represents
  },
  // We can calculate progress dynamically or store it. Storing it allows for easier queries.
  progress: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexing active goals
GoalSchema.index({ user: 1 });
GoalSchema.index({ progress: 1 });
GoalSchema.index({ target_date: 1 });

module.exports = mongoose.model('Goal', GoalSchema);
