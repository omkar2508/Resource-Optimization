import express from "express";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import { adminAuth, superAdminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  try {
    console.log("🔐 Admin login attempt:", email);

    // Find ONLY admin or superadmin
    const admin = await userModel.findOne({ 
      email,
      role: { $in: ["admin", "superadmin"] }
    });

    if (!admin) {
      console.log(" No admin/superadmin found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or not an admin"
      });
    }

    // BLOCK teacher/student from admin login
    if (admin.role === "teacher" || admin.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Teachers and students must log in at /login"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is disabled. Contact super administrator."
      });
    }

    // Store admin session
    req.session.isAdmin = true;
    req.session.adminId = admin._id;
    req.session.user = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      department: admin.department
    };

    console.log(" Admin login successful:", admin.name);

    return res.json({ 
      success: true,
      admin: {
        name: admin.name,
        role: admin.role,
        department: admin.department
      }
    });
  } catch (err) {
    console.error(" Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});

router.get("/me", async (req, res) => {
  if (req.session?.isAdmin && req.session?.adminId) {
    try {
      const admin = await userModel.findById(req.session.adminId)
        .select("name email role department isActive");

      if (!admin) {
        return res.json({ authenticated: false });
      }

      return res.json({ 
        authenticated: true, 
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          department: admin.department
        }
      });
    } catch (err) {
      console.error("Error fetching admin:", err);
      return res.json({ authenticated: false });
    }
  }
  return res.json({ authenticated: false });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.clearCookie("sid");
    return res.json({ success: true });
  });
});

router.post("/create-admin", superAdminAuth, async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      department,
      isAccountVerified: true,
      isActive: true,
      createdBy: req.adminId
    });

    console.log(` Admin created: ${admin.name} (${admin.department})`);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        department: admin.department
      }
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/list-admins", superAdminAuth, async (req, res) => {
  try {
    const admins = await userModel.find({ 
      role: { $in: ["admin", "superadmin"] }
    }).select("name email role department isActive createdAt");

    return res.json({
      success: true,
      admins
    });
  } catch (err) {
    console.error("Error fetching admins:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins"
    });
  }
});

router.patch("/toggle-admin/:id", superAdminAuth, async (req, res) => {
  try {
    const admin = await userModel.findById(req.params.id);

    if (!admin || admin.role === "superadmin") {
      return res.status(404).json({
        success: false,
        message: "Admin not found or cannot disable superadmin"
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    console.log(` Admin ${admin.isActive ? 'activated' : 'deactivated'}: ${admin.name}`);

    return res.json({
      success: true,
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err) {
    console.error("Error toggling admin:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle admin status"
    });
  }
});

router.get("/users", adminAuth, async (req, res) => {
  try {
    const filter = { role: "teacher" };

    // Regular admin sees only their department
    if (req.adminRole !== "superadmin") {
      filter.department = req.adminDepartment;
    }

    const users = await userModel.find(filter, { 
      name: 1, 
      email: 1, 
      role: 1, 
      department: 1 
    });

    return res.json({
      success: true,
      users
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

export default router;