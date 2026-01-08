import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { flattenSubjects } from "../utils/subjectTransformer";


export default function YearPanel({ selectedYears, selectedSemesters, yearData, setYearData }) {
  const { axios } = useAppContext();
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [loadingSubjects, setLoadingSubjects] = useState({});

  // Load subjects for each selected year and semester
  useEffect(() => {
    const loadAllSubjects = async () => {
      for (const year of selectedYears) {
        const semester = selectedSemesters[year];
        if (semester) {
          await loadSubjectsForYearSem(year, semester);
        }
      }
    };
    loadAllSubjects();
  }, [selectedYears, selectedSemesters]);

 const loadSubjectsForYearSem = async (year, semester) => {
  setLoadingSubjects(prev => ({ ...prev, [year]: true }));
  try {
    const { data } = await axios.get(`/api/subjects/filter?year=${year}&semester=${semester}`);
    if (data.success) {
      // ✅ Transform component-based subjects to flat structure for timetable generation
      const flattenedSubjects = flattenSubjects(data.subjects);
      
      setYearData(prev => ({
        ...prev,
        [year]: {
          ...prev[year],
          subjects: flattenedSubjects, // Use flattened structure
          rawSubjects: data.subjects,  // Keep original for display
          semester: semester
        }
      }));
      toast.success(`Loaded ${data.subjects.length} subjects (${flattenedSubjects.length} components) for ${year} - Sem ${semester}`);
    }
  } catch (error) {
    console.error("Error loading subjects:", error);
    toast.error(`Failed to load subjects for ${year}`);
  } finally {
    setLoadingSubjects(prev => ({ ...prev, [year]: false }));
  }
};


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
    <div className="space-y-6">
      {selectedYears.map((year) => (
        <div key={year} className="bg-white border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {year} Configuration - Semester {selectedSemesters[year]}
            </h3>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {yearData[year]?.subjects?.length || 0} Subjects Loaded
            </span>
          </div>
          
          {/* TIME CONFIGURATION SECTION */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🕒</span>
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

          {/* LOADED SUBJECTS DISPLAY */}
          <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 backdrop-blur-sm p-6 rounded-xl border border-blue-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <h4 className="text-xl font-bold text-gray-800">Subjects</h4>
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {yearData[year]?.subjects?.length || 0} Loaded
                </span>
              </div>
              <button
                onClick={() => loadSubjectsForYearSem(year, selectedSemesters[year])}
                disabled={loadingSubjects[year]}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loadingSubjects[year] ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Loading...
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    Reload Subjects
                  </>
                )}
              </button>
            </div>

            {loadingSubjects[year] ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-600">Loading subjects...</p>
              </div>
            ) : yearData[year]?.subjects?.length > 0 ? (
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span>📋</span>
                  Subjects for {year} - Semester {selectedSemesters[year]}
                </h5>
                {yearData[year].subjects.map((s, i) => (
                  <div
                    key={i}
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
                                <span>🕒</span>
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
                <span className="text-4xl mb-2 block">📚</span>
                <p className="text-gray-500 font-medium">No subjects found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Please add subjects for {year} - Semester {selectedSemesters[year]} in the "Add Subject" section
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}