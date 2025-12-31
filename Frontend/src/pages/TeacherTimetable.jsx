// src/pages/TeacherTimetable.jsx - FIXED: Uses unified renderer
import React, { useEffect, useState } from "react";
import axios from "axios";
import { TimetableTable, downloadTimetableCSV } from "../utils/renderTimetableCell.jsx";

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
                onClick={() => downloadTimetableCSV(tt.timetable, tt.teacher, DAYS)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 transition"
              >
                Download CSV
              </button>
            </div>
          </div>

          {/* ✅ UNIFIED RENDERER - Same as generated timetable, showing year/division */}
          <TimetableTable 
            data={tt.timetable} 
            DAYS={DAYS}
            renderOptions={{
              showYearDivision: true,   // Show which class they're teaching
              filterByBatch: null,       // No batch filtering
              highlightBatch: false      // No highlighting
            }}
          />
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
          // ✅ PRESERVE ALL FIELDS including lab_part for multi-hour labs
          teacherMap[teacher][day][timeSlot].push({
            subject: entry.subject,
            type: entry.type,
            year: entry.year || year,
            division: entry.division || division,
            room: entry.room,
            batch: entry.batch,
            time_slot: timeSlot,
            lab_part: entry.lab_part,              // ✅ CRITICAL: Preserve lab_part
            lab_session_id: entry.lab_session_id   // ✅ CRITICAL: Preserve session ID
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