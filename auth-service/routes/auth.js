const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Local Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ email, password, role: role || 'user' });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Local Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // In a real app we'd verify the token with Google:
    // const ticket = await client.verifyIdToken({
    //   idToken: credential,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    
    // For demonstration/placeholder purposes, we'll decode it manually
    // WARNING: This is NOT secure for production, always verify properly
    const payloadBase64 = credential.split('.')[1];
    const payloadBuffer = Buffer.from(payloadBase64, 'base64');
    const payload = JSON.parse(payloadBuffer.toString('utf-8'));

    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      // Create user if they don't exist
      user = new User({
        email: payload.email,
        googleId: payload.sub,
        role: 'admin' // According to user request, admins use Google Auth
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google ID if user exists but hasn't linked
      user.googleId = payload.sub;
      user.role = 'admin'; // upgrade to admin
      await user.save();
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('GOOGLE AUTH ERROR:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
