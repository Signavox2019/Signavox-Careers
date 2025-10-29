const User = require('../models/User');
const s3 = require('../utils/s3');

// =============================
// GET PERSONAL DETAILS
// =============================
exports.getPersonalDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'firstName middleName lastName gender DOB email phoneNumber pan permanentAddress currentAddress socialLinks profileImage team role'
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Personal details fetched successfully',
      personalDetails: user
    });
  } catch (error) {
    console.error('Error fetching personal details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =============================
// UPDATE PERSONAL DETAILS (Only address & social links)
// =============================
exports.updatePersonalDetails = async (req, res) => {
  try {
    const { permanentAddress, currentAddress, socialLinks } = req.body;
    const updateData = {};

    if (permanentAddress !== undefined) updateData.permanentAddress = permanentAddress;
    if (currentAddress !== undefined) updateData.currentAddress = currentAddress;

    if (socialLinks && typeof socialLinks === 'object') {
      updateData['socialLinks.linkedin'] = socialLinks.linkedin;
      updateData['socialLinks.github'] = socialLinks.github;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(
      'firstName middleName lastName gender DOB email phoneNumber pan permanentAddress currentAddress socialLinks profileImage team role'
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Personal details updated successfully',
      personalDetails: user
    });
  } catch (error) {
    console.error('Error updating personal details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =============================
// EDUCATION DETAILS (ID-based)
// =============================
exports.addEducation = async (req, res) => {
  try {
    const { education } = req.body;
    const user = await User.findById(req.user.id);
    user.education.push(education);
    await user.save();

    res.json({
      message: 'Education added successfully',
      education: user.education
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getEducation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('education');
    res.json(user.education);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// =============================
// GET EDUCATION BY ID
// =============================
exports.getEducationById = async (req, res) => {
  try {
    const { eduId } = req.params;

    const user = await User.findById(req.user.id).select('education');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const educationRecord = user.education.id(eduId);
    if (!educationRecord) {
      return res.status(404).json({ message: 'Education record not found' });
    }

    res.json({
      message: 'Education record fetched successfully',
      education: educationRecord
    });
  } catch (error) {
    console.error('Error fetching education by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// =============================
// UPDATE EDUCATION BY ID
// =============================
exports.updateEducation = async (req, res) => {
  try {
    const { eduId } = req.params;
    const { education } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find education by subdocument ID
    const educationRecord = user.education.id(eduId);
    if (!educationRecord) {
      return res.status(404).json({ message: 'Education record not found' });
    }

    // Update all fields provided in the body
    Object.assign(educationRecord, education);

    await user.save();

    res.json({
      message: 'Education details updated successfully',
      updatedEducation: educationRecord
    });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =============================
// DELETE EDUCATION BY ID
// =============================
exports.deleteEducation = async (req, res) => {
  try {
    const { eduId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find education record
    const educationRecord = user.education.id(eduId);
    if (!educationRecord) {
      return res.status(404).json({ message: 'Education record not found' });
    }

    // Remove the subdocument
    educationRecord.deleteOne();
    await user.save();

    res.json({
      message: 'Education deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// =============================
// EXPERIENCE DETAILS (ID-based)
// =============================
exports.addExperience = async (req, res) => {
  try {
    const { experience } = req.body;
    const user = await User.findById(req.user.id);
    user.experiences.push(experience);
    user.experienced = true;
    await user.save();

    res.json({
      message: 'Experience added successfully',
      experiences: user.experiences
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getExperiences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('experiences experienced');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    const { expId } = req.params;
    const { experience } = req.body;

    const user = await User.findById(req.user.id);
    const expRecord = user.experiences.id(expId);
    if (!expRecord) return res.status(404).json({ message: 'Experience record not found' });

    Object.keys(experience).forEach(key => {
      expRecord[key] = experience[key];
    });

    await user.save();

    res.json({
      message: 'Experience updated successfully',
      updatedExperience: expRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteExperience = async (req, res) => {
  try {
    const { expId } = req.params;
    const user = await User.findById(req.user.id);

    const expRecord = user.experiences.id(expId);
    if (!expRecord) return res.status(404).json({ message: 'Experience record not found' });

    expRecord.deleteOne();
    await user.save();

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getExperienceById = async (req, res) => {
  try {
    const { expId } = req.params;

    const user = await User.findById(req.user.id).select('experiences');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const experienceRecord = user.experiences.id(expId);
    if (!experienceRecord) {
      return res.status(404).json({ message: 'Experience record not found' });
    }

    res.json({
      message: 'Experience record fetched successfully',
      experience: experienceRecord
    });
  } catch (error) {
    console.error('Error fetching experience by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// =============================
// CERTIFICATIONS (ID-based)
// =============================
exports.addCertification = async (req, res) => {
  try {
    const { certification } = req.body;
    const user = await User.findById(req.user.id);
    user.certifications.push(certification);
    await user.save();

    res.json({
      message: 'Certification added successfully',
      certifications: user.certifications
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCertifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('certifications');
    res.json(user.certifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    const { certId } = req.params;
    const { certification } = req.body;

    const user = await User.findById(req.user.id);
    const certRecord = user.certifications.id(certId);
    if (!certRecord) return res.status(404).json({ message: 'Certification record not found' });

    Object.keys(certification).forEach(key => {
      certRecord[key] = certification[key];
    });

    await user.save();

    res.json({
      message: 'Certification updated successfully',
      updatedCertification: certRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteCertification = async (req, res) => {
  try {
    const { certId } = req.params;
    const user = await User.findById(req.user.id);

    const certRecord = user.certifications.id(certId);
    if (!certRecord) return res.status(404).json({ message: 'Certification record not found' });

    certRecord.deleteOne();
    await user.save();

    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCertificationById = async (req, res) => {
  try {
    const { certId } = req.params;

    const user = await User.findById(req.user.id).select('certifications');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const certificationRecord = user.certifications.id(certId);
    if (!certificationRecord) {
      return res.status(404).json({ message: 'Certification record not found' });
    }

    res.json({
      message: 'Certification record fetched successfully',
      certification: certificationRecord
    });
  } catch (error) {
    console.error('Error fetching certification by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Add skills

exports.addSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: 'Please provide skills as a non-empty array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { skills: { $each: skills } } }, // prevents duplicates
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Skills added successfully',
      skills: user.skills
    });
  } catch (error) {
    console.error('Error adding skills:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// update skills

exports.updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ message: 'Please provide skills as an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { skills },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Skills updated successfully',
      skills: user.skills
    });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
//remove skills

exports.removeSkill = async (req, res) => {
  try {
    const { skill } = req.body; // single skill to remove

    if (!skill) {
      return res.status(400).json({ message: 'Please provide a skill to remove' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { skills: skill } },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: `Skill '${skill}' removed successfully`,
      skills: user.skills
    });
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//get skills
exports.getSkills = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('skills');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Skills fetched successfully',
      skills: user.skills || []
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// ADD RESUME (UPLOAD TO S3)

exports.addResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file' });
    }

    const resumeUrl = req.file.location; // S3 URL

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resume: resumeUrl },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: user.resume,
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// UPDATE RESUME (REPLACE FILE)

exports.updateResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If there is an old resume, delete it from S3 first
    if (user.resume) {
      const oldKey = user.resume.split('.amazonaws.com/')[1];
      await s3.deleteObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: oldKey }).promise();
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a new resume file' });
    }

    const resumeUrl = req.file.location;

    user.resume = resumeUrl;
    await user.save();

    res.json({
      message: 'Resume updated successfully',
      resumeUrl: user.resume,
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// DELETE RESUME (REMOVE FROM S3 & DB)
exports.deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resume) {
      return res.status(400).json({ message: 'No resume to delete' });
    }

    const key = user.resume.split('.amazonaws.com/')[1];

    // Delete from S3
    await s3.deleteObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }).promise();

    // Remove from DB
    user.resume = null;
    await user.save();

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

