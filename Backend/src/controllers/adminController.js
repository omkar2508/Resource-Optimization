import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";

export const addTeacher = async (req, res) => {
  const { name, email, department, password } = req.body;

  if (!name || !email || !department || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields required",
    });
  }

  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await userModel.create({
      name,
      email,
      department,
      password: hashedPassword,
      role: "teacher",
      isAccountVerified: false, // MUST verify first time
    });

    res.status(201).json({
      success: true,
      message: "Teacher added successfully",
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
