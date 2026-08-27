/* ============================================================================
   app/api/parse/route.ts  —  the one server file that matters
   ----------------------------------------------------------------------------
   Owned by Role A. This is the only place a Gemini key is ever used, and the
   only place a syllabus PDF is ever read. Everything downstream consumes the
   `Semester` object this returns.

   npm i @google/genai zod
   .env.local:  GEMINI_API_KEY=...
   ========================================================================== */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/* --- 1. THE CONTRACT --------------------------------------------------------
   Write this first, before anyone builds a feature. It is what lets four
   people work in parallel on day one. Do not change it without telling the
   whole team, because three other files import these types.               */

export const AssessmentSchema = z.object({
  id: z.string().describe("stable slug, e.g. csci33500-midterm-1"),
  courseCode: z.string().describe("normalised course code, e.g. 'CSCI 33500'"),
  title: z.string().describe("what the student would call it, e.g. 'Midterm 1'"),
  type: z.enum(["exam", "quiz", "project", "paper", "homework", "presentation", "other"]),
  dueDate: z.string().nullable().describe("ISO YYYY-MM-DD, or null if the syllabus never gives one"),
  dateConfidence: z.enum(["explicit", "inferred", "unknown"])
    .describe("explicit = a real calendar date is printed; inferred = resolved from 'week 7' or similar; unknown = TBA"),
  weightPercent: z.number().nullable().describe("share of the FINAL COURSE GRADE, not of its category"),
  notes: z.string().nullable().describe("short practical detail: open book, group work, page count"),
});

export const CourseSchema = z.object({
  code: z.string(),
  title: z.string(),
  instructor: z.string().nullable(),
  meetingTimes: z.string().nullable().describe("as written, e.g. 'MW 10:00-11:50am'"),
  room: z.string().nullable(),
  gradingPolicy: z.array(z.object({
    category: z.string(),
    weightPercent: z.number(),
    dropsLowest: z.boolean(),
  })).describe("must sum to 100 across the array"),
  latePolicy: z.string().nullable().describe("rewritten in plain language, one or two sentences"),
  attendancePolicy: z.string().nullable().describe("rewritten in plain language, one or two sentences"),
  topics: z.array(z.string()).describe("6-12 concepts from the course schedule, for flashcard generation"),
});

export const SemesterSchema = z.object({
  courses: z.array(CourseSchema),
  assessments: z.array(AssessmentSchema),
});

export type Semester = z.infer<typeof SemesterSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;

/* --- 2. THE PROMPT ----------------------------------------------------------
   Deliberately does NOT restate the schema. Google's own guidance says
   duplicating the schema in the prompt lowers output quality — the schema
   descriptions above already carry that information.                     */

function buildPrompt(semesterStart: string, today: string) {
  return `You are reading a full course load for one university student.

Today is ${today}. The semester begins ${semesterStart}.

Read ALL of the attached syllabi together, not one at a time. Extract every
graded thing across every course.

Rules that matter:

1. Resolve relative dates. Syllabi say "Week 7" or "the Tuesday after spring
   break" constantly. Convert those to real calendar dates counting from the
   semester start, and mark dateConfidence as "inferred" when you do.
   If a date is genuinely absent or says TBA, set dueDate to null and
   dateConfidence to "unknown". Never invent a date to fill the field.

2. Weights are shares of the FINAL COURSE GRADE. If a syllabus says
   "Exams: 40%, two midterms equally weighted", each midterm is 20, not 40.
   If individual items cannot be separated, leave weightPercent null and
   capture the category in gradingPolicy instead.

3. gradingPolicy must sum to 100 per course. If the syllabus does not sum to
   100, reproduce what it actually says rather than correcting it.

4. Rewrite latePolicy and attendancePolicy in plain language a stressed
   student can act on at 11:40pm. Keep the actual numbers. Do not soften a
   harsh policy.

5. topics should be concepts, not week labels. "Red-black trees", not
   "Week 6 reading".

Extract nothing that is not in the documents.`;
}

/* --- 3. THE ROUTE --------------------------------------------------------- */

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Confirm the current model string in AI Studio before the event — these
// names change. A Flash-tier model is right here: fast, cheap, long context.
const MODEL = "gemini-3.7-flash";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll("files") as File[];
    const semesterStart = (form.get("semesterStart") as string) || "2026-08-24";

    if (!files.length) {
      return Response.json({ error: "No files received." }, { status: 400 });
    }

    // Inline base64 is fine up to roughly 20MB total. Above that, switch to
    // the Files API — but for five syllabi you will never get close.
    const parts = await Promise.all(
      files.map(async (f) => ({
        inlineData: {
          mimeType: f.type || "application/pdf",
          data: Buffer.from(await f.arrayBuffer()).toString("base64"),
        },
      }))
    );

    const today = new Date().toISOString().slice(0, 10);

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [...parts, { text: buildPrompt(semesterStart, today) }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: z.toJSONSchema(SemesterSchema),
        temperature: 0.1,
      },
    });

    const parsed = SemesterSchema.safeParse(JSON.parse(res.text ?? "{}"));
    if (!parsed.success) {
      return Response.json(
        { error: "Gemini returned data we could not read.", issues: parsed.error.issues.slice(0, 5) },
        { status: 502 }
      );
    }

    return Response.json({ ...parsed.data, warnings: validate(parsed.data) });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Parsing failed. Try uploading fewer files at once." }, { status: 500 });
  }
}

/* --- 4. VALIDATION ----------------------------------------------------------
   Structured output guarantees the SHAPE, never the TRUTH. This is the part
   judges notice: the app admits what it is unsure about instead of showing
   a confident wrong number.                                              */

function validate(sem: Semester): string[] {
  const warnings: string[] = [];

  sem.courses.forEach((c) => {
    const sum = c.gradingPolicy.reduce((s, g) => s + g.weightPercent, 0);
    if (Math.abs(sum - 100) > 1) {
      warnings.push(`${c.code}: grading policy sums to ${sum}%, not 100%. Check the syllabus.`);
    }
  });

  const unknown = sem.assessments.filter((a) => a.dateConfidence === "unknown");
  if (unknown.length) {
    warnings.push(`${unknown.length} item(s) have no date in the syllabus. Confirm them with your professor.`);
  }

  const inferred = sem.assessments.filter((a) => a.dateConfidence === "inferred");
  if (inferred.length) {
    warnings.push(`${inferred.length} date(s) were worked out from week numbers rather than printed dates.`);
  }

  const orphans = sem.assessments.filter((a) => !sem.courses.some((c) => c.code === a.courseCode));
  if (orphans.length) {
    warnings.push(`${orphans.length} assessment(s) reference a course we did not extract.`);
  }

  return warnings;
}
