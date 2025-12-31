// src/pages/SavedTimetable.jsx - FIXED: Uses unified renderer
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { TimetableTable, downloadTimetableCSV } from "../utils/renderTimetableCell.jsx";

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
                  downloadTimetableCSV(
                    item.timetableData,
                    `${item.year}_Div${item.division}`,
                    DAYS
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

          {/* ✅ UNIFIED RENDERER - Same as generated timetable */}
          <TimetableTable 
            data={item.timetableData} 
            DAYS={DAYS}
            renderOptions={{
              showYearDivision: false,  // Don't show year/div in class timetables
              filterByBatch: null,       // No batch filtering
              highlightBatch: false      // No highlighting
            }}
          />
        </div>
      ))}
    </div>
  );
}