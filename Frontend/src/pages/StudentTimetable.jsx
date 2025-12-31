// src/pages/StudentTimetable.jsx - FIXED: Uses unified renderer
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { Navbar } from "../components/Navbar";
import { TimetableTable, downloadTimetableCSV } from "../utils/renderTimetableCell.jsx";

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
                  onClick={() => downloadTimetableCSV(
                    item.timetableData, 
                    `${item.year}_Div${item.division}`,
                    DAYS
                  )}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                >
                  Download CSV
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* ✅ UNIFIED RENDERER - Same as generated timetable, with batch filtering */}
              <TimetableTable 
                data={item.timetableData} 
                DAYS={DAYS}
                renderOptions={{
                  showYearDivision: false,           // Don't show year/div in student view
                  filterByBatch: userData?.batch,    // Filter by student's batch
                  highlightBatch: true               // Highlight student's batch
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}