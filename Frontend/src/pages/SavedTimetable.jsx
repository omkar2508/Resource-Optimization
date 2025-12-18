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

  return (
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">Period / Day</th>
          {DAYS.map((d) => (
            <th key={d} className="border p-2">
              {d}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {PERIODS.map((p) => (
          <tr key={p}>
            <td className="border p-2 font-semibold bg-gray-50">P{p}</td>

            {DAYS.map((d) => (
              <td key={d} className="border p-2 align-top">
                {(data[d]?.[p] || []).map((entry, i) => (
                  <div
                    key={i}
                    className="p-1 mb-1 border rounded bg-white shadow-sm"
                  >
                    <strong>{entry.subject}</strong>
                    <br />
                    {entry.teacher && (
                      <span className="text-xs text-gray-700">
                        {entry.teacher}
                      </span>
                    )}
                    {entry.year && (
                      <span className="text-xs text-gray-700">
                        {entry.year} – Div {entry.division}
                      </span>
                    )}
                  </div>
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
