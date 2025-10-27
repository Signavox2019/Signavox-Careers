const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeSnapshot: String,
  coverLetter: String,
  appliedAt: { type: Date, default: Date.now },

  // ✅ Full Recruitment Pipeline
  stage: {
    type: String,
    enum: [
      'applied',
      'resume_shortlisted',
      'screening_test',
      'technical_interview',
      'hr_interview',
      'offered',
      'rejected',
      'hired'
    ],
    default: 'applied'
  },

  // ✅ Offer letter details
  offerLetterUrl: { type: String, default: null },
  offerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', null],
    default: null
  },
  offerGeneratedAt: { type: Date, default: null },

  // Additional details
  statusNotes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, default: 'portal' },
});

module.exports = mongoose.model('Application', ApplicationSchema);
