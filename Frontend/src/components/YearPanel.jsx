import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { flattenSubjects } from "../utils/subjectTransformer";
import { RefreshCw, Loader2 } from "lucide-react";

export default function YearPanel({
  selectedYears,
  selectedSemesters,
  yearData,
  setYearData,
}) {
  const { axios } = useAppContext();
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [loadingSubjects, setLoadingSubjects] = useState({});

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
    setLoadingSubjects((prev) => ({ ...prev, [year]: true }));
    try {
      const { data } = await axios.get(
        `/api/subjects/filter?year=${year}&semester=${semester}`,
      );
      if (data.success) {
        const flattenedSubjects = flattenSubjects(data.subjects);

        setYearData((prev) => ({
          ...prev,
          [year]: {
            ...prev[year],
            subjects: flattenedSubjects, // Use flattened structure
            rawSubjects: data.subjects, // Keep original for display
            semester: semester,
          },
        }));
        toast.success(
          `Loaded ${data.subjects.length} subjects (${flattenedSubjects.length} components) for ${year} - Sem ${semester}`,
        );
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error(`Failed to load subjects for ${year}`);
    } finally {
      setLoadingSubjects((prev) => ({ ...prev, [year]: false }));
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
          [key]: value,
        },
      },
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
      // Academic / primary
      return "from-blue-600 to-sky-400";

    case "Lab":
      // Technical / practical
      return "from-indigo-600 to-blue-400";

    case "Tutorial":
      // Assistive / support
      return "from-cyan-600 to-teal-400";

    default:
      return "from-gray-500 to-gray-600";
  }
};


  const getTypeIcon = (type) => {
    switch (type) {
      case "Theory":
        return "";
      case "Lab":
        return "";
      case "Tutorial":
        return "";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {selectedYears.map((year) => (
        <div
          key={year}
          className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex-1 min-w-0">
              {year} Configuration - Semester {selectedSemesters[year]}
            </h3>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
              {yearData[year]?.subjects?.length || 0} Subjects Loaded
            </span>
          </div>

          {/* TIME CONFIGURATION SECTION */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl border-2 border-blue-200">
            <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <span>🕒</span>
              Time Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {/* Day Start Time */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                  Day Start Time
                </label>
                <input
                  type="time"
                  className="w-full p-2 text-sm sm:text-base border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={yearData[year].timeConfig?.startTime || "09:00"}
                  onChange={(e) =>
                    updateTimeConfig(year, "startTime", e.target.value)
                  }
                />
              </div>

              {/* Day End Time */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                  Day End Time
                </label>
                <input
                  type="time"
                  className="w-full p-2 text-sm sm:text-base border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={yearData[year].timeConfig?.endTime || "17:00"}
                  onChange={(e) =>
                    updateTimeConfig(year, "endTime", e.target.value)
                  }
                />
              </div>

              {/* Period Duration */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                  Period Duration (min)
                </label>
                <input
                  type="number"
                  min="30"
                  max="120"
                  step="15"
                  className="w-full p-2 text-sm sm:text-base border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={yearData[year].timeConfig?.periodDuration || 60}
                  onChange={(e) =>
                    updateTimeConfig(
                      year,
                      "periodDuration",
                      Number(e.target.value),
                    )
                  }
                />
              </div>

              {/* Lunch Start Time */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                  Lunch Start Time
                </label>
                <input
                  type="time"
                  className="w-full p-2 text-sm sm:text-base border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={yearData[year].timeConfig?.lunchStart || "13:00"}
                  onChange={(e) =>
                    updateTimeConfig(year, "lunchStart", e.target.value)
                  }
                />
              </div>

              {/* Lunch Duration */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                  Lunch Duration (min)
                </label>
                <input
                  type="number"
                  min="15"
                  max="90"
                  step="15"
                  className="w-full p-2 text-sm sm:text-base border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={yearData[year].timeConfig?.lunchDuration || 45}
                  onChange={(e) =>
                    updateTimeConfig(
                      year,
                      "lunchDuration",
                      Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            {/* Time Slots Preview */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white rounded-lg border overflow-x-auto">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Generated Time Slots:
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                  const lunchEnd = new Date(
                    lunch.getTime() + lunchDuration * 60000,
                  );

                  let periodNum = 1;

                  while (current < end) {
                    const slotEnd = new Date(
                      current.getTime() + duration * 60000,
                    );
                    if (slotEnd > end) break;

                    const isLunch = current < lunchEnd && slotEnd > lunch;

                    const timeStr = `${current.toTimeString().slice(0, 5)}-${slotEnd.toTimeString().slice(0, 5)}`;

                    slots.push(
                      <span
                        key={timeStr}
                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                          isLunch
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isLunch ? "🍽️ Lunch" : `P${periodNum}`}{" "}
                        <span className="hidden sm:inline">{timeStr}</span>
                        <span className="sm:hidden">
                          {timeStr.split("-")[0]}
                        </span>
                      </span>,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Divisions */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Number of Divisions
              </label>
              <input
                type="number"
                className="w-full p-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={yearData[year].divisions}
                onChange={(e) =>
                  updateYear(year, "divisions", Number(e.target.value))
                }
              />
            </div>

            {/* Max Periods per Subject/Day */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Max Hrs/Subject/Day
              </label>
              <input
                type="number"
                min="1"
                max="3"
                className="w-full p-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={yearData[year].maxDailyPerSubject || 1}
                onChange={(e) =>
                  updateYear(year, "maxDailyPerSubject", Number(e.target.value))
                }
              />
            </div>

            {/* Periods Per Day (Auto-calculated) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Total Periods/Day
                <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2">
                  (Auto-calculated)
                </span>
              </label>
              <input
                type="number"
                className="w-full p-2 text-sm sm:text-base border rounded-lg bg-gray-100 cursor-not-allowed"
                value={yearData[year].periodsPerDay}
                disabled
                title="Automatically calculated from time configuration"
              />
            </div>
          </div>

          {/* Holiday Selection */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
              Select Weekly Holidays
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={yearData[year].holidays?.includes(day)}
                    onCheckedChange={() => toggleHoliday(year, day)}
                  />
                  <span className="text-xs sm:text-sm font-medium">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LOADED SUBJECTS DISPLAY */}
          <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border border-blue-200/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <span className="text-xl sm:text-2xl"></span>
                <h4 className="text-lg sm:text-xl font-bold text-gray-800">
                  Subjects
                </h4>
                <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {yearData[year]?.subjects?.length || 0} Loaded
                </span>
              </div>
              <button
                onClick={() =>
                  loadSubjectsForYearSem(year, selectedSemesters[year])
                }
                disabled={loadingSubjects[year]}
                aria-label="Reload subjects"
                className="w-10 h-10 sm:w-11 sm:h-11 
             bg-blue-600 rounded-lg 
             hover:bg-blue-700 transition-all 
             disabled:opacity-50 
             flex items-center justify-center"
              >
                {loadingSubjects[year] ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-white" />
                ) : (
                  <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </button>
            </div>

            {loadingSubjects[year] ? (
              <div className="text-center py-6 sm:py-8">
                <div className="inline-block h-6 w-6 sm:h-8 sm:w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
                  Loading subjects...
                </p>
              </div>
            ) : yearData[year]?.subjects?.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                <h5 className="font-semibold text-sm sm:text-base text-gray-700 flex items-center gap-2">
                  <span></span>
                  <span className="truncate">
                    Subjects for {year} - Semester {selectedSemesters[year]}
                  </span>
                </h5>
                {yearData[year].subjects.map((s, i) => (
                  <div
                    key={i}
                    className="group bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                        <div
                          className={`min-w-[72px] h-7 sm:h-8
              bg-gradient-to-r ${getTypeColor(s.type)}
              text-white rounded-lg font-semibold
              text-xs sm:text-sm shadow-md
              flex items-center justify-center
              whitespace-nowrap`}
                        >
                          {s.type}
                        </div>

                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                              {s.code}
                            </span>
                            <span className="text-gray-400 hidden sm:inline">
                              —
                            </span>
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
                              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded font-semibold text-xs sm:text-sm">
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
              <div className="text-center py-6 sm:py-8 bg-gray-50/50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 px-4">
                <span className="text-3xl sm:text-4xl mb-2 block">📚</span>
                <p className="text-sm sm:text-base text-gray-500 font-medium">
                  No subjects found
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Please add subjects for {year} - Semester{" "}
                  {selectedSemesters[year]} in the "Add Subject" section
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}