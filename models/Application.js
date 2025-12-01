const mongoose = require('mongoose');

const StageStatusSchema = new mongoose.Schema({
  stageName: {
    type: String,
    enum: [
      'applied',
      'resume_shortlisted',
      'screening_test',
      'group_discussion',
      'technical_interview',
      'manager_interview',
      'hr_interview',
      'offered',
      'hired',
      'rejected'
    ],
    required: true,
    default: 'applied'
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
  // resumeSnapshot: String,
  // coverLetter: String,
  appliedAt: { type: Date, default: Date.now },

  stage: {
    type: String,
    enum: [
      'applied',
      'resume_shortlisted',
      'screening_test',
      'group_discussion',
      'technical_interview',
      'manager_interview',
      'hr_interview',
      'offered',
      'rejected',
      'hired'
    ],
    default: 'applied'
  },

  // ✅ Dynamically generated based on Job’s hiringWorkflow
  stageWiseStatus: { type: [StageStatusSchema], default: [] },

  offerLetterUrl: { type: String, default: null },
  offerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', null],
    default: null
  },
  offerGeneratedAt: { type: Date, default: null },

  withdrawn: { type: Boolean, default: false },
  withdrawnAt: { type: Date, default: null },

  statusNotes: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, default: 'portal' }
});

module.exports = mongoose.model('Application', ApplicationSchema);
