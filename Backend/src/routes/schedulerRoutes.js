import { Router } from "express";
import { generateTimetable } from "../controllers/schedulerController.js";

const router = Router();

router.post("/generate", generateTimetable);

export default router;
