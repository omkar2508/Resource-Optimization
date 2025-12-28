// src/pages/SavedTimetable.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SavedTimetable() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetables = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/timetable/all");
      if (res.data.success) {
        setTimetables(res.data.timetables);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch saved timetables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const confirmDeleteTimetable = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-medium mb-2">
            Are you sure you want to delete this timetable?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeToast}
              className="px-3 py-1 text-sm border rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDeleteTimetable(id);
                closeToast();
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDeleteTimetable = async (id) => {
    try {
      const { data } = await axios.delete(
        `http://localhost:5000/api/timetable/delete/${id}`,
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Timetable deleted successfully");
        fetchTimetables();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete timetable");
    }
  };

  const downloadCSV = (table, filename) => {
    // Get all time slots from first available day
    const firstDay = DAYS.find(d => table[d] && Object.keys(table[d]).length > 0);
    if (!firstDay) return;
    
    const timeSlots = Object.keys(table[firstDay]).sort();
    
    let csv = "Time Slot / Day";
    DAYS.forEach((d) => {
      if (table[d]) csv += `,${d}`;
    });
    csv += "\n";

    timeSlots.forEach((slot) => {
      csv += `${slot}`;
      DAYS.forEach((d) => {
        if (!table[d]) return;
        const cell = table[d]?.[slot] || [];

        if (cell.length === 0) {
          csv += ",-";
        } else {
          const combined = cell
            .map((entry) => {
              const extra = [
                entry.year && `Y:${entry.year}`,
                entry.division && `Div:${entry.division}`,
                entry.room && `R:${entry.room}`,
              ]
                .filter(Boolean)
                .join(" ");

              return extra
                ? `${entry.subject} (${entry.teacher} ${extra})`
                : `${entry.subject} (${entry.teacher})`;
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
              {item.year} — Division {item.division}
            </h3>

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
                onClick={() => confirmDeleteTimetable(item._id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>

          <TableViewer data={item.timetableData} />
        </div>
      ))}
    </div>
  );
}

function TableViewer({ data }) {
  if (!data) return null;

  // Get all unique time slots across all days
  const allTimeSlots = new Set();
  DAYS.forEach((day) => {
    if (data[day]) {
      Object.keys(data[day]).forEach((slot) => allTimeSlots.add(slot));
    }
  });
  
  // Sort time slots
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white font-bold">
            <th className="border p-4 w-32 text-center">Time Slot</th>
            {DAYS.map(
              (d) =>
                data[d] && (
                  <th key={d} className="border p-4 min-w-[160px] text-center">
                    {d}
                  </th>
                )
            )}
          </tr>
        </thead>

        <tbody>
          {sortedTimeSlots.map((timeSlot) => (
            <tr key={timeSlot} className="hover:bg-blue-50/30 transition-colors">
              <td className="border p-4 font-black bg-blue-50 text-blue-700 text-center text-sm">
                {timeSlot}
              </td>

              {DAYS.map(
                (d) =>
                  data[d] && (
                    <td key={d} className="border p-3 align-top min-h-[110px]">
                      {(data[d][timeSlot] || []).map((entry, i) => (
                        <div
                          key={i}
                          className={`p-3 mb-2 border-l-4 rounded-xl shadow-md ${
                            entry.type === "Theory"
                              ? "bg-blue-50 border-blue-500"
                              : "bg-purple-50 border-purple-500"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-gray-900 text-[13px]">
                              {entry.subject}
                            </div>
                            {entry.batch && (
                              <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                B{entry.batch}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-600 mt-2">
                            👤 {entry.teacher} <br />
                            📍 {entry.room}
                          </div>
                        </div>
                      ))}
                    </td>
                  )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}