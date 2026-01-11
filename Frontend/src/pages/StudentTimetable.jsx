// src/pages/StudentTimetable.jsx - ✅ FIXED: Proper spacing below navbar
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { Navbar } from "../components/Navbar";
import {
  TimetableTable,
  downloadTimetableCSV,
} from "../utils/renderTimetableCell.jsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* =========================
   Academic Year Resolver
   (from admissionYear)
========================= */
const getAcademicYearLabel = (admissionYear) => {
  if (!admissionYear) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // Jan = 0

  // Academic year starts around July
  const academicBase = month >= 6 ? currentYear : currentYear - 1;
  const yearNum = academicBase - admissionYear + 1;

  if (yearNum === 1) return "1st";
  if (yearNum === 2) return "2nd";
  if (yearNum === 3) return "3rd";
  if (yearNum === 4) return "4th";

  return null;
};

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
          const academicYear = getAcademicYearLabel(userData?.admissionYear);

          allData = allData.filter(
            (item) =>
              item.year === academicYear &&
              String(item.division) === String(userData.division) &&
              item.department === userData.department
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
    if (userData) {
      fetchTimetables();
    }
  }, [userData]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-blue-600 font-medium">
            Fetching your personal timetable...
          </p>
        </div>
      </div>
    );

  const academicYearLabel = getAcademicYearLabel(userData?.admissionYear);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
      <Navbar />

      {/* ✅ FIXED: Proper top padding to prevent content hiding under navbar */}
      <div className="pt-16 sm:pt-20 md:pt-24 px-4 sm:px-6 md:px-8 lg:px-10 pb-10 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-gray-800">
          {userData?.role === "student"
            ? "My Class Timetable"
            : "View Timetable"}
        </h2>

        {timetables.length === 0 && (
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-xl text-center text-sm sm:text-base text-gray-500 border border-gray-100">
            No timetable found for{" "}
            <b>
              {academicYearLabel} Year – Division {userData?.division}
            </b>
            .
          </div>
        )}

        {timetables.map((item) => (
          <div
            key={item._id}
            className="mb-6 sm:mb-8 md:mb-10 bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-white p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 text-black border-b border-gray-100">
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="font-bold text-lg sm:text-xl md:text-2xl text-blue-900 truncate">
                  {item.year} – Division {item.division}
                </h3>
                <span className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">
                  Department: {item.department}
                </span>

                {userData?.batch && (
                  <span className="text-xs sm:text-sm font-semibold text-blue-600 mt-1">
                    Batch: {userData.batch}
                  </span>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() =>
                    downloadTimetableCSV(
                      item.timetableData,
                      `${item.year}_Div${item.division}`,
                      DAYS
                    )
                  }
                  className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all whitespace-nowrap"
                >
                  Download CSV
                </button>
              </div>
            </div>

            {/* ✅ RESPONSIVE: Proper overflow handling */}
            <div className="p-3 sm:p-4 md:p-6 overflow-x-auto">
              <TimetableTable
                data={item.timetableData}
                DAYS={DAYS}
                renderOptions={{
                  showYearDivision: false,
                  filterByBatch: userData?.batch,
                  highlightBatch: true,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}