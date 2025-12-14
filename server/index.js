const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Cron Job
require('./cron');

// Middleware
app.use(cors());
app.use(express.json());



// Routes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/dump', require('./routes/braindump'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/prayers', require('./routes/prayers'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/user', require('./routes/user'));

// Serve Static Assets in Production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Any other route loads index.html
  app.get(/(.*)/, (req, res) =>
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
