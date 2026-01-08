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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => {
              setView("select");
              setImportedData(null);
            }}
            className="mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all border border-gray-200/50 flex items-center gap-2"
          >
            <span className="text-lg">←</span>
            Back to Selection
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-3">
            Generate Timetable
          </h1>
          <p className="text-gray-600 text-lg">
            Select academic years and semesters to begin configuration
          </p>
        </div>

        {/* Import Configuration Button */}
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span className="text-xl">📥</span>
                Import Existing Configuration
              </h3>
              <p className="text-sm text-gray-600">
                Load previously exported configuration file
              </p>
            </div>
            <label className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg">
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

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span>
            Select Academic Years & Semesters
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose years and their corresponding semesters for timetable generation
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {allYears.map((year) => (
            <div
              key={year}
              className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                selectedYears.includes(year)
                  ? "border-blue-400 bg-blue-50/50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleYear(year)}
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selectedYears.includes(year)
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedYears.includes(year) && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-lg font-semibold text-gray-800">
                        {year}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({getFullYearName(year)})
                      </span>
                    </div>
                  </div>
                </button>

                {selectedYears.includes(year) && (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm font-medium text-gray-600">Semester:</span>
                    <div className="flex gap-2">
                      {semesterMapping[year].map((sem) => (
                        <button
                          key={sem}
                          onClick={() => updateSemester(year, sem)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
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
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>📋</span>
              Selected Configuration
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedYears.map((year) => (
                <span
                  key={year}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold"
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
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
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