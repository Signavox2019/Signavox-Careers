const mongoose = require('mongoose');

const EducationSchema = new mongoose.Schema({
  level: { type: String }, // e.g., "10th", "12th", "Graduation", "PostGraduation"
  institution: String,
  boardOrUniversity: String,
  passedYear: Number,
  percentageOrCGPA: String
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  companyName: String,
  designation: String,
  startDate: Date,
  endDate: Date,
  responsibilities: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ['candidate','admin','recruiter'], default: 'candidate' },
  team: { type: String, enum: ['technical','marketing','finance','none'], default: 'none' }, // recruiter/admin team
  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: String,
  pan: String,
  resume: String, // filename or URL
  skills: [String],
  education: [EducationSchema],
  experienced: { type: Boolean, default: false },
  experiences: [ExperienceSchema],
  password: { type: String, required: true }, // hashed
  resetPasswordOtp: String,       // OTP for password reset
  resetPasswordExpiry: Date,      // OTP expiration timestamp
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
