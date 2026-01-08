// src/controllers/subjectController.js
import subjectModel from "../models/subjectModel.js";

export const addSubject = async (req, res) => {
  try {
    const { code, name, year, semester, components } = req.body;

    // Validate components
    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one component (Theory/Lab/Tutorial) is required" 
      });
    }

    // Check if subject already exists
    const exists = await subjectModel.findOne({ code, year, semester });

    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: `Subject ${code} already exists for ${year} - Semester ${semester}` 
      });
    }

    const newSubject = new subjectModel({ 
      code, 
      name, 
      year, 
      semester,
      components
    });
    
    await newSubject.save();
    res.json({ 
      success: true, 
      message: "Subject added successfully",
      subject: newSubject
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "This subject already exists" 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectsByFilter = async (req, res) => {
  try {
    const { year, semester } = req.query;
    const query = {};
    if (year) query.year = year;
    if (semester) query.semester = semester;

    const subjects = await subjectModel.find(query).sort({ code: 1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    const updated = await subjectModel.findByIdAndUpdate(
      id,
      { code, name, components },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Subject updated successfully",
      subject: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await subjectModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Subject removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};