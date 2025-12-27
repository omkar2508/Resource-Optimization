// src/components/SavedTimetable.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SavedTimetable() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all saved timetables
  const fetchTimetables = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/timetable/all");

      if (res.data.success) {
        setTimetables(res.data.timetables);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to fetch saved timetables");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const deleteTimetable = async (id) => {
    if (!window.confirm("Delete this timetable?")) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/timetable/delete/${id}`
      );
      if (res.data.success) {
        alert("Deleted successfully");
        fetchTimetables();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete");
    }
  };

  const downloadCSV = (table, filename) => {
    // Export in a grid format similar to the on-screen timetable
    let csv = "Period / Day";
    DAYS.forEach((d) => {
      csv += `,${d}`;
    });
    csv += "\n";

    PERIODS.forEach((p) => {
      csv += `P${p}`;
      DAYS.forEach((d) => {
        const cell = table[d]?.[p] || [];

        if (cell.length === 0) {
          csv += ",-";
        } else {
          const combined = cell
            .map((entry) => {
              const subj = entry.subject || "-";
              const teach = entry.teacher || "-";
              const yr = entry.year || "";
              const div = entry.division || "";
              const room = entry.room || "";

              const extra =
                [yr && `Y:${yr}`, div && `Div:${div}`, room && `R:${room}`]
                  .filter(Boolean)
                  .join(" ");

              return extra
                ? `${subj} (${teach} ${extra})`
                : `${subj} (${teach})`;
            })
            .join(" | ");

          csv += `,"${combined}"`;
        }
      });
      csv += "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename + ".csv";
    link.click();
  };
  if (loading)
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">Fetching data…</p>
      </div>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Saved Timetables</h2>

      {timetables.length === 0 && <p>No saved timetables found.</p>}

      {timetables.map((item) => (
        <div
          key={item._id}
          className="border p-4 mb-6 bg-white rounded shadow-md"
        >
          <div className="flex justify-between mb-2">
            <h3 className="font-bold text-lg">
              {item.year} – Division {item.division}
            </h3>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  downloadCSV(
                    item.timetableData,
                    `${item.year}_Div${item.division}`
                  )
                }
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                Download
              </button>

              <button
                onClick={() => deleteTimetable(item._id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>

          {/* TABLE RENDERING */}
          <TableViewer data={item.timetableData} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TABLE VIEW COMPONENT (same as TimetableViewer but compact) */
/* ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6];

function TableViewer({ data }) {
  if (!data) return null;

  // Dynamic periods logic
  const allPeriods = new Set();
  DAYS.forEach(day => {
    if (data[day]) {
      Object.keys(data[day]).forEach(p => allPeriods.add(Number(p)));
    }
  });
  const sortedPeriods = Array.from(allPeriods).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white font-bold">
            <th className="border p-4 w-24 text-center">Period</th>
            {DAYS.map((d) => data[d] && (
              <th key={d} className="border p-4 min-w-[160px] text-center">{d}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedPeriods.map((p) => (
            <tr key={p} className="hover:bg-blue-50/30 transition-colors">
              <td className="border p-4 font-black bg-blue-50 text-blue-700 text-center text-lg">P{p}</td>

              {DAYS.map((d) => data[d] && (
                <td key={d} className="border p-3 align-top min-h-[110px]">
                  {(data[d][p] || []).map((entry, i) => (
                    <div
                      key={i}
                      className={`p-3 mb-2 border-l-4 rounded-xl shadow-md transition-transform hover:scale-[1.02] ${
                        entry.type === 'Theory' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-purple-50 border-purple-500'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-gray-900 text-[13px]">
                        <span>{entry.subject}</span>
                        {entry.batch && (
                          <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full uppercase">
                            Batch {entry.batch}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="opacity-70">👤</span> {entry.teacher}
                        </div>
                        {entry.year && (
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-70">📚</span> {entry.year} — Div {entry.division}
                          </div>
                        )}
                        {entry.room && (
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-70">📍</span> {entry.room}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(data[d][p] || []).length === 0 && (
                    <div className="py-8 text-center">
                      <span className="text-gray-300 font-medium tracking-widest text-[10px] uppercase">No Class</span>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}