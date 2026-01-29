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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl sm:text-2xl">📚</span>
          <h4 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Subjects for {year}</h4>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
          {yearData[year].subjects.length} Loaded
        </span>
      </div>

      {/* Semester Selection */}
      <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-blue-200/50 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="text-base sm:text-lg">📅</span>
          <h5 className="text-sm sm:text-base font-semibold text-gray-700">Select Semester</h5>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {SEM_MAP[year].map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSelectedSemester(sem)}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
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
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base text-blue-900">How to Add Subjects</p>
            <p className="text-xs sm:text-sm text-blue-800 mt-1">
              Go to <strong>Manage Resources → Add Subject</strong> in the sidebar to add subjects 
              for {year} - Semester {selectedSemester}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-6 sm:py-8">
          <div className="inline-block h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Loading subjects...</p>
        </div>
      )}

      {/* Subjects List */}
      {!loading && yearData[year].subjects.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          <h5 className="font-semibold text-sm sm:text-base text-gray-700 flex items-center gap-2">
            <span>📋</span>
            Subjects for Semester {selectedSemester}
          </h5>
          {yearData[year].subjects.map((s, i) => (
            <div
              key={s._id || i}
              className="group bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  <div
                    className={`px-2 sm:px-3 py-1 bg-gradient-to-r ${getTypeColor(
                      s.type
                    )} text-white rounded-lg font-semibold text-xs sm:text-sm shadow-md flex items-center gap-1 whitespace-nowrap`}
                  >
                    <span>{getTypeIcon(s.type)}</span>
                    {s.type}
                  </div>

                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                        {s.code}
                      </span>
                      <span className="text-gray-400 hidden sm:inline">—</span>
                      <span className="text-gray-700 font-medium text-sm sm:text-base truncate">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>⏰</span>
                        {s.hours} hrs/week
                      </span>
                      {s.type === "Lab" && s.labDuration && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-1.5 sm:px-2 py-0.5 rounded font-semibold text-xs sm:text-sm">
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

                <div className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold whitespace-nowrap self-start sm:self-auto">
                  Sem {s.semester}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-6 sm:py-8 bg-gray-50/50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 px-4">
          <span className="text-3xl sm:text-4xl mb-2 block">📚</span>
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            No subjects found for Semester {selectedSemester}
          </p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Add subjects from the "Manage Resources" section
          </p>
        </div>
      ) : null}
    </div>
  );
}