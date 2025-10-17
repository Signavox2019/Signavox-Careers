const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendMail } = require('../utils/email'); // ✅ import email utility


// Apply to a Job
// exports.applyToJob = async (req, res) => {
//   try {
//     const candidate = req.user;
//     const { jobId, coverLetter } = req.body;

//     const job = await Job.findById(jobId);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     // Prevent duplicate applications
//     const existingApplication = await Application.findOne({
//       candidate: candidate._id,
//       job: job._id
//     });
//     if (existingApplication) {
//       return res.status(400).json({ message: 'You have already applied for this job' });
//     }

//     // S3 resume URL
//     const resumeSnapshot = req.file ? req.file.location : candidate.resume;

//     const application = new Application({
//       candidate: candidate._id,
//       job: job._id,
//       resumeSnapshot,
//       coverLetter
//     });

//     await application.save();

//     const populatedApp = await Application.findById(application._id)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title team');

//     // ✅ Send confirmation email
//     try {
//       const fullName = `${candidate.firstName} ${candidate.lastName}`;
//       const subject = `Application Confirmation - ${job.title}`;
//       const html = `
//         <div style="font-family: Arial, sans-serif; line-height: 1.5;">
//           <h2 style="color: #0073e6;">Application Received</h2>
//           <p>Dear <strong>${fullName}</strong>,</p>
//           <p>Thank you for applying for the position of <strong>${job.title}</strong> in our <strong>${job.team}</strong> team.</p>
//           <p>Your application has been successfully submitted and is currently under review.</p>
//           <p>We will reach out to you if your profile matches our requirements.</p>
//           <br />
//           <p>Best regards,<br /><strong>Signavox Careers Team</strong></p>
//         </div>
//       `;

//       await sendMail({
//         to: candidate.email,
//         subject,
//         html,
//         text: `Dear ${fullName}, your application for the ${job.title} role has been received.`
//       });

//       console.log(`✅ Application email sent to ${candidate.email}`);
//     } catch (emailError) {
//       console.error('Error sending application email:', emailError.message);
//     }

//     res.status(201).json({
//       message: 'Applied successfully',
//       application: populatedApp
//     });
//   } catch (err) {
//     console.error('Error in applyToJob:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.applyToJob = async (req, res) => {
  try {
    const candidate = req.user;
    const { jobId, coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // ✅ Check if the job is closed
    if (job.status === 'closed') {
      return res.status(400).json({ message: 'You cannot apply to this job as it is closed' });
    }

    // Prevent duplicate applications
    const existingApplication = await Application.findOne({
      candidate: candidate._id,
      job: job._id
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // S3 resume URL
    const resumeSnapshot = req.file ? req.file.location : candidate.resume;

    const application = new Application({
      candidate: candidate._id,
      job: job._id,
      resumeSnapshot,
      coverLetter
    });

    await application.save();

    const populatedApp = await Application.findById(application._id)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title team');

    // ✅ Send confirmation email
    try {
      const fullName = `${candidate.firstName} ${candidate.lastName}`;
      const subject = `Application Confirmation - ${job.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #0073e6;">Application Received</h2>
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Thank you for applying for the position of <strong>${job.title}</strong> in our <strong>${job.team}</strong> team.</p>
          <p>Your application has been successfully submitted and is currently under review.</p>
          <p>We will reach out to you if your profile matches our requirements.</p>
          <br />
          <p>Best regards,<br /><strong>Signavox Careers Team</strong></p>
        </div>
      `;

      await sendMail({
        to: candidate.email,
        subject,
        html,
        text: `Dear ${fullName}, your application for the ${job.title} role has been received.`
      });

      console.log(`✅ Application email sent to ${candidate.email}`);
    } catch (emailError) {
      console.error('Error sending application email:', emailError.message);
    }

    res.status(201).json({
      message: 'Applied successfully',
      application: populatedApp
    });
  } catch (err) {
    console.error('Error in applyToJob:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



// Get Applications (All / Role-based)

exports.getApplications = async (req, res) => {
  try {
    const { user } = req;
    let query = {};

    if (user.role === 'recruiter') {
      query.assignedTo = user._id;
    } else if (user.role === 'candidate') {
      query.candidate = user._id;
    }

    const apps = await Application.find(query)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title team')
      .populate('assignedTo', 'firstName lastName email team');

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// ✅ Get My Applications (Candidate only)

exports.getMyApplications = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'candidate') {
      return res.status(403).json({ message: 'Only candidates can view their applications' });
    }

    const myApps = await Application.find({ candidate: user._id })
      .populate('job', 'title team')
      .populate('assignedTo', 'firstName lastName email team')
      .sort({ appliedAt: -1 }); // latest first

    if (!myApps.length) {
      return res.status(404).json({ message: 'No applications found for this user' });
    }

    res.json({
      message: 'Fetched my applications successfully',
      applications: myApps
    });
  } catch (err) {
    console.error('Error in getMyApplications:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Assign Application to Recruiter

exports.assignToRecruiter = async (req, res) => {
  try {
    const { applicationId, recruiterId } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const recruiter = await User.findById(recruiterId);
    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(400).json({ message: 'Invalid recruiter' });
    }

    application.assignedTo = recruiter._id;
    await application.save();

    const updatedApp = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title team')
      .populate('assignedTo', 'firstName lastName email team phoneNumber');

    res.json({
      message: 'Assigned to recruiter successfully',
      application: updatedApp
    });
  } catch (err) {
    console.error('Error in assignToRecruiter:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update Application Status
// exports.updateApplicationStatus = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { status, notes } = req.body;

//     const app = await Application.findById(applicationId);
//     if (!app) return res.status(404).json({ message: 'Application not found' });

//     if (status) app.status = status;
//     if (notes) app.notes = notes;

//     await app.save();

//     const updatedApp = await Application.findById(applicationId)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title team')
//       .populate('assignedTo', 'firstName lastName email team');

//     res.json({
//       message: 'Application status updated successfully',
//       application: updatedApp
//     });
//   } catch (err) {
//     console.error('Error in updateApplicationStatus:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };



// ================================
// Update Application Stage
// ================================
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { stage, statusNotes } = req.body;

    const app = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title team');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (stage) app.stage = stage;
    if (statusNotes) app.statusNotes = statusNotes;

    await app.save();

    // ✅ Send stage update email
    try {
      const candidate = app.candidate;
      const job = app.job;
      const stageMap = {
        applied: 'Application Received',
        resume_shortlisted: 'Resume Shortlisted',
        screening_test: 'Screening Test',
        technical_interview: 'Technical Interview Round',
        hr_interview: 'HR Interview Round',
        offered: 'Job Offer',
        rejected: 'Application Rejected',
        hired: 'Congratulations! You are Hired 🎉'
      };

      const subject = `Update on your application for ${job.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #0073e6;">${stageMap[stage] || 'Application Update'}</h2>
          <p>Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
          <p>Your application for the position of <strong>${job.title}</strong> has moved to the stage: <strong>${stageMap[stage]}</strong>.</p>
          ${statusNotes ? `<p>Note: ${statusNotes}</p>` : ''}
          <p>We’ll keep you updated with further progress.</p>
          <br/>
          <p>Best regards,<br/><strong>Signavox Careers Team</strong></p>
        </div>
      `;

      await sendMail({ to: candidate.email, subject, html });
      console.log(`✅ Status email sent to ${candidate.email}`);
    } catch (emailError) {
      console.error('Error sending status email:', emailError.message);
    }

    res.json({
      message: 'Application stage updated successfully',
      application: app
    });
  } catch (err) {
    console.error('Error in updateApplicationStatus:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete Application
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    await Application.findByIdAndDelete(applicationId);

    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Error in deleteApplication:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Application Statistics (Admin/Recruiter)
// exports.getApplicationStatistics = async (req, res) => {
//   try {
//     const user = req.user;
//     let filter = {};

//     // Recruiter sees only assigned applications
//     if (user.role === 'recruiter') {
//       filter.assignedTo = user._id;
//     }

//     // Admin sees all applications
//     const totalApplications = await Application.countDocuments(filter);
//     const statusStats = await Application.aggregate([
//       { $match: filter },
//       { $group: { _id: '$status', count: { $sum: 1 } } },
//     ]);

//     const formattedStats = statusStats.reduce((acc, cur) => {
//       acc[cur._id] = cur.count;
//       return acc;
//     }, {});

//     res.json({
//       totalApplications,
//       statusBreakdown: formattedStats,
//     });
//   } catch (err) {
//     console.error('Error in getApplicationStatistics:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

// Application Statistics (Admin/Recruiter)
exports.getApplicationStatistics = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    // Recruiter sees only assigned applications
    if (user.role === 'recruiter') {
      filter.assignedTo = user._id;
    }

    // Admin sees all applications

    // Total applications
    const totalApplications = await Application.countDocuments(filter);

    // Stage breakdown
    const stageStats = await Application.aggregate([
      { $match: filter },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    // Convert array to object
    const formattedStats = stageStats.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({
      totalApplications,
      stageBreakdown: formattedStats, // renamed to stageBreakdown
    });
  } catch (err) {
    console.error('Error in getApplicationStatistics:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

