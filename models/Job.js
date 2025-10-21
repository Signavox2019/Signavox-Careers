const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Full-Time', 'Part-Time', 'Internship', 'Contract', 'Remote'], 
    default: 'Full-Time' 
  },
  experience: { type: String },
  salary: { type: String },
  postedDate: { type: String, default: () => new Date().toISOString() },
  closingDate: { type: String },
  applicants: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed', 'paused'], default: 'open' },

  // Reference to admin who created the job
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  jobDescription: {
    category: { type: String },
    positionLevel: { type: String },
    ctc: { type: String },
    shift: { type: String },
    openings: { type: Number, default: 1 },
    aboutRole: { type: String },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    benefits: [{ type: String }],
    additionalInfo: { type: String },
    document: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    summary: {
      overview: { type: String },
      responsibilities: [{ type: String }],
      qualifications: [{ type: String }]
    }
  },

  hiringWorkflow: {
    stages: [
      {
        stage: { type: String },
        description: { type: String },
        duration: { type: String },
        icon: { type: String }
      }
    ],
    timeline: { type: String }
  },

  eligibilityCriteria: {
    required: [{ type: String }],
    preferred: [{ type: String }],
    skills: [{ type: String }]
  }

}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
