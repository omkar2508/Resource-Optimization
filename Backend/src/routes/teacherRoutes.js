import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { 
  addTeacher, 
  updateTeacher, 
  deleteTeacher 
} from "../controllers/adminController.js";
import { getTeachers } from "../controllers/teacherController.js";

const router = express.Router();

router.get("/", adminAuth, getTeachers);
router.post("/add", adminAuth, addTeacher);
router.put("/update/:id", adminAuth, updateTeacher);
router.delete("/delete/:id", adminAuth, deleteTeacher);

export default router;