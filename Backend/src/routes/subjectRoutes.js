import express from "express";
import { 
  addSubject, 
  getSubjectsByFilter, 
  getAllSubjects,
  updateSubject,
  deleteSubject 
} from "../controllers/subjectController.js";

const router = express.Router();

router.post("/add", addSubject);
router.get("/filter", getSubjectsByFilter);
router.get("/all", getAllSubjects);
router.put("/update/:id", updateSubject);
router.delete("/delete/:id", deleteSubject);

export default router;