// Generates Main.dc.html for the Purple Piano design canvas.
// Every colour recipe here is lifted verbatim from the app source at
// nextjs-prototypes/app/prototypes/purple-piano (data.ts, piano-keys.tsx,
// piano-roll.tsx, knob.tsx) — no rounding, no eyeballing.
import { writeFileSync } from 'node:fs';

const HUES = [350, 20, 45, 70, 95, 135, 165, 190, 225, 265, 295, 320];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nc = (m, l, c, a = 1) =>
  `oklch(${l} ${c} ${HUES[m % 12]}${a === 1 ? '' : ` / ${a}`})`;
const isBlack = (m) => NAMES[m % 12].length > 1;
const letter = (m) => NAMES[m % 12];

// ---- Keyboard: 14 white keys from C4, as in the reference screenshot ----
const WHITE_COUNT = 14;
const whites = [];
for (let m = 60; whites.length < WHITE_COUNT; m++) if (!isBlack(m)) whites.push(m);
const blacks = whites
  .slice(0, -1)
  .map((midi, index) => ({ midi: midi + 1, index }))
  .filter(({ midi }) => isBlack(midi));

const whiteKeys = whites
  .map(
    (m) => `        <div style="position: relative; display: flex; flex: 1 1 0; min-width: 0; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 12px; border-radius: 0 0 16px 16px; background: linear-gradient(180deg, ${nc(m, 0.98, 0.01)} 0%, ${nc(m, 0.88, 0.09)} 100%); box-shadow: inset 0 -6px 0 ${nc(m, 0.78, 0.12)};">
          <span style="font-size: 18px; font-weight: 900; color: ${nc(m, 0.45, 0.15)};">${letter(m)}</span>
        </div>`,
  )
  .join('\n');

// Black keys: 62% height, 60% of a white-key width, centred on the seam.
const blackKeys = blacks
  .map(
    ({ midi, index }) => `        <div style="position: absolute; top: 0; height: 62%; left: ${(((index + 1) / WHITE_COUNT) * 100).toFixed(4)}%; width: ${((100 / WHITE_COUNT) * 0.6).toFixed(4)}%; transform: translateX(-50%); border-radius: 0 0 12px 12px; background: linear-gradient(180deg, ${nc(midi, 0.36, 0.1)} 0%, ${nc(midi, 0.25, 0.08)} 100%); box-shadow: inset 0 -5px 0 ${nc(midi, 0.52, 0.17)}, 0 4px 8px oklch(0.15 0.03 275 / 0.6);"></div>`,
  )
  .join('\n');

// ---- Piano roll: pentatonic lanes, top = highest ----
const SCALE_MIDI = [60, 62, 64, 67, 69, 72, 74, 76];
const lanes = [...SCALE_MIDI].reverse();
const STEPS = 16;
// The "Buzzy Bee" tune from the reference screenshot: [laneIndexFromTop, step]
const ON = new Set(['1-14', '1-15', '2-0', '2-12', '3-5', '3-8', '3-9', '4-0', '4-6']);

const laneLabels = lanes
  .map(
    (m) => `          <div style="display: flex; flex: 1 1 0; min-height: 0; align-items: center; justify-content: center; gap: 5px; border-radius: 8px; border: 1px solid oklch(0.72 0.11 295 / 0.28); background: oklch(0.28 0.07 300 / 0.6); font-size: 13px; font-weight: 900; color: oklch(0.96 0.01 300);">
            <span style="height: 9px; width: 9px; flex-shrink: 0; border-radius: 9999px; background: ${nc(m, 0.72, 0.2)};"></span>${letter(m)}
          </div>`,
  )
  .join('\n');

const rollRows = lanes
  .map((m, row) => {
    const cells = Array.from({ length: STEPS }, (_, col) => {
      const on = ON.has(`${row}-${col}`);
      if (on) {
        return `<div style="flex: 1 1 0; min-width: 0; border-radius: 10px; background: ${nc(m, 0.74, 0.2)}; box-shadow: 0 0 12px ${nc(m, 0.7, 0.22, 0.75)};"></div>`;
      }
      // Every 4th step sits brighter, marking the beat.
      const bg = col % 4 === 0 ? 'oklch(0.98 0 0 / 0.15)' : 'oklch(0.98 0 0 / 0.08)';
      return `<div style="flex: 1 1 0; min-width: 0; border-radius: 10px; border: 1px solid oklch(0.98 0 0 / 0.15); background: ${bg};"></div>`;
    }).join('');
    return `          <div style="display: flex; flex: 1 1 0; min-height: 0; gap: 6px;">${cells}</div>`;
  })
  .join('\n');

// ---- Knobs: 13 dots over a -140°..140° sweep ----
const KNOBS = [
  { label: 'Space', hue: 265, value: 0.25 },
  { label: 'Wobble', hue: 195, value: 0.7 },
  { label: 'Sparkle', hue: 70, value: 0.5 },
  { label: 'Echo', hue: 145, value: 0.2 },
  { label: 'Dream', hue: 320, value: 0.15 },
];
const MIN_ANGLE = -140, MAX_ANGLE = 140, DOTS = 13;

const ICONS = {
  Space: '<circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 0 20"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)"/>',
  Wobble: '<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  Sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
  Echo: '<path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 11h2"/>',
  Dream: '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.7A3.5 3.5 0 0 0 6.5 19z"/>',
};

const knobHtml = KNOBS.map(({ label, hue, value }) => {
  const accent = `oklch(0.72 0.2 ${hue})`;
  const accentGlow = `oklch(0.72 0.2 ${hue} / 0.4)`;
  const angle = MIN_ANGLE + value * (MAX_ANGLE - MIN_ANGLE);
  const tipIndex = Math.floor(value * (DOTS - 1) + 0.001);
  const dots = Array.from({ length: DOTS }, (_, i) => {
    const t = i / (DOTS - 1);
    const a = ((MIN_ANGLE + t * (MAX_ANGLE - MIN_ANGLE) - 90) * Math.PI) / 180;
    const lit = t <= value + 0.001;
    const tip = lit && i === tipIndex;
    const cx = (50 + Math.cos(a) * 43).toFixed(2);
    const cy = (50 + Math.sin(a) * 43).toFixed(2);
    const halo = lit
      ? `<circle cx="${cx}" cy="${cy}" r="${tip ? 8 : 6.4}" fill="${accent}" opacity="0.16"/>`
      : '';
    const r = lit ? (tip ? 5 : 4.2) : 2.9;
    const fill = lit ? accent : 'oklch(0.72 0.05 300 / 0.4)';
    return `${halo}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  }).join('');

  return `            <div style="display: flex; flex-shrink: 0; flex-direction: column; align-items: center; gap: 4px;">
              <div style="position: relative; height: 76px; width: 76px; border-radius: 9999px;">
                <svg viewBox="0 0 100 100" style="position: absolute; inset: 0; height: 100%; width: 100%;">${dots}</svg>
                <div style="position: absolute; inset: 13%; border-radius: 9999px; background: linear-gradient(to bottom, oklch(0.74 0.13 300), oklch(0.38 0.14 300)); box-shadow: 0 5px 12px -3px rgb(0 0 0 / 0.5), 0 1px 2px rgb(0 0 0 / 0.35);"></div>
                <div style="position: absolute; inset: 17.5%; border-radius: 9999px; background: radial-gradient(115% 115% at 32% 22%, oklch(0.76 0.12 300) 0%, oklch(0.55 0.21 300) 48%, oklch(0.44 0.17 300) 100%); box-shadow: inset 0 1px 1px rgb(255 255 255 / 0.35), inset 0 -3px 6px rgb(0 0 0 / 0.3);"></div>
                <div style="position: absolute; inset: 17.5%; border-radius: 9999px; background: radial-gradient(65% 42% at 50% 14%, rgb(255 255 255 / 0.3), transparent 70%);"></div>
                <div style="position: absolute; inset: 17.5%; border-radius: 9999px; transform: rotate(${angle}deg);">
                  <span style="position: absolute; left: 50%; top: 9%; height: 34%; width: 9%; transform: translateX(-50%); border-radius: 9999px; background: linear-gradient(to bottom, oklch(0.84 0.14 ${hue}), ${accent}); box-shadow: 0 0 6px ${accentGlow}, inset 0 1px 1px rgb(255 255 255 / 0.45);"></span>
                </div>
              </div>
              <span style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.96 0.01 300 / 0.8);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[label]}</svg>${label}
              </span>
            </div>`;
}).join('\n');

// ---- Preset dots: Buzzy Bee is index 4 of 6 ----
const presetDots = Array.from({ length: 6 }, (_, i) =>
  `<span style="height: 6px; width: 6px; border-radius: 9999px; background: ${i === 4 ? 'oklch(0.96 0.01 300)' : 'oklch(0.96 0.01 300 / 0.25)'};"></span>`,
).join('');

const TONES = ['Soft', 'Mellow', 'Buzzy', 'Chunky'];
const toneBtns = TONES.map((t) => {
  const on = t === 'Buzzy';
  return `              <div style="border-radius: 9999px; padding: 6px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.025em; text-align: center; ${on ? 'background: oklch(0.55 0.21 300); color: oklch(0.98 0.01 300);' : 'background: oklch(0.28 0.07 300 / 0.7); color: oklch(0.75 0.04 300);'}">${t}</div>`;
}).join('\n');

// ---- Stars: the app's deterministic field, same hash ----
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
  const clip = sparkle
    ? ' clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%);'
    : ' border-radius: 9999px;';
  return `      <span style="position: absolute; left: ${x}%; top: ${y}%; width: ${s}px; height: ${s}px; background: oklch(0.98 0.01 300 / 0.7); opacity: ${sparkle ? 0.8 : 0.45};${clip}"></span>`;
}).join('\n');

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap">
  <style>
    body { margin: 0; font-family: "Baloo 2", ui-rounded, system-ui, sans-serif; }
    a { color: oklch(0.72 0.11 295); }
    a:hover { color: oklch(0.82 0.09 295); }
  </style>
</helmet>
<div style="position: relative; width: 1280px; height: 880px; overflow: hidden; display: flex; flex-direction: column; background: oklch(0.19 0.05 300);">

  <!-- Nebula wash + deterministic star field -->
  <div style="position: absolute; inset: 0; overflow: hidden;">
    <div style="position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% -10%, oklch(0.42 0.16 300) 0%, transparent 62%), radial-gradient(85% 65% at 10% 106%, oklch(0.55 0.18 330 / 0.58) 0%, transparent 70%), radial-gradient(85% 65% at 94% 96%, oklch(0.6 0.15 200 / 0.48) 0%, transparent 70%), radial-gradient(65% 50% at 80% 6%, oklch(0.58 0.16 265 / 0.38) 0%, transparent 70%);"></div>
${stars}
  </div>

  <!-- HEADER -->
  <div style="position: relative; z-index: 10; display: flex; align-items: center; gap: 16px; padding: 12px 20px 8px;">
    <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: oklch(0.75 0.04 300);">Purple Piano</span>

    <div style="display: flex; flex: 1 1 0; justify-content: center;">
      <div style="display: flex; width: 100%; max-width: 420px; align-items: center; gap: 12px; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.5); padding: 6px;">
        <div style="display: grid; height: 44px; width: 44px; flex-shrink: 0; place-items: center; border-radius: 9999px; background: oklch(0.55 0.21 300); color: oklch(0.98 0.01 300);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </div>
        <div style="min-width: 0; flex: 1 1 0; text-align: center;">
          <div style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: oklch(0.98 0.01 300);">Buzzy Bee</div>
          <div style="margin-top: 2px; display: flex; justify-content: center; gap: 4px;">${presetDots}</div>
        </div>
        <div style="display: grid; height: 44px; width: 44px; flex-shrink: 0; place-items: center; border-radius: 9999px; background: oklch(0.55 0.21 300); color: oklch(0.98 0.01 300);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 6px;">
      <div style="display: grid; height: 44px; width: 44px; place-items: center; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.55 0.21 300); color: white;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.4 2.6a2 2 0 0 1 3 3L11 16l-4 1 1-4z"/><path d="M6 16a3 3 0 0 0-3 3c0 1-1 2-1 2 2 1 5 1 6-2a3 3 0 0 0-2-3z"/></svg>
      </div>
      <div style="display: grid; height: 44px; width: 44px; place-items: center; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); color: oklch(0.96 0.01 300);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="8" cy="18" r="2" fill="currentColor"/></svg>
      </div>
      <div style="display: grid; height: 44px; width: 44px; place-items: center; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); color: oklch(0.96 0.01 300);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>
      </div>
      <div style="display: grid; height: 44px; width: 44px; place-items: center; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); color: oklch(0.96 0.01 300);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9l5-5 5 5"/><path d="M7 15l5 5 5-5"/></svg>
      </div>
    </div>
  </div>

  <!-- KNOB RACK -->
  <div style="position: relative; z-index: 10; flex-shrink: 0; margin: 0 16px;">
    <div style="position: relative; border-radius: 24px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.5); padding: 12px 24px;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 24px;">
${knobHtml}
      </div>
      <div style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.75 0.04 300);">Tone</span>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px;">
${toneBtns}
        </div>
      </div>
    </div>
  </div>

  <!-- SONG MAKER -->
  <div style="position: relative; z-index: 10; display: flex; flex: 1 1 0; min-height: 0; flex-direction: column; gap: 4px; padding: 12px 16px 4px;">
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 4px;">
      <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: oklch(0.75 0.04 300);">Song maker</span>
      <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.75 0.04 300);">Drag across the squares to draw a tune</span>
    </div>
    <div style="display: flex; min-height: 0; flex: 1 1 0; gap: 8px;">
      <div style="display: flex; width: 48px; flex-shrink: 0; flex-direction: column; gap: 6px;">
${laneLabels}
      </div>
      <div style="display: flex; min-width: 0; flex: 1 1 0; flex-direction: column; gap: 6px;">
${rollRows}
      </div>
    </div>
  </div>

  <!-- TRANSPORT -->
  <div style="position: relative; z-index: 10; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 16px; padding: 8px 20px 12px;">
    <div style="display: flex; flex: 1 1 0; align-items: center; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 4px; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); padding: 4px;">
        <div style="display: grid; height: 32px; width: 32px; place-items: center; border-radius: 9999px; font-size: 16px; font-weight: 900; color: oklch(0.96 0.01 300);">−</div>
        <span style="min-width: 36px; text-align: center; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.025em; color: oklch(0.96 0.01 300);">C4</span>
        <div style="display: grid; height: 32px; width: 32px; place-items: center; border-radius: 9999px; font-size: 16px; font-weight: 900; color: oklch(0.96 0.01 300);">+</div>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); padding: 4px;">
        <div style="display: grid; height: 32px; width: 32px; place-items: center; border-radius: 9999px; color: oklch(0.75 0.04 300);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13a9 9 0 0 0 9 9c4 0 6-3 6-6s-2-5-5-5H8"/><circle cx="16" cy="7" r="3"/></svg>
        </div>
        <div style="display: grid; height: 32px; width: 32px; place-items: center; border-radius: 9999px; background: oklch(0.55 0.21 300); color: oklch(0.98 0.01 300);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a8 8 0 0 1 16 0"/><path d="M2 14h20"/><circle cx="12" cy="9" r="2"/></svg>
        </div>
        <div style="display: grid; height: 32px; width: 32px; place-items: center; border-radius: 9999px; color: oklch(0.75 0.04 300);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 22c4 0 7-3 7-7 0-4-3-6-6-6H9"/><path d="M9 9L5 5"/><circle cx="17" cy="6" r="2"/></svg>
        </div>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="display: flex; height: 56px; align-items: center; gap: 10px; border-radius: 9999px; background: oklch(0.78 0.1 300); padding: 0 28px; color: oklch(0.24 0.09 300);">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l14 8-14 8z"/></svg>
        <span style="font-size: 19px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;">Play</span>
      </div>
      <div style="display: flex; height: 56px; align-items: center; gap: 10px; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); padding: 0 24px; color: oklch(0.96 0.01 300);">
        <span style="height: 14px; width: 14px; border-radius: 9999px; background: oklch(0.75 0.04 300);"></span>
        <span style="font-size: 19px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;">Rec</span>
      </div>
    </div>

    <div style="display: flex; flex: 1 1 0; align-items: center; justify-content: flex-end; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 8px; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); padding: 10px 20px; color: oklch(0.96 0.01 300);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.85 0.15 70)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>
        <span style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">Magic</span>
      </div>
      <div style="display: grid; height: 44px; width: 44px; place-items: center; border-radius: 9999px; border: 1px solid oklch(0.72 0.11 295 / 0.3); background: oklch(0.28 0.07 300 / 0.6); color: oklch(0.96 0.01 300);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h13"/><path d="M3 17l10-10 5 5-10 10H3z"/></svg>
      </div>
    </div>
  </div>

  <!-- KEYBOARD -->
  <div style="position: relative; z-index: 10; height: 240px; width: 100%; flex-shrink: 0;">
    <div style="display: flex; height: 100%; width: 100%; gap: 2px;">
${whiteKeys}
    </div>
    <div style="position: absolute; inset: 0;">
${blackKeys}
    </div>
  </div>

</div>
</x-dc>
<script data-dc-script data-props='{}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;

writeFileSync(new URL('./Main.dc.html', import.meta.url), html);
console.log('Main.dc.html written:', html.length, 'bytes');
console.log('white keys:', whites.map(letter).join(' '));
console.log('black keys at:', blacks.map((b) => b.index).join(','));
