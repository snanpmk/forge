const router = require('express').Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// GET user stats (Gamification)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
