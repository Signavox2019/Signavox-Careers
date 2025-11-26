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

// get education details
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


// ADD RESUME
exports.addResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    const resumeObj = {
      fileUrl: req.file.location,
      isPrimary: false
    };

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Add to resumes array
    user.resumes.push(resumeObj);

    // If no primary resume exists, set this as primary
    if (!user.resumes.some(r => r.isPrimary)) {
      resumeObj.isPrimary = true;
      user.resume = resumeObj.fileUrl; // update main resume field
    }

    await user.save();

    res.json({
      message: "Resume added successfully",
      resumes: user.resumes
    });

  } catch (error) {
    console.error("Add Resume Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// UPDATE RESUME
exports.updateResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a resume file" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const resumeRecord = user.resumes.id(resumeId);
    if (!resumeRecord) return res.status(404).json({ message: "Resume not found" });

    // Delete old file from S3
    const oldKey = resumeRecord.fileUrl.split(".amazonaws.com/")[1];
    if (oldKey) {
      await s3.deleteObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: oldKey }).promise();
    }

    // Update resume with new file
    resumeRecord.fileUrl = req.file.location;

    // If this resume is primary, update parent "resume" field
    if (resumeRecord.isPrimary) {
      user.resume = resumeRecord.fileUrl;
    }

    await user.save();

    res.json({
      message: "Resume updated successfully",
      resume: resumeRecord
    });

  } catch (error) {
    console.error("Update Resume Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// DELETE RESUME
exports.deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const resumeRecord = user.resumes.id(resumeId);
    if (!resumeRecord) return res.status(404).json({ message: "Resume not found" });

    // ❌ Cannot delete if it's the primary resume
    if (resumeRecord.isPrimary) {
      return res.status(400).json({ 
        message: "Cannot delete primary resume. Mark another resume as primary first." 
      });
    }

    // Delete from S3
    const key = resumeRecord.fileUrl.split(".amazonaws.com/")[1];
    await s3.deleteObject({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }).promise();

    // Remove from array
    resumeRecord.deleteOne();
    await user.save();

    res.json({ message: "Resume deleted successfully" });

  } catch (error) {
    console.error("Delete Resume Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// get all resumes
exports.getAllResumes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("resumes");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Resumes fetched successfully",
      resumes: user.resumes
    });

  } catch (error) {
    console.error("Get Resumes Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Mark the resume as primary

exports.markPrimaryResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const resumeRecord = user.resumes.id(resumeId);
    if (!resumeRecord) return res.status(404).json({ message: "Resume not found" });

    // Remove primary from all
    user.resumes.forEach(r => (r.isPrimary = false));

    // Mark selected as primary
    resumeRecord.isPrimary = true;
    user.resume = resumeRecord.fileUrl; // update main field

    await user.save();

    res.json({
      message: "Primary resume updated successfully",
      primaryResume: resumeRecord
    });

  } catch (error) {
    console.error("Primary Resume Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

