const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  workType: { type: String, enum: ['Remote','Onsite','Hybrid'], default: 'Onsite' },
  experience: { type: String }, // e.g., "0-2 years" or "3+"
  package: String,
  location: String,
  numberOfOpenings: { type: Number, default: 1 },
  skills: [String],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date, default: Date.now },
  closingDate: Date,
  team: { type: String, enum: ['technical','marketing','finance','general'], default: 'general' },
  status: { type: String, enum: ['open','closed'], default: 'open' },
  isFeatured: { type: Boolean, default: false },
  additional: mongoose.Schema.Types.Mixed
});

// ✅ Pre-save hook to auto-close job if closingDate is past
JobSchema.pre('save', function(next) {
  if (this.closingDate && new Date() > this.closingDate) {
    this.status = 'closed';
  }
  next();
});

module.exports = mongoose.model('Job', JobSchema);
