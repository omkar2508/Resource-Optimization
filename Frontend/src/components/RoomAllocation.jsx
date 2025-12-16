import React, { useState } from "react";

export default function RoomAllocation({ yearData, rooms, setRooms, onBack, onGenerate }) {
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("Classroom");
  const [capacity, setCapacity] = useState(60);

  // Removed the useEffect auto-generation logic to respect manual input only

  const addRoom = () => {
    if (!roomName.trim()) return alert("Enter room name");
    if (rooms.find(r => r.name === roomName)) return alert("Room already exists");
    
    const newRoom = {
      id: Date.now().toString(),
      name: roomName,
      type: roomType,
      capacity: capacity,
      assignedTo: "" // User can manually type assignment if needed
    };
    
    setRooms([...rooms, newRoom]);
    setRoomName("");
  };

  const removeRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-100 animate-fadeIn">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        🏫 Room Management
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Room Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Lab 101"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
          <select 
            className="w-full px-4 py-2 rounded-lg border"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          >
            <option value="Classroom">Classroom</option>
            <option value="Lab">Lab</option>
            <option value="Tutorial">Tutorial Room</option>
          </select>
          
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity</label>
          <input 
            type="number" 
            className="w-full px-4 py-2 rounded-lg border"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={addRoom}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            + Add Room
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
            <div>
              <span className="font-bold text-lg">{room.name}</span>
              <span className="ml-3 px-2 py-1 bg-gray-100 rounded text-xs uppercase font-bold text-gray-600">
                {room.type}
              </span>
              <p className="text-sm text-gray-500">Capacity: {room.capacity}</p>
            </div>
            <button 
              onClick={() => removeRoom(room.id)}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Remove
            </button>
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="text-center text-gray-400 py-10">No rooms added. Please add rooms above.</p>
        )}
      </div>

      <div className="flex justify-between mt-10 pt-6 border-t">
        <button onClick={onBack} className="px-6 py-2 border rounded-xl hover:bg-gray-50">Back</button>
        <button 
          onClick={onGenerate} 
          className="px-10 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
        >
          Generate Timetable
        </button>
      </div>
    </div>
  );
}