import React, { useState, useMemo, useEffect } from "react";
import YearPanel from "./YearPanel";
import TeacherForm from "./TeacherForm";
import RoomAllocation from "./RoomAllocation";
import SchedulerResult from "./SchedulerResult";
import axios from "axios";

// Helper function to calculate periods per day from time configuration
function calculatePeriodsPerDay(timeConfig) {
  if (!timeConfig) return 6;
  
  const { startTime, endTime, periodDuration, lunchDuration } = timeConfig;
  
  try {
    const start = new Date(`2000-01-01T${startTime || "09:00"}`);
    const end = new Date(`2000-01-01T${endTime || "17:00"}`);
    const totalMinutes = (end - start) / (1000 * 60);
    
    const lunchMin = lunchDuration || 45;
    const effectiveMinutes = totalMinutes - lunchMin;
    const duration = periodDuration || 60;
    
    return Math.floor(effectiveMinutes / duration);
  } catch (e) {
    console.error("Error calculating periods:", e);
    return 6;
  }
}

export default function Wizard({ selectedYears, selectedSemesters, importedData }) {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const [rooms, setRooms] = useState([]);

  // Initialize year data with time configuration and semester info
  const initialYearData = useMemo(() => {
    const obj = {};
    selectedYears.forEach((y) => {
      obj[y] = {
        divisions: 1,
        periodsPerDay: 6,
        daysPerWeek: 5,
        lunchBreak: 4,
        holidays: ["Sat", "Sun"],
        subjects: [],
        semester: selectedSemesters[y], // Store semester info
        timeConfig: {
          startTime: "09:00",
          endTime: "17:00",
          periodDuration: 60,
          lunchStart: "13:00",
          lunchDuration: 45
        }
      };
    });
    return obj;
  }, [selectedYears, selectedSemesters]);

  const [yearData, setYearData] = useState(initialYearData);
  const [teachers, setTeachers] = useState([]);

  // Handle imported data
  useEffect(() => {
    if (importedData) {
      console.log("Processing imported data:", importedData);
      
      if (importedData.years) {
        const importedYears = { ...importedData.years };
        
        Object.keys(importedYears).forEach((year) => {
          if (!importedYears[year].timeConfig) {
            importedYears[year].timeConfig = {
              startTime: "09:00",
              endTime: "17:00",
              periodDuration: 60,
              lunchStart: "13:00",
              lunchDuration: 45
            };
          }
          
          importedYears[year].periodsPerDay = calculatePeriodsPerDay(importedYears[year].timeConfig);
          
          if (!importedYears[year].holidays) {
            importedYears[year].holidays = ["Sat", "Sun"];
          }

          // Ensure semester is set
          if (!importedYears[year].semester && selectedSemesters[year]) {
            importedYears[year].semester = selectedSemesters[year];
          }
        });
        
        setYearData(importedYears);
      }
      
      if (importedData.teachers && Array.isArray(importedData.teachers)) {
        setTeachers(importedData.teachers);
      }
      
      if (importedData.rooms && Array.isArray(importedData.rooms)) {
        setRooms(importedData.rooms);
      }
    }
  }, [importedData, selectedSemesters]);

  // Auto-update periodsPerDay when time configuration changes
  useEffect(() => {
    setYearData((prev) => {
      const updated = { ...prev };
      let changed = false;
      
      Object.keys(updated).forEach((year) => {
        if (updated[year].timeConfig) {
          const newPeriods = calculatePeriodsPerDay(updated[year].timeConfig);
          if (updated[year].periodsPerDay !== newPeriods) {
            updated[year].periodsPerDay = newPeriods;
            changed = true;
          }
        }
      });
      
      return changed ? updated : prev;
    });
  }, [yearData]);

  const handleGenerate = async () => {
    try {
      // Validate time configuration
      const validationErrors = [];
      
      Object.keys(yearData).forEach((year) => {
        const timeConfig = yearData[year].timeConfig;
        if (!timeConfig) {
          validationErrors.push(`${year}: Missing time configuration`);
        } else {
          if (!timeConfig.startTime) validationErrors.push(`${year}: Missing start time`);
          if (!timeConfig.endTime) validationErrors.push(`${year}: Missing end time`);
          if (!timeConfig.periodDuration) validationErrors.push(`${year}: Missing period duration`);
          
          if (timeConfig.startTime && timeConfig.endTime) {
            const start = new Date(`2000-01-01T${timeConfig.startTime}`);
            const end = new Date(`2000-01-01T${timeConfig.endTime}`);
            if (end <= start) {
              validationErrors.push(`${year}: End time must be after start time`);
            }
          }
        }
        
        // Validate subjects exist
        if (!yearData[year].subjects || yearData[year].subjects.length === 0) {
          validationErrors.push(`${year}: No subjects loaded. Please add subjects for ${year} - Semester ${yearData[year].semester} first.`);
        }
      });
      
      if (validationErrors.length > 0) {
        alert("⚠️ Configuration Errors:\n\n" + validationErrors.join("\n"));
        return;
      }
      
      if (!teachers || teachers.length === 0) {
        alert("⚠️ No teachers defined. Please add at least one teacher.");
        return;
      }
      
      if (!rooms || rooms.length === 0) {
        alert("⚠️ No rooms defined. Please add at least one room.");
        return;
      }

      const payload = {
        years: yearData,
        teachers: teachers,
        rooms: rooms,
      };

      console.log("Sending payload:", payload);

      const res = await axios.post(
        "http://localhost:5000/api/scheduler/generate",
        payload
      );

      console.log("Scheduler response:", res.data);

      const timetable = res.data.timetable || res.data;
      if (!timetable) {
        alert("Invalid scheduler response");
        console.log("Invalid data:", res.data);
        return;
      }

      setResult(timetable);
      setStep(4);
    } catch (error) {
      console.error("Generation error:", error);
      alert("Error generating timetable: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSave = async (outerKey, table, isTeacher = false) => {
    let payload = {};
    if (isTeacher) {
      payload = {
        timetableType: "teacher",
        teacherName: outerKey,
        timetableData: table,
      };
    } else {
      const parts = String(outerKey).split(" ");
      const year = parts[0] || outerKey;
      const divMatch = parts.find((p) => /^\d+$/.test(p));
      const division = divMatch || "1";

      payload = {
        timetableType: "class",
        year,
        division,
        timetableData: table,
      };
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/timetable/save",
        payload
      );

      if (res?.data?.success) {
        alert("Saved: " + (res.data.message || "OK"));
        return res.data;
      } else {
        alert("Save failed: " + JSON.stringify(res.data || "no response"));
        return res.data;
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving timetable. See console.");
      throw err;
    }
  };

  const stepTitles = [
    { number: 1, title: "Year Configuration", icon: "📚", color: "blue" },
    { number: 2, title: "Teacher Assignment", icon: "👨‍🏫", color: "purple" },
    { number: 3, title: "Allocate Rooms", icon: "🏢", color: "green" },
    { number: 4, title: "Timetable Result", icon: "📅", color: "cyan" },
  ];

  const handleExportConfig = () => {
    const config = {
      years: yearData,
      teachers: teachers,
      rooms: rooms,
      semesters: selectedSemesters,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `timetable-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl mx-auto overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Configuration Wizard
            </h2>
            <p className="text-blue-100">
              {stepTitles[step - 1].icon} {stepTitles[step - 1].title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {step < 4 && (
              <button
                onClick={handleExportConfig}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium text-sm border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2"
                title="Export current configuration as JSON"
              >
                <span>💾</span>
                Export Config
              </button>
            )}
            <div className="px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-bold text-lg border border-white/30">
              Step {step} of 4
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>

          {stepTitles.map((s) => (
            <div
              key={s.number}
              className="relative flex flex-col items-center z-10"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s.number
                    ? "bg-white text-blue-600 shadow-lg scale-110"
                    : "bg-white/20 text-white/60 border-2 border-white/30"
                }`}
              >
                {step > s.number ? "✓" : s.number}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  step >= s.number ? "text-white" : "text-white/60"
                }`}
              >
                {s.icon}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="animate-fadeIn">
            <YearPanel
              selectedYears={selectedYears}
              selectedSemesters={selectedSemesters}
              yearData={yearData}
              setYearData={setYearData}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeIn">
            <TeacherForm
              teachers={teachers}
              setTeachers={setTeachers}
              selectedYears={selectedYears}
              yearData={yearData}
            />
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeIn">
            <RoomAllocation
              yearData={yearData}
              rooms={rooms}
              setRooms={setRooms}
              onBack={() => setStep(2)}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {step === 4 && (
          <div className="animate-fadeIn">
            <SchedulerResult
              result={result}
              rooms={rooms}
              onBack={() => setStep(1)}
              onSave={handleSave}
            />
          </div>
        )}

        {step < 3 && (
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200/50 flex items-center gap-2"
              >
                <span className="text-lg">←</span>
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 ml-auto"
            >
              Next Step
              <span className="text-lg">→</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}