const router = require('express').Router();
const Prayer = require('../models/Prayer');
const auth = require('../middleware/auth');

router.use(auth);

// GET prayers for specific date (or today)
// GET prayers for specific date or range
// Helper to check and update missed prayers
const checkMissedPrayers = async (date, userId) => {
    const now = new Date();
    // Only check for today or past days
    if (date > now) return;

    const isToday = date.toDateString() === now.toDateString();
    
    // Prayer End Times (Hours)
    const END_TIMES = {
        'Fajr': 6.5,   // 06:30
        'Dhuhr': 16,   // 16:00
        'Asr': 18.5,   // 18:30
        'Maghrib': 20, // 20:00
        'Isha': 23.99  // 23:59
    };

    const currentHour = now.getHours() + now.getMinutes() / 60;

    for (const [name, endTime] of Object.entries(END_TIMES)) {
        // If it's today and time hasn't passed, skip
        if (isToday && currentHour < endTime) continue;

        const prayerDate = new Date(date);
        prayerDate.setHours(0,0,0,0);
        const nextDay = new Date(prayerDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find existing record
        const prayer = await Prayer.findOne({
            user: userId,
            name,
            date: { $gte: prayerDate, $lt: nextDay }
        });

        // If no record exists (pending implicitly), creates a 'missed' record
        if (!prayer) {
             await Prayer.create({
                user: userId,
                name,
                status: 'missed',
                date: prayerDate,
                type: 'normal'
            });
        } else if (prayer.status === 'pending') {
            prayer.status = 'missed';
            await prayer.save();
        }
    }
};

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const prayers = await Prayer.find({
        user: req.user.id,
        date: { $gte: start, $lte: end }
      });
      return res.json(prayers);
    }

    // Default to single date (existing behavior)
    const dateQuery = date ? new Date(date) : new Date();
    dateQuery.setHours(0,0,0,0);
    
    // Run checks for this date before returning
    await checkMissedPrayers(dateQuery, req.user.id);

    const nextDay = new Date(dateQuery);
    nextDay.setDate(nextDay.getDate() + 1);

    const prayers = await Prayer.find({
      user: req.user.id,
      date: { $gte: dateQuery, $lt: nextDay }
    });
    res.json(prayers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update status (create if not exists for that day)
router.post('/log', async (req, res) => {
  const { name, status, date, type = 'normal' } = req.body;
  const prayerDate = new Date(date || Date.now());
  prayerDate.setHours(0,0,0,0);
  const nextDay = new Date(prayerDate);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    let prayer = await Prayer.findOne({
      user: req.user.id,
      name,
      date: { $gte: prayerDate, $lt: nextDay }
    });

    if (prayer) {
      prayer.status = status;
      if (type) prayer.type = type;
      await prayer.save();
    } else {
      prayer = await Prayer.create({
        user: req.user.id,
        name,
        status,
        date: prayerDate,
        type
      });
    }
    res.json(prayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
