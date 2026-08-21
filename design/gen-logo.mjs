// Builds the wordmark logo + favicon from the app's real pitch colours.
import { writeFileSync } from 'node:fs';

const HUES = [350, 20, 45, 70, 95, 135, 165, 190, 225, 265, 295, 320];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const isBlack = (m) => NAMES[m % 12].length > 1;

// oklch -> sRGB hex, so the favicon data-URI works everywhere (no oklch in
// older favicon renderers).
function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gam = (x) => {
    x = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, x)) * 255);
  };
  return '#' + [gam(r), gam(g), gam(bl)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const noteHex = (m, L, C) => oklchToHex(L, C, HUES[m % 12]);

// Seven white keys C..B for the mark.
const whites = [];
for (let m = 60; whites.length < 7; m++) if (!isBlack(m)) whites.push(m);

// ---- Favicon: rounded purple square, rainbow keys, play triangle ----
const KEY_W = 3.4, GAP = 0.5, X0 = 4.2, Y0 = 15, KEY_H = 13;
const keys = whites
  .map((m, i) => {
    const x = (X0 + i * (KEY_W + GAP)).toFixed(2);
    return `<rect x='${x}' y='${Y0}' width='${KEY_W}' height='${KEY_H}' rx='1.2' fill='${noteHex(m, 0.9, 0.09)}'/>`;
  })
  .join('');
// Black keys over the seams (skip after E and B).
const blackAfter = [0, 1, 3, 4, 5];
const bkeys = blackAfter
  .map((i) => {
    const x = (X0 + (i + 1) * (KEY_W + GAP) - 1.15).toFixed(2);
    return `<rect x='${x}' y='${Y0}' width='2.3' height='7.6' rx='.8' fill='${oklchToHex(0.3, 0.09, 300)}'/>`;
  })
  .join('');

const favicon = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>` +
  `<rect width='32' height='32' rx='7' fill='${oklchToHex(0.24, 0.09, 300)}'/>` +
  `<circle cx='16' cy='9.5' r='5.6' fill='${oklchToHex(0.55, 0.21, 300)}'/>` +
  `<path d='M14.2 6.6l4.4 2.9-4.4 2.9z' fill='${oklchToHex(0.96, 0.02, 300)}'/>` +
  keys + bkeys + `</svg>`;

const enc = favicon
  .replace(/"/g, "'")
  .replace(/#/g, '%23')
  .replace(/</g, '%3C')
  .replace(/>/g, '%3E');

writeFileSync(new URL('./_favicon.txt', import.meta.url),
  `<link rel="icon" href="data:image/svg+xml,${enc}">`);

// ---- Inline wordmark mark for the header ----
const brandKeys = whites
  .map((m, i) => {
    const x = (4 + i * 3.4).toFixed(1);
    return `<rect x="${x}" y="9" width="2.9" height="15" rx="1" fill="${noteHex(m, 0.9, 0.09)}"/>`;
  })
  .join('');
const brand = `<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">` +
  `<rect width="32" height="32" rx="7" fill="${oklchToHex(0.28, 0.1, 300)}"/>` +
  brandKeys + `</svg>`;
writeFileSync(new URL('./_brand.txt', import.meta.url), brand);

console.log('favicon bytes:', enc.length);
console.log('key colours:', whites.map((m) => noteHex(m, 0.9, 0.09)).join(' '));
console.log('tint:', oklchToHex(0.55, 0.21, 300), 'bg:', oklchToHex(0.24, 0.09, 300));
