# CUNY Course Canvas

CUNY Course Canvas is an MTA-themed React prototype that turns course syllabi into a semester transit map. Courses become train lines, assignments and exams become stations, and stressful weeks become service advisories.

## Project Direction

We are building an MTA-themed smart syllabus and study planner for CUNY students. The core idea is simple: students upload all their syllabi, Gemini extracts courses, deadlines, policies, and topics, and the app turns the semester into a transit map where each class is a train line and each assignment or exam is a station.

The current path is to make the frontend demo strong first, then connect the backend parser. The frontend already shows the product story: syllabus upload, semester canvas, service advisory collision weeks, availability planning, commute buffers, study plan generation, course policy breakdowns, flashcards, quizzes, and calendar export.

## Current Frontend

- MTA-style React UI powered by Vite
- Multi-syllabus upload demo with mock Gemini parsing
- Semester rail map with collision weeks and uncertain-date markers
- Availability painter for classes, work, days off, and personal blocks
- MTA commute buffer so study plans avoid travel time around classes
- Study plan generator with calendar export
- Course pages with policies, grading, flashcards, and quizzes

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:5173/`.

## Useful Commands

```bash
npm run build
```

## Main Files

- `index.html` - Vite entry page
- `frontend/src/main.jsx` - React mount file
- `frontend/src/CourseCanvas.jsx` - main MTA-themed frontend
- `backend/api/parse-route.ts` - Gemini API route reference for backend integration
- `docs/team-update.md` - short project update to send teammates

## Suggested Team Split

- Frontend: polish the MTA interface, interactions, responsive layout, and demo flow
- Backend/API: turn `backend/api/parse-route.ts` into a real endpoint with Gemini
- Data model: keep course, assessment, policy, and study-plan fields consistent
- Presentation: prepare the story around collision weeks, commute-aware planning, and calendar export
