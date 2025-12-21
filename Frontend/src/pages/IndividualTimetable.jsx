import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function IndividualTeacherTimetable() {
  const { userData } = useAppContext(); // ✅ logged-in user
  const [teacherTT, setTeacherTT] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/timetable/all");

        if (res.data.success && userData?.name) {
          const teacherName = userData.name.trim().toLowerCase();

          console.log("LOGGED IN TEACHER:", teacherName);

          const teacherMap = buildTeacherTimetables(
            res.data.timetables || [],
            teacherName
          );

          setTeacherTT(teacherMap);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Failed to fetch timetables");
      } finally {
        setLoading(false);
      }
    };

    if (userData?.name) {
      fetchAndBuild();
    }
  }, [userData]);

  if (loading) {
    return <div className="p-6">Loading timetable…</div>;
  }

  if (!teacherTT) {
    return <div className="p-6">No timetable found</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Teacher Timetable – {userData.name}
      </h2>

      <TeacherTable data={teacherTT} />
    </div>
  );
}

/* =======================================================
   BUILD TIMETABLE ONLY FOR LOGGED-IN TEACHER
======================================================= */
function buildTeacherTimetables(classTimetables, loggedTeacherName) {
  const teacherMap = {};

  classTimetables.forEach((doc) => {
    const year = doc.year;
    const division = doc.division;
    const table = doc.timetableData || {};

    Object.keys(table).forEach((day) => {
      Object.keys(table[day] || {}).forEach((period) => {
        const cell = table[day][period] || [];

        cell.forEach((entry) => {
          if (
            !entry.teacher ||
            entry.teacher.trim().toLowerCase() !== loggedTeacherName
          ) {
            return;
          }

          if (!teacherMap[day]) teacherMap[day] = {};
          if (!teacherMap[day][period]) teacherMap[day][period] = [];

          teacherMap[day][period].push({
            ...entry,
            year,
            division,
          });
        });
      });
    });
  });

  return Object.keys(teacherMap).length > 0 ? teacherMap : null;
}

/* =======================================================
   TABLE UI
======================================================= */
function TeacherTable({ data }) {
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
                    <span className="text-xs">
                      {entry.year} – Div {entry.division}
                    </span>
                    <br />
                    <span className="text-xs">Room: {entry.room}</span>
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
