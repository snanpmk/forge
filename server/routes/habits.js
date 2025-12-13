const router = require('express').Router();
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

router.use(auth);

// GET all habits
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({ created_at: -1 });
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
  const completedDates = logs
    .filter(l => l.completed)
    .map(l => new Date(l.date).setHours(0,0,0,0))
    .sort((a, b) => b - a);
  
  const uniqueDates = [...new Set(completedDates)];
  
  if (uniqueDates.length === 0) return 0;
  
  const today = new Date().setHours(0,0,0,0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // If last completion was before yesterday, streak is broken
  if (uniqueDates[0] < yesterday.getTime()) return 0;
  
  let streak = 0;
  let expectedDate = uniqueDates[0];
  
  for (let date of uniqueDates) {
    if (date === expectedDate) {
      streak++;
      const prev = new Date(expectedDate);
      prev.setDate(prev.getDate() - 1);
      expectedDate = prev.getTime();
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

    // Check if log for target date exists
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    targetDate.setHours(0,0,0,0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingLogIndex = habit.logs.findIndex(log => 
      new Date(log.date) >= targetDate && new Date(log.date) < nextDay
    );

    let xpAwarded = 0;
    let gamificationResult = null;

    if (existingLogIndex > -1) {
      // Update existing log
      // Only award XP if changing from false -> true
      if (!habit.logs[existingLogIndex].completed && req.body.completed) {
          xpAwarded = 20;
      }
      habit.logs[existingLogIndex].completed = req.body.completed;
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
