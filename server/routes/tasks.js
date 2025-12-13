const router = require('express').Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

router.use(auth);

// GET all tasks (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, goal_id } = req.query;
    let query = { user: req.user.id };

    if (status) query.status = status;
    if (goal_id) query.goal_link_id = goal_id;
    
    if (startDate && endDate) {
        query.due_date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const tasks = await Task.find(query).sort({ due_date: 1, priority: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new task
router.post('/', async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user.id });
    const savedTask = await task.save();
    res.json(savedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const { addXP } = require('../utils/gamification');

// ... (existing imports)

 // PUT update task
 router.put('/:id', async (req, res) => {
   try {
     const oldTask = await Task.findOne({ _id: req.params.id, user: req.user.id });
     if (!oldTask) return res.status(404).json({ message: 'Task not found' });

     const task = await Task.findOneAndUpdate(
         { _id: req.params.id, user: req.user.id },
         req.body,
         { new: true }
     );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if status changed to 'done'
    if (oldTask.status !== 'done' && task.status === 'done') {
        // Since we don't have user auth on tasks route yet, we might fail here.
        // But for now, let's assume we will add auth middleware to tasks too.
        // If not, we need a way to know WHO completed the task.
        // For now, temporarily finding the first user if no req.user (backward compat) but really we should enforce auth.
        // Let's assume req.user is set or we default to the first user for "single user" feel until we fully protect routes.
        
        // Actually, to do this right, I should protect the route.
        // I'll proceed assuming I WILL protect the route in next step.
        const userId = req.user ? req.user.id : (await require('../models/User').findOne())._id;
        
        const { levelUp, newLevel } = await addXP(userId, 50);
        // Include gamification data in response if needed, 
        // essentially we might want to return { task, gamification: { ... } } 
        // but to keep API consistent for now we just process side effect.
        // Frontend can poll user stats or we can attach it.
        // Let's attach a temporary property for the frontend to notice
        res.json({ ...task.toObject(), gamification: { xpAdded: 50, levelUp, newLevel } });
        return;
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
