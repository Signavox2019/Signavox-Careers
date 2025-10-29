const express = require('express');
const router = express.Router();
const controller = require('../controllers/userDetailsController');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/uploadMiddleware');

// PERSONAL DETAILS
router.get('/personal', auth, controller.getPersonalDetails);
router.put('/personal', auth, controller.updatePersonalDetails);

// EDUCATION
router.get('/education', auth, controller.getEducation);
router.post('/education', auth, controller.addEducation);
router.get('/education/:eduId', auth,controller.getEducationById);
router.put('/education/:eduId', auth, controller.updateEducation);
router.delete('/education/:eduId', auth, controller.deleteEducation);


// EXPERIENCE
router.get('/experience', auth, controller.getExperiences);
router.post('/experience', auth, controller.addExperience);
router.get('/experience/:expId', auth,controller.getExperienceById);
router.put('/experience/:expId', auth, controller.updateExperience);
router.delete('/experience/:expId', auth, controller.deleteExperience);

// SKILLS
router.get('/skills', auth, controller.getSkills);
router.post('/skills', auth, controller.addSkills);
router.put('/skills/', auth, controller.updateSkills);
router.delete('/skills', auth, controller.removeSkill);
  

// CERTIFICATIONS
router.get('/certifications', auth, controller.getCertifications);
router.post('/certifications', auth, controller.addCertification);
router.get('/certifications/:certId', auth,controller.getCertificationById);
router.put('/certifications/:certId', auth, controller.updateCertification);
router.delete('/certifications/:certId', auth, controller.deleteCertification);

// RESUME ROUTES
router.post('/resume', auth, upload.single('resume'), controller.addResume);
router.put('/resume', auth, upload.single('resume'), controller.updateResume);
router.delete('/resume', auth, controller.deleteResume);


module.exports = router;
