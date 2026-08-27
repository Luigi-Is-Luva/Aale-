import { ai, MODEL } from "../config/gemini.js";
import { syllabusBreakdownSchema, studyPlanSchema, semesterSchema } from "../utils/schemas.js";
import { EXTRACTION_PROMPT, buildStudyPlanPrompt, buildParsePrompt } from "../utils/prompts.js";
import { convertDocxToPdf, DOCX_MIME_TYPE } from "./docxService.js";

async function toContentPart(file) {
  if (file.mimetype === "text/plain") {
    return { text: file.buffer.toString("utf-8") };
  }
  if (file.mimetype === DOCX_MIME_TYPE) {
    const pdfBuffer = await convertDocxToPdf(file.buffer);
    return { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } };
  }
  return { inlineData: { mimeType: file.mimetype, data: file.buffer.toString("base64") } };
}

function parseJsonResponse(response) {
  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text);
}

export async function extractSyllabusBreakdown(fileBuffer, mimeType) {
  const contentPart = await toContentPart({ buffer: fileBuffer, mimetype: mimeType });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [contentPart, { text: EXTRACTION_PROMPT }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: syllabusBreakdownSchema,
    },
  });

  return parseJsonResponse(response);
}

export async function parseSemester(files, semesterStart) {
  const today = new Date().toISOString().slice(0, 10);
  const parts = await Promise.all(files.map(toContentPart));

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [...parts, { text: buildParsePrompt(semesterStart, today) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: semesterSchema,
      temperature: 0.1,
    },
  });

  return parseJsonResponse(response);
}

export async function generateStudyPlan({ breakdown, freeTime, focusTopics, planStartDate, planEndDate }) {
  const prompt = buildStudyPlanPrompt({ breakdown, freeTime, focusTopics, planStartDate, planEndDate });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: studyPlanSchema,
    },
  });

  return parseJsonResponse(response);
}
