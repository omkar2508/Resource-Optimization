import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  Calendar,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";

/* =========================
   Department → Divisions
========================= */
const departmentDivisions = {
  "Software Engineering": ["1"], // only one div - auto assigned
  "AI Engineering": ["1", "2", "3"], // multiple divisions - user selects
  "Computer Engineering": ["1", "2"], // multiple divisions - user selects
  "IT Engineering": ["1", "2"], // multiple divisions - user selects
};

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const initialState = location.state?.mode === "signup" ? "Sign Up" : "Login";
  const [state, setState] = useState(initialState);

  const { login, signup } = useAppContext();

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [department, setDepartment] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [division, setDivision] = useState("");

  /* =========================
     Auto-select division
  ========================= */
  useEffect(() => {
    if (!department) {
      setDivision(""); // Reset division when no department selected
      return;
    }

    const divs = departmentDivisions[department] || [];
    if (divs.length === 1) {
      setDivision(divs[0]); // auto assign when only one division
    } else {
      setDivision(""); // reset to allow user selection when multiple divisions
    }
  }, [department]);

  useEffect(() => {
    if (location.state?.mode === "signup") setState("Sign Up");
    else if (location.state?.mode === "login") setState("Login");
  }, [location]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      if (state === "Sign Up") {
        if (!department || !admissionYear || !division) {
          return toast.error("Please fill all required fields");
        }

        await signup(
          name,
          email,
          password,
          department,
          Number(admissionYear),
          division,
        );
      } else {
        await login(email, password);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center relative overflow-hidden p-4">
      <Navbar />

      {/* CENTER CARD */}
      <div className="relative z-20 bg-slate-900 px-4 sm:px-6 md:px-10 py-8 sm:py-10 md:py-12 rounded-lg sm:rounded-xl shadow-xl w-full max-w-md text-indigo-300">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-2 sm:mb-3">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </h2>

        <p className="text-center text-xs sm:text-sm mb-4 sm:mb-6">
          {state === "Sign Up"
            ? "Create your account!"
            : "Login to your account!"}
        </p>

        <form onSubmit={onSubmitHandler}>
          {/* NAME */}
          {state === "Sign Up" && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
              <img
                src={assets.person_icon}
                alt=""
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              />
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="bg-transparent outline-none w-full text-white text-sm sm:text-base placeholder:text-white"
                type="text"
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          {/* DEPARTMENT */}
          {state === "Sign Up" && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full bg-transparent text-white focus:outline-none text-sm sm:text-base"
              >
                <option value="" className="text-black">
                  Select Department
                </option>
                {Object.keys(departmentDivisions).map((dept) => (
                  <option key={dept} value={dept} className="text-black">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DIVISION */}
          {state === "Sign Up" && department && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  required
                  className={`w-full bg-transparent text-white focus:outline-none text-sm sm:text-base ${
                    departmentDivisions[department]?.length === 1
                      ? "opacity-75 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  disabled={departmentDivisions[department]?.length === 1}
                >
                  <option value="" className="text-black bg-white">
                    {departmentDivisions[department]?.length === 1
                      ? `Division ${departmentDivisions[department][0]} (Auto Assigned)`
                      : "Select Division"}
                  </option>
                  {departmentDivisions[department]?.map((div) => (
                    <option
                      key={div}
                      value={div}
                      className="text-black bg-white"
                    >
                      Division {div}
                    </option>
                  ))}
                </select>
              </div>
              {departmentDivisions[department]?.length > 1 && (
                <p className="text-xs text-indigo-400 mt-1 ml-2">
                  {departmentDivisions[department].length} divisions available
                </p>
              )}
            </div>
          )}

          {/* ADMISSION YEAR */}
          {state === "Sign Up" && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <select
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                required
                className="w-full bg-transparent text-white focus:outline-none text-sm sm:text-base"
              >
                <option value="" className="text-black">
                  Admission Year
                </option>
                {[2021, 2022, 2023, 2024, 2025].map((year) => (
                  <option key={year} value={year} className="text-black">
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
            <img
              src={assets.mail_icon}
              alt=""
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none w-full text-white text-sm sm:text-base placeholder:text-indigo-400"
              type="email"
              placeholder="Email id"
              required
            />
          </div>

          {/* PASSWORD */}
          {/* PASSWORD */}
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
            <img
              src={assets.lock_icon}
              alt=""
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            />

            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="bg-transparent outline-none w-full text-white text-sm sm:text-base placeholder:text-white"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
            />

            <div
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer text-white opacity-70 hover:opacity-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          {state === "Login" && (
            <p
              className="mb-4 text-indigo-400 cursor-pointer hover:underline text-sm"
              onClick={() => navigate("/reset-password")}
            >
              Forgot password?
            </p>
          )}

          <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium">
            {state}
          </button>
        </form>

        {state === "Sign Up" ? (
          <p className="text-gray-400 text-center text-xs mt-4">
            Already have an account?{" "}
            <span
              onClick={() => setState("Login")}
              className="text-blue-400 cursor-pointer underline"
            >
              Login here
            </span>
          </p>
        ) : (
          <p className="text-gray-400 text-center text-xs mt-4">
            Don't have an account?{" "}
            <span
              onClick={() => setState("Sign Up")}
              className="text-blue-400 cursor-pointer underline"
            >
              Sign Up
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
