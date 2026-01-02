const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select('-password -resetPasswordOtp -resetPasswordExpiry');

//     const usersWithExtra = await Promise.all(users.map(async (user) => {
//       const userObj = user.toObject();

//       // -----------------------
//       // For recruiter: show assigned jobs and applicant stats
//       // -----------------------
//       if (user.role === 'recruiter') {
//         const jobs = await Job.find({ assignedTo: user._id }).select('_id title type location status');
//         userObj.assignedJobs = jobs || [];

//         if (jobs && jobs.length > 0) {
//           const applicants = await Application.find({ job: { $in: jobs.map(j => j._id) } })
//             .populate('candidate', 'name email phone');
//           userObj.totalApplicants = applicants.length;
//           userObj.applicants = applicants.map(a => ({
//             _id: a.candidate?._id,
//             name: a.candidate?.name,
//             email: a.candidate?.email,
//             phone: a.candidate?.phone,
//             appliedAt: a.appliedAt,
//             jobId: a.job
//           }));
//         } else {
//           userObj.totalApplicants = 0;
//           userObj.applicants = [];
//         }
//       }

//       // -----------------------
//       // For candidate: show applied jobs
//       // -----------------------
//       if (user.role === 'candidate') {
//         const applications = await Application.find({ candidate: user._id })
//           .populate('job', 'title type location status');
//         userObj.appliedJobs = applications.map(a => ({
//           jobId: a.job?._id,
//           title: a.job?.title,
//           type: a.job?.type,
//           location: a.job?.location,
//           status: a.job?.status,
//           appliedAt: a.appliedAt
//         }));
//       }

//       return userObj;
//     }));

//     res.json({ users: usersWithExtra });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordOtp -resetPasswordExpiry');

    // Total users count
    const totalUsers = await User.countDocuments();

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

    res.json({
      totalUsers,
      users: usersWithExtra
    });

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

//     // Parse JSON fields
//     const jsonFields = ['education', 'experiences', 'skills', 'socialLinks'];
//     for (const field of jsonFields) {
//       if (updateData[field] && typeof updateData[field] === 'string') {
//         try { updateData[field] = JSON.parse(updateData[field]); }
//         catch (err) {
//           if (field === 'skills') {
//             updateData[field] = updateData[field].split(',').map(s => s.trim());
//           } else {
//             return res.status(400).json({ message: `Invalid JSON format for ${field}` });
//           }
//         }
//       }
//     }

//     // Handle file uploads
//     if (req.files) {
//       if (req.files['resume']) updateData.resume = req.files['resume'][0].location;
//       if (req.files['profileImage']) updateData.profileImage = req.files['profileImage'][0].location;
//     }

//     // Recalculate name if needed
//     if (updateData.firstName || updateData.middleName || updateData.lastName) {
//       const parts = [updateData.firstName, updateData.middleName, updateData.lastName].filter(Boolean);
//       updateData.name = parts.join(' ');
//     }

//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Update all fields dynamically
//     Object.assign(user, updateData);
//     await user.save(); // triggers pre-save hooks for gap flags

//     const userObj = user.toObject();
//     delete userObj.password;
//     delete userObj.resetPasswordOtp;
//     delete userObj.resetPasswordExpiry;

//     res.json({ message: 'User updated successfully', user: userObj });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse JSON fields (added certifications)
    const jsonFields = ['education', 'experiences', 'skills', 'socialLinks', 'certifications'];
    for (const field of jsonFields) {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (err) {
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
      if (req.files['resume'])
        updateData.resume =
          req.files['resume'][0].location || req.files['resume'][0].path;
      if (req.files['profileImage'])
        updateData.profileImage =
          req.files['profileImage'][0].location || req.files['profileImage'][0].path;
    }

    // Recalculate name if name parts are updated
    if (updateData.firstName || updateData.middleName || updateData.lastName) {
      const parts = [updateData.firstName, updateData.middleName, updateData.lastName].filter(Boolean);
      updateData.name = parts.join(' ');
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Dynamically apply updates
    Object.assign(user, updateData);
    await user.save(); // triggers pre-save hooks (like gap flags)

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


// Get user stats

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


// exports.getRecruiterStats = async (req, res) => {
//   try {
//     const recruiterId = req.params.id;

//     // Ensure the requested user is a recruiter
//     const recruiter = await User.findById(recruiterId).select('name role email');
//     if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
//     if (recruiter.role !== 'recruiter')
//       return res.status(403).json({ message: 'User is not a recruiter' });

//     // Find all jobs assigned to this recruiter
//     const jobs = await Job.find({ assignedTo: recruiterId }).select('_id title department location status');

//     // If recruiter has no jobs
//     if (!jobs.length)
//       return res.json({
//         recruiter: {
//           id: recruiter._id,
//           name: recruiter.name,
//           email: recruiter.email
//         },
//         totalAssignedJobs: 0,
//         totalApplicants: 0,
//         jobs: []
//       });

//     // For each job, find how many applicants applied
//     const jobStats = await Promise.all(
//       jobs.map(async (job) => {
//         const applicantCount = await Application.countDocuments({ job: job._id });
//         return {
//           jobId: job._id,
//           title: job.title,
//           department: job.department,
//           location: job.location,
//           status: job.status,
//           applicantCount
//         };
//       })
//     );

//     const totalApplicants = jobStats.reduce((sum, j) => sum + j.applicantCount, 0);

//     res.json({
//       recruiter: {
//         id: recruiter._id,
//         name: recruiter.name,
//         email: recruiter.email
//       },
//       totalAssignedJobs: jobs.length,
//       totalApplicants,
//       jobs: jobStats
//     });
//   } catch (err) {
//     console.error('Error in getRecruiterStats:', err);
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// };

// ============================
// Get Recruiter Stats (Full Recruiter Details)
// ============================
exports.getRecruiterStats = async (req, res) => {
  try {
    const recruiterId = req.params.id;

    // Find recruiter and include full details
    const recruiter = await User.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    // Ensure user role is recruiter
    if (recruiter.role !== 'recruiter') {
      return res.status(403).json({ message: 'User is not a recruiter' });
    }

    // Find all jobs assigned to this recruiter
    const jobs = await Job.find({ assignedTo: recruiterId }).select('_id title department location status');

    // If recruiter has no jobs assigned
    if (!jobs.length) {
      return res.json({
        recruiter, // full recruiter details
        totalAssignedJobs: 0,
        totalApplicants: 0,
        jobs: []
      });
    }

    // For each job, count number of applicants
    const jobStats = await Promise.all(
      jobs.map(async (job) => {
        const applicantCount = await Application.countDocuments({ job: job._id });
        return {
          jobId: job._id,
          title: job.title,
          department: job.department,
          location: job.location,
          status: job.status,
          applicantCount
        };
      })
    );

    const totalApplicants = jobStats.reduce((sum, j) => sum + j.applicantCount, 0);

    // Final response
    res.json({
      recruiter, // now contains all details like name, email, phone, etc.
      totalAssignedJobs: jobs.length,
      totalApplicants,
      jobs: jobStats
    });
  } catch (err) {
    console.error('Error in getRecruiterStats:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// GET MY PROFILE  (for any logged-in user)
exports.getMyProfile = async (req, res) => {
  try {
    // req.user is set by your auth middleware
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};


// ==========================================
// Update My Profile (based on token)
// ==========================================
// exports.updateMyProfile = async (req, res) => {
//   try {
//     let updates = { ...req.body };

//     // ✅ Handle uploaded files (profile image and resume)
//     if (req.files) {
//       if (req.files.profileImage && req.files.profileImage[0]) {
//         updates.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
//       }
//       if (req.files.resume && req.files.resume[0]) {
//         updates.resume = `/uploads/${req.files.resume[0].filename}`;
//       }
//     }

//     // ✅ Update the user document
//     const updatedUser = await User.findByIdAndUpdate(
//       req.user._id,
//       { $set: updates },
//       { new: true }
//     ).select('-password');

//     if (!updatedUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({
//       message: 'Profile updated successfully',
//       user: updatedUser,
//     });
//   } catch (err) {
//     console.error('Error in updateMyProfile:', err);
//     res.status(500).json({
//       message: 'Server error',
//       error: err.message,
//     });
//   }
// };

exports.updateMyProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // ✅ Parse JSON/string fields
    const jsonFields = ['education', 'experiences', 'skills', 'socialLinks', 'certifications'];
    for (const field of jsonFields) {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (err) {
          if (field === 'skills') {
            updateData[field] = updateData[field].split(',').map(s => s.trim());
          } else {
            return res.status(400).json({ message: `Invalid JSON format for ${field}` });
          }
        }
      }
    }

    // ✅ Handle file uploads (local paths)
    if (req.files) {
      if (req.files['profileImage'] && req.files['profileImage'][0]) {
        updateData.profileImage = `/uploads/${req.files['profileImage'][0].filename}`;
      }
      if (req.files['resume'] && req.files['resume'][0]) {
        updateData.resume = `/uploads/${req.files['resume'][0].filename}`;
      }
    }

    // ✅ Recalculate full name if name parts are updated
    if (updateData.firstName || updateData.middleName || updateData.lastName) {
      const parts = [updateData.firstName, updateData.middleName, updateData.lastName].filter(Boolean);
      updateData.name = parts.join(' ');
    }

    // ✅ Update current logged-in user
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    Object.assign(user, updateData);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordOtp;
    delete userObj.resetPasswordExpiry;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userObj
    });
  } catch (err) {
    console.error('Error in updateMyProfile:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};

// Get All Recruiters (Admin only)
exports.getAllRecruiters = async (req, res) => {
  try {
    // 1️⃣ Fetch all recruiters
    const recruiters = await User.find({ role: 'recruiter' })
      .select('-password -resetPasswordOtp -resetPasswordExpiry');

    // 2️⃣ Enrich each recruiter with jobs + applicants
    const recruitersWithData = await Promise.all(
      recruiters.map(async (recruiter) => {
        const recruiterObj = recruiter.toObject();

        // 🔹 Get jobs assigned to this recruiter
        const jobs = await Job.find({ assignedTo: recruiter._id })
          .select('title type location status closingDate');

        // 🔹 For each job → get applicants
        const jobsWithApplicants = await Promise.all(
          jobs.map(async (job) => {
            const applications = await Application.find({ job: job._id })
              .populate('candidate', 'name email phoneNumber')
              .select('appliedAt stage');

            return {
              jobId: job._id,
              title: job.title,
              type: job.type,
              location: job.location,
              status: job.status,
              closingDate: job.closingDate,
              applicantCount: applications.length,
              applicants: applications.map(app => ({
                candidateId: app.candidate?._id,
                name: app.candidate?.name,
                email: app.candidate?.email,
                phoneNumber: app.candidate?.phoneNumber,
                stage: app.stage,
                appliedAt: app.appliedAt
              }))
            };
          })
        );

        // 🔹 Total applicants handled by recruiter
        const totalApplicants = jobsWithApplicants.reduce(
          (sum, job) => sum + job.applicantCount,
          0
        );

        return {
          ...recruiterObj,
          totalAssignedJobs: jobsWithApplicants.length,
          totalApplicants,
          assignedJobs: jobsWithApplicants
        };
      })
    );

    // 3️⃣ Final response
    res.status(200).json({
      totalRecruiters: recruitersWithData.length,
      recruiters: recruitersWithData
    });

  } catch (err) {
    console.error('❌ Error in getAllRecruiters:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};



// Get Recruiter Profile (based on recruiter token)
exports.getMyRecruiterProfile = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    // Fetch recruiter profile
    const recruiter = await User.findById(recruiterId)
      .select('-password -resetPasswordOtp -resetPasswordExpiry');

    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    if (recruiter.role !== 'recruiter') {
      return res.status(403).json({
        message: 'Access denied. Not a recruiter.'
      });
    }


    // Fetch assigned jobs
    const jobs = await Job.find({ assignedTo: recruiterId })
      .select('_id title type location status team createdAt');

    // Fetch applicants for these jobs
    const jobIds = jobs.map(job => job._id);

    let applications = [];
    if (jobIds.length > 0) {
      applications = await Application.find({ job: { $in: jobIds } })
        .populate('candidate', 'name email phoneNumber')
        .populate('job', 'title');
    }

    // Build job-wise applicant data
    const jobsWithApplicants = jobs.map(job => {
      const jobApplicants = applications.filter(
        app => app.job && app.job._id.toString() === job._id.toString()
      );

      return {
        jobId: job._id,
        title: job.title,
        type: job.type,
        location: job.location,
        status: job.status,
        team: job.team,
        totalApplicants: jobApplicants.length,
        applicants: jobApplicants.map(app => ({
          applicationId: app._id,
          candidate: app.candidate,
          stage: app.stage,
          appliedAt: app.appliedAt
        }))
      };
    });

    // Final response
    res.status(200).json({
      message: 'Recruiter profile fetched successfully',
      recruiter,
      stats: {
        totalAssignedJobs: jobs.length,
        totalApplicants: applications.length
      },
      assignedJobs: jobsWithApplicants
    });

  } catch (err) {
    console.error('Error in getMyRecruiterProfile:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};
