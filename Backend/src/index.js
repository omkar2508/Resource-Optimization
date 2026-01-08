// ----------------------------------------------
// LOAD DOTENV
// ----------------------------------------------
import "dotenv/config";

import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";

// DB Connection
import connectDB from "./config/mongodb.js";

// Old Routes
import schedulerRoutes from "./routes/schedulerRoutes.js";
import adminRoutes from "./routes/admin.js";
import teacherRoutes from "./routes/teacherRoutes.js";    // Change 24.12.2025

// New Auth Routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";

// ----------------------------------------------
// INIT
// ----------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

console.log("Loaded admin:", process.env.ADMIN_EMAIL);

// ----------------------------------------------
// MIDDLEWARES
// ----------------------------------------------
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8080"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
    },
  })
);

// ----------------------------------------------
// ROUTES
// ----------------------------------------------
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

// New Auth System
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Old Existing Routes
app.use("/api/admin", adminRoutes);
app.use("/api/scheduler", schedulerRoutes);


app.use("/api/timetable", timetableRoutes);

app.use("/api/teacher", teacherRoutes);   //change 21.12.2025

// Adding room routes
app.use("/api/rooms", roomRoutes);

// Adding subject routes
app.use("/api/subjects", subjectRoutes);

// ----------------------------------------------
// START SERVER
// ----------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
