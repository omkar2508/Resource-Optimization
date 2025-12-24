import express from "express";
import {

  getTeachers,
} from "../controllers/teacherController.js";
import {addTeacher} from  "../controllers/adminController.js";

const router = express.Router();

console.log("teacherRoutes.js loaded");   //change 24.12.2025

// router.post("/add", addTeacher);
// ADD TEACHER ROUTE CHECK
router.post("/add", (req, res, next) => {
  console.log("POST /api/teacher/add HIT");
  next();
}, addTeacher);


// router.get("/", getTeachers);
// GET TEACHERS ROUTE CHECK
router.get("/", (req, res, next) => {
  console.log(" GET /api/teacher HIT");
  next();
}, getTeachers);

export default router;
