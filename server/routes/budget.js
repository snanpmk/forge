const router = require('express').Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

router.use(auth);

// GET Budgets for a specific month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: 'Month is required' });
    
    const budgets = await Budget.find({ user: req.user.id, month });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create or Update Budget (Upsert)
router.post('/', async (req, res) => {
  try {
    const { category, limit, month } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, category, month },
      { limit },
      { new: true, upsert: true } // Create if doesn't exist, update if does
    );
    res.json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
