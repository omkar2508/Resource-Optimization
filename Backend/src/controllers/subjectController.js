import subjectModel from "../models/subjectModel.js";

export const addSubject = async (req, res) => {
  try {
    const { code, name, year, semester, components } = req.body;


    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one component (Theory/Lab/Tutorial) is required" 
      });
    }

    const department = req.adminDepartment;
    if (!department) {
      return res.status(403).json({
        success: false,
        message: "Department not detected. Please login again."
      });
    }

    const exists = await subjectModel.findOne({ 
      code, 
      year, 
      semester, 
      department 
    });

    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: `Subject ${code} already exists for ${year} - Semester ${semester} in your department (${department})` 
      });
    }

    const newSubject = new subjectModel({ 
      code, 
      name, 
      year, 
      semester,
      components,
      department,
      createdBy: req.adminId
    });
    
    await newSubject.save();
    
    console.log(` Subject created: ${code} for ${department}`);
    
    res.json({ 
      success: true, 
      message: "Subject added successfully",
      subject: newSubject
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({ 
        success: false, 
        message: `This subject code already exists in your department. Please use a different code or edit the existing subject.` 
      });
    }
    
    console.error(" Subject creation error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to add subject" 
    });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const filter = {};

    // Regular admin sees only their department
    if (req.adminRole !== "superadmin") {
      filter.department = req.adminDepartment;
    }

    const subjects = await subjectModel.find(filter)
      .sort({ year: 1, semester: 1, code: 1 });
    
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectsByFilter = async (req, res) => {
  try {
    const { year, semester } = req.query;
    const query = {};

    // Always filter by admin's department
    if (req.adminRole !== "superadmin") {
      query.department = req.adminDepartment;
    }

    if (year) query.year = year;
    if (semester) query.semester = semester;

    const subjects = await subjectModel.find(query).sort({ code: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Update subject (with department check)
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, components } = req.body;

    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one component is required" 
      });
    }

    // Find subject and verify department access
    const subject = await subjectModel.findById(id);

    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject not found" 
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && subject.department !== req.adminDepartment) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied: Cannot modify subjects from other departments" 
      });
    }

    // Update
    const updated = await subjectModel.findByIdAndUpdate(
      id,
      { code, name, components },
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: "Subject updated successfully",
      subject: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Delete subject (with department check)
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and verify department access
    const subject = await subjectModel.findById(id);

    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject not found" 
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && subject.department !== req.adminDepartment) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied: Cannot delete subjects from other departments" 
      });
    }

    await subjectModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Subject removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};