const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
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
  goal_link_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
  },
  source_task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  streak: {
    type: Number,
    default: 0,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  schedule: {
    daysOfWeek: [{ type: Number }], // 0-6 where 0 is Sunday
    daysOfMonth: [{ type: Number }] // 1-31
  },
  logs: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      completed: {
        type: Boolean,
        default: true,
      },
    }
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexing
// Note: Logs is an array, indexing created_at or goal_link_id might be useful.
HabitSchema.index({ created_at: -1 });

module.exports = mongoose.model('Habit', HabitSchema);
