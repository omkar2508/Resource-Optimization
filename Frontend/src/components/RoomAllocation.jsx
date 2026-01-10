import React, { useState, useEffect } from "react"; // Added useEffect import
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

export default function RoomAllocation({
  yearData,
  rooms,
  setRooms,
  onBack,
  onGenerate,
}) {
  const { axios } = useAppContext();
  const [dbRooms, setDbRooms] = useState([]); // Database rooms
  const [selectedRoomId, setSelectedRoomId] = useState("");

  // State for manual overrides if needed (referenced in your UI)
  const [roomType, setRoomType] = useState("Classroom");
  const [capacity, setCapacity] = useState(60);

  // Fetch rooms from database on component mount
  useEffect(() => {
    const fetchDbRooms = async () => {
      try {
        const { data } = await axios.get("/api/rooms/all");
        if (data.success) {
          setDbRooms(data.rooms);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        toast.error("Failed to load rooms from database");
      }
    };
    fetchDbRooms();
  }, [axios]);

  const addRoom = () => {
    const roomObj = dbRooms.find((r) => r._id === selectedRoomId);
    if (!roomObj) return toast.error("Select a room from the list");

    // Check for duplicates in the current selection
    if (rooms.find((r) => r.name === roomObj.name)) {
      return toast.error("Room already added to this schedule");
    }

    // Add room to the list. We include properties from the DB room
    // but keep your UI structure (using 'id' for removal logic)
    setRooms([
      ...rooms,
      {
        ...roomObj,
        id: roomObj._id,
      },
    ]);

    setSelectedRoomId("");
    toast.success("Room added to selection");
  };

  const removeRoom = (id) => {
    // if (!window.confirm("Are you sure you want to remove this room?")) return;
    toast(
          ({ closeToast }) => (
            <div>
              <p className="font-medium mb-2">
                Are you sure you want to remove this room?
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
                    setRooms(rooms.filter((r) => r.id !== id));
                    toast.success("Room removed successfully");
                    closeToast();
                  }}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  Remove
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

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-gray-100 animate-fadeIn">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <span>🏫</span>
        <span>Room Management</span>
      </h2>

      <div className="mb-6 sm:mb-8 rounded-lg sm:rounded-xl md:rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
          {/* Select Room */}
          <div className="sm:col-span-9 md:col-span-10">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              Room Name
            </label>

            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className={`w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-300 bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          focus:border-blue-500
          ${!selectedRoomId ? "text-gray-400" : "text-gray-800"}
        `}
            >
              {/* Placeholder / delimiter */}
              <option value="" disabled>
                <span className="hidden sm:inline">Select ClassRooms | Labs | Tutorials With Capacities</span>
                <span className="sm:hidden">Select Room</span>
              </option>

              {dbRooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.type}) - Cap: {r.capacity}
                </option>
              ))}
            </select>
          </div>

          {/* Add Room Button */}
          <div className="sm:col-span-3 md:col-span-2">
            <button
              onClick={addRoom}
              className="w-full h-10 sm:h-11 rounded-lg sm:rounded-xl bg-blue-600 text-white font-semibold text-sm sm:text-base
          hover:bg-blue-700 transition-all shadow-sm
          disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={!selectedRoomId}
            >
              + Add Room
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {rooms.length === 0 ? (
          <p className="text-center text-sm sm:text-base text-gray-400 py-8 sm:py-10 bg-gray-50 rounded-lg border border-dashed">
            No rooms added. Please select rooms above.
          </p>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white border rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-0">
                  <span className="font-bold text-base sm:text-lg text-gray-800">{room.name}</span>
                  <span className="px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs uppercase font-bold text-gray-600 whitespace-nowrap">
                    {room.type}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Capacity: {room.capacity}</p>
              </div>
              <button
                onClick={() => removeRoom(room.id)}
                className="w-full sm:w-auto px-4 sm:px-5 py-1.5 sm:py-2 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold rounded-lg transition-colors text-sm sm:text-base border border-red-200 sm:border-0"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 border-t">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-5 sm:px-6 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base font-semibold"
        >
          Back
        </button>
        <button
          onClick={onGenerate}
          className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg sm:rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-sm sm:text-base"
        >
          Generate Timetable
        </button>
      </div>
    </div>
  );
}
