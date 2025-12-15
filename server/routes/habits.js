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

    const clientOffsetMinutes = req.body.timezoneOffset || 0;
    
    // Helper to get Client Local YYYY-MM-DD from a Date object (UTC)
    const getClientLocalDateString = (dateObj) => {
        // Apply offset to get local time representation in UTC container
        // offset is in minutes, positive means behind UTC (usually, JS behavior) -> but getTimezoneOffset returns (UTC - Local) in minutes.
        // So Local = UTC - Offset.
        const localTime = new Date(dateObj.getTime() - (clientOffsetMinutes * 60000));
        return localTime.toISOString().split('T')[0];
    };

    let targetDateStr;
    if (req.body.date) {
        if (req.body.date.includes('T')) {
             targetDateStr = new Date(req.body.date).toISOString().split('T')[0];
        } else {
             targetDateStr = req.body.date;
        }
    } else {
        // If no date provided, use "Today" relative to client
        targetDateStr = getClientLocalDateString(new Date());
    }
    
    // Create a Date object for storage that is safely "noon UTC" on that day.
    // This isn't strictly necessary for matching anymore but good for data cleanliness.
    const targetDate = new Date(`${targetDateStr}T12:00:00.000Z`);

    // FIND ALL MATCHING LOGS based on Client Local Time
    // We filter the array to find indices of all logs that "look like" the target date to the client
    const matchingLogIndices = [];
    habit.logs.forEach((log, index) => {
        const logClientDateStr = getClientLocalDateString(new Date(log.date));
        if (logClientDateStr === targetDateStr) {
            matchingLogIndices.push(index);
        }
    });

    let xpAwarded = 0;


    if (matchingLogIndices.length > 0) {
      // Update ALL matching logs (this fixes duplicates/ghost logs)
      
      // Check if we are flipping from incomplete -> complete
      // We only award XP if at least one of them was incomplete and we are setting to complete
      const anyIncomplete = matchingLogIndices.some(idx => !habit.logs[idx].completed);
      
      if (anyIncomplete && req.body.completed) {
          xpAwarded = 20;
      }

      matchingLogIndices.forEach(idx => {
          habit.logs[idx].completed = req.body.completed;
          // Normalize the date to our standard targetDate (optional but good for cleanup)
          habit.logs[idx].date = targetDate; 
      });

    } else {
      // Add new log
      if (req.body.completed) {
          xpAwarded = 20;
      }
      habit.logs.push({ date: targetDate, completed: req.body.completed });
    }
    
    // Recalculate streak
    habit.streak = calculateStreak(habit.logs);
    
    // Optimize: Run DB writes in parallel
    const savePromise = habit.save();
    let gamificationPromise = Promise.resolve(null);

    if (xpAwarded > 0) {
        const userId = req.user ? req.user.id : (await require('../models/User').findOne())._id;
        gamificationPromise = addXP(userId, xpAwarded);
    }

    const [savedHabit, gamificationResult] = await Promise.all([savePromise, gamificationPromise]);

    res.json({ ...savedHabit.toObject(), gamification: gamificationResult ? { xpAdded: xpAwarded, ...gamificationResult } : null });
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
