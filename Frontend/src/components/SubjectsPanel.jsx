import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const SEM_MAP = {
  "1st Year": [1, 2],
  "2nd Year": [3, 4],
  "3rd Year": [5, 6],
  "4th Year": [7, 8]
};

const YEAR_TO_FE = {
  "1st Year": "FE",
  "2nd Year": "SE",
  "3rd Year": "TE",
  "4th Year": "BE"
};

export default function SubjectsPanel({ year, yearData, setYearData }) {
  const { axios } = useAppContext();
  const [selectedSemester, setSelectedSemester] = useState(SEM_MAP[year][0]);
  const [loading, setLoading] = useState(false);

  // Fetch subjects from backend when year or semester changes
  useEffect(() => {
    const loadRelevantSubjects = async () => {
      setLoading(true);
      try {
        const yearCode = YEAR_TO_FE[year];
        const { data } = await axios.get(
          `/api/subjects/filter?year=${yearCode}&semester=${selectedSemester}`
        );
        
        if (data.success) {
          setYearData((prev) => ({
            ...prev,
            [year]: { ...prev[year], subjects: data.subjects }
          }));
        }
      } catch (error) {
        console.error("Failed to load subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setLoading(false);
      }
    };

    loadRelevantSubjects();
  }, [year, selectedSemester, axios]);

  const getTypeColor = (type) => {
    switch (type) {
      case "Theory":
        return "from-blue-500 to-cyan-400";
      case "Lab":
        return "from-purple-500 to-pink-500";
      case "Tutorial":
        return "from-green-500 to-emerald-400";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Theory":
        return "📖";
      case "Lab":
        return "🔬";
      case "Tutorial":
        return "✏️";
      default:
        return "📚";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📚</span>
        <h4 className="text-xl font-bold text-gray-800">Subjects for {year}</h4>
        <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
          {yearData[year].subjects.length} Loaded
        </span>
      </div>

      {/* Semester Selection */}
      <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 backdrop-blur-sm p-6 rounded-xl border border-blue-200/50 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📅</span>
          <h5 className="font-semibold text-gray-700">Select Semester</h5>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SEM_MAP[year].map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSelectedSemester(sem)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                selectedSemester === sem
                  ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg"
                  : "bg-white border-2 border-blue-200 text-blue-700 hover:border-blue-400"
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-blue-900">How to Add Subjects</p>
            <p className="text-sm text-blue-800 mt-1">
              Go to <strong>Manage Resources → Add Subject</strong> in the sidebar to add subjects 
              for {year} - Semester {selectedSemester}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading subjects...</p>
        </div>
      )}

      {/* Subjects List */}
      {!loading && yearData[year].subjects.length > 0 ? (
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>📋</span>
            Subjects for Semester {selectedSemester}
          </h5>
          {yearData[year].subjects.map((s, i) => (
            <div
              key={s._id || i}
              className="group bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`px-3 py-1 bg-gradient-to-r ${getTypeColor(
                      s.type
                    )} text-white rounded-lg font-semibold text-sm shadow-md flex items-center gap-1`}
                  >
                    <span>{getTypeIcon(s.type)}</span>
                    {s.type}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-lg">
                        {s.code}
                      </span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-700 font-medium">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>⏰</span>
                        {s.hours} hrs/week
                      </span>
                      {s.type === "Lab" && s.labDuration && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">
                          <span>🕐</span>
                          {s.labDuration}h continuous
                        </span>
                      )}
                      {s.type !== "Theory" && (
                        <span className="flex items-center gap-1">
                          <span>👥</span>
                          {s.batches} batch{s.batches > 1 ? "es" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                  Sem {s.semester}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-8 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
          <span className="text-4xl mb-2 block">📚</span>
          <p className="text-gray-500 font-medium">
            No subjects found for Semester {selectedSemester}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Add subjects from the "Manage Resources" section
          </p>
        </div>
      ) : null}
    </div>
  );
}