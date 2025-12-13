const router = require('express').Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// Import Models for Deletion
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const Task = require('../models/Task');
const Finance = require('../models/Finance');
const BrainDump = require('../models/BrainDump');
const Budget = require('../models/Budget');
const Prayer = require('../models/Prayer');

// GET user stats (Gamification)
router.get('/', verifyToken, async (req, res) => {
    try {
        // Use token ID instead of query ID for profile to prevent spoofing/stale data
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE /api/user/reset - Wipe all user data
router.delete('/reset', verifyToken, async (req, res) => {
    try {
        const userId = req.query.userId || req.user.id;

        // Parallel deletions for efficiency
        await Promise.all([
            Goal.deleteMany({ user: userId }),
            Habit.deleteMany({ user: userId }),
            Task.deleteMany({ user: userId }),
            Finance.deleteMany({ user: userId }),
            BrainDump.deleteMany({ user: userId }),
            Budget.deleteMany({ user: userId }),
            Prayer.deleteMany({ user: userId }),
            // Reset User Stats (optional, but good for "fresh start")
            User.findByIdAndUpdate(userId, { 
                level: 1, 
                xp: 0, 
                onboarding_completed: true // Keep them onboarded
            })
        ]);

        res.json({ message: 'All data successfully wiped.' });
    } catch (err) {
        console.error("Reset Error:", err);
        res.status(500).json({ message: 'Failed to wipe data.' });
    }
});


// Update User Settings (Finance Categories)
router.put('/settings', verifyToken, async (req, res) => {
    try {
        const { finance_settings } = req.body;
        const user = await User.findById(req.user.id);
        
        if (finance_settings) {
            user.finance_settings = finance_settings;
        }
        
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
