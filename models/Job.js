const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Internship', 'Contract', 'Remote'],
      default: 'Full-Time'
    },
    experience: { type: String },

    // ✅ Use Date type for proper sorting & querying
    postedDate: { type: Date, default: Date.now },
    closingDate: { type: Date },

    applicants: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed', 'paused'], default: 'open' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    jobDescription: {
      category: { type: String },
      positionLevel: {
        type: String,
        enum: ['Intern', 'Fresher', 'Junior', 'Mid-Level', 'Senior', 'Manager']
      },
      ctc: {
        min: { type: String },
        max: { type: String }
      },
      shift: {
        type: String,
        enum: ['Day Shift', 'Night Shift', 'Rotational Shift', 'Flexible', 'Hybrid', 'Remote'],
        default: 'Day Shift'
      },
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
          // ✅ Date type retained here as well
          uploadedAt: { type: Date, default: Date.now }
        }
      ],

      summary: {
        overview: { type: String },
        responsibilities: [{ type: String }],
        qualifications: [{ type: String }]
      }
    },

    // ✅ Hiring workflow with enumerated stages
    hiringWorkflow: {
      stages: [
        {
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
              'hired',
              'rejected'
            ]
          },
          description: { type: String }
        }
      ]
    },

    eligibilityCriteria: {
      required: [{ type: String }],
      preferred: [{ type: String }],
      skills: [{ type: String }]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
