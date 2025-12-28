// src/pages/StudentTimetable.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { Navbar } from "../components/Navbar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function StudentTimetable() {
  const { userData } = useAppContext();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetables = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/timetable/all");

      if (res.data.success) {
        let allData = res.data.timetables;

        if (userData?.role === "student") {
          allData = allData.filter(
            (item) =>
              item.year === userData.year && 
              String(item.division) === String(userData.division)
          );
        }

        setTimetables(allData);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetables();
  }, [userData]);

  const downloadCSV = (table, filename) => {
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
              const subj = entry.subject || "-";
              const teach = entry.teacher || "-";
              const room = entry.room || "";
              const batch = entry.batch ? `B${entry.batch}` : "";

              return `${subj} (${teach} ${room} ${batch})`.trim();
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
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">Fetching your personal timetable...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 pb-10">
      <Navbar />
      <div className="p-10 max-w-7xl mx-auto pt-24">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          {userData?.role === "student" ? "My Class Timetable" : "View Timetable"}
        </h2>

        {timetables.length === 0 && (
          <div className="bg-white p-10 rounded-2xl shadow-xl text-center text-gray-500 border border-gray-100">
            No timetable found for {userData?.year} Year-Division {userData?.division}.
          </div>
        )}

        {timetables.map((item) => (
          <div key={item._id} className="mb-10 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-white p-5 flex justify-between items-center text-black border-b border-gray-100">
              <div className="flex flex-col">
                <h3 className="font-bold text-2xl text-blue-900">
                  {item.year} — Division {item.division}
                </h3>
                {userData?.batch && (
                  <span className="text-sm font-semibold text-blue-600 mt-1">
                    Batch: {userData.batch}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => downloadCSV(item.timetableData, `${item.year}_Div${item.division}`)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                >
                  Download CSV
                </button>
              </div>
            </div>

            <div className="p-6">
              <TableViewer data={item.timetableData} studentBatch={userData?.batch} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableViewer({ data, studentBatch }) {
  if (!data) return null;

  // Get all unique time slots
  const allTimeSlots = new Set();
  DAYS.forEach(day => {
    if (data[day]) {
      Object.keys(data[day]).forEach(slot => allTimeSlots.add(slot));
    }
  });
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white font-bold">
            <th className="border p-4 w-32 text-center">Time Slot</th>
            {DAYS.map((d) => data[d] && (
              <th key={d} className="border p-4 min-w-[160px] text-center">{d}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedTimeSlots.map((timeSlot) => (
            <tr key={timeSlot} className="hover:bg-blue-50/30 transition-colors">
              <td className="border p-4 font-black bg-blue-50 text-blue-700 text-center text-sm">
                {timeSlot}
              </td>

              {DAYS.map((d) => data[d] && (
                <td key={d} className="border p-3 align-top min-h-[110px]">
                  {(data[d][timeSlot] || [])
                    .filter(entry => {
                        if (studentBatch && entry.batch && entry.type !== "Theory") {
                            return String(entry.batch) === String(studentBatch);
                        }
                        return true; 
                    })
                    .map((entry, i) => (
                    <div
                      key={i}
                      className={`p-3 mb-2 border-l-4 rounded-xl shadow-md transition-transform hover:scale-[1.02] ${
                        entry.type === 'Theory' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-purple-50 border-purple-500 min-h-[45px]'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-gray-900 text-[13px]">
                        <span>{entry.subject}</span>
                        {entry.batch && (
                          <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Batch {entry.batch}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="opacity-70">👤</span> {entry.teacher}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-70">📍</span> {entry.room}
                        </div>
                        {entry.time_slot && (
                          <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                            <span className="opacity-70">🕐</span> {timeSlot}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(data[d][timeSlot] || []).filter(entry => {
                    if (studentBatch && entry.batch && entry.type !== "Theory") {
                      return String(entry.batch) === String(studentBatch);
                    }
                    return true;
                  }).length === 0 && (
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