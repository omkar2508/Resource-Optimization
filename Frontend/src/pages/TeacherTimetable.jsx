// src/pages/TeacherTimetable.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TeacherTimetable() {
  const [teacherTTs, setTeacherTTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/timetable/all");
        if (res.data.success) {
          // Build teacher timetables dynamically from class timetables
          const teacherMap = buildTeacherTimetablesFromClass(res.data.timetables || []);
          setTeacherTTs(teacherMap);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Failed to fetch timetables");
      }
      setLoading(false);
    };

    fetchAndBuild();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">Building teacher timetables…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Teacher Timetables</h2>
        <p className="text-sm text-gray-600 mt-1">
          Generated dynamically from class timetables • Always up-to-date
        </p>
      </div>

      {teacherTTs.length === 0 && (
        <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
          No teacher timetables found. Generate class timetables first.
        </div>
      )}

      {teacherTTs.map((tt) => (
        <div
          key={tt.teacher}
          className="border p-4 mb-6 bg-white rounded-xl shadow-md"
        >
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{tt.teacher}</h3>
              <p className="text-sm text-gray-500">
                {tt.totalClasses} classes across {tt.days.length} days
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadCSV(tt.timetable, tt.teacher)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
              >
                Download CSV
              </button>
            </div>
          </div>

          <TeacherTable data={tt.timetable} />
        </div>
      ))}
    </div>
  );
}

/**
 * Build teacher timetables DYNAMICALLY from class timetables
 * This ensures teacher timetables are always in sync with class timetables
 */
function buildTeacherTimetablesFromClass(classTimetables) {
  const teacherMap = {};

  // Iterate through all class timetables
  classTimetables.forEach((doc) => {
    const year = doc.year;
    const division = doc.division;
    const table = doc.timetableData || {};

    // For each day in the timetable
    Object.keys(table).forEach((day) => {
      const dayData = table[day] || {};
      
      // For each time slot in the day
      Object.keys(dayData).forEach((timeSlot) => {
        const entries = dayData[timeSlot] || [];

        // For each class entry in that time slot
        entries.forEach((entry) => {
          const teacher = entry.teacher;
          if (!teacher) return;

          // Initialize teacher's timetable structure
          if (!teacherMap[teacher]) {
            teacherMap[teacher] = {};
          }
          if (!teacherMap[teacher][day]) {
            teacherMap[teacher][day] = {};
          }
          if (!teacherMap[teacher][day][timeSlot]) {
            teacherMap[teacher][day][timeSlot] = [];
          }

          // Add this class to teacher's timetable
          teacherMap[teacher][day][timeSlot].push({
            subject: entry.subject,
            type: entry.type,
            year: entry.year || year,
            division: entry.division || division,
            room: entry.room,
            batch: entry.batch,
            time_slot: timeSlot
          });
        });
      });
    });
  });

  // Convert map to array with metadata
  return Object.keys(teacherMap).map((teacher) => {
    const timetable = teacherMap[teacher];
    
    // Calculate statistics
    let totalClasses = 0;
    const daysSet = new Set();
    
    Object.keys(timetable).forEach(day => {
      daysSet.add(day);
      Object.keys(timetable[day]).forEach(slot => {
        totalClasses += timetable[day][slot].length;
      });
    });

    return {
      teacher,
      timetable,
      totalClasses,
      days: Array.from(daysSet)
    };
  }).sort((a, b) => a.teacher.localeCompare(b.teacher));
}

function downloadCSV(table, filename) {
  // Get all time slots
  const allTimeSlots = new Set();
  DAYS.forEach(day => {
    if (table[day]) {
      Object.keys(table[day]).forEach(slot => allTimeSlots.add(slot));
    }
  });
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  let csv = "Time Slot / Day";
  DAYS.forEach((d) => {
    if (table[d]) csv += `,${d}`;
  });
  csv += "\n";

  sortedTimeSlots.forEach((slot) => {
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
            const yr = entry.year || "";
            const div = entry.division || "";
            const room = entry.room || "";
            const batch = entry.batch ? `B${entry.batch}` : "";

            const extra = [yr, div && `Div${div}`, room, batch]
              .filter(Boolean)
              .join(" ");

            return `${subj} (${extra})`;
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
}

function TeacherTable({ data }) {
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
              <th key={d} className="border p-4 min-w-[160px] text-center">
                {d}
              </th>
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
                  {(data[d]?.[timeSlot] || []).map((entry, i) => (
                    <div
                      key={i}
                      className={`p-3 mb-2 border-l-4 rounded-xl shadow-md transition-transform hover:scale-[1.02] ${
                        entry.type === 'Theory' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-purple-50 border-purple-500'
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
                      <div className="text-[11px] text-gray-600 mt-2 space-y-1">
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
                  {(data[d]?.[timeSlot] || []).length === 0 && (
                    <div className="py-8 text-center">
                      <span className="text-gray-300 font-medium tracking-widest text-[10px] uppercase">Free</span>
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