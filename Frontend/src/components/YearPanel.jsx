import React from "react";
import SubjectsPanel from "./SubjectsPanel";

export default function YearPanel({ selectedYears, yearData, setYearData }) {
  function updateYear(y, key, value) {
    setYearData((prev) => ({
      ...prev,
      [y]: {
        ...prev[y],
        [key]: value,
      },
    }));
  }

  return (
    <div className="space-y-6">
      {selectedYears.map((year) => (
        <div
          key={year}
          className="bg-white/70 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-8 transition-all duration-300"
        >
          {/* Year Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {year.charAt(0)}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{year}</h3>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Divisions */}
            <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm p-5 rounded-xl border border-blue-200/50 hover:border-blue-300/70 transition-colors">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">📊</span>
                Divisions
              </label>
              <input
                type="number"
                min="1"
                max="20"
                className="w-full px-4 py-3 border-2 border-blue-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-semibold text-gray-800"
                value={yearData[year].divisions}
                onChange={(e) =>
                  updateYear(year, "divisions", Number(e.target.value))
                }
              />
            </div>

            {/* Periods per Day */}
            <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm p-5 rounded-xl border border-purple-200/50 hover:border-purple-300/70 transition-colors">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">⏰</span>
                Periods/Day
              </label>
              <input
                type="number"
                min="1"
                max="12"
                className="w-full px-4 py-3 border-2 border-purple-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-semibold text-gray-800"
                value={yearData[year].periodsPerDay}
                onChange={(e) =>
                  updateYear(year, "periodsPerDay", Number(e.target.value))
                }
              />
            </div>

            {/* Days per Week */}
            <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-5 rounded-xl border border-green-200/50 hover:border-green-300/70 transition-colors">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span className="text-lg">📅</span>
                Days/Week
              </label>
              <input
                type="number"
                min="1"
                max="7"
                className="w-full px-4 py-3 border-2 border-green-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all font-semibold text-gray-800"
                value={yearData[year].daysPerWeek}
                onChange={(e) =>
                  updateYear(year, "daysPerWeek", Number(e.target.value))
                }
              />
            </div>
          </div>

          {/* Subjects Section */}
          <div className="mt-6 p-6 bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
            <SubjectsPanel
              year={year}
              yearData={yearData}
              setYearData={setYearData}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
