// The app-icon mark: rounded purple tile, sequencer grid, play button and
// rainbow keys — the icon from the App Store artwork, drawn from the app's
// own oklch palette (data.ts) rather than sampled.
import { writeFileSync } from 'node:fs';

const HUES = [350, 20, 45, 70, 95, 135, 165, 190, 225, 265, 295, 320];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const isBlack = (m) => NAMES[m % 12].length > 1;

function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gam = (x) => {
    x = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, x)) * 255);
  };
  return '#' + [gam(r), gam(g), gam(bl)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
const note = (m, L, C) => oklchToHex(L, C, HUES[m % 12]);

const BG_TOP = oklchToHex(0.34, 0.13, 300);
const BG_BOT = oklchToHex(0.18, 0.07, 300);
const TINT = oklchToHex(0.55, 0.21, 300);
const TINT_HI = oklchToHex(0.72, 0.15, 300);
const INK = oklchToHex(0.97, 0.02, 300);
const CELL = oklchToHex(0.3, 0.06, 300);

// 7 white keys C..B
const whites = [];
for (let m = 60; whites.length < 7; m++) if (!isBlack(m)) whites.push(m);

/**
 * Build the mark at a 100x100 viewBox.
 * detail=true draws the sequencer cells (good at >=64px); at favicon sizes
 * they turn to mud, so the small variant drops them.
 */
function mark({ detail }) {
  const parts = [];
  parts.push(`<defs><linearGradient id="ppbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG_TOP}"/><stop offset="1" stop-color="${BG_BOT}"/></linearGradient></defs>`);
  parts.push(`<rect width="100" height="100" rx="22" fill="url(#ppbg)"/>`);

  if (detail) {
    // Sequencer cells behind the play button, a few lit in pitch colours.
    const lit = { '0-4': 72, '1-0': 60, '2-1': 67, '3-4': 76, '1-4': 64 };
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 9 + c * 16.6, y = 11 + r * 11.4;
        const key = `${r}-${c}`;
        const fill = lit[key] !== undefined ? note(lit[key], 0.74, 0.2) : CELL;
        const op = lit[key] !== undefined ? 1 : 0.85;
        parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="13.4" height="8.4" rx="2.6" fill="${fill}" opacity="${op}"/>`);
      }
    }
  }

  // Play button — the icon's focal point.
  parts.push(`<circle cx="50" cy="34" r="19.5" fill="${BG_BOT}" opacity=".92"/>`);
  parts.push(`<circle cx="50" cy="34" r="19.5" fill="none" stroke="${TINT}" stroke-width="3.4"/>`);
  parts.push(`<circle cx="50" cy="34" r="16" fill="${TINT}" opacity=".22"/>`);
  parts.push(`<path d="M44.6 25.6l14.6 8.4-14.6 8.4z" fill="${INK}"/>`);

  // Keyboard along the bottom. At small sizes the black keys and the thin
  // seams turn to mud, so the compact variant uses 5 fatter keys and none.
  if (detail) {
    const KW = 11.6, GAP = 1.1, X0 = 8.7, Y0 = 62, KH = 29;
    whites.forEach((m, i) => {
      const x = X0 + i * (KW + GAP);
      parts.push(`<rect x="${x.toFixed(2)}" y="${Y0}" width="${KW}" height="${KH}" rx="3.4" fill="${note(m, 0.9, 0.09)}"/>`);
    });
    [0, 1, 3, 4, 5].forEach((i) => {
      const x = X0 + (i + 1) * (KW + GAP) - 4.1;
      parts.push(`<rect x="${x.toFixed(2)}" y="${Y0}" width="8.2" height="17.5" rx="2.4" fill="${oklchToHex(0.26, 0.08, 300)}"/>`);
    });
  } else {
    const KW = 15.2, GAP = 2.2, X0 = 9.5, Y0 = 63, KH = 27;
    [60, 62, 64, 67, 69].forEach((m, i) => {
      const x = X0 + i * (KW + GAP);
      parts.push(`<rect x="${x.toFixed(2)}" y="${Y0}" width="${KW}" height="${KH}" rx="4" fill="${note(m, 0.9, 0.1)}"/>`);
    });
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${parts.join('')}</svg>`;
}

// --- Favicon (no cells; reads at 16px) ---
const fav = mark({ detail: false });
const enc = fav.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E');
writeFileSync(new URL('./_favicon.txt', import.meta.url), `<link rel="icon" href="data:image/svg+xml,${enc}">`);

// --- Header brand mark (26px, no cells) ---
const brand = mark({ detail: false })
  .replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg width="28" height="28" aria-hidden="true"')
  .replace(/id="ppbg"/g, 'id="ppbgb"')
  .replace(/url\(#ppbg\)/g, 'url(#ppbgb)');
writeFileSync(new URL('./_brand.txt', import.meta.url), brand);

// --- Hero mark for mobile, full detail ---
const hero = mark({ detail: true })
  .replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg class="hero-mark" role="img" aria-label="Purple Piano"')
  .replace(/id="ppbg"/g, 'id="ppbgh"')
  .replace(/url\(#ppbg\)/g, 'url(#ppbgh)');
writeFileSync(new URL('./_heromark.txt', import.meta.url), hero);

console.log('favicon %d bytes, brand %d, hero %d', enc.length, brand.length, hero.length);
