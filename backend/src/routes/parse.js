import { Router } from "express";
import { uploadSyllabusFiles } from "../middleware/upload.js";
import { parseSyllabi } from "../controllers/parseController.js";

const router = Router();

router.post("/", uploadSyllabusFiles, parseSyllabi);

export default router;
