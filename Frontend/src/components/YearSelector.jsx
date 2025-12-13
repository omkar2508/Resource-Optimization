import React from "react";

export default function YearSelector({ selectedYears, setSelectedYears }) {
  const allYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  function toggleYear(y) {
    if (selectedYears.includes(y))
      setSelectedYears(selectedYears.filter((i) => i !== y));
    else setSelectedYears([...selectedYears, y]);
  }

  return (
    <div className="space-y-3">
      {allYears.map((y) => (
        <button
          key={y}
          onClick={() => toggleYear(y)}
          className={`w-full px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
            selectedYears.includes(y)
              ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg transform scale-105"
              : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">{y}</span>
            {selectedYears.includes(y) && <span className="text-xl">✓</span>}
          </div>
        </button>
      ))}
    </div>
  );
}
