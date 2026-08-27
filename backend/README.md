# CUNY Course Canvas — Backend

Express + Gemini backend. Two things live here:

1. **`POST /api/parse`** — the endpoint the live MTA React app (`frontend/src/CourseCanvas.jsx`) actually
   calls. Implements the contract in `api/parse-route.ts` (the team's original reference), expanded with
   instructor contact, structured meetings, detailed dates, grading scale, categorized policies, materials,
   links, weekly schedule, `estimatedHours`, and `topicDefinitions`.
2. **`/api/syllabus/*`** — a separate, self-contained onboarding flow (upload → breakdown → review →
   study plan) built earlier for a simpler UI. Not used by the current MTA frontend, kept here since it
   works and may be useful later.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # paste in the shared GEMINI_API_KEY (see repo root README for how it's shared)
npm run dev
```

Server runs on `http://localhost:8080` (override with `PORT`).

## `/api/parse` (used by the MTA frontend)

```
POST /api/parse
Content-Type: multipart/form-data
  field "files": one or more PDF/image/text syllabi (repeat the field per file)
  field "semesterStart": ISO date, e.g. "2026-08-24"
```

Gemini reads every file together in one context window and returns one comprehensive structured result:
```json
{
  "courses": [{
    "code": "CSCI 335",
    "title": "...",
    "section": "A",
    "semester": "Fall",
    "year": 2026,
    "instructor": "...",
    "instructorContact": { "name": "...", "email": "...", "office": "...", "officeHoursText": "..." },
    "meetings": [{ "type": "Lecture", "days": ["Monday", "Wednesday"], "startTime": "14:00", "endTime": "15:15", "location": "NAC 1/203" }],
    "gradingPolicy": [{ "category": "Projects", "weightPercent": 35, "dropsLowest": false }],
    "gradeScale": [{ "letter": "A", "min": 93, "max": 100 }],
    "policies": [{ "category": "Late Work", "summary": "..." }],
    "materials": [{ "type": "Textbook", "name": "...", "details": "..." }],
    "links": [{ "label": "Blackboard", "url": "https://..." }],
    "weeklySchedule": [{ "week": 1, "dateRange": "Aug 26-Sep 1", "topics": ["..."], "readings": ["..."], "assignments": ["..."] }],
    "topics": ["Red-black trees", "..."],
    "topicDefinitions": [{ "topic": "Red-black trees", "definition": "..." }]
  }],
  "assessments": [{
    "id": "csci335-midterm-1", "courseCode": "CSCI 335", "title": "Midterm 1", "type": "exam",
    "dueDate": "2026-10-14", "originalDateText": "Wednesday, October 14",
    "dateConfidence": "explicit", "weightPercent": 19, "estimatedHours": 10
  }],
  "warnings": ["CSCI 335: grading policy sums to 97%, not 100%. Check the syllabus."]
}
```
`warnings` flags what Gemini is unsure about (grading that doesn't sum to 100, TBA/inferred dates, orphan
assessments) rather than silently guessing — surfaced in the app's "What Gemini extracted" panel.

Quota/rate-limit errors are normalized before they reach the frontend:
```json
{
  "code": "GEMINI_RATE_LIMITED",
  "title": "Service Delay",
  "message": "Gemini has temporarily reached its request limit.",
  "retryAfter": "52s"
}
```
The frontend preserves the selected files and does not auto-retry in a loop.

## `/api/syllabus/*` (standalone onboarding flow, not currently wired to the MTA frontend)

### 1. Upload syllabus
```
POST /api/syllabus/upload
Content-Type: multipart/form-data
  field "syllabus": PDF or image file (png/jpeg/webp/heic), max 20MB
```
Gemini reads the whole document (native PDF/image understanding) and returns a structured breakdown. Response:
```json
{
  "id": "session-uuid",
  "status": "extracted",
  "breakdown": {
    "course": { "name": "...", "code": "...", "instructor": "...", "term": "..." },
    "keyDates": [{ "title": "Midterm 1", "date": "2026-10-14", "type": "exam", "description": "..." }],
    "gradingPolicy": {
      "components": [{ "name": "Homework", "weightPercent": 20, "description": "..." }],
      "gradingScale": [{ "letter": "A", "minPercent": 93 }],
      "notes": "..."
    },
    "topics": ["Topic 1", "Topic 2"]
  },
  "focusTopics": [],
  "studyPlan": null
}
```
Save `id` — every later call uses it as `:sessionId`.

### 2. Fetch session (poll/rehydrate at any step)
```
GET /api/syllabus/:sessionId
```

### 3. Review — user edits the breakdown and/or flags topics for extra focus
```
PATCH /api/syllabus/:sessionId/review
Content-Type: application/json
{
  "breakdown": { "keyDates": [ ...corrected array... ] },   // optional, shallow-merged over existing breakdown
  "focusTopics": ["Topic 2", "Midterm 1"]                    // optional
}
```
This step is optional in the UI — if the user says "no thanks, looks right," skip straight to step 4.

### 4. Confirm — generate flashcards + study schedule
```
POST /api/syllabus/:sessionId/study-plan
Content-Type: application/json
{
  "freeTime": [
    { "day": "Monday", "startTime": "18:00", "endTime": "20:00" },
    { "date": "2026-10-10", "startTime": "10:00", "endTime": "12:00" }
  ],
  "planStartDate": "2026-08-27",
  "planEndDate": "2026-12-15"
}
```
`freeTime` entries can be recurring (`day`) or one-off (`date`). Response adds:
```json
{
  "studyPlan": {
    "flashcards": [{ "topic": "...", "question": "...", "answer": "...", "difficulty": "medium" }],
    "studySchedule": [{ "date": "2026-10-10", "startTime": "10:00", "endTime": "10:45", "topic": "...", "activityType": "flashcards", "relatedDeadline": "Midterm 1" }]
  },
  "status": "complete"
}
```

### Cleanup
```
DELETE /api/syllabus/:sessionId
```

## Notes
- Sessions for `/api/syllabus/*` are stored as JSON files under `data/sessions/` — no DB setup needed for the hackathon.
- Model defaults to `gemini-3.6-flash`. Change via `GEMINI_MODEL` in `.env` if that model string changes before the event.
- All three Gemini calls use `responseSchema` (see `src/utils/schemas.js`) so responses are always well-formed JSON — no manual parsing/regex needed on the frontend.
