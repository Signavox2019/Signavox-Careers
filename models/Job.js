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
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who posted
  postedAt: { type: Date, default: Date.now },
  closingDate: Date,
  team: { type: String, enum: ['technical','marketing','finance','general'], default: 'general' }, // team owning job
  status: { type: String, enum: ['open','closed'], default: 'open' },
  isFeatured: { type: Boolean, default: false },
  additional: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Job', JobSchema);
