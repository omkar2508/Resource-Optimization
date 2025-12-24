import userModel from "../models/userModel.js";

export const getTeachers = async (req, res) => {
  try {
    const teachers = await userModel.find(
      { role: "teacher" },               // ONLY teachers
      { name: 1, email: 1, department: 1, role: 1 } // fields
    );

    res.json({
      success: true,
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
    });
  }
};
