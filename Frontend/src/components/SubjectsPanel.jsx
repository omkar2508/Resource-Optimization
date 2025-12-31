import React, { useState } from "react";
import { toast } from "react-toastify";

export default function SubjectsPanel({ year, yearData, setYearData }) {
  const [subject, setSubject] = useState({
    code: "",
    name: "",
    type: "Theory",
    hours: "",
    batches: 1,
    labDuration: 2, // NEW: Default lab duration in hours
  });

  function addSubject() {
    if (!subject.code.trim() || !subject.name.trim()) {
      toast.error("Subject code and name are required");
      return;
    }

    // Validate lab duration
    if (subject.type === "Lab" && (!subject.labDuration || subject.labDuration < 1 || subject.labDuration > 3)) {
      toast.error("Lab duration must be between 1 and 3 hours");
      return;
    }

    const updated = [...yearData[year].subjects, subject];

    setYearData((prev) => ({
      ...prev,
      [year]: { ...prev[year], subjects: updated },
    }));

    toast.success(`${subject.code} - ${subject.name} added successfully`);

    setSubject({ 
      code: "", 
      name: "", 
      type: "Theory", 
      hours: "", 
      batches: 1,
      labDuration: 2
    });
  }

  function removeSubject(index) {
    const updated = yearData[year].subjects.filter((_, i) => i !== index);
    setYearData((prev) => ({
      ...prev,
      [year]: { ...prev[year], subjects: updated },
    }));
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "Theory":
        return "from-blue-500 to-cyan-400";
      case "Lab":
        return "from-purple-500 to-pink-500";
      case "Tutorial":
        return "from-green-500 to-emerald-400";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Theory":
        return "📖";
      case "Lab":
        return "🔬";
      case "Tutorial":
        return "✏️";
      default:
        return "📚";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📚</span>
        <h4 className="text-xl font-bold text-gray-800">Subjects</h4>
        <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
          {yearData[year].subjects.length} Added
        </span>
      </div>

      <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 backdrop-blur-sm p-6 rounded-xl border border-blue-200/50 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">➕</span>
          <h5 className="font-semibold text-gray-700">Add New Subject</h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            className="px-4 py-3 border-2 border-blue-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-gray-400"
            placeholder="Subject Code (e.g., CS101)"
            value={subject.code}
            onChange={(e) =>
              setSubject({ ...subject, code: e.target.value.toUpperCase() })
            }
          />
          <input
            className="px-4 py-3 border-2 border-blue-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-gray-400"
            placeholder="Subject Name"
            value={subject.name}
            onChange={(e) => setSubject({ ...subject, name: e.target.value })}
          />

          <select
            className="px-4 py-3 border-2 border-blue-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-semibold text-gray-700 cursor-pointer"
            value={subject.type}
            onChange={(e) => setSubject({ ...subject, type: e.target.value })}
          >
            <option value="Theory">📖 Theory</option>
            <option value="Lab">🔬 Lab</option>
            <option value="Tutorial">✏️ Tutorial</option>
          </select>

          <input
            type="number"
            min="1"
            max="20"
            className="px-4 py-3 border-2 border-blue-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all font-semibold text-gray-700"
            placeholder="No of Hr/per week"
            value={subject.hours}
            onChange={(e) =>
              setSubject({
                ...subject,
                hours: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />

          {subject.type === "Lab" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-purple-700">
                🕐 Lab Duration (Continuous Hours)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setSubject({ ...subject, labDuration: duration })}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      subject.labDuration === duration
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        : "bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400"
                    }`}
                  >
                    {duration} Hour{duration > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Lab will occupy {subject.labDuration} continuous time slot{subject.labDuration > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {subject.type !== "Theory" && (
            <input
              type="number"
              min="1"
              max="10"
              className="px-4 py-3 border-2 border-purple-200 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-semibold text-gray-700"
              placeholder="No. of batches"
              value={subject.batches}
              onChange={(e) =>
                setSubject({ ...subject, batches: Number(e.target.value) })
              }
            />
          )}
        </div>

        <button
          onClick={addSubject}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Add Subject
        </button>
      </div>

      {yearData[year].subjects.length > 0 ? (
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>📋</span>
            Added Subjects
          </h5>
          {yearData[year].subjects.map((s, i) => (
            <div
              key={i}
              className="group bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`px-3 py-1 bg-gradient-to-r ${getTypeColor(
                      s.type
                    )} text-white rounded-lg font-semibold text-sm shadow-md flex items-center gap-1`}
                  >
                    <span>{getTypeIcon(s.type)}</span>
                    {s.type}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-lg">
                        {s.code}
                      </span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-700 font-medium">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>⏰</span>
                        {s.hours} hrs/week
                      </span>
                      {s.type === "Lab" && s.labDuration && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">
                          <span>🕐</span>
                          {s.labDuration}h continuous
                        </span>
                      )}
                      {s.type !== "Theory" && (
                        <span className="flex items-center gap-1">
                          <span>👥</span>
                          {s.batches} batch{s.batches > 1 ? "es" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeSubject(i)}
                  className="opacity-0 group-hover:opacity-100 px-3 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all duration-200 flex items-center gap-1 text-sm"
                  title="Remove Subject"
                >
                  <span>🗑️</span>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300">
          <span className="text-4xl mb-2 block">📚</span>
          <p className="text-gray-500 font-medium">No subjects added yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Add your first subject using the form above
          </p>
        </div>
      )}
    </div>
  );
}