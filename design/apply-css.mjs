// Replaces the hand-approximated iPad CSS block with rules matching the app.
import { readFileSync, writeFileSync } from 'node:fs';

const p = new URL('../style.css', import.meta.url);
let s = readFileSync(p, 'utf8');

const START = '/* ---------- iPad ---------- */';
const END = '/* ---------- Content pages ---------- */';
const a = s.indexOf(START);
const b = s.indexOf(END);
if (a === -1 || b === -1) throw new Error('iPad CSS block bounds not found');

const css = `/* ---------- iPad ----------
   Geometry and colour lifted from the app source (purple-piano/*.tsx):
   pitch colours via oklch hue wheel, 6px key lips, black keys at 62%
   height and 60% width centred on the seams, 13-dot knob rings. */
.stage {
  position: relative; z-index: 1;
  padding: clamp(1rem, 3vw, 2rem) 0 clamp(3rem, 8vw, 5rem);
  perspective: 1800px;
  overflow: hidden;
}
.ipad {
  width: min(92%, 1060px);
  margin-inline: auto;
  aspect-ratio: 16 / 11;
  border-radius: clamp(14px, 2vw, 26px);
  padding: clamp(4px, .62vw, 9px);
  background: linear-gradient(150deg, #b9bac9 0%, #74758c 30%, #43445a 62%, #9c9db1 100%);
  box-shadow: 0 50px 90px -30px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.14);
  transform: rotateX(7deg) rotateY(-13deg) rotateZ(2deg);
  transform-origin: 50% 60%;
  transition: transform .6s cubic-bezier(.22,.61,.36,1);
}
.stage:hover .ipad { transform: rotateX(3deg) rotateY(-6deg) rotateZ(1deg); }

/* The app's own chrome: --background mixed 86% with the royal-purple tint. */
.ipad-screen {
  height: 100%;
  border-radius: clamp(9px, 1.4vw, 17px);
  background:
    radial-gradient(120% 90% at 50% -10%, oklch(0.42 0.16 300) 0%, transparent 62%),
    radial-gradient(85% 65% at 10% 106%, oklch(0.55 0.18 330 / .58) 0%, transparent 70%),
    radial-gradient(85% 65% at 94% 96%, oklch(0.6 0.15 200 / .48) 0%, transparent 70%),
    oklch(0.19 0.05 300);
  padding: clamp(.4rem, 1vw, .8rem);
  display: flex; flex-direction: column; gap: clamp(.25rem, .7vw, .55rem);
  overflow: hidden;
  container-type: inline-size;
}

/* Sizes track the iPad's own width, so every part scales together. */
.ipad-screen { --u: 1cqw; }

/* Header */
.app-bar { display: flex; align-items: center; gap: 1.2cqw; flex: none; }
.app-brand {
  font-family: var(--display); font-weight: 800;
  font-size: 1.05cqw; letter-spacing: .18em; text-transform: uppercase;
  color: oklch(0.75 0.04 300); white-space: nowrap;
}
.app-preset {
  display: flex; align-items: center; gap: 1cqw;
  margin-inline: auto;
  width: min(34cqw, 420px);
  border-radius: 999px;
  border: 1px solid oklch(0.72 0.11 295 / .3);
  background: oklch(0.28 0.07 300 / .5);
  padding: .45cqw;
}
.app-preset .nav {
  display: grid; place-items: center; flex: none;
  width: 3.4cqw; height: 3.4cqw; border-radius: 999px;
  background: oklch(0.55 0.21 300); color: oklch(0.98 0.01 300);
  font-size: 2cqw; font-style: normal; line-height: 1;
}
.preset-mid { flex: 1; min-width: 0; text-align: center; }
.preset-mid b {
  display: block;
  font-family: var(--display); font-weight: 800;
  font-size: 1.6cqw; letter-spacing: .12em; text-transform: uppercase;
  color: oklch(0.98 0.01 300); line-height: 1.2;
}
.preset-mid .dots { display: flex; justify-content: center; gap: .35cqw; margin-top: .2cqw; }
.preset-mid .dots i { width: .5cqw; height: .5cqw; border-radius: 999px; background: oklch(0.96 0.01 300 / .25); }
.preset-mid .dots i.on { background: oklch(0.96 0.01 300); }

.app-btns { display: flex; align-items: center; gap: .5cqw; flex: none; }
.app-btns i {
  width: 3.4cqw; height: 3.4cqw; border-radius: 999px;
  border: 1px solid oklch(0.72 0.11 295 / .3);
  background: oklch(0.28 0.07 300 / .6);
}
.app-btns i.paint { background: oklch(0.55 0.21 300); }

/* Knob rack */
.app-rack {
  position: relative; flex: none;
  border-radius: 2cqw;
  border: 1px solid oklch(0.72 0.11 295 / .3);
  background: oklch(0.28 0.07 300 / .5);
  padding: .9cqw 2cqw;
}
.knobs { display: flex; align-items: center; justify-content: center; gap: 2.4cqw; }
.knob { position: relative; width: 6.2cqw; aspect-ratio: 1; flex: none; }
.knob svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.knob i { position: absolute; border-radius: 999px; }
.knob .bezel {
  inset: 13%;
  background: linear-gradient(to bottom, oklch(0.74 0.13 300), oklch(0.38 0.14 300));
  box-shadow: 0 5px 12px -3px rgb(0 0 0 / .5), 0 1px 2px rgb(0 0 0 / .35);
}
.knob .cap {
  inset: 17.5%;
  background: radial-gradient(115% 115% at 32% 22%, oklch(0.76 0.12 300) 0%, oklch(0.55 0.21 300) 48%, oklch(0.44 0.17 300) 100%);
  box-shadow: inset 0 1px 1px rgb(255 255 255 / .35), inset 0 -3px 6px rgb(0 0 0 / .3);
}
.knob .sheen { inset: 17.5%; background: radial-gradient(65% 42% at 50% 14%, rgb(255 255 255 / .3), transparent 70%); }
.knob .ptr { inset: 17.5%; }
.knob .ptr b {
  position: absolute; left: 50%; top: 9%;
  height: 34%; width: 9%; transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(to bottom, var(--acct), var(--acc));
  box-shadow: 0 0 6px var(--accg), inset 0 1px 1px rgb(255 255 255 / .45);
}

.tone { position: absolute; right: 2cqw; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: .3cqw; }
.tone-label { font-size: .85cqw; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; color: oklch(0.75 0.04 300); }
.tone-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .3cqw; }
.tone-grid i {
  border-radius: 999px; padding: .45cqw .8cqw;
  font-size: .9cqw; font-weight: 900; font-style: normal;
  text-transform: uppercase; letter-spacing: .025em; text-align: center;
  background: oklch(0.28 0.07 300 / .7); color: oklch(0.75 0.04 300);
}
.tone-grid i.on { background: oklch(0.55 0.21 300); color: oklch(0.98 0.01 300); }

/* Song maker */
.app-roll { display: flex; flex: 1 1 auto; min-height: 0; flex-direction: column; gap: .4cqw; padding: 0 .3cqw; }
.roll-head { display: flex; align-items: center; justify-content: space-between; }
.roll-head span {
  font-size: .85cqw; font-weight: 900; text-transform: uppercase;
  letter-spacing: .2em; color: oklch(0.75 0.04 300);
}
.roll-head span:last-child { letter-spacing: .05em; font-weight: 700; }
.roll-body { display: flex; flex: 1; min-height: 0; gap: .7cqw; }
.lanes { display: flex; width: 4cqw; flex: none; flex-direction: column; gap: .5cqw; }
.lane {
  display: flex; flex: 1; min-height: 0; align-items: center; justify-content: center; gap: .4cqw;
  border-radius: .7cqw;
  border: 1px solid oklch(0.72 0.11 295 / .28);
  background: oklch(0.28 0.07 300 / .6);
  font-family: var(--display); font-weight: 900; font-size: 1.1cqw;
  color: oklch(0.96 0.01 300);
}
.lane i { width: .75cqw; height: .75cqw; border-radius: 999px; flex: none; }
.cells { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: .5cqw; }
.rollrow { display: flex; flex: 1; min-height: 0; gap: .5cqw; }
.cell {
  flex: 1; min-width: 0; border-radius: .8cqw;
  border: 1px solid oklch(0.98 0 0 / .15);
  background: oklch(0.98 0 0 / .08);
}
.cell.beat { background: oklch(0.98 0 0 / .15); }
.cell.on { border-color: transparent; background: var(--note); box-shadow: 0 0 12px var(--halo); }

/* Transport */
.app-transport { display: flex; flex: none; align-items: center; justify-content: center; gap: 1.2cqw; padding: .3cqw 0; }
.pill {
  display: inline-flex; align-items: center; gap: .6cqw;
  border-radius: 999px;
  border: 1px solid oklch(0.72 0.11 295 / .3);
  background: oklch(0.28 0.07 300 / .6);
  padding: .5cqw 1.4cqw;
  font-family: var(--display); font-weight: 800;
  font-size: 1.35cqw; text-transform: uppercase; letter-spacing: .06em;
  color: oklch(0.96 0.01 300);
}
.pill i { font-style: normal; }
.pill.oct b { min-width: 3cqw; text-align: center; font-size: 1.05cqw; }
.pill .dot { width: 1.1cqw; height: 1.1cqw; border-radius: 999px; background: oklch(0.75 0.04 300); }
.play {
  display: inline-flex; align-items: center; gap: .7cqw;
  border-radius: 999px;
  background: oklch(0.78 0.1 300);
  padding: .55cqw 2.2cqw;
  font-family: var(--display); font-weight: 800;
  font-size: 1.5cqw; text-transform: uppercase; letter-spacing: .06em;
  color: oklch(0.24 0.09 300);
}
.play svg { width: 1.5cqw; height: 1.5cqw; }

/* Keyboard */
.app-keys { position: relative; flex: none; height: 27%; }
.whites { display: flex; height: 100%; width: 100%; gap: 2px; }
.wk {
  position: relative; display: flex; flex: 1; min-width: 0;
  align-items: flex-end; justify-content: center;
  padding-bottom: .8cqw;
  border-radius: 0 0 1.3cqw 1.3cqw;
  background: linear-gradient(180deg, var(--fill-top) 0%, var(--fill-bot) 100%);
  box-shadow: inset 0 -6px 0 var(--lip);
  font-family: var(--display); font-weight: 900; font-size: 1.3cqw;
  color: var(--ink);
}
.blacks { position: absolute; inset: 0; }
.bk {
  position: absolute; top: 0; height: 62%;
  transform: translateX(-50%);
  border-radius: 0 0 1cqw 1cqw;
  background: linear-gradient(180deg, var(--bk-top) 0%, var(--bk-bot) 100%);
  box-shadow: inset 0 -5px 0 var(--bk-lip), 0 4px 8px oklch(0.15 0.03 275 / .6);
}

@media (max-width: 700px) {
  .ipad { transform: rotateX(4deg) rotateY(-7deg); width: min(96%, 560px); }
  .app-brand, .tone { display: none; }
}
@media (max-width: 430px) {
  .ipad { transform: none; aspect-ratio: 3 / 2.4; }
  .app-btns, .roll-head span:last-child { display: none; }
  .cta-row { flex-direction: column; align-items: stretch; }
  .cta-row .btn { justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  h1.magnetic, h1.magnetic::after, .tagline, .ipad { transition: none !important; transform: none !important; }
  .stage:hover .ipad { transform: rotateX(7deg) rotateY(-13deg) rotateZ(2deg); }
}

`;

s = s.slice(0, a) + css + s.slice(b);
writeFileSync(p, s);
console.log('style.css iPad block replaced');
