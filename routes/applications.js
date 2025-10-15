const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware'); // S3 upload middleware

// Apply to job (resume uploaded to S3)
router.post('/apply', auth, upload.single('resume'), applicationController.applyToJob);

// Get applications (role-based)
router.get('/', auth, applicationController.getApplications);

// Admin assigns application to recruiter
router.post('/assign', auth, permit('admin'), applicationController.assignToRecruiter);

// Update application status (recruiter or admin)
router.put('/:applicationId/status', auth, applicationController.updateApplicationStatus);

module.exports = router;
