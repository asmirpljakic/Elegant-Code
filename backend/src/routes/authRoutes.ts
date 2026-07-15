import express from 'express';
import { registerUser, loginUser, verifyOTP, resendOTP } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

export default router;
