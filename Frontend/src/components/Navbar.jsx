import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";
  const isResetPage = location.pathname === "/reset-password";
  const isEmailVerifyPage = location.pathname === "/email-verify";
  const isAdminLogin = location.pathname === "/admin/login";
  const isAdminDashboard = location.pathname === "/admin/dashboard";

  // ✅ GET CONTEXT FIRST
  const { isLoggedIn, userData, logout, axios } = useAppContext();

  // ✅ SAFE ROLE-BASED PATH
  const role = userData?.role?.trim().toLowerCase();

  console.log("ROLE FROM DB:", role);

  const timetablePath =
    role === "teacher" ? "/teacher-timetable" : "/student-timetable";

  const sendVerificationOtp = async () => {
    try {
      const { data } = await axios.post("/api/auth/send-verify-otp");
      if (data.success) {
        toast.success("Verification OTP sent!");
        navigate("/email-verify");
      }
    } catch {
      toast.error("Error sending verification OTP");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          isAuthPage ||
          isResetPage ||
          isAdminLogin ||
          isEmailVerifyPage ||
          isAdminDashboard
            ? "bg-transparent border-b border-border"
            : isHomePage
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-background border-b border-border"
        }
      `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                R
              </span>
            </div>
            <span className="font-bold text-xl text-foreground">
              ResourceOPT
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/#features">Features</Link>
            <Link to="/#workflow">Workflow</Link>
            <Link to="/#about">About</Link>

            {/* ✅ View Timetable (LOGIN + VERIFIED ONLY) */}
            {isLoggedIn && userData?.isAccountVerified && (
              <Link to={timetablePath}>View Timetable</Link>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn && userData ? (
              <div className="relative group">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center">
                  {userData.name?.[0]?.toUpperCase()}
                </div>

                <div className="absolute right-0 top-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white shadow-lg rounded-md py-2 w-40 z-50 before:absolute before:-top-3 before:left-0 before:w-full before:h-3">
                  {!userData.isAccountVerified && (
                    <button
                      onClick={sendVerificationOtp}
                      className="px-4 py-2 w-full text-left"
                    >
                      Verify Email
                    </button>
                  )}
                  {/* <button
                    onClick={logout}
                    className="px-4 py-2 w-full text-left text-red-500"
                  >
                    Logout
                  </button> */}
                  <div className="flex flex-col gap-2">
                    {/* NEW PROFILE SETUP BUTTON */}
                    <button 
                      onClick={() => navigate('/profile-setup')}
                      className="px-4 py-2 text-sm"
                    >
                      Profile
                    </button>

                    <button 
                      onClick={logout} 
                      // i want to make this button take full height , do not want keep small gap below.
                      className="px-4 py-2 text-sm bg-red-50 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/login">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <Link to="/#features">Features</Link>
            <Link to="/#workflow">Workflow</Link>
            <Link to="/#about">About</Link>

            {isLoggedIn && userData?.isAccountVerified && (
              <Link to={timetablePath}>View Timetable</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
