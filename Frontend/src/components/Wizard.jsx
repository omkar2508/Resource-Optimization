// Wizard.jsx - FIXED: Proper room mapping structure for solver
import React, { useState, useMemo, useEffect } from "react";
import YearPanel from "./YearPanel";
import TeacherForm from "./TeacherForm";
import RoomAllocation from "./RoomAllocation";
import SchedulerResult from "./SchedulerResult";
import axios from "axios";

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

  // Initialize year data
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
        semester: selectedSemesters[y],
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

  // ✅ FIXED: Build room mappings that solver can understand
  const buildRoomMappingsForSolver = () => {
    const mappings = {};
    
    console.log("🔧 Building room mappings from assignments:", rooms);
    
    rooms.forEach(room => {
      const roomName = room.name;
      const roomId = room._id || room.id;
      const assignments = room.assignments || [];
      
      console.log(`Processing room: ${roomName}, type: ${room.type}, assignments:`, assignments);
      
      assignments.forEach(assignment => {
        const year = assignment.year;
        const subjectCode = assignment.code;
        
        if (!subjectCode) {
          // Division assignment (classroom)
          console.log(`  → Division assignment: ${year} Div ${assignment.division}`);
          return;
        }
        
        // Subject assignment (lab/tutorial)
        const subjectType = assignment.type;
        const totalBatches = assignment.totalBatches || 1;
        
        // ✅ Create mapping key: "year_subjectCode_type"
        const mappingKey = `${year}_${subjectCode}_${subjectType}`;
        
        console.log(`  → Subject assignment: ${subjectCode} (${subjectType}) - ${totalBatches} batches`);
        
        // ✅ CRITICAL: Map ALL batches to THIS room
        const batchMappings = [];
        for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
          batchMappings.push({
            batch: batchNum,
            room: roomId,
            roomName: roomName
          });
          console.log(`    ✅ Mapped batch ${batchNum} → ${roomName}`);
        }
        
        mappings[mappingKey] = {
          subjectCode: subjectCode,
          type: subjectType,
          year: year,
          batches: batchMappings,
          roomName: roomName,
          roomId: roomId
        };
      });
    });
    
    console.log("📦 Final room mappings:", mappings);
    return mappings;
  };

  const handleGenerate = async () => {
    try {
      // Validation
      const validationErrors = [];
      
      Object.keys(yearData).forEach((year) => {
        const timeConfig = yearData[year].timeConfig;
        if (!timeConfig) {
          validationErrors.push(`${year}: Missing time configuration`);
        }
        
        if (!yearData[year].subjects || yearData[year].subjects.length === 0) {
          validationErrors.push(`${year}: No subjects loaded for Semester ${yearData[year].semester}`);
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

      // ✅ Build proper room mappings
      const roomMappings = buildRoomMappingsForSolver();

      const payload = {
        years: yearData,
        teachers: teachers,
        rooms: rooms,
        roomMappings: roomMappings  // ✅ Send properly structured mappings
      };

      console.log("📤 Sending payload with room mappings:", payload);

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/scheduler/generate`,
        payload
      );

      const timetable = res.data.timetable || res.data;
      if (!timetable) {
        alert("Invalid scheduler response");
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
      alert("Teacher timetables are derived from class timetables and cannot be saved separately.");
      return { success: true, message: "Teacher timetables are derived dynamically" };
    } else {
      const keyStr = String(outerKey);
      let year, division;
      
      if (keyStr.includes(" Div ")) {
        const divIndex = keyStr.indexOf(" Div ");
        year = keyStr.substring(0, divIndex).trim();
        division = keyStr.substring(divIndex + 5).trim();
      } else {
        const parts = keyStr.split(" ");
        const divIndex = parts.findIndex(p => p.toLowerCase() === "div");
        if (divIndex !== -1 && divIndex < parts.length - 1) {
          year = parts.slice(0, divIndex).join(" ").trim();
          division = parts[divIndex + 1].trim();
        } else {
          const divMatch = parts.find((p) => /^\d+$/.test(p));
          division = divMatch || "1";
          year = parts.filter(p => p !== divMatch && p.toLowerCase() !== "div").join(" ").trim() || keyStr;
        }
      }

      if (!/^\d+$/.test(division)) {
        division = "1";
      }

      if (!year || year.length === 0) {
        console.error("Could not parse year from outerKey:", outerKey);
        alert("Failed to parse timetable information. Please try again.");
        return { success: false, message: "Invalid timetable key format" };
      }

      payload = {
        year,
        division,
        timetableData: table,
      };
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/timetable/save`,
        payload
      );

      if (res?.data?.success) {
        alert("Saved: " + (res.data.message || "OK"));
        return res.data;
      } else {
        const errorMsg = res.data?.message || JSON.stringify(res.data || "no response");
        alert("Save failed: " + errorMsg);
        console.error("Save failed response:", res.data);
        return res.data;
      }
    } catch (err) {
      console.error("Save error", err);
      const errorMessage = err.response?.data?.message || err.message || "Unknown error";
      alert("Error saving timetable: " + errorMessage);
      throw err;
    }
  };

  const stepTitles = [
    { number: 1, title: "Year Configuration", icon: "📚", color: "blue" },
    { number: 2, title: "Teacher Assignment", icon: "👨‍🏫", color: "purple" },
    { number: 3, title: "Room Allocation", icon: "🏢", color: "green" },
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
      <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Configuration Wizard
            </h2>
            <p className="text-blue-100">
              {stepTitles[step - 1].title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {step < 4 && (
              <button
                onClick={handleExportConfig}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium text-sm border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2"
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

        <div className="flex items-center justify-between relative px-4">
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>

          {stepTitles.map((s) => (
            <div key={s.number} className="relative flex flex-col items-center z-10 flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= s.number
                    ? "bg-white text-blue-600 shadow-lg scale-110"
                    : "bg-white/20 text-white/60 border-2 border-white/30"
                }`}
              >
                {step > s.number ? "✓" : s.number}
              </div>
              <span className="mt-2 text-xs font-semibold">
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
          <div className="mt-8 flex justify-between items-center gap-4 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-white/80 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all border border-gray-200/50 flex items-center gap-2"
              >
                <span>←</span>
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ml-auto"
            >
              Next Step
              <span>→</span>
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