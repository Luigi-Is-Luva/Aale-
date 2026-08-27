export const EXTRACTION_PROMPT = `You are analyzing a college course syllabus (CUNY). Read the entire document carefully, including tables, and extract a complete, structured breakdown.

Rules:
- Capture every date-bound item (exams, quizzes, assignments, projects, holidays/no-class days) into keyDates, even if scattered across a weekly schedule table.
- If a date has no explicit year, infer it from the term (e.g. "Fall 2026" -> dates in Aug-Dec 2026).
- Translate the grading policy into a clean list of weighted components that sum to ~100% when possible. If weights aren't explicit, omit weightPercent rather than guessing.
- Summarize attendance, late-work, curve, and extra-credit rules into gradingPolicy.notes in plain, student-friendly language.
- List the main topics/units in the order they're taught; these will be used to generate study material later.
- Do not invent information that isn't in the document.`;

export function buildParsePrompt(semesterStart, today) {
  return `You are reading a full course load for one university student and building one comprehensive structured syllabus map.

Today is ${today}. The semester begins ${semesterStart}.

Read ALL attached syllabi together in ONE pass. Do not make separate passes for contacts, dates, policies, or schedules.

Extract only information present in the documents. If a field is missing, omit it. Never invent professor details, rooms,
links, grade scales, office hours, policies, dates, or weights.

Rules that matter:

1. Course information: extract course code, title, section, semester, year, department, credits, description, learning
   objectives, skills, and main topics when explicitly available.

2. Instructor/contact: extract instructor name, email, office, office hours, phone, department, and preferred contact
   method when listed. Put the best full name in instructor and the detailed object in instructorContact.

3. Course meetings: extract every lecture/lab/recitation/seminar meeting with days, startTime, endTime, location, and
   modality when available. Also preserve the original meeting text in meetingTimes. The planner depends on these.

4. Due dates are critical. Search the entire syllabus: tables, calendars, weekly schedules, assignment sections,
   grading sections, footnotes, timeline sections, exam schedules, and text like "due next class".
   - When a concrete date is present, normalize dueDate as YYYY-MM-DD and preserve originalDateText when useful.
   - If a date has no explicit year, infer only the year from the semester/term context.
   - If the syllabus says a vague date like "Week 6" and you cannot resolve it to a concrete date from the calendar,
     omit dueDate, set dateConfidence to "unknown", and put the original phrase in dateText.
   - If you resolve from a relative but concrete reference, set dateConfidence to "inferred".
   - Never hallucinate a precise date.

5. Assessment extraction is mandatory. Return every identifiable graded or explicitly scheduled academic item in the
   top-level assessments array. Do not leave assessments only inside weeklySchedule, gradingPolicy, or notes.
   Extract assignments, homework, quizzes, exams, midterms, finals, projects, papers,
   presentations, labs, discussion posts, reading deadlines, milestones, no-class dates, breaks, and review sessions
   when explicitly scheduled.

6. For every assessment, include title, type, courseCode, dateConfidence, estimatedHours, and any available dueDate,
   dueTime, originalDateText, dateText, weightPercent, points, description, or notes. If a concrete due date is not
   present, still return the item with dueDate omitted and preserve the vague wording in dateText/originalDateText.

7. Weights are shares of the FINAL COURSE GRADE. If a syllabus says "Exams: 40%, two midterms equally weighted", each
   midterm is 20, not 40. If individual items cannot be separated, omit weightPercent and capture the category in
   gradingPolicy instead.

8. Grading: extract categories, percentages, point systems, drop-lowest rules, minimum requirements, extra credit,
   grading notes, and letter grade scale only if present. Do not force gradingPolicy to sum to 100; reproduce the syllabus.

9. Policies: categorize concrete policies into Attendance, Late Work, Missing Work, Makeup Exams, Academic Integrity,
   AI / Generative AI, Collaboration, Participation, Extra Credit, Extensions, Accessibility, Communication, Technology,
   Classroom Conduct, Recording, Submission Requirements, or Other Important Policies. Summarize concise rules and keep
   exact numbers/deadlines. Do not dump giant raw syllabus paragraphs.

10. Materials/resources: extract required textbooks, software, websites/platforms, equipment, calculators, required
   accounts, course tools, and valid important links.

11. Weekly schedule: extract week number, date range, topics, readings, and assignments from weekly tables/calendars
    when present.

12. topics should be concepts, not week labels. "Red-black trees", not "Week 6 reading". For each topic, also write a
   one or two sentence, exam-useful definition in topicDefinitions, in the same order as topics.

13. estimatedHours is your realistic estimate of total prep time a student should budget for that single assessment,
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
