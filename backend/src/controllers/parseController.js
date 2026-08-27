import { parseSemester } from "../services/geminiService.js";

// Ported from mta/parse-route.ts: structured output guarantees the SHAPE,
// never the TRUTH. Surface what the model is unsure about instead of
// showing a confident wrong number.
function validate(semester) {
  const warnings = [];

  semester.courses.forEach((c) => {
    const sum = (c.gradingPolicy || []).reduce((s, g) => s + (g.weightPercent || 0), 0);
    if (Math.abs(sum - 100) > 1) {
      warnings.push(`${c.code}: grading policy sums to ${sum}%, not 100%. Check the syllabus.`);
    }
  });

  const unknown = semester.assessments.filter((a) => a.dateConfidence === "unknown");
  if (unknown.length) {
    warnings.push(`${unknown.length} item(s) have no date in the syllabus. Confirm them with your professor.`);
  }

  const inferred = semester.assessments.filter((a) => a.dateConfidence === "inferred");
  if (inferred.length) {
    warnings.push(`${inferred.length} date(s) were worked out from week numbers rather than printed dates.`);
  }

  const orphans = semester.assessments.filter((a) => !semester.courses.some((c) => c.code === a.courseCode));
  if (orphans.length) {
    warnings.push(`${orphans.length} assessment(s) reference a course we did not extract.`);
  }

  return warnings;
}

export async function parseSyllabi(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files received. Attach one or more as form field 'files'." });
    }

    const semesterStart = req.body.semesterStart || "2026-08-24";
    const semester = await parseSemester(req.files, semesterStart);

    res.json({ ...semester, warnings: validate(semester) });
  } catch (err) {
    next(err);
  }
}
