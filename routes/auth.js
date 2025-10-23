const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.post(
  '/register',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
  ]),
  authController.registerCandidate
);


router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/reset-password', authController.resetPassword);

// Admin creates recruiter/admin
// router.post('/create-user', auth, permit('admin'), authController.createUserByAdmin);
router.post('/create-user', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]), auth, permit('admin'), authController.createUserByAdmin);

module.exports = router;
