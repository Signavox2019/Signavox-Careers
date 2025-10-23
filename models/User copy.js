const mongoose = require('mongoose');

// =====================
// Sub-schemas
// =====================
const EducationSchema = new mongoose.Schema({
  level: { type: String },
  institution: String,
  boardOrUniversity: String,
  passedYear: Number,
  percentageOrCGPA: String
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  designation: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  responsibilities: { type: String }
}, { _id: false });

// =====================
// Main User Schema
// =====================
const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ['candidate', 'admin', 'recruiter'], default: 'candidate' },
  team: { type: String, enum: ['technical', 'marketing', 'finance', 'none'], default: 'none' },

  firstName: { type: String, required: true },
  middleName: String,
  lastName: { type: String, required: true },

  // ✅ Full name (auto-generated before save/update)
  name: { type: String },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  pan: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
  },

  resume: String,
  skills: [String],
  education: [EducationSchema],

  experienced: { type: Boolean, default: false },
  experiences: {
    type: [ExperienceSchema],
    validate: {
      validator: function (value) {
        return !this.experienced || (Array.isArray(value) && value.length > 0);
      },
      message: 'Experience details are required when experienced is true.'
    }
  },

  password: { type: String, required: true },
  resetPasswordOtp: String,
  resetPasswordExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

// ✅ Automatically compute name before saving
UserSchema.pre('save', function (next) {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  this.name = parts.join(' ');
  next();
});

// ✅ Also compute name when updating
UserSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.firstName || update.middleName || update.lastName) {
    const first = update.firstName || this._update.firstName;
    const middle = update.middleName || this._update.middleName;
    const last = update.lastName || this._update.lastName;
    const parts = [first, middle, last].filter(Boolean);
    update.name = parts.join(' ');
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
