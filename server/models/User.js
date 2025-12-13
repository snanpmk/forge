const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: {
    type: String,
    unique: true
  },
  avatar: {
    type: String
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  total_xp: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }]
}, { timestamps: true });

// Ensure only one user exists for this local app
UserSchema.statics.getSingleUser = async function() {
  let user = await this.findOne();
  if (!user) {
    user = await this.create({ username: 'Forge User' });
  }
  return user;
};

module.exports = mongoose.model('User', UserSchema);
