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

  function updateTimeConfig(year, key, value) {
    setYearData((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        timeConfig: {
          ...prev[year].timeConfig,
          [key]: value
        }
      }
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
          
          {/* TIME CONFIGURATION SECTION */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🕐</span>
              Time Configuration
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Day Start Time */}
              <div>
                <label className="block text-sm font-semibold mb-2">Day Start Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-white"
                  value={yearData[year].timeConfig?.startTime || "09:00"}
                  onChange={(e) => updateTimeConfig(year, "startTime", e.target.value)}
                />
              </div>

              {/* Day End Time */}
              <div>
                <label className="block text-sm font-semibold mb-2">Day End Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-white"
                  value={yearData[year].timeConfig?.endTime || "17:00"}
                  onChange={(e) => updateTimeConfig(year, "endTime", e.target.value)}
                />
              </div>

              {/* Period Duration */}
              <div>
                <label className="block text-sm font-semibold mb-2">Period Duration (min)</label>
                <input
                  type="number"
                  min="30"
                  max="120"
                  step="15"
                  className="w-full p-2 border rounded-lg bg-white"
                  value={yearData[year].timeConfig?.periodDuration || 60}
                  onChange={(e) => updateTimeConfig(year, "periodDuration", Number(e.target.value))}
                />
              </div>

              {/* Lunch Start Time */}
              <div>
                <label className="block text-sm font-semibold mb-2">Lunch Start Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-lg bg-white"
                  value={yearData[year].timeConfig?.lunchStart || "13:00"}
                  onChange={(e) => updateTimeConfig(year, "lunchStart", e.target.value)}
                />
              </div>

              {/* Lunch Duration */}
              <div>
                <label className="block text-sm font-semibold mb-2">Lunch Duration (min)</label>
                <input
                  type="number"
                  min="15"
                  max="90"
                  step="15"
                  className="w-full p-2 border rounded-lg bg-white"
                  value={yearData[year].timeConfig?.lunchDuration || 45}
                  onChange={(e) => updateTimeConfig(year, "lunchDuration", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Time Slots Preview */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <p className="text-sm font-semibold text-gray-700 mb-2">Generated Time Slots:</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const config = yearData[year].timeConfig || {};
                  const startTime = config.startTime || "09:00";
                  const endTime = config.endTime || "17:00";
                  const duration = config.periodDuration || 60;
                  const lunchStart = config.lunchStart || "13:00";
                  const lunchDuration = config.lunchDuration || 45;
                  
                  const slots = [];
                  let current = new Date(`2000-01-01T${startTime}`);
                  const end = new Date(`2000-01-01T${endTime}`);
                  const lunch = new Date(`2000-01-01T${lunchStart}`);
                  const lunchEnd = new Date(lunch.getTime() + lunchDuration * 60000);
                  
                  let periodNum = 1;
                  
                  while (current < end) {
                    const slotEnd = new Date(current.getTime() + duration * 60000);
                    if (slotEnd > end) break;
                    
                    const isLunch = current < lunchEnd && slotEnd > lunch;
                    
                    const timeStr = `${current.toTimeString().slice(0, 5)}-${slotEnd.toTimeString().slice(0, 5)}`;
                    
                    slots.push(
                      <span 
                        key={timeStr}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isLunch 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isLunch ? '🍽️ Lunch' : `P${periodNum}`} {timeStr}
                      </span>
                    );
                    
                    if (!isLunch) periodNum++;
                    current = slotEnd;
                  }
                  
                  return slots;
                })()}
              </div>
            </div>
          </div>

          {/* BASIC CONFIGURATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

            {/* Periods Per Day (Auto-calculated) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Total Periods/Day 
                <span className="text-xs text-gray-500 ml-2">(Auto-calculated)</span>
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg bg-gray-100"
                value={yearData[year].periodsPerDay}
                disabled
                title="Automatically calculated from time configuration"
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