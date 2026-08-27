import React, { useState, useMemo, useEffect, useRef } from "react";

/* ============================================================================
   CUNY COURSE CANVAS
   A semester-wide syllabus intelligence tool.

   Design thesis: the semester as a transit diagram. Courses are lines,
   assessments are stations, collision weeks are service advisories.

   HACKATHON NOTE: every Gemini call in this prototype is stubbed behind
   `askGemini()` at the bottom of this file. Swap that one function for a
   fetch to your /api/parse route and the whole app becomes real.
   ========================================================================== */

/* ----------------------------- design tokens ----------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800;900&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.cc {
  --ink: #14141C;
  --ink2: #1E1F2B;
  --ink3: #2C2D3C;
  --bone: #EFEBE1;
  --bone2: #E3DED1;
  --bone3: #D5CFBE;
  --signal: #F2C14E;
  --alert: #E4572E;
  --go: #2E9E6B;
  --muted: #6E6C7C;
  --muted2: #9A98A6;

  font-family: 'Public Sans', system-ui, sans-serif;
  color: var(--ink);
  background: var(--bone);
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
.cc *, .cc *::before, .cc *::after { box-sizing: border-box; }
.cc :where(button) { font: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.cc :where(input, textarea, select) { font: inherit; color: inherit; }
.cc :focus-visible { outline: 2px solid var(--signal); outline-offset: 2px; }

/* type */
.d1 { font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:900; font-size:clamp(38px,6vw,68px); line-height:.92; letter-spacing:-.035em; }
.d2 { font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:800; font-size:clamp(24px,3.4vw,34px); line-height:1; letter-spacing:-.025em; }
.d3 { font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:800; font-size:19px; line-height:1.1; letter-spacing:-.015em; }
.eyebrow { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; font-weight:500;
  letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }
.mono { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-variant-numeric:tabular-nums; }
.lede { font-size:16px; line-height:1.55; color:var(--muted); max-width:62ch; }
.tiny { font-size:12.5px; line-height:1.45; color:var(--muted); }

/* shell */
.shell { display:flex; min-height:100vh; }
.nav { width:236px; flex:0 0 236px; background:var(--ink); color:var(--bone);
  padding:22px 16px; display:flex; flex-direction:column; gap:26px; }
.nav-brand { display:flex; align-items:center; gap:10px; }
.nav-mark { width:30px; height:30px; border-radius:50%; background:var(--signal);
  display:grid; place-items:center; font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:900;
  font-size:13px; color:var(--ink); letter-spacing:-.04em; }
.nav-name { font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:800; font-size:14px;
  letter-spacing:-.01em; line-height:1.05; }
.nav-group { display:flex; flex-direction:column; gap:2px; }
.nav-label { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; letter-spacing:.2em;
  text-transform:uppercase; color:#7E7C8E; margin:0 0 8px 8px; }
.nav-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:5px;
  font-size:14px; font-weight:500; color:#C9C5BC; text-align:left; width:100%; transition:.14s; }
.nav-item:hover { background:var(--ink2); color:var(--bone); }
.nav-item[data-on="1"] { background:var(--bone); color:var(--ink); font-weight:700; }
.nav-tick { width:3px; height:15px; border-radius:2px; background:currentColor; opacity:.35; }
.nav-foot { margin-top:auto; border-top:1px solid var(--ink3); padding-top:14px; }

.main { flex:1; min-width:0; max-width:1480px; padding:30px clamp(18px,3.4vw,44px) 70px; }
.head { display:flex; justify-content:space-between; align-items:flex-end; gap:20px;
  flex-wrap:wrap; margin-bottom:26px; }

/* surfaces */
.card { background:#fff; border:1px solid var(--bone2); border-radius:6px; padding:20px; }
.card-flat { background:var(--bone); border:1px solid var(--bone2); border-radius:6px; padding:16px; }
.panel-dark { background:var(--ink); color:var(--bone); border-radius:8px; padding:22px; }
.rule { height:1px; background:var(--bone2); border:0; margin:18px 0; }

/* buttons */
.btn { display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:5px;
  font-weight:600; font-size:14px; transition:.14s; }
.btn-primary { background:var(--ink); color:var(--bone); }
.btn-primary:hover { background:var(--ink2); }
.btn-signal { background:var(--signal); color:var(--ink); font-weight:700; }
.btn-signal:hover { filter:brightness(1.06); }
.btn-ghost { border:1px solid var(--bone3); color:var(--ink); }
.btn-ghost:hover { background:var(--bone2); }
.btn-alert { background:var(--alert); color:#fff; font-weight:700; }
.btn:disabled { opacity:.4; cursor:not-allowed; }

/* course bullet — the transit signature */
.bullet { border-radius:50%; display:grid; place-items:center; color:#fff; flex:0 0 auto;
  font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:800; letter-spacing:-.03em; }
.bullet-lg { width:34px; height:34px; font-size:12px; }
.bullet-md { width:26px; height:26px; font-size:10px; }
.bullet-sm { width:19px; height:19px; font-size:8px; }

/* the rail */
.rail-wrap { overflow-x:auto; padding-bottom:6px; }
.rail { position:relative; min-width:840px; }
.rail-weeks { display:grid; margin-left:132px; }
.rail-week { text-align:center; padding-bottom:7px; }
.rail-week-n { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; font-weight:600; color:#8A8898; }
.rail-week-d { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:9.5px; color:#5E5C6C; }
.rail-row { position:relative; display:flex; align-items:center; height:46px; }
.rail-name { width:132px; flex:0 0 132px; display:flex; align-items:center; gap:8px; z-index:3; }
.rail-code { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; font-weight:600; color:#C9C5BC; }
.rail-track { position:relative; flex:1; height:100%; }
.rail-line { position:absolute; left:0; right:0; top:50%; height:4px; transform:translateY(-50%);
  border-radius:2px; opacity:.6; }
.station { position:absolute; top:50%; transform:translate(-50%,-50%); z-index:4;
  border-radius:50%; border:2.5px solid var(--ink); background:#fff; transition:.14s; }
.station:hover, .station[data-on="1"] { transform:translate(-50%,-50%) scale(1.32); border-color:var(--signal); }
.advisory { position:absolute; top:0; bottom:0; z-index:1; border-left:1px dashed rgba(228,87,46,.55);
  border-right:1px dashed rgba(228,87,46,.55);
  background:repeating-linear-gradient(-45deg, rgba(228,87,46,.14) 0 6px, transparent 6px 12px); }
.advisory-tag { position:absolute; top:-6px; left:50%; transform:translateX(-50%);
  background:var(--alert); color:#fff; font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:9px;
  font-weight:600; letter-spacing:.08em; padding:2px 6px; border-radius:3px; white-space:nowrap; }
.today-line { position:absolute; top:0; bottom:0; width:2px; background:var(--signal); z-index:2; }

/* misc */
.chip { display:inline-flex; align-items:center; gap:6px; padding:3px 9px; border-radius:20px;
  font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10.5px; font-weight:500; letter-spacing:.04em;
  border:1px solid var(--bone3); }
.chip-alert { background:rgba(228,87,46,.1); border-color:rgba(228,87,46,.35); color:#B03A17; }
.chip-go { background:rgba(46,158,107,.1); border-color:rgba(46,158,107,.35); color:#1F7350; }
.chip-warn { background:rgba(242,193,78,.16); border-color:rgba(242,193,78,.5); color:#8A6510; }
.bar { height:8px; border-radius:4px; background:var(--bone2); overflow:hidden; }
.bar > i { display:block; height:100%; border-radius:4px; }
.grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; align-items:start; }
.stat-n { font-family:'Archivo','Helvetica Neue',Arial,sans-serif; font-weight:900; font-size:30px; letter-spacing:-.03em; line-height:1; }
.status-strip { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; margin-bottom:18px; }
.status-tile { background:#fff; border:1px solid var(--bone2); border-left:4px solid var(--signal);
  border-radius:6px; padding:14px; }
.status-tile strong { display:block; font-family:'Archivo','Helvetica Neue',Arial,sans-serif;
  font-size:18px; line-height:1.05; margin:5px 0; }

/* availability painter */
.avail { display:grid; grid-template-columns:56px repeat(7,1fr); gap:2px; min-width:600px; }
.avail-h { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; color:var(--muted);
  text-align:center; padding-bottom:4px; }
.avail-t { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; color:var(--muted);
  text-align:right; padding-right:6px; line-height:22px; }
.slot { height:22px; border-radius:2px; background:#fff; border:1px solid var(--bone2);
  transition:background .1s; cursor:pointer; }
.slot[data-s="busy"] { background:var(--ink3); border-color:var(--ink3); cursor:not-allowed; }
.slot[data-s="commute"] { background:repeating-linear-gradient(45deg, var(--signal) 0 5px, #FFE4A1 5px 10px);
  border-color:#D9A93A; cursor:not-allowed; }
.slot[data-s="off"] { background:var(--bone3); border-color:var(--bone3); }
.slot[data-s="free"]:hover { background:rgba(242,193,78,.4); }
.slot[data-s="study"] { background:var(--signal); border-color:#D9A93A; }

/* flashcard */
.fc { perspective:1200px; height:250px; width:100%; }
.fc-in { position:relative; width:100%; height:100%; transition:transform .5s cubic-bezier(.4,0,.2,1);
  transform-style:preserve-3d; }
.fc[data-flip="1"] .fc-in { transform:rotateY(180deg); }
.fc-face { position:absolute; inset:0; backface-visibility:hidden; border-radius:8px;
  padding:26px; display:flex; flex-direction:column; justify-content:center; align-items:center;
  text-align:center; border:1px solid var(--bone2); background:#fff; }
.fc-back { transform:rotateY(180deg); background:var(--ink); color:var(--bone); border-color:var(--ink); }

/* animation */
@keyframes popIn { from { opacity:0; transform:translate(-50%,-50%) scale(.2); }
                   to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
.anim-pop { animation:popIn .4s cubic-bezier(.34,1.56,.64,1) backwards; }
.anim-up { animation:fadeUp .5s ease backwards; }
@media (prefers-reduced-motion: reduce) {
  .cc *, .cc *::before { animation-duration:.001ms !important; transition-duration:.001ms !important; }
}
@media (max-width: 820px) {
  .shell { flex-direction:column; }
  .nav { width:100%; flex:none; flex-direction:row; align-items:center; gap:14px;
    overflow-x:auto; padding:12px 14px; }
  .nav-group { flex-direction:row; }
  .nav-label, .nav-foot { display:none; }
  .nav-item { white-space:nowrap; }
}
`;

/* ------------------------------- semester data ---------------------------- */
/* In production this whole object is what Gemini returns from /api/parse.
   It conforms exactly to types/semester.ts — see PROJECT_PLAN.md.          */

const SEMESTER_START = new Date(2026, 7, 24); // Mon Aug 24 2026
const WEEKS = 16; // 15 instruction weeks + finals

const COURSES = [
  {
    code: "CSCI 33500", short: "335", title: "Software Analysis & Design III",
    instructor: "Prof. Adeyemi", color: "#D6352B",
    meets: [{ d: 1, s: 10, e: 12 }, { d: 3, s: 10, e: 12 }],
    room: "Hunter North 1001B",
    late: "10% off per day, no submissions after 72 hours.",
    attendance: "Two unexcused absences allowed. Third drops you a letter grade.",
    grading: [
      { cat: "Projects", w: 35, drops: false },
      { cat: "Midterms", w: 40, drops: true },
      { cat: "Final exam", w: 25, drops: false },
    ],
    topics: ["Amortized analysis", "Red-black trees", "Hash collision strategies",
             "Graph traversal", "Dynamic programming", "Big-O vs Big-Theta"],
  },
  {
    code: "CSCI 26000", short: "260", title: "Computer Architecture",
    instructor: "Prof. Nakamura", color: "#1B54B8",
    meets: [{ d: 2, s: 13, e: 15 }, { d: 4, s: 13, e: 15 }],
    room: "Hunter West 615",
    late: "No late labs. Ever. One drop granted at semester's end.",
    attendance: "Lab attendance is graded. Lecture is not.",
    grading: [
      { cat: "Labs", w: 30, drops: true },
      { cat: "Midterm", w: 25, drops: false },
      { cat: "Lab practical", w: 15, drops: false },
      { cat: "Final exam", w: 30, drops: false },
    ],
    topics: ["Pipelining hazards", "Cache associativity", "Two's complement",
             "MIPS addressing modes", "Amdahl's Law", "Branch prediction"],
  },
  {
    code: "ECO 20100", short: "201", title: "Intermediate Microeconomics",
    instructor: "Prof. Okonkwo", color: "#E07316",
    meets: [{ d: 1, s: 14, e: 15 }, { d: 3, s: 14, e: 15 }, { d: 5, s: 14, e: 15 }],
    room: "Hunter East 714",
    late: "Problem sets accepted up to 24 hours late for half credit.",
    attendance: "Not tracked, but exam questions come from lecture only.",
    grading: [
      { cat: "Problem sets", w: 20, drops: true },
      { cat: "Midterm 1", w: 20, drops: false },
      { cat: "Midterm 2", w: 20, drops: false },
      { cat: "Final exam", w: 40, drops: false },
    ],
    topics: ["Marginal rate of substitution", "Deadweight loss", "Nash equilibrium",
             "Price elasticity", "Consumer surplus", "Isoquants and returns to scale"],
  },
  {
    code: "MATH 15000", short: "150", title: "Discrete Structures",
    instructor: "Prof. Vasquez", color: "#16904A",
    meets: [{ d: 2, s: 9, e: 10 }, { d: 4, s: 9, e: 10 }],
    room: "Hunter North 424",
    late: "Homework is due at 11:59pm. Gradescope closes. No exceptions.",
    attendance: "Optional, but quizzes are given in person without warning.",
    grading: [
      { cat: "Homework", w: 25, drops: true },
      { cat: "Pop quizzes", w: 10, drops: true },
      { cat: "Midterm", w: 25, drops: false },
      { cat: "Final exam", w: 40, drops: false },
    ],
    topics: ["Proof by induction", "Pigeonhole principle", "Equivalence relations",
             "Generating functions", "Graph coloring", "Recurrence relations"],
  },
  {
    code: "ENGL 22000", short: "220", title: "Writing About Literature",
    instructor: "Prof. Hollis", color: "#8E3FA6",
    meets: [{ d: 5, s: 10, e: 13 }],
    room: "Hunter West 222",
    late: "Half a letter grade per day. Extensions granted if asked 48h ahead.",
    attendance: "Seminar. Three absences and you cannot pass.",
    grading: [
      { cat: "Essays", w: 60, drops: false },
      { cat: "Seminar participation", w: 20, drops: false },
      { cat: "Final portfolio", w: 20, drops: false },
    ],
    topics: ["Close reading", "Thesis architecture", "Free indirect discourse",
             "Citation ethics", "Counterargument framing", "Revision as re-seeing"],
  },
];

// dueDate ISO, weightPercent, confidence: explicit | inferred | unknown
const ASSESSMENTS = [
  // CSCI 33500
  { id: "a0",  course: "CSCI 33500", title: "Warm-up lab — linked lists", type: "homework", date: "2026-09-03", w: 4, conf: "explicit", hours: 3 },
  { id: "a1",  course: "CSCI 33500", title: "Project 1 — BST implementation", type: "project", date: "2026-09-18", w: 12, conf: "explicit", hours: 8 },
  { id: "a2",  course: "CSCI 33500", title: "Midterm 1", type: "exam", date: "2026-10-14", w: 19, conf: "explicit", hours: 10 },
  { id: "a3",  course: "CSCI 33500", title: "Project 2 — graph library", type: "project", date: "2026-10-30", w: 12, conf: "explicit", hours: 9 },
  { id: "a4",  course: "CSCI 33500", title: "Midterm 2", type: "exam", date: "2026-11-11", w: 19, conf: "explicit", hours: 10 },
  { id: "a6",  course: "CSCI 33500", title: "Project 3 — topic TBA", type: "project", date: null, w: 9, conf: "unknown", hours: 8 },
  { id: "a5",  course: "CSCI 33500", title: "Final exam", type: "exam", date: "2026-12-09", w: 25, conf: "inferred", hours: 14 },
  // CSCI 26000
  { id: "b0",  course: "CSCI 26000", title: "Lab 1 — bit manipulation", type: "homework", date: "2026-09-04", w: 6, conf: "explicit", hours: 4 },
  { id: "b1",  course: "CSCI 26000", title: "Lab 3 — datapath simulation", type: "homework", date: "2026-10-01", w: 8, conf: "explicit", hours: 5 },
  { id: "b2",  course: "CSCI 26000", title: "Midterm", type: "exam", date: "2026-10-15", w: 25, conf: "explicit", hours: 11 },
  { id: "b3",  course: "CSCI 26000", title: "Lab 6 — cache profiling", type: "homework", date: "2026-11-05", w: 8, conf: "explicit", hours: 5 },
  { id: "b4",  course: "CSCI 26000", title: "Lab practical", type: "exam", date: "2026-11-12", w: 15, conf: "explicit", hours: 8 },
  { id: "b6",  course: "CSCI 26000", title: "Lab 8 — pipeline hazards", type: "homework", date: "2026-11-24", w: 8, conf: "explicit", hours: 5 },
  { id: "b5",  course: "CSCI 26000", title: "Final exam", type: "exam", date: "2026-12-11", w: 30, conf: "inferred", hours: 14 },
  // ECO 20100
  { id: "c0",  course: "ECO 20100", title: "Problem set 1", type: "homework", date: "2026-09-08", w: 5, conf: "explicit", hours: 4 },
  { id: "c1",  course: "ECO 20100", title: "Problem set 2", type: "homework", date: "2026-09-25", w: 5, conf: "explicit", hours: 4 },
  { id: "c2",  course: "ECO 20100", title: "Midterm 1", type: "exam", date: "2026-10-12", w: 20, conf: "explicit", hours: 10 },
  { id: "c3",  course: "ECO 20100", title: "Problem set 5", type: "homework", date: "2026-11-06", w: 5, conf: "explicit", hours: 4 },
  { id: "c4",  course: "ECO 20100", title: "Midterm 2", type: "exam", date: "2026-11-13", w: 20, conf: "explicit", hours: 10 },
  { id: "c6",  course: "ECO 20100", title: "Problem set 7", type: "homework", date: "2026-11-20", w: 5, conf: "explicit", hours: 4 },
  { id: "c5",  course: "ECO 20100", title: "Final exam", type: "exam", date: "2026-12-08", w: 40, conf: "inferred", hours: 16 },
  // MATH 15000
  { id: "d0",  course: "MATH 15000", title: "Homework 1 — propositional logic", type: "homework", date: "2026-09-03", w: 5, conf: "explicit", hours: 3 },
  { id: "d1",  course: "MATH 15000", title: "Induction problem set", type: "homework", date: "2026-09-17", w: 6, conf: "explicit", hours: 4 },
  { id: "d2",  course: "MATH 15000", title: "Midterm", type: "exam", date: "2026-10-15", w: 25, conf: "explicit", hours: 11 },
  { id: "d5",  course: "MATH 15000", title: "Pop quizzes (unannounced)", type: "quiz", date: null, w: 10, conf: "unknown", hours: 5 },
  { id: "d3",  course: "MATH 15000", title: "Graph theory problem set", type: "homework", date: "2026-11-12", w: 7, conf: "explicit", hours: 5 },
  { id: "d6",  course: "MATH 15000", title: "Homework 9 — recurrences", type: "homework", date: "2026-11-24", w: 7, conf: "explicit", hours: 4 },
  { id: "d4",  course: "MATH 15000", title: "Final exam", type: "exam", date: "2026-12-10", w: 40, conf: "inferred", hours: 15 },
  // ENGL 22000
  { id: "e0",  course: "ENGL 22000", title: "Reading response 1", type: "paper", date: "2026-09-11", w: 5, conf: "explicit", hours: 3 },
  { id: "e1",  course: "ENGL 22000", title: "Essay 1 — close reading", type: "paper", date: "2026-09-25", w: 18, conf: "explicit", hours: 7 },
  { id: "e2",  course: "ENGL 22000", title: "Essay 2 — comparative", type: "paper", date: "2026-10-30", w: 18, conf: "explicit", hours: 8 },
  { id: "e3",  course: "ENGL 22000", title: "Essay 3 — research", type: "paper", date: "2026-11-13", w: 19, conf: "explicit", hours: 10 },
  { id: "e5",  course: "ENGL 22000", title: "Seminar participation", type: "other", date: null, w: 20, conf: "unknown", hours: 0 },
  { id: "e4",  course: "ENGL 22000", title: "Final portfolio", type: "paper", date: "2026-12-04", w: 20, conf: "explicit", hours: 9 },
];

const DEFAULT_CONSTRAINTS = [
  { id: "k1", label: "Shift at the bookstore", days: [2, 4], s: 16, e: 21, kind: "work" },
  { id: "k2", label: "Commute — 7 train", days: [1, 2, 3, 4, 5], s: 8, e: 9, kind: "commute" },
  { id: "k3", label: "Intramural volleyball", days: [3], s: 19, e: 21, kind: "sport" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 → 22:00

/* ------------------------------- helpers ---------------------------------- */

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtShort = (s) => parseISO(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtLong = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;

const weekOf = (isoStr) => {
  const diff = Math.floor((parseISO(isoStr) - SEMESTER_START) / 864e5);
  return Math.floor(diff / 7) + 1;
};
const weekStart = (n) => addDays(SEMESTER_START, (n - 1) * 7);
const courseBy = (code) => COURSES.find((c) => c.code === code);

const TYPE_GLYPH = { exam: "EXAM", project: "PROJ", paper: "PAPER", homework: "HW", quiz: "QUIZ" };

/* Collision detection — plain TypeScript, no AI needed. This is the insight
   that no single syllabus can give you. */
function findCollisions(assessments) {
  const byWeek = {};
  assessments.forEach((a) => {
    if (!a.date) return;
    const w = weekOf(a.date);
    if (w < 1 || w > WEEKS + 2) return;
    (byWeek[w] ||= []).push(a);
  });
  return Object.entries(byWeek)
    .map(([w, list]) => {
      const load = list.reduce((s, a) => s + a.w, 0);
      const courses = new Set(list.map((a) => a.course)).size;
      const exams = list.filter((a) => a.type === "exam").length;
      // `load` sums percentages that belong to different courses, so on its own it
      // can exceed 100 and mean nothing. `share` normalises it: the slice of your
      // ENTIRE semester decided in this one week.
      const share = Math.round(load / COURSES.length);
      return { week: Number(w), list, load, share, courses, exams,
               severity: share >= 12 ? "severe" : share >= 6 ? "heavy" : "normal" };
    })
    .sort((a, b) => a.week - b.week);
}

/* ------------------------------ the scheduler ------------------------------
   Greedy urgency scheduler. Pure function, no AI, fully deterministic —
   which means it never hallucinates a study block into your work shift.     */

const LEAD_DAYS = { exam: 16, project: 14, paper: 12, homework: 7, quiz: 5 };

function buildAvailability(extraBusy, constraints, daysOff, commuteBuffer = 1) {
  const map = {};
  HOURS.forEach((h) => DAYS.forEach((_, d) => { map[`${d}-${h}`] = "free"; }));
  COURSES.forEach((c) =>
    c.meets.forEach((m) => {
      for (let h = m.s; h < m.e; h++) map[`${m.d}-${h}`] = "class";
    })
  );
  COURSES.forEach((c) =>
    c.meets.forEach((m) => {
      for (let offset = 1; offset <= commuteBuffer; offset++) {
        const before = m.s - offset;
        const after = m.e + offset - 1;
        if (HOURS.includes(before) && map[`${m.d}-${before}`] === "free") map[`${m.d}-${before}`] = "commute";
        if (HOURS.includes(after) && map[`${m.d}-${after}`] === "free") map[`${m.d}-${after}`] = "commute";
      }
    })
  );
  constraints.forEach((k) =>
    k.days.forEach((d) => { for (let h = k.s; h < k.e; h++) if (map[`${d}-${h}`] === "free") map[`${d}-${h}`] = "busy"; })
  );
  Object.keys(extraBusy).forEach((k) => { if (extraBusy[k] && map[k] === "free") map[k] = "busy"; });
  daysOff.forEach((d) => HOURS.forEach((h) => { if (map[`${d}-${h}`] === "free") map[`${d}-${h}`] = "off"; }));
  return map;
}

function buildPlan({ availability, daysOff, maxPerDay, today, panicId, horizonDays = 115 }) {
  const remaining = {};
  ASSESSMENTS.forEach((a) => { if (a.date && parseISO(a.date) >= today) remaining[a.id] = a.hours; });

  const days = [];
  for (let i = 0; i < horizonDays; i++) {
    const date = addDays(today, i);
    const dow = date.getDay();
    if (daysOff.includes(dow)) { days.push({ date, dow, blocks: [], off: true }); continue; }

    const freeHours = HOURS.filter((h) => availability[`${dow}-${h}`] === "free");
    const perCourse = {};
    let used = 0;
    const assigned = [];

    for (const h of freeHours) {
      if (used >= maxPerDay) break;
      const cands = ASSESSMENTS.filter((a) => {
        if (!a.date || !remaining[a.id]) return false;
        const due = parseISO(a.date);
        const until = Math.round((due - date) / 864e5);
        if (until < 0) return false;
        const lead = LEAD_DAYS[a.type] || 10;
        if (until > lead) return false;
        if ((perCourse[a.course] || 0) >= 2) return false;
        // Pacing ramp. Without this the scheduler burns all ten prep hours two
        // weeks early and leaves the day before the exam empty. The ramp caps
        // how much of an item you may have finished by any given day, so work
        // keeps arriving right up to the deadline.
        const spent = a.hours - remaining[a.id];
        const allowed = a.hours * (1 - until / lead) + 1;
        if (spent >= allowed) return false;
        return true;
      });
      if (!cands.length) continue;
      cands.sort((x, y) => {
        const ux = Math.max(0.5, Math.round((parseISO(x.date) - date) / 864e5));
        const uy = Math.max(0.5, Math.round((parseISO(y.date) - date) / 864e5));
        const px = x.id === panicId ? 4 : 1, py = y.id === panicId ? 4 : 1;
        return (y.w / uy) * py - (x.w / ux) * px;
      });
      const pick = cands[0];
      assigned.push({ h, a: pick });
      remaining[pick.id] -= 1;
      perCourse[pick.course] = (perCourse[pick.course] || 0) + 1;
      used += 1;
    }

    // merge contiguous hours on the same assessment into single blocks
    const blocks = [];
    assigned.forEach(({ h, a }) => {
      const last = blocks[blocks.length - 1];
      if (last && last.a.id === a.id && last.e === h) last.e = h + 1;
      else blocks.push({ a, s: h, e: h + 1 });
    });
    days.push({ date, dow, blocks, off: false });
  }
  const unmet = Object.entries(remaining).filter(([, v]) => v > 0);
  return { days, unmet };
}

/* --------------------------- shared components ----------------------------- */

function Bullet({ course, size = "md" }) {
  const c = typeof course === "string" ? courseBy(course) : course;
  if (!c) return null;
  return <span className={`bullet bullet-${size}`} style={{ background: c.color }}>{c.short}</span>;
}

function Stat({ n, label, tone }) {
  return (
    <div>
      <div className="stat-n" style={{ color: tone }}>{n}</div>
      <div className="eyebrow" style={{ marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Empty({ title, body, action }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "50px 26px" }}>
      <div className="d3" style={{ marginBottom: 8 }}>{title}</div>
      <p className="lede" style={{ margin: "0 auto 18px", fontSize: 14.5 }}>{body}</p>
      {action}
    </div>
  );
}

/* ------------------------------- 1. LOGIN ---------------------------------- */

function Login({ onEnter }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const ok = email.includes("@") && pw.length >= 4;

  return (
    <div className="cc" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexWrap: "wrap", minHeight: "100vh" }}>
        {/* left: the pitch */}
        <div style={{ flex: "1 1 440px", minWidth: "min(100%, 340px)", background: "var(--ink)", color: "var(--bone)",
                      padding: "clamp(28px,5vw,64px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="eyebrow" style={{ color: "var(--signal)" }}>CUNY Course Canvas</div>
          <h1 className="d1" style={{ margin: "18px 0 20px" }}>
            Five syllabi.<br />One semester.<br /><span style={{ color: "var(--signal)" }}>One view.</span>
          </h1>
          <p className="lede" style={{ color: "#A9A6B4" }}>
            Your syllabi each know one course. None of them know that October 14th
            is the week four of them collide. Upload all of them and see the semester
            the way it will actually happen to you.
          </p>

          {/* mini rail — the signature element, previewed */}
          <div style={{ marginTop: 40 }}>
            {COURSES.map((c, i) => (
              <div key={c.code} className="anim-up" style={{ display: "flex", alignItems: "center",
                   height: 30, animationDelay: `${i * 90}ms` }}>
                <Bullet course={c} size="sm" />
                <div style={{ position: "relative", flex: 1, height: 3, marginLeft: 10,
                              background: c.color, opacity: 0.55, borderRadius: 2 }}>
                  {[18, 44, 62, 88].map((p, j) => (
                    <span key={j} className="anim-pop" style={{ position: "absolute", left: `${p + i * 3}%`, top: "50%",
                      width: 9, height: 9, borderRadius: "50%", background: "#fff",
                      border: "2px solid var(--ink)", transform: "translate(-50%,-50%)",
                      animationDelay: `${600 + i * 90 + j * 70}ms` }} />
                  ))}
                </div>
              </div>
            ))}
            <div className="mono anim-up" style={{ fontSize: 10.5, color: "var(--alert)", marginTop: 12,
                 letterSpacing: ".1em", animationDelay: "1.5s" }}>
              ▮▮▮ {findCollisions(ASSESSMENTS).filter((c) => c.severity !== "normal").length} SERVICE ADVISORIES DETECTED THIS SEMESTER
            </div>
          </div>
        </div>

        {/* right: the door */}
        <div style={{ flex: "1 1 380px", minWidth: "min(100%, 320px)", display: "flex",
                      alignItems: "center", justifyContent: "center", padding: 30 }}>
          <div style={{ width: "100%", maxWidth: 340 }}>
            <div className="d2" style={{ marginBottom: 6 }}>Sign in</div>
            <p className="tiny" style={{ marginBottom: 22 }}>Use your CUNYfirst email. We never store your syllabi.</p>

            <label className="eyebrow">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@myhunter.cuny.edu"
              style={{ width: "100%", padding: "11px 12px", margin: "6px 0 16px", borderRadius: 5,
                       border: "1px solid var(--bone3)", background: "#fff" }} />

            <label className="eyebrow">Password</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && ok && onEnter(email)}
              style={{ width: "100%", padding: "11px 12px", margin: "6px 0 20px", borderRadius: 5,
                       border: "1px solid var(--bone3)", background: "#fff" }} />

            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
              disabled={!ok} onClick={() => onEnter(email)}>Sign in</button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--bone2)" }} />
              <span className="eyebrow">or</span>
              <div style={{ flex: 1, height: 1, background: "var(--bone2)" }} />
            </div>

            <button className="btn btn-signal" style={{ width: "100%", justifyContent: "center" }}
              onClick={() => onEnter("demo@myhunter.cuny.edu")}>Enter as demo student</button>
            <p className="tiny" style={{ marginTop: 12 }}>
              The demo loads five real Hunter syllabi already parsed, so you can see the
              whole semester without waiting on an upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- 2. UPLOAD --------------------------------- */

const DEMO_FILES = [
  { name: "CSCI33500_F26_syllabus.pdf", size: "412 KB", found: "6 assessments · 3 policies · 6 topics" },
  { name: "CSCI26000_syllabus_v2.pdf", size: "298 KB", found: "5 assessments · 3 policies · 6 topics" },
  { name: "ECO20100-Okonkwo.pdf", size: "1.1 MB", found: "5 assessments · 3 policies · 6 topics" },
  { name: "discrete_structures_fall26.docx", size: "88 KB", found: "4 assessments · 3 policies · 6 topics" },
  { name: "ENGL220_scan.jpg", size: "2.4 MB", found: "4 assessments · 3 policies · 6 topics" },
];

function Upload({ onDone, parsed }) {
  const [files, setFiles] = useState([]);
  const [stage, setStage] = useState("idle"); // idle | parsing | done
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const start = (list) => {
    const f = list.map((x) => ({ ...x, pct: 0 }));
    setFiles(f);
    setStage("parsing");
  };

  useEffect(() => {
    if (stage !== "parsing") return;
    const t = setInterval(() => {
      setFiles((prev) => {
        const next = prev.map((f, i) => ({ ...f, pct: Math.min(100, f.pct + (7 + ((i * 3) % 6))) }));
        if (next.every((f) => f.pct >= 100)) { clearInterval(t); setTimeout(() => setStage("done"), 350); }
        return next;
      });
    }, 130);
    return () => clearInterval(t);
  }, [stage]);

  const pickFiles = (e) => {
    const chosen = Array.from(e.target.files || []).map((f) => ({
      name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      found: "parsing with Gemini…",
    }));
    start(chosen.length ? chosen : DEMO_FILES);
  };

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Step one</div>
          <h2 className="d2" style={{ margin: "8px 0 8px" }}>Upload every syllabus at once</h2>
          <p className="lede">
            All of them, in one go. Reading them together is the whole point — that is how
            the collisions become visible. PDFs, Word files, or a photo of a printout.
          </p>
        </div>
      </div>

      {stage !== "done" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); start(DEMO_FILES); }}
          onClick={() => stage === "idle" && inputRef.current?.click()}
          style={{ border: `2px dashed ${drag ? "var(--signal)" : "var(--bone3)"}`, borderRadius: 8,
                   padding: "44px 26px", textAlign: "center", background: drag ? "rgba(242,193,78,.1)" : "#fff",
                   cursor: stage === "idle" ? "pointer" : "default", transition: ".15s" }}>
          <input ref={inputRef} type="file" multiple hidden accept=".pdf,.docx,.png,.jpg,.jpeg" onChange={pickFiles} />
          <div className="d3" style={{ marginBottom: 6 }}>
            {stage === "parsing" ? "Reading your semester" : "Drop your syllabi here"}
          </div>
          <p className="tiny" style={{ marginBottom: 16 }}>
            {stage === "parsing"
              ? "Gemini is reading all of them in a single context window."
              : "Or click to browse. Nothing leaves your session."}
          </p>
          {stage === "idle" && (
            <button className="btn btn-signal" onClick={(e) => { e.stopPropagation(); start(DEMO_FILES); }}>
              Use five sample syllabi
            </button>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {files.map((f, i) => (
            <div key={f.name + i} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.name}
                  </div>
                  <div className="tiny" style={{ marginTop: 3 }}>
                    {f.size} · {f.pct >= 100 || stage === "done" ? f.found : "reading…"}
                  </div>
                </div>
                <span className={`chip ${f.pct >= 100 ? "chip-go" : ""}`}>
                  {f.pct >= 100 ? "PARSED" : `${f.pct}%`}
                </span>
              </div>
              <div className="bar" style={{ marginTop: 10 }}>
                <i style={{ width: `${f.pct}%`, background: f.pct >= 100 ? "var(--go)" : "var(--signal)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {stage === "done" && (
        <div className="panel-dark anim-up" style={{ marginTop: 24 }}>
          <div className="eyebrow" style={{ color: "var(--signal)" }}>What Gemini extracted</div>
          <div style={{ display: "flex", gap: 34, flexWrap: "wrap", margin: "16px 0 20px" }}>
            <Stat n={COURSES.length} label="Courses" />
            <Stat n={ASSESSMENTS.filter((a) => a.date).length} label="Dated assessments" />
            <Stat n={ASSESSMENTS.filter((a) => a.conf !== "explicit").length} label="Needs your eyes" tone="var(--signal)" />
            <Stat n={findCollisions(ASSESSMENTS).filter((c) => c.severity !== "normal").length}
                  label="Collision weeks" tone="var(--alert)" />
          </div>
          <p className="tiny" style={{ color: "#A9A6B4", marginBottom: 18, maxWidth: "60ch" }}>
            Six dates were written as "TBA" or "week 12" rather than a calendar date. Those are
            flagged rather than guessed at — you will see a hollow marker on the canvas wherever
            we are not certain.
          </p>
          <button className="btn btn-signal" onClick={onDone}>Open the semester canvas →</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- 3. CANVAS --------------------------------- */

const TOTAL_DAYS = WEEKS * 7;
const leftPct = (isoStr) => {
  const d = Math.floor((parseISO(isoStr) - SEMESTER_START) / 864e5);
  return ((d + 0.5) / TOTAL_DAYS) * 100;
};

function Rail({ collisions, selected, onSelect, today }) {
  const todayPct = ((today - SEMESTER_START) / 864e5 / TOTAL_DAYS) * 100;
  const hot = collisions.filter((c) => c.severity !== "normal");

  return (
    <div className="rail-wrap">
      <div className="rail">
        <div className="rail-weeks" style={{ gridTemplateColumns: `repeat(${WEEKS},1fr)` }}>
          {Array.from({ length: WEEKS }, (_, i) => (
            <div key={i} className="rail-week">
              <div className="rail-week-n">{i + 1 === WEEKS ? "FIN" : i + 1}</div>
              <div className="rail-week-d">{weekStart(i + 1).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 132, right: 0, top: 0, bottom: 0, pointerEvents: "none" }}>
            {hot.map((c) => (
              <div key={c.week} className="advisory"
                style={{ left: `${((c.week - 1) * 7 / TOTAL_DAYS) * 100}%`, width: `${(7 / TOTAL_DAYS) * 100}%`,
                         opacity: c.severity === "severe" ? 1 : 0.55 }}>
                {c.severity === "severe" && <span className="advisory-tag">WK {c.week}</span>}
              </div>
            ))}
            {todayPct >= 0 && todayPct <= 100 && (
              <div className="today-line" style={{ left: `${todayPct}%` }}>
                <span className="mono" style={{ position: "absolute", top: -16, left: -14, fontSize: 9,
                  color: "var(--signal)", letterSpacing: ".1em" }}>NOW</span>
              </div>
            )}
          </div>

          {COURSES.map((c, ci) => (
            <div key={c.code} className="rail-row">
              <div className="rail-name">
                <Bullet course={c} size="md" />
                <span className="rail-code">{c.code.split(" ")[0]}</span>
              </div>
              <div className="rail-track">
                <div className="rail-line" style={{ background: c.color }} />
                {ASSESSMENTS.filter((a) => a.course === c.code && a.date).map((a, ai) => {
                  const size = Math.min(22, Math.max(11, 9 + a.w / 2.2));
                  const on = selected?.id === a.id;
                  return (
                    <button key={a.id} className="station anim-pop" data-on={on ? "1" : "0"}
                      onClick={() => onSelect(on ? null : a)}
                      title={`${a.title} — ${fmtShort(a.date)} — ${a.w}% of grade`}
                      aria-label={`${c.code} ${a.title}, due ${fmtShort(a.date)}, worth ${a.w} percent`}
                      style={{ left: `${leftPct(a.date)}%`, width: size, height: size,
                        background: a.conf === "explicit" ? c.color : "#fff",
                        borderColor: on ? "var(--signal)" : "var(--ink)",
                        animationDelay: `${300 + ci * 110 + ai * 55}ms` }} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Forecast({ collisions }) {
  const data = Array.from({ length: WEEKS }, (_, i) => {
    const w = collisions.find((c) => c.week === i + 1);
    return w ? w.share : 0;
  });
  const max = Math.max(...data, 12);
  const W = 100, H = 34;
  const pts = data.map((v, i) => `${(i / (WEEKS - 1)) * W},${H - (v / max) * H}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 74, display: "block" }}>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="rgba(228,87,46,.16)" />
      <polyline points={pts} fill="none" stroke="var(--alert)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      {data.map((v, i) => v > 0 && (
        <circle key={i} cx={(i / (WEEKS - 1)) * W} cy={H - (v / max) * H} r="0.9" fill="var(--alert)" />
      ))}
    </svg>
  );
}

function SystemStatus({ collisions, totalHours }) {
  const severe = collisions.filter((c) => c.severity === "severe").length;
  const heavy = collisions.filter((c) => c.severity === "heavy").length;
  const uncertain = ASSESSMENTS.filter((a) => a.conf !== "explicit").length;

  return (
    <div className="status-strip">
      <div className="status-tile">
        <div className="eyebrow">Service advisories</div>
        <strong>{severe} critical · {heavy} heavy</strong>
        <p className="tiny" style={{ margin: 0 }}>Collision weeks are flagged like transit delays.</p>
      </div>
      <div className="status-tile" style={{ borderLeftColor: "var(--go)" }}>
        <div className="eyebrow">Prep budget</div>
        <strong>{totalHours} study hours</strong>
        <p className="tiny" style={{ margin: 0 }}>Generated from assessment weight and difficulty.</p>
      </div>
      <div className="status-tile" style={{ borderLeftColor: "var(--alert)" }}>
        <div className="eyebrow">Needs confirmation</div>
        <strong>{uncertain} fuzzy dates</strong>
        <p className="tiny" style={{ margin: 0 }}>Inferred and unknown dates stay visibly marked.</p>
      </div>
    </div>
  );
}

function CanvasView({ today, onExport, onPanic }) {
  const [sel, setSel] = useState(null);
  const collisions = useMemo(() => findCollisions(ASSESSMENTS), []);
  const hot = collisions.filter((c) => c.severity !== "normal");
  const worst = collisions.reduce((a, b) => (b.share > a.share ? b : a), collisions[0]);
  const totalHours = ASSESSMENTS.reduce((s, a) => s + (a.date ? a.hours : 0), 0);

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Fall 2026 · 5 courses · 16 weeks</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>The semester canvas</h2>
          <p className="lede">
            Each line is a course. Each station is something you are graded on, sized by how
            much of your grade it carries. Hollow stations are dates your syllabus never
            actually committed to.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onExport}>Export to calendar (.ics)</button>
      </div>

      <div className="card" style={{ display: "flex", gap: 36, flexWrap: "wrap", marginBottom: 18 }}>
        <Stat n={ASSESSMENTS.filter((a) => a.date).length} label="Graded events" />
        <Stat n={hot.length} label="Collision weeks" tone="var(--alert)" />
        <Stat n={`Wk ${worst.week}`} label="Heaviest week" tone="var(--alert)" />
        <Stat n={`${totalHours}h`} label="Prep hours ahead" />
        <Stat n={ASSESSMENTS.filter((a) => a.conf !== "explicit").length} label="Uncertain dates" tone="#8A6510" />
      </div>

      <SystemStatus collisions={collisions} totalHours={totalHours} />

      <div className="panel-dark" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div className="eyebrow" style={{ color: "var(--signal)" }}>Semester diagram</div>
          <div className="tiny mono" style={{ color: "#8A8898", fontSize: 10.5 }}>
            ▨ hatched = collision week · ○ hollow = date unconfirmed · size = grade weight
          </div>
        </div>
        <Rail collisions={collisions} selected={sel} onSelect={setSel} today={today} />
      </div>

      {sel && (() => {
        const c = courseBy(sel.course);
        return (
          <div className="card anim-up" style={{ marginBottom: 18, borderLeft: `4px solid ${c.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Bullet course={c} size="md" />
                  <span className="eyebrow">{c.code} · {TYPE_GLYPH[sel.type]}</span>
                </div>
                <div className="d3">{sel.title}</div>
                <div className="mono" style={{ fontSize: 13, marginTop: 8, color: "var(--muted)" }}>
                  {fmtShort(sel.date)} · week {weekOf(sel.date)} ·{" "}
                  {Math.max(0, Math.round((parseISO(sel.date) - today) / 864e5))} days out
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="stat-n">{sel.w}%</div>
                <div className="eyebrow">of final grade</div>
                <div className="mono tiny" style={{ marginTop: 8 }}>~{sel.hours}h of prep budgeted</div>
              </div>
            </div>
            <hr className="rule" />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {sel.conf !== "explicit" && (
                <span className="chip chip-warn">
                  {sel.conf === "unknown" ? "NO DATE IN SYLLABUS" : "DATE INFERRED — CONFIRM IT"}
                </span>
              )}
              <button className="btn btn-alert" onClick={() => onPanic(sel.id)}>
                Panic mode — rebuild my plan around this
              </button>
            </div>
          </div>
        );
      })()}

      <div className="grid-2">
        <div className="card">
          <div className="eyebrow">Service advisories</div>
          <p className="tiny" style={{ margin: "8px 0 16px" }}>
            Weeks where enough of your grade lands at once that no single syllabus warned you.
          </p>
          {hot.map((c) => (
            <div key={c.week} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <div className="d3" style={{ fontSize: 15 }}>
                  Week {c.week} · {weekStart(c.week).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </div>
                <span className={`chip ${c.severity === "severe" ? "chip-alert" : "chip-warn"}`}>
                  {c.share}% OF THE SEMESTER
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 7 }}>
                {c.list.map((a) => (
                  <span key={a.id} className="chip" style={{ borderColor: courseBy(a.course).color }}>
                    <Bullet course={a.course} size="sm" /> {TYPE_GLYPH[a.type]} · {a.w}%
                  </span>
                ))}
              </div>
              <div className="bar">
                <i style={{ width: `${Math.min(100, c.share * 3.5)}%`,
                            background: c.severity === "severe" ? "var(--alert)" : "var(--signal)" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="eyebrow">Workload forecast</div>
          <p className="tiny" style={{ margin: "8px 0 12px" }}>
            Share of your entire semester grade decided in each week, all five courses combined.
          </p>
          <Forecast collisions={collisions} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span className="mono tiny">Wk 1</span><span className="mono tiny">Wk 8</span><span className="mono tiny">Finals</span>
          </div>
          <hr className="rule" />
          <div className="card-flat">
            <div className="eyebrow" style={{ marginBottom: 6 }}>The one thing to know</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>
              <strong>Week {worst.week}</strong> decides <strong>{worst.share}%</strong> of your
              whole semester across {worst.courses} courses, in {worst.exams} exams. Everything
              before it is preparation for it, whether you plan that way or not.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- 4. AVAILABILITY ------------------------------ */

function Availability({ extraBusy, setExtraBusy, constraints, setConstraints, daysOff, setDaysOff,
                        maxPerDay, setMaxPerDay, commuteBuffer, setCommuteBuffer, onBuild }) {
  const [paint, setPaint] = useState(null);
  const [form, setForm] = useState({ label: "", days: [], s: 17, e: 20 });
  const avail = useMemo(() => buildAvailability(extraBusy, constraints, daysOff, commuteBuffer),
                        [extraBusy, constraints, daysOff, commuteBuffer]);

  const toggle = (d, h) => {
    const k = `${d}-${h}`;
    if (avail[k] === "class") return;
    setExtraBusy((p) => ({ ...p, [k]: !p[k] }));
  };
  const freeCount = Object.values(avail).filter((v) => v === "free").length;

  return (
    <div onMouseUp={() => setPaint(null)} onMouseLeave={() => setPaint(null)}>
      <div className="head">
        <div>
          <div className="eyebrow">Step two</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>When can you actually study?</h2>
          <p className="lede">
            Your class times are already blocked. Add the rest of your life — the shift, the
            commute, practice, the day you refuse to give up. The plan is built only from
            what is left.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="stat-n">{freeCount}h</div>
          <div className="eyebrow">free per week</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: "auto", marginBottom: 18 }}>
        <div className="avail">
          <div />
          {DAYS.map((d, i) => (
            <button key={d} className="avail-h" onClick={() =>
              setDaysOff((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
              style={{ fontWeight: daysOff.includes(i) ? 700 : 400,
                       color: daysOff.includes(i) ? "var(--alert)" : "var(--muted)" }}>
              {d}{daysOff.includes(i) ? " ✕" : ""}
            </button>
          ))}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <div className="avail-t">{hourLabel(h)}</div>
              {DAYS.map((_, d) => {
                const k = `${d}-${h}`;
                const s = avail[k] === "class" ? "busy" : avail[k];
                const cls = COURSES.find((c) => c.meets.some((m) => m.d === d && h >= m.s && h < m.e));
                return (
                  <div key={k} className="slot" data-s={s}
                    onMouseDown={() => { setPaint(true); toggle(d, h); }}
                    onMouseEnter={() => paint && toggle(d, h)}
                    title={cls ? `${cls.code} · ${cls.room}` : s === "commute" ? "Commute buffer" : s === "off" ? "Day off" : s === "busy" ? "Blocked" : "Free"}
                    style={cls ? { background: cls.color, borderColor: cls.color } : undefined} />
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14 }}>
          {[["#fff", "Free"], ["var(--ink3)", "Blocked"], ["var(--signal)", "Commute buffer"], ["var(--bone3)", "Day off"], ["#D6352B", "Class"]].map(([c, l]) => (
            <span key={l} className="tiny" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i style={{ width: 12, height: 12, borderRadius: 2, background: c, border: "1px solid var(--bone3)" }} />{l}
            </span>
          ))}
          <span className="tiny" style={{ marginLeft: "auto" }}>Click and drag to block hours. Click a day name to take it off entirely.</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="eyebrow">Standing commitments</div>
          <div style={{ margin: "12px 0" }}>
            {constraints.map((k) => (
              <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                   padding: "9px 0", borderBottom: "1px solid var(--bone2)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{k.label}</div>
                  <div className="mono tiny">
                    {k.days.map((d) => DAYS[d]).join(" ")} · {hourLabel(k.s)}–{hourLabel(k.e)}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}
                  onClick={() => setConstraints((p) => p.filter((x) => x.id !== k.id))}>Remove</button>
              </div>
            ))}
          </div>
          <div className="card-flat">
            <input placeholder="What is it? e.g. Shift at Trader Joe's" value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              style={{ width: "100%", padding: "9px 10px", borderRadius: 4, border: "1px solid var(--bone3)", marginBottom: 9 }} />
            <div style={{ display: "flex", gap: 4, marginBottom: 9, flexWrap: "wrap" }}>
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => setForm({ ...form,
                    days: form.days.includes(i) ? form.days.filter((x) => x !== i) : [...form.days, i] })}
                  className="chip" style={{ background: form.days.includes(i) ? "var(--ink)" : "#fff",
                    color: form.days.includes(i) ? "var(--bone)" : "var(--ink)" }}>{d}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={form.s} onChange={(e) => setForm({ ...form, s: +e.target.value })}
                style={{ padding: "7px 8px", borderRadius: 4, border: "1px solid var(--bone3)", background: "#fff" }}>
                {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
              </select>
              <span className="tiny">to</span>
              <select value={form.e} onChange={(e) => setForm({ ...form, e: +e.target.value })}
                style={{ padding: "7px 8px", borderRadius: 4, border: "1px solid var(--bone3)", background: "#fff" }}>
                {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
              </select>
              <button className="btn btn-primary" style={{ marginLeft: "auto", padding: "8px 14px" }}
                disabled={!form.label || !form.days.length || form.e <= form.s}
                onClick={() => { setConstraints((p) => [...p, { ...form, id: `k${Date.now()}` }]);
                                 setForm({ label: "", days: [], s: 17, e: 20 }); }}>Add</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">How hard do you want to go?</div>
          <p className="tiny" style={{ margin: "8px 0 16px" }}>
            The ceiling on study hours in any one day. Set it honestly. A plan you ignore
            is worse than no plan.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min="1" max="8" value={maxPerDay}
              onChange={(e) => setMaxPerDay(+e.target.value)} style={{ flex: 1, accentColor: "var(--ink)" }} />
            <div style={{ width: 72, textAlign: "right" }}>
              <span className="stat-n" style={{ fontSize: 26 }}>{maxPerDay}</span>
              <span className="mono tiny"> hrs</span>
            </div>
          </div>
          <hr className="rule" />
          <div className="card-flat" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>MTA buffer</div>
            <p className="tiny" style={{ marginBottom: 12 }}>
              Protect travel time around every class, so the planner does not schedule a
              study block when you need to get across campus or across boroughs.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min="0" max="2" value={commuteBuffer}
                onChange={(e) => setCommuteBuffer(+e.target.value)}
                style={{ flex: 1, accentColor: "var(--signal)" }} />
              <div style={{ width: 88, textAlign: "right" }}>
                <span className="stat-n" style={{ fontSize: 26 }}>{commuteBuffer}</span>
                <span className="mono tiny"> hr buffer</span>
              </div>
            </div>
          </div>
          <div className="card-flat" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Reality check</div>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              You have <strong>{freeCount} free hours</strong> a week and{" "}
              <strong>{ASSESSMENTS.reduce((s, a) => s + (a.date ? a.hours : 0), 0)} hours</strong> of
              prep ahead of you. At {maxPerDay} hours a day you are working with about{" "}
              <strong>{maxPerDay * (7 - daysOff.length)} hours a week</strong> of capacity.
            </p>
          </div>
          <button className="btn btn-signal" style={{ width: "100%", justifyContent: "center" }} onClick={onBuild}>
            Build my study plan →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 5. STUDY PLAN ------------------------------ */

function Plan({ plan, panicId, onClearPanic, onExport, today, maxPerDay }) {
  const [range, setRange] = useState(14);
  const days = plan.days.slice(0, range);
  const totalBlocks = plan.days.reduce((s, d) => s + d.blocks.reduce((x, b) => x + (b.e - b.s), 0), 0);
  const panic = panicId ? ASSESSMENTS.find((a) => a.id === panicId) : null;

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Step three</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>Your study plan</h2>
          <p className="lede">
            Built from your free hours only, weighted by what each thing is worth and how
            soon it lands. Nothing is scheduled during class, work, or a day you took off.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onExport}>Export to calendar (.ics)</button>
      </div>

      {panic && (
        <div className="card anim-up" style={{ background: "var(--alert)", color: "#fff", border: "none", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,.8)" }}>Panic mode active</div>
              <div className="d3" style={{ marginTop: 6 }}>Everything is bending around {panic.title}</div>
              <p className="tiny" style={{ color: "rgba(255,255,255,.85)", marginTop: 6 }}>
                Other courses get the leftovers until {fmtShort(panic.date)}. This is a trade, not a free win.
              </p>
            </div>
            <button className="btn" style={{ background: "#fff", color: "var(--alert)", fontWeight: 700 }}
              onClick={onClearPanic}>Back to balanced</button>
          </div>
        </div>
      )}

      <div className="card" style={{ display: "flex", gap: 34, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
        <Stat n={`${totalBlocks}h`} label="Scheduled this semester" />
        <Stat n={days.filter((d) => d.blocks.length).length} label={`Study days in next ${range}`} />
        <Stat n={plan.unmet.length} label="Under-served items" tone={plan.unmet.length ? "var(--alert)" : "var(--go)"} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[7, 14, 30].map((r) => (
            <button key={r} className="chip" onClick={() => setRange(r)}
              style={{ background: range === r ? "var(--ink)" : "#fff", color: range === r ? "var(--bone)" : "var(--ink)" }}>
              {r} DAYS
            </button>
          ))}
        </div>
      </div>

      {plan.unmet.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid var(--alert)", marginBottom: 18 }}>
          <div className="eyebrow" style={{ color: "var(--alert)" }}>Honest warning</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "8px 0 0" }}>
            {plan.unmet.length} item{plan.unmet.length > 1 ? "s" : ""} could not get full prep time
            inside your constraints: {plan.unmet.slice(0, 3).map(([id]) => {
              const a = ASSESSMENTS.find((x) => x.id === id);
              return a ? `${a.course} ${a.title.toLowerCase()}` : "";
            }).join(", ")}
            {plan.unmet.length > 3 ? ", and others" : ""}. Either raise your daily ceiling above {maxPerDay}h,
            give back a day off, or decide now which one you are willing to do a worse job on.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {days.map((d, i) => {
          const isToday = i === 0;
          const hours = d.blocks.reduce((s, b) => s + (b.e - b.s), 0);
          const due = ASSESSMENTS.filter((a) => a.date === iso(d.date));
          return (
            <div key={iso(d.date)} className="card"
              style={{ padding: 14, opacity: d.off ? 0.62 : 1,
                       borderLeft: isToday ? "4px solid var(--signal)" : "1px solid var(--bone2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span className="d3" style={{ fontSize: 15 }}>{isToday ? "Today" : fmtLong(d.date)}</span>
                  <span className="mono tiny">wk {Math.max(1, weekOf(iso(d.date)))}</span>
                </div>
                <span className="mono tiny">
                  {d.off ? "DAY OFF" : hours ? `${hours}h scheduled` : "no study blocks"}
                </span>
              </div>
              {due.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {due.map((a) => (
                    <span key={a.id} className="chip chip-alert">
                      <Bullet course={a.course} size="sm" /> DUE — {a.title} · {a.w}%
                    </span>
                  ))}
                </div>
              )}
              {d.blocks.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 11 }}>
                  {d.blocks.map((b, j) => {
                    const c = courseBy(b.a.course);
                    const daysOut = Math.round((parseISO(b.a.date) - d.date) / 864e5);
                    return (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 10,
                           padding: "8px 10px", borderRadius: 4, background: "var(--bone)",
                           borderLeft: `3px solid ${c.color}` }}>
                        <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, width: 92, flex: "0 0 92px" }}>
                          {hourLabel(b.s)}–{hourLabel(b.e)}
                        </span>
                        <Bullet course={c} size="sm" />
                        <span style={{ fontSize: 14, fontWeight: 500, minWidth: 0, flex: 1 }}>{b.a.title}</span>
                        <span className="chip" style={{ flex: "0 0 auto" }}>
                          {daysOut === 0 ? "DUE TODAY" : `${daysOut}D OUT`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------- 6. COURSE VAULT + STUDY TOOLS ---------------------- */

function GradeSim({ course, items }) {
  const [scores, setScores] = useState(() => Object.fromEntries(items.map((a) => [a.id, 85])));
  const totalW = items.reduce((s, a) => s + a.w, 0);
  const projected = items.reduce((s, a) => s + (scores[a.id] * a.w) / 100, 0) / (totalW / 100);
  const letter = projected >= 93 ? "A" : projected >= 90 ? "A−" : projected >= 87 ? "B+"
    : projected >= 83 ? "B" : projected >= 80 ? "B−" : projected >= 77 ? "C+"
    : projected >= 70 ? "C" : projected >= 60 ? "D" : "F";
  const tone = projected >= 87 ? "var(--go)" : projected >= 75 ? "var(--signal)" : "var(--alert)";

  return (
    <div className="card">
      <div className="eyebrow">Grade simulator</div>
      <p className="tiny" style={{ margin: "8px 0 16px" }}>
        Drag each one to see where you land. Weights come straight out of the syllabus.
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 18 }}>
        <div>
          <div className="stat-n" style={{ fontSize: 44, color: tone }}>{letter}</div>
          <div className="eyebrow">projected</div>
        </div>
        <div className="mono" style={{ fontSize: 22, color: tone, paddingBottom: 4 }}>{projected.toFixed(1)}%</div>
      </div>
      {items.map((a) => (
        <div key={a.id} style={{ marginBottom: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{a.title}</span>
            <span className="mono tiny">{a.w}% · you: {scores[a.id]}</span>
          </div>
          <input type="range" min="0" max="100" value={scores[a.id]}
            onChange={(e) => setScores({ ...scores, [a.id]: +e.target.value })}
            style={{ width: "100%", accentColor: course.color }} />
        </div>
      ))}
      <div className="card-flat" style={{ marginTop: 6 }}>
        <p className="tiny" style={{ margin: 0 }}>
          {(() => {
            const fin = items.find((a) => /final/i.test(a.title));
            if (!fin) return "Set each slider to what you realistically expect, not what you hope for.";
            const others = items.filter((a) => a.id !== fin.id);
            const got = others.reduce((s, a) => s + (scores[a.id] * a.w) / 100, 0);
            const need = ((90 * totalW) / 100 - got) / (fin.w / 100);
            return need > 100
              ? `An A− is already out of reach at these scores. Aim at protecting a B.`
              : `To finish at an A−, you need about ${Math.max(0, Math.round(need))}% on the ${fin.title.toLowerCase()}.`;
          })()}
        </p>
      </div>
    </div>
  );
}

function Flashcards({ cards, color }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [known, setKnown] = useState([]);
  const card = cards[i % cards.length];
  const next = (got) => {
    setKnown((p) => (got ? [...new Set([...p, card.q])] : p.filter((x) => x !== card.q)));
    setFlip(false);
    setTimeout(() => setI((p) => (p + 1) % cards.length), 180);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="mono tiny">CARD {(i % cards.length) + 1} / {cards.length}</span>
        <span className="chip chip-go">{known.length} LOCKED IN</span>
      </div>
      <div className="fc" data-flip={flip ? "1" : "0"} onClick={() => setFlip((f) => !f)}>
        <div className="fc-in">
          <div className="fc-face" style={{ borderTop: `4px solid ${color}` }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Question</div>
            <div className="d3" style={{ fontSize: 20, lineHeight: 1.3 }}>{card.q}</div>
            <div className="tiny" style={{ marginTop: 18 }}>Tap to reveal</div>
          </div>
          <div className="fc-face fc-back">
            <div className="eyebrow" style={{ marginBottom: 14, color: "var(--signal)" }}>Answer</div>
            <div style={{ fontSize: 16, lineHeight: 1.5 }}>{card.a}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => next(false)}>
          Show me again
        </button>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => next(true)}>
          I know this
        </button>
      </div>
    </div>
  );
}

function makeCards(course) {
  return course.topics.map((t) => ({
    q: t,
    a: GENERATED_DEFS[t] || `Gemini writes this definition from the material you upload for ${course.code}.`,
  }));
}

const GENERATED_DEFS = {
  "Amortized analysis": "Averaging the cost of an operation over a worst-case sequence, so one expensive resize is paid for by the many cheap inserts around it.",
  "Red-black trees": "A self-balancing BST that keeps height at O(log n) using color rules and rotations, rather than storing explicit balance factors.",
  "Hash collision strategies": "Chaining stores colliding keys in a bucket list. Open addressing probes for the next open slot. Load factor decides which one hurts less.",
  "Graph traversal": "BFS explores by distance and finds shortest unweighted paths. DFS explores by depth and exposes cycles and topological order.",
  "Dynamic programming": "Solve overlapping subproblems once and reuse the answers. The hard part is defining the state, never the recursion.",
  "Big-O vs Big-Theta": "Big-O is an upper bound and can be loose. Big-Theta is a tight bound. Saying an algorithm is O(n²) when it is Θ(n) is true but useless.",
  "Pipelining hazards": "Structural hazards fight over hardware, data hazards need a value that is not ready yet, control hazards guess wrong about a branch.",
  "Cache associativity": "How many places a block may live. Direct-mapped is one, fully associative is anywhere, n-way is a compromise that costs comparators.",
  "Two's complement": "Negate by flipping bits and adding one. It gives one zero and lets the same adder handle signed and unsigned arithmetic.",
  "MIPS addressing modes": "Register, immediate, base-plus-offset, PC-relative, and pseudo-direct. Load-store means memory is touched only by lw and sw.",
  "Amdahl's Law": "Speedup is capped by the part you did not parallelize. Making 90% of the work infinitely fast still leaves you a 10x ceiling.",
  "Branch prediction": "Guess the branch outcome to keep the pipeline full. A wrong guess costs the whole pipeline flush, so accuracy matters more than speed.",
  "Marginal rate of substitution": "The slope of an indifference curve — how much of one good you would give up for one more unit of another and stay equally happy.",
  "Deadweight loss": "Trades that would have made both sides better off but did not happen, usually because a tax, price floor, or market power blocked them.",
  "Nash equilibrium": "A set of strategies where nobody gains by unilaterally changing theirs. It need not be efficient, as the prisoner's dilemma proves.",
  "Price elasticity": "Percent change in quantity over percent change in price. Above one is elastic, and revenue moves opposite to price.",
  "Consumer surplus": "The gap between what you would have paid and what you did pay, summed across buyers. It is the area under demand and above price.",
  "Isoquants and returns to scale": "Isoquants map input combinations giving equal output. Doubling all inputs and more than doubling output is increasing returns.",
  "Proof by induction": "Prove the base case, assume it for n, prove it for n+1. The assumption is the hypothesis, not a circular argument.",
  "Pigeonhole principle": "With more items than containers, some container holds at least two. Trivial to state, and the entire trick is choosing the containers.",
  "Equivalence relations": "Reflexive, symmetric, and transitive together. Any such relation carves the set into disjoint equivalence classes.",
  "Generating functions": "Encode a sequence as coefficients of a power series so that recurrences become algebra you can actually solve.",
  "Graph coloring": "Assign colors so no adjacent vertices match. The chromatic number bounds scheduling problems, register allocation included.",
  "Recurrence relations": "Define a term using earlier terms. Solve by substitution, characteristic roots, or the Master Theorem when it applies.",
  "Close reading": "Argue from the sentence itself — diction, syntax, image — rather than from what the book is broadly about.",
  "Thesis architecture": "A claim someone could disagree with, plus the reason it matters. If nobody could argue back, it is a summary.",
  "Free indirect discourse": "Third-person narration that borrows a character's voice and judgment without quotation marks or attribution.",
  "Citation ethics": "Cite to show the reader where your thinking came from and where it departs, not to prove you did the reading.",
  "Counterargument framing": "State the strongest version of the objection. A weak version you knock down makes your own argument look weaker.",
  "Revision as re-seeing": "Revision changes the argument. Editing changes the sentences. Doing only the second is why drafts stay stuck.",
};

function Quiz({ course, cards }) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const pool = useMemo(() => Object.entries(GENERATED_DEFS), []);
  const q = cards[qi % cards.length];
  const options = useMemo(() => {
    const wrong = pool.filter(([k]) => k !== q.q).sort(() => Math.random() - 0.5).slice(0, 3).map(([, v]) => v);
    return [q.a, ...wrong].sort(() => Math.random() - 0.5);
  }, [qi, q.q, q.a, pool]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="mono tiny">QUESTION {(qi % cards.length) + 1} / {cards.length}</span>
        <span className="chip chip-go">SCORE {score}</span>
      </div>
      <div className="d3" style={{ fontSize: 18, marginBottom: 16 }}>
        Which of these describes <span style={{ color: course.color }}>{q.q}</span>?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o, i) => {
          const isRight = o === q.a;
          const show = picked !== null;
          return (
            <button key={i} disabled={show} onClick={() => { setPicked(o); if (isRight) setScore((s) => s + 1); }}
              style={{ textAlign: "left", padding: "12px 14px", borderRadius: 5, fontSize: 14, lineHeight: 1.45,
                border: `1px solid ${show && isRight ? "var(--go)" : show && o === picked ? "var(--alert)" : "var(--bone2)"}`,
                background: show && isRight ? "rgba(46,158,107,.1)" : show && o === picked ? "rgba(228,87,46,.1)" : "#fff" }}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button className="btn btn-primary anim-up" style={{ marginTop: 14 }}
          onClick={() => { setPicked(null); setQi((p) => p + 1); }}>Next question</button>
      )}
    </div>
  );
}

function CourseVault({ course, today }) {
  const [tab, setTab] = useState("overview");
  const [material, setMaterial] = useState([]);
  const [gen, setGen] = useState(false);
  const items = ASSESSMENTS.filter((a) => a.course === course.code);
  const upcoming = items.filter((a) => !a.date || parseISO(a.date) >= today);
  const cards = useMemo(() => makeCards(course), [course.code]);
  const decided = items.reduce((s, a) => s + a.w, 0);

  const TABS = [["overview", "Overview"], ["vault", "Material vault"],
                ["cards", "Flashcards"], ["quiz", "Quiz me"], ["grade", "Grade simulator"]];

  return (
    <div>
      <div className="head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <Bullet course={course} size="lg" />
            <div>
              <div className="eyebrow">{course.code} · {course.instructor}</div>
              <h2 className="d2" style={{ margin: "4px 0 0" }}>{course.title}</h2>
            </div>
          </div>
          <p className="mono tiny">
            {course.meets.map((m) => `${DAYS[m.d]} ${hourLabel(m.s)}–${hourLabel(m.e)}`).join(" · ")} · {course.room}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {TABS.map(([k, l]) => (
          <button key={k} className="chip" onClick={() => setTab(k)}
            style={{ background: tab === k ? course.color : "#fff", color: tab === k ? "#fff" : "var(--ink)",
                     borderColor: tab === k ? course.color : "var(--bone3)", padding: "6px 12px", fontSize: 11.5 }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid-2">
          <div className="card">
            <div className="eyebrow">Where your grade comes from</div>
            <div style={{ marginTop: 14 }}>
              {course.grading.map((g) => (
                <div key={g.cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {g.cat} {g.drops && <span className="chip chip-go" style={{ marginLeft: 6 }}>DROPS LOWEST</span>}
                    </span>
                    <span className="mono tiny">{g.w}%</span>
                  </div>
                  <div className="bar"><i style={{ width: `${g.w}%`, background: course.color }} /></div>
                </div>
              ))}
            </div>
            <hr className="rule" />
            <div className="eyebrow" style={{ marginBottom: 8 }}>Policies, in plain language</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>
              <strong>Late work.</strong> {course.late}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              <strong>Attendance.</strong> {course.attendance}
            </p>
          </div>
          <div className="card">
            <div className="eyebrow">What is still ahead</div>
            <div style={{ marginTop: 12 }}>
              {upcoming.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                     gap: 10, padding: "10px 0", borderBottom: "1px solid var(--bone2)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500 }}>{a.title}</div>
                    <div className="mono tiny">
                      {a.date ? `${fmtShort(a.date)} · ${Math.round((parseISO(a.date) - today) / 864e5)} days out` : "no date given"}
                    </div>
                  </div>
                  <span className="chip" style={{ borderColor: course.color, flex: "0 0 auto" }}>{a.w}%</span>
                </div>
              ))}
            </div>
            <div className="card-flat" style={{ marginTop: 16 }}>
              <p className="tiny" style={{ margin: 0 }}>
                <strong>{decided}%</strong> of this course is still undecided as of today. That is how
                much leverage you have left here.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "vault" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="eyebrow">Drop in anything the exam will cover</div>
            <p className="lede" style={{ fontSize: 14.5, margin: "8px 0 16px" }}>
              Lecture slides, your notes, the review sheet, a photo of the whiteboard. Gemini reads
              them alongside the syllabus so the study tools match what {course.instructor.split(" ")[1]} actually tests.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => {
                setMaterial((p) => [...p, { name: `lecture_${p.length + 8}_slides.pdf`, n: 24 + p.length * 3 }]);
              }}>Add material</button>
              {material.length > 0 && (
                <button className="btn btn-signal" onClick={() => { setGen(true); setTimeout(() => setTab("cards"), 900); }}>
                  {gen ? "Generating…" : "Generate study tools"}
                </button>
              )}
            </div>
          </div>
          {material.length === 0 ? (
            <Empty title="The vault is empty" body={`Nothing uploaded for ${course.code} yet. Add slides or notes and the flashcards below stop being generic.`} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {material.map((m, i) => (
                <div key={i} className="card anim-up" style={{ padding: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{m.name}</div>
                    <div className="tiny">{m.n} slides · {course.topics.length} concepts recognised</div>
                  </div>
                  <span className="chip chip-go">INDEXED</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "cards" && (
        <div style={{ maxWidth: 560 }}>
          <p className="lede" style={{ fontSize: 14.5, marginBottom: 16 }}>
            {material.length
              ? `Generated from ${material.length} file${material.length > 1 ? "s" : ""} in your vault plus the syllabus topic list.`
              : "Generated from the topic list in the syllabus. Add material in the vault to make these sharper."}
          </p>
          <Flashcards cards={cards} color={course.color} />
        </div>
      )}

      {tab === "quiz" && <div style={{ maxWidth: 620 }} className="card"><Quiz course={course} cards={cards} /></div>}
      {tab === "grade" && <div style={{ maxWidth: 560 }}><GradeSim course={course} items={items} /></div>}
    </div>
  );
}

/* --------------------------- policy cheat sheet ---------------------------- */

function Policies() {
  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Cross-course reference</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>Every policy, on one page</h2>
          <p className="lede">
            Five syllabi have five different rules about being late. This is the page you
            actually need at 11:40pm.
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {COURSES.map((c) => (
          <div key={c.code} className="card" style={{ borderLeft: `4px solid ${c.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Bullet course={c} size="md" />
              <div>
                <div className="d3" style={{ fontSize: 16 }}>{c.code}</div>
                <div className="tiny">{c.instructor} · {c.room}</div>
              </div>
            </div>
            <div className="grid-2">
              <div className="card-flat">
                <div className="eyebrow" style={{ marginBottom: 6 }}>If you are late</div>
                <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{c.late}</p>
              </div>
              <div className="card-flat">
                <div className="eyebrow" style={{ marginBottom: 6 }}>If you miss class</div>
                <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{c.attendance}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ .ics export -------------------------------- */

function buildICS(plan) {
  const stamp = (d, h) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}0000`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CUNY Course Canvas//EN", "CALSCALE:GREGORIAN"];
  ASSESSMENTS.filter((a) => a.date).forEach((a) => {
    const d = parseISO(a.date);
    lines.push("BEGIN:VEVENT", `UID:${a.id}@coursecanvas`,
      `DTSTART:${stamp(d, 9)}`, `DTEND:${stamp(d, 10)}`,
      `SUMMARY:${a.course} — ${a.title} (${a.w}%)`,
      `DESCRIPTION:Worth ${a.w}% of your final grade. Date confidence: ${a.conf}.`,
      "END:VEVENT");
  });
  plan.days.forEach((day) =>
    day.blocks.forEach((b, i) => {
      lines.push("BEGIN:VEVENT", `UID:s${iso(day.date)}-${i}@coursecanvas`,
        `DTSTART:${stamp(day.date, b.s)}`, `DTEND:${stamp(day.date, b.e)}`,
        `SUMMARY:Study — ${b.a.course}: ${b.a.title}`, "END:VEVENT");
    })
  );
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/* --------------------------- the Gemini seam -------------------------------
   The ONLY place this prototype fakes anything. In the real app this posts
   your files to /api/parse, which calls Gemini with a responseSchema and
   returns an object shaped exactly like { courses, assessments } above.
   See parse-route.ts in this repo for the server side.                      */

async function askGemini({ files }) {                            // eslint-disable-line
  // const body = new FormData();
  // files.forEach((f) => body.append("files", f));
  // const res = await fetch("/api/parse", { method: "POST", body });
  // return await res.json();
  await new Promise((r) => setTimeout(r, 900));
  return { courses: COURSES, assessments: ASSESSMENTS };
}

/* --------------------------------- APP ------------------------------------ */

export default function CourseCanvas() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("upload");
  const [courseCode, setCourseCode] = useState(null);
  const [extraBusy, setExtraBusy] = useState({});
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [daysOff, setDaysOff] = useState([0]);
  const [maxPerDay, setMaxPerDay] = useState(4);
  const [commuteBuffer, setCommuteBuffer] = useState(1);
  const [panicId, setPanicId] = useState(null);
  const [ics, setIcs] = useState(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t < SEMESTER_START ? SEMESTER_START : t;
  }, []);

  const availability = useMemo(() => buildAvailability(extraBusy, constraints, daysOff, commuteBuffer),
    [extraBusy, constraints, daysOff, commuteBuffer]);
  const plan = useMemo(() => buildPlan({ availability, daysOff, maxPerDay, today, panicId }),
    [availability, daysOff, maxPerDay, today, panicId]);

  const exportICS = () => setIcs(buildICS(plan));
  const download = () => {
    try {
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "course-canvas.ics"; a.click();
      URL.revokeObjectURL(url);
    } catch { /* sandbox blocked it — the copy box below still works */ }
  };

  if (!user) return <Login onEnter={(e) => { setUser(e); setView("upload"); }} />;

  const NAV = [
    ["Semester", [["canvas", "Canvas"], ["upload", "Syllabi"], ["policies", "Policies"]]],
    ["Planning", [["availability", "Availability"], ["plan", "Study plan"]]],
  ];

  return (
    <div className="cc">
      <style>{CSS}</style>
      <div className="shell">
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-mark">CC</div>
            <div className="nav-name">Course<br />Canvas</div>
          </div>

          {NAV.map(([label, items]) => (
            <div key={label} className="nav-group">
              <div className="nav-label">{label}</div>
              {items.map(([k, l]) => (
                <button key={k} className="nav-item" data-on={view === k ? "1" : "0"}
                  onClick={() => { setView(k); setCourseCode(null); }}>
                  <span className="nav-tick" />{l}
                </button>
              ))}
            </div>
          ))}

          <div className="nav-group">
            <div className="nav-label">Courses</div>
            {COURSES.map((c) => (
              <button key={c.code} className="nav-item"
                data-on={view === "course" && courseCode === c.code ? "1" : "0"}
                onClick={() => { setView("course"); setCourseCode(c.code); }}>
                <Bullet course={c} size="sm" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.code.split(" ")[0]} {c.code.split(" ")[1].slice(0, 3)}
                </span>
              </button>
            ))}
          </div>

          <div className="nav-foot">
            <div className="mono" style={{ fontSize: 10.5, color: "#7E7C8E", marginBottom: 3 }}>SIGNED IN</div>
            <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{user}</div>
            <button className="nav-item" style={{ marginTop: 8, padding: "6px 0" }} onClick={() => setUser(null)}>
              Sign out
            </button>
          </div>
        </nav>

        <main className="main">
          {view === "upload" && <Upload onDone={() => setView("canvas")} />}
          {view === "canvas" && (
            <CanvasView today={today} onExport={exportICS}
              onPanic={(id) => { setPanicId(id); setView("plan"); }} />
          )}
          {view === "policies" && <Policies />}
          {view === "availability" && (
            <Availability {...{ extraBusy, setExtraBusy, constraints, setConstraints, daysOff, setDaysOff,
              maxPerDay, setMaxPerDay, commuteBuffer, setCommuteBuffer }} onBuild={() => setView("plan")} />
          )}
          {view === "plan" && (
            <Plan plan={plan} panicId={panicId} onClearPanic={() => setPanicId(null)}
              onExport={exportICS} today={today} maxPerDay={maxPerDay} />
          )}
          {view === "course" && <CourseVault course={courseBy(courseCode)} today={today} />}
        </main>
      </div>

      {ics && (
        <div onClick={() => setIcs(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,20,28,.72)", display: "grid",
                   placeItems: "center", padding: 20, zIndex: 50 }}>
          <div className="card anim-up" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, width: "100%" }}>
            <div className="eyebrow">Calendar export</div>
            <h3 className="d3" style={{ margin: "8px 0 8px" }}>Your semester as an .ics file</h3>
            <p className="tiny" style={{ marginBottom: 14 }}>
              Every deadline and every study block, ready for Google Calendar or Apple Calendar.
              If the download is blocked here, copy the text and save it as course-canvas.ics.
            </p>
            <textarea readOnly value={ics} onFocus={(e) => e.target.select()}
              style={{ width: "100%", height: 150, padding: 10, borderRadius: 4, border: "1px solid var(--bone3)",
                       fontFamily: "'IBM Plex Mono',ui-monospace,monospace", fontSize: 10.5, background: "var(--bone)" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" onClick={download}>Download .ics</button>
              <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(ics)}>Copy text</button>
              <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={() => setIcs(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
