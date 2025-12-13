const router = require('express').Router();
const BrainDump = require('../models/BrainDump');

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await BrainDump.find({ processed: false }).sort({ created_at: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new item
router.post('/', async (req, res) => {
  try {
    const item = new BrainDump(req.body);
    const savedItem = await item.save();
    res.json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT mark as processed (or update content)
router.put('/:id', async (req, res) => {
  try {
    const item = await BrainDump.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE item
router.delete('/:id', async (req, res) => {
  try {
    await BrainDump.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
