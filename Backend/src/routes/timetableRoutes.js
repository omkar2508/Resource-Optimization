import express from "express";
import timetableModel from "../models/timetableModel.js";

const router = express.Router();

// SAVE OR UPDATE TIMETABLE
router.post("/save", async (req, res) => {
  try {
    const { year, division, timetableData } = req.body;

    if (!year || !division) {
      return res
        .status(400)
        .json({ success: false, message: "Year and division required" });
    }

    let existing = await timetableModel.findOne({
      year,
      division,
      department: "Software Engineering", // Default match
    });

    if (existing) {
      existing.timetableData = timetableData;
      await existing.save();
      return res.json({
        success: true,
        message: "Timetable updated successfully",
        timetable: existing,
      });
    }

    const newTT = await timetableModel.create({
      year,
      division,
      department: "Software Engineering",
      timetableData,
    });

    return res.json({
      success: true,
      message: "Timetable saved successfully",
      timetable: newTT,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
