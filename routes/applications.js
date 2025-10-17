const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware'); // S3 upload middleware

// Apply to job (resume uploaded to S3)
router.post('/apply', auth, upload.single('resume'), applicationController.applyToJob);

// Get all applications (role-based)
router.get('/', auth, applicationController.getApplications);

// ✅ Get my applications (based on token)
router.get('/my', auth, permit('candidate'), applicationController.getMyApplications);

// Admin assigns application to recruiter
router.post('/assign', auth, permit('admin'), applicationController.assignToRecruiter);

// Update application status (recruiter or admin)
router.put('/:applicationId/stage', auth, applicationController.updateApplicationStatus);

// Delete an application (admin or candidate who applied)
router.delete('/:applicationId', auth, permit('admin', 'candidate'), applicationController.deleteApplication);

// Application statistics (admin/recruiter)
router.get('/stats/overview', auth, permit('admin', 'recruiter'), applicationController.getApplicationStatistics);

// ✅ Manual offer letter generation (optional, admin/recruiter)
router.post('/:applicationId/offerletter', auth, permit('admin', 'recruiter'), applicationController.generateOfferLetterManually);

// Get my offer letter (candidate/admin/recruiter)
router.get('/:applicationId/offerletter', auth, applicationController.getOfferLetter);



module.exports = router;
