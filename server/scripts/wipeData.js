const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const Prayer = require('../models/Prayer');
const Task = require('../models/Task');
const Finance = require('../models/Finance');
const Goal = require('../models/Goal');
const BrainDump = require('../models/BrainDump');
const Budget = require('../models/Budget');

const TARGET_DATE = new Date('2025-12-14T00:00:00');

async function wipeData() {
  try {
    // 1. Connect to Database
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in environment variables.");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB. Target Date: ${TARGET_DATE.toISOString()}`);

    // 2. Wipe Finance (Simple Date Check)
    const financeRes = await Finance.deleteMany({ date: { $lt: TARGET_DATE } });
    console.log(`Deleted ${financeRes.deletedCount} Finance records.`);

    // 3. Wipe Prayer (Simple Date Check)
    const prayerRes = await Prayer.deleteMany({ date: { $lt: TARGET_DATE } });
    console.log(`Deleted ${prayerRes.deletedCount} Prayer records.`);

    // 4. Wipe Habits (Pull from logs array)
    // We update ALL habits to remove logs older than target date
    const habitRes = await Habit.updateMany(
      {},
      { $pull: { logs: { date: { $lt: TARGET_DATE } } } }
    );
    console.log(`Updated Habits (removed old logs): ${habitRes.modifiedCount} documents modified.`);

    // 5. Wipe Tasks (Only Completed ones)
    // Delete if status is 'completed' AND (completed_at < target OR created_at < target if completed_at is missing)
    const taskRes = await Task.deleteMany({
      status: 'completed',
      $or: [
        { completed_at: { $lt: TARGET_DATE } },
        { completed_at: null, created_at: { $lt: TARGET_DATE } }
      ]
    });
    console.log(`Deleted ${taskRes.deletedCount} old completed Tasks.`);

    // 6. Wipe BrainDump (Only Processed ones)
    const brainDumpRes = await BrainDump.deleteMany({
      processed: true,
      created_at: { $lt: TARGET_DATE }
    });
    console.log(`Deleted ${brainDumpRes.deletedCount} old processed BrainDump items.`);

    // 7. Wipe Goals (Only Completed ones)
    const goalRes = await Goal.deleteMany({
      status: { $in: ['Completed', 'Archived'] },
      $or: [
        { completed_at: { $lt: TARGET_DATE } },
        { completed_at: null, created_at: { $lt: TARGET_DATE } }
      ]
    });
    console.log(`Deleted ${goalRes.deletedCount} old completed Goals.`);

    // 8. Wipe Budget
    // Logic: Month string "YYYY-MM" comparison
    // We want to delete months strictly BEFORE "2025-12"
    // So "2025-11", "2024-12", etc.
    const targetMonthStr = "2025-12";
    const budgetRes = await Budget.deleteMany({
      month: { $lt: targetMonthStr } 
    });
    console.log(`Deleted ${budgetRes.deletedCount} old Budgets (before ${targetMonthStr}).`);

    console.log("Data wipe complete.");
    process.exit(0);

  } catch (error) {
    console.error("Error during data wipe:", error);
    process.exit(1);
  }
}

wipeData();
