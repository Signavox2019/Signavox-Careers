const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeSnapshot: String, // copy of resume filename/url at time of apply (optional)
  coverLetter: String,
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['applied','screening','interview','offered','rejected','hired'], default: 'applied' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // recruiter
  assignedTeam: { type: String, enum: ['technical','marketing','finance','general'], default: 'general' },
  notes: String,
  source: { type: String, default: 'portal' } // e.g., portal, referral
});

module.exports = mongoose.model('Application', ApplicationSchema);
