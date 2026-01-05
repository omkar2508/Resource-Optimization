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

  const [maxHoursPerDay, setMaxHoursPerDay] = useState(4); // ✅ NEW: Max teaching hours per day

  // =====================================================
  // Fetch teachers (role = teacher)
  // =====================================================
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const res = await axios.get("/api/admin/users"); // EXISTING API

        // FILTER ONLY TEACHERS (frontend only)
        const teachersOnly = res.data.users.filter((u) => u.role === "teacher");

        setTeacherUsers(teachersOnly);
      } catch (err) {
        console.error("Failed to load teachers", err);
      }
    };

    loadTeachers();
  }, []);

  // =====================================================
  // Available subjects
  // =====================================================
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

  // =====================================================
  // Divisions per year
  // =====================================================
  useEffect(() => {
    const newDivs = {};
    selectedYearsLocal.forEach((yr) => {
      const count = Number(yearData[yr]?.divisions || 1);
      newDivs[yr] = Array.from({ length: count }, (_, i) => alphaIndex(i + 1));
    });
    setDivisionsByYear(newDivs);
  }, [selectedYearsLocal, yearData]);

  // =====================================================
  // Handlers
  // =====================================================
  function toggleSubject(sub) {
    const key = `${sub.code}_${sub.year}`;
    const exists = selectedSubjects.some((s) => `${s.code}_${s.year}` === key);

    if (exists) {
      setSelectedSubjects(
        selectedSubjects.filter((s) => `${s.code}_${s.year}` !== key)
      );
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
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

  // =====================================================
  // Save Teacher
  // =====================================================
  function saveTeacher() {
    setError("");


    // if (!selectedTeacher) return setError("Select a teacher");
    // if (selectedSubjects.length === 0)
    //   return setError("Select at least one subject");
    // if (selectedYearsLocal.length === 0) return setError("Select years");

    // Change 24.12.2025
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
      maxHoursPerDay, // ✅ NEW: Include max hours
    };

    if (editingId) {
      setTeachers(teachers.map((t) => (t.id === editingId ? teacherObj : t)));
      setEditingId(null);
    } else {
      setTeachers([...teachers, teacherObj]);
    }

    // Change Add toast 24.12.2025
    if (editingId) {
      toast.success("Teacher assignment updated successfully");
    } else {
      toast.success("Teacher added successfully");
    }

    // Reset
    setSelectedTeacher("");
    setSelectedSubjects([]);
    setSelectedYearsLocal([]);
    setDivisionsByYear({});
    setCanTakeLabs(false);
    setCanTakeTutorial(false);
    setMaxHoursPerDay(4); // ✅ NEW: Reset to default
  }
  // =====================================================
  // Edit / Delete
  // =====================================================
  function editTeacher(t) {
    setEditingId(t.id);
    setSelectedTeacher(t.teacherId);
    setSelectedSubjects(t.subjects);
    setSelectedYearsLocal(t.years);
    setDivisionsByYear(t.divisions);
    setCanTakeLabs(t.canTakeLabs || false);
    setCanTakeTutorial(t.canTakeTutorial || false);
    setMaxHoursPerDay(t.maxHoursPerDay || 4); // ✅ NEW: Load existing value
  }

  function deleteTeacher(id) {
    setTeachers(teachers.filter((t) => t.id !== id));
    toast.success("Teacher removed");
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <div>
      <h3 className="font-semibold mb-3">Add Teachers</h3>

      <div className="border p-4 rounded mb-4 bg-white">
        {/* Teacher Dropdown */}
        <select
          className="border p-2 w-full mb-3"
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

        {/* Subjects */}
        <div className="mb-3">
          <div className="font-medium mb-1">Subjects</div>
          <div className="overflow-auto border rounded max-h-40">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">✓</th>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Year</th>
                  <th className="border p-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {availableSubjects.map((s) => {
                  const selected = selectedSubjects.some(
                    (x) => x.code === s.code && x.year === s.year
                  );
                  return (
                    <tr key={`${s.code}_${s.year}`}>
                      <td className="border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSubject(s)}
                        />
                      </td>
                      <td className="border p-2">{s.code}</td>
                      <td className="border p-2">{s.year}</td>
                      <td className="border p-2">{s.type}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Years */}
        <div className="mb-3">
          <div className="font-medium mb-1">Years</div>
          <div className="flex gap-4 flex-wrap">
            {Object.keys(yearData).map((yr) => (
              <label key={yr} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedYearsLocal.includes(yr)}
                  onChange={() => toggleYear(yr)}
                />
                {yr}
              </label>
            ))}
          </div>
        </div>

        {/* Divisions */}
        {selectedYearsLocal.map((yr) => (
          <div key={yr} className="mb-2 border p-2 rounded">
            <div className="font-semibold">{yr}</div>
            <div className="flex gap-4 flex-wrap">
              {(divisionsByYear[yr] || []).map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={divisionsByYear[yr]?.includes(d)}
                    onChange={() => toggleDivision(yr, d)}
                  />
                  {d}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Lab / Tutorial */}
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={canTakeLabs}
            onChange={(e) => setCanTakeLabs(e.target.checked)}
          />
          Can take labs
        </label>

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={canTakeTutorial}
            onChange={(e) => setCanTakeTutorial(e.target.checked)}
          />
          Can take tutorial
        </label>

        {error && <div className="text-red-600 mb-2">{error}</div>}
        
        {/* ✅ NEW: Max Teaching Hours Per Day */}
        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max Teaching Hours Per Day
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={maxHoursPerDay}
            onChange={(e) => setMaxHoursPerDay(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum number of teaching hours this teacher can be assigned in a single day (default: 4)
          </p>
        </div>

        <button
          onClick={saveTeacher}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? "Update Teacher" : "Add Teacher"}
        </button>
      </div>

      {/* List */}
      {/* <h3 className="font-semibold mb-2">Teachers Added</h3>

      {teachers.map((t) => (
        <div key={t.id} className="border p-3 rounded mb-2 bg-white">
          <div className="font-semibold">{t.name}</div>
          <div className="text-sm">
            Subjects: {t.subjects.map((s) => s.code).join(", ")}
          </div>
        </div>
      ))} */}



      {/* Make table to display teachers instead of card: Change 24.12.2025 */}
      {/* List */}
      <h3 className="font-semibold mb-2">Teachers Added</h3>

      {teachers.length === 0 ? (
        <p className="text-gray-500">No teachers added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Sr No</th>
                <th className="border p-2 text-left">Teacher Name</th>
                <th className="border p-2 text-left">Subjects</th>
                <th className="border p-2 text-left">Years</th>
                <th className="border p-2 text-center">Actions</th>
                <th className="border p-2 text-left">Max Hrs/Day</th>
              </tr>
            </thead>

            <tbody>
              {[...teachers]
                .sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical order
                .map((t, index) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="border p-2">{index + 1}</td>

                    <td className="border p-2 font-medium">
                      {t.name}
                    </td>

                    <td className="border p-2">
                      {t.subjects.map((s) => s.code).join(", ")}
                    </td>

                    <td className="border p-2">
                      {t.years.join(", ")}
                    </td>

                    <td className="border p-2 text-center space-x-2">
                      <button
                        onClick={() => editTeacher(t)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTeacher(t.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                    <td className="border p-2">{t.maxHoursPerDay || 4}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

