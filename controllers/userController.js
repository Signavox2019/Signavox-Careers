const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// Get all users (admin only)
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select('-password -resetPasswordOtp -resetPasswordExpiry');
//     res.json({ users });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordOtp -resetPasswordExpiry');

    const usersWithExtra = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();

      // -----------------------
      // For recruiter: show assigned jobs and applicant stats
      // -----------------------
      if (user.role === 'recruiter') {
        const jobs = await Job.find({ assignedTo: user._id }).select('_id title type location status');
        userObj.assignedJobs = jobs || [];

        if (jobs && jobs.length > 0) {
          const applicants = await Application.find({ job: { $in: jobs.map(j => j._id) } })
            .populate('candidate', 'name email phone');
          userObj.totalApplicants = applicants.length;
          userObj.applicants = applicants.map(a => ({
            _id: a.candidate?._id,
            name: a.candidate?.name,
            email: a.candidate?.email,
            phone: a.candidate?.phone,
            appliedAt: a.appliedAt,
            jobId: a.job
          }));
        } else {
          userObj.totalApplicants = 0;
          userObj.applicants = [];
        }
      }

      // -----------------------
      // For candidate: show applied jobs
      // -----------------------
      if (user.role === 'candidate') {
        const applications = await Application.find({ candidate: user._id })
          .populate('job', 'title type location status');
        userObj.appliedJobs = applications.map(a => ({
          jobId: a.job?._id,
          title: a.job?.title,
          type: a.job?.type,
          location: a.job?.location,
          status: a.job?.status,
          appliedAt: a.appliedAt
        }));
      }

      return userObj;
    }));

    res.json({ users: usersWithExtra });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Get user by ID (admin or self)
// exports.getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password -resetPasswordOtp -resetPasswordExpiry');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetPasswordOtp -resetPasswordExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userObj = user.toObject();

    // -----------------------
    // For recruiter: show assigned jobs and applicant stats
    // -----------------------
    if (user.role === 'recruiter') {
      const jobs = await Job.find({ assignedTo: user._id }).select('_id title type location status');
      userObj.assignedJobs = jobs || [];

      if (jobs && jobs.length > 0) {
        const applicants = await Application.find({ job: { $in: jobs.map(j => j._id) } })
          .populate('candidate', 'name email phone');
        userObj.totalApplicants = applicants.length;
        userObj.applicants = applicants.map(a => ({
          _id: a.candidate?._id,
          name: a.candidate?.name,
          email: a.candidate?.email,
          phone: a.candidate?.phone,
          appliedAt: a.appliedAt,
          jobId: a.job
        }));
      } else {
        userObj.totalApplicants = 0;
        userObj.applicants = [];
      }
    }

    // -----------------------
    // For candidate: show applied jobs
    // -----------------------
    if (user.role === 'candidate') {
      const applications = await Application.find({ candidate: user._id })
        .populate('job', 'title type location status');
      userObj.appliedJobs = applications.map(a => ({
        jobId: a.job?._id,
        title: a.job?.title,
        type: a.job?.type,
        location: a.job?.location,
        status: a.job?.status,
        appliedAt: a.appliedAt
      }));
    }

    res.json({ user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update user (auto recalculates name + gap flags)


// exports.updateUser = async (req, res) => {
//   try {
//     const updateData = { ...req.body };

//     // ----------------------------
//     // Handle JSON fields from multipart/form-data
//     // ----------------------------
//     if (updateData.education && typeof updateData.education === 'string') {
//       try {
//         updateData.education = JSON.parse(updateData.education);
//       } catch (err) {
//         return res.status(400).json({ message: 'Invalid education JSON format' });
//       }
//     }

//     if (updateData.experiences && typeof updateData.experiences === 'string') {
//       try {
//         updateData.experiences = JSON.parse(updateData.experiences);
//       } catch (err) {
//         return res.status(400).json({ message: 'Invalid experiences JSON format' });
//       }
//     }

//     if (updateData.skills && typeof updateData.skills === 'string') {
//       try {
//         updateData.skills = JSON.parse(updateData.skills);
//       } catch {
//         updateData.skills = updateData.skills.split(',').map(s => s.trim());
//       }
//     }

//     // ----------------------------
//     // Handle file uploads
//     // ----------------------------
//     if (req.file) {
//       if (req.file.fieldname === 'resume') updateData.resume = req.file.location;
//       if (req.file.fieldname === 'profileImage') updateData.profileImage = req.file.location;
//     }

//     if (req.files) {
//       if (req.files['resume']) updateData.resume = req.files['resume'][0].location;
//       if (req.files['profileImage']) updateData.profileImage = req.files['profileImage'][0].location;
//     }

//     // ----------------------------
//     // Recalculate name if name parts changed
//     // ----------------------------
//     if (updateData.firstName || updateData.middleName || updateData.lastName) {
//       const parts = [
//         updateData.firstName || '',
//         updateData.middleName || '',
//         updateData.lastName || ''
//       ].filter(Boolean);
//       updateData.name = parts.join(' ');
//     }

//     // ----------------------------
//     // Fetch user and update fields
//     // ----------------------------
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Update fields
//     for (const key in updateData) {
//       user[key] = updateData[key];
//     }

//     // Save user to trigger pre-save hooks (careerGapFlags recalculation)
//     await user.save();

//     const userObj = user.toObject();
//     delete userObj.password;
//     delete userObj.resetPasswordOtp;
//     delete userObj.resetPasswordExpiry;

//     res.json({ message: 'User updated successfully', user: userObj });
//   } catch (err) {
//     console.error(err);
//     if (err.name === 'CastError' || err.name === 'ObjectParameterError') {
//       return res.status(400).json({ message: 'Invalid data format', error: err.message });
//     }
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse JSON fields
    const jsonFields = ['education', 'experiences', 'skills', 'socialLinks'];
    for (const field of jsonFields) {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try { updateData[field] = JSON.parse(updateData[field]); }
        catch (err) {
          if (field === 'skills') {
            updateData[field] = updateData[field].split(',').map(s => s.trim());
          } else {
            return res.status(400).json({ message: `Invalid JSON format for ${field}` });
          }
        }
      }
    }

    // Handle file uploads
    if (req.files) {
      if (req.files['resume']) updateData.resume = req.files['resume'][0].location;
      if (req.files['profileImage']) updateData.profileImage = req.files['profileImage'][0].location;
    }

    // Recalculate name if needed
    if (updateData.firstName || updateData.middleName || updateData.lastName) {
      const parts = [updateData.firstName, updateData.middleName, updateData.lastName].filter(Boolean);
      updateData.name = parts.join(' ');
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update all fields dynamically
    Object.assign(user, updateData);
    await user.save(); // triggers pre-save hooks for gap flags

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordOtp;
    delete userObj.resetPasswordExpiry;

    res.json({ message: 'User updated successfully', user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};




// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// ============================
// Get user stats
// ============================
exports.getUserStats = async (req, res) => {
  try {
    // Total admins
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Total candidates
    const totalCandidates = await User.countDocuments({ role: 'candidate' });

    // Total recruiters
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });

    // Recruiters by team
    const recruitersByTeam = await User.aggregate([
      { $match: { role: 'recruiter' } },
      { $group: { _id: '$team', count: { $sum: 1 } } },
      { $project: { team: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      totalAdmins,
      totalCandidates,
      totalRecruiters,
      recruitersByTeam
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
