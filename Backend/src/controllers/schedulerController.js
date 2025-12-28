import { callPythonScheduler } from "../utils/callPython.js";
import timetableModel from "../models/timetableModel.js";

export async function generateTimetable(req, res) {
  try {
    const payload = req.body;

    // STEP 1: Fetch all saved timetables for conflict checking
    const savedTimetables = await timetableModel.find({}, {
      year: 1,
      division: 1,
      timetableData: 1,
      _id: 0
    }).lean();

    console.log(`Found ${savedTimetables.length} saved timetables for conflict checking`);

    // STEP 2: Add saved timetables to payload
    payload.saved_timetables = savedTimetables;

    // STEP 3: Call Python scheduler with validation
    const result = await callPythonScheduler(payload);

    // STEP 4: Return result with all validation data
    return res.json({
      status: result.status || "success",
      timetable: {
        class_timetable: result.class_timetable || {},
        teacher_timetable: result.teacher_timetable || {},
        conflicts: result.conflicts || [],
        unallocated: result.unallocated || [],
        recommendations: result.recommendations || [],
        warnings: result.warnings || [],
        critical_issues: result.critical_issues || []
      }
    });
  } catch (err) {
    console.error("Scheduler error:", err);

    return res.status(500).json({
      status: "error",
      message: "Scheduler failed. Check Python logs.",
      error: err.toString(),
      timetable: {
        class_timetable: {},
        teacher_timetable: {},
        conflicts: [],
        unallocated: [],
        recommendations: [],
        warnings: [err.toString()],
        critical_issues: [err.toString()]
      }
    });
  }
}