import React from "react";
import SubjectsPanel from "./SubjectsPanel";
import { Checkbox } from "@/components/ui/checkbox";

export default function YearPanel({ selectedYears, yearData, setYearData }) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function updateYear(y, key, value) {
    setYearData((prev) => ({
      ...prev,
      [y]: { ...prev[y], [key]: value },
    }));
  }

  const toggleHoliday = (year, day) => {
    const currentHolidays = yearData[year].holidays || [];
    const newHolidays = currentHolidays.includes(day)
      ? currentHolidays.filter((d) => d !== day)
      : [...currentHolidays, day];
    updateYear(year, "holidays", newHolidays);
  };

  return (
    <div className="space-y-6">
      {selectedYears.map((year) => (
        <div key={year} className="bg-white border rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">{year} Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Divisions */}
            <div>
              <label className="block text-sm font-semibold mb-2">Number of Divisions</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={yearData[year].divisions}
                onChange={(e) => updateYear(year, "divisions", Number(e.target.value))}
              />
            </div>

            {/* Break/Lunch Period */}
            <div>
              <label className="block text-sm font-semibold mb-2">Break Period (e.g. 4)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={yearData[year].lunchBreak}
                onChange={(e) => updateYear(year, "lunchBreak", Number(e.target.value))}
              />
            </div>

            {/* Max Periods per Subject/Day */}
            <div>
              <label className="block text-sm font-semibold mb-2">Max Hrs/Subject/Day</label>
              <input
                type="number"
                min="1"
                max="3"
                className="w-full p-2 border rounded-lg"
                value={yearData[year].maxDailyPerSubject || 1}
                onChange={(e) => updateYear(year, "maxDailyPerSubject", Number(e.target.value))}
              />
            </div>

            {/* Periods Per Day */}
            <div>
              <label className="block text-sm font-semibold mb-2">Total Periods/Day</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={yearData[year].periodsPerDay}
                onChange={(e) => updateYear(year, "periodsPerDay", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Holiday Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3">Select Weekly Holidays</label>
            <div className="flex flex-wrap gap-4">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                  <Checkbox 
                    checked={yearData[year].holidays?.includes(day)} 
                    onCheckedChange={() => toggleHoliday(year, day)} 
                  />
                  <span className="text-sm font-medium">{day}</span>
                </div>
              ))}
            </div>
          </div>

          <SubjectsPanel year={year} yearData={yearData} setYearData={setYearData} />
        </div>
      ))}
    </div>
  );
}