// Header: drop the wordmark, centre the nav.
// Hero: lead with the app logo at every size; retire the text title.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

// ---------- index.html ----------
const ip = new URL('./index.html', root);
let s = readFileSync(ip, 'utf8');

// 1. Remove the header brand link (the whole <a class="brand">…</a>).
const brandRe = /\s*<a class="brand" href="\/">[\s\S]*?<\/a>\n/;
if (!brandRe.test(s)) throw new Error('brand link not found in index.html');
s = s.replace(brandRe, '\n');

// 2. Drop the text title. The logo carries the name now, and .hero-mark
//    already has role="img" + aria-label, so the accessible name survives.
const h1Re = /\s*<h1 class="magnetic" data-text="Purple Piano">Purple Piano<\/h1>\n/;
if (!h1Re.test(s)) throw new Error('h1 not found');
s = s.replace(h1Re, '\n');

writeFileSync(ip, s);
console.log('index.html: header wordmark + text title removed');

// ---------- support.html / privacy.html ----------
// Those pages keep a header, so their brand link becomes the logo alone.
for (const file of ['support.html', 'privacy.html']) {
  const p = new URL('./' + file, root);
  let t = readFileSync(p, 'utf8');
  // Strip the trailing text node inside the brand anchor, keep the svg.
  const before = t;
  t = t.replace(/(<a class="brand" href="\/">(?:(?!<\/a>)[\s\S])*<\/svg>)Purple Piano<\/a>/, '$1</a>');
  if (t === before) throw new Error('brand text not found in ' + file);
  // Give the anchor an accessible name now that the text is gone.
  t = t.replace('<a class="brand" href="/">', '<a class="brand" href="/" aria-label="Purple Piano — home">');
  writeFileSync(p, t);
  console.log(file + ': brand is now the logo alone');
}

// ---------- style.css ----------
const cp = new URL('./style.css', root);
let c = readFileSync(cp, 'utf8');

// The hero mark was mobile-only; it is now the hero title at every size.
c = c.replace('.hero-mark { display: none; }', '');

const MOBILE = `@media (max-width: 700px) {
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
}`;

const MOBILE_NEW = `/* The logo IS the hero title, so it carries the cursor-reactive motion
   the h1 used to have. */
.hero-mark {
  display: block;
  width: clamp(112px, 15vw, 188px);
  height: auto;
  margin: 0 auto clamp(1.25rem, 3vw, 2rem);
  filter: drop-shadow(0 24px 55px rgba(0,0,0,.55));
  transform: translate3d(calc(var(--mx) * 12px), calc(var(--my) * 8px), 0);
  transition: transform .25s cubic-bezier(.22,.61,.36,1);
}
.hero:hover .hero-mark { will-change: transform; }

@media (max-width: 700px) {
  .site-header { display: none; }
  .hero { padding-top: clamp(3rem, 12vh, 6rem); }
  .hero-mark { width: clamp(96px, 30vw, 148px); }
  .tag-break { display: inline; }
  .tagline {
    max-width: none;
    font-size: clamp(1.5rem, 6.5vw, 2.1rem);
  }
}`;

if (!c.includes(MOBILE)) throw new Error('mobile hero block not found');
c = c.replace(MOBILE, MOBILE_NEW);

// Centre the nav now that the wordmark no longer balances it.
c = c.replace(
  '.site-header .wrap { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }',
  '.site-header .wrap { display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; }',
);

// Reduced motion: the mark inherits the h1's old exemption.
c = c.replace(
  '  h1.magnetic, h1.magnetic::after, .tagline, .ipad { transition: none !important; transform: none !important; }',
  '  h1.magnetic, h1.magnetic::after, .hero-mark, .tagline, .ipad { transition: none !important; transform: none !important; }',
);

writeFileSync(cp, c);
console.log('style.css: hero mark promoted, nav centred');
