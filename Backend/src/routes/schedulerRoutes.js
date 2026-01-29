import { generateTimetable } from "../controllers/schedulerController.js";
import { adminAuth, blockSuperadminGeneration } from "../middleware/adminAuth.js";
import express from "express";

const schedulerRouter = express.Router();

// Add blockSuperadminGeneration to prevent superadmin from generating
schedulerRouter.post("/generate", adminAuth, blockSuperadminGeneration, generateTimetable);

export default schedulerRouter;