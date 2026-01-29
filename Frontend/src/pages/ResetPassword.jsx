import React, { useState, useRef, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";

const ResetPassword = () => {
  const { backendURL } = useAppContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  // Step 1 — SEND OTP
  const onSubmitEmail = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        backendURL + "/api/auth/send-reset-otp",
        { email },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    }
  };

  // Step 2 — SUBMIT OTP
  const onSubmitOtp = (e) => {
    e.preventDefault();

    const otpArray = inputRefs.current.map((e) => e.value);
    const otp = otpArray.join("");

    if (otp.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }

    setOtp(otp);
    setIsOtpSubmitted(true);
  };

  // Step 3 — SUBMIT NEW PASSWORD
  const onSubmitNewPassword = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        backendURL + "/api/auth/reset-password",
        {
          email,
          otp,
          newPassword,
        },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Password changed successfully");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
    }
  };

  // OTP Behavior
  const handleInput = (e, index) => {
    if (e.target.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && e.target.value === "") {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    paste.split("").forEach((char, i) => {
      if (inputRefs.current[i]) inputRefs.current[i].value = char;
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center relative p-4 overflow-hidden">
      {/* BLURRED BACKGROUND BLOBS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-pink-300 rounded-full blur-2xl opacity-10 animate-blob-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300 rounded-full blur-2xl opacity-10 animate-blob-slow animation-delay-3000"></div>
      </div>

     
      <Navbar />

      {/* CONTENT CARD */}
      <div className="relative z-30 bg-slate-900 px-10 py-10 rounded-xl shadow-xl w-full max-w-md text-indigo-300">
        {/* Step 1 — Email */}
        {!isEmailSent && (
          <form onSubmit={onSubmitEmail}>
            <h1 className="text-white text-3xl font-semibold text-center mb-4">
              Reset Password
            </h1>

            <p className="text-center mb-6">
              Enter your registered email address
            </p>

            <div className="mb-4 flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#333A5C]">
              <img src={assets.mail_icon} className="w-4" />
              <input
                type="email"
                className="bg-transparent outline-none text-white w-full"
                placeholder="Email id"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white">
              Send OTP
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {isEmailSent && !isOtpSubmitted && (
          <form onSubmit={onSubmitOtp}>
            <h1 className="text-white text-3xl font-semibold text-center mb-4">
              Enter OTP
            </h1>

            <p className="text-center mb-6">
              Enter the 6-digit verification code sent to your email.
            </p>

            <div className="flex justify-between mb-8">
              {Array(6)
                .fill("")
                .map((_, i) => (
                  <input
                    key={i}
                    maxLength={1}
                    className="w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md"
                    ref={(el) => (inputRefs.current[i] = el)}
                    onInput={(e) => handleInput(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                  />
                ))}
            </div>

            <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white">
              Verify OTP
            </button>
          </form>
        )}

        {/* Step 3 — New Password */}
        {isOtpSubmitted && (
          <form onSubmit={onSubmitNewPassword}>
            <h1 className="text-white text-3xl font-semibold text-center mb-4">
              New Password
            </h1>

            <p className="text-center mb-6">Create a new password</p>

            <div className="mb-4 flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#333A5C]">
              <img src={assets.lock_icon} className="w-4" />
              <input
                type="password"
                className="bg-transparent outline-none text-white w-full"
                placeholder="New password"
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
