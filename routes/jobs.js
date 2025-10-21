const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

// Admin routes with document upload
router.post('/', auth, permit('admin'), jobController.createJob);
router.put('/:id', auth, permit('admin'), jobController.updateJob);
router.delete('/:id', auth, permit('admin'), jobController.deleteJob);

// Close job early
router.put('/:id/close', auth, permit('admin'), jobController.closeJob);

// ✅ New route: Job Statistics
router.get('/stats/summary', auth, permit('admin'), jobController.getJobStats);

module.exports = router;
