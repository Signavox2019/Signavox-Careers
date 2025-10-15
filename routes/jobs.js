const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');

// public list
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

// admin create/update/delete
router.post('/', auth, permit('admin'), jobController.createJob);
router.put('/:id', auth, permit('admin'), jobController.updateJob);
router.delete('/:id', auth, permit('admin'), jobController.deleteJob);

module.exports = router;
