import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // User  States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Admin Panel State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Check both user and admin auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAdminAuth();
        await checkUserAuth();

      } catch {
        // user simply not logged in — no need to treat as error
        setIsLoggedIn(false);
        setUserData(null);
      } finally {
        setLoadingApp(false);
      }
    };

    initializeAuth();
  }, []);

  // Redirect student to profile setup if needed
  useEffect(() => {
    if (userData && userData.role === "student" && !userData.batch) {
      navigate("/profile-setup");
    }
  }, [userData, navigate]);

  // USER AUTHENTICATION
  const checkUserAuth = async () => {
    try {
      const res = await axiosInstance.get("/api/auth/is-auth");
      if (res.data.success && res.data.isLoggedIn) {
        setIsLoggedIn(true);
        await getUserData();
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUserData(null);
    }
  };

  const getUserData = async () => {
    try {
      const res = await axiosInstance.get("/api/user/data");
      if (res.data.success) {
        setUserData(res.data.userData);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Get user data error:", error);
      setUserData(null);
      setIsLoggedIn(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
        toast.success("Login successful");
        setIsLoggedIn(true);
        await getUserData();
        navigate("/");
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (error) {
      // Handle specific error for admins trying to login here
      if (error.response?.status === 403) {
        toast.error("Admins must log in at /admin/login", {
          position: "top-center",
          autoClose: 3000
        });
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else {
        toast.error(error.response?.data?.message || "Login failed");
      }
    }
  };

  const signup = async (name, email, password, department, admissionYear, division) => {
    try {
      const res = await axiosInstance.post("/api/auth/register", {
        name,
        email,
        password,
        department,
        admissionYear,
        division,
      });

      if (res.data.success) {
        toast.success("Account created! Please verify your email.");
        navigate("/email-verify");
      } else {
        toast.error(res.data.message || "Signup failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      setIsLoggedIn(false);
      setUserData(null);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // ADMIN AUTHENTICATION

  const checkAdminAuth = async () => {
    try {
      const res = await axiosInstance.get("/api/admin/me", { 
        withCredentials: true 
      });
      
      if (res.data.authenticated === true) {
        setIsAdmin(true);
        setAdminData({
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          department: res.data.user.department
        });
      } else {
        setIsAdmin(false);
        setAdminData(null);
      }
    } catch (error) {
      setIsAdmin(false);
      setAdminData(null);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await axiosInstance.post("/api/admin/login", {
        email,
        password,
      }, { withCredentials: true });

      if (res.data.success) {
        const admin = res.data.admin;
        
        toast.success(`Welcome, ${admin.name}!`);
        setIsAdmin(true);
        setAdminData(admin);
        
        // IMPROVED: Better role-based routing
        if (admin.role === "superadmin") {
          navigate("/superadmin/dashboard", { replace: true });
        } else if (admin.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        toast.error(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      
      // Handle specific error for non-admins
      if (error.response?.status === 403) {
        toast.error("Teachers and students must log in at /login", {
          position: "top-center",
          autoClose: 3000
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(error.response?.data?.message || "Login failed");
      }
    }
  };

  const adminLogout = async () => {
    try {
      await axiosInstance.post("/api/admin/logout", {}, { 
        withCredentials: true 
      });
      setIsAdmin(false);
      setAdminData(null);
      toast.success("Logged out successfully");
      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  // CONTEXT VALUE

  const value = {
    backendURL,
    axios: axiosInstance,

    // User
    isLoggedIn,
    userData,
    login,
    signup,
    logout,
    getUserData,

    // Admin
    isAdmin,
    adminData,
    setIsAdmin,
    adminLogin,
    adminLogout,
    checkAdmin: checkAdminAuth,
  };

  // Better loading state
  if (loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ResourceOPT...</p>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};