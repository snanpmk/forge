const router = require('express').Router();
const ShoppingItem = require('../models/ShoppingItem');
const auth = require('../middleware/auth');

router.use(auth);

// GET All Items
router.get('/', async (req, res) => {
  try {
    const items = await ShoppingItem.find({ user: req.user.id }).sort({ created_at: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST New Item
router.post('/', async (req, res) => {
  try {
    const newItem = new ShoppingItem({
      content: req.body.content,
      user: req.user.id
    });
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT Update Item
router.put('/:id', async (req, res) => {
  try {
    const { content, is_checked } = req.body;
    const item = await ShoppingItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { content, is_checked } }, // Only update fields present in body is NOT handled by $set if undefined, checking fields manually or using { ...req.body } is better but strict definition is safer.
      // Actually simply passing req.body works if we trust it, but safer to pick.
      // Here we assume client sends what needs update. 
      // is_checked might be false, so standard falsy check is bad.
    );
    
    // Better implementation for PUT:
    const updateFields = {};
    if (content !== undefined) updateFields.content = content;
    if (is_checked !== undefined) updateFields.is_checked = is_checked;

    const updatedItem = await ShoppingItem.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updateFields,
        { new: true }
    );

    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE Item
router.delete('/:id', async (req, res) => {
  try {
    const result = await ShoppingItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!result) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
