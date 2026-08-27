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

function retryDelayFromGemini(error) {
  const details = error?.errorDetails || error?.details || error?.cause?.errorDetails || [];
  const retryInfo = details.find((item) => item?.["@type"]?.includes("RetryInfo") || item?.retryDelay);
  return retryInfo?.retryDelay || error?.retryDelay || null;
}

function classifyError(error) {
  const message = String(error?.message || "");
  const status = error?.status || error?.code || error?.cause?.status;
  const isRateLimit = status === 429 || /429|RESOURCE_EXHAUSTED|quota|rate.?limit|Too Many Requests/i.test(message);

  if (isRateLimit) {
    return {
      status: 429,
      code: "GEMINI_RATE_LIMITED",
      title: "Service Delay",
      message: "Gemini has temporarily reached its request limit.",
      retryAfter: retryDelayFromGemini(error),
    };
  }

  if (status === 400 || error?.name === "MulterError" || /Unsupported file type|No files received/i.test(message)) {
    return {
      status: 400,
      code: "INVALID_DOCUMENT",
      title: "We couldn't read this syllabus.",
      message: "Try another PDF or make sure the file contains readable syllabus content.",
    };
  }

  return {
    status: 500,
    code: "SIGNAL_PROBLEM",
    title: "Signal Problem",
    message: "Something went wrong while analyzing your syllabus.",
  };
}

// Multer errors (bad file type, too large) and Gemini/parsing errors land here.
app.use((err, req, res, next) => {
  console.error(err);
  const safe = classifyError(err);
  res.status(safe.status).json(safe);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CUNY Course Canvas backend listening on http://localhost:${PORT}`);
});
