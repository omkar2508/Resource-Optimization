// src/pages/TeacherTimetable.jsx - FIXED: Matches generated timetable exactly
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  TimetableTable,
  downloadTimetableCSV,
} from "../utils/renderTimetableCell.jsx";

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
          const teacherMap = buildTeacherTimetablesFromClass(
            res.data.timetables || []
          );
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
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">
          Building teacher timetables…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Teacher Timetables
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
            Generated dynamically from class timetables • Always up-to-date
          </p>
        </div>

        {teacherTTs.length === 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border text-center text-sm sm:text-base text-gray-500">
            No teacher timetables found. Generate class timetables first.
          </div>
        )}

        {teacherTTs.map((tt) => (
          <div
            key={tt.teacher}
            className="mb-6 sm:mb-8 bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 sm:p-5 md:p-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg sm:text-xl md:text-2xl mb-2 truncate">{tt.teacher}</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-blue-100">
                    <span>📚 {tt.totalClasses} classes</span>
                    <span>📅 {tt.days.length} days</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    downloadTimetableCSV(tt.timetable, tt.teacher, DAYS)
                  }
                  className="px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg text-xs sm:text-sm font-semibold transition-all border border-white/30 whitespace-nowrap w-full sm:w-auto"
                >
                  📥 Download CSV
                </button>
              </div>
            </div>

            {/* Timetable Section */}
            <div className="p-3 sm:p-4 md:p-6 overflow-x-auto">
              {/* ✅ UNIFIED RENDERER - Exact same as generated timetable */}
              <TimetableTable
                data={tt.timetable}
                DAYS={DAYS}
                renderOptions={{
                  showYearDivision: true, // Show which class they're teaching
                  filterByBatch: null, // No batch filtering
                  highlightBatch: false, // No highlighting
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Build teacher timetables DYNAMICALLY from class timetables
 * ✅ CRITICAL: Preserves TIME SLOTS, not period numbers
 * ✅ CRITICAL: Preserves lab_part for multi-hour continuous labs
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

      // For each time slot in the day (e.g., "08:00-09:00", "09:00-10:00")
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
            teacher: teacher, // Include teacher name for consistency
            year: entry.year || year,
            division: entry.division || division,
            room: entry.room,
            batch: entry.batch,
            time_slot: timeSlot,
            lab_part: entry.lab_part, // ✅ CRITICAL: Preserve lab_part (e.g., "1/2", "2/2")
            lab_session_id: entry.lab_session_id, // ✅ CRITICAL: Preserve session ID for grouping
          });
        });
      });
    });
  });

  // Convert map to array with metadata
  return Object.keys(teacherMap)
    .map((teacher) => {
      const timetable = teacherMap[teacher];

      // Calculate statistics
      let totalClasses = 0;
      const daysSet = new Set();

      Object.keys(timetable).forEach((day) => {
        daysSet.add(day);
        Object.keys(timetable[day]).forEach((slot) => {
          totalClasses += timetable[day][slot].length;
        });
      });

      return {
        teacher,
        timetable,
        totalClasses,
        days: Array.from(daysSet),
      };
    })
    .sort((a, b) => a.teacher.localeCompare(b.teacher));
}
