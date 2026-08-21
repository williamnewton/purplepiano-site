// Puts the real Purple Piano wordmark (from the Paper file's LOGO artboard)
// into the hero and page headers, in place of the app icon.
//
// Exact values from Paper (nodes UI-0 / UJ-0 / UK-0):
//   Poppins 800, 46px, letter-spacing -0.02em, line-height 56px
//   "purple" #B79BFF · "piano" 6-stop oklab rainbow · gap 0.16em
//   container: display:flex, align-items:baseline
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

const WORDMARK = (cls) =>
  `<span class="${cls}"><span class="wm-purple">purple</span><span class="wm-piano">piano</span></span>`;

// ---------- index.html ----------
const ip = new URL('./index.html', root);
let s = readFileSync(ip, 'utf8');

// Replace the hero logo SVG with the wordmark.
const svgRe = /<svg class="hero-mark"[\s\S]*?<\/svg>/;
if (!svgRe.test(s)) throw new Error('hero-mark svg not found');
s = s.replace(svgRe, WORDMARK('wordmark hero-wordmark'));

writeFileSync(ip, s);
console.log('index.html: hero now uses the wordmark');

// ---------- support.html / privacy.html ----------
for (const file of ['support.html', 'privacy.html']) {
  const p = new URL('./' + file, root);
  let t = readFileSync(p, 'utf8');
  const brandRe = /(<a class="brand" href="\/"[^>]*>)<svg[\s\S]*?<\/svg>(<\/a>)/;
  if (!brandRe.test(t)) throw new Error('brand svg not found in ' + file);
  t = t.replace(brandRe, `$1${WORDMARK('wordmark brand-wordmark')}$2`);
  writeFileSync(p, t);
  console.log(file + ': header now uses the wordmark');
}

// ---------- style.css ----------
const cp = new URL('./style.css', root);
let c = readFileSync(cp, 'utf8');

// Poppins 800 for the wordmark, alongside the existing display face.
c = c.replace(
  '  --display: "Baloo 2"',
  '  --wordmark: "Poppins", ui-rounded, system-ui, sans-serif;\n  --display: "Baloo 2"',
);

// Swap the old hero-mark block for wordmark rules.
const OLD_START = '/* The logo IS the hero title: an <h1> wraps it so the page keeps a real';
const OLD_END = '@media (max-width: 700px) {\n  .site-header { display: none; }';
const a = c.indexOf(OLD_START);
const b = c.indexOf(OLD_END);
if (a === -1 || b === -1) throw new Error('hero-mark css block not found');

const NEW = `/* ---------- Wordmark ----------
   The Purple Piano logo, matched to the Paper source: Poppins 800 at
   -0.02em, "purple" in solid lavender and "piano" carrying the rainbow
   the app uses for pitch colour. */
.wordmark {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--wordmark);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.22;
  white-space: nowrap;
}
.wm-purple { color: #B79BFF; }
.wm-piano {
  margin-left: 0.16em;
  /* sRGB first as the fallback, then the oklab original for browsers that
     support interpolation hints — oklab keeps the mid-tones from going
     muddy between the stops. */
  background-image: linear-gradient(90deg, #f45d9e 0%, #ff9a3d 20%, #f2d93a 40%, #5be0a8 60%, #47c8f0 80%, #8b7bf0 100%);
  background-image: linear-gradient(in oklab 90deg, oklab(69.1% 0.194 -0.011) 0%, oklab(77.6% 0.082 0.136) 20%, oklab(88% -0.028 0.165) 40%, oklab(81.8% -0.136 0.043) 60%, oklab(77.9% -0.091 -0.084) 80%, oklab(65.2% 0.049 -0.162) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* The wordmark IS the hero title, and carries the cursor-reactive motion. */
.hero-wordmark {
  display: flex;
  justify-content: center;
  font-size: clamp(2.5rem, 7vw, 4.75rem);
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
  transform: translate3d(calc(var(--mx) * 12px), calc(var(--my) * 8px), 0);
  transition: transform .25s cubic-bezier(.22,.61,.36,1);
}
.hero:hover .hero-wordmark { will-change: transform; }

/* Header lockup on the inner pages. */
.brand-wordmark { font-size: 1.25rem; }

@media (max-width: 700px) {
  .site-header { display: none; }`;

c = c.slice(0, a) + NEW + c.slice(b + OLD_END.length);

// Mobile: the wordmark replaces the old mark sizing.
c = c.replace('  .hero-mark { width: clamp(96px, 30vw, 148px); }', '');

// Reduced motion.
c = c.replace(
  '  .hero-mark, .tagline, .ipad { transition: none !important; transform: none !important; }',
  '  .hero-wordmark, .tagline, .ipad { transition: none !important; transform: none !important; }',
);

// The h1 wrapper no longer needs font-size: 0 (it wrapped an svg before).
c = c.replace('.hero-title { margin: 0; font-size: 0; line-height: 0; }', '.hero-title { margin: 0; }');

writeFileSync(cp, c);
console.log('style.css: wordmark styles in place');
