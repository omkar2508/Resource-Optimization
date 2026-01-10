import React, { useState } from "react";

export default function AllocatePanel({ yearData, rooms, setRooms, allocations, setAllocations, onBack, onGenerate }) {
  const [room, setRoom] = useState({ name: "", type: "Classroom", capacity: 30 });

  function addRoom() {
    if (!room.name.trim()) return alert("Room name required");
    if (rooms.some((r) => r.name === room.name.trim())) return alert("Room with this name already exists");
    setRooms([...rooms, { ...room, name: room.name.trim() }]);
    setRoom({ name: "", type: "Classroom", capacity: 30 });
  }

  function removeRoom(name) {
    setRooms(rooms.filter((r) => r.name !== name));
    // remove from allocations
    const copy = { ...allocations };
    Object.keys(copy).forEach((k) => {
      if (copy[k] === name) delete copy[k];
    });
    setAllocations(copy);
  }

  function setAllocForSubject(year, code, value) {
    const key = `${year}_${code}`;
    setAllocations({ ...allocations, [key]: value });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl sm:text-2xl">🏷️</span>
          <h4 className="text-lg sm:text-xl font-bold text-gray-800">Allocate Rooms</h4>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">{rooms.length} Rooms</span>
      </div>

      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border mb-4 sm:mb-6 shadow-sm">
        <h5 className="text-sm sm:text-base font-semibold mb-3">Add Room</h5>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end">
          <input 
            className="border p-2 sm:p-2.5 rounded-lg text-sm sm:text-base flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Room Name (e.g., R101)" 
            value={room.name} 
            onChange={(e) => setRoom({ ...room, name: e.target.value })} 
          />
          <select 
            className="border p-2 sm:p-2.5 rounded-lg text-sm sm:text-base w-full sm:w-auto min-w-[140px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={room.type} 
            onChange={(e) => setRoom({ ...room, type: e.target.value })}
          >
            <option value="Classroom">Classroom</option>
            <option value="Lab">Lab</option>
          </select>
          <input 
            type="number" 
            className="border p-2 sm:p-2.5 rounded-lg text-sm sm:text-base w-full sm:w-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            min="1" 
            placeholder="Capacity"
            value={room.capacity} 
            onChange={(e) => setRoom({ ...room, capacity: Number(e.target.value) })} 
          />
          <button 
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base whitespace-nowrap" 
            onClick={addRoom}
          >
            Add Room
          </button>
        </div>

        <div className="mt-4 sm:mt-5">
          <h6 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">Existing Rooms</h6>
          <div className="mt-2 space-y-2">
            {rooms.length === 0 && (
              <div className="text-xs sm:text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                No rooms added yet
              </div>
            )}
            {rooms.map((r) => (
              <div key={r.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 border p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base">{r.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{r.type} • Cap: {r.capacity}</div>
                </div>
                <button 
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap" 
                  onClick={() => removeRoom(r.name)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border mb-4 sm:mb-6 shadow-sm">
        <h5 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Subject Room Preferences</h5>
        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Set preferred room for Lab/Tutorial subjects. Use <em>Auto</em> to let the solver pick any available matching room.</p>

        <div className="space-y-3 sm:space-y-4">
          {Object.keys(yearData).map((yr) => (
            <div key={yr} className="mb-3 sm:mb-4">
              <div className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">{yr}</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                {(yearData[yr].subjects || []).map((s) => (
                  <div key={`${yr}_${s.code}`} className="border p-2.5 sm:p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="font-medium text-xs sm:text-sm md:text-base truncate">{s.code} — {s.name} ({s.type})</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-0.5">{s.type !== 'Theory' ? `${s.batches || 1} batch${(s.batches||1)>1?'es':''}` : `${s.hours} hrs/week`}</div>
                    </div>

                    {s.type !== 'Theory' ? (
                      <select 
                        value={allocations[`${yr}_${s.code}`] || 'AUTO'} 
                        onChange={(e) => setAllocForSubject(yr, s.code, e.target.value)} 
                        className="w-full sm:w-auto min-w-[140px] border p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="AUTO">Auto</option>
                        {rooms.filter(r => r.type === (s.type === 'Lab' ? 'Lab' : 'Classroom')).map(r => (
                          <option key={r.name} value={r.name}>{r.name} ({r.type})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-500 italic w-full sm:w-auto">Theory subjects use standard classrooms (Auto)</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
        <button 
          onClick={onBack} 
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base font-semibold"
        >
          Back
        </button>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={onGenerate} 
            className="flex-1 sm:flex-initial px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base whitespace-nowrap"
          >
            Generate Timetable
          </button>
        </div>
      </div>
    </div>
  );
}
