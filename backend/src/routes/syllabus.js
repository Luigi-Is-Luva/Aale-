import { Router } from "express";
import { uploadSyllabus } from "../middleware/upload.js";
import {
  uploadSyllabus as uploadSyllabusController,
  getSyllabusSession,
  reviewSyllabusSession,
  generateSyllabusStudyPlan,
  deleteSyllabusSession,
} from "../controllers/syllabusController.js";

const router = Router();

// Step 1: Import syllabus -> AI breakdown
router.post("/upload", uploadSyllabus, uploadSyllabusController);

// Fetch current session state (breakdown, review edits, study plan)
router.get("/:sessionId", getSyllabusSession);

// Step 2/3: Review + edit breakdown, flag topics for extra focus
router.patch("/:sessionId/review", reviewSyllabusSession);

// Step 4: Confirm -> generate flashcards + study schedule from free time
router.post("/:sessionId/study-plan", generateSyllabusStudyPlan);

router.delete("/:sessionId", deleteSyllabusSession);

export default router;
