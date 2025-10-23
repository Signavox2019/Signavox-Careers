const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware');

// All routes require authentication
router.use(auth);

// Get all users (admin only)
router.get('/', permit('admin'), userController.getAllUsers);

// Get user by ID (admin, recruiter, or self)
router.get('/:id', permit('admin', 'recruiter', 'candidate'), userController.getUserById);

// Update user (with resume/profileImage upload)
// router.put('/:id', permit('admin', 'recruiter', 'candidate'), upload.single('resume'), userController.updateUser);
router.put(
  '/:id',
  permit('admin', 'recruiter', 'candidate'),
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
  ]),
  userController.updateUser
);


// Delete user (admin only)
router.delete('/:id', permit('admin'), userController.deleteUser);

module.exports = router;
