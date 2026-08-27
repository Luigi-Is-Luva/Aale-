import React, { useMemo, useRef } from "react";
import { useReminderQueue } from "../hooks/useReminderQueue.js";
import { adaptAssessments } from "./adaptAssessments.js";
import AvatarSprite from "./AvatarSprite.jsx";
import bubbleImg from "./bubble_filled.png";

const WALK_LEG_SECONDS = 14; // time to cross the screen one way

/* Three independent transform layers so each animation gets its own element
   (CSS only allows one `transform` timeline per element):
     dock        -> fixed anchor strip along the bottom of the viewport
       walk-stage  -> translateX: walks left/right across the strip
         face        -> scaleX flip: faces the direction it's walking
           sprite      -> translateY/rotate: idle waddle, or the alert wiggle
             AvatarSprite -> body/blink/tail layers (unchanged)
   The bubble lives inside walk-stage (not as a dock-level sibling) so it
   travels with the rat and freezes at the same spot when it stops to show
   a reminder. */
const CSS = `
.cc-avatar-dock, .cc-avatar-dock *, .cc-avatar-dock *::before, .cc-avatar-dock *::after {
  box-sizing: border-box;
}

.cc-avatar-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 18px;
  z-index: 40;
  pointer-events: none;
}

.cc-avatar-walk-stage {
  position: relative;
  width: 112px;
  animation: cc-walk-move ${WALK_LEG_SECONDS}s linear infinite alternate;
}

.cc-avatar-dock[data-pose="alert"] .cc-avatar-walk-stage,
.cc-avatar-dock[data-pose="alert"] .cc-avatar-face {
  animation-play-state: paused;
}

/* Margins leave room for the wider speech bubble (not just the sprite) so
   it never clips off-screen when the rat stops near either edge. */
@keyframes cc-walk-move {
  from { transform: translateX(90px); }
  to { transform: translateX(calc(100vw - 300px)); }
}

.cc-avatar-face {
  animation: cc-walk-face ${WALK_LEG_SECONDS * 2}s steps(1) infinite;
}

@keyframes cc-walk-face {
  0%, 49.999% { transform: scaleX(1); }
  50%, 100% { transform: scaleX(-1); }
}

.cc-avatar-sprite {
  display: block;
  width: 112px;
  height: 78px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  animation: cc-walk-bob 420ms ease-in-out infinite;
}

.cc-avatar-sprite[data-pose="alert"] {
  animation: cc-avatar-alert 900ms ease-in-out infinite;
}

@keyframes cc-walk-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-4px) rotate(-2deg); }
}

@keyframes cc-avatar-alert {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  25% { transform: translateY(-9px) rotate(-6deg) scale(1.06); }
  50% { transform: translateY(-2px) rotate(5deg) scale(1.03); }
  75% { transform: translateY(-7px) rotate(-3deg) scale(1.05); }
}

/* --- speech bubble ----------------------------------------------------- */

.cc-avatar-bubble {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.cc-avatar-bubble-shape-group {
  position: relative;
  width: 165px;
  height: 165px;
  animation: cc-bubble-in 280ms cubic-bezier(.2,.9,.3,1.3) both;
}

/* bubble_filled.png is a 540x540 square with its drop-shadow already baked
   in, so no CSS filter/shadow is needed here — padding is tuned to the
   image's actual white interior (measured, not eyeballed) with extra room
   at the bottom for the tail notch. */
.cc-avatar-bubble-shape {
  position: relative;
  display: block;
  width: 165px;
  height: 165px;
  padding: 17px 19px 36px 19px;
  border: 0;
  background: transparent;
  text-align: center;
  cursor: pointer;
  color: var(--ink, #14141c);
  pointer-events: auto;
}

.cc-avatar-bubble-shape-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  pointer-events: none;
}

/* Public Sans (the app's body/UI face) reads better than the display-only
   Archivo at this size — Archivo 800 is built for big headlines and turns
   dense/blocky crammed into a small bubble. The subtitle borrows the
   app's "eyebrow" label recipe (IBM Plex Mono, wide tracking, uppercase)
   used for things like "SYLLABUS TO CALENDAR" elsewhere in the app, so a
   course code here reads as the same kind of label. */
.cc-avatar-bubble-title {
  position: relative;
  z-index: 1;
  display: block;
  font-family: 'Public Sans', -apple-system, 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 1.32;
  letter-spacing: -.01em;
}

.cc-avatar-bubble-subtitle {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 5px;
  font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #837E70;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .14em;
  text-transform: uppercase;
}

@keyframes cc-bubble-in {
  from { opacity: 0; transform: scale(.7) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .cc-avatar-walk-stage,
  .cc-avatar-face,
  .cc-avatar-sprite,
  .cc-avatar-sprite[data-pose="alert"],
  .cc-avatar-bubble-shape-group {
    animation: none;
  }
}
`;

const TAP_RESET_MS = 1200;
const TAPS_TO_FORCE = 3;

export default function AvatarReminder({ assessments, options }) {
  const reminders = useMemo(() => adaptAssessments(assessments), [assessments]);
  const { active, dismiss, forceShow } = useReminderQueue(reminders, options);
  const pose = active ? "alert" : "idle";

  const tapCountRef = useRef(0);
  const tapResetTimerRef = useRef(null);

  const handleSpriteClick = () => {
    tapCountRef.current += 1;
    clearTimeout(tapResetTimerRef.current);
    if (tapCountRef.current >= TAPS_TO_FORCE) {
      tapCountRef.current = 0;
      forceShow();
    } else {
      tapResetTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, TAP_RESET_MS);
    }
  };

  return (
    <div className="cc-avatar-dock" data-pose={pose} aria-live="polite">
      <style>{CSS}</style>

      <div className="cc-avatar-walk-stage">
        {active && (
          <div className="cc-avatar-bubble">
            <div className="cc-avatar-bubble-shape-group">
              <button type="button" className="cc-avatar-bubble-shape" onClick={dismiss}>
                <img src={bubbleImg} alt="" className="cc-avatar-bubble-shape-img" />
                <span className="cc-avatar-bubble-title">{active.title}</span>
                {active.subtitle && (
                  <span className="cc-avatar-bubble-subtitle">{active.subtitle}</span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="cc-avatar-face">
          <div
            className="cc-avatar-sprite"
            data-pose={pose}
            onClick={handleSpriteClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSpriteClick();
              }
            }}
            aria-label="Course Canvas assistant — tap 3 times for a reminder"
          >
            <AvatarSprite />
          </div>
        </div>
      </div>
    </div>
  );
}
