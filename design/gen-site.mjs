// Emits the site's iPad-mockup markup + CSS from the SAME recipes as the app
// source (nextjs-prototypes/app/prototypes/purple-piano). Keeps the marketing
// site honest: change the app, re-run this, values stay in step.
import { writeFileSync } from 'node:fs';

const HUES = [350, 20, 45, 70, 95, 135, 165, 190, 225, 265, 295, 320];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nc = (m, l, c, a = 1) =>
  `oklch(${l} ${c} ${HUES[m % 12]}${a === 1 ? '' : ` / ${a}`})`;
const isBlack = (m) => NAMES[m % 12].length > 1;
const letter = (m) => NAMES[m % 12];

// ---- Keyboard ----
const WHITE_COUNT = 14;
const whites = [];
for (let m = 60; whites.length < WHITE_COUNT; m++) if (!isBlack(m)) whites.push(m);
const blacks = whites
  .slice(0, -1)
  .map((midi, index) => ({ midi: midi + 1, index }))
  .filter(({ midi }) => isBlack(midi));

const whiteHtml = whites
  .map((m) => `            <span class="wk" style="--fill-top:${nc(m, 0.98, 0.01)};--fill-bot:${nc(m, 0.88, 0.09)};--lip:${nc(m, 0.78, 0.12)};--ink:${nc(m, 0.45, 0.15)}">${letter(m)}</span>`)
  .join('\n');

const blackHtml = blacks
  .map(({ midi, index }) => `            <span class="bk" style="left:${(((index + 1) / WHITE_COUNT) * 100).toFixed(3)}%;width:${((100 / WHITE_COUNT) * 0.6).toFixed(3)}%;--bk-top:${nc(midi, 0.36, 0.1)};--bk-bot:${nc(midi, 0.25, 0.08)};--bk-lip:${nc(midi, 0.52, 0.17)}"></span>`)
  .join('\n');

// ---- Song maker ----
const SCALE_MIDI = [60, 62, 64, 67, 69, 72, 74, 76];
const lanes = [...SCALE_MIDI].reverse();
const STEPS = 16;
const ON = new Set(['1-14', '1-15', '2-0', '2-12', '3-5', '3-8', '3-9', '4-0', '4-6']);

const laneHtml = lanes
  .map((m) => `            <span class="lane"><i style="background:${nc(m, 0.72, 0.2)}"></i>${letter(m)}</span>`)
  .join('\n');

const cellHtml = lanes
  .map((m, row) => {
    const cells = Array.from({ length: STEPS }, (_, col) => {
      if (ON.has(`${row}-${col}`)) {
        return `<span class="cell on" style="--note:${nc(m, 0.74, 0.2)};--halo:${nc(m, 0.7, 0.22, 0.75)}"></span>`;
      }
      return `<span class="cell${col % 4 === 0 ? ' beat' : ''}"></span>`;
    }).join('');
    return `            <span class="rollrow">${cells}</span>`;
  })
  .join('\n');

// ---- Knobs (13 dots, -140..140) ----
const KNOBS = [
  { label: 'Space', hue: 265, value: 0.25 },
  { label: 'Wobble', hue: 195, value: 0.7 },
  { label: 'Sparkle', hue: 70, value: 0.5 },
  { label: 'Echo', hue: 145, value: 0.2 },
  { label: 'Dream', hue: 320, value: 0.15 },
];
const MIN_ANGLE = -140, MAX_ANGLE = 140, DOTS = 13;

const knobHtml = KNOBS.map(({ label, hue, value }) => {
  const accent = `oklch(0.72 0.2 ${hue})`;
  const angle = MIN_ANGLE + value * (MAX_ANGLE - MIN_ANGLE);
  const tipIndex = Math.floor(value * (DOTS - 1) + 0.001);
  const dots = Array.from({ length: DOTS }, (_, i) => {
    const t = i / (DOTS - 1);
    const a = ((MIN_ANGLE + t * (MAX_ANGLE - MIN_ANGLE) - 90) * Math.PI) / 180;
    const lit = t <= value + 0.001;
    const tip = lit && i === tipIndex;
    const cx = (50 + Math.cos(a) * 43).toFixed(1);
    const cy = (50 + Math.sin(a) * 43).toFixed(1);
    const halo = lit ? `<circle cx="${cx}" cy="${cy}" r="${tip ? 8 : 6.4}" fill="${accent}" opacity=".16"/>` : '';
    return `${halo}<circle cx="${cx}" cy="${cy}" r="${lit ? (tip ? 5 : 4.2) : 2.9}" fill="${lit ? accent : 'oklch(0.72 0.05 300 / .4)'}"/>`;
  }).join('');
  return `            <span class="knob">
              <svg viewBox="0 0 100 100" aria-hidden="true">${dots}</svg>
              <i class="bezel"></i><i class="cap"></i><i class="sheen"></i>
              <i class="ptr" style="transform:rotate(${angle}deg)"><b style="--acc:${accent};--accg:oklch(0.72 0.2 ${hue} / .4);--acct:oklch(0.84 0.14 ${hue})"></b></i>
            </span>`;
}).join('\n');

// ---- Stars, same deterministic hash as the app ----
const hash = (i, salt) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const r2 = (n) => Math.round(n * 100) / 100;
const stars = Array.from({ length: 48 }, (_, i) => {
  const x = r2(hash(i, 1) * 100), y = r2(hash(i, 2) * 100);
  const size = r2(1 + hash(i, 3) * 2.6);
  const sparkle = hash(i, 6) > 0.84;
  const s = sparkle ? size * 2 : size;
  const shape = sparkle
    ? 'clip-path:polygon(50% 0%,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0% 50%,40% 40%)'
    : 'border-radius:9999px';
  return `      <span style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${sparkle ? 0.8 : 0.45};${shape}"></span>`;
}).join('\n');

const markup = `      <div class="ipad-screen">
        <div class="app-bar">
          <span class="app-brand">Purple Piano</span>
          <span class="app-preset">
            <i class="nav">&#8249;</i>
            <span class="preset-mid">
              <b>Buzzy Bee</b>
              <span class="dots"><i></i><i></i><i></i><i></i><i class="on"></i><i></i></span>
            </span>
            <i class="nav">&#8250;</i>
          </span>
          <span class="app-btns"><i class="paint"></i><i></i><i></i><i></i></span>
        </div>

        <div class="app-rack">
          <div class="knobs">
${knobHtml}
          </div>
          <div class="tone">
            <span class="tone-label">Tone</span>
            <span class="tone-grid"><i>Soft</i><i>Mellow</i><i class="on">Buzzy</i><i>Chunky</i></span>
          </div>
        </div>

        <div class="app-roll">
          <div class="roll-head"><span>Song maker</span><span>Drag across the squares to draw a tune</span></div>
          <div class="roll-body">
            <div class="lanes">
${laneHtml}
            </div>
            <div class="cells">
${cellHtml}
            </div>
          </div>
        </div>

        <div class="app-transport">
          <span class="pill oct"><i>&minus;</i><b>C4</b><i>+</i></span>
          <span class="play"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l14 8-14 8z"/></svg>Play</span>
          <span class="pill rec"><i class="dot"></i>Rec</span>
        </div>

        <div class="app-keys">
          <div class="whites">
${whiteHtml}
          </div>
          <div class="blacks">
${blackHtml}
          </div>
        </div>
      </div>`;

writeFileSync(new URL('./_ipad.html', import.meta.url), markup);
writeFileSync(new URL('./_stars.html', import.meta.url), stars);
console.log('wrote _ipad.html (%d bytes) and _stars.html', markup.length);
