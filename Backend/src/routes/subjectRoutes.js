import express from "express";
import { 
  addSubject, 
  getSubjectsByFilter, 
  updateSubject,
  deleteSubject 
} from "../controllers/subjectController.js";

const router = express.Router();

router.post("/add", addSubject);
router.get("/filter", getSubjectsByFilter);
router.put("/update/:id", updateSubject);
router.delete("/delete/:id", deleteSubject);

export default router;