import express from "express";
import { addTeacher } from "../controllers/adminController.js";
import userModel from "../models/userModel.js";

const router = express.Router();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return res.status(500).json({
      success: false,
      message: "Admin credentials missing in backend .env",
    });
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.user = { email };
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// ⭐ frontend uses this
router.get("/me", (req, res) => {
  if (req.session?.isAdmin) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  return res.json({ authenticated: false });
});

// logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    return res.json({ success: true });
  });
});

// ==========================================
// ✅ NEW ROUTE — GET ALL USERS
// ==========================================
router.get("/users", async (req, res) => {
  if (!req.session?.isAdmin) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const users = await userModel.find(
      {},
      { name: 1, role: 1 }
    );

    return res.json({
      success: true,
      users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

router.post("/add-teacher", addTeacher);

export default router;
