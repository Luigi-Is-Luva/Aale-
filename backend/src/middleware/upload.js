import multer from "multer";
import { DOCX_MIME_TYPE } from "../services/docxService.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
  "application/msword",
  DOCX_MIME_TYPE,
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}. Upload a PDF or image of your syllabus.`));
    }
    cb(null, true);
  },
});

export const uploadSyllabus = upload.single("syllabus");
export const uploadSyllabusFiles = upload.array("files", 6);
