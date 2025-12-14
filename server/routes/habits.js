const router = require('express').Router();
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

router.use(auth);

// GET all habits
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const habits = await Habit.find({ user: userId }).sort({ created_at: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new habit
router.post('/', async (req, res) => {
  try {
    const habit = new Habit({ ...req.body, user: req.user.id });
    const savedHabit = await habit.save();
    res.json(savedHabit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Helper to calculate streak
const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  
  // Normalize all log dates to YYYY-MM-DD strings to ensure uniqueness and order
  const completedDates = logs
    .filter(l => l.completed)
    .map(l => {
        // Ensure we parse the date string or Date object correctly to YYYY-MM-DD
        const dateObj = new Date(l.date);
        return dateObj.toISOString().split('T')[0];
    })
    .sort((a, b) => b.localeCompare(a));
  
  const uniqueDates = [...new Set(completedDates)];
  
  if (uniqueDates.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];
  
  // If last completion was before yesterday, streak is broken
  // Note: we compare strings "YYYY-MM-DD"
  if (uniqueDates[0] < yesterday) return 0;
  
  let streak = 0;
  let expectedDate = uniqueDates[0]; // Start checking from the most recent completed date
  
  for (let date of uniqueDates) {
    if (date === expectedDate) {
      streak++;
      // Calculate previous day
      const prev = new Date(expectedDate);
      prev.setDate(prev.getDate() - 1);
      expectedDate = prev.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
};

const { addXP } = require('../utils/gamification');

// ... (existing imports)

// PUT update habit (e.g. log completion)
router.put('/:id/log', async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // Handle date as String "YYYY-MM-DD" or fallback to Date object
    // We normalize everything to noon UTC to avoid date shifting issues
    let targetDateStr;
    if (req.body.date) {
        // If it's a date string like "2023-12-15", use it. 
        // If it's a ISO string, convert to YYYY-MM-DD.
        if (req.body.date.includes('T')) {
             targetDateStr = new Date(req.body.date).toISOString().split('T')[0];
        } else {
             targetDateStr = req.body.date;
        }
    } else {
        targetDateStr = new Date().toISOString().split('T')[0];
    }
    
    // Create a Date object for storage that is safely "noon UTC" on that day
    // This allows keeping the current Schema type: Date
    const targetDate = new Date(`${targetDateStr}T12:00:00.000Z`);

    const existingLogIndex = habit.logs.findIndex(log => {
      // Compare by YYYY-MM-DD string
      const logDateStr = new Date(log.date).toISOString().split('T')[0];
      return logDateStr === targetDateStr;
    });

    let xpAwarded = 0;
    let gamificationResult = null;

    if (existingLogIndex > -1) {
      // Update existing log
      // Only award XP if changing from false -> true
      if (!habit.logs[existingLogIndex].completed && req.body.completed) {
          xpAwarded = 20;
      }
      habit.logs[existingLogIndex].completed = req.body.completed;
      // Also update the date object to keep it consistent
      habit.logs[existingLogIndex].date = targetDate;
    } else {
      // Add new log
      if (req.body.completed) {
          xpAwarded = 20;
      }
      habit.logs.push({ date: targetDate, completed: req.body.completed });
    }
    
    // Recalculate streak
    habit.streak = calculateStreak(habit.logs);
    
    await habit.save();

    if (xpAwarded > 0) {
        const userId = req.user ? req.user.id : (await require('../models/User').findOne())._id;
        gamificationResult = await addXP(userId, xpAwarded);
    }

    res.json({ ...habit.toObject(), gamification: gamificationResult ? { xpAdded: xpAwarded, ...gamificationResult } : null });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE habit
router.delete('/:id', async (req, res) => {
  try {
    await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
