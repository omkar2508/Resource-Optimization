import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const AddRoom = () => {
  const { axios } = useAppContext();

  const [formData, setFormData] = useState({
    name: "",
    type: "Classroom",
    capacity: 60,
    labCategory: "",
    primaryYear: "Shared",
  });

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const LAB_CATEGORIES = [
    "Networking",
    "Linux",
    "IoT",
    "Software Development",
    "Hardware",
    "Database",
    "Cloud Computing",
    "Cybersecurity",
    "AI/ML",
    "General Purpose"
  ];

  const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Shared"];

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms/all");
      if (data.success) {
        setRooms(data.rooms);
        console.log("✅ Fetched rooms:", data.rooms);
      }
    } catch (error) {
      console.error("❌ Failed to fetch rooms:", error);
      toast.error("Failed to fetch rooms");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.type || !formData.capacity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.type === "Lab" && !formData.labCategory) {
      toast.error("Please select a lab category for lab rooms");
      return;
    }

    try {
      setLoading(true);
      console.log("📤 Sending room data:", formData);
      
      const { data } = await axios.post("/api/rooms/add", formData);
      
      console.log("📥 Response:", data);
      
      if (data.success) {
        toast.success("✅ Room added successfully");
        fetchRooms();
        setFormData({ 
          name: "", 
          type: "Classroom", 
          capacity: 60,
          labCategory: "",
          primaryYear: "Shared"
        });
      } else {
        toast.error(data.message || "Failed to add room");
      }
    } catch (err) {
      console.error("❌ Error adding room:", err);
      toast.error(err.response?.data?.message || "Error adding room");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRoom = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-medium mb-2">
            Are you sure you want to delete this room?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeToast}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDeleteRoom(id);
                closeToast();
              }}
              className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
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

  const handleDeleteRoom = async (id) => {
    try {
      const { data } = await axios.delete(`/api/rooms/delete/${id}`);
      if (data.success) {
        toast.success("Room deleted");
        fetchRooms();
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Failed to delete room");
    }
  };

  const getRoomTypeIcon = (type) => {
    switch(type) {
      case "Classroom": return "📚";
      case "Lab": return "🔬";
      case "Tutorial": return "✏️";
      default: return "🏫";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 py-4 sm:py-6 md:py-10 px-4">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏫 Room Infrastructure</h1>
        <p className="text-gray-600">Define room resources (metadata only - no assignments yet)</p>
      </div>

      {/* ADD ROOM FORM */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 max-w-6xl mx-auto border">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <span>➕</span>
          Add New Room
        </h2>

        <div className="space-y-6">
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. B101, Lab-A"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              >
                <option value="Classroom">📚 Classroom</option>
                <option value="Lab">🔬 Lab</option>
                <option value="Tutorial">✏️ Tutorial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="10"
                max="200"
                placeholder="e.g. 60"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 2: Lab Category (conditional) */}
          {formData.type === "Lab" && (
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <label className="block text-sm font-semibold text-purple-900 mb-2">
                🔬 Lab Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.labCategory}
                onChange={(e) => setFormData({ ...formData, labCategory: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
              >
                <option value="">-- Select Lab Category --</option>
                {LAB_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="text-xs text-purple-700 mt-2">
                Helps in automatic lab-subject matching during timetable generation
              </p>
            </div>
          )}

          {/* Row 3: Primary Year */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              🎓 Primary Year / Availability
            </label>
            <select
              value={formData.primaryYear}
              onChange={(e) => setFormData({ ...formData, primaryYear: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
            >
              {YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="mt-3 space-y-1 text-xs text-blue-700">
              <p>• <strong>Specific Year:</strong> Room appears only for that year in Wizard Step 3</p>
              <p>• <strong>Shared:</strong> Room available for ALL years</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Adding Room...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Add Room to Infrastructure</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>💡 Note:</strong> This page only stores room metadata. Subject/division/batch assignments 
            happen in <strong>Wizard Step 3</strong> during timetable generation.
          </p>
        </div>
      </div>

      {/* ROOMS TABLE */}
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-6xl mx-auto border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800">
            📋 Room Infrastructure List
          </h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {rooms.length} Rooms
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 text-slate-700">
                <th className="p-3 text-left text-sm font-semibold border-b-2 border-blue-200">Room</th>
                <th className="p-3 text-left text-sm font-semibold border-b-2 border-blue-200">Type</th>
                <th className="p-3 text-left text-sm font-semibold border-b-2 border-blue-200">Capacity</th>
                <th className="p-3 text-left text-sm font-semibold border-b-2 border-blue-200">Category</th>
                <th className="p-3 text-left text-sm font-semibold border-b-2 border-blue-200">Available For</th>
                <th className="p-3 text-left text-sm font-semibold border-b-2 border-blue-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🏫</span>
                      <p>No rooms added yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rooms.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b hover:bg-blue-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getRoomTypeIcon(r.type)}</span>
                        <span className="font-bold text-gray-800">{r.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{r.capacity}</td>
                    <td className="p-3">
                      {r.labCategory && r.labCategory !== "None" ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                          {r.labCategory}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        r.primaryYear === "Shared" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {r.primaryYear}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => confirmDeleteRoom(r._id)}
                        className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddRoom;