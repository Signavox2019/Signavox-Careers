const mongoose = require('mongoose');

// =====================
// Sub-schemas
// =====================
const EducationSchema = new mongoose.Schema({
  programOrDegree: { 
    type: String, 
    enum: ['10th', '12th', 'Diploma', 'Degree', 'BTech', 'MTech', 'MSC', 'Other'], 
    required: true 
  },
  institution: { type: String, required: true },
  boardOrUniversity: { type: String },
  branchOrSpecialization: { type: String },
  passedYear: { type: Number, required: true },
  percentageOrCGPA: { type: String }
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
  name: { type: String },

  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date },
  permanentAddress: { type: String },
  currentAddress: { type: String },

  socialLinks: {
    linkedin: { type: String },
    github: { type: String }
  },

  profileImage: { type: String },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  
  // ✅ Added phone number validation (India format)
  phoneNumber: { 
    type: String, 
    unique: true, 
    sparse: true,
    match: [/^[6-9]\d{9}$/, 'Invalid phone number format. Must be a valid 10-digit Indian number.']
  },
  
  pan: { type: String },

  // ✅ Resume is now required
  resume: { type: String, required: true },

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

  // ✅ Career gap details
  careerGap: {
    hasGap: { type: Boolean, default: false },
    totalGapYears: { type: Number, default: 0 },
    details: { type: String }
  },

  // ✅ Only career gap flags
  flags: [{
    type: String // e.g. "Career gap detected: 2 year(s)"
  }],

  password: { type: String, required: true },
  resetPasswordOtp: String,
  resetPasswordExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

// =====================
// Utility: Calculate Career Gap and Flags
// =====================
function calculateCareerGap(user) {
  let totalGap = 0;
  let gapDetails = [];
  let flags = [];

  if (user.education && user.education.length > 1) {
    // Sort by year
    const sortedEdu = [...user.education].sort((a, b) => a.passedYear - b.passedYear);

    for (let i = 1; i < sortedEdu.length; i++) {
      const current = sortedEdu[i];
      const prev = sortedEdu[i - 1];

      const expectedGap = 1; // Normal transition
      const actualGap = current.passedYear - prev.passedYear - expectedGap;

      if (actualGap > 0) {
        totalGap += actualGap;
        const detail = `Gap of ${actualGap} year(s) between ${prev.programOrDegree} (${prev.passedYear}) and ${current.programOrDegree} (${current.passedYear})`;
        gapDetails.push(detail);
      }
    }
  }

  if (totalGap > 0) {
    flags.push(`Career gap detected: ${totalGap} year(s)`);
  }

  user.careerGap = {
    hasGap: totalGap > 0,
    totalGapYears: totalGap,
    details: gapDetails.join(', ') || 'No gap'
  };

  user.flags = flags;
}

// =====================
// Hooks
// =====================
UserSchema.pre('save', function (next) {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  this.name = parts.join(' ');
  calculateCareerGap(this);
  next();
});

UserSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.firstName || update.middleName || update.lastName) {
    const first = update.firstName || this._update.firstName;
    const middle = update.middleName || this._update.middleName;
    const last = update.lastName || this._update.lastName;
    const parts = [first, middle, last].filter(Boolean);
    update.name = parts.join(' ');
  }

  if (update.education) {
    calculateCareerGap(update);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
