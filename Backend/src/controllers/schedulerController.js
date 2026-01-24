import { callPythonScheduler } from "../utils/callPython.js";
import Timetable from "../models/timetableModel.js";

export const generateTimetable = async (req, res) => {
  try {
    const payload = req.body;

    const savedTimetables = await Timetable.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    payload.saved_timetables = savedTimetables;

    console.log("Sending payload to scheduler...");

    const result = await callPythonScheduler(payload);

    console.log("RAW PYTHON RESULT:", JSON.stringify(result, null, 2));

    if (!result || typeof result !== "object") {
      throw new Error("Invalid response from scheduler");
    }
    
    return res.json({
      status: result.status ?? "success",
      message: "Timetable generated successfully",
      timetable: {
        class_timetable: result.class_timetable ?? {},
        teacher_timetable: result.teacher_timetable ?? {},
        conflicts: result.conflicts ?? [],
        room_conflicts: result.room_conflicts ?? [],
        unallocated: result.unallocated ?? [],
        recommendations: result.recommendations ?? [],
        warnings: result.warnings ?? [],
        critical_issues: result.critical_issues ?? [],
        lab_conflicts: result.lab_conflicts ?? [],
      },
    });

  } catch (err) {
    console.error("BACKEND SCHEDULER ERROR:");
    console.error(err.response?.data || err.stack || err.message);

    return res.status(500).json({
      status: "error",
      message: "Scheduler failed",
      realError: err.response?.data || err.message
    });
  }
};