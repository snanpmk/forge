const mongoose = require('mongoose');

const PrayerSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    required: true,
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  date: {
    type: Date,
    required: true, // Should store the date (day) this prayer belongs to
  },
  status: {
    type: String,
    enum: ['on-time', 'late', 'missed', 'pending'],
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['normal', 'kasar', 'jamm', 'jamm-kasar'],
    default: 'normal',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// A compound index to ensure one record per prayer per day? 
// Actually, one user might have multiple entries if we are just logging. 
// But "Prayer Tracker" usually implies state for a specific slot.
// For now, we'll keep it simple.

// Indexing for faster lookups
PrayerSchema.index({ date: 1 });

// Indexing active goals
// GoalSchema.index({ progress: 1 }); // GoalSchema is not defined in this file
// GoalSchema.index({ target_date: 1 }); // GoalSchema is not defined in this file

module.exports = mongoose.model('Prayer', PrayerSchema);
