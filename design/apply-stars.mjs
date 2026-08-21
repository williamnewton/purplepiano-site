// Swaps the gradient-painted starfield for rules driving the real star spans
// (same deterministic field + twinkle as the app's star-field.tsx).
import { readFileSync, writeFileSync } from 'node:fs';

const p = new URL('../style.css', import.meta.url);
let s = readFileSync(p, 'utf8');

const START = '/* ---------- Starfield ---------- */';
const END = '@keyframes twinkle';
const a = s.indexOf(START);
const b = s.indexOf(END);
if (a === -1 || b === -1) throw new Error('starfield bounds not found');

const css = `/* ---------- Starfield ----------
   The app's deterministic 48-star field (star-field.tsx): most are round,
   the brightest few are four-point sparkles. */
.stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.stars span {
  position: absolute;
  background: oklch(0.98 0.01 300 / .7);
  animation: twinkle 4s ease-in-out infinite alternate;
}
.stars span:nth-child(3n)   { animation-duration: 5.5s; animation-delay: .8s; }
.stars span:nth-child(4n)   { animation-duration: 3.2s; animation-delay: 1.6s; }
.stars span:nth-child(5n+2) { animation-duration: 6s;   animation-delay: 2.4s; }

`;

s = s.slice(0, a) + css + s.slice(b);
writeFileSync(p, s);
console.log('starfield CSS replaced');
