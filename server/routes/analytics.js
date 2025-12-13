const router = require('express').Router();
const Habit = require('../models/Habit');
const Prayer = require('../models/Prayer');
const Task = require('../models/Task');
const Finance = require('../models/Finance');
const { startOfDay, subDays, format, isSameDay, addDays, startOfMonth, isSameMonth, addMonths } = require('date-fns');

const auth = require('../middleware/auth');

router.use(auth);

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Default to 30 if not specified
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    
    // Determine granularity
    const isYearly = days > 90;
    
    let startDate;
    if (isYearly) {
        startDate = startOfMonth(subDays(new Date(), days)); // Align to start of month roughly
    } else {
        startDate = startOfDay(subDays(new Date(), days - 1));
    }

    // Execute queries in parallel
    const [habits, prayers, tasks, finances] = await Promise.all([
        Habit.find({ user: req.user.id }),
        Prayer.find({ user: req.user.id, date: { $gte: startDate } }),
        Task.find({ user: req.user.id, completed: true, updatedAt: { $gte: startDate } }), // Assuming updatedAt is completion time roughly
        Finance.find({ user: req.user.id, date: { $gte: startDate } })
    ]);

    const totalHabits = habits.length;
    const trendData = [];
    
    const iterations = isYearly ? 12 : days; // Approx 12 months for yearly view

    // Iterate
    if (isYearly) {
         // MONTHLY RES
         for (let i = 0; i <= 12; i++) {
            const currentMonth = addMonths(startDate, i);
            if (currentMonth > endToday) break;
            
            const monthStr = format(currentMonth, 'MMM yyyy');
            
            // Filter data for this month
            // Note: Simplistic filtering in loop for now. Optimization: Aggregate in Mongo.
            
            // 1. Finance
            const monthExpenses = finances
                 .filter(f => isSameMonth(new Date(f.date), currentMonth) && f.type === 'expense')
                 .reduce((acc, f) => acc + f.amount, 0);

            // 2. Tasks
            const monthTasks = tasks.filter(t => isSameMonth(new Date(t.updatedAt), currentMonth)).length;

            trendData.push({
                date: monthStr,
                fullDate: monthStr,
                expense: monthExpenses,
                tasks: monthTasks,
                // Scores are harder to average for a month without daily data, skipping scores for Yearly view overview for now or mock?
                // Let's keep it simple: Show Finance & Tasks primarily for Yearly
                overallScore: 0, 
                habitScore: 0,
                prayerScore: 0
            });
         }
    } else {
        // DAILY RES
        for (let i = 0; i < days; i++) {
            const currentDate = addDays(startDate, i);
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const shortDate = format(currentDate, 'MMM dd');
    
            // 1. Calculate Habit Score
            let completedHabits = 0;
            if (totalHabits > 0) {
                habits.forEach(h => {
                    const log = h.logs.find(l => isSameDay(new Date(l.date), currentDate));
                    if (log && log.completed) completedHabits++;
                });
            }
            const habitScore = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    
            // 2. Calculate Prayer Score
            const dayPrayers = prayers.filter(p => isSameDay(new Date(p.date), currentDate));
            let prayerPoints = 0;
            dayPrayers.forEach(p => {
                if (p.status === 'on-time') prayerPoints += 1;
                else if (p.status === 'late') prayerPoints += 0.5;
            });
            const prayerScore = Math.round((prayerPoints / 5) * 100);
    
            // 3. Tasks
            const dayTasks = tasks.filter(t => isSameDay(new Date(t.updatedAt), currentDate)).length;

            // 4. Finance
            const dayExpenses = finances
                .filter(f => isSameDay(new Date(f.date), currentDate) && f.type === 'expense')
                .reduce((acc, f) => acc + f.amount, 0);
    
            // 5. Overall Score
            const overallScore = Math.round((habitScore + prayerScore) / 2);
    
            trendData.push({
                date: shortDate,
                fullDate: dateStr,
                habitScore,
                prayerScore,
                overallScore,
                tasks: dayTasks,
                expense: dayExpenses
            });
        }
    }

    res.json(trendData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
