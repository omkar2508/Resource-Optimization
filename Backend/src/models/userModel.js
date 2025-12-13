import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, 
    },
    email: {
        type: String,   
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },

    // Email verification OTP
    verifyOtp: {
        type: String,
        default: '',
    },
    verifyOtpExpiryAt: {
        type: Number,
        default: 0,
    },
    isAccountVerified: {
        type: Boolean,
        default: false,
    },

    // Reset password OTP
    resetOtp: {
        type: String,
        default: '',    
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0,
    },
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;
