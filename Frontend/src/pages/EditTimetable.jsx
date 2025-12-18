import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ORDERED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EditTimetable() {
  const location = useLocation();
  const navigate = useNavigate();

  const { table, outerKey, isTeacher } = location.state || {};

  const [localTable, setLocalTable] = useState(() =>
    JSON.parse(JSON.stringify(table || {}))
  );

  if (!table || !outerKey) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-semibold">
          No timetable data found to edit.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          ← Back
        </button>
      </div>
    );
  }

  const getPeriods = () => {
    const firstDay = ORDERED_DAYS.find((d) => localTable[d]);
    if (!firstDay) return [];
    return Object.keys(localTable[firstDay])
      .map((p) => Number(p))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
  };

  const handleFieldChange = (day, period, idx, field, value) => {
    setLocalTable((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[day] = copy[day] || {};
      copy[day][period] = copy[day][period] || [];
      copy[day][period][idx] = {
        subject: "",
        teacher: "",
        room: "",
        type: "Theory",
        batch: "",
        year: copy[day][period][idx]?.year,
        division: copy[day][period][idx]?.division,
        ...copy[day][period][idx],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddEntry = (day, period) => {
    setLocalTable((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[day] = copy[day] || {};
      copy[day][period] = copy[day][period] || [];
      copy[day][period].push({
        subject: "",
        teacher: "",
        room: "",
        type: "Theory",
        batch: "",
      });
      return copy;
    });
  };

  const handleClearCell = (day, period) => {
    setLocalTable((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[day] && copy[day][period]) {
        copy[day][period] = [];
      }
      return copy;
    });
  };

  const handleSave = async () => {
    let payload = {};
    if (isTeacher) {
      payload = {
        timetableType: "teacher",
        teacherName: outerKey,
        timetableData: localTable,
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
        timetableData: localTable,
      };
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/timetable/save",
        payload
      );
      if (res?.data?.success) {
        alert("Timetable saved successfully");
        navigate(-1);
      } else {
        alert("Save failed: " + JSON.stringify(res.data || "no response"));
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving timetable. See console.");
    }
  };

  const periods = getPeriods();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-xl font-semibold">Edit Timetable</h2>
          <p className="text-xs text-gray-500 mt-1">
            {isTeacher ? `Teacher: ${outerKey}` : outerKey}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">
                  Period / Day
                </th>
                {ORDERED_DAYS.map(
                  (day) =>
                    localTable[day] && (
                      <th
                        key={day}
                        className="border border-gray-300 px-2 py-1 text-left"
                      >
                        {day}
                      </th>
                    )
                )}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period}>
                  <td className="border border-gray-200 px-2 py-1 font-semibold bg-gray-50">
                    P{period}
                  </td>
                  {ORDERED_DAYS.map(
                    (day) =>
                      localTable[day] && (
                        <td
                          key={day}
                          className="border border-gray-200 align-top px-1 py-1"
                        >
                          <div className="space-y-2">
                            {(localTable[day][period] || []).map(
                              (entry, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 border rounded bg-white shadow-sm space-y-1"
                                >
                                  <div className="flex gap-1">
                                    <input
                                      value={entry.subject || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          day,
                                          period,
                                          idx,
                                          "subject",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Subject"
                                      className="flex-1 border px-1 py-0.5 rounded text-[11px]"
                                    />
                                    <select
                                      value={entry.type || "Theory"}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          day,
                                          period,
                                          idx,
                                          "type",
                                          e.target.value
                                        )
                                      }
                                      className="border px-1 py-0.5 rounded text-[11px]"
                                    >
                                      <option value="Theory">Theory</option>
                                      <option value="Lab">Lab</option>
                                    </select>
                                  </div>

                                  <div className="flex gap-1">
                                    <input
                                      value={entry.teacher || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          day,
                                          period,
                                          idx,
                                          "teacher",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Teacher"
                                      className="flex-1 border px-1 py-0.5 rounded text-[11px]"
                                    />
                                    <input
                                      value={entry.room || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          day,
                                          period,
                                          idx,
                                          "room",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Room"
                                      className="w-20 border px-1 py-0.5 rounded text-[11px]"
                                    />
                                  </div>

                                  {!isTeacher && (
                                    <div className="flex gap-1">
                                      <input
                                        value={entry.year || ""}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            day,
                                            period,
                                            idx,
                                            "year",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Year"
                                        className="flex-1 border px-1 py-0.5 rounded text-[11px]"
                                      />
                                      <input
                                        value={entry.division || ""}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            day,
                                            period,
                                            idx,
                                            "division",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Div"
                                        className="w-14 border px-1 py-0.5 rounded text-[11px]"
                                      />
                                      <input
                                        value={entry.batch || ""}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            day,
                                            period,
                                            idx,
                                            "batch",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Batch"
                                        className="w-16 border px-1 py-0.5 rounded text-[11px]"
                                      />
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleAddEntry(day, period)}
                                className="flex-1 border border-dashed border-blue-400 text-blue-600 rounded text-[11px] py-0.5 hover:bg-blue-50"
                              >
                                + Add
                              </button>
                              {(localTable[day][period] || []).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleClearCell(day, period)
                                  }
                                  className="px-2 border border-red-300 text-red-600 rounded text-[11px] hover:bg-red-50"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


