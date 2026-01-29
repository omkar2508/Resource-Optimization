import { addRoom, getRooms, getRoomsByYear, deleteRoom } from "../controllers/roomController.js";
import { adminAuth } from "../middleware/adminAuth.js";
import express from "express";

const roomRouter = express.Router();

//All routes protected with adminAuth
roomRouter.post("/add", adminAuth, addRoom);
roomRouter.get("/all", adminAuth, getRooms);
roomRouter.get("/by-year", adminAuth, getRoomsByYear);
roomRouter.delete("/delete/:id", adminAuth, deleteRoom);

export default roomRouter;