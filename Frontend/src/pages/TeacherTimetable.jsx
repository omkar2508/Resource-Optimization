import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance"; 
import {
  TimetableTable,
  downloadTimetableCSV,
} from "../utils/renderTimetableCell.jsx";
import { useNavigate } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TeacherTimetable() {
  const [teacherTTs, setTeacherTTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        const res = await axiosInstance.get("/api/timetable/all");
        
        console.log("Teacher timetable fetch response:", res.data);
        
        if (res.data.success) {
          const teacherMap = buildTeacherTimetablesFromClass(
            res.data.timetables || []
          );
          setTeacherTTs(teacherMap);
          console.log(` Built ${teacherMap.length} teacher timetables`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error response:", err.response?.data);
        
        if (err.response?.status === 401) {
          alert("Session expired. Please login again.");
          navigate("/admin/login");
        } else {
          alert(err.response?.data?.message || "Failed to fetch timetables");
        }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
      <div className="pt-5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          Teacher Timetables
        </h2>

        {teacherTTs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
  
  {/* Icon */}
  <div className="w-20 h-20 rounded-full
                  bg-gradient-to-br from-blue-100 to-cyan-100
                  flex items-center justify-center mb-6">
    <span className="text-4xl">📅</span>
  </div>

  {/* Title */}
  <h2 className="text-2xl font-bold text-gray-800 mb-2">
    No Timetables Yet
  </h2>

  {/* Description */}
  <p className="text-gray-500 max-w-md mb-6">
    You haven't generated or saved any timetables yet.
    Start by configuring years, subjects, teachers, and rooms.
  </p>

  {/* Primary Action */}
  <button
    onClick={() => navigate("/admin/dashboard")}
    className="px-6 py-3
               bg-gradient-to-r from-blue-600 to-cyan-400
               text-white font-semibold rounded-xl
               shadow-lg hover:shadow-xl
               transition-all flex items-center gap-2"
  >
    <span>⚡</span>
    Generate Your First Timetable
  </button>

  {/* Secondary Hint */}
  <p className="mt-4 text-xs text-blue-600">
    You can always edit and regenerate later
  </p>
</div>

        )}

        {teacherTTs.map((tt) => (
          <div
            key={tt.teacher}
            className="border p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 bg-white rounded-lg sm:rounded-xl shadow-md"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg md:text-xl truncate">
                  {tt.teacher}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {tt.totalClasses} classes • {tt.days.length} days
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => downloadTimetableCSV(tt.timetable, tt.teacher, DAYS)}
                  className="flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs sm:text-sm transition-colors whitespace-nowrap"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
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
          //PRESERVE ALL FIELDS including lab_part for multi-hour labs
          teacherMap[teacher][day][timeSlot].push({
            subject: entry.subject,
            type: entry.type,
            teacher: teacher, // Include teacher name for consistency
            year: entry.year || year,
            division: entry.division || division,
            room: entry.room,
            batch: entry.batch,
            time_slot: timeSlot,
            lab_part: entry.lab_part, //CRITICAL: Preserve lab_part (e.g., "1/2", "2/2")
            lab_session_id: entry.lab_session_id, //CRITICAL: Preserve session ID for grouping
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