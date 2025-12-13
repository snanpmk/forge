require('dotenv').config();
const mongoose = require('mongoose');
const Finance = require('./models/Finance');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Wipe all transactions
    await Finance.deleteMany({});
    console.log('Wiped Finance collection');

    // 2. Add requested transactions
    const transactions = [
      {
        type: 'income',
        amount: 45643.90,
        category: 'Opening Balance',
        description: 'Initial Setup',
        date: new Date()
      },
      {
        type: 'lended',
        amount: 900,
        category: 'Personal Loan',
        description: 'Lended to friend',
        related_entity: 'Aju',
        date: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        type: 'borrowed',
        amount: 5000,
        category: 'Personal Loan',
        description: 'Borrowed from sister',
        related_entity: 'Sister',
        date: new Date(Date.now() - 86400000) // Yesterday
      }
    ];

    await Finance.insertMany(transactions);
    console.log('Seeded initial transactions');
    
    // Log result
    console.log('Done. Values inserted:');
    transactions.forEach(t => console.log(`- ${t.type}: ${t.amount} (${t.related_entity || ''})`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
