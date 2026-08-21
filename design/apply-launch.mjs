// Adds: single-line ghost button, iPad lift on button hover, and the
// zoom-to-fullscreen launch transition.
import { readFileSync, writeFileSync } from 'node:fs';

const p = new URL('../style.css', import.meta.url);
let s = readFileSync(p, 'utf8');

// The ghost button is now a single label — centre it against the icon.
s = s.replace(
  `.btn-ghost {`,
  `.btn-ghost .btn-main { font-size: 1.15rem; }
.btn-ghost {`,
);

const MARKER = '/* ---------- Content pages ---------- */';
const i = s.indexOf(MARKER);
if (i === -1) throw new Error('content-pages marker not found');

const css = `/* ---------- Launch: hover lift + zoom to fullscreen ----------
   The iPad rises toward the reader while the play button is hovered, then
   flies up to fill the viewport on click while the target page preloads. */

/* Hover lift. .is-lifted is set by script on pointer enter/leave so the
   effect reads from the BUTTON, not from hovering the iPad itself. */
.stage .ipad.is-lifted {
  transform: rotateX(2deg) rotateY(-4deg) rotateZ(0deg) scale(1.045);
  box-shadow: 0 70px 120px -40px rgba(0,0,0,.8),
              0 0 0 1px rgba(255,255,255,.18),
              0 0 90px -30px var(--accent);
}

/* While launching, the iPad is promoted to a fixed layer and scaled to fill
   the viewport. --fly-* are measured and set by script so the element starts
   exactly where it already sits — no jump at the hand-off. */
.ipad.is-flying {
  position: fixed;
  left: var(--fly-x); top: var(--fly-y);
  width: var(--fly-w); height: var(--fly-h);
  margin: 0;
  z-index: 60;
  transform: none;
  transition: none;
  will-change: transform, opacity;
}
.ipad.is-flying.go {
  transform: translate3d(var(--fly-dx), var(--fly-dy), 0) scale(var(--fly-scale));
  transition: transform .72s cubic-bezier(.7,0,.2,1),
              border-radius .72s cubic-bezier(.7,0,.2,1);
  border-radius: 0;
}

/* Curtain fades the page out behind the flying iPad. */
.launch-veil {
  position: fixed; inset: 0; z-index: 55;
  background: oklch(0.19 0.05 300);
  opacity: 0;
  pointer-events: none;
  transition: opacity .6s ease;
}
.launch-veil.on { opacity: 1; }

/* Anything that isn't the iPad recedes during the flight. */
.is-launching .site-header,
.is-launching .hero,
.is-launching .site-footer,
.is-launching .cosmos,
.is-launching .stars {
  opacity: 0;
  transition: opacity .45s ease;
  pointer-events: none;
}
.is-launching { overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  .stage .ipad.is-lifted { transform: none; }
  .ipad.is-flying.go { transition: none; }
  .launch-veil { transition: none; }
}

`;

s = s.slice(0, i) + css + s.slice(i);
writeFileSync(p, s);
console.log('launch CSS added');
