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
  branchOrSpecialization: String,
  institution: { type: String, required: true },
  boardOrUniversity: { type: String, required: true },
  passedYear: { type: Number, required: true },
  percentageOrCGPA: String
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  designation: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  responsibilities: { type: String }
}, { _id: false });

const SocialLinksSchema = new mongoose.Schema({
  linkedin: String,
  github: String
}, { _id: false });

// ✅ New Certification Schema (all optional)
const CertificationSchema = new mongoose.Schema({
  certificationName: String,
  issuedBy: String,
  certificateUrl: String,
  description: String,
  issuedDate: { type: Date, required: true }, 
  expiryDate: Date
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

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  pan: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
  },

  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  DOB: Date,
  permanentAddress: String,
  currentAddress: String,
  socialLinks: SocialLinksSchema,
  profileImage: String,
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

  // ✅ Added certifications field (optional)
  certifications: [CertificationSchema],

  // New field to store gap analysis
  careerGapFlags: [String],

  password: { type: String, required: true },
  resetPasswordOtp: String,
  resetPasswordExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

// =====================
// Compute full name
// =====================
UserSchema.pre('save', function (next) {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  this.name = parts.join(' ');

  // Automatically compute career gap flags before saving
  if (this.education && this.education.length > 0) {
    const sortedEdu = [...this.education].sort((a, b) => a.passedYear - b.passedYear);
    const flags = [];

    for (let i = 0; i < sortedEdu.length - 1; i++) {
      const current = sortedEdu[i];
      const nextEdu = sortedEdu[i + 1];
      const gap = nextEdu.passedYear - current.passedYear;

      const expectedDurations = {
        '10th-12th': 2,
        '12th-Degree': 3,
        '12th-BTech': 4,
        'Diploma-BTech': 4,
        'Degree-MTech': 2,
        'Degree-MSC': 2
      };

      const key = `${current.programOrDegree}-${nextEdu.programOrDegree}`;
      const expected = expectedDurations[key] || null;

      if (expected && gap > expected) {
        const extra = gap - expected;
        flags.push(
          `⚠️ There is a ${extra}-year career gap between ${current.programOrDegree} (${current.passedYear}) and ${nextEdu.programOrDegree} (${nextEdu.passedYear}).`
        );
      }
    }

    this.careerGapFlags = flags;
  }

  next();
});

// Update hook (if education is modified)
UserSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.firstName || update.middleName || update.lastName) {
    const parts = [update.firstName, update.middleName, update.lastName].filter(Boolean);
    update.name = parts.join(' ');
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
