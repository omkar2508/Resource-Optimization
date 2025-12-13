import express from "express";
import {
  saveYearConfig,
  getYearConfig,
} from "../controllers/yearController.js";

const router = express.Router();

router.post("/save", saveYearConfig);
router.get("/", getYearConfig);

export default router;
