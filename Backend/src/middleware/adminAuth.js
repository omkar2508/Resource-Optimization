import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const adminAuth = async (req, res, next) => {
  try {
    if (req.session?.isAdmin && req.session?.adminId) {
      const admin = await userModel.findById(req.session.adminId);
      
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          message: "Admin not found" 
        });
      }

      if (admin.role !== "admin" && admin.role !== "superadmin") {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: Admin access required" 
        });
      }

      if (!admin.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: "Account disabled" 
        });
      }

      // Attach admin info to request
      req.adminId = admin._id;
      req.adminRole = admin.role;
      req.adminDepartment = admin.department;
      req.adminName = admin.name;
      req.adminEmail = admin.email;

      return next();
    }

    const token = req.cookies.adminToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await userModel.findById(decoded.id);

        if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
          return res.status(403).json({ 
            success: false, 
            message: "Unauthorized" 
          });
        }

        if (!admin.isActive) {
          return res.status(403).json({ 
            success: false, 
            message: "Account disabled" 
          });
        }

        req.adminId = admin._id;
        req.adminRole = admin.role;
        req.adminDepartment = admin.department;
        req.adminName = admin.name;
        req.adminEmail = admin.email;

        return next();
      } catch (jwtError) {
        console.error("JWT verification failed:", jwtError.message);
      }
    }

    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated. Please log in." 
    });

  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed" 
    });
  }
};

export const superAdminAuth = async (req, res, next) => {
  try {
    // First run adminAuth by calling it directly
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (req.adminRole !== "superadmin") {
      return res.status(403).json({ 
        success: false, 
        message: "Superadmin access required" 
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: "Unauthorized" 
    });
  }
};


export const blockSuperadminGeneration = (req, res, next) => {
  if (req.adminRole === "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Superadmin cannot generate timetables. Please create department admins to manage timetables for each department."
    });
  }
  next();
};


export const validateDepartmentAccess = (req, res, next) => {
  const { department } = req.body || req.query;

  if (req.adminRole === "superadmin") {
    return next();
  }

  if (department && department !== req.adminDepartment) {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied: Cannot access other department's data" 
    });
  }

  next();
};