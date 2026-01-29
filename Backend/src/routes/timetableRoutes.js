import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";
import { 
  saveTimetable, 
  getAllTimetables, 
  deleteTimetable, 
  getAllIndividualTimetables
} from "../controllers/timetableController.js";

const timetableRouter = express.Router();

// Combined auth: allows both admin AND user to view
const combinedAuth = (req, res, next) => {
  adminAuth(req, res, (err) => {
    if (!err) return next();
    userAuth(req, res, next);
  });
};

timetableRouter.post("/save", adminAuth, saveTimetable);
timetableRouter.get("/individual",  getAllIndividualTimetables); // New route for individual timetables
timetableRouter.get("/all", combinedAuth, getAllTimetables); // Changed
timetableRouter.delete("/delete/:id", adminAuth, deleteTimetable);

export default timetableRouter;