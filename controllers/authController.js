const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const generatePassword = require('../utils/generatePassword');
const { sendMail } = require('../utils/email'); // updated path if needed

// =====================
// Register Candidate
// =====================
exports.registerCandidate = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      email, phoneNumber, pan, skills = [], education = [], experienced = false
    } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const rawPassword = generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);

    const resume = req.file ? req.file.location : undefined;

    const user = new User({
      firstName, middleName, lastName, email, phoneNumber, pan,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      education,
      experienced,
      resume,
      password: hashed
    });

    await user.save();

    const html = `<p>Hi ${firstName},</p>
      <p>Your account has been created for SignaVox Careers.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>
      <p>Please login and change your password.</p>`;

    await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

    res.status(201).json({ message: 'Registered successfully. Check email for credentials.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =====================
// Login
// =====================
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });

//     const matched = await bcrypt.compare(password, user.password);
//     if (!matched) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         role: user.role,
//         team: user.team,
//         resume: user.resume
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


// =====================
// Login
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return all user fields as in schema except password
    const { password: _, __v, ...userData } = user.toObject();

    res.json({
      token,
      user: userData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// =====================
// Admin creates recruiter/admin
// =====================
exports.createUserByAdmin = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, role = 'recruiter', team = 'technical' } = req.body;
    if (!email || !firstName || !lastName) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const rawPassword = generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);

    const user = new User({ firstName, middleName, lastName, email, role, team, password: hashed });
    await user.save();

    const html = `<p>Account created for SignaVox Careers</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>`;

    await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

    res.status(201).json({ message: 'User created and emailed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================
// Forgot Password - Generate OTP
// =====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min

    user.resetPasswordOtp = otp;
    user.resetPasswordExpiry = otpExpiry;
    await user.save();

    const html = `<p>Hi ${user.firstName},</p>
      <p>You requested a password reset. Use the OTP below to reset your password:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>`;

    await sendMail({ to: email, subject: 'SignaVox Careers - Password Reset OTP', html });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================
// Reset Password with OTP
// =====================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp || Date.now() > user.resetPasswordExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
