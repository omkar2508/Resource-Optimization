import React, { useEffect, useState } from "react";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function TeacherTimetable() {
  const [teacherTTs, setTeacherTTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        // Reuse the same data source as "View Timetables"
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

function TeacherTable({ data }) {
  if (!data) return null;

  return (
    <table className="w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">Period / Day</th>
          {DAYS.map((d) => (
            <th key={d} className="border p-2">
              {d}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {PERIODS.map((p) => (
          <tr key={p}>
            <td className="border p-2 font-semibold bg-gray-50">P{p}</td>

            {DAYS.map((d) => (
              <td key={d} className="border p-2 align-top">
                {(data[d]?.[p] || []).map((entry, i) => (
                  <div
                    key={i}
                    className="p-1 mb-1 border rounded bg-white shadow-sm"
                  >
                    <strong>{entry.subject}</strong>
                    <br />
                    {entry.year && (
                      <span className="text-xs text-gray-700">
                        {entry.year} – Div {entry.division}
                      </span>
                    )}
                    {entry.room && (
                      <span className="text-xs text-gray-700 block">
                        Room: {entry.room}
                      </span>
                    )}
                  </div>
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

