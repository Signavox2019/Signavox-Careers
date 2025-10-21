const Job = require('../models/Job');
const upload = require('../middlewares/uploadMiddleware');

// ==========================
// Create Job
// ==========================
exports.createJob = async (req, res) => {
  upload.array('document')(req, res, async function(err) {
    if (err) return res.status(400).json({ message: 'Upload error', error: err.message });

    try {
      const adminUser = req.user; // admin from auth middleware

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
        department: req.body.department,
        location: req.body.location,
        type: req.body.type,
        experience: req.body.experience,
        salary: req.body.salary,
        closingDate: req.body.closingDate,
        jobDescription,
        hiringWorkflow,
        eligibilityCriteria,
        createdBy: adminUser._id
      });

      await job.save();
      // Populate full admin details in response
      await job.populate('createdBy', 'name email role'); // add any other fields you want

      res.status(201).json({ job });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
};

// ==========================
// Get all jobs (public)
// ==========================
// exports.getJobs = async (req, res) => {
//   try {
//     const jobs = await Job.find()
//       .sort({ createdAt: -1 })
//       .populate('createdBy', 'name email role'); // populate createdBy for all jobs
//     res.json(jobs);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };


exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role');

    const totalCount = await Job.countDocuments();

    res.json({ totalCount, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================
// Get job by ID (public)
// ==========================
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('createdBy', 'name email role'); // populate createdBy
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ==========================
// Update job (admin only)
// ==========================
exports.updateJob = async (req, res) => {
  upload.array('document')(req, res, async function(err) {
    if (err) return res.status(400).json({ message: 'Upload error', error: err.message });

    try {
      const existingJob = await Job.findById(req.params.id);
      if (!existingJob) return res.status(404).json({ message: 'Job not found' });

      const jobDescription = req.body.jobDescription ? JSON.parse(req.body.jobDescription) : {};
      const hiringWorkflow = req.body.hiringWorkflow ? JSON.parse(req.body.hiringWorkflow) : {};
      const eligibilityCriteria = req.body.eligibilityCriteria ? JSON.parse(req.body.eligibilityCriteria) : {};

      // Merge existing data
      existingJob.jobDescription = {
        ...existingJob.jobDescription.toObject(),
        ...jobDescription,
        responsibilities: jobDescription.responsibilities || existingJob.jobDescription.responsibilities || [],
        requirements: jobDescription.requirements || existingJob.jobDescription.requirements || [],
        benefits: jobDescription.benefits || existingJob.jobDescription.benefits || [],
        summary: {
          ...existingJob.jobDescription.summary,
          ...(jobDescription.summary || {}),
          responsibilities: (jobDescription.summary?.responsibilities) || existingJob.jobDescription.summary.responsibilities || [],
          qualifications: (jobDescription.summary?.qualifications) || existingJob.jobDescription.summary.qualifications || []
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
        const newDocuments = req.files.map(file => ({
          name: file.originalname,
          url: file.location,
          uploadedAt: new Date()
        }));
        existingJob.jobDescription.document = [
          ...(existingJob.jobDescription.document || []),
          ...newDocuments
        ];
      }

      // Update simple fields
      existingJob.title = req.body.title || existingJob.title;
      existingJob.department = req.body.department || existingJob.department;
      existingJob.location = req.body.location || existingJob.location;
      existingJob.type = req.body.type || existingJob.type;
      existingJob.experience = req.body.experience || existingJob.experience;
      existingJob.salary = req.body.salary || existingJob.salary;
      existingJob.closingDate = req.body.closingDate || existingJob.closingDate;

      await existingJob.save();

      // Populate createdBy after update
      await existingJob.populate('createdBy', 'name email role');

      res.json(existingJob);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
};

// ==========================
// Delete job (admin only)
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
// Close job early (admin only)
// ==========================
exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email role');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    job.status = 'closed';

    job.jobDescription.responsibilities = job.jobDescription.responsibilities || [];
    job.jobDescription.requirements = job.jobDescription.requirements || [];
    job.jobDescription.benefits = job.jobDescription.benefits || [];
    job.jobDescription.summary = job.jobDescription.summary || {};
    job.jobDescription.summary.responsibilities = job.jobDescription.summary.responsibilities || [];
    job.jobDescription.summary.qualifications = job.jobDescription.summary.qualifications || [];

    job.hiringWorkflow.stages = job.hiringWorkflow.stages || [];
    job.eligibilityCriteria.required = job.eligibilityCriteria.required || [];
    job.eligibilityCriteria.preferred = job.eligibilityCriteria.preferred || [];
    job.eligibilityCriteria.skills = job.eligibilityCriteria.skills || [];

    await job.save();
    res.json({ message: 'Job closed successfully', job });
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
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const closedJobs = await Job.countDocuments({ status: 'closed' });

    // Monthly job creation stats (last 12 months)
    const monthlyStats = await Job.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalJobs: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      totalJobs,
      openJobs,
      closedJobs,
      monthlyStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

