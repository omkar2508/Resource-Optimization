import express from 'express';
import { 
    register, 
    login, 
    logout, 
    sendVerifyOtp, 
    verifyEmail, 
    isAuthenticated,
    sendResetOtp,
    resetPassword
} from '../controllers/authController.js';

import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Auth
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

// Email Verification
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);  
authRouter.post("/verify-account", userAuth, verifyEmail);


// Authentication check
authRouter.get('/is-auth', userAuth, isAuthenticated);

// Reset Password
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;
