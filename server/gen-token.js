const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const generate = async () => {
    await connectDB();
    
    // Find or create a user to test with
    let user = await User.findOne();
    if (!user) {
        console.log('No user found, creating one...');
        user = await User.create({
            username: 'Test User',
            email: 'test@example.com',
            googleId: 'test-google-id',
            avatar: 'https://via.placeholder.com/150'
        });
    }

    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    console.log('TOKEN:', token);
    console.log('USERID:', user._id.toString());
    process.exit(0);
};

generate();
