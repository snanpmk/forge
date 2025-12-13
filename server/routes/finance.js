const router = require('express').Router();
const Finance = require('../models/Finance');

// GET recent transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Finance.find().sort({ date: -1 }).limit(50);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Finance(req.body);
    const savedTransaction = await transaction.save();
    res.json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    await Finance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
