import { callPythonScheduler } from "../utils/callPython.js";

export async function generateTimetable(req, res) {
  try {
    const payload = req.body;

    const result = await callPythonScheduler(payload);

    return res.json({
      status: "success",
      timetable: result
    });
  } catch (err) {
    console.error("Scheduler error:", err);

    return res.status(500).json({
      status: "error",
      message: "Scheduler failed. Check Python logs.",
      error: err.toString()
    });
  }
}
