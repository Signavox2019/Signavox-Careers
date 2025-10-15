const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');

// All routes require authentication
router.use(auth);

// Get all users (admin only)
router.get('/', permit('admin'), userController.getAllUsers);

// Get user by ID (admin or the user themselves)
router.get('/:id', permit('admin', 'recruiter', 'candidate'), userController.getUserById);

// Update user by ID (admin or the user themselves)
router.put('/:id', permit('admin', 'recruiter', 'candidate'), userController.updateUser);

// Delete user by ID (admin only)
router.delete('/:id', permit('admin'), userController.deleteUser);

module.exports = router;

// Get user by ID (admin or the user themselves)
router.get('/:id', permit('admin', 'recruiter', 'candidate'), userController.getUserById);

// Update user by ID (admin or the user themselves)
router.put('/:id', permit('admin', 'recruiter', 'candidate'), userController.updateUser);

// Delete user by ID (admin only)
router.delete('/:id', permit('admin'), userController.deleteUser);

module.exports = router;
