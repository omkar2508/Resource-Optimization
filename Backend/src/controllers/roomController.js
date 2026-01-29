// controllers/roomController.js - FIXED with better error handling
import roomModel from "../models/roomModel.js";

//FIXED: Add room with proper department isolation and better error messages
export const addRoom = async (req, res) => {
  try {
    const { name, type, capacity, labCategory, primaryYear } = req.body;

    // Validation
    if (!name || !type || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Room name, type, and capacity are required"
      });
    }

    if (type === "Lab" && !labCategory) {
      return res.status(400).json({
        success: false,
        message: "Lab category is required for lab rooms"
      });
    }

    // Get department from authenticated admin
    const department = req.adminDepartment;

    //FIXED: Check if room already exists in this department ONLY
    const exists = await roomModel.findOne({ 
      name: name.toUpperCase(), 
      department 
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Room ${name} already exists in your department (${department}). Please use a different room name.`
      });
    }

    // Create room
    const newRoom = new roomModel({
      name: name.toUpperCase(),
      type,
      capacity: parseInt(capacity),
      labCategory: type === "Lab" ? labCategory : "None",
      primaryYear: primaryYear || "Shared",
      department,
      createdBy: req.adminId
    });

    await newRoom.save();

    console.log(` Room created: ${name} for ${department}`);

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      room: newRoom
    });
  } catch (error) {
    //FIXED: Better error handling for duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This room name already exists in your department. Please use a different name."
      });
    }

    console.error(" Room creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add room"
    });
  }
};

//Get all rooms (filtered by department)
export const getRooms = async (req, res) => {
  try {
    const filter = {};

    // Regular admin sees only their department
    if (req.adminRole !== "superadmin") {
      filter.department = req.adminDepartment;
    }

    const rooms = await roomModel.find(filter).sort({ name: 1 });
    
    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms"
    });
  }
};

//Get rooms by year (department-aware)
export const getRoomsByYear = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = {};

    // Filter by department
    if (req.adminRole !== "superadmin") {
      filter.department = req.adminDepartment;
    }

    // If year specified, get rooms for that year OR shared rooms
    if (year) {
      filter.$or = [
        { primaryYear: year },
        { primaryYear: "Shared" }
      ];
    }

    const rooms = await roomModel.find(filter).sort({ name: 1 });
    
    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error("Get rooms by year error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms"
    });
  }
};

//Delete room (with department check)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and verify department access
    const room = await roomModel.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && room.department !== req.adminDepartment) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot delete rooms from other departments"
      });
    }

    await roomModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Room deleted successfully"
    });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete room"
    });
  }
};

//Update room (with department check)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, capacity, labCategory, primaryYear } = req.body;

    // Find room and verify department access
    const room = await roomModel.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // Verify department access
    if (req.adminRole !== "superadmin" && room.department !== req.adminDepartment) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot modify rooms from other departments"
      });
    }

    // Update fields
    if (name) room.name = name.toUpperCase();
    if (type) room.type = type;
    if (capacity) room.capacity = parseInt(capacity);
    if (labCategory !== undefined) room.labCategory = type === "Lab" ? labCategory : "None";
    if (primaryYear) room.primaryYear = primaryYear;

    await room.save();

    res.json({
      success: true,
      message: "Room updated successfully",
      room
    });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update room"
    });
  }
};