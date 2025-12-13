const router = require('express').Router();
const Finance = require('../models/Finance');
const auth = require('../middleware/auth');

router.use(auth);

// GET recent transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Finance.find({ user: req.user.id }).sort({ date: -1 }).limit(50);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Finance({ ...req.body, user: req.user.id });
    const savedTransaction = await transaction.save();
    res.json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    await Finance.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
