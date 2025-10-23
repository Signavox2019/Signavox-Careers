const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generatePassword = require('../utils/generatePassword');
const { sendMail } = require('../utils/email');
const generateOTP = require('../utils/generateOTP');

// ================================
// Register Candidate
// ================================
// exports.registerCandidate = async (req, res) => {
//   try {
//     const {
//       firstName, middleName, lastName,
//       email, phoneNumber, pan, skills = [],
//       education = [], experienced = false, experiences = []
//     } = req.body;

//     if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
//     if (phoneNumber && await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already registered' });
//     if (pan && await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already registered' });

//     if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan))
//       return res.status(400).json({ message: 'Invalid PAN format' });

//     if (experienced && (!experiences || experiences.length === 0))
//       return res.status(400).json({ message: 'Experience details required for experienced candidates' });

//     const rawPassword = generatePassword();
//     const hashed = await bcrypt.hash(rawPassword, 10);
//     const resume = req.file ? req.file.location : undefined;

//     let role = 'candidate';
//     if (email === 'Khaja.Rahiman@signavoxtechnologies.com') {
//       role = 'admin';
//     }

//     const user = new User({
//       firstName,
//       middleName,
//       lastName,
//       email,
//       phoneNumber,
//       pan,
//       skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
//       education,
//       experienced,
//       experiences,
//       resume,
//       password: hashed,
//       role
//     });

//     await user.save();

//     const html = `
//       <p>Hi ${user.firstName},</p>
//       <p>Your account has been created for SignaVox Careers.</p>
//       <p><strong>Email:</strong> ${email}</p>
//       <p><strong>Password:</strong> ${rawPassword}</p>
//       <p>Please login and change your password.</p>
//     `;

//     await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

//     res.status(201).json({
//       message: 'Registered successfully. Check your email for credentials.'
//     });
//   } catch (err) {
//     console.error(err);
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyValue)[0];
//       return res.status(400).json({ message: `${field} already exists` });
//     }
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };


exports.registerCandidate = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      email, phoneNumber, pan, skills = [],
      education = [], experienced = false, experiences = []
    } = req.body;

    // ✅ Check duplicates
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    if (phoneNumber && await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already registered' });
    if (pan && await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already registered' });

    // ✅ Validate PAN format
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan))
      return res.status(400).json({ message: 'Invalid PAN format' });

    // ✅ Validate experience requirement
    if (experienced && (!experiences || experiences.length === 0))
      return res.status(400).json({ message: 'Experience details required for experienced candidates' });

    const rawPassword = generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);
    const resume = req.file ? req.file.location : undefined;

    // ✅ Role auto-assign
    let role = 'candidate';
    if (email === 'Khaja.Rahiman@signavoxtechnologies.com') {
      role = 'admin';
    }

    // ✅ Create user
    const user = new User({
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      pan,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      education,
      experienced,
      experiences,
      resume,
      password: hashed,
      role
    });

    await user.save();

    // ✅ Send email
    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Your account has been created for SignaVox Careers.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>
      <p>Please login and change your password.</p>
    `;
    await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

    // ✅ Return full user details (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Registered successfully. Check your email for credentials.',
      user: userResponse
    });

  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// ================================
// Login
// ================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, __v, ...userData } = user.toObject();
    res.json({
      message: 'Login successful',
      token,
      user: {
        ...userData,
        name: user.name // ✅ Include full name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================================
// Admin creates recruiter/admin
// ================================
exports.createUserByAdmin = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      email, phoneNumber, pan,
      skills = [], education = [],
      experienced = false, experiences = [],
      role = 'recruiter', team = 'technical'
    } = req.body;

    if (!email || !firstName || !lastName) return res.status(400).json({ message: 'Missing required fields' });

    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (phoneNumber && await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already exists' });
    if (pan && await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already exists' });

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan))
      return res.status(400).json({ message: 'Invalid PAN format' });

    if (experienced && (!experiences || experiences.length === 0))
      return res.status(400).json({ message: 'Experience details required for experienced users' });

    const rawPassword = generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);

    const user = new User({
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      pan,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      education,
      experienced,
      experiences,
      role,
      team,
      password: hashed
    });

    await user.save();

    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Your account has been created for SignaVox Careers.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>
    `;

    await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

    res.status(201).json({
      message: 'User created successfully and email sent',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team
      }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ================================
// Reset Password with OTP
// ================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp || Date.now() > user.resetPasswordExpiry)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

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

// ================================
// Send OTP
// ================================
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    const { otp, expiry } = generateOTP();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpiry = expiry;
    await user.save();

    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Your OTP for SignaVox Careers is:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>
    `;

    await sendMail({ to: email, subject: 'SignaVox Careers - OTP', html });
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
