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

  // Additional details
  statusNotes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, default: 'portal' },
  offerLetterUrl: String // Optional offer letter link
});

module.exports = mongoose.model('Application', ApplicationSchema);
