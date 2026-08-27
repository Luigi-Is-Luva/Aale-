# CUNY Course Canvas

CUNY Course Canvas is an MTA-themed React prototype that turns course syllabi into a semester transit map. Courses become train lines, assignments and exams become stations, and stressful weeks become service advisories.

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
- `mta-main.jsx` - React mount file
- `mta/CourseCanvas.jsx` - main MTA-themed frontend
- `mta/parse-route.ts` - Gemini API route reference for backend integration
