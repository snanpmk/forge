const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Habit = require('./models/Habit');
const Goal = require('./models/Goal');
const Prayer = require('./models/Prayer');
const BrainDump = require('./models/BrainDump');
const Finance = require('./models/Finance');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await Habit.deleteMany({});
  await Goal.deleteMany({});
  await Prayer.deleteMany({});
  await BrainDump.deleteMany({});
  await Finance.deleteMany({});

  console.log('Data Cleared');

  // Create Goals
  const goal1 = await Goal.create({
    title: 'Learn Spanish',
    target_date: new Date('2025-12-31'),
    total_weight: 100,
    progress: 10,
    milestones: [
      { title: 'Complete Duolingo Unit 1', completed: true },
      { title: 'Read a Spanish book', completed: false }
    ]
  });

  const goal2 = await Goal.create({
    title: 'Save $10,000',
    target_date: new Date('2025-06-01'),
    progress: 25
  });

  // Create Habits
  await Habit.create([
    { title: 'Morning Jog', streak: 5, goal_link_id: null },
    { title: 'Read 20 mins', streak: 12, goal_link_id: null },
    { title: 'Spanish Practice', streak: 2, goal_link_id: goal1._id }
  ]);

  // Create Prayers (Today)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  await Prayer.create([
    { name: 'Fajr', date: today, status: 'on-time' },
    { name: 'Dhuhr', date: today, status: 'missed' },
    { name: 'Asr', date: today, status: 'pending' },
    // Maghrib, Isha pending (no record = pending logic handled or explicit pending)
    { name: 'Maghrib', date: today, status: 'pending' }, 
    { name: 'Isha', date: today, status: 'pending' }, 
  ]);

  // Create Brain Dumps
  await BrainDump.create([
    { content: 'Buy groceries for the week', type: 'task' },
    { content: 'App idea: AI for plants', type: 'idea' },
    { content: 'Processed dump item', processed: true }
  ]);

  // Create Finance
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  
  await Finance.create([
    { type: 'income', amount: 5000, category: 'Salary', date: startOfMonth },
    { type: 'expense', amount: 1200, category: 'Rent', date: new Date() },
    { type: 'expense', amount: 300, category: 'Food', date: new Date() },
  ]);

  console.log('Data Seeded');
  process.exit();
};

seedData();
