import { v4 as uuid } from "uuid";
import { extractSyllabusBreakdown, generateStudyPlan } from "../services/geminiService.js";
import { createSession, getSession, updateSession, deleteSession } from "../services/storageService.js";

// Step 1: Import syllabus -> Gemini reads it -> interactive breakdown.
export async function uploadSyllabus(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Attach it as form field 'syllabus'." });
    }

    const breakdown = await extractSyllabusBreakdown(req.file.buffer, req.file.mimetype);

    const sessionId = uuid();
    const session = {
      id: sessionId,
      status: "extracted", // extracted -> reviewed -> complete
      originalFileName: req.file.originalname,
      breakdown,
      focusTopics: [],
      studyPlan: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createSession(sessionId, session);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

// Fetch current state of a session at any point in the flow.
export async function getSyllabusSession(req, res, next) {
  try {
    const session = await getSession(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// Step 2 & 3: user reviews the breakdown, edits any wrong fields, and/or
// flags specific topics/dates that need extra study focus.
export async function reviewSyllabusSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { breakdown: breakdownEdits, focusTopics } = req.body;

    const existing = await getSession(sessionId);
    if (!existing) return res.status(404).json({ error: "Session not found." });

    const updated = await updateSession(sessionId, (current) => ({
      ...current,
      breakdown: breakdownEdits
        ? { ...current.breakdown, ...breakdownEdits }
        : current.breakdown,
      focusTopics: Array.isArray(focusTopics) ? focusTopics : current.focusTopics,
      status: "reviewed",
      updatedAt: new Date().toISOString(),
    }));

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Step 4: user confirms ("yes, generate my study guide") with their free
// time -> Gemini produces flashcards + a study schedule.
export async function generateSyllabusStudyPlan(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { freeTime, planStartDate, planEndDate } = req.body;

    if (!Array.isArray(freeTime) || freeTime.length === 0) {
      return res.status(400).json({ error: "freeTime must be a non-empty array of availability slots." });
    }
    if (!planStartDate || !planEndDate) {
      return res.status(400).json({ error: "planStartDate and planEndDate are required (ISO 8601 dates)." });
    }

    const session = await getSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found." });

    const studyPlan = await generateStudyPlan({
      breakdown: session.breakdown,
      freeTime,
      focusTopics: session.focusTopics,
      planStartDate,
      planEndDate,
    });

    const updated = await updateSession(sessionId, (current) => ({
      ...current,
      studyPlan,
      status: "complete",
      updatedAt: new Date().toISOString(),
    }));

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteSyllabusSession(req, res, next) {
  try {
    const deleted = await deleteSession(req.params.sessionId);
    if (!deleted) return res.status(404).json({ error: "Session not found." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
