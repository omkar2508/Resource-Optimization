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
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏷️</span>
        <h4 className="text-xl font-bold text-gray-800">Allocate Rooms</h4>
        <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{rooms.length} Rooms</span>
      </div>

      <div className="bg-white p-6 rounded-lg border mb-6">
        <h5 className="font-semibold mb-3">Add Room</h5>
        <div className="flex gap-3 items-center">
          <input className="border p-2 rounded flex-1" placeholder="Room Name (e.g., R101)" value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} />
          <select className="border p-2 rounded" value={room.type} onChange={(e) => setRoom({ ...room, type: e.target.value })}>
            <option value="Classroom">Classroom</option>
            <option value="Lab">Lab</option>
          </select>
          <input type="number" className="border p-2 rounded w-28" min="1" value={room.capacity} onChange={(e) => setRoom({ ...room, capacity: Number(e.target.value) })} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={addRoom}>Add Room</button>
        </div>

        <div className="mt-4">
          <h6 className="font-medium">Existing Rooms</h6>
          <div className="mt-2 space-y-2">
            {rooms.length === 0 && <div className="text-sm text-gray-500">No rooms added yet</div>}
            {rooms.map((r) => (
              <div key={r.name} className="flex items-center gap-3 border p-2 rounded">
                <div className="flex-1">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-gray-600">{r.type} • Cap: {r.capacity}</div>
                </div>
                <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => removeRoom(r.name)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border mb-6">
        <h5 className="font-semibold mb-3">Subject Room Preferences</h5>
        <p className="text-sm text-gray-500 mb-3">Set preferred room for Lab/Tutorial subjects. Use <em>Auto</em> to let the solver pick any available matching room.</p>

        <div className="space-y-4">
          {Object.keys(yearData).map((yr) => (
            <div key={yr} className="mb-4">
              <div className="font-semibold mb-2">{yr}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(yearData[yr].subjects || []).map((s) => (
                  <div key={`${yr}_${s.code}`} className="border p-3 rounded flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{s.code} — {s.name} ({s.type})</div>
                      <div className="text-sm text-gray-600">{s.type !== 'Theory' ? `${s.batches || 1} batch${(s.batches||1)>1?'es':''}` : `${s.hours} hrs/week`}</div>
                    </div>

                    {s.type !== 'Theory' ? (
                      <select value={allocations[`${yr}_${s.code}`] || 'AUTO'} onChange={(e) => setAllocForSubject(yr, s.code, e.target.value)} className="border p-2 rounded">
                        <option value="AUTO">Auto</option>
                        {rooms.filter(r => r.type === (s.type === 'Lab' ? 'Lab' : 'Classroom')).map(r => (
                          <option key={r.name} value={r.name}>{r.name} ({r.type})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500">Theory subjects use standard classrooms (Auto)</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-gray-200 rounded">Back</button>
        <div className="flex gap-3">
          <button onClick={onGenerate} className="px-6 py-3 bg-green-600 text-white rounded">Generate Timetable</button>
        </div>
      </div>
    </div>
  );
}
