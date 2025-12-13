// src/components/TimetableViewer.jsx
import React from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function TimetableViewer({
  title,
  data,
  isTeacher,
  onEditTimetable,
  onSave,
}) {
  if (!data) return null;

  const downloadCSV = (table, name) => {
    let csv = "Day,Period,Subject,Teacher,Year,Division\n";

    Object.keys(table).forEach((day) => {
      Object.keys(table[day]).forEach((period) => {
        const cell = table[day][period] || [];

        if (cell.length === 0) {
          csv += `${day},${period},-, -, -, -\n`;
        } else {
          cell.forEach((entry) => {
            csv += `${day},${period},${entry.subject || "-"},${
              entry.teacher || "-"
            },${entry.year || "-"},${entry.division || "-"}\n`;
          });
        }
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name + ".csv";
    link.click();
  };

  return (
    <div className="mt-6 border rounded p-4 bg-white shadow">
      <h3 className="font-bold text-lg mb-4">{title}</h3>

      {Object.keys(data).map((outerKey) => {
        const table = data[outerKey];

        return (
          <div
            key={outerKey}
            className="mb-8 border rounded p-3 bg-gray-50 shadow-sm"
          >
            {/* HEADER WITH BUTTONS */}
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold text-md">
                {isTeacher ? `Teacher: ${outerKey}` : `${outerKey}`}
              </h4>

              <div className="flex gap-2">
                {/* EDIT (only class timetable) */}
                {!isTeacher && onEditTimetable && (
                  <button
                    onClick={() => onEditTimetable(table)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Edit
                  </button>
                )}

                {/* SAVE */}
                <button
                  onClick={() => onSave && onSave(outerKey, table)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Save
                </button>

                {/* DOWNLOAD */}
                <button
                  onClick={() => downloadCSV(table, outerKey)}
                  className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
                >
                  Download
                </button>
              </div>
            </div>

            {/* TABLE RENDERING */}
            {isTeacher ? (
              <TeacherTable tt={table} />
            ) : (
              <ClassYearTable tt={table} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== CLASS TABLE ===== */
function ClassYearTable(yearData) {
  return Object.keys(yearData).map((division) => (
    <div key={division} className="mb-6">
      <h5 className="font-semibold mb-2">Division {division}</h5>
      <TableGrid timetable={yearData[division]} />
    </div>
  ));
}

/* ===== TEACHER TABLE ===== */
function TeacherTable(ttData) {
  return <TableGrid timetable={ttData} />;
}

/* ===== TABLE GRID ===== */
function TableGrid({ timetable }) {
  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-200">
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
            <td className="border p-2 font-medium bg-gray-100">P{p}</td>

            {DAYS.map((d) => (
              <td key={d} className="border p-2 align-top">
                {(timetable[d][p] || []).map((entry, i) => (
                  <div
                    key={i}
                    className="p-1 mb-1 border rounded bg-white shadow-sm text-sm"
                  >
                    <strong>{entry.subject}</strong>
                    <br />
                    {entry.teacher && (
                      <span className="text-xs text-gray-600">
                        {entry.teacher}
                      </span>
                    )}
                    {entry.year && (
                      <span className="text-xs text-gray-600">
                        {entry.year} - Div {entry.division}
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
