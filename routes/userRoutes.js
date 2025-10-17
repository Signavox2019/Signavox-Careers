const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware'); // ✅ S3 upload middleware

// All routes require authentication
router.use(auth);

// Get all users (admin only)
router.get('/', permit('admin'), userController.getAllUsers);

// Get user by ID (admin or the user themselves)
router.get('/:id', permit('admin', 'recruiter', 'candidate'), userController.getUserById);

// ✅ Update user by ID (with resume upload)
router.put('/:id', permit('admin', 'recruiter', 'candidate'), upload.single('resume'), userController.updateUser);

// Delete user by ID (admin only)
router.delete('/:id', permit('admin'), userController.deleteUser);

module.exports = router;
