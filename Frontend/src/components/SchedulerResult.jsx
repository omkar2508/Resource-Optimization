import React from "react";
import axios from "axios";

/**
 * Helper to render a cell (array of entries) to readable text
 */
function renderCell(cell) {
  if (!cell || cell.length === 0) return "-";

  return cell
    .map((entry) => {
      if (entry.teacher) {
        return `${entry.subject} (${entry.teacher})`;
      }
      if (entry.year && entry.division) {
        return `${entry.subject} (${entry.year} - Div ${entry.division})`;
      }
      return JSON.stringify(entry);
    })
    .join(", ");
}

/**
 * Download helper: JSON
 */
function downloadJSON(obj, fileName) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName + ".json";
  link.click();
}

/**
 * Download helper: CSV for class/teacher table (flatten)
 * table: { Day: { period: [entries] } }
 */
function downloadCSV(table, fileName) {
  let csv = "Day,Period,Subject,Teacher,Year,Division\n";
  Object.keys(table).forEach((day) => {
    Object.keys(table[day]).forEach((period) => {
      const cell = table[day][period] || [];
      if (cell.length === 0) {
        csv += `${day},${period},-,-,-,-\n`;
      } else {
        cell.forEach((entry) => {
          csv += `${day},${period},${entry.subject || "-"},${
            entry.teacher || "-"
          },${entry.year || "-"},${entry.division || "-"}\n`;
        });
      }
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName + ".csv";
  link.click();
}

/**
 * SchedulerResult component
 *
 * Props:
 *  - result: { class_timetable, teacher_timetable, ... }
 *  - onBack: () => void
 *  - onSave: optional callback (outerKey, table, isTeacher) => Promise/resolution
 *
 * If onSave is not provided we still attempt a POST to /api/timetable/save.
 */
export default function SchedulerResult({ result, onBack, onSave }) {
  if (!result) return <p>No timetable received.</p>;

  const classTT = result.class_timetable || {};
  const teacherTT = result.teacher_timetable || {};

  // Default save implementation (if parent didn't provide onSave)
  const defaultSave = async (outerKey, table, isTeacher = false) => {
    // build payload similar to earlier schema. For class tables outerKey we expect "Year" and "Division"
    let payload = {};
    if (isTeacher) {
      payload = {
        timetableType: "teacher",
        teacherName: outerKey,
        timetableData: table,
      };
    } else {
      // outerKey expected as "YEAR" or "YEAR Div N" — try to extract conservatively
      const parts = String(outerKey).split(" ");
      const year = parts[0] || outerKey;
      // try to find a number for division in the parts
      const divMatch = parts.find((p) => /^\d+$/.test(p));
      const division = divMatch || "1";

      payload = {
        timetableType: "class",
        year,
        division,
        timetableData: table,
      };
    }

    try {
      const res = await axios.post("/api/timetable/save", payload);
      if (res?.data?.success) {
        alert("Saved successfully: " + (res.data.message || ""));
        return res.data;
      } else {
        alert("Save failed: " + JSON.stringify(res.data || "no response"));
        return res.data;
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving timetable. See console.");
      throw err;
    }
  };

  // Called by UI Save button
  const handleSave = (outerKey, table, isTeacher = false) => {
    if (onSave) {
      // parent provided handler - prefer it
      try {
        const maybePromise = onSave(outerKey, table, isTeacher);
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.catch((e) => console.error("onSave error", e));
        }
      } catch (e) {
        console.error("onSave threw", e);
      }
    } else {
      defaultSave(outerKey, table, isTeacher).catch(() => {});
    }
  };

  // Simple edit flow: open prompt with JSON, let user edit, parse and call save
  const handleEdit = (outerKey, table, isTeacher = false) => {
    const current = JSON.stringify(table, null, 2);
    // warn if big
    const edited = window.prompt(
      `Edit timetable JSON for "${outerKey}".\n(If empty or cancel — no changes)`,
      current
    );
    if (!edited) return;
    try {
      const parsed = JSON.parse(edited);
      // call save with parsed (this re-uses handleSave so it posts)
      handleSave(outerKey, parsed, isTeacher);
    } catch (err) {
      alert("Invalid JSON. Edit aborted. See console for error.");
      console.error("JSON parse error in edit:", err);
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded max-w-5xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-6">Generated Timetable</h2>

      {/* ========== CLASS TIMETABLES ========== */}
      <h3 className="text-xl font-semibold mb-4">Class Timetables</h3>

      {Object.keys(classTT).map((year) =>
        Object.keys(classTT[year]).map((division) => {
          const tt = classTT[year][division];
          const days = Object.keys(tt || {});

          // Outer display key (used for save/edit/download label)
          const outerKey = `${year} Div ${division}`;

          return (
            <div key={`${year}-${division}`} className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold">
                  {year} – Division {division}
                </h4>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(outerKey, tt, false)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleSave(outerKey, tt, false)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => downloadJSON(tt, outerKey)}
                    className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
                  >
                    Download JSON
                  </button>

                  <button
                    onClick={() => downloadCSV(tt, outerKey)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-400">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 p-2 bg-gray-100">
                        Day
                      </th>
                      {days.length > 0 &&
                        Object.keys(tt[days[0]]).map((period) => (
                          <th
                            key={period}
                            className="border border-gray-400 p-2 bg-gray-100"
                          >
                            P{period}
                          </th>
                        ))}
                    </tr>
                  </thead>

                  <tbody>
                    {days.map((day) => (
                      <tr key={day}>
                        <td className="border border-gray-300 p-2 bg-gray-50 font-semibold">
                          {day}
                        </td>

                        {Object.keys(tt[day]).map((period) => (
                          <td
                            key={period}
                            className="border border-gray-300 p-2 text-sm"
                          >
                            {renderCell(tt[day][period])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* ========== TEACHER TIMETABLES ========== */}
      <h3 className="text-xl font-semibold mb-4 mt-10">Teacher Timetables</h3>

      {Object.keys(teacherTT).map((teacher) => {
        const tt = teacherTT[teacher];
        const days = Object.keys(tt || {});

        return (
          <div key={teacher} className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-bold">{teacher}</h4>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(teacher, tt, true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleSave(teacher, tt, true)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Save
                </button>

                <button
                  onClick={() => downloadJSON(tt, teacher)}
                  className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
                >
                  Download JSON
                </button>

                <button
                  onClick={() => downloadCSV(tt, teacher)}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                  Download CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 p-2 bg-gray-100">
                      Day
                    </th>
                    {days.length > 0 &&
                      Object.keys(tt[days[0]]).map((period) => (
                        <th
                          key={period}
                          className="border border-gray-400 p-2 bg-gray-100"
                        >
                          P{period}
                        </th>
                      ))}
                  </tr>
                </thead>

                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <td className="border border-gray-300 p-2 bg-gray-50 font-semibold">
                        {day}
                      </td>

                      {Object.keys(tt[day]).map((period) => (
                        <td
                          key={period}
                          className="border border-gray-300 p-2 text-sm"
                        >
                          {renderCell(tt[day][period])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <button
        onClick={onBack}
        className="mt-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        ← Back
      </button>
    </div>
  );
}
