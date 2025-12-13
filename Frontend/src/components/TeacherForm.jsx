// src/components/TeacherForm.jsx
import React, { useEffect, useMemo, useState } from "react";

function alphaIndex(n) {
  return String.fromCharCode(64 + n); // 1->A, 2->B ...
}

export default function TeacherForm({
  teachers,
  setTeachers,
  selectedYears: selectedYearsFromWizard,
  yearData,
}) {
  // ------------------------
  // Local component states
  // ------------------------
  const [name, setName] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedYearsLocal, setSelectedYearsLocal] = useState([]);
  const [divisionsByYear, setDivisionsByYear] = useState({});
  const [canTakeLabs, setCanTakeLabs] = useState(false);
  const [error, setError] = useState("");

  // ------------------------
  // Available subjects (flat list)
  // ------------------------
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

  // ------------------------
  // When teacher selects years → update divisions UI
  // ------------------------
  useEffect(() => {
    const newDivs = {};

    selectedYearsLocal.forEach((yr) => {
      const count = Number(yearData[yr]?.divisions || 1);
      newDivs[yr] = Array.from({ length: count }, (_, i) => alphaIndex(i + 1));
    });

    setDivisionsByYear(newDivs);
  }, [selectedYearsLocal, yearData]);

  // ------------------------
  // Subject selection toggle
  // ------------------------
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

  // ------------------------
  // Toggle Year
  // ------------------------
  function toggleYear(yr) {
    if (selectedYearsLocal.includes(yr)) {
      setSelectedYearsLocal(selectedYearsLocal.filter((y) => y !== yr));
    } else {
      setSelectedYearsLocal([...selectedYearsLocal, yr]);
    }
  }

  // ------------------------
  // Toggle Division per Year
  // ------------------------
  function toggleDivision(yr, d) {
    const copy = { ...divisionsByYear };
    const existing = new Set(copy[yr]);

    if (existing.has(d)) existing.delete(d);
    else existing.add(d);

    copy[yr] = Array.from(existing);
    setDivisionsByYear(copy);
  }

  // ------------------------
  // Save teacher
  // ------------------------
  function saveTeacher() {
    setError("");

    if (!name.trim()) return setError("Teacher name required");
    if (selectedSubjects.length === 0)
      return setError("Select at least one subject");
    if (selectedYearsLocal.length === 0) return setError("Select years");

    // Check divisions
    for (const yr of selectedYearsLocal) {
      if (!divisionsByYear[yr] || divisionsByYear[yr].length === 0) {
        return setError(`Select divisions for ${yr}`);
      }
    }

    const teacherObj = {
      id: Date.now(),
      name: name.trim(),
      subjects: selectedSubjects,
      years: selectedYearsLocal,
      divisions: divisionsByYear,
      canTakeLabs,
    };

    setTeachers([...teachers, teacherObj]);

    // Reset
    setName("");
    setSelectedYearsLocal([]);
    setSelectedSubjects([]);
    setDivisionsByYear({});
    setCanTakeLabs(false);
  }

  // ------------------------
  // UI
  // ------------------------
  return (
    <div>
      <h3 className="font-semibold mb-3">Add Teachers</h3>

      <div className="border p-4 rounded mb-4 bg-white">
        {/* Teacher Name */}
        <input
          className="border p-2 w-full mb-3"
          placeholder="Teacher Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          <div className="font-medium mb-1">Years Teacher Will Teach</div>

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
        <div className="mb-3">
          <div className="font-medium mb-1">Divisions</div>

          {selectedYearsLocal.length === 0 && (
            <div className="text-sm text-gray-500">Select years first</div>
          )}

          {selectedYearsLocal.map((yr) => {
            const count = Number(yearData[yr]?.divisions || 1);
            const divisions = Array.from({ length: count }, (_, i) =>
              alphaIndex(i + 1)
            );

            return (
              <div className="mb-2 border p-2 rounded" key={yr}>
                <div className="font-semibold mb-1">{yr}</div>

                <div className="flex gap-4 flex-wrap">
                  {divisions.map((d) => (
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
            );
          })}
        </div>

        {/* Lab */}
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={canTakeLabs}
            onChange={(e) => setCanTakeLabs(e.target.checked)}
          />
          Can take labs
        </label>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={saveTeacher}
        >
          Add Teacher
        </button>
      </div>

      {/* List */}
      <h3 className="font-semibold mb-2">Teachers Added</h3>

      {teachers.map((t) => (
        <div key={t.id} className="border p-3 rounded mb-2">
          <div className="font-semibold">{t.name}</div>
          <div className="text-sm text-gray-700">
            Subjects: {t.subjects.map((s) => s.code).join(", ")}
          </div>
          <div className="text-sm text-gray-700">
            Years: {t.years.join(", ")}
          </div>
          <div className="text-sm text-gray-700">
            Divisions:
            {Object.entries(t.divisions).map(
              ([year, divs]) => ` ${year}: [${divs.join(", ")}] `
            )}
          </div>
          <div className="text-sm text-gray-700">
            Labs: {t.canTakeLabs ? "Yes" : "No"}
          </div>
        </div>
      ))}
    </div>
  );
}
