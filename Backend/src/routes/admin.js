import express from "express";

const router = express.Router();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("ENV EMAIL:", JSON.stringify(ADMIN_EMAIL), ADMIN_EMAIL.length);
  console.log("ENV PASS:", JSON.stringify(ADMIN_PASSWORD), ADMIN_PASSWORD.length);

  console.log("BODY EMAIL:", JSON.stringify(email), email.length);
  console.log("BODY PASS:", JSON.stringify(password), password.length);

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

// ⭐ REQUIRED ROUTE — frontend calls this on refresh
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

// protected test
router.get("/protected", (req, res) => {
  if (req.session?.isAdmin) {
    return res.json({ message: "Admin-only data" });
  }
  return res.status(401).json({ message: "Unauthorized" });
});

export default router;
