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
  const isAdminLogin1 = location.pathname === "/admin/dashboard";

  const { isLoggedIn, userData, logout, axios } = useAppContext();

  const sendVerificationOtp = async () => {
    try {
      const { data } = await axios.post("/api/auth/send-verify-otp");
      if (data.success) {
        toast.success("Verification OTP sent!");
        navigate("/email-verify");
      }
    } catch (err) {
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
      isAdminLogin1
        ? "bg-transparent border-b border-border"
        : isHomePage
        ? "bg-background/80 backdrop-blur-md border-b border-border"
        : "bg-background border-b border-border"
    }
  `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Same "R" for all pages */}
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
            <Link
              to="/#features"
              className="text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>

            <Link
              to="/#workflow"
              className="text-muted-foreground hover:text-foreground"
            >
              Workflow
            </Link>

            <Link
              to="/#about"
              className="text-muted-foreground hover:text-foreground"
            >
              About
            </Link>

            {/* View Timetable - Only for logged in users */}
            {isLoggedIn && (
              <Link
                to="/admin/saved"
                className="text-muted-foreground hover:text-foreground"
              >
                View Timetable
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn && userData ? (
              <div className="relative group">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer">
                  {userData.name?.[0]?.toUpperCase()}
                </div>

                {/* Dropdown */}
                <div className="absolute right-0 top-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white shadow-lg rounded-md py-2 w-40 z-50">
                  {!userData.isAccountVerified && (
                    <button
                      onClick={sendVerificationOtp}
                      className="px-4 py-2 w-full text-left hover:bg-gray-100"
                    >
                      Verify Email
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="px-4 py-2 w-full text-left hover:bg-gray-100 text-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" state={{ mode: "login" }}>
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/login" state={{ mode: "signup" }}>
                  <Button className="bg-gradient-to-r from-primary to-primary-glow">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link to="/#features" onClick={() => setIsMenuOpen(false)}>
                Features
              </Link>
              <Link to="/#workflow" onClick={() => setIsMenuOpen(false)}>
                Workflow
              </Link>
              <Link to="/#about" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>

              {/* View Timetable - Mobile */}
              {isLoggedIn && (
                <Link
                  to="/admin/saved"
                  onClick={() => setIsMenuOpen(false)}
                  className="font-medium text-primary"
                >
                  View Timetable
                </Link>
              )}

              {/* Mobile auth */}
              <div className="flex flex-col space-y-2 border-t border-border pt-4">
                {isLoggedIn && userData ? (
                  <>
                    {!userData.isAccountVerified && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          sendVerificationOtp();
                          setIsMenuOpen(false);
                        }}
                      >
                        Verify Email
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      state={{ mode: "login" }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link
                      to="/login"
                      state={{ mode: "signup" }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full bg-gradient-to-r from-primary to-primary-glow">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
