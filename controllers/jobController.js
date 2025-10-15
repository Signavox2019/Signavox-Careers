const Job = require('../models/Job');

// create job (admin)
exports.createJob = async (req, res) => {
  try {
    const {
      title, description, workType, experience, package: salaryPackage,
      location, numberOfOpenings, skills = [], closingDate, team = 'general', isFeatured = false, additional
    } = req.body;

    const job = new Job({
      title,
      description,
      workType,
      experience,
      package: salaryPackage,
      location,
      numberOfOpenings,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s=>s.trim()) : []),
      postedBy: req.user._id,
      closingDate,
      team,
      isFeatured,
      additional
    });

    await job.save();
    res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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
