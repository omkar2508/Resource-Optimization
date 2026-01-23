import { callPythonScheduler } from "../utils/callPython.js";
import Timetable from "../models/timetableModel.js";

export const generateTimetable = async (req, res) => {
  try {
    const payload = req.body;

    const savedTimetables = await Timetable.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    // TEMP: comment this line if solver misbehaves
    payload.saved_timetables = savedTimetables;

    const years = Object.keys(payload.years || {});
    const firstYear = years[0] || "Unknown";

    const firstDivision =
      payload.teachers?.[0]?.divisions?.[firstYear]?.[0] || "1";

    console.log("Sending payload to scheduler...");

    const result = await callPythonScheduler(payload);

    console.log("RAW PYTHON RESULT:", JSON.stringify(result, null, 2));

    if (!result || typeof result !== "object") {
      throw new Error("Invalid response from scheduler");
    }

    let saved = null;
    if (result.class_timetable) {
      saved = await Timetable.create({
        year: firstYear,
        division: firstDivision,
        timetableData: result.class_timetable,
        teacherTimetable: result.teacher_timetable || {},
        conflicts: result.conflicts || [],
        unallocated: result.unallocated || [],
        warnings: result.warnings || [],
        critical_issues: result.critical_issues || [],
      });
    }

    return res.json({
      status: result.status ?? "success",
      message: "Timetable generated successfully",
      timetable: {
        class_timetable: result.class_timetable ?? {},
        teacher_timetable: result.teacher_timetable ?? {},
        conflicts: result.conflicts ?? [],
        unallocated: result.unallocated ?? [],
        recommendations: result.recommendations ?? [],
        warnings: result.warnings ?? [],
        critical_issues: result.critical_issues ?? [],
      },
      savedId: saved?._id || null
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
