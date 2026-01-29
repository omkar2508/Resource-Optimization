import userModel from "../models/userModel.js";

export const getTeachers = async (req, res) => {
  try {
    const filter = { role: "teacher" };

    //Filter by admin's department
    if (req.adminRole !== "superadmin") {
      filter.department = req.adminDepartment;
    }

    const teachers = await userModel.find(filter, { 
      name: 1, 
      email: 1, 
      department: 1, 
      role: 1,
      subjects: 1  // ADDED: This fetches the subjects array
    });

    res.json({
      success: true,
      teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers"
    });
  }
};