import "dotenv/config";
import express from "express";
import cors from "cors";
import syllabusRouter from "./routes/syllabus.js";
import parseRouter from "./routes/parse.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/syllabus", syllabusRouter);
app.use("/api/parse", parseRouter);

// Multer errors (bad file type, too large) and Gemini/parsing errors land here.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  res.status(status).json({ error: err.message || "Internal server error." });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CUNY Course Canvas backend listening on http://localhost:${PORT}`);
});
