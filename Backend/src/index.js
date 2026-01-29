import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";

import connectDB from "./config/mongodb.js";

//Import admin middleware
import { adminAuth } from "./middleware/adminAuth.js";

// Routes
import schedulerRoutes from "./routes/schedulerRoutes.js";
import adminRoutes from "./routes/admin.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import superadminRoutes from "./routes/superadminRoutes.js";

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Connect Database
connectDB();

// FIXED: Environment-aware CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = isProduction 
      ? ["https://resourceoptfrontendfolder.vercel.app"]
      : ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(` CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));


app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

const sessionConfig = {
  name: "sid",
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 4, // 4 hours
  }
};

// Add domain for production
if (isProduction) {
  sessionConfig.cookie.domain = ".vercel.app";
}

app.use(session(sessionConfig));

//  Session debugging middleware
app.use((req, res, next) => {
  if (!isProduction && req.path.includes('/api/')) {
    console.log(`${req.method} ${req.path}`);
    console.log(`Session ID: ${req.sessionID}`);
    console.log(`Is Admin: ${req.session?.isAdmin || false}`);
    console.log(`Admin ID: ${req.session?.adminId || 'none'}`);
  }
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

//ENHANCED: Session debug endpoint (available in dev and prod for troubleshooting)
app.get("/debug/session", (req, res) => {
  res.json({
    environment: isProduction ? "production" : "development",
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.cookies,
    isAdmin: req.session?.isAdmin || false,
    adminId: req.session?.adminId || null,
    headers: {
      origin: req.headers.origin,
      cookie: req.headers.cookie ? "present" : "missing"
    }
  });
});

//ADDED: Health check endpoint for admin auth
app.get("/api/admin/health", adminAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    admin: {
      id: req.adminId,
      name: req.adminName,
      role: req.adminRole,
      department: req.adminDepartment
    }
  });
});

// Auth Routes (public)
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use("/api/superadmin", superadminRoutes);

//Admin Routes (some protected, some public like login)
app.use("/api/admin", adminRoutes);

app.use("/api/scheduler", schedulerRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/subjects", subjectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(' Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`Session secure: ${isProduction ? 'true (HTTPS)' : 'false (HTTP)'}`);
  console.log(`CORS enabled for: ${isProduction ? 'Production URL' : 'Localhost'}`);
  console.log(`Multi-department admin system enabled`);
  console.log(`Cookie SameSite: ${sessionConfig.cookie.sameSite}`);
  console.log(`Cookie Secure: ${sessionConfig.cookie.secure}`);
});