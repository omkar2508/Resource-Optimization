
// src/utils/renderTimetableCell.js
// UNIFIED CELL RENDERER - Single source of truth for all timetable views

/**
 * Universal cell renderer for timetables
 * Used across: Generated, Saved, Teacher, and Student timetables
 * 
 * Handles:
 * - Theory lectures
 * - Single-hour practicals/labs
 * - Multi-hour continuous labs (2hr, 3hr)
 * - Batch information
 * - Time slot display
 */

export function renderTimetableCell(cell, options = {}) {
  const {
    showYearDivision = false,  // Show in teacher timetables
    filterByBatch = null,      // Filter for student view
    highlightBatch = false     // Highlight student's batch
  } = options;

  if (!cell || cell.length === 0) {
    return <span className="text-gray-300">-</span>;
  }

  // Filter entries if needed (for student view)
  let entries = cell;
  if (filterByBatch !== null) {
    entries = cell.filter(entry => {
      // Theory lectures are for whole class
      if (entry.type === 'Theory') return true;
      // For practicals/labs, match batch
      if (entry.batch) return String(entry.batch) === String(filterByBatch);
      return true;
    });
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <span className="text-gray-300 font-medium tracking-widest text-[10px] uppercase">
          {filterByBatch !== null ? 'No Class' : '-'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-h-[60px]">
      {entries.map((entry, idx) => {
        // Check if this is part of a multi-hour lab
        const isMultiHourLab = entry.type === 'Lab' && entry.lab_part;
        const labPartInfo = isMultiHourLab ? entry.lab_part.split('/') : null;
        const currentPart = labPartInfo ? parseInt(labPartInfo[0]) : 1;
        const totalParts = labPartInfo ? parseInt(labPartInfo[1]) : 1;
        
        // Determine background color
        const bgColor = 
          entry.type === 'Theory' 
            ? 'bg-blue-50 border-blue-500' 
            : entry.type === 'Lab'
            ? 'bg-purple-50 border-purple-500'
            : 'bg-green-50 border-green-500';
        
        return (
          <div 
            key={idx} 
            className={`p-2 text-[11px] leading-tight border-l-4 rounded shadow-sm transition-transform hover:scale-[1.02] ${bgColor}`}
          >
            {/* Subject Header */}
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-800">
                {entry.type === "Lab" ? "🧪 " : ""}
                {entry.subject}
                {isMultiHourLab && (
                  <span className="ml-1 text-[9px] bg-purple-200 text-purple-800 px-1 rounded">
                    {currentPart}/{totalParts}
                  </span>
                )}
              </span>
              {entry.batch && (
                <span className={`px-1 rounded font-bold text-[10px] ${
                  highlightBatch && String(entry.batch) === String(filterByBatch)
                    ? 'bg-yellow-200 text-yellow-900'
                    : 'bg-purple-200 text-purple-800'
                }`}>
                  B{entry.batch}
                </span>
              )}
            </div>

            {/* Details Section */}
            <div className="text-gray-600 mt-1 space-y-1">
              {/* Teacher */}
              <div className="flex items-center gap-1.5">
                <span className="opacity-70">👤</span> 
                <span className="font-medium">{entry.teacher}</span>
              </div>

              {/* Room */}
              <div className="flex items-center gap-1.5">
                <span className="opacity-70">🏢</span> 
                <span>{entry.room}</span>
              </div>

              {/* Multi-hour lab indicator (show on first part only) */}
              {isMultiHourLab && currentPart === 1 && (
                <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
                  <span className="opacity-70">⏱️</span>
                  <span>{totalParts}-hour continuous lab</span>
                </div>
              )}

              {/* Time slot (optional) */}
              {entry.time_slot && (
                <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-[9px]">
                  <span className="opacity-70">🕒</span> 
                  <span>{entry.time_slot}</span>
                </div>
              )}

              {/* Year & Division (for teacher timetables) */}
              {showYearDivision && entry.year && (
                <div className="mt-1 pt-1 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500">
                    <span className="opacity-70">📚</span>
                    <span>{entry.year} — Div {entry.division}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper to download timetable as CSV
 * Standardized across all views
 */
export function downloadTimetableCSV(table, filename, DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
  // Get all time slots from first available day
  const firstDay = DAYS.find(d => table[d] && Object.keys(table[d]).length > 0);
  if (!firstDay) return;
  
  const timeSlots = Object.keys(table[firstDay]).sort();
  
  let csv = "Time Slot / Day";
  DAYS.forEach((d) => {
    if (table[d]) csv += `,${d}`;
  });
  csv += "\n";

  timeSlots.forEach((slot) => {
    csv += `${slot}`;
    DAYS.forEach((d) => {
      if (!table[d]) return;
      const cell = table[d]?.[slot] || [];

      if (cell.length === 0) {
        csv += ",-";
      } else {
        const combined = cell
          .map((entry) => {
            const subj = entry.subject || "-";
            const teach = entry.teacher || "-";
            const room = entry.room || "";
            const batch = entry.batch ? `B${entry.batch}` : "";
            const year = entry.year || "";
            const div = entry.division || "";
            
            // Handle multi-hour labs
            const labPart = entry.lab_part ? `[${entry.lab_part}]` : "";

            const extra = [
              year && `Y:${year}`,
              div && `Div:${div}`,
              room && `R:${room}`,
              batch,
              labPart
            ].filter(Boolean).join(" ");

            return extra
              ? `${subj} (${teach} ${extra})`
              : `${subj} (${teach})`;
          })
          .join(" | ");

        csv += `,"${combined}"`;
      }
    });
    csv += "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename + ".csv";
  link.click();
}

/**
 * Standard table structure for all timetable views
 */
export function TimetableTable({ data, DAYS, renderOptions = {} }) {
  if (!data) return null;

  // Get all unique time slots across all days
  const allTimeSlots = new Set();
  DAYS.forEach((day) => {
    if (data[day]) {
      Object.keys(data[day]).forEach((slot) => allTimeSlots.add(slot));
    }
  });
  
  // Sort time slots
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white font-bold">
            <th className="border p-4 w-32 text-center">Time Slot</th>
            {DAYS.map(
              (d) =>
                data[d] && (
                  <th key={d} className="border p-4 min-w-[160px] text-center">
                    {d}
                  </th>
                )
            )}
          </tr>
        </thead>

        <tbody>
          {sortedTimeSlots.map((timeSlot) => (
            <tr key={timeSlot} className="hover:bg-blue-50/30 transition-colors">
              <td className="border p-4 font-black bg-blue-50 text-blue-700 text-center text-sm">
                {timeSlot}
              </td>

              {DAYS.map(
                (d) =>
                  data[d] && (
                    <td key={d} className="border p-3 align-top min-h-[110px]">
                      {renderTimetableCell(data[d][timeSlot], renderOptions)}
                    </td>
                  )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default {
  renderTimetableCell,
  downloadTimetableCSV,
  TimetableTable
};