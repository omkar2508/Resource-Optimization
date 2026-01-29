import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
  withCredentials: true, // CRITICAL: Enables cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 200000, // 200 seconds for long operations like timetable generation
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(` ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      const { status, config } = error.response;
      console.error(` ${config.method?.toUpperCase()} ${config.url} - ${status}`);
      
      // Log 401 errors specifically
      if (status === 401 && !config.url.includes("/api/auth/is-auth")) {
        console.error("🔒 Unauthorized - Session may have expired or cookies not sent");
      }
    } else if (error.request) {
      console.error(" No response received from server");
      console.error("Request:", error.request);
    } else {
      console.error(" Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;