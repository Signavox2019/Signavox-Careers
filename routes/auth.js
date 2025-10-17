const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const { permit } = require('../middlewares/roles');
const upload = require('../middlewares/uploadMiddleware'); // S3 upload middleware

// Register as candidate (with resume upload to S3)
router.post('/register', upload.single('resume'), authController.registerCandidate);

// Login
router.post('/login', authController.login);

// Admin creates recruiter/admin
router.post('/create-user', auth, permit('admin'), authController.createUserByAdmin);

// Reset Password using OTP
router.post('/reset-password', authController.resetPassword);

// Send OTP for verification / password reset
router.post('/send-otp', authController.sendOTP);

module.exports = router;
