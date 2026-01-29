import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  isAccountVerified: { type: Boolean, default: false },
  verifyOtp: { type: String, default: "" },
  verifyOtpExpiryAt: { type: Number, default: 0 },
  resetOtp: { type: String, default: "" },
  resetOtpExpireAt: { type: Number, default: 0 },

  role: { 
    type: String, 
    enum: ["superadmin", "admin", "teacher", "student"], 
    default: "student" 
  },

  department: { 
    type: String,
    enum: [
      "Computer Engineering",
      "IT Engineering", 
      "AI Engineering",
      "Software Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
      "Administration" 
    ],
    required: function() {
      return this.role === "admin" || this.role === "teacher";
    }
  },

subjects: [{
  code: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  department: { type: String, required: true }
}],


  admissionYear: { type: Number },
  division: { type: String },
  batch: { type: String, default: "" },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ role: 1, department: 1 });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;