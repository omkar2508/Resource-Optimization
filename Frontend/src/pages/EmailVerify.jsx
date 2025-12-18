import React, { useRef, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom"; // ✅ FIXED
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";

const EmailVerify = () => {
  axios.defaults.withCredentials = true;

  const navigate = useNavigate();
  const { backendURL, userData, getUserData, isLoggedIn } = useAppContext();

  const inputRefs = useRef([]);

  // ==========================
  // OTP INPUT HANDLERS
  // ==========================
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
    const paste = e.clipboardData.getData("text").trim().slice(0, 6);
    paste.split("").forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  // ==========================
  // VERIFY OTP
  // ==========================
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const otpArray = inputRefs.current.map((ref) => ref.value);
    const otp = otpArray.join("");

    if (otp.length !== 6) return toast.error("Enter 6 digit OTP");

    try {
      const { data } = await axios.post(
        backendURL + "/api/auth/verify-account",
        {
          otp,
          userId: userData?._id,
        }
      );

      if (data.success) {
        toast.success("Email Verified Successfully!");
        await getUserData();
        navigate("/");
      } else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification Failed");
    }
  };

  // Auto-redirect if already verified
  useEffect(() => {
    if (isLoggedIn && userData?.isAccountVerified) {
      navigate("/");
    }
  }, [isLoggedIn, userData]);

  return (
    <div className="relative flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* LEFT TOP — ResourceOPT */}
      {/* <div className="absolute left-5 sm:left-10 top-5 flex items-center space-x-2 cursor-pointer">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="font-bold text-xl text-gray-800">ResourceOPT</span>
        </Link>
      </div> */}

      {/* RIGHT TOP — Auth Logo */}
      {/* <img
        src={assets.logo}
        alt="auth logo"
        className="absolute right-4 sm:right-10 top-5 w-24 sm:w-28"
      /> */}
      <Navbar></Navbar>

      {/* OTP FORM */}
      <form
        onSubmit={onSubmitHandler}
        className="bg-slate-900 p-8 rounded-lg shadow-lg w-full sm:w-96 text-sm relative z-10"
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
                ref={(e) => (inputRefs.current[index] = e)}
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
  );
};

export default EmailVerify;
