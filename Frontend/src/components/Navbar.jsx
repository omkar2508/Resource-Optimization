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

  //GET CONTEXT FIRST
  const { isLoggedIn, userData, logout, axios } = useAppContext();
  const navbarClass = `
    fixed top-0 left-0 w-full z-50
    ${
      isHomePage
        ? "bg-background/80 backdrop-blur-md"
        : "bg-white backdrop-blur-xl"
    }
    border-b border-border
    transition-all duration-300
    shadow-sm
  `;

  //SAFE ROLE-BASED PATH
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
    <nav className={navbarClass}>
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo -BRANDING: ResourceOPT */}
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-base sm:text-lg">
                R
              </span>
            </div>
            <span className="font-bold text-base sm:text-lg md:text-xl text-foreground truncate">
              ResourceOPT
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link to="/#features" className="text-sm lg:text-base hover:text-primary transition-colors">Features</Link>
            <Link to="/#workflow" className="text-sm lg:text-base hover:text-primary transition-colors">Workflow</Link>
            <Link to="/#about" className="text-sm lg:text-base hover:text-primary transition-colors">About</Link>
          </div>

          {/* Right Side - Desktop */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {isLoggedIn && userData ? (
              <div className="relative group">
                {/*SHOW "Hi, Admin" or "Hi, [Name]" */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    Hi, {userData.role === "admin" ? "Admin" : userData.name?.split(' ')[0] || "User"}
                  </span>
                  <div className="ml-2 w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                    {userData.name?.[0]?.toUpperCase() || userData.role?.[0]?.toUpperCase()}
                  </div>
                </div>

                <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white shadow-xl rounded-lg py-2 w-48 z-50 transition-all duration-200 border border-gray-100">
                  {!userData.isAccountVerified && (
                    <button
                      onClick={sendVerificationOtp}
                      className="px-4 py-2 w-full text-left text-sm hover:bg-gray-50 transition-colors"
                    >
                      Verify Email
                    </button>
                  )}
                  <div className="flex flex-col">
                    {userData.role === "student" && (
                      <button
                        onClick={() => {
                          navigate("/profile-setup");
                        }}
                        className="px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                      >
                        Profile
                      </button>
                    )}

                    {/*CHANGED: "Out" → "Logout" */}
                    <button
                      onClick={logout}
                      className="px-4 py-2 text-sm text-left bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-sm lg:text-base">Login</Button>
                </Link>
                <Link to="/login">
                  <Button className="text-sm lg:text-base">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/#features" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                to="/#workflow" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Workflow
              </Link>
              <Link 
                to="/#about" 
                className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              {isLoggedIn && userData?.isAccountVerified && (
                <Link 
                  to={timetablePath}
                  className="px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  View Timetable
                </Link>
              )}

              {/* Mobile Auth Section */}
              {isLoggedIn && userData ? (
                <div className="pt-3 border-t border-border space-y-2">
                  {/*SHOW "Hi, Admin" on mobile */}
                  <div className="px-3 py-2 text-sm font-medium text-gray-700">
                    Hi, {userData.role === "admin" ? "Admin" : userData.name?.split(' ')[0] || "User"}
                  </div>
                  
                  {!userData.isAccountVerified && (
                    <button
                      onClick={() => {
                        sendVerificationOtp();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Verify Email
                    </button>
                  )}
                  {userData.role === "student" && (
                    <button
                      onClick={() => {
                        navigate("/profile-setup");
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Profile
                    </button>
                  )}
                  {/*CHANGED: Mobile "Out" → "Logout" */}
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-border space-y-2">
                  <Link 
                    to="/login"
                    className="block px-3 py-2 text-center text-sm border rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/login"
                    className="block px-3 py-2 text-center text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};