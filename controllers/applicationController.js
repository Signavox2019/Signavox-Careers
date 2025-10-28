const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendMail } = require('../utils/email'); // Email utility
const { generateOfferLetterPDF } = require('../utils/generateOfferLetter');

// Apply to a Job
// exports.applyToJob = async (req, res) => {
//   try {
//     const candidate = req.user;
//     const { jobId, coverLetter } = req.body;

//     // 🔍 Check if the job exists
//     const job = await Job.findById(jobId);
//     if (!job) {
//       return res.status(404).json({ message: 'Job not found' });
//     }

//     // 🔍 Check if the user has already applied to this job
//     const existingApplication = await Application.findOne({
//       candidate: candidate._id,
//       job: jobId
//     });

//     if (existingApplication) {
//       return res.status(400).json({
//         message: 'You have already applied for this job.'
//       });
//     }

//     // 📝 Create a new application
//     const application = new Application({
//       candidate: candidate._id,
//       job: jobId,
//       coverLetter
//     });

//     await application.save();

//     // ✅ Increment applicant count for the job
//     await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

//     // ✅ Populate candidate & job details for email
//     const populatedApp = await Application.findById(application._id)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title location type');

//     // ================================
//     // ✉️ Send confirmation email
//     // ================================
//     const fullName = `${candidate.firstName} ${candidate.lastName}`;
//     const subject = `Application Confirmation - ${populatedApp.job.title}`;

//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.5;">
//         <h2 style="color: #0073e6;">Application Received</h2>
//         <p>Dear <strong>${fullName}</strong>,</p>
//         <p>Thank you for applying for the position of <strong>${populatedApp.job.title}</strong> at <strong>Signavox</strong>.</p>
//         <p>Your application has been successfully submitted and is currently under review.</p>
//         <p>We will reach out to you if your profile matches our requirements.</p>
//         <br />
//         <p>Best regards,<br /><strong>Signavox Careers Team</strong></p>
//       </div>
//     `;

//     await sendMail({
//       to: candidate.email,
//       subject,
//       html
//     });

//     // ✅ Send success response
//     res.status(201).json({
//       message: 'Application submitted successfully',
//       application: populatedApp
//     });

//   } catch (error) {
//     console.error('Error in applyToJob:', error);
//     res.status(500).json({
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

exports.applyToJob = async (req, res) => {
  try {
    const candidate = req.user;
    const { jobId, coverLetter } = req.body;

    // 🔍 Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 🔍 Check if the user has already applied to this job
    const existingApplication = await Application.findOne({
      candidate: candidate._id,
      job: jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied for this job.'
      });
    }

    // 📝 Create a new application
    const application = new Application({
      candidate: candidate._id,
      job: jobId,
      coverLetter
    });

    // ✅ Set updatedAt for the "applied" stage
    application.stageWiseStatus = application.stageWiseStatus.map(stage => {
      if (stage.stageName === 'applied') {
        return {
          ...stage.toObject?.() || stage,
          updatedAt: new Date()
        };
      }
      return stage;
    });

    await application.save();

    // ✅ Increment applicant count for the job
    await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

    // ✅ Populate candidate & job details for email
    const populatedApp = await Application.findById(application._id)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title location type');

    // ================================
    // ✉️ Send confirmation email
    // ================================
    const fullName = `${candidate.firstName} ${candidate.lastName}`;
    const subject = `Application Confirmation - ${populatedApp.job.title}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="color: #0073e6;">Application Received</h2>
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>Thank you for applying for the position of <strong>${populatedApp.job.title}</strong> at <strong>Signavox</strong>.</p>
        <p>Your application has been successfully submitted and is currently under review.</p>
        <p>We will reach out to you if your profile matches our requirements.</p>
        <br />
        <p>Best regards,<br /><strong>Signavox Careers Team</strong></p>
      </div>
    `;

    await sendMail({
      to: candidate.email,
      subject,
      html
    });

    // ✅ Send success response
    res.status(201).json({
      message: 'Application submitted successfully',
      application: populatedApp
    });

  } catch (error) {
    console.error('Error in applyToJob:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// exports.applyToJob = async (req, res) => {
//   try {
//     const candidate = req.user;
//     const { jobId, coverLetter } = req.body;

//     const job = await Job.findById(jobId);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     if (job.status === 'closed') {
//       return res.status(400).json({ message: 'You cannot apply to this job as it is closed' });
//     }

//     const existingApplication = await Application.findOne({
//       candidate: candidate._id,
//       job: job._id
//     });
//     if (existingApplication) {
//       return res.status(400).json({ message: 'You have already applied for this job' });
//     }

//     const resumeSnapshot = req.file ? req.file.location : candidate.resume;

//     const application = new Application({
//       candidate: candidate._id,
//       job: job._id,
//       resumeSnapshot,
//       coverLetter
//     });

//     await application.save();

//     // Increment applicant count
//     job.applicants = (job.applicants || 0) + 1;
//     await job.save();

//     // Populate job and candidate for response
//     const populatedApp = await Application.findById(application._id)
//       .populate({
//         path: 'candidate',
//         select: 'name email education experience skills', // basic candidate info
//       })
//       .populate({
//         path: 'job',
//         select: 'title type location team', // basic job info
//       });

//     res.status(201).json({
//       message: 'Applied successfully',
//       application: {
//         _id: populatedApp._id,
//         candidate: populatedApp.candidate,
//         job: populatedApp.job,
//         stage: populatedApp.stage,
//         appliedAt: populatedApp.appliedAt,
//         resumeSnapshot: populatedApp.resumeSnapshot,
//         coverLetter: populatedApp.coverLetter,
//       }
//     });

//   } catch (err) {
//     console.error('Error in applyToJob:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };


// ================================
// Get Applications (All / Role-based)
// ================================
exports.getApplications = async (req, res) => {
  try {
    const { user } = req;
    let query = {};

    if (user.role === 'recruiter') query.assignedTo = user._id;
    else if (user.role === 'candidate') query.candidate = user._id;

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

// ================================
// Get My Applications (Candidate only)
// ================================
exports.getMyApplications = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'candidate') {
      return res.status(403).json({ message: 'Only candidates can view their applications' });
    }

    const myApps = await Application.find({ candidate: user._id })
      .populate('job', 'title team')
      .populate('assignedTo', 'firstName lastName email team')
      .sort({ appliedAt: -1 });

    if (!myApps.length) return res.status(404).json({ message: 'No applications found for this user' });

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
    if (!recruiter || recruiter.role !== 'recruiter') return res.status(400).json({ message: 'Invalid recruiter' });

    application.assignedTo = recruiter._id;
    await application.save();

    const updatedApp = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title team')
      .populate('assignedTo', 'firstName lastName email team phoneNumber');

    res.json({ message: 'Assigned to recruiter successfully', application: updatedApp });

  } catch (err) {
    console.error('Error in assignToRecruiter:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};




// Update Application Stage / Status (Manual Only)
// exports.updateApplicationStatus = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { stage, statusNotes } = req.body;

//     const app = await Application.findById(applicationId)
//       .populate('candidate', 'firstName lastName email')
//       .populate('job', 'title team');

//     if (!app) return res.status(404).json({ message: 'Application not found' });

//     if (stage) app.stage = stage;
//     if (statusNotes) app.statusNotes = statusNotes;
//     await app.save();

//     // ✅ Send stage update email
//     try {
//       const candidate = app.candidate;
//       const job = app.job;
//       const stageMap = {
//         applied: 'Application Received',
//         resume_shortlisted: 'Resume Shortlisted',
//         screening_test: 'Screening Test',
//         technical_interview: 'Technical Interview Round',
//         hr_interview: 'HR Interview Round',
//         offered: 'Job Offer',
//         rejected: 'Application Rejected',
//         hired: 'Congratulations! You are Hired 🎉'
//       };

//       const subject = `Update on your application for ${job.title}`;
//       const html = `
//         <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//           <h2 style="color: #0073e6;">${stageMap[stage] || 'Application Update'}</h2>
//           <p>Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
//           <p>Your application for the position of <strong>${job.title}</strong> is now at stage: <strong>${stageMap[stage]}</strong>.</p>
//           ${statusNotes ? `<p>Note: ${statusNotes}</p>` : ''}
//           <p>We’ll keep you updated with further progress.</p>
//           <br/>
//           <p>Best regards,<br/><strong>Signavox Careers Team</strong></p>
//         </div>
//       `;
//       await sendMail({ to: candidate.email, subject, html });
//     } catch (emailError) {
//       console.error('Error sending status email:', emailError.message);
//     }

//     // ✅ Don’t return offerLetterUrl or extra details
//     res.json({
//       message: 'Application stage updated successfully (no offer letter generated)',
//       application: {
//         _id: app._id,
//         stage: app.stage,
//         statusNotes: app.statusNotes,
//         candidate: {
//           firstName: app.candidate.firstName,
//           lastName: app.candidate.lastName,
//           email: app.candidate.email
//         },
//         job: {
//           title: app.job.title,
//           team: app.job.team
//         }
//       }
//     });

//   } catch (err) {
//     console.error('Error in updateApplicationStatus:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { stageName, action, notes } = req.body; // { "stageName": "hr_interview", "action": "reject" }

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Find the index of the stage
    const currentIndex = app.stageWiseStatus.findIndex(s => s.stageName === stageName);
    if (currentIndex === -1) return res.status(400).json({ message: 'Invalid stage name' });

    // Check previous stage must be completed & accepted
    if (currentIndex > 0) {
      const prev = app.stageWiseStatus[currentIndex - 1];
      if (!(prev.status === 'completed' && prev.action === 'accept')) {
        return res.status(400).json({
          message: `Cannot review ${stageName} until ${prev.stageName} is completed and accepted.`
        });
      }
    }

    // Update the current stage
    app.stageWiseStatus[currentIndex].action = action;
    app.stageWiseStatus[currentIndex].status = 'completed';
    app.stageWiseStatus[currentIndex].updatedAt = new Date();

    // If rejected — stop further stages
    if (action === 'reject') {
      app.stage = 'rejected';
      app.statusNotes = notes || `Rejected at stage ${stageName}`;
      for (let i = currentIndex + 1; i < app.stageWiseStatus.length; i++) {
        app.stageWiseStatus[i].status = 'pending';
        app.stageWiseStatus[i].action = null;
      }
    } else if (action === 'accept') {
      // Move to next stage if available
      const nextStage = app.stageWiseStatus[currentIndex + 1];
      if (nextStage) {
        app.stage = nextStage.stageName;
        nextStage.status = 'in_review';
      } else {
        app.stage = 'hired'; // all done
      }
    }

    await app.save();

    res.status(200).json({
      message: `Stage '${stageName}' marked as ${action}`,
      application: app
    });

  } catch (err) {
    console.error('Error in updateStageAction:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



// Delete Application
// exports.deleteApplication = async (req, res) => {
//   try {
//     const { applicationId } = req.params;

//     const app = await Application.findById(applicationId);
//     if (!app) return res.status(404).json({ message: 'Application not found' });

//     await Application.findByIdAndDelete(applicationId);
//     res.json({ message: 'Application deleted successfully' });

//   } catch (err) {
//     console.error('Error in deleteApplication:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

// ================================
// Delete Application
// ================================
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // ✅ Decrease applicant count in job
    await Job.findByIdAndUpdate(app.job, { $inc: { applicants: -1 } });

    await Application.findByIdAndDelete(applicationId);
    res.json({ message: 'Application deleted successfully and applicant count updated' });

  } catch (err) {
    console.error('Error in deleteApplication:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Application Statistics
exports.getApplicationStatistics = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    if (user.role === 'recruiter') filter.assignedTo = user._id;

    const totalApplications = await Application.countDocuments(filter);
    const stageStats = await Application.aggregate([
      { $match: filter },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    const formattedStats = stageStats.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({ totalApplications, stageBreakdown: formattedStats });

  } catch (err) {
    console.error('Error in getApplicationStatistics:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// exports.generateOfferLetterManually = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const app = await Application.findById(applicationId)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title team');

//     if (!app) return res.status(404).json({ message: 'Application not found' });

//     const candidate = app.candidate;
//     const job = app.job;

//     const offerLetterUrl = await generateOfferLetterPDF(candidate, job);

//     app.offerLetterUrl = offerLetterUrl;
//     app.stage = 'hired'; // stage updated manually
//     await app.save();

//     const subject = `🎉 Offer Letter for ${job.title}`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//         <h2 style="color: #0073e6;">Welcome to Signavox!</h2>
//         <p>Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
//         <p>We are delighted to offer you the position of <strong>${job.title}</strong> in our <strong>${job.team}</strong> team.</p>
//         <p>Your official offer letter is ready. You can download it here:</p>
//         <p><a href="${offerLetterUrl}" style="color: #0073e6;">Download Offer Letter (PDF)</a></p>
//         <p>We look forward to having you onboard soon!</p>
//         <br/>
//         <p>Best regards,<br/><strong>Signavox Careers Team</strong></p>
//       </div>
//     `;
//     await sendMail({ to: candidate.email, subject, html });

//     console.log(`✅ Offer letter manually generated and emailed to ${candidate.email}`);

//     res.status(200).json({ message: 'Offer letter generated successfully', offerLetterUrl, application: app });

//   } catch (error) {
//     console.error('❌ Error in generateOfferLetterManually:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// ================================
// Generate Offer Letter (Manual Trigger Only)
// ================================
// exports.generateOfferLetterManually = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const app = await Application.findById(applicationId)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title team');

//     if (!app) return res.status(404).json({ message: 'Application not found' });
//     if (app.stage !== 'hired') {
//       return res.status(400).json({
//         message: `Offer letter can only be generated when the stage is 'hired'. Current stage: '${app.stage}'.`
//       });
//     }

//     if (app.offerLetterUrl) {
//       return res.status(400).json({
//         message: 'Offer letter already generated for this candidate.',
//         offerLetterUrl: app.offerLetterUrl
//       });
//     }

//     const candidate = app.candidate;
//     const job = app.job;
//     const offerLetterUrl = await generateOfferLetterPDF(candidate, job);

//     app.offerLetterUrl = offerLetterUrl;
//     app.offerStatus = 'pending';
//     app.offerGeneratedAt = new Date();
//     await app.save();

//     // ✅ Email with Accept/Reject buttons
//     const acceptUrl = `${process.env.FRONTEND_URL}/offer/${app._id}/accept`;
//     const rejectUrl = `${process.env.FRONTEND_URL}/offer/${app._id}/reject`;

//     const subject = `🎉 Offer Letter for ${job.title}`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//         <h2 style="color: #0073e6;">Welcome to Signavox!</h2>
//         <p>Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
//         <p>We are delighted to offer you the position of <strong>${job.title}</strong> in our <strong>${job.team}</strong> team.</p>
//         <p>Your official offer letter is ready. You can download it here:</p>
//         <p><a href="${offerLetterUrl}" style="color: #0073e6;">Download Offer Letter (PDF)</a></p>
//         <p>Please respond within 7 days by clicking one of the buttons below:</p>
//         <div style="margin-top: 15px;">
//           <a href="${acceptUrl}" style="background:#28a745;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;margin-right:10px;">Accept Offer</a>
//           <a href="${rejectUrl}" style="background:#dc3545;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Reject Offer</a>
//         </div>
//         <br/>
//         <p>If you do not respond within 7 days, this offer will expire automatically.</p>
//         <br/>
//         <p>Best regards,<br/><strong>Signavox Careers Team</strong></p>
//       </div>
//     `;
//     await sendMail({ to: candidate.email, subject, html });

//     console.log(`✅ Offer letter sent with Accept/Reject links to ${candidate.email}`);

//     res.status(200).json({
//       message: 'Offer letter generated and emailed successfully',
//       offerLetterUrl,
//       application: app
//     });

//   } catch (error) {
//     console.error('❌ Error in generateOfferLetterManually:', error.message);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// ================================
// Generate Offer Letter (Manual Trigger Only)
// ================================
exports.generateOfferLetterManually = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const app = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title'); // 👈 removed team

    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.stage !== 'hired') {
      return res.status(400).json({
        message: `Offer letter can only be generated when the stage is 'hired'. Current stage: '${app.stage}'.`
      });
    }

    if (app.offerLetterUrl) {
      return res.status(400).json({
        message: 'Offer letter already generated for this candidate.',
        // offerLetterUrl: app.offerLetterUrl
      });
    }

    const candidate = app.candidate;
    const job = app.job;
    const offerLetterUrl = await generateOfferLetterPDF(candidate, job);

    app.offerLetterUrl = offerLetterUrl;
    app.offerStatus = 'pending';
    app.offerGeneratedAt = new Date();
    await app.save();

    // ✅ Single Link for Accept/Reject (No Buttons)
    const decisionUrl = `${process.env.FRONTEND_URL}/offer/${app._id}`;

    const subject = `🎉 Offer Letter for ${job.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #0073e6;">Welcome to Signavox!</h2>
        <p>Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
        <p>We are delighted to offer you the position of <strong>${job.title}</strong> at <strong>Signavox</strong>.</p>
        <p>Your official offer letter is ready. You can download it here:</p>
        <p><a href="${offerLetterUrl}" style="color: #0073e6;">Download Offer Letter (PDF)</a></p>
        <p>Please go through the link below to <strong>accept or reject</strong> the offer:</p>
        <p><a href="${decisionUrl}" style="color: #0073e6;">${decisionUrl}</a></p>
        <br/>
        <p>If you do not respond within 7 days, this offer will expire automatically.</p>
        <br/>
        <p>Best regards,<br/><strong>Signavox Careers Team</strong></p>
      </div>
    `;

    await sendMail({ to: candidate.email, subject, html });

    console.log(`✅ Offer letter sent with single link to ${candidate.email}`);

    res.status(200).json({
      message: 'Offer letter generated and emailed successfully',
      offerLetterUrl,
      application: app
    });

  } catch (error) {
    console.error('❌ Error in generateOfferLetterManually:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ================================
// Get Offer Letter
// ================================
exports.getOfferLetter = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const user = req.user;

    const app = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title team');

    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (user.role === 'candidate' && app.candidate._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to view this offer letter' });
    }
    if (!app.offerLetterUrl) return res.status(400).json({ message: 'Offer letter not generated yet' });

    res.status(200).json({
      message: 'Offer letter fetched successfully',
      offerLetterUrl: app.offerLetterUrl,
      application: {
        _id: app._id,
        candidate: app.candidate,
        job: app.job,
        stage: app.stage,
        statusNotes: app.statusNotes,
      }
    });

  } catch (error) {
    console.error('❌ Error in getOfferLetter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ================================
// Candidate Accept Offer
// ================================
exports.acceptOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const app = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title team');

    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.offerStatus !== 'pending')
      return res.status(400).json({ message: `Offer already ${app.offerStatus}` });

    app.offerStatus = 'accepted';
    await app.save();

    res.json({ message: 'Offer accepted successfully', application: app });
  } catch (error) {
    console.error('Error in acceptOffer:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ================================
// Candidate Reject Offer
// ================================
exports.rejectOffer = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const app = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email')
      .populate('job', 'title team');

    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.offerStatus !== 'pending')
      return res.status(400).json({ message: `Offer already ${app.offerStatus}` });

    app.offerStatus = 'rejected';
    await app.save();

    res.json({ message: 'Offer rejected successfully', application: app });
  } catch (error) {
    console.error('Error in rejectOffer:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// ✅ Withdraw Application Controller
exports.withdrawApplication = async (req, res) => {
  try {
    const candidate = req.user;
    const { id } = req.params; // application ID

    // 🔍 Find the application
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // 🔒 Ensure candidate owns this application
    if (application.candidate.toString() !== candidate._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to withdraw this application.' });
    }

    // ⏱ Check 24-hour limit
    const appliedTime = new Date(application.appliedAt);
    const now = new Date();
    const diffHours = (now - appliedTime) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(400).json({
        message: 'You can only withdraw within 24 hours of applying.'
      });
    }

    // 🚫 Check if already withdrawn
    if (application.withdrawn) {
      return res.status(400).json({
        message: 'You have already withdrawn this application.'
      });
    }

    // ✅ Mark as withdrawn
    application.withdrawn = true;
    application.withdrawnAt = now;
    await application.save();

    return res.status(200).json({
      message: 'Application withdrawn successfully.',
      application
    });

  } catch (error) {
    console.error('Error in withdrawApplication:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Stage Status of One Application
exports.getApplicationStageStatus = async (req, res) => {
  try {
    const candidate = req.user;
    const { id } = req.params; // Application ID

    // 🔍 Find the application and include candidate for ownership check
    const application = await Application.findById(id)
      .populate('job', 'title')
      .select('candidate stage stageWiseStatus withdrawn withdrawnAt appliedAt');

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // 🔒 Ensure candidate owns this application
    if (!application.candidate || application.candidate.toString() !== candidate._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to view this application.' });
    }

    // ✅ Return only stage details
    return res.status(200).json({
      message: `Stage status for application`,
      jobTitle: application.job?.title || null,
      currentStage: application.stage,
      withdrawn: application.withdrawn || false,
      withdrawnAt: application.withdrawnAt || null,
      appliedAt: application.appliedAt,
      stageWiseStatus: application.stageWiseStatus
    });

  } catch (error) {
    console.error('Error in getApplicationStageStatus:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


