const Job = require('../models/Job');
const Application = require('../models/Application'); // ✅ Import Application model
const upload = require('../middlewares/uploadMiddleware');

// ==========================
// Helper: Auto-close expired jobs
// ==========================
const autoCloseExpiredJobs = async () => {
  const today = new Date().toISOString().split('T')[0];
  await Job.updateMany(
    { closingDate: { $lt: today }, status: { $ne: 'closed' } },
    { $set: { status: 'closed' } }
  );
};

// ==========================
// Create Job (Admin only)
// ==========================
exports.createJob = async (req, res) => {
  upload.array('document')(req, res, async function (err) {
    if (err) return res.status(400).json({ message: 'Upload error', error: err.message });

    try {
      const adminUser = req.user;

      const jobDescription = req.body.jobDescription ? JSON.parse(req.body.jobDescription) : {};
      const hiringWorkflow = req.body.hiringWorkflow ? JSON.parse(req.body.hiringWorkflow) : {};
      const eligibilityCriteria = req.body.eligibilityCriteria ? JSON.parse(req.body.eligibilityCriteria) : {};

      // Initialize arrays
      jobDescription.responsibilities = jobDescription.responsibilities || [];
      jobDescription.requirements = jobDescription.requirements || [];
      jobDescription.benefits = jobDescription.benefits || [];
      jobDescription.document = [];
      jobDescription.summary = jobDescription.summary || {};
      jobDescription.summary.responsibilities = jobDescription.summary.responsibilities || [];
      jobDescription.summary.qualifications = jobDescription.summary.qualifications || [];

      hiringWorkflow.stages = hiringWorkflow.stages || [];
      eligibilityCriteria.required = eligibilityCriteria.required || [];
      eligibilityCriteria.preferred = eligibilityCriteria.preferred || [];
      eligibilityCriteria.skills = eligibilityCriteria.skills || [];

      // Handle uploaded documents
      if (req.files && req.files.length > 0) {
        jobDescription.document = req.files.map(file => ({
          name: file.originalname,
          url: file.location,
          uploadedAt: new Date()
        }));
      }

      const job = new Job({
        title: req.body.title,
        location: req.body.location,
        type: req.body.type,
        experience: req.body.experience,
        closingDate: req.body.closingDate,
        jobDescription,
        hiringWorkflow,
        eligibilityCriteria,
        createdBy: adminUser._id,
        assignedTo: req.body.assignedTo
      });

      await job.save();
      await job.populate([
        { path: 'createdBy', select: 'name email role' },
        { path: 'assignedTo', select: 'name email role' }
      ]);

      res.status(201).json({ job });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
};

// ==========================
// Get all jobs (Public)
// ==========================
exports.getJobs = async (req, res) => {
  try {
    await autoCloseExpiredJobs();

    // Get all jobs
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');

    // Attach applicants to each job
    const jobsWithApplicants = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await Application.find({ job: job._id })
          .populate('candidate', 'name email phone')
          .select('status appliedAt');
        return { ...job.toObject(), applicants };
      })
    );

    const totalCount = await Job.countDocuments();

    res.json({ totalCount, jobs: jobsWithApplicants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================
// Get job by ID (with applicants)
// ==========================
exports.getJobById = async (req, res) => {
  try {
    await autoCloseExpiredJobs();

    const job = await Job.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applicants = await Application.find({ job: job._id })
      .populate('candidate', 'name email phone')
      .select('status appliedAt');

    res.json({ ...job.toObject(), applicants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================
// Update job (Admin only)
// ==========================
exports.updateJob = async (req, res) => {
  upload.array('document')(req, res, async function (err) {
    if (err) return res.status(400).json({ message: 'Upload error', error: err.message });

    try {
      const existingJob = await Job.findById(req.params.id);
      if (!existingJob) return res.status(404).json({ message: 'Job not found' });

      const jobDescription = req.body.jobDescription ? JSON.parse(req.body.jobDescription) : {};
      const hiringWorkflow = req.body.hiringWorkflow ? JSON.parse(req.body.hiringWorkflow) : {};
      const eligibilityCriteria = req.body.eligibilityCriteria ? JSON.parse(req.body.eligibilityCriteria) : {};

      existingJob.jobDescription = {
        ...existingJob.jobDescription.toObject(),
        ...jobDescription,
        responsibilities: jobDescription.responsibilities || existingJob.jobDescription.responsibilities || [],
        requirements: jobDescription.requirements || existingJob.jobDescription.requirements || [],
        benefits: jobDescription.benefits || existingJob.jobDescription.benefits || [],
        summary: {
          ...existingJob.jobDescription.summary,
          ...(jobDescription.summary || {}),
          responsibilities: jobDescription.summary?.responsibilities || existingJob.jobDescription.summary.responsibilities || [],
          qualifications: jobDescription.summary?.qualifications || existingJob.jobDescription.summary.qualifications || []
        }
      };

      existingJob.hiringWorkflow = {
        ...existingJob.hiringWorkflow.toObject(),
        ...hiringWorkflow,
        stages: hiringWorkflow.stages || existingJob.hiringWorkflow.stages || []
      };

      existingJob.eligibilityCriteria = {
        ...existingJob.eligibilityCriteria.toObject(),
        ...eligibilityCriteria,
        required: eligibilityCriteria.required || existingJob.eligibilityCriteria.required || [],
        preferred: eligibilityCriteria.preferred || existingJob.eligibilityCriteria.preferred || [],
        skills: eligibilityCriteria.skills || existingJob.eligibilityCriteria.skills || []
      };

      if (req.files && req.files.length > 0) {
        const newDocs = req.files.map(file => ({
          name: file.originalname,
          url: file.location,
          uploadedAt: new Date()
        }));
        existingJob.jobDescription.document = [
          ...(existingJob.jobDescription.document || []),
          ...newDocs
        ];
      }

      existingJob.title = req.body.title || existingJob.title;
      existingJob.location = req.body.location || existingJob.location;
      existingJob.type = req.body.type || existingJob.type;
      existingJob.experience = req.body.experience || existingJob.experience;
      existingJob.closingDate = req.body.closingDate || existingJob.closingDate;
      existingJob.assignedTo = req.body.assignedTo || existingJob.assignedTo;

      await existingJob.save();
      await existingJob.populate([
        { path: 'createdBy', select: 'name email role' },
        { path: 'assignedTo', select: 'name email role' }
      ]);

      res.json(existingJob);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
};

// ==========================
// Delete Job
// ==========================
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================
// Manually Close Job
// ==========================
exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.status = 'closed';
    await job.save();

    res.json({ message: 'Job manually closed successfully', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================
// Job Statistics (Admin)
// ==========================
exports.getJobStats = async (req, res) => {
  try {
    await autoCloseExpiredJobs();

    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const closedJobs = await Job.countDocuments({ status: 'closed' });

    const monthlyStats = await Job.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalJobs: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({ totalJobs, openJobs, closedJobs, monthlyStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
