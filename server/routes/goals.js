const router = require('express').Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.use(auth);

// GET all goals with actual spend calculated
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.aggregate([
      // Match goals for current user
      { $match: { user: new mongoose.Types.ObjectId(req.query.userId || req.user.id) } }, 
      // Lookup expenses linked to this goal
      {
        $lookup: {
          from: 'finances',
          localField: '_id',
          foreignField: 'goal_link_id',
          as: 'expenses'
        }
      },
      // Calculate total spent
      {
        $addFields: {
          actual_spend: {
            $sum: {
              $map: {
                input: { 
                   $filter: { 
                       input: "$expenses", 
                       as: "item", 
                       cond: { $eq: ["$$item.type", "expense"] } 
                   }
                },
                as: "expense",
                in: "$$expense.amount"
              }
            }
          }
        }
      },
      // Remove the full expenses array to keep response light
      { $project: { expenses: 0 } },
      { $sort: { created_at: -1 } }
    ]);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new goal
router.post('/', async (req, res) => {
  try {
    const goal = new Goal({ ...req.body, user: req.user.id });
    const savedGoal = await goal.save();
    res.json(savedGoal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update goal (milestones, etc)
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // If status changes to Completed, set completed_at if not present
    if (updates.status === 'Completed' && !updates.completed_at) {
        updates.completed_at = new Date();
    }
    // If un-completing, remove completed_at
    if (updates.status === 'Active') {
        updates.completed_at = null;
    }

    const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { new: true }
    );
    // Recalculate progress if milestones changed
    if (req.body.milestones) {
      const completed = goal.milestones.filter(m => m.completed).length;
      const total = goal.milestones.length;
      goal.progress = total === 0 ? 0 : Math.round((completed / total) * 100);
      
      // Auto-update status if 100% (optional, but requested implicitly)
      if (goal.progress === 100 && goal.status !== 'Completed') {
          goal.status = 'Completed';
          goal.completed_at = new Date();
      }
      
      await goal.save();
    }
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
