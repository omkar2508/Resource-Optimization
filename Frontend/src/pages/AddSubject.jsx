import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const SEM_MAP = {
  "1st": [1, 2],
  "2nd": [3, 4],
  "3rd": [5, 6],
  "4th": [7, 8]
};

const YEAR_NAMES = {
  "1st": "First Year",
  "2nd": "Second Year",
  "3rd": "Third Year",
  "4th": "Final Year"
};

export default function AddSubject() {
  const { axios } = useAppContext();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    year: "1st",
    semester: 1
  });

  // Component states
  const [hasTheory, setHasTheory] = useState(true);
  const [theoryHours, setTheoryHours] = useState(4);
  
  const [hasLabTutorial, setHasLabTutorial] = useState(false);
  const [labTutorialType, setLabTutorialType] = useState("Lab");
  const [labTutorialHours, setLabTutorialHours] = useState(2);
  const [batches, setBatches] = useState(1);
  const [labDuration, setLabDuration] = useState(2);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/subjects/filter?year=${formData.year}&semester=${formData.semester}`
      );
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [formData.year, formData.semester]);

  const resetForm = () => {
    setFormData({ code: "", name: "", year: formData.year, semester: formData.semester });
    setHasTheory(true);
    setTheoryHours(4);
    setHasLabTutorial(false);
    setLabTutorialType("Lab");
    setLabTutorialHours(2);
    setBatches(1);
    setLabDuration(2);
    setEditMode(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build components array
    const components = [];
    
    if (hasTheory) {
      components.push({
        type: "Theory",
        hours: theoryHours,
        batches: 1,
        labDuration: 0
      });
    }

    if (hasLabTutorial) {
      components.push({
        type: labTutorialType,
        hours: labTutorialHours,
        batches: batches,
        labDuration: labTutorialType === "Lab" ? labDuration : 0
      });
    }

    if (components.length === 0) {
      toast.error("Subject must have at least one component (Theory, Lab, or Tutorial)");
      return;
    }

    const payload = {
      ...formData,
      components
    };

    try {
      if (editMode) {
        const { data } = await axios.put(`/api/subjects/update/${editingId}`, payload);
        if (data.success) {
          toast.success("Subject updated successfully!");
          fetchSubjects();
          resetForm();
        }
      } else {
        const { data } = await axios.post("/api/subjects/add", payload);
        if (data.success) {
          toast.success("Subject added successfully!");
          fetchSubjects();
          resetForm();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save subject");
    }
  };

  const handleEdit = (subject) => {
    setFormData({
      code: subject.code,
      name: subject.name,
      year: subject.year,
      semester: subject.semester
    });

    // Parse components
    const theoryComp = subject.components.find(c => c.type === "Theory");
    const labTutComp = subject.components.find(c => c.type === "Lab" || c.type === "Tutorial");

    setHasTheory(!!theoryComp);
    if (theoryComp) {
      setTheoryHours(theoryComp.hours);
    }

    setHasLabTutorial(!!labTutComp);
    if (labTutComp) {
      setLabTutorialType(labTutComp.type);
      setLabTutorialHours(labTutComp.hours);
      setBatches(labTutComp.batches);
      setLabDuration(labTutComp.labDuration || 2);
    }

    setEditMode(true);
    setEditingId(subject._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-medium mb-3">
            Are you sure you want to delete this subject?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeToast}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  const { data } = await axios.delete(`/api/subjects/delete/${id}`);
                  if (data.success) {
                    toast.success("Subject deleted successfully");
                    fetchSubjects();
                  }
                } catch (error) {
                  toast.error("Failed to delete subject");
                }
                closeToast();
              }}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Theory": return "bg-blue-100 text-blue-700";
      case "Lab": return "bg-purple-100 text-purple-700";
      case "Tutorial": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Theory": return "📖";
      case "Lab": return "🔬";
      case "Tutorial": return "✏️";
      default: return "📚";
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📚</span>
            Subject Management
          </h2>
          <p className="text-gray-600 mt-2">
            Add subjects with their Theory, Lab, and Tutorial components
          </p>
        </div>

        {/* Add/Edit Subject Form */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>{editMode ? "✏️" : "➕"}</span>
              {editMode ? "Edit Subject" : "Add New Subject"}
            </h3>
            {editMode && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Year and Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Academic Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: e.target.value,
                      semester: SEM_MAP[e.target.value][0]
                    })
                  }
                  disabled={editMode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {Object.keys(SEM_MAP).map((y) => (
                    <option key={y} value={y}>
                      {y} - {YEAR_NAMES[y]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: parseInt(e.target.value) })
                  }
                  disabled={editMode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {SEM_MAP[formData.year].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject Code and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g., CS101"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  disabled={editMode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Data Structures"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Theory Component */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasTheory"
                    checked={hasTheory}
                    onChange={(e) => setHasTheory(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="hasTheory" className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <span>📖</span>
                    Theory Component
                  </label>
                </div>
              </div>

              {hasTheory && (
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Theory Hours per Week *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={theoryHours}
                    onChange={(e) => setTheoryHours(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required={hasTheory}
                  />
                </div>
              )}
            </div>

            {/* Lab/Tutorial Component */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasLabTutorial"
                    checked={hasLabTutorial}
                    onChange={(e) => setHasLabTutorial(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="hasLabTutorial" className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    <span>🔬</span>
                    Lab / Tutorial Component
                  </label>
                </div>
              </div>

              {hasLabTutorial && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Type *
                      </label>
                      <select
                        value={labTutorialType}
                        onChange={(e) => setLabTutorialType(e.target.value)}
                        className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="Lab">Lab</option>
                        <option value="Tutorial">Tutorial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Hours per Week *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={labTutorialHours}
                        onChange={(e) => setLabTutorialHours(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        required={hasLabTutorial}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        Number of Batches
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={batches}
                        onChange={(e) => setBatches(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>

                    {labTutorialType === "Lab" && (
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Continuous Duration (hours)
                        </label>
                        <select
                          value={labDuration}
                          onChange={(e) => setLabDuration(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value={1}>1 Hour</option>
                          <option value={2}>2 Hours (Continuous)</option>
                          <option value={3}>3 Hours (Continuous)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {labTutorialType === "Lab" && (
                    <p className="text-xs text-purple-700 flex items-center gap-2">
                      <span>💡</span>
                      Lab sessions occupy {labDuration} continuous time slot{labDuration > 1 ? 's' : ''} without breaks
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              {editMode ? "Update Subject" : "Add Subject"}
            </button>
          </form>
        </div>

        {/* Subject List */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              Subjects for {formData.year} - Semester {formData.semester}
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {subjects.length} Subjects
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading subjects...</p>
            </div>
          ) : subjects.length > 0 ? (
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div
                  key={subject._id}
                  className="p-5 border-2 rounded-xl bg-gray-50 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-xl text-gray-800">
                          {subject.code}
                        </span>
                        <span className="text-gray-400">—</span>
                        <span className="text-gray-700 font-medium text-lg">
                          {subject.name}
                        </span>
                      </div>
                      
                      {/* Components */}
                      <div className="flex flex-wrap gap-2">
                        {subject.components.map((comp, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${getTypeColor(comp.type)}`}
                          >
                            <span>{getTypeIcon(comp.type)}</span>
                            <span>{comp.type}</span>
                            <span className="text-xs opacity-75">
                              • {comp.hours}h/week
                            </span>
                            {comp.type !== "Theory" && (
                              <span className="text-xs opacity-75">
                                • {comp.batches} batch{comp.batches > 1 ? "es" : ""}
                              </span>
                            )}
                            {comp.type === "Lab" && comp.labDuration > 1 && (
                              <span className="text-xs opacity-75">
                                • {comp.labDuration}h continuous
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                        title="Edit subject"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-semibold"
                        title="Delete subject"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-2 block">📚</span>
              <p className="text-gray-500 font-medium">No subjects found</p>
              <p className="text-gray-400 text-sm mt-1">
                Add subjects using the form above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}