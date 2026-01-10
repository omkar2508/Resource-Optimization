import React, { useState } from "react";
import Wizard from "../components/Wizard";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

export default function TimetableGenerator() {
  const [view, setView] = useState("select");
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState({});
  const [importedData, setImportedData] = useState(null);

  // Updated year format: 1st, 2nd, 3rd, 4th
  const allYears = ["1st", "2nd", "3rd", "4th"];
  
  // Semester mapping based on year
  const semesterMapping = {
    "1st": [1, 2],
    "2nd": [3, 4],
    "3rd": [5, 6],
    "4th": [7, 8],
  };

  function toggleYear(year) {
    if (selectedYears.includes(year)) {
      setSelectedYears(selectedYears.filter((y) => y !== year));
      const newSemesters = { ...selectedSemesters };
      delete newSemesters[year];
      setSelectedSemesters(newSemesters);
    } else {
      setSelectedYears([...selectedYears, year]);
      // Set default to first semester of that year
      setSelectedSemesters({
        ...selectedSemesters,
        [year]: semesterMapping[year][0]
      });
    }
  }

  function updateSemester(year, semester) {
    setSelectedSemesters({
      ...selectedSemesters,
      [year]: semester
    });
  }

  function handleContinue() {
    if (selectedYears.length === 0) {
      toast.error("Please select at least one year");
      return;
    }
    setView("config");
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportedData(data);
        
        // Extract years from imported data
        if (data.years) {
          const years = Object.keys(data.years);
          setSelectedYears(years);
          
          // Extract semesters
          const semesters = {};
          years.forEach(year => {
            if (data.years[year].semester) {
              semesters[year] = data.years[year].semester;
            }
          });
          setSelectedSemesters(semesters);
        }
        
        setView("config");
        toast.success("Configuration imported successfully!");
      } catch (error) {
        toast.error("Invalid configuration file");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  }

  // Helper function to get full year name
  const getFullYearName = (year) => {
    const yearNames = {
      "1st": "First Year",
      "2nd": "Second Year",
      "3rd": "Third Year",
      "4th": "Final Year"
    };
    return yearNames[year] || year;
  };

  if (view === "config") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => {
              setView("select");
              setImportedData(null);
            }}
            className="mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all border border-gray-200/50 flex items-center gap-2 text-sm sm:text-base"
          >
            <span className="text-base sm:text-lg">←</span>
            <span className="hidden sm:inline">Back to Selection</span>
            <span className="sm:hidden">Back</span>
          </button>
          <Wizard 
            selectedYears={selectedYears} 
            selectedSemesters={selectedSemesters}
            importedData={importedData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2 sm:mb-3">
            Generate Timetable
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            Select academic years and semesters to begin configuration
          </p>
        </div>

        {/* Import Configuration Button */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border-2 border-green-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-lg sm:text-xl">📥</span>
                Import Existing Configuration
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Load previously exported configuration file
              </p>
            </div>
            <label className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap">
              Choose File
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📚</span>
            Select Academic Years & Semesters
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Choose years and their corresponding semesters for timetable generation
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {allYears.map((year) => (
            <div
              key={year}
              className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 transition-all duration-200 ${
                selectedYears.includes(year)
                  ? "border-blue-400 bg-blue-50/50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <button
                  onClick={() => toggleYear(year)}
                  className="flex-1 flex items-center justify-between w-full sm:w-auto"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        selectedYears.includes(year)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedYears.includes(year) && (
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-base sm:text-lg font-semibold text-gray-800">
                        {year}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2 hidden sm:inline">
                        ({getFullYearName(year)})
                      </span>
                    </div>
                  </div>
                </button>

                {selectedYears.includes(year) && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Semester:</span>
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {semesterMapping[year].map((sem) => (
                        <button
                          key={sem}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSemester(year, sem);
                          }}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                            selectedSemesters[year] === sem
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400"
                          }`}
                        >
                          Sem {sem}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedYears.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <span>📋</span>
              Selected Configuration
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedYears.map((year) => (
                <span
                  key={year}
                  className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-semibold"
                >
                  {year} - Sem {selectedSemesters[year]}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={selectedYears.length === 0}
          className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all shadow-lg ${
            selectedYears.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white hover:shadow-xl"
          }`}
        >
          {selectedYears.length === 0
            ? "Select at least one year to continue"
            : `Continue with ${selectedYears.length} year${selectedYears.length > 1 ? "s" : ""} →`}
        </button>
      </div>
    </div>
  );
}