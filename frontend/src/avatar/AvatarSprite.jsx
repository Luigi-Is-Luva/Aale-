import React from "react";
import bodyNormal from "./rat_body.png";
import bodyBlink from "./rat_body_blink.png";
import tail from "./rat_tail.png";

/* rat_source.png was split into two layers (see the extraction notes below)
   so the tail can wag independently of the body, and the eye can blink
   independently of both:
     - rat_body.png / rat_body_blink.png: everything except the tail (pink),
       in two frames — eye open, eye closed — for a blink crossfade.
     - rat_tail.png: just the tail (pink), isolated on a transparent canvas
       the same size as the body, so it lines up pixel-for-pixel and can be
       rotated around its actual attachment point to the body. */

const TAIL_ORIGIN = "25.6% 72.3%"; // where the tail meets the body

const CSS = `
.cc-rat-wrap { position: relative; width: 100%; height: 100%; }

.cc-rat-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  display: block;
}

.cc-rat-blink {
  opacity: 0;
  animation: cc-rat-blink 5s ease-in-out infinite;
}

.cc-rat-tail {
  transform-origin: ${TAIL_ORIGIN};
  animation: cc-rat-tail-wag 2.4s ease-in-out infinite;
}

/* mostly open, with a quick double-blink near the end of each cycle */
@keyframes cc-rat-blink {
  0%, 90%, 100% { opacity: 0; }
  92%, 96% { opacity: 1; }
  94%, 98% { opacity: 0; }
}

@keyframes cc-rat-tail-wag {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-8deg); }
}

@media (prefers-reduced-motion: reduce) {
  .cc-rat-blink, .cc-rat-tail { animation: none; }
}
`;

export default function AvatarSprite() {
  return (
    <div className="cc-rat-wrap">
      <style>{CSS}</style>
      <img src={bodyNormal} alt="" className="cc-rat-layer" />
      <img src={bodyBlink} alt="" className="cc-rat-layer cc-rat-blink" />
      <img src={tail} alt="" className="cc-rat-layer cc-rat-tail" />
    </div>
  );
}
