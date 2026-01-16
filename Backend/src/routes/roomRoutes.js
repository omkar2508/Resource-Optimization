// roomRoutes.js - UPDATED: Add year filtering route
import express from "express";
import { addRoom, getRooms, getRoomsByYear, deleteRoom } from "../controllers/roomController.js";

const router = express.Router();

router.post("/add", addRoom);
router.get("/all", getRooms);
router.get("/by-year", getRoomsByYear);  // ✅ NEW: Filter by year
router.delete("/delete/:id", deleteRoom);

export default router;