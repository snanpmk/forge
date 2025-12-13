const User = require('../models/User');

const LEVEL_base_XP = 100;

// Generic curve: Level N requires N * 100 XP to pass
// Start at Level 1.
// XP needed for Level 2 = 100.
// XP needed for Level 3 = 200.
// Returns { user, levelUp: boolean, oldLevel: number, newLevel: number }
const addXP = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) return null; // Should handle this
  
  const oldLevel = user.level;
  
  user.xp += amount;
  user.total_xp += amount;

  let xpNeeded = user.level * LEVEL_base_XP;
  let levelUp = false;

  // Handle multiple level ups
  while (user.xp >= xpNeeded) {
    user.xp -= xpNeeded;
    user.level += 1;
    xpNeeded = user.level * LEVEL_base_XP;
    levelUp = true;
  }

  await user.save();
  return { user, levelUp, oldLevel, newLevel: user.level };
};

module.exports = {
  addXP
};
