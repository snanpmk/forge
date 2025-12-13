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

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        googleId,
        avatar: picture
      });
    } else if (!user.googleId) {
        // Link existing account if needed (though here we just update)
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
    res.status(401).json({ message: 'Authentication failed' });
  }
});

module.exports = router;
