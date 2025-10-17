const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// ================================
// Apply to a Job
// ================================
exports.applyToJob = async (req, res) => {
  try {
    const candidate = req.user;
    const { jobId, coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

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

    res.status(201).json({
      message: 'Applied successfully',
      application: populatedApp
    });
  } catch (err) {
    console.error('Error in applyToJob:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ================================
// Get Applications (All / Role-based)
// ================================
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

// ================================
// ✅ Get My Applications (Candidate only)
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

// ================================
// Assign Application to Recruiter
// ================================
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

// ================================
// Update Application Status
// ================================
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (status) app.status = status;
    if (notes) app.notes = notes;

    await app.save();

    const updatedApp = await Application.findById(applicationId)
      .populate('candidate', 'firstName lastName email phoneNumber')
      .populate('job', 'title team')
      .populate('assignedTo', 'firstName lastName email team');

    res.json({
      message: 'Application status updated successfully',
      application: updatedApp
    });
  } catch (err) {
    console.error('Error in updateApplicationStatus:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ================================
// Delete Application
// ================================
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
// ======================================
// Application Statistics (Admin/Recruiter)
// ======================================
exports.getApplicationStatistics = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    // Recruiter sees only assigned applications
    if (user.role === 'recruiter') {
      filter.assignedTo = user._id;
    }

    // Admin sees all applications
    const totalApplications = await Application.countDocuments(filter);
    const statusStats = await Application.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const formattedStats = statusStats.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({
      totalApplications,
      statusBreakdown: formattedStats,
    });
  } catch (err) {
    console.error('Error in getApplicationStatistics:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};