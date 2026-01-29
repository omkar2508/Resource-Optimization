import timetableModel from "../models/timetableModel.js";

export const saveTimetable = async (req, res) => {
  try {
    const { year, division, timetableData, timeConfig } = req.body;

    if (!year || !division) {
      return res.status(400).json({
        success: false,
        message: "Year and division are required"
      });
    }

    if (!timetableData || Object.keys(timetableData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Timetable data is required"
      });
    }

    // Get department from authenticated admin
    const department = req.adminDepartment;

    const existing = await timetableModel.findOne({ year, division, department });

    let savedTimetable;

    if (existing) {
      existing.timetableData = timetableData;
      
      if (timeConfig) {
        existing.timeConfig = timeConfig;
      }
      
      existing.savedByAdmin = req.adminId;
      existing.savedBy = req.adminName || "Admin";
      
      savedTimetable = await existing.save();
    } else {
      // Create new timetable
      const newTimetable = new timetableModel({
        year,
        division,
        timetableData,
        timeConfig: timeConfig || {}, 
        department,
        savedBy: req.adminName || "Admin",
        savedByAdmin: req.adminId
      });

      savedTimetable = await newTimetable.save();
    }

    res.json({
      success: true,
      message: `Timetable saved successfully for ${department}`,
      timetable: savedTimetable
    });
  } catch (error) {
    console.error("Save timetable error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save timetable",
      error: error.message
    });
  }
};
export const getAllIndividualTimetables = async (req, res) => {
  try {
    const { department, year, division } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (division) filter.division = division;

    const timetables = await timetableModel
      .find(filter)
      .sort({ year: 1, division: 1 })
      .lean();

    res.json({
      success: true,
      timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error("Get timetables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timetables"
    });
  }
};

export const getAllTimetables = async (req, res) => {
  try {
    const filter = {};

    // Filter by department for regular admins
    if (req.adminRole !== "superadmin") {
      filter.department = req.adminDepartment;
    }

    const timetables = await timetableModel
      .find(filter)
      .sort({ year: 1, division: 1 })
      .lean();

    res.json({
      success: true,
      timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error("Get timetables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timetables",
      error: error.message
    });
  }
};

export const getTimetableById = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await timetableModel.findById(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found"
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && timetable.department !== req.adminDepartment) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    console.error("Get timetable error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
      error: error.message
    });
  }
};

export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await timetableModel.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found"
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && timetable.department !== req.adminDepartment) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    await timetableModel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Timetable deleted successfully"
    });
  } catch (error) {
    console.error("Delete timetable error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete timetable",
      error: error.message
    });
  }
};