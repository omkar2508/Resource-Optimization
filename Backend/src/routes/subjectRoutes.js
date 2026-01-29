import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { 
  addSubject, 
  getSubjectsByFilter, 
  getAllSubjects,
  updateSubject,
  deleteSubject 
} from "../controllers/subjectController.js";

const router = express.Router();

//All routes now require admin authentication
router.post("/add", adminAuth, addSubject);
router.get("/filter", adminAuth, getSubjectsByFilter);
router.get("/all", adminAuth, getAllSubjects);
router.put("/update/:id", adminAuth, updateSubject);
router.delete("/delete/:id", adminAuth, deleteSubject);

export default router;