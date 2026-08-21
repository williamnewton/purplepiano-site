// Mobile hero: swap the text wordmark for the app mark, hide the header
// chrome, and break the tagline after "piano".
import { readFileSync, writeFileSync } from 'node:fs';

const heroMark = readFileSync(new URL('./_heromark.txt', import.meta.url), 'utf8').trim();
const root = new URL('../', import.meta.url);

// ---------- index.html ----------
const ip = new URL('./index.html', root);
let s = readFileSync(ip, 'utf8');

// The mark sits alongside the h1. On mobile the mark shows and the text
// title hides; on desktop the reverse — so the accessible name is present
// exactly once either way.
const oldH1 = '        <h1 class="magnetic" data-text="Purple Piano">Purple Piano</h1>';
const newH1 = `        ${heroMark}
        <h1 class="magnetic" data-text="Purple Piano">Purple Piano</h1>`;
if (!s.includes(oldH1)) throw new Error('h1 not found');
s = s.replace(oldH1, newH1);

// Break the tagline after "piano" — a <br> that only applies on mobile.
const oldTag = '        <p class="tagline">A cosmic piano for small hands.</p>';
const newTag = '        <p class="tagline">A cosmic piano<br class="tag-break"> for small hands.</p>';
if (!s.includes(oldTag)) throw new Error('tagline not found');
s = s.replace(oldTag, newTag);

writeFileSync(ip, s);
console.log('index.html: hero mark + tagline break');

// ---------- style.css ----------
const cp = new URL('./style.css', root);
let c = readFileSync(cp, 'utf8');

const MARKER = '/* ---------- Content pages ---------- */';
const i = c.indexOf(MARKER);
if (i === -1) throw new Error('marker not found');

c = c.slice(0, i) + `/* ---------- Mobile hero ----------
   Small screens lead with the app mark instead of the type wordmark, and
   drop the header nav (Support/Privacy still live in the footer). */
.hero-mark { display: none; }
.tag-break { display: none; }

@media (max-width: 700px) {
  .site-header { display: none; }

  .hero-mark {
    display: block;
    width: clamp(96px, 30vw, 148px);
    height: auto;
    margin: 0 auto 1.5rem;
    filter: drop-shadow(0 20px 45px rgba(0,0,0,.5));
  }
  .hero h1.magnetic { display: none; }

  .hero { padding-top: clamp(3rem, 12vh, 6rem); }
  .tag-break { display: inline; }
  .tagline {
    max-width: none;
    font-size: clamp(1.5rem, 6.5vw, 2.1rem);
  }
}

` + c.slice(i);

writeFileSync(cp, c);
console.log('style.css: mobile hero rules');
