import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { TimetableTable, downloadTimetableCSV } from "../utils/renderTimetableCell.jsx";
import { useNavigate } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SavedTimetable() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTimetables = async () => {
    try {
      const res = await axiosInstance.get("/api/timetable/all");
      
      console.log("Fetch response:", res.data);
      
      if (res.data.success) {
        setTimetables(res.data.timetables);
        console.log(` Loaded ${res.data.timetables.length} timetables`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/admin/login");
      } else {
        toast.error(err.response?.data?.message || "Failed to fetch saved timetables");
      }
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
      const { data } = await axiosInstance.delete(`/api/timetable/delete/${id}`);

      if (data.success) {
        toast.success("Timetable deleted successfully");
        fetchTimetables();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete timetable");
    }
  };

  if (loading)
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">Fetching data…</p>
      </div>
    );

  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
  <div className="pt-5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 max-w-6xl mx-auto">

      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Saved Timetables</h2>

      {timetables.length === 0 && (
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

      {timetables.map((item) => (
        <div
          key={item._id}
          className="border p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 bg-white rounded-lg sm:rounded-xl shadow-md"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h3 className="font-bold text-base sm:text-lg md:text-xl">
              {item.year} – Division {item.division}
            </h3>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() =>
                  downloadTimetableCSV(
                    item.timetableData,
                    `${item.year}_Div${item.division}`,
                    DAYS
                  )
                }
                className="flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs sm:text-sm transition-colors"
              >
                Download
              </button>

              <button
                onClick={() => confirmDeleteTimetable(item._id)}
                className="flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs sm:text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
            <TimetableTable 
              data={item.timetableData} 
              DAYS={DAYS}
              renderOptions={{
                showYearDivision: false,  
                filterByBatch: null,      
                highlightBatch: false    
              }}
            />
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}