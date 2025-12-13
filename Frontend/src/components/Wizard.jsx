import React, { useState, useMemo } from "react";
import YearPanel from "./YearPanel";
import TeacherForm from "./TeacherForm";
import SummaryPanel from "./SummaryPanel";
import SchedulerResult from "./SchedulerResult";
import axios from "axios";

export default function Wizard({ selectedYears }) {
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);

  const initialYearData = useMemo(() => {
    const obj = {};
    selectedYears.forEach((y) => {
      obj[y] = {
        divisions: 1,
        periodsPerDay: 6,
        daysPerWeek: 5,
        lunchBreak: 4,
        subjects: [],
      };
    });
    return obj;
  }, [selectedYears]);

  const [yearData, setYearData] = useState(initialYearData);
  const [teachers, setTeachers] = useState([]);

  const payload = {
    years: yearData,
    teachers: teachers,
  };

  const handleGenerate = async () => {
    try {
      console.log("Sending payload:", payload);

      const res = await axios.post(
        "http://localhost:5000/api/scheduler/generate",
        payload
      );

      console.log("Scheduler response:", res.data);

      // Expecting solver to return object with class_timetable and teacher_timetable
      // Some backends wrap under .timetable — handle both cases
      const timetable = res.data.timetable || res.data;
      if (!timetable) {
        alert("Invalid scheduler response");
        console.log("Invalid data:", res.data);
        return;
      }

      setResult(timetable);
      setStep(4);
    } catch (error) {
      console.error(error);
      alert("Error generating timetable.");
    }
  };

  // Save handler passed down to SchedulerResult
  const handleSave = async (outerKey, table, isTeacher = false) => {
    // parent-level save so user has single place to manage backend calls
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
        // success feedback
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
    { number: 3, title: "Review & Generate", icon: "✓", color: "green" },
    { number: 4, title: "Timetable Result", icon: "📅", color: "cyan" },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl mx-auto overflow-hidden">
      {/* Header with Progress Bar */}
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
          <div className="px-5 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-bold text-lg border border-white/30">
            Step {step} of 4
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>

          {/* Step Circles */}
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

      {/* Content Area */}
      <div className="p-8">
        {step === 1 && (
          <div className="animate-fadeIn">
            <YearPanel
              selectedYears={selectedYears}
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
            <SummaryPanel
              data={payload}
              onBack={() => setStep(2)}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {step === 4 && (
          <div className="animate-fadeIn">
            <SchedulerResult
              result={result}
              onBack={() => setStep(1)}
              onSave={handleSave}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
            {step > 1 && step < 3 ? (
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

            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 ml-auto"
              >
                Next Step
                <span className="text-lg">→</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Animation Styles (plain style tag to avoid "jsx" warning) */}
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
