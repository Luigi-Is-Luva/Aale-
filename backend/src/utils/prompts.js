export const EXTRACTION_PROMPT = `You are analyzing a college course syllabus (CUNY). Read the entire document carefully, including tables, and extract a complete, structured breakdown.

Rules:
- Capture every date-bound item (exams, quizzes, assignments, projects, holidays/no-class days) into keyDates, even if scattered across a weekly schedule table.
- If a date has no explicit year, infer it from the term (e.g. "Fall 2026" -> dates in Aug-Dec 2026).
- Translate the grading policy into a clean list of weighted components that sum to ~100% when possible. If weights aren't explicit, omit weightPercent rather than guessing.
- Summarize attendance, late-work, curve, and extra-credit rules into gradingPolicy.notes in plain, student-friendly language.
- List the main topics/units in the order they're taught; these will be used to generate study material later.
- Do not invent information that isn't in the document.`;

export function buildParsePrompt(semesterStart, today) {
  return `You are reading a full course load for one university student.

Today is ${today}. The semester begins ${semesterStart}.

Read ALL of the attached syllabi together, not one at a time. Extract every graded thing across every course.

Rules that matter:

1. Resolve relative dates. Syllabi say "Week 7" or "the Tuesday after spring break" constantly. Convert those to real
   calendar dates counting from the semester start, and mark dateConfidence as "inferred" when you do. If a date is
   genuinely absent or says TBA, omit dueDate and set dateConfidence to "unknown". Never invent a date to fill the field.

2. Weights are shares of the FINAL COURSE GRADE. If a syllabus says "Exams: 40%, two midterms equally weighted", each
   midterm is 20, not 40. If individual items cannot be separated, omit weightPercent and capture the category in
   gradingPolicy instead.

3. gradingPolicy must sum to 100 per course. If the syllabus does not sum to 100, reproduce what it actually says
   rather than correcting it.

4. Rewrite latePolicy and attendancePolicy in plain language a stressed student can act on at 11:40pm. Keep the
   actual numbers. Do not soften a harsh policy.

5. topics should be concepts, not week labels. "Red-black trees", not "Week 6 reading". For each topic, also write a
   one or two sentence, exam-useful definition in topicDefinitions, in the same order as topics.

6. estimatedHours is your realistic estimate of total prep time a student should budget for that single assessment,
   given its type and weight (a 5% homework might be 2-4 hours; a 25% final exam might be 12-16 hours).

Extract nothing that is not in the documents.`;
}

export function buildStudyPlanPrompt({ breakdown, freeTime, focusTopics, planStartDate, planEndDate }) {
  return `You are building a personalized study plan for a student, based on their course breakdown and their available free time.

Course breakdown (JSON):
${JSON.stringify(breakdown, null, 2)}

Student's free time slots (JSON, either recurring weekly slots with "day" or one-off slots with "date"):
${JSON.stringify(freeTime, null, 2)}

${focusTopics?.length ? `The student specifically flagged these topics/sections as needing extra attention during review: ${JSON.stringify(focusTopics)}. Prioritize them.` : ""}

Plan window: ${planStartDate} to ${planEndDate}.

Rules:
- Only schedule study sessions inside the given free time slots (match by day-of-week for recurring slots, or exact date for one-off slots). Never invent free time.
- Sessions should be 25-90 minutes long. Don't overload a single slot; leave breathing room.
- Weight scheduling toward topics/exams with closer deadlines from keyDates.
- Generate 8-20 flashcards covering the most important/testable content across the flagged topics (or all topics if none were flagged), skewed toward topics near upcoming deadlines.
- Vary flashcard difficulty.
- Every studySchedule entry must fall within the plan window.`;
}
