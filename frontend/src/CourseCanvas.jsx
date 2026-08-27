import React, { useState, useMemo, useEffect, useRef } from "react";

/* ============================================================================
   CUNY COURSE CANVAS
   A semester-wide syllabus intelligence tool.

   Design thesis: the semester as a transit diagram. Courses are lines,
   assessments are stations, collision weeks are service advisories.

   Gemini calls go through `askGemini()` at the bottom of this file. The
   frontend parses once, stores the structured result, and reuses it across
   Canvas, Courses, Schedule, and Study tools.
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
.nav-group { display:flex; flex-direction:column; gap:2px; position:relative; padding-left:8px; }
.nav-group::before { content:""; position:absolute; left:14px; top:27px; bottom:8px; width:3px;
  background:linear-gradient(var(--signal), #1B54B8); border-radius:3px; opacity:.55; }
.nav-label { font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px; letter-spacing:.2em;
  text-transform:uppercase; color:#7E7C8E; margin:0 0 8px 8px; }
.nav-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:999px;
  font-size:14px; font-weight:500; color:#C9C5BC; text-align:left; width:100%; transition:.14s; }
.nav-item:hover { background:var(--ink2); color:var(--bone); }
.nav-item[data-on="1"] { background:var(--bone); color:var(--ink); font-weight:700; }
.nav-tick { width:13px; height:13px; border-radius:50%; border:2px solid currentColor; background:var(--ink); opacity:1; z-index:1; }
.nav-item[data-on="1"] .nav-tick { background:var(--signal); border-color:var(--ink); }
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
.station[data-type="exam"], .station[data-type="presentation"] { border-radius:3px; }
.station[data-type="project"], .station[data-type="paper"] { border-radius:35% 35% 50% 50%; }
.station::after { content:attr(data-label); position:absolute; top:calc(100% + 5px); left:50%; transform:translateX(-50%);
  font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-size:8px; color:#C9C5BC; white-space:nowrap; }
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
.next-stop { background:linear-gradient(135deg, var(--ink), var(--ink2)); color:var(--bone);
  border-radius:10px; padding:20px; border-left:6px solid var(--signal); }
.station-tabs { display:flex; align-items:center; gap:0; overflow-x:auto; padding:4px 2px 16px; }
.station-tab { position:relative; display:flex; align-items:center; gap:8px; padding:8px 16px 8px 0;
  white-space:nowrap; font-weight:700; font-size:13px; color:var(--muted); }
.station-tab:not(:last-child)::after { content:""; width:34px; height:3px; background:var(--bone3); margin-left:8px; border-radius:3px; }
.station-dot { width:16px; height:16px; border-radius:50%; border:2px solid currentColor; background:#fff; flex:0 0 auto; }
.station-tab[data-on="1"] { color:var(--ink); }
.station-tab[data-on="1"] .station-dot { background:var(--signal); border-color:var(--ink); }
.route-card { border-left:5px solid var(--line, var(--ink)); }
.schedule-grid { display:grid; grid-template-columns:repeat(7,minmax(190px,1fr)); gap:12px; overflow-x:auto; padding-bottom:8px; }
.day-card { min-width:190px; background:#fff; border:1px solid var(--bone2); border-radius:10px; padding:14px; }
.day-card[data-today="1"] { border-color:var(--signal); box-shadow:0 0 0 3px rgba(242,193,78,.2); }
.timeline { display:flex; flex-direction:column; gap:8px; margin-top:12px; }
.event-row { display:grid; grid-template-columns:54px 1fr auto; gap:9px; align-items:start;
  padding:9px 0; border-bottom:1px solid var(--bone2); }
.event-dot { width:13px; height:13px; border-radius:50%; background:var(--line, var(--ink)); margin-top:3px; box-shadow:0 0 0 3px #fff, 0 0 0 5px var(--line, var(--ink)); }
.deadline-row { display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-top:1px dashed var(--bone2); }
.form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
.field { display:flex; flex-direction:column; gap:5px; }
.field input, .field select, .field textarea { width:100%; padding:9px 10px; border:1px solid var(--bone3); border-radius:6px; background:#fff; }

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
  .nav-group::before { display:none; }
  .nav-label, .nav-foot { display:none; }
  .nav-item { white-space:nowrap; }
  .main { padding:22px 14px 50px; }
  .station-tabs { padding-bottom:12px; }
  .station-tab:not(:last-child)::after { width:18px; }
  .schedule-grid { grid-template-columns:1fr; overflow:visible; }
  .day-card { min-width:0; }
  .event-row { grid-template-columns:48px 1fr; }
  .event-row .chip { grid-column:2; justify-self:start; }
}
`;

/* ------------------------------- semester data ---------------------------- */
/* In production this whole object is what Gemini returns from /api/parse.
   It conforms exactly to types/semester.ts — see PROJECT_PLAN.md.          */

const SEMESTER_START = new Date(2026, 7, 24); // Mon Aug 24 2026
const WEEKS = 16; // 15 instruction weeks + finals

// Live data the app actually renders. It starts empty on purpose: no academic
// screens use fake courses, fake dates, or backup mock schedules.
let COURSES = [];
let ASSESSMENTS = [];

const DEFAULT_CONSTRAINTS = [];

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
const timeLabel = (clock) => clock ? new Date(`2026-01-01T${clock}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
const startOfWeek = (d) => addDays(d, -d.getDay());
const sameISO = (date, isoStr) => iso(date) === isoStr;

const weekOf = (isoStr) => {
  const diff = Math.floor((parseISO(isoStr) - SEMESTER_START) / 864e5);
  return Math.floor(diff / 7) + 1;
};
const weekStart = (n) => addDays(SEMESTER_START, (n - 1) * 7);
const courseBy = (code) => COURSES.find((c) => c.code === code);

const TYPE_GLYPH = {
  assignment: "ASN", homework: "HW", quiz: "QUIZ", exam: "EXAM", midterm: "MID",
  final: "FINAL", project: "PROJ", paper: "PAPER", presentation: "PRES", lab: "LAB",
  discussion: "DISC", reading_response: "READ", milestone: "MILE", participation: "PART", other: "STOP",
};
const ACADEMIC_TYPES = Object.keys(TYPE_GLYPH);
const ACTIVITY_TYPES = ["work", "gym", "commute", "club", "appointment", "personal", "study", "unavailable", "other"];
const ACTIVITY_LABELS = {
  work: "Work", gym: "Gym", commute: "Commute", club: "Club", appointment: "Appointment",
  personal: "Personal", study: "Study", unavailable: "Unavailable", other: "Other",
};
const ACTIVITY_COLORS = {
  work: "#2C2D3C", gym: "#2E9E6B", commute: "#F2C14E", club: "#8E3FA6",
  appointment: "#1B54B8", personal: "#0E8C8C", study: "#D6352B", unavailable: "#6E6C7C", other: "#E07316",
};

function mergeBy(items, keyFn) {
  return Array.from(new Map(items.map((item) => [keyFn(item), item])).values());
}

function saveSemesterState() {
  try {
    sessionStorage.setItem("course-canvas-semester", JSON.stringify({ courses: COURSES, assessments: ASSESSMENTS }));
  } catch { /* session storage may be blocked; parsing still works */ }
}

function touchSemesterState() {
  saveSemesterState();
}

function loadSemesterState() {
  try {
    const raw = sessionStorage.getItem("course-canvas-semester");
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved.courses) || !Array.isArray(saved.assessments)) return false;
    COURSES = saved.courses;
    ASSESSMENTS = saved.assessments;
    return COURSES.length > 0;
  } catch {
    return false;
  }
}

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

function Info({ label, value }) {
  return (
    <div className="card-flat">
      <div className="eyebrow">{label}</div>
      <p style={{ fontSize: 14, margin: "7px 0 0", lineHeight: 1.45 }}>{value || "Not found in syllabus"}</p>
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
            Your syllabi each know one course. None of them know when all your
            assignments, exams, class blocks, and free time collide. Upload the files
            and see the semester the way it will actually happen to you.
          </p>

          {/* mini rail — the signature element, previewed */}
          <div style={{ marginTop: 40 }}>
            {["Syllabus upload", "Calendar blocks", "Study route", "Flashcards"].map((label, i) => (
              <div key={label} className="anim-up" style={{ display: "flex", alignItems: "center",
                   height: 30, animationDelay: `${i * 90}ms` }}>
                <span className="nav-tick" style={{ background: ["#D6352B", "#1B54B8", "#F2C14E", "#16904A"][i] }} />
                <div style={{ position: "relative", flex: 1, height: 3, marginLeft: 10,
                              background: ["#D6352B", "#1B54B8", "#F2C14E", "#16904A"][i], opacity: 0.55, borderRadius: 2 }}>
                  {[18, 44, 72].map((p, j) => (
                    <span key={j} className="anim-pop" style={{ position: "absolute", left: `${p}%`, top: "50%",
                      width: 9, height: 9, borderRadius: "50%", background: "#fff",
                      border: "2px solid var(--ink)", transform: "translate(-50%,-50%)",
                      animationDelay: `${600 + i * 90 + j * 70}ms` }} />
                  ))}
                </div>
                <span className="mono tiny" style={{ marginLeft: 10, color: "#A9A6B4" }}>{label}</span>
              </div>
            ))}
            <div className="mono anim-up" style={{ fontSize: 10.5, color: "var(--alert)", marginTop: 12,
                 letterSpacing: ".1em", animationDelay: "1.5s" }}>
              ▮▮▮ SERVICE ADVISORIES APPEAR AFTER YOUR REAL UPLOAD
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
              onClick={() => onEnter("student@cuny.edu")}>Continue to upload</button>
            <p className="tiny" style={{ marginTop: 12 }}>
              The semester stays blank until you upload real syllabus files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- 2. UPLOAD --------------------------------- */

function Upload({ onDone, semesterStart }) {
  const [files, setFiles] = useState([]);
  const [stage, setStage] = useState("idle"); // idle | parsing | done
  const [loadingStep, setLoadingStep] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const inputRef = useRef(null);
  const realFilesRef = useRef([]);
  const inFlightRef = useRef(false);

  const startReal = async (fileObjs = realFilesRef.current) => {
    if (inFlightRef.current || !fileObjs.length) return;
    inFlightRef.current = true;
    setError(null);
    setWarnings([]);
    realFilesRef.current = fileObjs;
    setLoadingStep(0);
    setFiles(fileObjs.map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      found: "reading with Gemini…",
      pct: 0,
    })));
    setStage("parsing");

    // 100s abort timeout so a genuinely stalled request doesn't leave
    // inFlightRef stuck true forever with no way for the user to retry.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100000);
    try {
      const semester = await askGemini({ files: fileObjs, semesterStart, signal: controller.signal });
      const normalized = normalizeSemester(semester);
      COURSES = mergeBy([...COURSES, ...normalized.courses], (course) => course.code);
      ASSESSMENTS = mergeBy([...ASSESSMENTS, ...normalized.assessments], (assessment) =>
        assessment.id || `${assessment.course}-${assessment.title}-${assessment.date || assessment.dateText || "undated"}`
      );
      saveSemesterState();
      setWarnings(semester.warnings || []);
      setFiles((prev) => prev.map((f) => ({
        ...f, pct: 100,
        found: `${normalized.courses.length} course(s) · ${normalized.assessments.length} assessments`,
      })));
      setTimeout(() => setStage("done"), 300);
    } catch (err) {
      setError(toFriendlyUploadError(err));
      setStage("idle");
      setFiles((prev) => prev.map((f) => ({ ...f, pct: 0, found: "still selected" })));
    } finally {
      inFlightRef.current = false;
      clearTimeout(timeoutId);
    }
  };

  // Cosmetic progress ticker. It caps below 100 until the backend finishes.
  useEffect(() => {
    if (stage !== "parsing") return;
    const cap = 92;
    const t = setInterval(() => {
      setFiles((prev) => {
        return prev.map((f, i) => ({ ...f, pct: Math.min(cap, f.pct + (7 + ((i * 3) % 6))) }));
      });
    }, 130);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "parsing") return;
    const t = setInterval(() => setLoadingStep((s) => (s + 1) % 5), 1400);
    return () => clearInterval(t);
  }, [stage]);

  const pickFiles = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) startReal(chosen);
  };

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Step one</div>
          <h2 className="d2" style={{ margin: "8px 0 8px" }}>Upload every syllabus at once</h2>
          <p className="lede">
            All of them, in one go. Reading them together is the whole point — that is how
            the collisions become visible. PDFs, Word docs, image files, or a photo of a printout.
          </p>
        </div>
      </div>

      {stage !== "done" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const dropped = Array.from(e.dataTransfer.files || []);
            if (dropped.length) startReal(dropped);
          }}
          onClick={() => stage === "idle" && inputRef.current?.click()}
          style={{ border: `2px dashed ${drag ? "var(--signal)" : "var(--bone3)"}`, borderRadius: 8,
                   padding: "44px 26px", textAlign: "center", background: drag ? "rgba(242,193,78,.1)" : "#fff",
                   cursor: stage === "idle" ? "pointer" : "default", transition: ".15s" }}>
          <input ref={inputRef} type="file" multiple hidden accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.heic,.txt" onChange={pickFiles} />
          <div className="d3" style={{ marginBottom: 6 }}>
            {stage === "parsing" ? "Reading your semester" : "Drop your syllabi here"}
          </div>
          <p className="tiny" style={{ marginBottom: 16 }}>
            {stage === "parsing"
              ? "Gemini is reading all of them in a single context window."
              : "Or click to browse. PDFs, Word docs, images, and text files work."}
          </p>
          {stage === "idle" && <span className="chip chip-warn">REAL SYLLABUS FILES REQUIRED</span>}
        </div>
      )}

      {stage === "parsing" && (
        <div className="next-stop anim-up" style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ color: "var(--signal)", marginBottom: 12 }}>Analysis route</div>
          {["Finding course information", "Finding important dates", "Checking grading policies", "Mapping assessment stops", "Building your course line"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
              <span className="station-dot" style={{ background: i <= loadingStep ? "var(--signal)" : "transparent", color: i <= loadingStep ? "var(--signal)" : "#777" }} />
              <span className="mono" style={{ fontSize: 12.5, color: i <= loadingStep ? "var(--bone)" : "#8A8898" }}>
                {i === loadingStep ? "Mapping your course..." : label}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card" style={{ marginTop: 18, borderColor: "var(--alert)", background: "rgba(228,87,46,.06)" }}>
          <div className="eyebrow" style={{ color: "var(--alert)", marginBottom: 6 }}>{error.title}</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "0 0 12px" }}>{error.message}</p>
          {error.retryAfter && <p className="tiny" style={{ margin: "0 0 12px" }}>Try again in about {error.retryAfter}.</p>}
          <button className="btn btn-alert" disabled={stage === "parsing"} onClick={() => startReal()}>
            {error.code === "GEMINI_RATE_LIMITED" ? "Try Again Later" : "Try Again"}
          </button>
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
          <div className="eyebrow" style={{ color: "var(--signal)" }}>Course Line Added</div>
          <div style={{ display: "flex", gap: 34, flexWrap: "wrap", margin: "16px 0 20px" }}>
            <Stat n={COURSES.length} label="Courses" />
            <Stat n={ASSESSMENTS.filter((a) => a.date).length} label="Dated assessments" />
            <Stat n={ASSESSMENTS.filter((a) => a.conf !== "explicit").length} label="Needs your eyes" tone="var(--signal)" />
            <Stat n={findCollisions(ASSESSMENTS).filter((c) => c.severity !== "normal").length}
                  label="Collision weeks" tone="var(--alert)" />
          </div>
          {warnings.length > 0 ? (
            <ul className="tiny" style={{ color: "#A9A6B4", marginBottom: 18, maxWidth: "60ch", paddingLeft: 18 }}>
              {warnings.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
            </ul>
          ) : (
            <p className="tiny" style={{ color: "#A9A6B4", marginBottom: 18, maxWidth: "60ch" }}>
              Structured output guarantees the shape of every field, never the truth of it — check any flagged dates on the canvas.
            </p>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-signal" onClick={onDone}>View Semester Canvas →</button>
            <button className="btn" style={{ background: "#fff", color: "var(--ink)", fontWeight: 700 }}
              onClick={() => { setStage("idle"); setFiles([]); setWarnings([]); setError(null); }}>Add Another Syllabus</button>
          </div>
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
                      data-type={a.type}
                      data-label={TYPE_GLYPH[a.type] || "STOP"}
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

function NextStop({ today, onPanic }) {
  const next = ASSESSMENTS
    .filter((assessment) => assessment.date && parseISO(assessment.date) >= today)
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))[0];
  if (!next) {
    return <Empty title="No upcoming stops" body="No future dated assessments were found in the uploaded syllabi." />;
  }
  const course = courseBy(next.course);
  const daysAway = Math.max(0, Math.round((parseISO(next.date) - today) / 864e5));
  return (
    <div className="next-stop" style={{ marginBottom: 18 }}>
      <div className="eyebrow" style={{ color: "var(--signal)" }}>Next Stop</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {course && <Bullet course={course} size="md" />}
            <span className="chip" style={{ color: "var(--bone)", borderColor: "rgba(255,255,255,.25)" }}>{TYPE_GLYPH[next.type] || "STOP"}</span>
          </div>
          <div className="d3" style={{ fontSize: 25 }}>{next.course} · {next.title}</div>
          <p className="mono tiny" style={{ color: "#C9C5BC", marginTop: 8 }}>
            {fmtShort(next.date)} · {daysAway === 0 ? "today" : `${daysAway} days away`}
            {next.w ? ` · ${next.w}% of course grade` : ""}
          </p>
        </div>
        <button className="btn btn-signal" onClick={() => onPanic(next.id)}>Build route around this</button>
      </div>
    </div>
  );
}

function CanvasView({ today, onExport, onPanic }) {
  const [sel, setSel] = useState(null);
  const collisions = useMemo(() => findCollisions(ASSESSMENTS), []);
  const hot = collisions.filter((c) => c.severity !== "normal");
  const worst = collisions.length ? collisions.reduce((a, b) => (b.share > a.share ? b : a), collisions[0]) : null;
  const totalHours = ASSESSMENTS.reduce((s, a) => s + (a.date ? a.hours : 0), 0);

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Fall 2026 · {COURSES.length} course{COURSES.length === 1 ? "" : "s"} · {WEEKS} weeks</div>
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
        <Stat n={worst ? `Wk ${worst.week}` : "—"} label="Heaviest week" tone="var(--alert)" />
        <Stat n={`${totalHours}h`} label="Prep hours ahead" />
        <Stat n={ASSESSMENTS.filter((a) => a.conf !== "explicit").length} label="Uncertain dates" tone="#8A6510" />
      </div>

      <SystemStatus collisions={collisions} totalHours={totalHours} />
      <NextStop today={today} onPanic={onPanic} />

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
        if (!c) return null;
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
          {hot.length === 0 && (
            <Empty title="No advisories yet" body="Once dated assignments or exams overlap, this area will flag the weeks that need extra planning." />
          )}
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
                  <span key={a.id} className="chip" style={{ borderColor: courseBy(a.course)?.color || "var(--bone3)" }}>
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
            Share of your entire semester grade decided in each week, all courses combined.
          </p>
          <Forecast collisions={collisions} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span className="mono tiny">Wk 1</span><span className="mono tiny">Wk 8</span><span className="mono tiny">Finals</span>
          </div>
          <hr className="rule" />
          <div className="card-flat">
            <div className="eyebrow" style={{ marginBottom: 6 }}>The one thing to know</div>
            {worst ? (
              <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>
                <strong>Week {worst.week}</strong> decides <strong>{worst.share}%</strong> of your
                whole semester across {worst.courses} courses, in {worst.exams} exams. Everything
                before it is preparation for it, whether you plan that way or not.
              </p>
            ) : (
              <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>
                No dated grading events were found yet. Upload another syllabus or check the file if this seems wrong.
              </p>
            )}
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
              Protect travel time around every class, so the schedule does not place a
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
                    if (!c) return null;
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
  if (!cards.length) {
    return <Empty title="No flashcards yet" body="Upload notes, slides, or a syllabus with topics before flashcards are generated." />;
  }
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
  return (course?.topics || []).map((t) => ({
    q: t,
    a: course.topicDefs?.[t] || GENERATED_DEFS[t] || `Definition will come from uploaded notes for ${course.code}.`,
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
  const pool = useMemo(() => {
    const own = cards.map((c) => [c.q, c.a]);
    return own.length > 4 ? own : [...own, ...Object.entries(GENERATED_DEFS)];
  }, [cards]);
  const q = cards[qi % cards.length] || { q: "", a: "" };
  const options = useMemo(() => {
    const wrong = pool.filter(([k]) => k !== q.q).sort(() => Math.random() - 0.5).slice(0, 3).map(([, v]) => v);
    return [q.a, ...wrong].sort(() => Math.random() - 0.5);
  }, [qi, q.q, q.a, pool]);

  if (!cards.length) {
    return <Empty title="No quiz yet" body="Generate flashcards from your uploaded notes first, then the quiz can use those cards." />;
  }

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
  const materialRef = useRef(null);
  const items = course ? ASSESSMENTS.filter((a) => a.course === course.code) : [];
  const upcoming = items.filter((a) => !a.date || parseISO(a.date) >= today)
    .sort((a, b) => (a.date ? parseISO(a.date) : new Date(9999, 0, 1)) - (b.date ? parseISO(b.date) : new Date(9999, 0, 1)));
  const cards = useMemo(() => makeCards(course), [course?.code]);
  const decided = items.reduce((s, a) => s + a.w, 0);
  const next = upcoming.find((a) => a.date);

  if (!course) {
    return <Empty title="Pick a course" body="Choose one of your uploaded courses to see policies, deadlines, and study tools." />;
  }

  const TABS = [["overview", "Overview"], ["schedule", "Schedule"], ["assignments", "Assignments"],
                ["grading", "Grading"], ["policies", "Policies"], ["resources", "Resources"]];

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

      <div className="station-tabs">
        {TABS.map(([k, l]) => (
          <button key={k} className="station-tab" data-on={tab === k ? "1" : "0"} onClick={() => setTab(k)}>
            <span className="station-dot" style={{ color: tab === k ? course.color : undefined }} />{l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid-2">
          <div className="card route-card" style={{ "--line": course.color }}>
            <div className="eyebrow">Course header</div>
            <h3 className="d3" style={{ margin: "10px 0 8px" }}>{course.title}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>{course.description || "No course description found in the syllabus."}</p>
            <hr className="rule" />
            <div className="grid-2">
              <Info label="Professor" value={course.contact?.name || course.instructor} />
              <Info label="Email" value={course.contact?.email} />
              <Info label="Office" value={course.contact?.office} />
              <Info label="Office Hours" value={course.contact?.officeHoursText} />
              <Info label="Term" value={[course.semester, course.year].filter(Boolean).join(" ")} />
              <Info label="Credits" value={course.credits} />
            </div>
          </div>
          <div className="card">
            <div className="eyebrow">Quick route info</div>
            <div className="card-flat" style={{ marginTop: 12 }}>
              <div className="eyebrow">Next Stop</div>
              <div className="d3" style={{ marginTop: 6 }}>{next ? next.title : "No upcoming dated stop"}</div>
              <p className="mono tiny" style={{ marginTop: 6 }}>
                {next ? `${fmtShort(next.date)}${next.w ? ` · ${next.w}%` : ""}` : "Upload another syllabus if dates are missing."}
              </p>
            </div>
            <div className="card-flat" style={{ marginTop: 12 }}>
              <div className="eyebrow">Meeting</div>
              <p className="mono tiny" style={{ marginTop: 6 }}>
                {course.meets.length ? course.meets.map((m) => `${DAYS[m.d]} ${hourLabel(m.s)}–${hourLabel(m.e)}`).join(" · ") : "Meeting time not found in syllabus"}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="grid-2">
          <div className="card">
            <div className="eyebrow">Class stops</div>
            {course.meets.length ? course.meets.map((m, i) => (
              <div key={i} className="card-flat" style={{ marginTop: 10 }}>
                <strong>{m.type || "Class"}</strong>
                <div className="mono tiny">{DAYS[m.d]} {hourLabel(m.s)}–{hourLabel(m.e)} · {m.location || course.room}</div>
              </div>
            )) : <Empty title="No meeting schedule found" body="The schedule will not block class time unless the syllabus includes meeting days and times." />}
          </div>
          <div className="card">
            <div className="eyebrow">Weekly schedule</div>
            {course.weeklySchedule.length ? course.weeklySchedule.map((week, i) => (
              <div key={i} style={{ padding: "11px 0", borderBottom: "1px solid var(--bone2)" }}>
                <div className="mono tiny">Week {week.week || i + 1} · {week.dateRange || "date range unavailable"}</div>
                <strong>{(week.topics || []).join(", ") || "Topics not listed"}</strong>
                {(week.readings || []).length > 0 && <div className="tiny">Readings: {week.readings.join(", ")}</div>}
                {(week.assignments || []).length > 0 && <div className="tiny">Assignments: {week.assignments.join(", ")}</div>}
              </div>
            )) : <Empty title="No weekly schedule found" body="If the syllabus has no weekly calendar, this section stays empty instead of guessing." />}
          </div>
        </div>
      )}

      {tab === "assignments" && (
        <div className="card">
          <div className="eyebrow">Upcoming stops</div>
          {(items.length ? upcoming : []).length ? upcoming.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                 gap: 12, padding: "12px 0", borderBottom: "1px solid var(--bone2)" }}>
              <div>
                <div className="mono tiny">{a.date ? fmtShort(a.date) : a.dateText || "date unavailable"}</div>
                <strong>{a.title}</strong>
                {(a.description || a.notes) && <p className="tiny" style={{ margin: "4px 0 0" }}>{a.description || a.notes}</p>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {a.edited && <span className="chip chip-warn">Edited by you</span>}
                <span className="chip" style={{ borderColor: course.color }}>{a.w ? `${a.w}%` : a.points ? `${a.points} pts` : "weight unavailable"}</span>
              </div>
            </div>
          )) : (
            items.length
              ? <Empty title="No upcoming stops" body="All extracted assessment stops for this course are before today." />
              : <Empty title="No assessment stops found" body="We found the course information, but no assignments or exams were detected. Use Schedule → Add Deadline to add one manually." />
          )}
        </div>
      )}

      {tab === "grading" && (
        <div className="grid-2">
          <div className="card">
            <div className="eyebrow">Grade breakdown</div>
            {course.grading.length ? course.grading.map((g) => (
              <div key={g.cat} style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{g.cat} {g.drops && <span className="chip chip-go">DROPS LOWEST</span>}</span>
                  <span className="mono tiny">{g.w ? `${g.w}%` : g.points ? `${g.points} pts` : "weight unavailable"}</span>
                </div>
                {g.w ? <div className="bar"><i style={{ width: `${Math.min(100, g.w)}%`, background: course.color }} /></div> : null}
                {g.notes && <p className="tiny">{g.notes}</p>}
              </div>
            )) : <Empty title="No grading breakdown found" body="Gemini did not find a concrete grading breakdown in this syllabus." />}
            {course.gradingNotes && <p className="tiny" style={{ marginTop: 14 }}>{course.gradingNotes}</p>}
          </div>
          <div className="card">
            <div className="eyebrow">Letter scale</div>
            {course.gradeScale.length ? course.gradeScale.map((g) => (
              <div key={g.letter} className="card-flat" style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                <strong>{g.letter}</strong><span className="mono tiny">{g.min ?? "?"}–{g.max ?? "?"}</span>
              </div>
            )) : <Empty title="No grade scale found" body="No letter-grade scale was listed in the syllabus." />}
          </div>
        </div>
      )}

      {tab === "policies" && (
        <div className="grid-2">
          {(course.policies.length ? course.policies : [
            { category: "Late Work", summary: course.late },
            { category: "Attendance", summary: course.attendance },
          ]).map((policy) => (
            <div key={policy.category} className="card route-card" style={{ "--line": course.color }}>
              <div className="eyebrow">{policy.category}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "8px 0 0" }}>{policy.summary}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "resources" && (
        <div className="grid-2">
          <div className="card">
            <div className="eyebrow">Course materials</div>
            {course.materials.length ? course.materials.map((item, i) => (
              <div key={i} className="card-flat" style={{ marginTop: 8 }}>
                <strong>{item.type}: {item.name}</strong>
                {item.details && <p className="tiny" style={{ margin: "4px 0 0" }}>{item.details}</p>}
              </div>
            )) : <Empty title="No required materials found" body="No textbook, software, platform, or equipment requirements were extracted." />}
          </div>
          <div className="card">
            <div className="eyebrow">Important links</div>
            {course.links.length ? course.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="card-flat"
                style={{ display: "block", marginTop: 8, color: "var(--ink)", textDecoration: "none" }}>
                <strong>{link.label}</strong>
                <div className="mono tiny">{link.url}</div>
              </a>
            )) : <Empty title="No links found" body="Only valid links from the syllabus appear here." />}
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
            <input ref={materialRef} type="file" multiple hidden accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,.md"
              onChange={(e) => {
                const picked = Array.from(e.target.files || []).map((file) => ({
                  name: file.name,
                  n: `${Math.max(1, Math.round(file.size / 1024))} KB`,
                }));
                setMaterial((p) => [...p, ...picked]);
              }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => materialRef.current?.click()}>Upload notes PDF</button>
              {material.length > 0 && (
                <button className="btn btn-signal" onClick={() => { setGen(true); setTimeout(() => setTab("cards"), 900); }}>
                  {gen ? "Generating…" : "Generate study tools"}
                </button>
              )}
            </div>
          </div>
          {material.length === 0 ? (
            <Empty title="The vault is empty" body={`Nothing uploaded for ${course.code} yet. Add slides or notes before generating study tools.`} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {material.map((m, i) => (
                <div key={i} className="card anim-up" style={{ padding: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{m.name}</div>
                    <div className="tiny">{m.n} · ready for study-tool generation</div>
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
            Every syllabus has its own rules about being late. This is the page you
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
   Wired to the Express backend's /api/parse (see backend/src/routes/parse.js
   and backend/src/controllers/parseController.js), which implements the same
   contract as parse-route.ts, extended with per-assessment estimatedHours
   (the scheduler needs a prep-time estimate) and per-topic topicDefinitions
   (real flashcard answers instead of a placeholder string).                 */

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "http://localhost:8080/api";

function toFriendlyUploadError(err) {
  if (err?.name === "AbortError") {
    return {
      code: "TIMEOUT",
      title: "Signal Lost",
      message: "Gemini didn't respond within 100 seconds. Your uploaded file is still here — try again with fewer or smaller files.",
    };
  }

  if (err?.code === "NETWORK_FAILURE") {
    return {
      code: "NETWORK_FAILURE",
      title: "Connection Interrupted",
      message: "Check your connection and try again.",
    };
  }

  if (err?.status === 429 || err?.code === "GEMINI_RATE_LIMITED" || /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(err?.raw || err?.message || "")) {
    return {
      code: "GEMINI_RATE_LIMITED",
      title: "Service Delay",
      message: "Gemini traffic is currently high. Course Canvas couldn't analyze your syllabus because the AI service has reached its current request limit. Your uploaded file is still here.",
      retryAfter: err?.retryAfter || null,
    };
  }

  if (err?.status === 400 || err?.code === "INVALID_DOCUMENT") {
    return {
      code: "INVALID_DOCUMENT",
      title: "We couldn't read this syllabus.",
      message: "Try another PDF or make sure the file contains readable syllabus content.",
    };
  }

  return {
    code: "SIGNAL_PROBLEM",
    title: "Signal Problem",
    message: "Something went wrong while analyzing your syllabus.",
  };
}

async function askGemini({ files, semesterStart, signal }) {
  const body = new FormData();
  files.forEach((f) => body.append("files", f));
  body.append("semesterStart", semesterStart);
  let res;
  try {
    res = await fetch(`${API_BASE}/parse`, { method: "POST", body, signal });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw Object.assign(new Error("Network request failed."), { code: "NETWORK_FAILURE", raw: err?.message });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.message || data.error || `Parsing failed (${res.status}).`), {
      status: res.status,
      code: data.code,
      title: data.title,
      retryAfter: data.retryAfter,
      raw: JSON.stringify(data),
    });
  }
  return data; // { courses, assessments, warnings }
}

/* --------------------------- normalization ---------------------------------
   Maps the backend's { courses, assessments } (parse-route.ts field names:
   courseCode, dueDate, dateConfidence, weightPercent, gradingPolicy[{category,
   weightPercent, dropsLowest}]) onto the shape every view in this file reads
   (course.meets/grading/late/attendance, assessment.course/date/w/conf/hours). */

const PALETTE = ["#D6352B", "#1B54B8", "#E07316", "#16904A", "#8E3FA6", "#0E8C8C", "#B8860B", "#6B5B95"];
const DEFAULT_HOURS = { exam: 10, quiz: 4, project: 9, paper: 8, homework: 4, presentation: 6, other: 3 };
const DAY_TWO = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
const DAY_ONE = { u: 0, m: 1, t: 2, w: 3, r: 4, f: 5, s: 6 };
const DAY_NAME = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6 };

function shortFromCode(code = "") {
  const digits = code.replace(/\D/g, "");
  return digits ? digits.slice(0, 3) : code.slice(0, 3).toUpperCase();
}

function parseMeetingDays(token = "") {
  const s = token.replace(/[^a-zA-Z]/g, "");
  const days = [];
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2).toLowerCase();
    if (DAY_TWO[two] !== undefined) { days.push(DAY_TWO[two]); i += 2; continue; }
    const one = s[i].toLowerCase();
    if (DAY_ONE[one] !== undefined) { days.push(DAY_ONE[one]); i += 1; continue; }
    i += 1;
  }
  return days;
}

function to24(h, ampm) {
  const hh = h % 12;
  return ampm === "pm" ? hh + 12 : hh;
}

function hourFromClock(clock = "") {
  const match = String(clock).match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;
  return Number(match[1]) + Number(match[2] || 0) / 60;
}

// Best-effort parse of freeform strings like "MW 10:00-11:50am" or "TTh 1-2:15pm".
// Meeting times that don't match a recognizable pattern just yield no blocks —
// the course still shows up everywhere else, it just won't occupy the schedule.
function parseMeetingTimes(raw = "") {
  const timeMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!timeMatch) return [];
  const [, h1, m1, ap1raw, h2, m2, ap2raw] = timeMatch;
  const ap2 = (ap2raw || ap1raw || "am").toLowerCase();
  const ap1 = (ap1raw || ap2).toLowerCase();
  const start = to24(Number(h1), ap1) + Number(m1 || 0) / 60;
  let end = to24(Number(h2), ap2) + Number(m2 || 0) / 60;
  if (end <= start) end += 12;
  const dayToken = raw.slice(0, timeMatch.index).trim().split(/\s+/)[0] || "";
  const days = parseMeetingDays(dayToken);
  return days.map((d) => ({ d, s: Math.floor(start), e: Math.max(Math.floor(start) + 1, Math.ceil(end)) }));
}

function normalizeMeetings(course) {
  const structured = (course.meetings || []).flatMap((meeting) => {
    const start = hourFromClock(meeting.startTime);
    const end = hourFromClock(meeting.endTime);
    if (start === null || end === null) return [];
    return (meeting.days || []).flatMap((day) => {
      const d = DAY_NAME[String(day).toLowerCase()];
      return d === undefined ? [] : [{
        d,
        s: Math.floor(start),
        e: Math.max(Math.floor(start) + 1, Math.ceil(end)),
        type: meeting.type,
        location: meeting.location,
        modality: meeting.modality,
      }];
    });
  });
  return structured.length ? structured : parseMeetingTimes(course.meetingTimes || "");
}

function normalizeSemester(semester) {
  const courses = (semester.courses || []).map((c, i) => {
    const topicDefs = {};
    (c.topicDefinitions || []).forEach(({ topic, definition }) => { topicDefs[topic] = definition; });
    const contact = c.instructorContact || {};
    const meetings = normalizeMeetings(c);
    return {
      code: c.code,
      short: shortFromCode(c.code),
      title: c.title || c.code || "Untitled course",
      instructor: c.instructor || "Instructor not found in syllabus",
      contact,
      section: c.section,
      semester: c.semester,
      year: c.year,
      department: c.department,
      credits: c.credits,
      color: PALETTE[(COURSES.length + i) % PALETTE.length],
      meets: meetings,
      meetingText: c.meetingTimes,
      room: c.room || meetings.find((m) => m.location)?.location || "Room not found in syllabus",
      description: c.description,
      objectives: c.learningObjectives || [],
      skills: c.skills || [],
      late: c.latePolicy || "No late policy found in the syllabus.",
      attendance: c.attendancePolicy || "No attendance policy found in the syllabus.",
      grading: (c.gradingPolicy || []).map((g) => ({ cat: g.category || "Unlabeled grading item", w: g.weightPercent ?? 0, points: g.points, notes: g.notes, drops: !!g.dropsLowest })),
      gradeScale: c.gradeScale || [],
      gradingNotes: c.gradingNotes,
      policies: c.policies || [],
      materials: c.materials || [],
      links: (c.links || []).filter((link) => /^https?:\/\//i.test(link.url || "")),
      weeklySchedule: c.weeklySchedule || [],
      topics: c.topics || [],
      topicDefs,
    };
  });

  const assessments = (semester.assessments || []).map((a) => ({
    id: a.id,
    course: a.courseCode,
    title: a.title,
    type: a.type,
    date: a.dueDate || null,
    dueTime: a.dueTime,
    originalDateText: a.originalDateText,
    dateText: a.dateText,
    w: a.weightPercent ?? 0,
    points: a.points,
    description: a.description,
    notes: a.notes,
    conf: a.dateConfidence || (a.dueDate ? "explicit" : "unknown"),
    hours: a.estimatedHours ?? DEFAULT_HOURS[a.type] ?? 4,
  }));

  return { courses, assessments };
}

function NeedUpload({ onUpload }) {
  return (
    <Empty
      title="Upload a syllabus first"
      body="Canvas, Courses, Schedule, Flashcards, and Quiz stay locked until Gemini successfully reads a real syllabus file."
      action={<button className="btn btn-signal" onClick={onUpload}>Go to syllabus upload</button>}
    />
  );
}

function CoursesPage({ courseCode, setCourseCode, today }) {
  const course = courseBy(courseCode) || COURSES[0];
  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Semester / Courses</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>Your uploaded courses</h2>
          <p className="lede">Every card here comes from the syllabus files you uploaded.</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {COURSES.map((c) => (
          <button key={c.code} className="chip" onClick={() => setCourseCode(c.code)}
            style={{ background: course?.code === c.code ? c.color : "#fff", color: course?.code === c.code ? "#fff" : "var(--ink)",
                     borderColor: course?.code === c.code ? c.color : "var(--bone3)" }}>
            {c.code}
          </button>
        ))}
      </div>
      <CourseVault course={course} today={today} />
    </div>
  );
}

const blankActivity = () => ({ id: "", label: "", kind: "work", days: [1], s: 9, e: 10, notes: "" });
const blankDeadline = () => ({ id: "", course: COURSES[0]?.code || "", title: "", type: "assignment", date: "", dueTime: "", w: "", points: "", notes: "" });

function SchedulePage({ today, plan, constraints, setConstraints, maxPerDay, setMaxPerDay, commuteBuffer, setCommuteBuffer,
                        onAddAssessment, onUpdateAssessment, onDeleteAssessment, onUpdateMeeting, onExport }) {
  const [activity, setActivity] = useState(blankActivity);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [deadline, setDeadline] = useState(blankDeadline);
  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const [meetingEdit, setMeetingEdit] = useState(null);
  const [filters, setFilters] = useState({ classes: true, deadlines: true, personal: true, study: true });
  const weekStartDate = startOfWeek(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const datedAssessments = ASSESSMENTS.filter((a) => a.date);

  const submitActivity = (e) => {
    e.preventDefault();
    if (!activity.label || !activity.days.length || activity.e <= activity.s) return;
    const item = { ...activity, id: editingActivityId || `activity-${Date.now()}` };
    setConstraints((prev) => editingActivityId ? prev.map((x) => x.id === editingActivityId ? item : x) : [...prev, item]);
    setEditingActivityId(null);
    setActivity(blankActivity());
  };

  const editActivity = (item) => {
    setEditingActivityId(item.id);
    setActivity({ ...blankActivity(), ...item });
  };

  const submitDeadline = (e) => {
    e.preventDefault();
    if (!deadline.course || !deadline.title) return;
    const item = {
      id: editingDeadlineId || `manual-${Date.now()}`,
      course: deadline.course,
      title: deadline.title,
      type: deadline.type,
      date: deadline.date || null,
      dueTime: deadline.dueTime || null,
      w: deadline.w === "" ? 0 : Number(deadline.w),
      points: deadline.points === "" ? null : Number(deadline.points),
      notes: deadline.notes,
      description: deadline.notes,
      conf: deadline.date ? "explicit" : "unknown",
      hours: DEFAULT_HOURS[deadline.type] || 4,
      source: editingDeadlineId ? "edited" : "manual",
      edited: true,
    };
    editingDeadlineId ? onUpdateAssessment(editingDeadlineId, item) : onAddAssessment(item);
    setEditingDeadlineId(null);
    setDeadline(blankDeadline());
  };

  const editDeadline = (item) => {
    setEditingDeadlineId(item.id);
    setDeadline({
      ...blankDeadline(),
      id: item.id,
      course: item.course,
      title: item.title,
      type: item.type,
      date: item.date || "",
      dueTime: item.dueTime || "",
      w: item.w || "",
      points: item.points || "",
      notes: item.notes || item.description || "",
    });
  };

  const classBlocksForDay = (day) => COURSES.flatMap((course) =>
    course.meets.map((meeting, index) => ({ ...meeting, index, course, label: `${course.code} ${meeting.type || "Class"}`, source: "syllabus" }))
  ).filter((event) => event.d === day.getDay());

  const activityBlocksForDay = (day) => constraints
    .filter((item) => item.days?.includes(day.getDay()))
    .map((item) => ({ ...item, label: item.label, course: null, source: "manual" }));

  const studyBlocksForDay = (day) => (plan.days.find((item) => sameISO(item.date, iso(day)))?.blocks || [])
    .map((block, index) => ({ id: `study-${iso(day)}-${index}`, label: `Study: ${block.a.title}`, s: block.s, e: block.e, kind: "study", course: courseBy(block.a.course), source: "generated" }));

  const deadlinesForDay = (day) => datedAssessments
    .filter((item) => sameISO(day, item.date))
    .sort((a, b) => (a.dueTime || "23:59").localeCompare(b.dueTime || "23:59"));

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Semester / Schedule</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>What do I actually have this week?</h2>
          <p className="lede">Classes and deadlines come from your syllabi. Work, gym, commute, personal time, and study blocks are editable by you.</p>
        </div>
        <button className="btn btn-ghost" onClick={onExport}>Export to calendar (.ics)</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Show</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries({ classes: "Classes", deadlines: "Deadlines", personal: "Personal", study: "Study" }).map(([key, label]) => (
            <button key={key} className={`chip ${filters[key] ? "chip-go" : ""}`} onClick={() => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))}>
              {filters[key] ? "✓" : "○"} {label}
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-grid" style={{ marginBottom: 18 }}>
        {days.map((day) => {
          const classes = filters.classes ? classBlocksForDay(day) : [];
          const activities = filters.personal ? activityBlocksForDay(day) : [];
          const studies = filters.study ? studyBlocksForDay(day) : [];
          const blocks = [...classes, ...activities, ...studies].sort((a, b) => a.s - b.s);
          const deadlines = filters.deadlines ? deadlinesForDay(day) : [];
          return (
            <div key={iso(day)} className="day-card" data-today={sameISO(day, iso(today)) ? "1" : "0"}>
              <div className="eyebrow">{fmtLong(day)}</div>
              <div className="timeline">
                {blocks.length === 0 && <p className="tiny" style={{ margin: 0 }}>No time blocks.</p>}
                {blocks.map((event, index) => {
                  const color = event.course?.color || ACTIVITY_COLORS[event.kind] || ACTIVITY_COLORS.other;
                  return (
                    <div key={`${event.id || event.course?.code}-${index}`} className="event-row" style={{ "--line": color }}>
                      <span className="mono tiny">{hourLabel(event.s)}</span>
                      <div>
                        <span className="event-dot" style={{ "--line": color }} />
                        <strong style={{ display: "block", marginTop: -16, marginLeft: 24 }}>{event.label}</strong>
                        <div className="tiny" style={{ marginLeft: 24 }}>
                          {hourLabel(event.s)}–{hourLabel(event.e)} · {event.source === "syllabus" ? "From syllabus" : ACTIVITY_LABELS[event.kind] || "Event"}
                        </div>
                      </div>
                      {event.source === "syllabus" ? (
                        <button className="chip" onClick={() => setMeetingEdit({ courseCode: event.course.code, index: event.index, ...event })}>Edit</button>
                      ) : event.source === "manual" ? (
                        <button className="chip" onClick={() => editActivity(event)}>Edit</button>
                      ) : <span className="chip">Study</span>}
                    </div>
                  );
                })}
                {deadlines.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div className="eyebrow">Due Today</div>
                    {deadlines.map((item) => {
                      const course = courseBy(item.course);
                      return (
                        <div key={item.id} className="deadline-row">
                          {course && <Bullet course={course} size="sm" />}
                          <div style={{ flex: 1 }}>
                            <strong>{item.title}</strong>
                            <div className="tiny">{item.course} · {TYPE_GLYPH[item.type] || item.type}{item.dueTime ? ` · ${timeLabel(item.dueTime)}` : ""}</div>
                          </div>
                          <button className="chip" onClick={() => editDeadline(item)}>Edit</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {meetingEdit && (
        <form className="card route-card" style={{ "--line": courseBy(meetingEdit.courseCode)?.color, marginBottom: 16 }} onSubmit={(e) => {
          e.preventDefault();
          onUpdateMeeting(meetingEdit.courseCode, meetingEdit.index, meetingEdit);
          setMeetingEdit(null);
        }}>
          <div className="eyebrow">Correct syllabus class time</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="field"><span className="tiny">Day</span><select value={meetingEdit.d} onChange={(e) => setMeetingEdit({ ...meetingEdit, d: Number(e.target.value) })}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>
            <label className="field"><span className="tiny">Start</span><input type="number" min="0" max="23" value={meetingEdit.s} onChange={(e) => setMeetingEdit({ ...meetingEdit, s: Number(e.target.value) })} /></label>
            <label className="field"><span className="tiny">End</span><input type="number" min="1" max="24" value={meetingEdit.e} onChange={(e) => setMeetingEdit({ ...meetingEdit, e: Number(e.target.value) })} /></label>
            <label className="field"><span className="tiny">Location</span><input value={meetingEdit.location || ""} onChange={(e) => setMeetingEdit({ ...meetingEdit, location: e.target.value })} /></label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button className="btn btn-primary">Save class correction</button><button type="button" className="btn btn-ghost" onClick={() => setMeetingEdit(null)}>Cancel</button></div>
        </form>
      )}

      <div className="grid-2">
        <form className="card" onSubmit={submitActivity}>
          <div className="eyebrow">{editingActivityId ? "Edit Activity" : "+ Add Activity"}</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="field"><span className="tiny">Activity name</span><input value={activity.label} onChange={(e) => setActivity({ ...activity, label: e.target.value })} placeholder="Gym, work, commute..." /></label>
            <label className="field"><span className="tiny">Category</span><select value={activity.kind} onChange={(e) => setActivity({ ...activity, kind: e.target.value })}>{ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{ACTIVITY_LABELS[type]}</option>)}</select></label>
            <label className="field"><span className="tiny">Start hour</span><input type="number" min="0" max="23" value={activity.s} onChange={(e) => setActivity({ ...activity, s: Number(e.target.value) })} /></label>
            <label className="field"><span className="tiny">End hour</span><input type="number" min="1" max="24" value={activity.e} onChange={(e) => setActivity({ ...activity, e: Number(e.target.value) })} /></label>
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
            {DAYS.map((day, i) => (
              <button type="button" key={day} className={`chip ${activity.days.includes(i) ? "chip-go" : ""}`}
                onClick={() => setActivity((prev) => ({ ...prev, days: prev.days.includes(i) ? prev.days.filter((d) => d !== i) : [...prev.days, i] }))}>{day}</button>
            ))}
          </div>
          <label className="field" style={{ marginTop: 12 }}><span className="tiny">Notes optional</span><textarea value={activity.notes || ""} onChange={(e) => setActivity({ ...activity, notes: e.target.value })} /></label>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary">{editingActivityId ? "Save activity" : "Add activity"}</button>
            {editingActivityId && <button type="button" className="btn btn-ghost" onClick={() => { setConstraints((prev) => prev.filter((x) => x.id !== editingActivityId)); setEditingActivityId(null); setActivity(blankActivity()); }}>Delete</button>}
            {editingActivityId && <button type="button" className="btn btn-signal" onClick={() => { setConstraints((prev) => [...prev, { ...activity, id: `activity-${Date.now()}`, label: `${activity.label} copy` }]); setEditingActivityId(null); setActivity(blankActivity()); }}>Duplicate</button>}
          </div>
        </form>

        <form className="card" onSubmit={submitDeadline}>
          <div className="eyebrow">{editingDeadlineId ? "Edit Deadline" : "+ Add Deadline"}</div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="field"><span className="tiny">Course</span><select value={deadline.course} onChange={(e) => setDeadline({ ...deadline, course: e.target.value })}>{COURSES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select></label>
            <label className="field"><span className="tiny">Title</span><input value={deadline.title} onChange={(e) => setDeadline({ ...deadline, title: e.target.value })} placeholder="Homework 4" /></label>
            <label className="field"><span className="tiny">Type</span><select value={deadline.type} onChange={(e) => setDeadline({ ...deadline, type: e.target.value })}>{ACADEMIC_TYPES.map((type) => <option key={type} value={type}>{TYPE_GLYPH[type]} · {type.replace("_", " ")}</option>)}</select></label>
            <label className="field"><span className="tiny">Date</span><input type="date" value={deadline.date} onChange={(e) => setDeadline({ ...deadline, date: e.target.value })} /></label>
            <label className="field"><span className="tiny">Due time</span><input type="time" value={deadline.dueTime} onChange={(e) => setDeadline({ ...deadline, dueTime: e.target.value })} /></label>
            <label className="field"><span className="tiny">Weight % optional</span><input type="number" min="0" max="100" value={deadline.w} onChange={(e) => setDeadline({ ...deadline, w: e.target.value })} /></label>
          </div>
          <label className="field" style={{ marginTop: 12 }}><span className="tiny">Notes optional</span><textarea value={deadline.notes} onChange={(e) => setDeadline({ ...deadline, notes: e.target.value })} /></label>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary">{editingDeadlineId ? "Save deadline" : "Add deadline"}</button>
            {editingDeadlineId && <button type="button" className="btn btn-ghost" onClick={() => { onDeleteAssessment(editingDeadlineId); setEditingDeadlineId(null); setDeadline(blankDeadline()); }}>Delete</button>}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Availability settings</div>
        <div className="form-grid" style={{ marginTop: 12 }}>
          <label className="field"><span className="tiny">Commute buffer around classes</span><input type="number" min="0" max="2" value={commuteBuffer} onChange={(e) => setCommuteBuffer(Number(e.target.value))} /></label>
          <label className="field"><span className="tiny">Max generated study hours/day</span><input type="number" min="1" max="8" value={maxPerDay} onChange={(e) => setMaxPerDay(Number(e.target.value))} /></label>
        </div>
      </div>
    </div>
  );
}

function StudyPage({ mode, courseCode, setCourseCode, notes, setNotes }) {
  const inputRef = useRef(null);
  const course = courseBy(courseCode) || COURSES[0];
  const cards = notes.length && course ? makeCards(course) : [];

  return (
    <div>
      <div className="head">
        <div>
          <div className="eyebrow">Study / {mode}</div>
          <h2 className="d2" style={{ margin: "8px 0 6px" }}>
            {mode === "notes" ? "Upload notes from iPad or computer" : mode === "flashcards" ? "Flashcards from your notes" : "Quiz from your flashcards"}
          </h2>
          <p className="lede">Pick a real uploaded course, then add your notes PDFs, images, or documents.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Course</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {COURSES.map((c) => (
            <button key={c.code} className="chip" onClick={() => setCourseCode(c.code)}
              style={{ background: course?.code === c.code ? c.color : "#fff", color: course?.code === c.code ? "#fff" : "var(--ink)",
                       borderColor: course?.code === c.code ? c.color : "var(--bone3)" }}>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {mode === "notes" && (
        <div className="card">
          <input ref={inputRef} type="file" multiple hidden accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,.md"
            onChange={(e) => {
              const picked = Array.from(e.target.files || []).map((file) => ({
                name: file.name,
                size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
              }));
              setNotes((p) => [...p, ...picked]);
            }} />
          <div className="eyebrow">Notes input</div>
          <p className="lede" style={{ fontSize: 14.5, margin: "8px 0 16px" }}>
            Upload PDFs, screenshots, Word docs, or text notes. No sample notes are loaded for you.
          </p>
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>Upload notes file</button>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {notes.length === 0 ? (
              <Empty title="No notes uploaded" body="Add a real notes file to unlock flashcards and quiz mode." />
            ) : notes.map((note, i) => (
              <div key={note.name + i} className="card-flat" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span className="mono tiny">{note.name}</span>
                <span className="chip chip-go">{note.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "flashcards" && (
        <div style={{ maxWidth: 600 }}>
          <Flashcards cards={cards} color={course?.color || "var(--ink)"} />
        </div>
      )}

      {mode === "quiz" && (
        <div style={{ maxWidth: 640 }} className="card">
          <Quiz course={course} cards={cards} />
        </div>
      )}
    </div>
  );
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
  const [notes, setNotes] = useState([]);
  // Bumped whenever Upload reassigns the module-level COURSES/ASSESSMENTS, so
  // memoized derivations below re-run and every view under <main> gets a fresh mount.
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (COURSES.length) return;
    if (loadSemesterState()) setDataVersion((v) => v + 1);
  }, []);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t < SEMESTER_START ? SEMESTER_START : t;
  }, []);

  const availability = useMemo(() => buildAvailability(extraBusy, constraints, daysOff, commuteBuffer),
    [extraBusy, constraints, daysOff, commuteBuffer, dataVersion]);
  const plan = useMemo(() => buildPlan({ availability, daysOff, maxPerDay, today, panicId }),
    [availability, daysOff, maxPerDay, today, panicId, dataVersion]);

  const exportICS = () => setIcs(buildICS(plan));
  const refreshSemester = () => {
    saveSemesterState();
    setDataVersion((v) => v + 1);
  };
  const addAssessment = (assessment) => {
    ASSESSMENTS = mergeBy([...ASSESSMENTS, assessment], (item) => item.id);
    refreshSemester();
  };
  const updateAssessment = (id, patch) => {
    ASSESSMENTS = ASSESSMENTS.map((item) => item.id === id ? { ...item, ...patch, id, edited: true, source: patch.source || item.source || "edited" } : item);
    refreshSemester();
  };
  const deleteAssessment = (id) => {
    ASSESSMENTS = ASSESSMENTS.filter((item) => item.id !== id);
    refreshSemester();
  };
  const updateMeeting = (courseCode, index, meeting) => {
    COURSES = COURSES.map((course) => course.code === courseCode
      ? { ...course, meets: course.meets.map((item, i) => i === index ? { d: meeting.d, s: meeting.s, e: meeting.e, type: meeting.type, location: meeting.location, modality: meeting.modality, edited: true } : item) }
      : course);
    refreshSemester();
  };
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
  const hasSemester = COURSES.length > 0;

  const NAV = [
    ["Semester", [["upload", "Syllabus"], ["canvas", "Canvas"], ["courses", "Courses"], ["schedule", "Schedule"]]],
    ["Study", [["notes", "Notes"], ["flashcards", "Flashcards"], ["quiz", "Quiz"]]],
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
                  onClick={() => { setView(k === "upload" || hasSemester ? k : "upload"); if (k !== "courses") setCourseCode(null); }}>
                  <span className="nav-tick" />{l}
                </button>
              ))}
            </div>
          ))}

          {hasSemester && <div className="nav-group">
            <div className="nav-label">Courses</div>
            {COURSES.map((c) => (
              <button key={c.code} className="nav-item"
                data-on={view === "course" && courseCode === c.code ? "1" : "0"}
                onClick={() => { setView("course"); setCourseCode(c.code); }}>
                <Bullet course={c} size="sm" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.code.split(" ")[0]} {(c.code.split(" ")[1] || c.short || "").slice(0, 3)}
                </span>
              </button>
            ))}
          </div>}

          <div className="nav-foot">
            <div className="mono" style={{ fontSize: 10.5, color: "#7E7C8E", marginBottom: 3 }}>SIGNED IN</div>
            <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{user}</div>
            <button className="nav-item" style={{ marginTop: 8, padding: "6px 0" }} onClick={() => setUser(null)}>
              Sign out
            </button>
          </div>
        </nav>

        <main className="main" key={dataVersion}>
          {view === "upload" && (
            <Upload
              semesterStart={iso(SEMESTER_START)}
              onDone={() => { setDataVersion((v) => v + 1); setView("canvas"); }}
            />
          )}
          {view === "canvas" && (
            hasSemester ? (
              <CanvasView today={today} onExport={exportICS}
                onPanic={(id) => { setPanicId(id); setView("schedule"); }} />
            ) : <NeedUpload onUpload={() => setView("upload")} />
          )}
          {view === "courses" && (
            hasSemester ? <CoursesPage courseCode={courseCode} setCourseCode={setCourseCode} today={today} />
              : <NeedUpload onUpload={() => setView("upload")} />
          )}
          {view === "schedule" && (
            hasSemester ? (
              <SchedulePage
                today={today}
                plan={plan}
                constraints={constraints}
                setConstraints={setConstraints}
                maxPerDay={maxPerDay}
                setMaxPerDay={setMaxPerDay}
                commuteBuffer={commuteBuffer}
                setCommuteBuffer={setCommuteBuffer}
                onAddAssessment={addAssessment}
                onUpdateAssessment={updateAssessment}
                onDeleteAssessment={deleteAssessment}
                onUpdateMeeting={updateMeeting}
                onExport={exportICS}
              />
            ) : <NeedUpload onUpload={() => setView("upload")} />
          )}
          {["notes", "flashcards", "quiz"].includes(view) && (
            hasSemester ? (
              <StudyPage mode={view} courseCode={courseCode} setCourseCode={setCourseCode}
                notes={notes} setNotes={setNotes} />
            ) : <NeedUpload onUpload={() => setView("upload")} />
          )}
          {view === "course" && (
            !hasSemester
              ? <NeedUpload onUpload={() => setView("upload")} />
              : courseBy(courseCode)
                ? <CourseVault course={courseBy(courseCode)} today={today} />
                : <Empty title="Course not found" body="This course isn't in the current semester data. Pick one from the left, or upload a fresh syllabus." />
          )}
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
