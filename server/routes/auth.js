const router = require('express').Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture, sub: googleId } = ticket.getPayload();
    // console.log('Google Payload:', { name, email, googleId }); // Debug log

    if (!email) {
        return res.status(400).json({ message: 'Email address is required from Google' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name || 'User',
        email,
        googleId,
        avatar: picture
      });
    } else if (!user.googleId) {
        // Link existing account
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
    }

    const authToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );

    res.json({ token: authToken, user });
  } catch (err) {
    console.error('Google Auth Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
});

module.exports = router;
