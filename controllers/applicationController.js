const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendMail } = require('../utils/email'); // Email utility
const { generateOfferLetterPDF } = require('../utils/generateOfferLetter');

// Apply to a Job

// exports.applyToJob = async (req, res) => {
//   try {
//     const candidate = req.user;
//     const { jobId} = req.body;

//     const job = await Job.findById(jobId);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     // ✅ Prevent duplicate applications
//     const existingApplication = await Application.findOne({
//       candidate: candidate._id,
//       job: jobId
//     });
//     if (existingApplication)
//       return res.status(400).json({ message: 'You have already applied for this job.' });

//     // ✅ Build stageWiseStatus dynamically — all pending initially
//     const stageWiseStatus = [];

//     const definedStages = job.hiringWorkflow?.stages?.length
//       ? job.hiringWorkflow.stages
//       : [];

//     // ✅ Add 'applied' as the default starting stage
//     stageWiseStatus.push({
//       stageName: 'applied',
//       status: 'completed', // user has just applied
//       action: 'accept', // automatically accepted into the process
//       updatedAt: new Date()
//     });

//     // ✅ Add the rest of the workflow stages as pending
//     definedStages.forEach(stg => {
//       stageWiseStatus.push({
//         stageName: stg.stage,
//         status: 'pending',
//         action: null,
//         updatedAt: null
//       });
//     });

//     // 📝 Create new Application document
//     const application = new Application({
//       candidate: candidate._id,
//       job: jobId,
//       coverLetter,
//       stage: 'applied', // ✅ always start with applied
//       stageWiseStatus
//     });

//     await application.save();

//     // Increment applicant count for the job
//     await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

//     // ✅ Populate for response
//     const populatedApp = await Application.findById(application._id)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title location type');

//     // ✉️ Send confirmation email
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
//     await sendMail({ to: candidate.email, subject, html });

//     res.status(201).json({
//       message: 'Application submitted successfully',
//       application: populatedApp
//     });

//   } catch (error) {
//     console.error('❌ Error in applyToJob:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

exports.applyToJob = async (req, res) => {
  try {
    const candidate = req.user;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    // 1. Check if Job Exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 2. Check if Job is Open
    if (job.status && job.status !== "open") {
      return res.status(400).json({
        message: "This job is closed. Applications are no longer accepted.",
        jobStatus: job.status
      });
    }

    // ---------------------------------------
    // 3. Prevent Duplicate Applications
    // ---------------------------------------
    const existingApplication = await Application.findOne({
      candidate: candidate._id,
      job: jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job.",
        existingApplicationId: existingApplication._id
      });
    }

    // ---------------------------------------
    // 4. Build stageWiseStatus
    // ---------------------------------------
    const workflowStages = job.hiringWorkflow?.stages || [];
    const stageWiseStatus = [];

    stageWiseStatus.push({
      stageName: "applied",
      status: "completed",
      action: "accept",
      updatedAt: new Date()
    });

    workflowStages.forEach(step => {
      stageWiseStatus.push({
        stageName: step.stage,
        status: "pending",
        action: null,
        updatedAt: null
      });
    });

    // ---------------------------------------
    // 5. Create Application
    // ---------------------------------------
    const application = new Application({
      candidate: candidate._id,
      job: jobId,
      stage: "applied",
      stageWiseStatus
    });

    await application.save();

    await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

    const populatedApp = await Application.findById(application._id)
      .populate(
        "candidate",
        "firstName middleName lastName name email phoneNumber gender DOB permanentAddress currentAddress skills education experiences certifications profileImage resume"
      )
      .populate(
        "job",
        "title location type salary description experienceLevel skills openings status createdAt updatedAt"
      );

    // ---------------------------------------
    // 6. Send Confirmation Email
    // ---------------------------------------
    const fullName = `${candidate.firstName} ${candidate.lastName}`;
    const subject = `Application Confirmation - ${job.title}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #0073e6;">Application Received</h2>
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>Thank you for applying for the position of <strong>${job.title}</strong> at <strong>Signavox</strong>.</p>
        <p>Your application has been successfully submitted and is currently under review.</p>
        <br />
        <p>Regards,<br><strong>Signavox Careers Team</strong></p>
      </div>
    `;

    await sendMail({ to: candidate.email, subject, html });

    return res.status(201).json({
      message: "Application submitted successfully",
      application: populatedApp
    });

  } catch (error) {
    console.error("❌ Error in applyToJob:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



// Get Applications (All / Role-based)

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

// exports.getApplications = async (req, res) => {
//   try {
//     const { user } = req;
//     let query = {};

//     if (user.role === 'recruiter') query.assignedTo = user._id;
//     else if (user.role === 'candidate') query.candidate = user._id;

//     const apps = await Application.find(query)
//       .populate('candidate', 'firstName lastName email phoneNumber')
//       .populate('job', 'title team hiringWorkflow')
//       .populate('assignedTo', 'firstName lastName email team')
//       .sort({ appliedAt: -1 });

//     // ✅ Mark all remaining stages as rejected (same logic as above)
//     const updatedApps = apps.map(app => {
//       const jobStages = app.job?.hiringWorkflow?.stages?.map(s => s.stage) || [];
//       const rejectedStage = app.stageWiseStatus.find(s => s.action === 'reject');

//       if (rejectedStage) {
//         const rejectIndex = jobStages.indexOf(rejectedStage.stageName);

//         for (let i = rejectIndex + 1; i < jobStages.length; i++) {
//           const stageName = jobStages[i];
//           const existing = app.stageWiseStatus.find(s => s.stageName === stageName);
//           if (existing) {
//             existing.status = 'completed';
//             existing.action = 'reject';
//           } else {
//             app.stageWiseStatus.push({
//               stageName,
//               status: 'completed',
//               action: 'reject',
//               updatedAt: new Date(),
//             });
//           }
//         }
//       }

//       return app;
//     });

//     res.json({
//       message: 'Fetched applications successfully',
//       applications: updatedApps,
//     });
//   } catch (err) {
//     console.error('❌ Error in getApplications:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };


// Get My Applications (Candidate only)

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

// exports.getMyApplications = async (req, res) => {
//   try {
//     const user = req.user;
//     if (user.role !== 'candidate') {
//       return res.status(403).json({ message: 'Only candidates can view their applications' });
//     }

//     const myApps = await Application.find({ candidate: user._id })
//       .populate('job', 'title team hiringWorkflow')
//       .populate('assignedTo', 'firstName lastName email team')
//       .sort({ appliedAt: -1 });

//     if (!myApps.length)
//       return res.status(404).json({ message: 'No applications found for this user' });

//     // ✅ Mark remaining stages as rejected in the response (if user was rejected)
//     const updatedApps = myApps.map(app => {
//       const jobStages = app.job?.hiringWorkflow?.stages?.map(s => s.stage) || [];
//       const rejectedStage = app.stageWiseStatus.find(s => s.action === 'reject');

//       if (rejectedStage) {
//         const rejectIndex = jobStages.indexOf(rejectedStage.stageName);

//         // Mark all stages after rejection as rejected
//         for (let i = rejectIndex + 1; i < jobStages.length; i++) {
//           const stageName = jobStages[i];
//           const existing = app.stageWiseStatus.find(s => s.stageName === stageName);
//           if (existing) {
//             existing.status = 'completed';
//             existing.action = 'reject';
//           } else {
//             app.stageWiseStatus.push({
//               stageName,
//               status: 'completed',
//               action: 'reject',
//               updatedAt: new Date(),
//             });
//           }
//         }
//       }

//       return app;
//     });

//     res.json({
//       message: 'Fetched my applications successfully',
//       applications: updatedApps,
//     });
//   } catch (err) {
//     console.error('❌ Error in getMyApplications:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };




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
//     const { stageName, action, notes } = req.body; // { "stageName": "hr_interview", "action": "reject" }

//     const app = await Application.findById(applicationId);
//     if (!app) return res.status(404).json({ message: 'Application not found' });

//     // Find the index of the stage
//     const currentIndex = app.stageWiseStatus.findIndex(s => s.stageName === stageName);
//     if (currentIndex === -1) return res.status(400).json({ message: 'Invalid stage name' });

//     // Check previous stage must be completed & accepted
//     if (currentIndex > 0) {
//       const prev = app.stageWiseStatus[currentIndex - 1];
//       if (!(prev.status === 'completed' && prev.action === 'accept')) {
//         return res.status(400).json({
//           message: `Cannot review ${stageName} until ${prev.stageName} is completed and accepted.`
//         });
//       }
//     }

//     // Update the current stage
//     app.stageWiseStatus[currentIndex].action = action;
//     app.stageWiseStatus[currentIndex].status = 'completed';
//     app.stageWiseStatus[currentIndex].updatedAt = new Date();

//     // If rejected — stop further stages
//     if (action === 'reject') {
//       app.stage = 'rejected';
//       app.statusNotes = notes || `Rejected at stage ${stageName}`;
//       for (let i = currentIndex + 1; i < app.stageWiseStatus.length; i++) {
//         app.stageWiseStatus[i].status = 'pending';
//         app.stageWiseStatus[i].action = null;
//       }
//     } else if (action === 'accept') {
//       // Move to next stage if available
//       const nextStage = app.stageWiseStatus[currentIndex + 1];
//       if (nextStage) {
//         app.stage = nextStage.stageName;
//         nextStage.status = 'in_review';
//       } else {
//         app.stage = 'hired'; // all done
//       }
//     }

//     await app.save();

//     res.status(200).json({
//       message: `Stage '${stageName}' marked as ${action}`,
//       application: app
//     });

//   } catch (err) {
//     console.error('Error in updateStageAction:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

// exports.updateApplicationStatus = async (req, res) => {
//   try {
//     const { applicationId } = req.params;
//     const { stageName, action, notes } = req.body;

//     // Fetch Application and populate Job
//     const app = await Application.findById(applicationId).populate('job');
//     if (!app) return res.status(404).json({ message: 'Application not found' });

//     const job = app.job;
//     const workflowStages = job?.hiringWorkflow?.stages || [];

//     if (workflowStages.length === 0)
//       return res.status(400).json({ message: 'No stages found for this job' });

//     const workflow = workflowStages.map(s => s.stage);

//     const currentIndex = workflow.indexOf(stageName);
//     if (currentIndex === -1)
//       return res.status(400).json({ message: 'Invalid stage name' });

//     // ✅ Stop if candidate already rejected earlier
//     const rejectedStage = app.stageWiseStatus.find(s => s.action === 'reject');
//     if (rejectedStage) {
//       return res.status(400).json({
//         message: `Candidate already rejected at ${rejectedStage.stageName}. No further updates allowed.`,
//       });
//     }

//     // ✅ Ensure previous stage accepted (normal flow validation)
//     if (currentIndex > 0) {
//       const prevStageName = workflow[currentIndex - 1];
//       const prevStage = app.stageWiseStatus.find(s => s.stageName === prevStageName);
//       if (!prevStage || prevStage.action !== 'accept') {
//         return res.status(400).json({
//           message: `Cannot update ${stageName} until ${prevStageName} stage is accepted.`,
//         });
//       }
//     }

//     // ✅ Find or create the current stage
//     let currentStage = app.stageWiseStatus.find(s => s.stageName === stageName);
//     if (!currentStage) {
//       currentStage = { stageName, status: 'pending', action: null, updatedAt: new Date() };
//       app.stageWiseStatus.push(currentStage);
//     }

//     // ✅ Update current stage
//     currentStage.action = action;
//     currentStage.status = 'completed';
//     currentStage.updatedAt = new Date();

//     // =========================
//     // 🔴 Handle REJECT Action
//     // =========================
//     if (action === 'reject') {
//       app.stage = 'rejected';
//       app.statusNotes = notes || `Application rejected at ${stageName}.`;

//       // Mark all future stages as rejected (completed)
//       for (let i = currentIndex + 1; i < workflow.length; i++) {
//         const futureStageName = workflow[i];
//         const existingFutureStage = app.stageWiseStatus.find(
//           s => s.stageName === futureStageName
//         );
//         if (existingFutureStage) {
//           existingFutureStage.status = 'completed';
//           existingFutureStage.action = 'reject';
//           existingFutureStage.updatedAt = new Date();
//         } else {
//           app.stageWiseStatus.push({
//             stageName: futureStageName,
//             status: 'completed',
//             action: 'reject',
//             updatedAt: new Date(),
//           });
//         }
//       }
//     }

//     // =========================
//     // 🟢 Handle ACCEPT Action
//     // =========================
//     else if (action === 'accept') {
//       const nextStageName = workflow[currentIndex + 1];
//       if (nextStageName) {
//         app.stage = nextStageName;

//         // Set next stage to pending (instead of in_review)
//         const nextStage = app.stageWiseStatus.find(s => s.stageName === nextStageName);
//         if (!nextStage) {
//           app.stageWiseStatus.push({
//             stageName: nextStageName,
//             status: 'pending',
//             action: null,
//             updatedAt: null,
//           });
//         }
//       } else {
//         app.stage = 'hired';
//         app.statusNotes = 'Candidate successfully hired.';
//       }
//     }

//     await app.save();

//     res.status(200).json({
//       message: `Stage '${stageName}' marked as '${action}'.`,
//       currentStage: app.stage,
//       stageDetails: app.stageWiseStatus,
//     });
//   } catch (err) {
//     console.error('❌ Error in updateApplicationStatus:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { stageName, action, notes } = req.body;

    // Fetch Application and populate Job
    const app = await Application.findById(applicationId).populate('job');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const job = app.job;
    const workflowStages = job?.hiringWorkflow?.stages || [];

    // ✅ Check if Job has workflow stages
    if (workflowStages.length === 0)
      return res.status(400).json({ message: 'No stages found for this job' });

    // ✅ Extract only stage names from the workflow
    const workflow = workflowStages.map(s => s.stage);

    // ✅ Validate stageName existence
    if (!workflow.includes(stageName)) {
      return res.status(400).json({
        message: `Stage '${stageName}' is not part of this job's hiring workflow.`,
        // validStages: workflow
      });
    }

    const currentIndex = workflow.indexOf(stageName);

    // ✅ Stop if candidate already rejected earlier
    const rejectedStage = app.stageWiseStatus.find(s => s.action === 'reject');
    if (rejectedStage) {
      return res.status(400).json({
        message: `Candidate already rejected at ${rejectedStage.stageName}. No further updates allowed.`,
      });
    }

    // ✅ Ensure previous stage accepted before updating current one
    if (currentIndex > 0) {
      const prevStageName = workflow[currentIndex - 1];
      const prevStage = app.stageWiseStatus.find(s => s.stageName === prevStageName);
      if (!prevStage || prevStage.action !== 'accept') {
        return res.status(400).json({
          message: `Cannot update '${stageName}' until '${prevStageName}' stage is accepted.`,
        });
      }
    }

    // ✅ Find or create the current stage
    let currentStage = app.stageWiseStatus.find(s => s.stageName === stageName);
    if (!currentStage) {
      currentStage = { stageName, status: 'pending', action: null, updatedAt: new Date() };
      app.stageWiseStatus.push(currentStage);
    }

    // ✅ Update current stage
    currentStage.action = action;
    currentStage.status = 'completed';
    currentStage.updatedAt = new Date();

    //  Handle REJECT Action
    if (action === 'reject') {
      app.stage = 'rejected';
      app.statusNotes = notes || `Application rejected at ${stageName}.`;

      // Mark all future stages as rejected (completed)
      for (let i = currentIndex + 1; i < workflow.length; i++) {
        const futureStageName = workflow[i];
        const existingFutureStage = app.stageWiseStatus.find(
          s => s.stageName === futureStageName
        );
        if (existingFutureStage) {
          existingFutureStage.status = 'completed';
          existingFutureStage.action = 'reject';
          existingFutureStage.updatedAt = new Date();
        } else {
          app.stageWiseStatus.push({
            stageName: futureStageName,
            status: 'completed',
            action: 'reject',
            updatedAt: new Date(),
          });
        }
      }
    }

    //  Handle ACCEPT Action
    else if (action === 'accept') {
      const nextStageName = workflow[currentIndex + 1];
      if (nextStageName) {
        app.stage = nextStageName;

        // Add next stage to pending if not present
        const nextStage = app.stageWiseStatus.find(s => s.stageName === nextStageName);
        if (!nextStage) {
          app.stageWiseStatus.push({
            stageName: nextStageName,
            status: 'pending',
            action: null,
            updatedAt: null,
          });
        }
      } else {
        app.stage = 'hired';
        app.statusNotes = 'Candidate successfully hired.';
      }
    }

    await app.save();

    res.status(200).json({
      message: `Stage '${stageName}' marked as '${action}'.`,
      currentStage: app.stage,
      stageDetails: app.stageWiseStatus,
    });
  } catch (err) {
    console.error('❌ Error in updateApplicationStatus:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Delete Application
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

// Generate Offer Letter (Manual Trigger Only)

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

// Get Offer Letter
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



// Candidate Accept Offer
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


// Candidate Reject Offer
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


