const router = require('express').Router();
const Prayer = require('../models/Prayer');
const auth = require('../middleware/auth');

router.use(auth);

// GET prayers for specific date (or today)
// GET prayers for specific date or range
// Helper to check and update missed prayers
// Helper to check and update missed prayers
const checkMissedPrayers = async (date, userId, latitude, longitude) => {
    const now = new Date();
    // Only check for today or past days
    if (date > now) return;

    const isToday = date.toDateString() === now.toDateString();
    
    let prayerEndTimes = {};

    // Try to fetch dynamic times if location is available
    if (latitude && longitude) {
        try {
            const dateStr = date.toISOString().split('T')[0].split('-').reverse().join('-'); // DD-MM-YYYY
            const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=2`);
            const data = await response.json();
            
            if (data && data.code === 200) {
                const timings = data.data.timings;
                
                // Helper to parse time string "HH:MM" to Date object for the specific day
                const getPrayerDate = (timeStr) => {
                    const [h, m] = timeStr.split(':').map(Number);
                    const d = new Date(date);
                    d.setHours(h, m, 0, 0);
                    return d;
                };

                // Define End Times based on Kalah logic:
                // Fajr ends at Sunrise
                // Dhuhr ends at Asr
                // Asr ends at Maghrib
                // Maghrib ends at Isha
                // Isha ends at Fajr (next day) - tricky, simpler check: if now > Isha time + X hours? 
                // For simplified "missed" check: 
                // If it is past the START of the NEXT prayer, the CURRENT prayer is missed.
                
                prayerEndTimes = {
                    'Fajr': getPrayerDate(timings.Sunrise),
                    'Dhuhr': getPrayerDate(timings.Asr),
                    'Asr': getPrayerDate(timings.Maghrib),
                    'Maghrib': getPrayerDate(timings.Isha),
                    // For Isha, typically midnight or Fajr next day. 
                    // Let's assume Middle of Night (Midnight) as conservative end or Fajr next day.
                    // To be safe and simple: Isha is missed if it's past Fajr next day.
                    // We'll estimate "Midnight" as 23:59:59 for today's check unless we fetch next day.
                    // Hardcode Isha end to end of day for today's check to avoid complex next-day logic for now.
                    'Isha': new Date(date).setHours(23, 59, 59, 999) 
                };
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
            // Fallback to hardcoded will happen if prayerEndTimes is empty
        }
    }

    // Fallback Hardcoded Prayer End Times (Hours)
    const HARDCODED_END_TIMES = {
        'Fajr': 6.5,   // 06:30
        'Dhuhr': 16,   // 16:00
        'Asr': 18.5,   // 18:30
        'Maghrib': 20, // 20:00
        'Isha': 23.99  // 23:59
    };

    const currentHour = now.getHours() + now.getMinutes() / 60;

    for (const name of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
        let isTimePassed = false;

        if (prayerEndTimes[name]) {
            // Dynamic check
            // If the calculated end time for this prayer matches "today"
            // For Isha (mapped to number), handle separately? No, I mapped Isha to timestamp in dynamic block.
            let endTime = prayerEndTimes[name];
            if (typeof endTime === 'number') endTime = new Date(endTime); // Handle setHours return

            if (now > endTime) isTimePassed = true;
        } else {
            // Hardcoded check
            const endTime = HARDCODED_END_TIMES[name];
            // If it's today and current hour > end time
            if (isToday && currentHour > endTime) isTimePassed = true;
            // If it's past day, it's always passed
            if (!isToday && date < now) isTimePassed = true; 
        }

        // If time hasn't passed, skip
        if (!isTimePassed) continue;

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
    const { startDate, endDate, date, latitude, longitude } = req.query;

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
    // Use target user ID
    const targetUserId = req.query.userId || req.user.id;
    await checkMissedPrayers(dateQuery, targetUserId, latitude, longitude);

    const nextDay = new Date(dateQuery);
    nextDay.setDate(nextDay.getDate() + 1);

    const prayers = await Prayer.find({
      user: targetUserId,
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
    const targetUserId = req.query.userId || req.user.id;
    let prayer = await Prayer.findOne({
      user: targetUserId,
      name,
      date: { $gte: prayerDate, $lt: nextDay }
    });

    if (prayer) {
      prayer.status = status;
      if (type) prayer.type = type;
      await prayer.save();
    } else {
      prayer = await Prayer.create({
        user: targetUserId,
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
