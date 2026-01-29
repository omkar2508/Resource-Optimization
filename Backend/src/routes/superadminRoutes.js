import express from "express";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import { superAdminAuth } from "../middleware/adminAuth.js";
import roomModel from "../models/roomModel.js";
import subjectModel from "../models/subjectModel.js";
import timetableModel from "../models/timetableModel.js";

const router = express.Router();

router.get("/dashboard-stats", superAdminAuth, async (req, res) => {
  try {
    const stats = {
      totalAdmins: await userModel.countDocuments({ role: "admin" }),
      totalTeachers: await userModel.countDocuments({ role: "teacher" }),
      totalStudents: await userModel.countDocuments({ role: "student" }),
      totalRooms: await roomModel.countDocuments(),
      totalSubjects: await subjectModel.countDocuments(),
      totalTimetables: await timetableModel.countDocuments(),
    };

    // Department-wise breakdown
    const departments = [
      "Computer Engineering",
      "IT Engineering",
      "AI Engineering",
      "Software Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering"
    ];

    const departmentStats = await Promise.all(
      departments.map(async (dept) => ({
        department: dept,
        admins: await userModel.countDocuments({ role: "admin", department: dept }),
        teachers: await userModel.countDocuments({ role: "teacher", department: dept }),
        rooms: await roomModel.countDocuments({ department: dept }),
        subjects: await subjectModel.countDocuments({ department: dept }),
        timetables: await timetableModel.countDocuments({ department: dept })
      }))
    );

    return res.json({
      success: true,
      stats,
      departmentStats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats"
    });
  }
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
        message: "Email already exists"
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
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/admins", superAdminAuth, async (req, res) => {
  try {
    const admins = await userModel
      .find({ role: { $in: ["admin", "superadmin"] } })
      .select("name email role department isActive createdAt")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      admins
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins"
    });
  }
});

router.patch("/admins/:id", superAdminAuth, async (req, res) => {
  const { name, department } = req.body;
  
  try {
    const admin = await userModel.findById(req.params.id);

    if (!admin || admin.role === "superadmin") {
      return res.status(404).json({
        success: false,
        message: "Admin not found or cannot modify superadmin"
      });
    }

    if (name) admin.name = name;
    if (department) admin.department = department;
    
    await admin.save();

    return res.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        department: admin.department
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update admin"
    });
  }
});

router.patch("/admins/:id/toggle-status", superAdminAuth, async (req, res) => {
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

    return res.json({
      success: true,
      message: `Admin ${admin.isActive ? "activated" : "deactivated"} successfully`,
      admin: {
        id: admin._id,
        isActive: admin.isActive
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle admin status"
    });
  }
});

router.delete("/admins/:id", superAdminAuth, async (req, res) => {
  try {
    const admin = await userModel.findById(req.params.id);

    if (!admin || admin.role === "superadmin") {
      return res.status(404).json({
        success: false,
        message: "Admin not found or cannot delete superadmin"
      });
    }

    admin.isActive = false;
    await admin.save();


    return res.json({
      success: true,
      message: "Admin removed successfully"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin"
    });
  }
});


router.get("/departments", superAdminAuth, async (req, res) => {
  try {
    const departments = [
      "Computer Engineering",
      "IT Engineering",
      "AI Engineering",
      "Software Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering"
    ];

    const departmentData = await Promise.all(
      departments.map(async (dept) => {
        const admin = await userModel
          .findOne({ role: "admin", department: dept, isActive: true })
          .select("name email");

        return {
          name: dept,
          admin: admin || null,
          hasAdmin: !!admin
        };
      })
    );

    return res.json({
      success: true,
      departments: departmentData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments"
    });
  }
});

export default router;