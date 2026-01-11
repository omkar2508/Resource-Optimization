import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

function alphaIndex(n) {
  return String.fromCharCode(64 + n);
}

export default function TeacherForm({
  teachers,
  setTeachers,
  selectedYears: selectedYearsFromWizard,
  yearData,
}) {
  const { axios } = useAppContext();
  const [teacherUsers, setTeacherUsers] = useState([]); // teachers from users table
  const [selectedTeacher, setSelectedTeacher] = useState(""); // dropdown value

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedYearsLocal, setSelectedYearsLocal] = useState([]);
  const [divisionsByYear, setDivisionsByYear] = useState({});
  const [canTakeLabs, setCanTakeLabs] = useState(false);
  const [canTakeTutorial, setCanTakeTutorial] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [maxHoursPerDay, setMaxHoursPerDay] = useState(4);

  // Fetch teachers (role = teacher)
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const res = await axios.get("/api/admin/users");
        const teachersOnly = res.data.users.filter((u) => u.role === "teacher");
        setTeacherUsers(teachersOnly);
      } catch (err) {
        console.error("Failed to load teachers", err);
      }
    };

    loadTeachers();
  }, []);

  // Available subjects
  const availableSubjects = useMemo(() => {
    const list = [];
    Object.keys(yearData || {}).forEach((yr) => {
      (yearData[yr].subjects || []).forEach((s) => {
        list.push({
          code: s.code,
          name: s.name,
          year: yr,
          type: s.type || "Theory",
        });
      });
    });
    return list;
  }, [yearData]);

  // Divisions per year
  useEffect(() => {
    const newDivs = {};
    selectedYearsLocal.forEach((yr) => {
      const count = Number(yearData[yr]?.divisions || 1);
      newDivs[yr] = Array.from({ length: count }, (_, i) => alphaIndex(i + 1));
    });
    setDivisionsByYear(newDivs);
  }, [selectedYearsLocal, yearData]);

  // ✅ ORIGINAL LOGIC: Toggle all components of a subject (Theory + Lab + Tutorial)
  function toggleSubject(sub) {
    const key = `${sub.code}_${sub.year}`;
    const exists = selectedSubjects.some((s) => `${s.code}_${s.year}` === key);

    if (exists) {
      // Remove ALL components with this code and year
      setSelectedSubjects(
        selectedSubjects.filter((s) => `${s.code}_${s.year}` !== key)
      );
    } else {
      // Add ALL components with this code and year
      const allComponents = availableSubjects.filter(
        (s) => s.code === sub.code && s.year === sub.year
      );
      setSelectedSubjects([...selectedSubjects, ...allComponents]);
    }
  }

  function toggleYear(yr) {
    if (selectedYearsLocal.includes(yr)) {
      setSelectedYearsLocal(selectedYearsLocal.filter((y) => y !== yr));
    } else {
      setSelectedYearsLocal([...selectedYearsLocal, yr]);
    }
  }

  function toggleDivision(yr, d) {
    const copy = { ...divisionsByYear };
    const existing = new Set(copy[yr]);

    if (existing.has(d)) existing.delete(d);
    else existing.add(d);

    copy[yr] = Array.from(existing);
    setDivisionsByYear(copy);
  }

  // Save Teacher
  function saveTeacher() {
    setError("");

    if (!selectedTeacher) {
      toast.error("Please select a teacher");
      return;
    }

    if (selectedSubjects.length === 0) {
      toast.error("Select at least one subject");
      return;
    }

    if (selectedYearsLocal.length === 0) {
      toast.error("Select at least one year");
      return;
    }

    for (const yr of selectedYearsLocal) {
      if (!divisionsByYear[yr] || divisionsByYear[yr].length === 0) {
        toast.error(`Select divisions for ${yr}`);
        return;
      }
    }

    const teacherUser = teacherUsers.find((u) => u._id === selectedTeacher);

    const teacherObj = {
      id: editingId || Date.now(),
      teacherId: teacherUser._id,
      name: teacherUser.name,
      subjects: selectedSubjects,
      years: selectedYearsLocal,
      divisions: divisionsByYear,
      canTakeLabs,
      canTakeTutorial,
      maxHoursPerDay,
    };

    if (editingId) {
      setTeachers(teachers.map((t) => (t.id === editingId ? teacherObj : t)));
      setEditingId(null);
      toast.success("Teacher assignment updated successfully");
    } else {
      setTeachers([...teachers, teacherObj]);
      toast.success("Teacher added successfully");
    }

    // Reset
    setSelectedTeacher("");
    setSelectedSubjects([]);
    setSelectedYearsLocal([]);
    setDivisionsByYear({});
    setCanTakeLabs(false);
    setCanTakeTutorial(false);
    setMaxHoursPerDay(4);
  }

  // Edit / Delete
  function editTeacher(t) {
    setEditingId(t.id);
    setSelectedTeacher(t.teacherId);
    setSelectedSubjects(t.subjects);
    setSelectedYearsLocal(t.years);
    setDivisionsByYear(t.divisions);
    setCanTakeLabs(t.canTakeLabs || false);
    setCanTakeTutorial(t.canTakeTutorial || false);
    setMaxHoursPerDay(t.maxHoursPerDay || 4);
  }

  function deleteTeacher(id) {
    setTeachers(teachers.filter((t) => t.id !== id));
    toast.success("Teacher removed");
  }

  // ✅ Group subjects by code+year for display (show only once per subject)
  const groupedSubjects = useMemo(() => {
    const groups = new Map();
    availableSubjects.forEach((s) => {
      const key = `${s.code}_${s.year}`;
      if (!groups.has(key)) {
        groups.set(key, {
          code: s.code,
          name: s.name,
          year: s.year,
          types: [s.type],
        });
      } else {
        groups.get(key).types.push(s.type);
      }
    });
    return Array.from(groups.values());
  }, [availableSubjects]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Add Teachers</h3>

      <div className="border p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl mb-4 sm:mb-6 bg-white shadow-sm">
        {/* Teacher Dropdown */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Select Teacher</label>
          <select
            className="border p-2 sm:p-2.5 w-full rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="">Select Teacher</option>
            {teacherUsers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects - ✅ FIXED: Show grouped subjects with unique keys */}
        <div className="mb-3 sm:mb-4">
          <div className="text-sm sm:text-base font-medium mb-2">Subjects</div>
          <div className="overflow-x-auto border rounded-lg max-h-48 sm:max-h-64">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1.5 sm:p-2 text-center sticky left-0 bg-gray-100 z-10">✓</th>
                  <th className="border p-1.5 sm:p-2 text-left min-w-[80px] sm:min-w-[100px]">Code</th>
                  <th className="border p-1.5 sm:p-2 text-left min-w-[60px] sm:min-w-[80px]">Year</th>
                  <th className="border p-1.5 sm:p-2 text-left min-w-[100px] sm:min-w-[120px]">Types</th>
                </tr>
              </thead>
              <tbody>
                {groupedSubjects.map((s, idx) => {
                  const key = `${s.code}_${s.year}`;
                  const selected = selectedSubjects.some(
                    (x) => `${x.code}_${x.year}` === key
                  );
                  return (
                    <tr key={`${key}_${idx}`} className="hover:bg-gray-50">
                      <td className="border p-1.5 sm:p-2 text-center sticky left-0 bg-white z-10">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSubject(s)}
                          className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                        />
                      </td>
                      <td className="border p-1.5 sm:p-2 whitespace-nowrap">{s.code}</td>
                      <td className="border p-1.5 sm:p-2 whitespace-nowrap">{s.year}</td>
                      <td className="border p-1.5 sm:p-2 whitespace-nowrap">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {s.types.join(", ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Years */}
        <div className="mb-3 sm:mb-4">
          <div className="text-sm sm:text-base font-medium mb-2">Years</div>
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
            {Object.keys(yearData).map((yr) => (
              <label key={yr} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={selectedYearsLocal.includes(yr)}
                  onChange={() => toggleYear(yr)}
                  className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                />
                <span className="text-sm sm:text-base">{yr}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Divisions */}
        {selectedYearsLocal.map((yr) => (
          <div key={yr} className="mb-2 sm:mb-3 border p-2 sm:p-3 rounded-lg">
            <div className="font-semibold text-sm sm:text-base mb-2">{yr}</div>
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
              {(divisionsByYear[yr] || []).map((d) => (
                <label key={d} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={divisionsByYear[yr]?.includes(d)}
                    onChange={() => toggleDivision(yr, d)}
                    className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                  />
                  <span className="text-sm sm:text-base">Div {d}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Lab / Tutorial */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={canTakeLabs}
              onChange={(e) => setCanTakeLabs(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
            />
            <span className="text-sm sm:text-base">Can take labs</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={canTakeTutorial}
              onChange={(e) => setCanTakeTutorial(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
            />
            <span className="text-sm sm:text-base">Can take tutorial</span>
          </label>
        </div>

        {error && <div className="text-red-600 mb-2 text-sm sm:text-base p-2 bg-red-50 rounded">{error}</div>}
        
        {/* Max Teaching Hours Per Day */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Max Teaching Hours Per Day
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={maxHoursPerDay}
            onChange={(e) => setMaxHoursPerDay(Number(e.target.value))}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum teaching hours per day (default: 4)
          </p>
        </div>

        <button
          onClick={saveTeacher}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base shadow-md hover:shadow-lg"
        >
          {editingId ? "Update Teacher" : "Add Teacher"}
        </button>
      </div>

      {/* ✅ Teachers Added Table - Show types for each subject */}
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Teachers Added</h3>

      {teachers.length === 0 ? (
        <p className="text-sm sm:text-base text-gray-500 text-center py-4 sm:py-6 bg-gray-50 rounded-lg border border-dashed">No teachers added yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-lg border border-gray-200">
          <div className="inline-block min-w-full align-middle sm:px-0 px-2">
            <table className="min-w-full border border-gray-300 text-xs sm:text-sm bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-1.5 sm:p-2 text-left text-xs sm:text-sm font-semibold sticky left-0 bg-gray-100 z-10 whitespace-nowrap">Sr No</th>
                  <th className="border p-1.5 sm:p-2 text-left text-xs sm:text-sm font-semibold min-w-[120px] sm:min-w-[150px] whitespace-nowrap">Teacher Name</th>
                  <th className="border p-1.5 sm:p-2 text-left text-xs sm:text-sm font-semibold min-w-[150px] sm:min-w-[200px]">Subjects</th>
                  <th className="border p-1.5 sm:p-2 text-left text-xs sm:text-sm font-semibold min-w-[100px] sm:min-w-[120px] whitespace-nowrap">Years</th>
                  <th className="border p-1.5 sm:p-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Max Hrs/Day</th>
                  <th className="border p-1.5 sm:p-2 text-center text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px] sm:min-w-[120px]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {[...teachers]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t, index) => {
                    // ✅ Group subjects by code to show types
                    const subjectGroups = new Map();
                    t.subjects.forEach((s) => {
                      const key = `${s.code}`;
                      if (!subjectGroups.has(key)) {
                        subjectGroups.set(key, [s.type]);
                      } else {
                        if (!subjectGroups.get(key).includes(s.type)) {
                          subjectGroups.get(key).push(s.type);
                        }
                      }
                    });

                    const subjectDisplay = Array.from(subjectGroups.entries())
                      .map(([code, types]) => `${code} (${types.join(", ")})`)
                      .join(", ");

                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm sticky left-0 bg-white z-10 whitespace-nowrap">{index + 1}</td>

                        <td className="border p-1.5 sm:p-2 font-medium text-xs sm:text-sm whitespace-nowrap">
                          {t.name}
                        </td>

                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm break-words">
                          <div className="max-w-[200px] sm:max-w-none truncate sm:whitespace-normal" title={subjectDisplay}>
                            {subjectDisplay}
                          </div>
                        </td>

                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm whitespace-nowrap">
                          {t.years.join(", ")}
                        </td>

                        <td className="border p-1.5 sm:p-2 text-xs sm:text-sm whitespace-nowrap">{t.maxHoursPerDay || 4}</td>
                        
                        <td className="border p-1.5 sm:p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => editTeacher(t)}
                              className="px-2 sm:px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTeacher(t.id)}
                              className="px-2 sm:px-3 py-1 text-red-600 hover:bg-red-50 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}