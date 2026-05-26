const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { protect, superAdmin } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper to format user response
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  profilePicture: user.profilePicture,
  isVerified: user.isVerified,
  isWaitingApproval: user.isWaitingApproval,
  gstPdf: user.gstPdf,
  storePic: user.storePic,
  gstNumber: user.gstNumber,
  panNumber: user.panNumber,
  aadhaarNumber: user.aadhaarNumber,
  savedAddresses: user.savedAddresses,
  businessName: user.businessName,
  pincode: user.pincode
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.comparePassword(password))) {
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ _id: admin._id, name: admin.name, email: admin.email, role: admin.role, token });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  console.log('REGISTRATION REQUEST:', req.body);
  try {
    const { name, email, password, role, phone, businessName, gstPdf } = req.body;
    const targetRole = role || 'b2c';

    // Check if account with THIS EXACT role already exists
    const userExists = await User.findOne({ email, role: targetRole });
    if (userExists) {
      return res.status(400).json({
        message: `An account with the ${targetRole.toUpperCase()} role already exists for this email.`,
        error: 'ALREADY_EXISTS'
      });
    }

    // Create user with a new session ID
    const sessionId = crypto.randomBytes(16).toString('hex');
    const user = await User.create({
      name,
      email,
      password,
      role: targetRole,
      phone,
      businessName: businessName || '',
      gstPdf: gstPdf || '',
      isWaitingApproval: false,
      sessionId
    });

    const token = jwt.sign({ id: user._id, sessionId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    console.error('Registration Error:', error);
    // If it's a Mongoose validation error, provide details
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', '), error: 'VALIDATION_ERROR' });
    }
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/auth/user-login
router.post('/user-login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const targetRole = role || 'b2c';
    const user = await User.findOne({ email, role: targetRole });

    if (user && (await user.comparePassword(password))) {
      const sessionId = crypto.randomBytes(16).toString('hex');
      user.sessionId = sessionId;
      await user.save();

      const token = jwt.sign({ id: user._id, sessionId }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user: formatUser(user) });
    } else {
      // Check if user exists with DIFFERENT role to provide better error
      const otherRoleUser = await User.findOne({ email });
      if (otherRoleUser) {
        return res.status(401).json({
          message: `This account is currently registered as ${otherRoleUser.role.toUpperCase()}. Please switch to the correct portal or register a new ${targetRole.toUpperCase()} profile.`,
          hasOtherRole: true
        });
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) res.json(formatUser(user));
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.profilePicture = req.body.profilePicture || user.profilePicture;
      user.storePic = req.body.storePic || user.storePic;
      if (req.body.savedAddresses) user.savedAddresses = req.body.savedAddresses;
      if (req.body.password) user.password = req.body.password;

      const updatedUser = await user.save();
      res.json(formatUser(updatedUser));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/auth/b2b-verify-submit
router.post('/b2b-verify-submit', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.gstPdf = req.body.gstPdf;
    user.storePic = req.body.storePic;
    user.gstNumber = req.body.gstNumber;
    user.panNumber = req.body.panNumber;
    user.aadhaarNumber = req.body.aadhaarNumber;
    user.pincode = req.body.pincode;
    user.isWaitingApproval = true;

    const savedUser = await user.save();
    res.status(200).json(formatUser(savedUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
  const { name, email, profilePicture, role } = req.body;
  const targetRole = role || 'b2c';
  try {
    let user = await User.findOne({ email, role: targetRole });

    const sessionId = crypto.randomBytes(16).toString('hex');
    if (!user) {
      user = await User.create({
        name, email, profilePicture, role: targetRole,
        password: Math.random().toString(36).slice(-10),
        isWaitingApproval: false,
        sessionId
      });
    } else {
      user.sessionId = sessionId;
      await user.save();
    }
    const token = jwt.sign({ id: user._id, sessionId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email, role } = req.body;
  try {
    const user = await User.findOne({ email, role: role || 'b2c' });
    if (!user) {
      return res.status(404).json({ message: 'User with this email and role not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send email (Mock for now, but configured with nodemailer)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Check if email config exists
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        to: user.email,
        from: `Zudo <${process.env.EMAIL_USER}>`,
        subject: 'Password Reset Request',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
          `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
          `${resetUrl}\n\n` +
          `If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: 'Email sent' });
    } else {
      // If no email config, return token for testing (SECURITY RISK IN PRODUCTION)
      res.json({
        message: 'Email configuration missing. Token returned for testing.',
        resetToken: resetToken,
        resetUrl: resetUrl
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
