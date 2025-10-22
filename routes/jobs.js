const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');

// Public routes
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

// Admin routes
router.get('/stats/summary', auth, permit('admin'), jobController.getJobStats);
router.post('/', auth, permit('admin'), jobController.createJob);
router.put('/:id', auth, permit('admin'), jobController.updateJob);
router.delete('/:id', auth, permit('admin'), jobController.deleteJob);

// Manually close a job
router.put('/:id/close', auth, permit('admin'), jobController.closeJob);

module.exports = router;
