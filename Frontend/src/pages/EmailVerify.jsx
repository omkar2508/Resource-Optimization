import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";

const EmailVerify = () => {
  const navigate = useNavigate();

  // ✅ use axios from AppContext ONLY
  const { axios, userData, getUserData } = useAppContext();

  const inputRefs = useRef([]);

  // ==========================
  // OTP INPUT HANDLERS
  // ==========================
  const handleInput = (e, index) => {
    if (e.target.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    paste.split("").forEach((char, i) => {
      if (inputRefs.current[i]) {
        inputRefs.current[i].value = char;
      }
    });
  };

  // ==========================
  // VERIFY OTP
  // ==========================
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const otp = inputRefs.current.map((ref) => ref.value).join("");

    if (otp.length !== 6) {
      return toast.error("Please Enter 6 digit OTP");
    }

    try {
      const { data } = await axios.post("/api/auth/verify-account", {
        otp,
        userId: userData?._id,
      });

      if (data.success) {
        toast.success("Email Verified Successfully!");
        await getUserData();
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification Failed");
    }
  };

  // ==========================
  // AUTO SEND OTP ON PAGE LOAD
  // ==========================
  useEffect(() => {
    const sendOtp = async () => {
      try {
        await axios.post("/api/auth/send-verify-otp");
        toast.success("OTP sent to your email");
      } catch (err) {
        toast.error("Failed to send OTP");
      }
    };

    sendOtp();
  }, [axios]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Navbar />

      <div className="flex items-center justify-center min-h-screen px-6">
        <form
          onSubmit={onSubmitHandler}
          className="bg-slate-900 p-8 rounded-lg shadow-lg w-full max-w-sm text-sm"
        >
          <h1 className="text-white text-2xl font-semibold text-center mb-4">
            Email Verification
          </h1>

          <p className="text-center mb-6 text-indigo-300">
            Enter the 6-digit OTP sent to your email
          </p>

          <div className="flex justify-between mb-8">
            {Array(6)
              .fill("")
              .map((_, index) => (
                <input
                  key={index}
                  maxLength={1}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md"
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                />
              ))}
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full">
            Verify Email
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerify;
