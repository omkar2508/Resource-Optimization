import express from "express";
import {
  addTeacher,
  getTeachers,
} from "../controllers/teacherController.js";

const router = express.Router();

router.post("/add", addTeacher);
router.get("/", getTeachers);

export default router;
