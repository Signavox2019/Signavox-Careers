const mongoose = require('mongoose');

const StageStatusSchema = new mongoose.Schema({
  stageName: {
    type: String,
    enum: [
      'applied',
      'resume_shortlisted',
      'screening_test',
      'technical_interview',
      'hr_interview',
      'offered',
      'hired',
      'rejected'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  action: {
    type: String,
    enum: ['accept', 'reject', null],
    default: null
  },
  updatedAt: { type: Date, default: null }
});

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

  // ✅ Stage-wise tracking
  stageWiseStatus: {
    type: [StageStatusSchema],
    default: [
      { stageName: 'applied', status: 'completed', action: 'accept' },
      { stageName: 'resume_shortlisted', status: 'pending', action: null },
      { stageName: 'screening_test', status: 'pending', action: null },
      { stageName: 'technical_interview', status: 'pending', action: null },
      { stageName: 'hr_interview', status: 'pending', action: null },
      { stageName: 'offered', status: 'pending', action: null },
      { stageName: 'hired', status: 'pending', action: null }
    ]
  },

  // ✅ Offer letter details
  offerLetterUrl: { type: String, default: null },
  offerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', null],
    default: null
  },
  offerGeneratedAt: { type: Date, default: null },

  // ✅ Withdraw feature (only within 24 hours)
  withdrawn: {
    type: Boolean,
    default: false
  },
  withdrawnAt: {
    type: Date,
    default: null
  },

  // Additional details
  statusNotes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, default: 'portal' }
});

module.exports = mongoose.model('Application', ApplicationSchema);
