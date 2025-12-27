import React, { useEffect, useState } from "react";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6]; // Show all periods

export default function TeacherTimetable() {
  const [teacherTTs, setTeacherTTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/timetable/all");
        if (res.data.success) {
          const teacherMap = buildTeacherTimetables(res.data.timetables || []);
          setTeacherTTs(teacherMap);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Failed to fetch timetables");
      }
      setLoading(false);
    };

    fetchAndBuild();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-blue-600 font-medium">Fetching data…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Teacher Timetables</h2>

      {teacherTTs.length === 0 && <p>No teacher timetables found.</p>}

      {teacherTTs.map((tt) => (
        <div
          key={tt.teacher}
          className="border p-4 mb-6 bg-white rounded shadow-md"
        >
          <div className="flex justify-between mb-2">
            <h3 className="font-bold text-lg">{tt.teacher}</h3>

            <div className="flex gap-2">
              <button
                onClick={() => downloadCSV(tt.timetable, tt.teacher)}
                className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
              >
                Download
              </button>
            </div>
          </div>

          <TeacherTable data={tt.timetable} />
        </div>
      ))}
    </div>
  );
}

function buildTeacherTimetables(classTimetables) {
  const teacherMap = {};

  classTimetables.forEach((doc) => {
    const year = doc.year;
    const division = doc.division;
    const table = doc.timetableData || {};

    Object.keys(table || {}).forEach((day) => {
      const dayData = table[day] || {};
      Object.keys(dayData).forEach((period) => {
        const cell = dayData[period] || [];

        cell.forEach((entry) => {
          const teacher = entry.teacher;
          if (!teacher) return;

          if (!teacherMap[teacher]) {
            teacherMap[teacher] = {};
          }
          if (!teacherMap[teacher][day]) {
            teacherMap[teacher][day] = {};
          }
          if (!teacherMap[teacher][day][period]) {
            teacherMap[teacher][day][period] = [];
          }

          teacherMap[teacher][day][period].push({
            ...entry,
            year: entry.year || year,
            division: entry.division || division,
          });
        });
      });
    });
  });

  return Object.keys(teacherMap).map((teacher) => ({
    teacher,
    timetable: teacherMap[teacher],
  }));
}

function downloadCSV(table, filename) {
  let csv = "Period / Day";
  DAYS.forEach((d) => {
    csv += `,${d}`;
  });
  csv += "\n";

  PERIODS.forEach((p) => {
    csv += `P${p}`;
    DAYS.forEach((d) => {
      const cell = table[d]?.[p] || [];

      if (cell.length === 0) {
        csv += ",-";
      } else {
        const combined = cell
          .map((entry) => {
            const subj = entry.subject || "-";
            const yr = entry.year || "";
            const div = entry.division || "";
            const room = entry.room || "";

            const extra =
              [yr && `Y:${yr}`, div && `Div:${div}`, room && `R:${room}`]
                .filter(Boolean)
                .join(" ");

            return extra ? `${subj} (${extra})` : subj;
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

// Updated TeacherTable to show ALL PERIODS
function TeacherTable({ data }) {
  if (!data) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white font-bold">
            <th className="border p-4 w-24 text-center">Period</th>
            {DAYS.map((d) => (
              <th key={d} className="border p-4 min-w-[160px] text-center">{d}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {PERIODS.map((p) => (
            <tr key={p} className="hover:bg-blue-50/30 transition-colors">
              <td className="border p-4 font-black bg-blue-50 text-blue-700 text-center text-lg">P{p}</td>

              {DAYS.map((d) => (
                <td key={d} className="border p-3 align-top min-h-[110px]">
                  {(data[d]?.[p] || []).map((entry, i) => (
                    <div
                      key={i}
                      className="p-3 mb-2 border-l-4 bg-blue-50 border-blue-500 rounded-xl shadow-md transition-transform hover:scale-[1.02]"
                    >
                      <div className="font-bold text-gray-900 text-[13px]">
                        {entry.subject}
                      </div>
                      <div className="text-[11px] text-gray-600 mt-2 space-y-1">
                        {entry.year && (
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-70">📚</span> {entry.year} — Div {entry.division}
                          </div>
                        )}
                        {entry.room && (
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-70">📍</span> {entry.room}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(data[d]?.[p] || []).length === 0 && (
                    // i want to reduce the height of black cells
                    <div className="py-2 text-center">
                      <span className="text-gray-300 font-medium tracking-widest text-[10px] uppercase">-</span>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}