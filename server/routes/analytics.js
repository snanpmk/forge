const router = require('express').Router();
const Habit = require('../models/Habit');
const Prayer = require('../models/Prayer');
const { startOfDay, subDays, format, isSameDay, addDays } = require('date-fns');

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // Default to 30 if not specified
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const today = startOfDay(new Date());

    // Execute queries in parallel
    const [habits, prayers] = await Promise.all([
        Habit.find(),
        Prayer.find({ date: { $gte: startDate } })
    ]);

    const totalHabits = habits.length;

    const trendData = [];
    
    // Iterate day by day
    for (let i = 0; i < days; i++) {
        const currentDate = addDays(startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const shortDate = format(currentDate, 'MMM dd');

        // 1. Calculate Habit Score
        // Count how many habits have a completed log for this date
        let completedHabits = 0;
        if (totalHabits > 0) {
            habits.forEach(h => {
                const log = h.logs.find(l => isSameDay(new Date(l.date), currentDate));
                if (log && log.completed) completedHabits++;
            });
        }
        const habitScore = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

        // 2. Calculate Prayer Score
        // Expected: 5 per day.
        // We look for prayers with this date.
        const dayPrayers = prayers.filter(p => isSameDay(new Date(p.date), currentDate));
        // Score: On-time = 1, Late = 0.5? Let's stick to On-Time for "Performance" or maybe 0.5 for Late.
        // Let's do: On-Time (100%), Late (50%), Missed (0%).
        let prayerPoints = 0;
        dayPrayers.forEach(p => {
            if (p.status === 'on-time') prayerPoints += 1;
            else if (p.status === 'late') prayerPoints += 0.5;
        });
        // If no entry exists for a prayer, it implies missed or pending.
        // Assuming 5 prayers/day.
        const prayerScore = Math.round((prayerPoints / 5) * 100);

        // 3. Overall Score
        const overallScore = Math.round((habitScore + prayerScore) / 2);

        trendData.push({
            date: shortDate,
            fullDate: dateStr,
            habitScore,
            prayerScore,
            overallScore
        });
    }

    res.json(trendData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
