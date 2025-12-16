import React from "react";
import axios from "axios";

const ORDERED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Inside src/components/SchedulerResult.jsx
function renderCell(cell) {
  if (!cell || cell.length === 0) return <span className="text-gray-300">-</span>;

  return (
    <div className="flex flex-col gap-1 min-h-[60px]">
      {cell.map((entry, idx) => (
        <div 
          key={idx} 
          className={`p-2 text-[11px] leading-tight border-l-4 rounded shadow-sm ${
            entry.type === 'Theory' 
              ? 'bg-blue-50 border-blue-500' 
              : 'bg-purple-50 border-purple-500'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="font-bold text-gray-800">
              {entry.type === "Lab" ? "🧪 " : ""}{entry.subject}
            </span>
            {entry.batch && (
              <span className="bg-purple-200 text-purple-800 px-1 rounded font-bold">
                B{entry.batch}
              </span>
            )}
          </div>
          <div className="text-gray-600 mt-1">
            <span className="block">👤 {entry.teacher}</span>
            <span className="block">📍 {entry.room}</span>
          </div>
          {/* Detailed info for Teacher View */}
          {entry.year && (
            <div className="mt-1 border-t pt-1 border-gray-200 text-[9px] font-medium text-gray-500">
              {entry.year} | Div {entry.division}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function downloadJSON(obj, fileName) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName + ".json";
  link.click();
}

function downloadCSV(table, fileName) {
  // FIXED: Proper CSV format with headers including room info
  let csv = "Day,Period,Subject,Teacher,Year,Division,Type,Batch,Room\n";

  ORDERED_DAYS.forEach((day) => {
    if (!table[day]) return;
    
    Object.keys(table[day])
      .sort((a, b) => Number(a) - Number(b))
      .forEach((period) => {
        const cell = table[day][period] || [];
        
        if (cell.length === 0) {
          csv += `${day},P${period},-,-,-,-,-,-,-\n`;
        } else {
          cell.forEach((entry) => {
            const subj = entry.subject || "-";
            const teach = entry.teacher || "-";
            const yr = entry.year || "-";
            const div = entry.division || "-";
            const type = entry.type || "Theory";
            const batch = entry.batch || "-";
            const room = entry.room || "-";
            
            csv += `${day},P${period},"${subj}","${teach}","${yr}","${div}","${type}","${batch}","${room}"\n`;
          });
        }
      });
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName + ".csv";
  link.click();
}

export default function SchedulerResult({ result, onBack, onSave }) {
  if (!result) return <p>No timetable received.</p>;

  const classTT = result.class_timetable || {};
  const teacherTT = result.teacher_timetable || {};

  const defaultSave = async (outerKey, table, isTeacher = false) => {
    let payload = {};
    if (isTeacher) {
      payload = {
        timetableType: "teacher",
        teacherName: outerKey,
        timetableData: table,
      };
    } else {
      const parts = String(outerKey).split(" ");
      const year = parts[0] || outerKey;
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
      const res = await axios.post("http://localhost:5000/api/timetable/save", payload);
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

  const handleSave = (outerKey, table, isTeacher = false) => {
    if (onSave) {
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

  const handleEdit = (outerKey, table, isTeacher = false) => {
    const current = JSON.stringify(table, null, 2);
    const edited = window.prompt(
      `Edit timetable JSON for "${outerKey}".\n(If empty or cancel – no changes)`,
      current
    );
    if (!edited) return;
    try {
      const parsed = JSON.parse(edited);
      handleSave(outerKey, parsed, isTeacher);
    } catch (err) {
      alert("Invalid JSON. Edit aborted. See console for error.");
      console.error("JSON parse error in edit:", err);
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded max-w-5xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-6">Generated Timetable</h2>

      <h3 className="text-xl font-semibold mb-4">Class Timetables</h3>

      {Object.keys(classTT).map((year) =>
        Object.keys(classTT[year]).map((division) => {
          const tt = classTT[year][division];
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
                        Period / Day
                      </th>
                      {ORDERED_DAYS.map((day) => (
                        tt[day] && (
                          <th
                            key={day}
                            className="border border-gray-400 p-2 bg-gray-100"
                          >
                            {day}
                          </th>
                        )
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tt[ORDERED_DAYS[0]] &&
                      Object.keys(tt[ORDERED_DAYS[0]])
                        .sort((a, b) => Number(a) - Number(b))
                        .map((period) => (
                          <tr key={period}>
                            <td className="border border-gray-300 p-2 bg-gray-50 font-semibold">
                              P{period}
                            </td>

                            {ORDERED_DAYS.map((day) => (
                              tt[day] && (
                                <td
                                  key={day}
                                  className="border border-gray-300 p-2 text-sm"
                                >
                                  {renderCell(tt[day][period])}
                                </td>
                              )
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

      <h3 className="text-xl font-semibold mb-4 mt-10">Teacher Timetables</h3>

      {Object.keys(teacherTT).map((teacher) => {
        const tt = teacherTT[teacher];

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
                      Period / Day
                    </th>
                    {ORDERED_DAYS.map((day) => (
                      tt[day] && (
                        <th
                          key={day}
                          className="border border-gray-400 p-2 bg-gray-100"
                        >
                          {day}
                        </th>
                      )
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tt[ORDERED_DAYS[0]] &&
                    Object.keys(tt[ORDERED_DAYS[0]])
                      .sort((a, b) => Number(a) - Number(b))
                      .map((period) => (
                        <tr key={period}>
                          <td className="border border-gray-300 p-2 bg-gray-50 font-semibold">
                            P{period}
                          </td>

                          {ORDERED_DAYS.map((day) => (
                            tt[day] && (
                              <td
                                key={day}
                                className="border border-gray-300 p-2 text-sm"
                              >
                                {renderCell(tt[day][period])}
                              </td>
                            )
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