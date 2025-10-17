const Job = require('../models/Job');


// Create Job (admin only)

exports.createJob = async (req, res) => {
  try {
    const {
      title, description, workType, experience, package: salaryPackage,
      location, numberOfOpenings, skills = [], closingDate, team = 'general', isFeatured = false, additional
    } = req.body;

    // Create new job (MongoDB auto-generates _id)
    const job = new Job({
      title,
      description,
      workType,
      experience,
      package: salaryPackage,
      location,
      numberOfOpenings,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s=>s.trim()) : []),
      postedBy: req.user._id, // from auth middleware
      closingDate,
      team,
      isFeatured,
      additional
    });

    await job.save();
    res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all jobs (public)

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get job by ID (public)

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Update job (admin only)

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Delete job (admin only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// ✅ Close Job Early (admin only)
exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.status = 'closed';
    await job.save();

    res.json({ message: 'Job closed successfully', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};