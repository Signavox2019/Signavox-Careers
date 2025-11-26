const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generatePassword = require('../utils/generatePassword');
const { sendMail } = require('../utils/email');
const generateOTP = require('../utils/generateOTP');


// Register Candidate (Complete version with all fields)

// exports.registerCandidate = async (req, res) => {
//   try {
//     let {
//       firstName, middleName, lastName, gender,
//       email, phoneNumber, pan, skills = [],
//       education = [], experienced = false,
//       experiences = [], certifications = [],
//       DOB, permanentAddress,
//       currentAddress, socialLinks = {}, team = 'none'
//     } = req.body;

//     // Convert string booleans & parse arrays
//     if (typeof experienced === 'string') experienced = experienced.toLowerCase() === 'true';

//     if (typeof skills === 'string') {
//       try { skills = JSON.parse(skills); } catch { skills = skills.split(',').map(s => s.trim()); }
//     }

//     if (typeof education === 'string') {
//       try { education = JSON.parse(education); } catch { education = []; }
//     }

//     if (typeof experiences === 'string') {
//       try { experiences = JSON.parse(experiences); } catch { experiences = []; }
//     }

//     if (typeof certifications === 'string') {
//       try { certifications = JSON.parse(certifications); } catch { certifications = []; }
//     }

//     if (typeof socialLinks === 'string') {
//       try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
//     }

//     // Normalize gender
//     if (gender) gender = gender.toLowerCase();

//     // Required field checks
//     if (!firstName || !lastName) return res.status(400).json({ message: 'First and last name are required' });
//     if (!gender) return res.status(400).json({ message: 'Gender is required' });
//     if (!['male', 'female', 'other'].includes(gender)) return res.status(400).json({ message: 'Invalid gender value' });

//     if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
//     if (phoneNumber && await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already registered' });
//     if (pan && await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already registered' });
//     if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) return res.status(400).json({ message: 'Invalid PAN format' });

//     if (experienced && (!experiences || experiences.length === 0)) {
//       return res.status(400).json({ message: 'Experience details required for experienced candidates' });
//     }

//     // File uploads
//     let resume, profileImage;
//     if (req.files) {
//       if (req.files['resume']) resume = req.files['resume'][0].location || req.files['resume'][0].path;
//       if (req.files['profileImage']) profileImage = req.files['profileImage'][0].location || req.files['profileImage'][0].path;
//     }
//     if (!resume) return res.status(400).json({ message: 'Resume is required' });

//     // Password generation
//     const rawPassword = generatePassword();
//     const hashed = await bcrypt.hash(rawPassword, 10);

//     // Role assignment
//     let role = 'candidate';
//     if (email === 'Khaja.Rahiman@signavoxtechnologies.com') role = 'admin';

//     // Create user
//     const user = new User({
//       firstName: firstName.trim(),
//       middleName: middleName?.trim() || '',
//       lastName: lastName.trim(),
//       gender,
//       email: email.toLowerCase(),
//       phoneNumber,
//       pan,
//       skills,
//       education,
//       experienced,
//       experiences,
//       certifications, // ✅ new field added
//       resume,
//       profileImage,
//       DOB,
//       permanentAddress,
//       currentAddress,
//       socialLinks,
//       team,
//       password: hashed,
//       role
//     });

//     await user.save();

//     // Send email
//     const html = `
//       <p>Hi ${user.firstName},</p>
//       <p>Your account has been created for <strong>SignaVox Careers</strong>.</p>
//       <p><strong>Email:</strong> ${email}</p>
//       <p><strong>Password:</strong> ${rawPassword}</p>
//       <p>Please login and change your password after first login.</p>
//     `;
//     await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

//     const userResponse = await User.findById(user._id).select('-password -__v').lean();

//     res.status(201).json({
//       message: 'Registered successfully. Check your email for credentials.',
//       user: userResponse
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
    let {
      firstName, middleName, lastName, gender,
      email, phoneNumber, pan, skills = [],
      education = [], experienced = false,
      experiences = [], certifications = [],
      DOB, permanentAddress,
      currentAddress, socialLinks = {}, team = 'none'
    } = req.body;

    if (typeof experienced === 'string') experienced = experienced.toLowerCase() === 'true';
    if (typeof skills === 'string') {
      try { skills = JSON.parse(skills); } catch { skills = skills.split(',').map(s => s.trim()); }
    }
    if (typeof education === 'string') {
      try { education = JSON.parse(education); } catch { education = []; }
    }
    if (typeof experiences === 'string') {
      try { experiences = JSON.parse(experiences); } catch { experiences = []; }
    }
    if (typeof certifications === 'string') {
      try { certifications = JSON.parse(certifications); } catch { certifications = []; }
    }
    if (typeof socialLinks === 'string') {
      try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
    }

    if (!firstName || !lastName) return res.status(400).json({ message: 'First and last name are required' });
    if (!gender) return res.status(400).json({ message: 'Gender is required' });
    if (!['male', 'female', 'other'].includes(gender)) return res.status(400).json({ message: 'Invalid gender value' });

    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    if (phoneNumber && await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already registered' });
    if (pan && await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already registered' });
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) return res.status(400).json({ message: 'Invalid PAN format' });

    if (experienced && (!experiences || experiences.length === 0)) {
      return res.status(400).json({ message: 'Experience details required for experienced candidates' });
    }

    // File uploads
    let resume, profileImage;
    if (req.files) {
      if (req.files['resume']) resume = req.files['resume'][0].location || req.files['resume'][0].path;
      if (req.files['profileImage']) profileImage = req.files['profileImage'][0].location || req.files['profileImage'][0].path;
    }
    if (!resume) return res.status(400).json({ message: 'Resume is required' });

    // Password generation
    const rawPassword = generatePassword();
    const hashed = await bcrypt.hash(rawPassword, 10);

    // Role assignment
    let role = 'candidate';
    if (email === 'Khaja.Rahiman@signavoxtechnologies.com') role = 'admin';

    // Create user
    const user = new User({
      firstName: firstName.trim(),
      middleName: middleName?.trim() || '',
      lastName: lastName.trim(),
      gender,
      email: email.toLowerCase(),
      phoneNumber,
      pan,
      skills,
      education,
      experienced,
      experiences,
      certifications,
      resume,
      profileImage,
      DOB,
      permanentAddress,
      currentAddress,
      socialLinks,
      team,
      password: hashed,
      role
    });

    await user.save();

    // ✅ Wait for userCode to be set
    await user.reloadDocument?.();

    // Send email
    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Your account has been created for <strong>SignaVox Careers</strong>.</p>
      <p><strong>User ID:</strong> ${user.userCode}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>
      <p>Please login and change your password after first login.</p>
    `;
    await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

    const userResponse = await User.findById(user._id).select('-password -__v').lean();

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

// Login
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
      user: { ...userData, name: user.name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin creates recruiter/admin
// exports.createUserByAdmin = async (req, res) => {
//   try {
//     let {
//       firstName, middleName, lastName, gender,
//       email, phoneNumber, pan, skills, education,
//       experienced, experiences, role, team,
//       DOB, permanentAddress, currentAddress,
//       socialLinks = {}
//     } = req.body;

//     // Parse possible JSON fields
//     if (typeof skills === 'string') {
//       try { skills = JSON.parse(skills); } catch { skills = skills.split(',').map(s => s.trim()); }
//     }

//     if (typeof education === 'string') {
//       try { education = JSON.parse(education); } catch { return res.status(400).json({ message: 'Invalid education format' }); }
//     }

//     if (typeof experiences === 'string') {
//       try { experiences = JSON.parse(experiences); } catch { return res.status(400).json({ message: 'Invalid experiences format' }); }
//     }

//     if (typeof socialLinks === 'string') {
//       try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
//     }

//     gender = gender?.toLowerCase();
//     if (!['male', 'female', 'other'].includes(gender)) return res.status(400).json({ message: 'Invalid gender value' });

//     if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
//     if (await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already exists' });
//     if (await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already exists' });

//     if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) return res.status(400).json({ message: 'Invalid PAN format' });

//     // Handle file uploads
//     if (!req.files || !req.files['resume']) {
//       return res.status(400).json({ message: 'Resume is required' });
//     }

//     const resume = req.files['resume'][0].location || req.files['resume'][0].path;
//     let profileImage = req.files['profileImage'] ? (req.files['profileImage'][0].location || req.files['profileImage'][0].path) : null;

//     const rawPassword = generatePassword();
//     const hashedPassword = await bcrypt.hash(rawPassword, 10);

//     const user = new User({
//       firstName: firstName.trim(),
//       middleName: middleName?.trim() || '',
//       lastName: lastName.trim(),
//       gender,
//       email: email.toLowerCase(),
//       phoneNumber,
//       pan,
//       skills,
//       education,
//       experienced,
//       experiences,
//       resume,
//       profileImage,
//       DOB,
//       permanentAddress,
//       currentAddress,
//       socialLinks,
//       role,
//       team,
//       password: hashedPassword
//     });

//     await user.save();

//     const html = `
//       <p>Hi ${user.firstName},</p>
//       <p>Your account has been created for SignaVox Careers.</p>
//       <p><strong>Email:</strong> ${email}</p>
//       <p><strong>Password:</strong> ${rawPassword}</p>
//       <p>Please login and change your password after first login.</p>
//     `;
//     await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

//     const fullUser = await User.findById(user._id)
//       .select('-password -resetPasswordOtp -resetPasswordExpiry')
//       .lean();

//     res.status(201).json({
//       message: 'User created successfully and email sent',
//       user: fullUser
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

exports.createUserByAdmin = async (req, res) => {
  try {
    let {
      firstName, middleName, lastName, gender,
      email, phoneNumber, pan, skills, education,
      experienced, experiences, certifications = [],
      role, team, DOB, permanentAddress,
      currentAddress, socialLinks = {}
    } = req.body;

    // Parse possible JSON/string fields
    if (typeof skills === 'string') {
      try { skills = JSON.parse(skills); } catch { skills = skills.split(',').map(s => s.trim()); }
    }

    if (typeof education === 'string') {
      try { education = JSON.parse(education); } catch { return res.status(400).json({ message: 'Invalid education format' }); }
    }

    if (typeof experiences === 'string') {
      try { experiences = JSON.parse(experiences); } catch { return res.status(400).json({ message: 'Invalid experiences format' }); }
    }

    if (typeof certifications === 'string') {
      try { certifications = JSON.parse(certifications); } catch { certifications = []; }
    }

    if (typeof socialLinks === 'string') {
      try { socialLinks = JSON.parse(socialLinks); } catch { socialLinks = {}; }
    }

    gender = gender?.toLowerCase();
    if (!['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender value' });
    }

    // Uniqueness checks
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (await User.findOne({ phoneNumber })) return res.status(400).json({ message: 'Phone number already exists' });
    if (await User.findOne({ pan })) return res.status(400).json({ message: 'PAN already exists' });

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return res.status(400).json({ message: 'Invalid PAN format' });
    }

    // Handle file uploads
    if (!req.files || !req.files['resume']) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    const resume = req.files['resume'][0].location || req.files['resume'][0].path;
    let profileImage = req.files['profileImage']
      ? (req.files['profileImage'][0].location || req.files['profileImage'][0].path)
      : null;

    // Generate random password
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create new user document
    const user = new User({
      firstName: firstName.trim(),
      middleName: middleName?.trim() || '',
      lastName: lastName.trim(),
      gender,
      email: email.toLowerCase(),
      phoneNumber,
      pan,
      skills,
      education,
      experienced,
      experiences,
      certifications, // ✅ Added certifications field
      resume,
      profileImage,
      DOB,
      permanentAddress,
      currentAddress,
      socialLinks,
      role,
      team,
      password: hashedPassword
    });

    await user.save();

    // Send credentials email
    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Your account has been created for <strong>SignaVox Careers</strong>.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${rawPassword}</p>
      <p>Please login and change your password after first login.</p>
    `;
    await sendMail({ to: email, subject: 'SignaVox Careers - Account Created', html });

    const fullUser = await User.findById(user._id)
      .select('-password -resetPasswordOtp -resetPasswordExpiry')
      .lean();

    res.status(201).json({
      message: 'User created successfully and email sent',
      user: fullUser
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



// Send OTP
// exports.sendOTP = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'Email not registered' });

//     const { otp, expiry } = generateOTP();
//     user.resetPasswordOtp = otp;
//     user.resetPasswordExpiry = expiry;
//     await user.save();

//     const html = `
//       <p>Hi ${user.firstName},</p>
//       <p>Your OTP for SignaVox Careers is:</p>
//       <h2>${otp}</h2>
//       <p>This OTP will expire in 10 minutes.</p>
//     `;
//     await sendMail({ to: email, subject: 'SignaVox Careers - OTP', html });

//     res.status(200).json({ message: 'OTP sent to your email' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('OTP Request received for:', email);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    console.log('User found:', user.email);

    const { otp, expiry } = generateOTP();
    console.log('Generated OTP:', otp, 'Expiry:', expiry);

    user.resetPasswordOtp = otp;
    user.resetPasswordExpiry = expiry;
    await user.save();

    const html = `
      <p>Hi ${user.firstName},</p>
      <p>Your OTP for SignaVox Careers is:</p>
      <h2>${otp}</h2>
      <p>This OTP will expire in 10 minutes.</p>
    `;
    console.log('Sending mail to:', email);

    await sendMail({ to: email, subject: 'SignaVox Careers - OTP', html });

    console.log('Mail sent successfully');
    res.status(200).json({ message: 'OTP sent to your email' });

  } catch (err) {
    console.error('Error in sendOTP:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    if (
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== otp ||
      Date.now() > user.resetPasswordExpiry
    ) {
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


// Validate Token (Check token validity & return user info)
exports.validateToken = async (req, res) => {
  try {
    // req.user is already attached by auth middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};