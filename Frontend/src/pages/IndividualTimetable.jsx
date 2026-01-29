// src/pages/IndividualTeacherTimetable.jsx - FIXED: Uses axiosInstance for auth
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance"; //FIXED: Use axiosInstance
import { useAppContext } from "../context/AppContext";
import { Navbar } from "../components/Navbar";
import {
  TimetableTable,
  downloadTimetableCSV,
} from "../utils/renderTimetableCell.jsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function IndividualTeacherTimetable() {
  const { userData } = useAppContext();
  const [teacherTT, setTeacherTT] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        //FIXED: Use axiosInstance which includes withCredentials
        const res = await axiosInstance.get("/api/timetable/individual");

        console.log("Individual teacher fetch response:", res.data);

        if (res.data.success && userData?.name) {
          const teacherName = userData.name.trim().toLowerCase();

          const teacherMap = buildTeacherTimetables(
            res.data.timetables || [],
            teacherName
          );

          setTeacherTT(teacherMap);
          
          if (teacherMap) {
            console.log(` Built timetable for ${userData.name}`);
          } else {
            console.log(` No timetable found for ${userData.name}`);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error response:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.name) fetchAndBuild();
  }, [userData]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">
          Fetching your teaching timetable...
        </p>
      </div>
    );
  }

  if (!teacherTT) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <span className="text-6xl mb-4 block">📚</span>
          <p className="text-gray-500 text-lg">No timetable found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 pb-10">
      <Navbar />

      <div className="pt-16 sm:pt-20 md:pt-24 px-4 sm:px-6 md:px-8 lg:px-10 pb-10 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            My Teaching Timetable
          </h2>
          <p className="text-sm sm:text-base text-gray-600">👤 {userData.name}</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-white p-3 sm:p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-base sm:text-lg md:text-2xl text-gray-800">
                Weekly Schedule
              </h3>

              <button
                onClick={() =>
                  downloadTimetableCSV(teacherTT, userData.name, DAYS)
                }
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg"
              >
                📥 Download CSV
              </button>
            </div>
          </div>

          {/* Timetable Section */}
          <div className="p-3 sm:p-4 md:p-6 overflow-x-auto">
            {/*UNIFIED RENDERER - Exact same as generated timetable */}
            <TimetableTable
              data={teacherTT}
              DAYS={DAYS}
              renderOptions={{
                showYearDivision: true, // Show which class they're teaching
                filterByBatch: null, // No batch filtering
                highlightBatch: false, // No highlighting
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================================================
   BUILD TIMETABLE FOR LOGGED-IN TEACHER
  CRITICAL: Preserves TIME SLOTS, not period numbers
  CRITICAL: Preserves lab_part for multi-hour labs
======================================================= */
function buildTeacherTimetables(classTimetables, loggedTeacherName) {
  const teacherMap = {};

  classTimetables.forEach((doc) => {
    const year = doc.year;
    const division = doc.division;
    const table = doc.timetableData || {};

    // For each day in the timetable
    Object.keys(table).forEach((day) => {
      const dayData = table[day] || {};

      // For each time slot (e.g., "08:00-09:00", "09:00-10:00")
      Object.keys(dayData).forEach((timeSlot) => {
        const entries = dayData[timeSlot] || [];

        // Filter for logged-in teacher's classes
        entries.forEach((entry) => {
          if (
            !entry.teacher ||
            entry.teacher.trim().toLowerCase() !== loggedTeacherName
          )
            return;

          if (!teacherMap[day]) teacherMap[day] = {};
          if (!teacherMap[day][timeSlot]) teacherMap[day][timeSlot] = [];

          //PRESERVE ALL FIELDS including lab_part
          teacherMap[day][timeSlot].push({
            subject: entry.subject,
            type: entry.type,
            teacher: entry.teacher,
            year: entry.year || year,
            division: entry.division || division,
            room: entry.room,
            batch: entry.batch,
            time_slot: timeSlot,
            lab_part: entry.lab_part, //CRITICAL: "1/2", "2/2" etc.
            lab_session_id: entry.lab_session_id, //CRITICAL: Session grouping
          });
        });
      });
    });
  });

  return Object.keys(teacherMap).length ? teacherMap : null;
}