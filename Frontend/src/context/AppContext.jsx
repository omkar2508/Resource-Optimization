import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  // USER AUTH STATES
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // ADMIN PANEL STATE
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingApp, setLoadingApp] = useState(true);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // ==========================================
  // CHECK USER AUTH
  // ==========================================
  const getAuthState = async () => {
    try {
      const res = await axiosInstance.get("/api/auth/is-auth");
      if (res.data.success) {
        setIsLoggedIn(res.data.isLoggedIn);
      }
      return res.data.isLoggedIn;
    } catch (err) {
      return false;
    }
  };

  // ==========================================
  // FETCH USER DATA
  // ==========================================
  const getUserData = async () => {
    try {
      const res = await axiosInstance.get("/api/user/data");
      if (res.data.success) {
        setUserData(res.data.userData);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.log("User data error:", err);
    }
  };

  // ==========================================
  // CHECK ADMIN SESSION
  // ==========================================
  const checkAdmin = async () => {
    try {
      const res = await axiosInstance.get("/api/admin/me");
      setIsAdmin(res.data.authenticated === true);
    } catch (err) {
      setIsAdmin(false);
    }
  };

  // ==========================================
  // AUTO RUN ONCE WHEN APP LOADS
  // ==========================================
  useEffect(() => {
    const init = async () => {
      await getAuthState();
      await getUserData();
      await checkAdmin();
      setLoadingApp(false);
    };
    init();
  }, []);

  // ==========================================
  // LOGIN FUNCTION
  // ==========================================
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
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Login failed");
    }
  };

  // ==========================================
  // SIGNUP FUNCTION
  // ==========================================
  const signup = async (name, email, password) => {
    try {
      const res = await axiosInstance.post("/api/auth/register", {
        name,
        email,
        password,
      });

      if (res.data.success) {
        toast.success("Account created! Please verify OTP.");
        navigate("/");
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Signup failed");
    }
  };

  // ==========================================
  // LOGOUT FUNCTION
  // ==========================================
  const logout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      setIsLoggedIn(false);
      setUserData(null);
      toast.success("Logged out");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  // ==========================================
  // CONTEXT VALUE
  // ==========================================
  const value = {
    backendURL,
    axios: axiosInstance,

    // user
    isLoggedIn,
    userData,
    login,
    signup,
    logout,

    // admin
    isAdmin,
    setIsAdmin,

    // fetchers
    getUserData,
  };

  if (loadingApp) return <div>Loading...</div>;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
