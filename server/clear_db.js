const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/forge');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const clearData = async () => {
  await connectDB();

  try {
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
      // Don't delete the 'users' collection if possible? 
      // User asked to "clear the db bind the user", usually implies wiping everything 
      // BUT we probably want to keep the logged in user so they don't have to re-register immediately for testing.
      // However, the prompt was "clear the db". "Bind the user and data everywhere".
      // If I delete users, I lose the accounts.
      // PROMPT: "clear the db bind the user".
      // If I keep users, I can easily test with existing token.
      // Let's keep `users` collection but clear everything else.
      
      if (collection.collectionName !== 'users') {
          console.log(`Clearing collection: ${collection.collectionName}`);
          await collection.deleteMany({});
      }
    }

    console.log('Data Destroyed! (Users preserved)');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  clearData();
} else {
    console.log('Run with -d to execute');
    process.exit();
}
