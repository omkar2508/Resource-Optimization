import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";

//  UPDATED: Now accepts and stores subjects
export const addTeacher = async (req, res) => {
  const { name, email, password, subjects } = req.body;  // Accept subjects

  if (!name || !email || !password) {
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
        message: "Teacher already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Include subjects in teacher creation
    const teacher = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
      department: req.adminDepartment,
      subjects: subjects || [],  // Default to empty array if not provided
      isAccountVerified: false,
      createdBy: req.adminId
    });

    console.log(` Teacher created: ${teacher.name} with ${(teacher.subjects || []).length} subjects`);

    return res.status(201).json({
      success: true,
      message: "Teacher added successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        subjects: teacher.subjects
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//  UPDATED: Now can update subjects
export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, subjects } = req.body;  // Accept subjects

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is required"
    });
  }

  try {
    const teacher = await userModel.findById(id);

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && teacher.department !== req.adminDepartment) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    teacher.name = name;
    
    // Update subjects if provided
    if (subjects !== undefined) {
      teacher.subjects = subjects;
      console.log(` Updated subjects for ${teacher.name}: ${subjects.length} subjects`);
    }
    
    await teacher.save();

    return res.json({
      success: true,
      message: "Teacher updated successfully",
      teacher: {
        name: teacher.name,
        subjects: teacher.subjects
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    const teacher = await userModel.findById(id);

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && teacher.department !== req.adminDepartment) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    await userModel.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Teacher deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};