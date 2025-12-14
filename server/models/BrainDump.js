const mongoose = require('mongoose');

const BrainDumpSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  type: {
    type: String,
    enum: ['idea', 'task', 'note'],
    default: 'note',
  },
  processed: {
    type: Boolean,
    default: false,
  },
  converted_to: {
    id: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ['Goal', 'Task', 'Habit'] }
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for dashboard count
BrainDumpSchema.index({ user: 1 });
BrainDumpSchema.index({ processed: 1 });

module.exports = mongoose.model('BrainDump', BrainDumpSchema);
