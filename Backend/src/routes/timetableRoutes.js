import express from "express";
import timetableModel from "../models/timetableModel.js";

const router = express.Router();

// SAVE OR UPDATE TIMETABLE
router.post("/save", async (req, res) => {
  try {
    const { year, division, timetableData, department } = req.body;

    // Validate required fields
    if (!year || !division) {
      return res
        .status(400)
        .json({ 
          success: false, 
          message: "Year and division are required" 
        });
    }

    if (!timetableData || typeof timetableData !== 'object' || Object.keys(timetableData).length === 0) {
      return res
        .status(400)
        .json({ 
          success: false, 
          message: "Timetable data is required and must not be empty" 
        });
    }

    // Use provided department or default to "Software Engineering"
    const dept = department || "Software Engineering";

    // Check if timetable already exists
    let existing = await timetableModel.findOne({
      year: String(year),
      division: String(division),
      department: dept,
    });

    if (existing) {
      // Update existing timetable
      existing.timetableData = timetableData;
      existing.updatedAt = new Date();
      await existing.save();
      
      console.log(`✅ Updated timetable: ${year} - Division ${division} - ${dept}`);
      
      return res.json({
        success: true,
        message: `Timetable updated successfully for ${year} - Division ${division}`,
        timetable: existing,
      });
    }

    // Create new timetable
    const newTT = await timetableModel.create({
      year: String(year),
      division: String(division),
      department: dept,
      timetableData,
    });

    console.log(`✅ Created new timetable: ${year} - Division ${division} - ${dept}`);

    return res.json({
      success: true,
      message: `Timetable saved successfully for ${year} - Division ${division}`,
      timetable: newTT,
    });
  } catch (err) {
    console.error("❌ Error saving timetable:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to save timetable: " + err.message 
    });
  }
});

// GET ALL TIMETABLES
router.get("/all", async (req, res) => {
  try {
    const all = await timetableModel
      .find({ department: "Software Engineering" })
      .sort({ createdAt: -1 });

    return res.json({ success: true, timetables: all });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE TIMETABLE
router.delete("/delete/:id", async (req, res) => {
  try {
    await timetableModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Timetable deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
