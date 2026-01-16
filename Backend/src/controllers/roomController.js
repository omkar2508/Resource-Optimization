// roomController.js - UPDATED: Remove assignedSubjects from addRoom
import roomModel from "../models/roomModel.js";

export const addRoom = async (req, res) => {
    try {
        console.log("🔥 Received request body:", req.body);
        
        const { 
            name, 
            type, 
            capacity,
            labCategory,
            primaryYear,
            primaryDivision
        } = req.body;

        // Basic validation
        if (!name || !type || !capacity) {
            console.log("❌ Validation failed: Missing required fields");
            return res.status(400).json({ 
                success: false, 
                message: "Name, type, and capacity are required" 
            });
        }

        // Check for existing room
        const existingRoom = await roomModel.findOne({ name });
        if (existingRoom) {
            console.log("❌ Room already exists:", name);
            return res.status(400).json({ 
                success: false, 
                message: "Room name already exists" 
            });
        }

        // ✅ Prepare room data WITHOUT assignedSubjects
        const roomData = {
            name: String(name).trim(),
            type,
            capacity: Number(capacity),
            labCategory: labCategory || "None",
            primaryYear: primaryYear || "All",
            primaryDivision: (!primaryDivision || primaryDivision === "" || primaryDivision === "null") 
                ? null 
                : Number(primaryDivision)
        };

        console.log("✅ Prepared room data:", roomData);

        const newRoom = new roomModel(roomData);
        
        console.log("💾 Attempting to save room...");
        const savedRoom = await newRoom.save();
        
        console.log("✅ Room saved successfully:", savedRoom._id);

        res.status(201).json({ 
            success: true, 
            message: "Room added successfully", 
            room: savedRoom 
        });
    } catch (error) {
        console.error("❌ ADD_ROOM_BACKEND_ERROR:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        res.status(500).json({ 
            success: false, 
            message: "Server Error: " + error.message,
            errorDetails: {
                name: error.name,
                message: error.message,
                code: error.code
            }
        });
    }
};

// Get all rooms
export const getRooms = async (req, res) => {
    try {
        const rooms = await roomModel.find({}).sort({ name: 1 });
        console.log(`📚 Retrieved ${rooms.length} rooms`);
        res.json({ success: true, rooms });
    } catch (error) {
        console.error("❌ GET_ROOMS_ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ NEW: Get rooms filtered by year
export const getRoomsByYear = async (req, res) => {
    try {
        const { year } = req.query;
        
        if (!year) {
            return res.status(400).json({ 
                success: false, 
                message: "Year parameter is required" 
            });
        }

        // Get rooms where primaryYear matches OR primaryYear === "All"
        const rooms = await roomModel.find({
            $or: [
                { primaryYear: year },
                { primaryYear: "All" }
            ]
        }).sort({ type: 1, name: 1 });

        console.log(`📚 Retrieved ${rooms.length} rooms for ${year}`);
        
        // Separate by type
        const classrooms = rooms.filter(r => r.type === "Classroom");
        const labs = rooms.filter(r => r.type === "Lab");
        const tutorials = rooms.filter(r => r.type === "Tutorial");

        res.json({ 
            success: true, 
            rooms: {
                all: rooms,
                classrooms,
                labs,
                tutorials
            }
        });
    } catch (error) {
        console.error("❌ GET_ROOMS_BY_YEAR_ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a room
export const deleteRoom = async (req, res) => {
    try {
        const deletedRoom = await roomModel.findByIdAndDelete(req.params.id);
        if (!deletedRoom) {
            return res.status(404).json({ 
                success: false, 
                message: "Room not found" 
            });
        }
        console.log(`🗑️ Deleted room: ${deletedRoom.name}`);
        res.json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
        console.error("❌ DELETE_ROOM_ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};