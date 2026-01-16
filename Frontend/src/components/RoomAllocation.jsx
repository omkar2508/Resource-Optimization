import React, { useState, useEffect } from "react";
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
  
  // State management
  const [dbRooms, setDbRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [assignmentType, setAssignmentType] = useState("division");
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [filterType, setFilterType] = useState("all");

  // ✅ FIX: Fetch rooms filtered by selected years
  useEffect(() => {
    const fetchDbRooms = async () => {
      try {
        const { data } = await axios.get("/api/rooms/all");
        if (data.success) {
          // Get all selected years from yearData
          const selectedYears = Object.keys(yearData);
          
          console.log("Selected years:", selectedYears);
          console.log("All rooms from DB:", data.rooms);
          
          // ✅ FIX: Filter rooms based on selected years
          const availableRooms = data.rooms.filter(room => {
            // Include if room is Shared
            if (room.primaryYear === "Shared") {
              console.log(`✅ Including shared room: ${room.name}`);
              return true;
            }
            // Include if room's primaryYear matches any selected year
            const yearMatch = selectedYears.includes(room.primaryYear);
            if (yearMatch) {
              console.log(`✅ Including year-specific room: ${room.name} (${room.primaryYear})`);
            } else {
              console.log(`❌ Excluding room: ${room.name} (${room.primaryYear}) - not in selected years`);
            }
            return yearMatch;
          });
          
          console.log(`Filtered rooms: ${availableRooms.length}/${data.rooms.length}`);
          setDbRooms(availableRooms);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        toast.error("Failed to load rooms from database");
      }
    };
    fetchDbRooms();
  }, [axios, yearData]);

  // When room is selected from dropdown
  useEffect(() => {
    if (selectedRoomId) {
      const room = dbRooms.find((r) => r._id === selectedRoomId);
      setSelectedRoom(room);
      setSelectedAssignments([]);
      
      // Auto-determine assignment type based on room type
      if (room?.type === "Classroom") {
        setAssignmentType("division");
      } else {
        setAssignmentType("subject");
      }
    } else {
      setSelectedRoom(null);
      setSelectedAssignments([]);
    }
  }, [selectedRoomId, dbRooms]);

  // Get all divisions across all years
  const getAllDivisions = () => {
    const divisions = [];
    Object.keys(yearData).forEach(year => {
      const divCount = yearData[year].divisions || 1;
      for (let i = 1; i <= divCount; i++) {
        divisions.push({ 
          year, 
          division: i, 
          label: `${year} - Division ${i}` 
        });
      }
    });
    return divisions;
  };

  // Get all subjects that match room type
  const getRelevantSubjects = () => {
    const subjects = [];
    
    if (!selectedRoom) return subjects;

    Object.keys(yearData).forEach(year => {
      const yearSubjects = yearData[year].subjects || [];
      
      yearSubjects.forEach(subject => {
        const shouldInclude = 
          (selectedRoom.type === "Lab" && subject.type === "Lab") ||
          (selectedRoom.type === "Tutorial" && subject.type === "Tutorial") ||
          (selectedRoom.type === "Classroom" && subject.type === "Theory");
        
        if (shouldInclude) {
          if (selectedRoom.type === "Lab" || selectedRoom.type === "Tutorial") {
            subjects.push({
              year,
              code: subject.code,
              name: subject.name,
              type: subject.type,
              totalBatches: subject.batches || 1,
              labDuration: subject.labDuration || 1,
              label: `${year} - ${subject.code} (${subject.name}) - ${subject.batches || 1} batch${subject.batches > 1 ? 'es' : ''}`
            });
          } else {
            subjects.push({
              year,
              code: subject.code,
              name: subject.name,
              type: subject.type,
              batch: null,
              labDuration: subject.labDuration || 1,
              label: `${year} - ${subject.code} (${subject.name})`
            });
          }
        }
      });
    });
    
    return subjects;
  };

  // Toggle assignment selection
  const toggleAssignment = (item) => {
    setSelectedAssignments(prev => {
      const itemKey = assignmentType === "division" 
        ? `${item.year}_Div${item.division}`
        : `${item.year}_${item.code}`;
      
      const exists = prev.find(a => {
        const aKey = assignmentType === "division"
          ? `${a.year}_Div${a.division}`
          : `${a.year}_${a.code}`;
        return aKey === itemKey;
      });

      if (exists) {
        return prev.filter(a => {
          const aKey = assignmentType === "division"
            ? `${a.year}_Div${a.division}`
            : `${a.year}_${a.code}`;
          return aKey !== itemKey;
        });
      } else {
        return [...prev, item];
      }
    });
  };

  // Select ALL subjects
  const selectAllSubjects = () => {
    if (assignmentType === "subject") {
      setSelectedAssignments([...subjects]);
      toast.success(`Selected all ${subjects.length} subjects`);
    } else {
      setSelectedAssignments([...divisions]);
      toast.success(`Selected all ${divisions.length} divisions`);
    }
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedAssignments([]);
    toast.info("Cleared all selections");
  };

  // Add room with assignments
  const addRoomWithAssignments = () => {
    if (!selectedRoom) {
      return toast.error("Please select a room");
    }

    if (selectedAssignments.length === 0) {
      return toast.error("Please select at least one assignment");
    }

    const existingRoom = rooms.find(r => r._id === selectedRoom._id);
    if (existingRoom) {
      return toast.error(`${selectedRoom.name} is already assigned`);
    }

    const newRoom = {
      ...selectedRoom,
      id: selectedRoom._id,
      assignments: selectedAssignments,
      assignmentType
    };

    setRooms([...rooms, newRoom]);
    toast.success(`${selectedRoom.name} added with ${selectedAssignments.length} assignment(s)`);
    
    // Reset
    setSelectedRoomId("");
    setSelectedRoom(null);
    setSelectedAssignments([]);
  };

  // Remove room assignment
  const removeRoom = (id) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-medium mb-2">Remove this room assignment?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeToast}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setRooms(rooms.filter((r) => r.id !== id));
                toast.success("Room removed");
                closeToast();
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ),
      { position: "top-center", autoClose: false, closeOnClick: false }
    );
  };

  // Get filtered rooms for dropdown
  const getFilteredRooms = () => {
    let filtered = dbRooms.filter(r => !rooms.find(assigned => assigned._id === r._id));
    
    if (filterType !== "all") {
      filtered = filtered.filter(r => r.type === filterType);
    }
    
    return filtered;
  };

  const divisions = getAllDivisions();
  const subjects = getRelevantSubjects();
  const filteredRooms = getFilteredRooms();

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <span>Room Assignment</span>
      </h2>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <div>
            <p className="font-semibold text-blue-900 mb-1">How Room Assignment Works:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Select a room from the dropdown below</li>
              <li>2. Choose what uses it: Divisions (for classrooms) or Subjects/Batches (for labs/tutorials)</li>
              <li>3. Click "Add Assignment" to confirm</li>
              <li>4. Repeat for all rooms, then generate timetable</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Room Selection Section */}
      <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>Step 1: Select Room</span>
        </h3>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {["all", "Classroom", "Lab", "Tutorial"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                filterType === type
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {type === "all" ? "All Rooms" : 
               type === "Classroom" ? "Classrooms" :
               type === "Lab" ? "Labs" : "Tutorials"}
              {type !== "all" && ` (${dbRooms.filter(r => r.type === type && !rooms.find(a => a._id === r._id)).length})`}
            </button>
          ))}
        </div>
        
        <select
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="w-full h-12 px-4 text-base rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Select a Room to Assign --</option>
          {filteredRooms.length === 0 ? (
            <option disabled>No {filterType === "all" ? "" : filterType} rooms available</option>
          ) : (
            filteredRooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} ({r.type}) - Cap: {r.capacity}
                {r.labCategory && ` - ${r.labCategory}`}
                {r.primaryYear !== "Shared" && ` - ${r.primaryYear}`}
              </option>
            ))
          )}
        </select>

        {/* Selected Room Details */}
        {selectedRoom && (
          <div className="mt-6 bg-white rounded-xl p-6 border-2 border-blue-300 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h4 className="text-2xl font-bold text-gray-800">{selectedRoom.name}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase">
                    {selectedRoom.type}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 rounded-full text-xs font-bold text-blue-700">
                    Capacity: {selectedRoom.capacity}
                  </span>
                  {selectedRoom.labCategory && (
                    <span className="px-3 py-1 bg-purple-100 rounded-full text-xs font-bold text-purple-700">
                      {selectedRoom.labCategory}
                    </span>
                  )}
                  {selectedRoom.primaryYear !== "Shared" && (
                    <span className="px-3 py-1 bg-green-100 rounded-full text-xs font-bold text-green-700">
                      {selectedRoom.primaryYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Assignment Type */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>Step 2: What Uses This Room?</span>
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentType("division")}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    assignmentType === "division"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Assign to Divisions
                  <p className="text-xs mt-1 opacity-80">Whole classes use this room</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentType("subject")}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    assignmentType === "subject"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Assign to Subjects
                  <p className="text-xs mt-1 opacity-80">Specific labs/tutorials use this</p>
                </button>
              </div>
            </div>

            {/* Step 3: Select Assignments */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>Step 3: Select {assignmentType === "division" ? "Divisions" : "Subjects"}</span>
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllSubjects}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                  >
                    Select All
                  </button>
                  {selectedAssignments.length > 0 && (
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg text-xs font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 space-y-2">
                {assignmentType === "division" ? (
                  divisions.length > 0 ? (
                    divisions.map((div, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssignments.some(
                            a => a.year === div.year && a.division === div.division
                          )}
                          onChange={() => toggleAssignment(div)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-800">{div.label}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No divisions available</p>
                  )
                ) : (
                  subjects.length > 0 ? (
                    subjects.map((subj, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssignments.some(
                            a => a.code === subj.code && a.year === subj.year
                          )}
                          onChange={() => toggleAssignment(subj)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{subj.label}</span>
                          {subj.labDuration > 1 && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                              {subj.labDuration}h continuous
                            </span>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No {selectedRoom.type === "Lab" ? "lab" : selectedRoom.type === "Tutorial" ? "tutorial" : "theory"} subjects available
                    </p>
                  )
                )}
              </div>
            </div>

            <button
              onClick={addRoomWithAssignments}
              disabled={selectedAssignments.length === 0}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Add Assignment ({selectedAssignments.length} selected)
            </button>
          </div>
        )}
      </div>

      {/* Assigned Rooms List */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>Assigned Rooms ({rooms.length})</span>
        </h3>

        {rooms.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-500 font-medium">No rooms assigned yet</p>
            <p className="text-gray-400 text-sm mt-1">Select a room above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border-2 rounded-xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-800">{room.name}</h4>
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase">
                        {room.type}
                      </span>
                    </div>
                    
                    <div className="ml-0">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Assigned to:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {room.assignments && room.assignments.map((assign, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold"
                          >
                            {assign.label || `${assign.year} - ${assign.code || `Div ${assign.division}`}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors border border-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
        >
          Back
        </button>
        <button
          onClick={onGenerate}
          disabled={rooms.length === 0}
          className="px-10 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Generate Timetable ({rooms.length} room assignments)
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}