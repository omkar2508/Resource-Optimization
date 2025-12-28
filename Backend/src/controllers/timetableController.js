// controllers/timetableController.js
import timetableModel from "../models/timetableModel.js";

/**
 * SINGLE SOURCE OF TRUTH PRINCIPLE:
 * - Only CLASS timetables are saved to database
 * - Teacher timetables are DERIVED dynamically from class timetables
 * - This ensures perfect sync between class and teacher views
 */

// Save timetable (ONLY CLASS TIMETABLES)
export const saveTimetable = async (req, res) => {
  try {
    const { 
      timetableType, 
      year, 
      division, 
      teacherName, 
      timetableData, 
      timeConfig,
      department 
    } = req.body;

    console.log("=== SAVE TIMETABLE REQUEST ===");
    console.log("Type:", timetableType);
    console.log("Year:", year);
    console.log("Division:", division);

    // CRITICAL: Do NOT save teacher timetables separately
    // They are derived dynamically from class timetables
    if (timetableType === "teacher") {
      return res.json({
        success: true,
        message: "Teacher timetables are derived from class timetables and not saved separately"
      });
    }

    // Validate required fields for class timetable
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

    // Check if timetable already exists
    const existing = await timetableModel.findOne({ year, division });

    let savedTimetable;

    if (existing) {
      // Update existing timetable
      existing.timetableData = timetableData;
      existing.timeConfig = timeConfig || existing.timeConfig;
      existing.department = department || existing.department;
      
      savedTimetable = await existing.save();
      console.log("✅ Updated existing timetable");
    } else {
      // Create new timetable
      const newTimetable = new timetableModel({
        year,
        division,
        timetableData,
        timeConfig: timeConfig || {
          startTime: "09:00",
          endTime: "17:00",
          periodDuration: 60,
          lunchStart: "13:00",
          lunchDuration: 45
        },
        department: department || "Software Engineering",
        savedBy: req.user?.name || "Admin"
      });

      savedTimetable = await newTimetable.save();
      console.log("✅ Created new timetable");
    }

    res.json({
      success: true,
      message: `Timetable saved successfully for ${year} - Division ${division}`,
      timetable: savedTimetable
    });

  } catch (error) {
    console.error("❌ Error saving timetable:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save timetable",
      error: error.message
    });
  }
};

// Get all CLASS timetables
export const getAllTimetables = async (req, res) => {
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

    console.log(`📊 Fetched ${timetables.length} class timetables`);

    res.json({
      success: true,
      timetables,
      count: timetables.length
    });
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timetables",
      error: error.message
    });
  }
};

// Get single timetable by ID
export const getTimetableById = async (req, res) => {
  try {
    const timetable = await timetableModel.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found"
      });
    }

    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
      error: error.message
    });
  }
};

// Delete timetable
export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await timetableModel.findByIdAndDelete(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found"
      });
    }

    console.log(`🗑️ Deleted timetable: ${timetable.year} - Division ${timetable.division}`);

    res.json({
      success: true,
      message: `Timetable deleted for ${timetable.year} - Division ${timetable.division}`
    });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete timetable",
      error: error.message
    });
  }
};

// Update timetable
export const updateTimetable = async (req, res) => {
  try {
    const { timetableData, timeConfig } = req.body;

    const timetable = await timetableModel.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found"
      });
    }

    if (timetableData) {
      timetable.timetableData = timetableData;
    }

    if (timeConfig) {
      timetable.timeConfig = timeConfig;
    }

    await timetable.save();

    console.log(`✏️ Updated timetable: ${timetable.year} - Division ${timetable.division}`);

    res.json({
      success: true,
      message: "Timetable updated successfully",
      timetable
    });
  } catch (error) {
    console.error("Error updating timetable:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update timetable",
      error: error.message
    });
  }
};

/**
 * DYNAMIC TEACHER TIMETABLE GENERATION
 * This derives a teacher's timetable from all class timetables
 * Ensures teacher timetables are ALWAYS in sync with class timetables
 */
export const getTeacherTimetable = async (req, res) => {
  try {
    const { teacherName } = req.params;
    
    if (!teacherName) {
      return res.status(400).json({
        success: false,
        message: "Teacher name is required"
      });
    }

    console.log(`👨‍🏫 Building dynamic timetable for: ${teacherName}`);

    // Get all class timetables
    const allTimetables = await timetableModel.find({}).lean();

    // Build teacher's timetable DYNAMICALLY
    const teacherTimetable = {};
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // Initialize structure
    days.forEach(day => {
      teacherTimetable[day] = {};
    });

    let totalClasses = 0;

    // Extract teacher's classes from ALL class timetables
    for (const tt of allTimetables) {
      for (const day of days) {
        if (!tt.timetableData[day]) continue;

        for (const [timeSlot, entries] of Object.entries(tt.timetableData[day])) {
          for (const entry of entries) {
            if (entry.teacher === teacherName) {
              if (!teacherTimetable[day][timeSlot]) {
                teacherTimetable[day][timeSlot] = [];
              }
              
              teacherTimetable[day][timeSlot].push({
                subject: entry.subject,
                type: entry.type,
                year: tt.year,
                division: tt.division,
                room: entry.room,
                batch: entry.batch,
                time_slot: timeSlot
              });
              
              totalClasses++;
            }
          }
        }
      }
    }

    console.log(`✅ Found ${totalClasses} classes for ${teacherName}`);

    res.json({
      success: true,
      teacherName,
      timetable: teacherTimetable,
      totalClasses,
      generatedAt: new Date(),
      note: "This timetable is generated dynamically from class timetables"
    });
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher timetable",
      error: error.message
    });
  }
};

/**
 * Get ALL teacher timetables (derived from class timetables)
 */
export const getAllTeacherTimetables = async (req, res) => {
  try {
    console.log("👥 Building all teacher timetables dynamically...");

    // Get all class timetables
    const allTimetables = await timetableModel.find({}).lean();

    // Build map of all teachers
    const teacherMap = {};
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Extract all teachers and their classes
    for (const tt of allTimetables) {
      for (const day of days) {
        if (!tt.timetableData[day]) continue;

        for (const [timeSlot, entries] of Object.entries(tt.timetableData[day])) {
          for (const entry of entries) {
            const teacher = entry.teacher;
            if (!teacher) continue;

            if (!teacherMap[teacher]) {
              teacherMap[teacher] = {};
              days.forEach(d => {
                teacherMap[teacher][d] = {};
              });
            }

            if (!teacherMap[teacher][day][timeSlot]) {
              teacherMap[teacher][day][timeSlot] = [];
            }

            teacherMap[teacher][day][timeSlot].push({
              subject: entry.subject,
              type: entry.type,
              year: tt.year,
              division: tt.division,
              room: entry.room,
              batch: entry.batch,
              time_slot: timeSlot
            });
          }
        }
      }
    }

    // Convert to array
    const teacherTimetables = Object.keys(teacherMap).map(teacher => ({
      teacher,
      timetable: teacherMap[teacher]
    })).sort((a, b) => a.teacher.localeCompare(b.teacher));

    console.log(`✅ Built timetables for ${teacherTimetables.length} teachers`);

    res.json({
      success: true,
      teachers: teacherTimetables,
      count: teacherTimetables.length,
      generatedAt: new Date(),
      note: "These timetables are generated dynamically from class timetables"
    });
  } catch (error) {
    console.error("Error building teacher timetables:", error);
    res.status(500).json({
      success: false,
      message: "Failed to build teacher timetables",
      error: error.message
    });
  }
};

// Get statistics
export const getTimetableStats = async (req, res) => {
  try {
    const totalTimetables = await timetableModel.countDocuments();

    const yearStats = await timetableModel.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalTimetables,
        byYear: yearStats
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};