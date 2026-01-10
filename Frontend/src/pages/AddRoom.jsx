import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const AddRoom = () => {
  const { axios } = useAppContext();

  const [formData, setFormData] = useState({
    name: "",
    type: "Classroom",
    capacity: 60,
  });

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms/all");
      if (data.success) setRooms(data.rooms);
    } catch (error) {
      toast.error("Failed to fetch rooms");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await axios.post("/api/rooms/add", formData);
      if (data.success) {
        toast.success("Room added successfully");
        fetchRooms();
        setFormData({ name: "", type: "Classroom", capacity: 60 });
      }
    } catch (err) {
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
              className="px-3 py-1 text-sm border rounded"
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
      await axios.delete(`/api/rooms/delete/${id}`, {
        withCredentials: true,
      });
      toast.success("Room deleted");
      fetchRooms();
    } catch (err) {
      toast.error("Failed to delete room");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 py-4 sm:py-6 md:py-10">
      {/* ================= ADD ROOM ================= */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 max-w-6xl mx-auto border">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 sm:mb-6">Add Room</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
        >
          <input
            type="text"
            placeholder="Room Name (e.g. B101)"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              })
            }
            className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-slate-100 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-slate-100 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Classroom">Classroom</option>
            <option value="Lab">Lab</option>
            <option value="Tutorial">Tutorial</option>
          </select>

          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: e.target.value })
            }
            className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-slate-100 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 md:col-span-3 mt-2 py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-semibold disabled:opacity-60 text-sm sm:text-base"
          >
            {loading ? "Adding..." : "Add Room"}
          </button>
        </form>

        {/* Helper text OUTSIDE the grid */}
        <p className="text-xs sm:text-sm text-slate-500 mt-3">
          Use standard room naming like <b>B101</b>, <b>Lab-2</b>, etc.
        </p>
      </div>

      {/* ================= ROOMS TABLE ================= */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 max-w-6xl mx-auto border">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">
          Rooms List
        </h3>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-0 px-4">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 text-slate-700">
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Name</th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Type</th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Capacity</th>
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 sm:p-6 text-gray-500 text-sm sm:text-base">
                      No rooms added yet
                    </td>
                  </tr>
                ) : (
                  rooms.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t hover:bg-blue-50 transition"
                    >
                      <td className="p-2 sm:p-3 text-sm sm:text-base whitespace-nowrap">{r.name}</td>
                      <td className="p-2 sm:p-3 text-sm sm:text-base whitespace-nowrap">{r.type}</td>
                      <td className="p-2 sm:p-3 text-sm sm:text-base whitespace-nowrap">{r.capacity}</td>
                      <td className="p-2 sm:p-3 whitespace-nowrap">
                        <button
                          onClick={() => confirmDeleteRoom(r._id)}
                          className="px-2 sm:px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
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
    </div>
  );
};

export default AddRoom;
