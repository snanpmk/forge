const router = require('express').Router();
const Habit = require('../models/Habit');
const Prayer = require('../models/Prayer');
const Goal = require('../models/Goal');
const BrainDump = require('../models/BrainDump');
const Finance = require('../models/Finance');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.use(auth);

router.get('/summary', async (req, res) => {
  if (process.env.USE_MOCK_DB === 'true') {
    return res.json({
      habits: [
        { _id: '1', title: 'Morning Jog', streak: 5, completedToday: true },
        { _id: '2', title: 'Read 20 mins', streak: 12, completedToday: false },
        { _id: '3', title: 'Spanish Practice', streak: 2, completedToday: false },
      ],
      prayers: [
        { name: 'Fajr', status: 'on-time' },
        { name: 'Dhuhr', status: 'missed' },
        { name: 'Asr', status: 'pending' },
        { name: 'Maghrib', status: 'pending' },
        { name: 'Isha', status: 'pending' },
      ],
      goals: [
        { _id: '1', title: 'Learn Spanish', progress: 10 },
        { _id: '2', title: 'Save $10,000', progress: 25 },
      ],
      brainDumpCount: 3,
      finance: {
        income: 5000,
        expense: 1500,
      }
    });
  }

  try {
    const { date } = req.query;
    
    // Default to 'now' if no date provided, otherwise parse the YYYY-MM-DD string
    // Note: new Date('YYYY-MM-DD') parses as UTC midnight.
    // This aligns with how we want to query if our DB stores normalized dates.
    const queryDate = date ? new Date(date) : new Date();
    
    const todayStart = new Date(queryDate);
    todayStart.setHours(0, 0, 0, 0); // Force to midnight
    
    const todayEnd = new Date(queryDate);
    todayEnd.setHours(23, 59, 59, 999); // Force to end of day

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    // Execute queries in parallel
    const [habits, prayers, goals, dumpCount, financeData, todaysTasks, todaysExpenses] = await Promise.all([
        // 1. Habits
        Habit.find({ user: req.user.id }),
        // 2. Prayers
        Prayer.find({ user: req.user.id, date: { $gte: todayStart, $lte: todayEnd } }),
        // 3. Goals (Active goals, sorted by due date)
        Goal.find({ user: req.user.id, progress: { $lt: 100 } }).sort({ target_date: 1 }).limit(5),
        // 4. Brain Dump (Count unprocessed)
        BrainDump.countDocuments({ user: req.user.id, processed: false }),
        // 5. Finance (Current Month Snapshot)
        Finance.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(req.user.id), date: { $gte: startOfMonth } } },
          { $group: { _id: "$type", total: { $sum: "$amount" } } }
        ]),
        // 6. Tasks for Today (Due today pending/in-progress OR Completed today)
        // We want: 
        // - "Upcoming" = Pending/In-Progress AND Due <= TodayEnd
        // - "Done" = Completed AND UpdatedAt >= TodayStart
        // Actually simpler: Just query all tasks relevant to today and filter in code or query.
        // Let's do a smart query.
        mongoose.model('Task').find({
            user: req.user.id,
            $or: [
                { due_date: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'completed' } }, // Due today, not done
                { status: 'completed', created_at: { $gte: todayStart, $lte: todayEnd } } // Done today (assuming created_at approx updated_at for now, better to match `updatedAt` if schema had it, falling back to simple "Due Today & Completed" logic or just 'Due Today')
                // Re-reading Schema: Task has `created_at` but no explicit `updated_at`. 
                // Let's rely on: Due Date for everything.
                // "Upcoming" = Due Today & Pending.
                // "Done" = Due Today & Completed.
            ]
        }).sort({ priority: -1, due_date: 1 }),
        
        // 7. Finance Today (Specific for Snapshot)
        Finance.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(req.user.id), date: { $gte: todayStart, $lte: todayEnd }, type: 'expense' } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
    ]);

    // Process Habits
    const habitSummary = habits.map(habit => {
      const todayLog = habit.logs.find(log => 
        log.date >= todayStart && log.date <= todayEnd
      );
      return {
        _id: habit._id,
        title: habit.title,
        streak: habit.streak,
        completedToday: !!(todayLog && todayLog.completed)
      };
    });

    // Process Finance
    // Process Finance
    const financeSummary = {
      income: financeData.find(f => f._id === 'income')?.total || 0,
      expense: financeData.find(f => f._id === 'expense')?.total || 0,
      todayExpense: todaysExpenses[0]?.total || 0
    };

    // Process Tasks
    // Group into 'upcoming' (pending) and 'done' (completed)
    const taskSummary = {
        upcoming: todaysTasks.filter(t => t.status !== 'completed'),
        doneCount: todaysTasks.filter(t => t.status === 'completed').length,
        total: todaysTasks.length
    };

    res.json({
      habits: habitSummary,
      prayers, // We might need to fill in missing prayers on the client side or here. 
      goals,
      brainDumpCount: dumpCount,
      finance: financeSummary,
      tasks: taskSummary
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
