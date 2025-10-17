const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

exports.applyToJob = async (req, res) => {
  try {
    const candidate = req.user;
    const { jobId, coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // S3 resume URL
    const resumeSnapshot = req.file ? req.file.location : candidate.resume;

    const application = new Application({
      candidate: candidate._id,
      job: job._id,
      resumeSnapshot,
      coverLetter,
      assignedTeam: job.team || 'general'
    });

    await application.save();
    res.status(201).json({ message: 'Applied successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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
      .populate('job', 'title team');
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignToRecruiter = async (req, res) => {
  try {
    const { applicationId, recruiterId } = req.body;
    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const recruiter = await User.findById(recruiterId);
    if (!recruiter || recruiter.role !== 'recruiter') return res.status(400).json({ message: 'Invalid recruiter' });

    application.assignedTo = recruiter._id;
    await application.save();
    res.json({ message: 'Assigned to recruiter', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (status) app.status = status;
    if (notes) app.notes = notes;
    await app.save();
    res.json({ message: 'Updated', app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
