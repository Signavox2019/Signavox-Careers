const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');

// All routes require authentication
router.use(auth);

// ✅ Candidate: Get Upcoming Interview Events
router.get('/my-upcoming', auth,permit('candidate'), eventController.getUpcomingEvents);

module.exports = router;
