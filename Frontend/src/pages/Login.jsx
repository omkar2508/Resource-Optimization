// pages/Login.jsx - Combined Login with Role Selection
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
  Shield,
} from "lucide-react";

const DEPARTMENTS = [
  "Computer Engineering",
  "IT Engineering",
  "AI Engineering",
  "Software Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
];

const DEPARTMENT_DIVISIONS = {
  "Software Engineering": ["1"],
  "AI Engineering": ["1", "2", "3"],
  "Computer Engineering": ["1", "2"],
  "IT Engineering": ["1", "2"],
  "Mechanical Engineering": ["1"],
  "Civil Engineering": ["1"],
  "Electrical Engineering": ["1"],
};

// Validation Helpers
const isValidName = (name) => /^[A-Za-z ]{2,}$/.test(name.trim());
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const isValidPassword = (password) => password.length >= 6;

// Role config
const ROLES = [
  {
    id: "user",
    label: "User",
    icon: User,
    emailPlaceholder: "Email id",
    passwordPlaceholder: "Password",
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    emailPlaceholder: "Admin email",
    passwordPlaceholder: "Admin password",
  },
];


const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const initialState = location.state?.mode === "signup" ? "Sign Up" : "Login";
  const [state, setState] = useState(initialState);

  // Role selection — default to student
  const [selectedRole, setSelectedRole] = useState("student");

  const { login, signup, adminLogin } = useAppContext();

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup-only fields
  const [department, setDepartment] = useState("");
  const [admissionYear, setAdmissionYear] = useState("");
  const [division, setDivision] = useState("");

  const isAdminRole = selectedRole === "admin";

  useEffect(() => {
    if (!department) {
      setDivision("");
      return;
    }
    const divs = DEPARTMENT_DIVISIONS[department] || [];
    if (divs.length === 1) {
      setDivision(divs[0]);
    } else {
      setDivision("");
    }
  }, [department]);

  useEffect(() => {
    if (location.state?.mode === "signup") setState("Sign Up");
    else if (location.state?.mode === "login") setState("Login");
  }, [location]);

  // When switching to admin role, force Login mode
  useEffect(() => {
    if (isAdminRole) setState("Login");
  }, [isAdminRole]);

  const currentRole = ROLES.find((r) => r.id === selectedRole);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      return toast.error("Please enter a valid email address");
    }
    if (!password) {
      return toast.error("Password is required");
    }

    // Admin / Superadmin login
    if (isAdminRole) {
      try {
        await adminLogin(email.trim(), password);
      } catch {
        toast.error("Login failed");
      }
      return;
    }

    // Student / Teacher sign up
    if (state === "Sign Up") {
      if (!isValidName(name)) {
        return toast.error("Name should contain only letters and be at least 2 characters");
      }
      if (!isValidPassword(password)) {
        return toast.error("Password must be at least 6 characters long");
      }
      if (!department) return toast.error("Please select a department");
      if (!division) return toast.error("Please select a division");
      if (!admissionYear) return toast.error("Please select admission year");

      try {
        await signup(
          name.trim(),
          email.trim(),
          password,
          department,
          Number(admissionYear),
          division
        );
      } catch {
        toast.error("Signup failed");
      }
    } else {
      // Login for student/teacher
      try {
        await login(email.trim(), password); // No role enforcement — backend blocks admins already
      } catch {
        toast.error("Invalid login credentials");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob-slow animation-delay-3000"></div>
      </div>

      <Navbar />

      {/* CENTER CARD */}
      <div className="relative z-20 bg-slate-900 px-4 sm:px-6 md:px-10 py-8 sm:py-10 md:py-12 rounded-lg sm:rounded-xl shadow-xl w-full max-w-md text-indigo-300">

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-2">
          {isAdminRole
          ? "Admin Login"
          : state === "Sign Up"
          ? "Create Account"
          : "Login"}
        </h2>
        <p className="text-center text-xs sm:text-sm mb-5">
          {isAdminRole
            ? "Enter admin credentials to continue"
            : state === "Sign Up"
            ? "Create your account!"
            : "Login to your account!"}
        </p>

        {/* ROLE SELECTOR */}
        <div className="grid grid-cols-2 gap-1.5 mb-6 bg-[#1e2340] p-1.5 rounded-2xl">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-900/40 scale-[1.03]"
                    : "text-indigo-400 hover:text-indigo-200 hover:bg-white/5"
                }`}
              >
                <Icon size={16} strokeWidth={isSelected ? 2.5 : 1.8} />
                <span className="leading-tight text-center">
                  {role.label}
                </span>

              </button>
            );
          })}
        </div>

        <form onSubmit={onSubmitHandler}>
          {/* NAME (signup only, non-admin) */}
          {state === "Sign Up" && !isAdminRole && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
              <img src={assets.person_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="bg-transparent outline-none w-full text-white text-sm sm:text-base placeholder:text-indigo-400"
                type="text"
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          {/* DEPARTMENT (signup only) */}
          {state === "Sign Up" && !isAdminRole && (
            <div className="mb-4">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#333A5C]">
                <Building2 className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full bg-transparent text-white focus:outline-none"
                >
                  <option value="" className="text-black bg-white">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="text-black bg-white">{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* DIVISION (signup only) */}
          {state === "Sign Up" && !isAdminRole && department && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-indigo-400" />
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  required
                  className={`w-full bg-transparent text-white focus:outline-none text-sm sm:text-base ${
                    DEPARTMENT_DIVISIONS[department]?.length === 1
                      ? "opacity-75 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  disabled={DEPARTMENT_DIVISIONS[department]?.length === 1}
                >
                  <option value="" className="text-black bg-white">
                    {DEPARTMENT_DIVISIONS[department]?.length === 1
                      ? `Division ${DEPARTMENT_DIVISIONS[department][0]} (Auto Assigned)`
                      : "Select Division"}
                  </option>
                  {DEPARTMENT_DIVISIONS[department]?.map((div) => (
                    <option key={div} value={div} className="text-black bg-white">Division {div}</option>
                  ))}
                </select>
              </div>
              {DEPARTMENT_DIVISIONS[department]?.length > 1 && (
                <p className="text-xs text-indigo-400 mt-1 ml-2">
                  {DEPARTMENT_DIVISIONS[department].length} divisions available
                </p>
              )}
            </div>
          )}

          {/* ADMISSION YEAR (signup only) */}
          {state === "Sign Up" && !isAdminRole && (
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-indigo-400" />
              <select
                value={admissionYear}
                onChange={(e) => setAdmissionYear(e.target.value)}
                required
                className="w-full bg-transparent text-white focus:outline-none text-sm sm:text-base"
              >
                <option value="" className="text-black">Admission Year</option>
                {[2021, 2022, 2023, 2024, 2025].map((year) => (
                  <option key={year} value={year} className="text-black">{year}</option>
                ))}
              </select>
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.mail_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none w-full text-white text-sm sm:text-base placeholder:text-indigo-400"
              type="email"
              placeholder={currentRole?.emailPlaceholder || "Email id"}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.lock_icon} alt="" className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="bg-transparent outline-none w-full text-white text-sm sm:text-base placeholder:text-indigo-400"
              type={showPassword ? "text" : "password"}
              placeholder={currentRole?.passwordPlaceholder || "Password"}
              required
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer text-indigo-400 opacity-70 hover:opacity-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          {/* Forgot password — only for login mode */}
          {state === "Login" && !isAdminRole && (
            <p
              className="mb-4 text-indigo-400 cursor-pointer hover:underline text-sm"
              onClick={() => navigate("/reset-password")}
            >
              Forgot password?
            </p>
          )}

          {/* Admin forgot password */}
          {isAdminRole && (
            <p className="mb-4 text-indigo-400/50 text-sm text-center">
              Contact your system administrator to reset your password
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {isAdminRole ? "Login" : state}
          </button>
        </form>

        {/* Sign up / Login toggle — only for non-admin roles */}
        {!isAdminRole && (
          state === "Sign Up" ? (
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
          )
        )}
      </div>
    </div>
  );
};

export default Login;