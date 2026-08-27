# CUNY Course Canvas

CUNY Course Canvas is an MTA-themed React prototype that turns course syllabi into a semester transit map. Courses become train lines, assignments and exams become stations, and stressful weeks become service advisories.

## Project Direction

We are building an MTA-themed smart syllabus and schedule planner for CUNY students. The core idea is simple: students upload all their syllabi, Gemini extracts courses, deadlines, policies, and topics, and the app turns the semester into a transit map where each class is a train line and each assignment or exam is a station.

The current path is a real-upload MTA product experience: the app starts empty, a student uploads actual syllabi, Gemini extracts structured syllabus data once, and the frontend reuses that same course state everywhere.

## Current Frontend

- MTA/transit-inspired React UI powered by Vite
- Real multi-syllabus upload wired to a Gemini backend, with no mock syllabus fallback
- Friendly quota/rate-limit handling for Gemini `429` responses
- Semester rail map with course lines, assessment stations, next stop, collision weeks, and uncertain-date markers
- Availability painter for classes, work, days off, and personal blocks
- MTA commute buffer so study plans avoid travel time around classes
- Study plan generator with calendar export
- Course pages organized into Overview, Schedule, Assignments, Grading, Policies, and Resources
- Study area for notes upload, flashcards, and quizzes

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173/`.

To parse real syllabi with Gemini, run the backend too — see `backend/README.md` for setup. You need a
`GEMINI_API_KEY`, shared separately and never committed. Short version:

```bash
cd backend
npm install
cp .env.example .env   # paste in the shared GEMINI_API_KEY
npm run dev
```

The backend listens on `http://localhost:8080` and the frontend's `askGemini()` (in `CourseCanvas.jsx`) is
already pointed at it.

## Useful Commands

```bash
npm run build
```

## Main Files

- `index.html` - Vite entry page
- `frontend/src/main.jsx` - React mount file
- `frontend/src/CourseCanvas.jsx` - main MTA-themed frontend
- `backend/api/parse-route.ts` - the original Gemini API route reference (kept for context)
- `backend/` (everything else) - the real Express server implementing that contract, plus `estimatedHours`
  and `topicDefinitions` extensions the schedule and flashcards need. See `backend/README.md`.
- `docs/team-update.md` - short project update to send teammates

## Suggested Team Split

- Frontend: polish the MTA interface, interactions, responsive layout, and demo flow
- Backend/API: done — real Express + Gemini endpoint at `backend/`, see `backend/README.md`
- Data model: keep course, assessment, policy, and study-plan fields consistent
- Presentation: prepare the story around collision weeks, commute-aware planning, and calendar export
