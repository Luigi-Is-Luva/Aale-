# Team Update: CUNY Course Canvas

We are moving forward with the MTA-themed version of Course Canvas.

The product direction: students upload their CUNY syllabi, Gemini extracts important course information, and the app turns the semester into a transit-style map. Each course is a train line, each assignment or exam is a station, and stressful weeks become service advisories.

Current frontend status:

- React + Vite app is running as the main frontend.
- The old pastel/static pages were removed.
- The MTA interface includes syllabus upload, semester canvas, collision weeks, course policies, availability planning, commute buffer, generated study plan, flashcards, quizzes, and calendar export.
- The commute buffer is a new planning feature that blocks travel time around classes so the app does not schedule study sessions during realistic travel windows.

Repo organization:

- `frontend/src/` contains the React frontend.
- `backend/api/` contains the Gemini parse route reference.
- `docs/` contains team notes and planning docs.

Next path:

1. Frontend team polishes layout, mobile responsiveness, and demo interactions.
2. Backend team turns the Gemini parse route into a real endpoint.
3. Data/model team keeps extracted syllabus fields consistent.
4. Presentation team frames the demo around collision detection, MTA service advisories, and commute-aware study planning.
