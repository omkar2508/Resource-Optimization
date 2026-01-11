// src/pages/SchedulerResult1.jsx - UPDATED: Uses unified renderer
import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { renderTimetableCell, downloadTimetableCSV } from "../utils/renderTimetableCell";
import { formatTimeSlot } from "../utils/timeFormat";
import { toast } from "react-toastify";

const ORDERED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function downloadJSON(obj, fileName) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName + ".json";
  link.click();
}

function getSuggestion(item, recommendations) {
  if (!recommendations || recommendations.length === 0) {
    return "No specific recommendations available.";
  }

  const matchingRec = recommendations.find(
    rec => rec.session?.subject === item.subject && 
           rec.session?.year === item.year &&
           rec.session?.division === item.division
  );

  if (matchingRec && matchingRec.suggestions && matchingRec.suggestions.length > 0) {
    return matchingRec.suggestions[0];
  }

  return "Consider adjusting resource allocation or periods per day.";
}

export default function SchedulerResult({ result, onBack, onSave }) {
  const navigate = useNavigate();

  if (!result) return <p>No timetable received.</p>;

  const classTT = result.class_timetable || {};
  const teacherTT = result.teacher_timetable || {};
  const unallocated = result.unallocated || [];
  const conflicts = result.conflicts || [];
  const roomConflicts = result.room_conflicts || [];
  const recommendations = result.recommendations || [];
  const criticalIssues = result.critical_issues || [];
  
  const labConflicts = result.lab_conflicts || [];
  const breakInterruptedLabs = labConflicts.filter(c => c.reason === 'break_interruption');
  const hasBreakConflicts = breakInterruptedLabs.length > 0;
  
  const allConflicts = [...conflicts, ...roomConflicts];
  const hasIssues = unallocated.length > 0 || allConflicts.length > 0 || criticalIssues.length > 0;

// FIXED: defaultSave function with improved year parsing
const defaultSave = async (outerKey, table, isTeacher = false) => {
  let payload = {};
  if (isTeacher) {
    // Teacher timetables are not saved separately
    toast.info("Teacher timetables are derived from class timetables and cannot be saved separately.");
    return { success: true, message: "Teacher timetables are derived dynamically" };
  } else {
    // Parse outerKey format: "3rd Div 1" or "1st Year Div 1"
    const keyStr = String(outerKey);
    let year, division;
    
    console.log("🔍 Parsing outerKey:", keyStr);
    
    if (keyStr.includes(" Div ")) {
      // Format: "year Div division"
      const divIndex = keyStr.indexOf(" Div ");
      year = keyStr.substring(0, divIndex).trim();
      division = keyStr.substring(divIndex + 5).trim();
      
      console.log("✅ Extracted - Year:", year, "Division:", division);
    } else {
      // Fallback: try to split and extract
      const parts = keyStr.split(" ");
      const divIndex = parts.findIndex(p => p.toLowerCase() === "div");
      
      if (divIndex !== -1 && divIndex < parts.length - 1) {
        year = parts.slice(0, divIndex).join(" ").trim();
        division = parts[divIndex + 1].trim();
      } else {
        // Last resort: find first numeric part as division
        const divMatch = parts.find((p) => /^\d+$/.test(p));
        division = divMatch || "1";
        year = parts.filter(p => p !== divMatch && p.toLowerCase() !== "div").join(" ").trim() || keyStr;
      }
    }

    // ✅ FIX: Ensure division is valid (should be numeric or alpha like "A", "B")
    // Accept both numeric (1, 2, 3) and alphabetic (A, B, C) divisions
    if (!/^[0-9A-Za-z]+$/.test(division)) {
      console.warn("⚠️ Invalid division format:", division, "- defaulting to 1");
      division = "1";
    }

    // Ensure year is not empty
    if (!year || year.length === 0) {
      console.error("❌ Could not parse year from outerKey:", outerKey);
      toast.error("Failed to parse timetable information. Please try again.");
      return { success: false, message: "Invalid timetable key format" };
    }

    console.log("📤 Sending payload - Year:", year, "Division:", division);

    payload = {
      year,
      division,
      timetableData: table,
    };
  }

  try {
    const res = await axios.post("http://localhost:5000/api/timetable/save", payload);
    
    console.log("📥 Server response:", res.data);
    
    if (res?.data?.success) {
      toast.success("Saved successfully: " + (res.data.message || ""));
      return res.data;
    } else {
      toast.error(
        "Save failed: " + (res.data?.message || "Please try again or check console for details."),
        { autoClose: 5000 }
      );
      console.error("❌ Save failed response:", res.data);
      return res.data;
    }
  } catch (err) {
    console.error("❌ Save error:", err);
    console.error("Error details:", err.response?.data);
    const errorMessage = err.response?.data?.message || err.message || "Unknown error";
    toast.error("Error saving timetable: " + errorMessage, { autoClose: 5000 });
    throw err;
  }
};

  const handleSave = async (outerKey, table, isTeacher = false) => {
    if (allConflicts.length > 0) {
      toast.error(
        "Cannot save timetable with conflicts. Please resolve all teacher and room conflicts before saving.",
        { duration: 5000 }
      );
      return;
    }

    if (criticalIssues.length > 0) {
      toast.error(
        `Cannot save timetable due to critical issues:\n${criticalIssues.join(", ")}`,
        { duration: 6000 }
      );
      return;
    }

    if (onSave) {
      try {
        const maybePromise = onSave(outerKey, table, isTeacher);
        if (maybePromise && typeof maybePromise.then === "function") {
          // ✅ AWAIT the promise and check the result
          const result = await maybePromise;
          
          // Only show success if the save actually succeeded
          if (result && result.success) {
            toast.success("Timetable saved successfully");
          }
        }
      } catch (e) {
        console.error("onSave threw", e);
        toast.error("Failed to save timetable: " + (e.message || "Unknown error"));
      }
    } else {
      try {
        await defaultSave(outerKey, table, isTeacher);
      } catch (e) {
        console.error("defaultSave error", e);
      }
    }
  };

  const canSave = allConflicts.length === 0 && criticalIssues.length === 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-200">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">Generated Timetable</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {criticalIssues.length > 0 
              ? "🚨 Critical issues detected - cannot generate timetable"
              : hasIssues 
                ? "⚠️ Review issues before finalizing" 
                : "✅ Timetable generated successfully"}
          </p>
        </div>

        {/* 🚨 CRITICAL ISSUES REPORT */}
        {criticalIssues.length > 0 && (
          <div className="bg-red-100 border-2 border-red-400 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-900 flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🚨</span>
              <span>Critical Issues ({criticalIssues.length})</span>
            </h2>
            <p className="text-sm sm:text-base text-red-800 mb-3 sm:mb-4 font-medium">
              These issues must be resolved before generating a timetable:
            </p>
            <div className="space-y-2">
              {criticalIssues.map((issue, i) => (
                <div key={i} className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-red-600 shadow-sm">
                  <p className="text-sm sm:text-base text-red-900 font-medium">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BREAK INTERRUPTION CONFLICTS */}
        {hasBreakConflicts && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-900 flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">⏰</span>
              <span>Break Interruption Detected ({breakInterruptedLabs.length} Lab{breakInterruptedLabs.length > 1 ? 's' : ''})</span>
            </h2>
            <p className="text-sm sm:text-base text-red-800 mb-3 sm:mb-4 font-medium">
              🚫 The following continuous labs cannot be scheduled because breaks interrupt the required time slots:
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              {breakInterruptedLabs.map((conflict, i) => (
                <div key={i} className="bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-md border-l-4 border-red-600">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className="font-bold text-base sm:text-lg md:text-xl text-gray-900 break-words">{conflict.subject}</span>
                        <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                          {conflict.total_duration}-Hour Continuous Lab
                        </span>
                        {conflict.batch && (
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                            Batch {conflict.batch}
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {conflict.year} - Division {conflict.division} - {conflict.day}
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200 mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">🚫</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-red-900 mb-1 sm:mb-2 text-sm sm:text-base">Conflict Details:</div>
                        <div className="text-xs sm:text-sm text-red-800 space-y-1">
                          <div>• Attempted start: <span className="font-mono font-bold break-all">{conflict.attempted_start ? formatTimeSlot(conflict.attempted_start) : conflict.attempted_start}</span></div>
                          <div>• Break location: <span className="font-mono font-bold break-all">{conflict.break_slot ? formatTimeSlot(conflict.break_slot) : conflict.break_slot}</span></div>
                          <div>• Break interrupts at: Hour {conflict.break_position} of {conflict.total_duration}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">Recommended Solutions:</div>
                        <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <span className="font-bold flex-shrink-0">1.</span>
                            <span>Move the break to <span className="font-bold">before</span> this {conflict.total_duration}-hour time window on {conflict.day}</span>
                          </div>
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <span className="font-bold flex-shrink-0">2.</span>
                            <span>Move the break to <span className="font-bold">after</span> this {conflict.total_duration}-hour time window on {conflict.day}</span>
                          </div>
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            <span className="font-bold flex-shrink-0">3.</span>
                            <span>Schedule this lab on a <span className="font-bold">different day</span> with {conflict.total_duration} consecutive free slots</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">⚡</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-yellow-900 text-sm sm:text-base">Quick Fix:</div>
                  <div className="text-xs sm:text-sm text-yellow-800 mt-1">
                    Go to Year Configuration → Time Configuration → Adjust lunch/break timing to avoid interrupting {breakInterruptedLabs.length} continuous lab{breakInterruptedLabs.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROOM & TEACHER CONFLICTS - Keep existing code */}
        {roomConflicts.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-orange-800 flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">🏢</span>
              <span>Room Conflicts Detected ({roomConflicts.length})</span>
            </h2>
            <p className="text-sm sm:text-base text-orange-700 mb-3 sm:mb-4 font-medium">
              🚫 The following rooms are already occupied at these times. Resolve conflicts before saving.
            </p>
            <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md border border-orange-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-orange-100 text-orange-800 font-bold">
                    <tr>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap">Room</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap">Day / Time</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap">Already Occupied By</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap">Subject</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap">Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {roomConflicts.map((c, i) => (
                      <tr key={i} className="hover:bg-orange-50 transition-colors">
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-bold text-gray-800 whitespace-nowrap">{c.room}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-700 whitespace-nowrap">
                          {c.day} - {formatTimeSlot(c.time_slot)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-orange-600 font-medium whitespace-nowrap">{c.assigned_to}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 break-words">{c.subject}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 whitespace-nowrap">{c.teacher}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* UNALLOCATED SESSIONS - Keep existing code */}
        {unallocated.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-800 flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">⚠️</span>
              <span>Incomplete Schedule ({unallocated.length} Session{unallocated.length > 1 ? 's' : ''} Missing)</span>
            </h2>
            <p className="text-sm sm:text-base text-amber-700 mb-3 sm:mb-4">
              The following sessions could not be allocated. Review the recommendations below and adjust your configuration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {unallocated.map((item, i) => (
                <div key={i} className="bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-md border border-amber-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-3 gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg text-gray-800 break-words">{item.subject}</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 flex flex-wrap gap-1 sm:gap-2">
                        <span className="inline-block bg-gray-100 px-2 py-0.5 rounded">{item.type}</span>
                        <span>{item.batch}</span>
                        {item.batch_num && <span className="text-purple-600 font-medium">Batch {item.batch_num}</span>}
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-bold">
                        -{item.missing}h
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.assigned || 0}/{item.required || item.missing} assigned
                      </div>
                    </div>
                  </div>
                  
                  {/* 💡 RECOMMENDATIONS */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 text-lg flex-shrink-0">💡</span>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-800 text-sm mb-1">Recommendation:</div>
                        <div className="text-blue-700 text-xs leading-relaxed">
                          {getSuggestion(item, recommendations)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📋 TEACHER CONFLICT REPORT */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-red-800 flex items-center gap-3 mb-4">
              <span className="text-3xl">❌</span>
              Teacher Conflicts Detected ({conflicts.length})
            </h2>
            <p className="text-red-700 mb-4 font-medium">
              🚫 The following teachers are already assigned to other classes at these times.
            </p>
            <div className="bg-white rounded-xl overflow-hidden shadow-md border border-red-200">
              <table className="w-full text-sm">
                <thead className="bg-red-100 text-red-800 font-bold">
                  <tr>
                    <th className="py-3 px-4 text-left">Teacher</th>
                    <th className="py-3 px-4 text-left">Day / Time</th>
                    <th className="py-3 px-4 text-left">Already Teaching</th>
                    <th className="py-3 px-4 text-left">Subject</th>
                    <th className="py-3 px-4 text-left">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {conflicts.map((c, i) => (
                    <tr key={i} className="hover:bg-red-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800">{c.teacher}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {c.day} - {c.time_slot}
                      </td>
                      <td className="py-3 px-4 text-red-600 font-medium">{c.assigned_to}</td>
                      <td className="py-3 px-4 text-gray-600">{c.subject}</td>
                      <td className="py-3 px-4 text-gray-600">{c.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLASS TIMETABLES */}
        {Object.keys(classTT).length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 text-gray-800 border-b pb-2 sm:pb-3">Class Timetables</h3>

            {Object.keys(classTT).map((year) =>
              Object.keys(classTT[year]).map((division) => {
                const tt = classTT[year][division];
                const outerKey = `${year} Div ${division}`;

                // Get all unique time slots
                const allTimeSlots = new Set();
                ORDERED_DAYS.forEach((day) => {
                  if (tt[day]) {
                    Object.keys(tt[day]).forEach((slot) => allTimeSlots.add(slot));
                  }
                });
                const sortedTimeSlots = Array.from(allTimeSlots).sort();

                return (
                  <div key={`${year}-${division}`} className="mb-10 last:mb-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 pb-3 border-b border-gray-200 gap-2 sm:gap-4">
                      <h4 className="text-lg sm:text-xl font-bold text-gray-800 truncate flex-1 min-w-0">
                        {year} — Division {division}
                      </h4>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleEdit(outerKey, tt, false)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleSave(outerKey, tt, false)}
                          disabled={!canSave}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap ${
                            !canSave
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          title={!canSave ? "Resolve conflicts and critical issues to enable saving" : ""}
                        >
                          {!canSave ? "🔒 Save" : "Save"}
                        </button>

                        <button
                          onClick={() => downloadJSON(tt, outerKey)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                        >
                          JSON
                        </button>

                        <button
                          onClick={() => downloadTimetableCSV(tt, outerKey, ORDERED_DAYS)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                        >
                          CSV
                        </button>
                      </div>
                    </div>

                    {/* ✅ USE UNIFIED RENDERER */}
                    <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200 -mx-1 sm:mx-0">
                      <table className="min-w-full border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-blue-600 text-white">
                            <th className="border border-gray-300 p-2 sm:p-3 font-bold text-xs sm:text-sm sticky left-0 bg-blue-600 z-10 whitespace-nowrap">
                              Time Slot / Day
                            </th>
                            {ORDERED_DAYS.map((day) => (
                              tt[day] && (
                                <th
                                  key={day}
                                  className="border border-gray-300 p-2 sm:p-3 font-bold text-xs sm:text-sm whitespace-nowrap min-w-[140px] sm:min-w-[160px]"
                                >
                                  {day}
                                </th>
                              )
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {sortedTimeSlots.map((timeSlot) => (
                            <tr key={timeSlot} className="hover:bg-blue-50/30 transition-colors">
                              <td className="border border-gray-300 p-2 sm:p-3 bg-blue-50 font-bold text-blue-700 text-center text-xs sm:text-sm sticky left-0 bg-blue-50 z-10 whitespace-nowrap">
                                {formatTimeSlot(timeSlot)}
                              </td>

                              {ORDERED_DAYS.map((day) => (
                                tt[day] && (
                                  <td
                                    key={day}
                                    className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm align-top min-h-[90px] sm:min-h-[110px]"
                                  >
                                    {renderTimetableCell(tt[day][timeSlot], {
                                      showYearDivision: false,
                                      filterByBatch: null,
                                      highlightBatch: false
                                    })}
                                  </td>
                                )
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TEACHER TIMETABLES */}
        {Object.keys(teacherTT).length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6 text-gray-800 border-b pb-2 sm:pb-3">Teacher Timetables</h3>

            {Object.keys(teacherTT).map((teacher) => {
              const tt = teacherTT[teacher];

              // Get all unique time slots
              const allTimeSlots = new Set();
              ORDERED_DAYS.forEach((day) => {
                if (tt[day]) {
                  Object.keys(tt[day]).forEach((slot) => allTimeSlots.add(slot));
                }
              });
              const sortedTimeSlots = Array.from(allTimeSlots).sort();

              return (
                <div key={teacher} className="mb-10 last:mb-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 pb-3 border-b border-gray-200 gap-2 sm:gap-4">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-800 truncate flex-1 min-w-0">{teacher}</h4>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleEdit(teacher, tt, true)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleSave(teacher, tt, true)}
                        disabled={!canSave}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap ${
                          !canSave
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title={!canSave ? "Resolve conflicts to enable saving" : ""}
                      >
                        {!canSave ? "🔒 Save" : "Save"}
                      </button>

                      <button
                        onClick={() => downloadJSON(tt, teacher)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                      >
                        JSON
                      </button>

                      <button
                        onClick={() => downloadTimetableCSV(tt, teacher, ORDERED_DAYS)}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                      >
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* ✅ USE UNIFIED RENDERER WITH YEAR/DIVISION */}
                  <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-gray-200 -mx-1 sm:mx-0">
                    <table className="min-w-full border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="border border-gray-300 p-2 sm:p-3 font-bold text-xs sm:text-sm sticky left-0 bg-blue-600 z-10 whitespace-nowrap">
                            Time Slot / Day
                          </th>
                          {ORDERED_DAYS.map((day) => (
                            tt[day] && (
                              <th
                                key={day}
                                className="border border-gray-300 p-2 sm:p-3 font-bold text-xs sm:text-sm whitespace-nowrap min-w-[140px] sm:min-w-[160px]"
                              >
                                {day}
                              </th>
                            )
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {sortedTimeSlots.map((timeSlot) => (
                          <tr key={timeSlot} className="hover:bg-blue-50/30 transition-colors">
                            <td className="border border-gray-300 p-2 sm:p-3 bg-blue-50 font-bold text-blue-700 text-center text-xs sm:text-sm sticky left-0 bg-blue-50 z-10 whitespace-nowrap">
                              {formatTimeSlot(timeSlot)}
                            </td>

                            {ORDERED_DAYS.map((day) => (
                              tt[day] && (
                                <td
                                  key={day}
                                  className="border border-gray-300 p-2 sm:p-3 text-xs sm:text-sm align-top min-h-[90px] sm:min-h-[110px]"
                                >
                                  {renderTimetableCell(tt[day][timeSlot], {
                                    showYearDivision: true,  // Show year/div in teacher view
                                    filterByBatch: null,
                                    highlightBatch: false
                                  })}
                                </td>
                              )
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GLOBAL SAVE ALL BUTTON - Keep existing */}
        {Object.keys(classTT).length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 border border-gray-200">
            <button
              onClick={() => {
                if (!canSave) {
                  toast.error(`Cannot save timetables. ${allConflicts.length > 0 ? "Resolve all teacher & room conflicts. " : ""}${
                      criticalIssues.length > 0 ? "Fix all critical issues first." : ""
                    }`,
                    { autoClose: 6000 }
                  );
                  return;
                }
                Object.keys(classTT).forEach(year => {
                  Object.keys(classTT[year]).forEach(division => {
                    const tt = classTT[year][division];
                    const outerKey = `${year} Div ${division}`;
                    handleSave(outerKey, tt, false);
                  });
                });
              }}
              disabled={!canSave}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                !canSave
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              {!canSave 
                ? "🔒 Resolve Issues to Save All" 
                : "💾 Save All Class Timetables"}
            </button>
            
            {unallocated.length > 0 && canSave && (
              <p className="text-sm text-amber-600 text-center mt-3">
                ⚠️ Warning: Saving with {unallocated.length} unallocated session(s). Consider adjusting configuration.
              </p>
            )}
          </div>
        )}

        {/* BACK BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors shadow-sm"
          >
            ← Back to Configuration
          </button>
        </div>
      </div>
    </div>
  );
}