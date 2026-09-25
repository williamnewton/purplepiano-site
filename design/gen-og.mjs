// Render the Open Graph image (../og.jpg, 1200x630) from the home page
// itself: the real wordmark and tagline, and the iPad running the real
// player snapshot mid-song. Re-run after changing the hero or regenerating
// the player snapshot.
//
//   node design/serve.js &            # the site on :4321
//   node design/gen-og.mjs            # run from a dir where playwright-core
//                                     # resolves, e.g. the nextjs-prototypes
//                                     # root: node ../purplepiano-site/design/gen-og.mjs
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = process.env.SITE_URL || 'http://localhost:4321/';
// JPEG, not PNG: the PNG weighs ~500KB and WhatsApp drops previews over ~300KB.
const OUT = fileURLToPath(new URL('../og.jpg', import.meta.url));
const require = createRequire(join(process.cwd(), 'noop.js'));
const { chromium } = require('playwright-core');

const browser = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);
// ignoreHTTPSErrors: sandboxes that proxy TLS would otherwise block the
// Google Fonts the wordmark and tagline are set in.
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, ignoreHTTPSErrors: true });
await page.goto(SITE, { waitUntil: 'networkidle' });
// The card is useless in a fallback face: wait for the brand fonts, and fail
// loudly if they never arrive.
await page.waitForFunction(async () => {
  await Promise.all([
    document.fonts.load('800 78px Poppins'),
    document.fonts.load('600 36px "Baloo 2"'),
  ]).catch(() => {});
  return document.fonts.check('800 78px Poppins') && document.fonts.check('600 36px "Baloo 2"');
}, null, { polling: 500, timeout: 20000 });

// Recompose the hero for a card: type on the left, the iPad on the right,
// bleeding off the edge. The player keeps a roomy 1440x900 layout rather
// than this short card's own window.
await page.addStyleTag({ content: `
  .site-header, .site-footer, .cta-row, .skip-link { display: none !important; }
  html, body { height: 630px; overflow: hidden; }
  main { position: relative; height: 630px; }
  main > .wrap { position: static; width: auto; }
  .hero {
    position: absolute; z-index: 2; left: 64px; top: 50%;
    transform: translateY(-54%);
    width: 500px; padding: 0; text-align: left;
  }
  .hero-wordmark { justify-content: flex-start; font-size: 78px; margin: 0 0 14px; transform: none !important; }
  .tagline { font-size: 36px; line-height: 1.2; margin: 0; text-align: left; transform: none !important; }
  .tag-break { display: inline; }
  .og-note {
    margin-top: 22px; font-family: var(--display); font-weight: 600;
    font-size: 22px; color: var(--ink-soft); letter-spacing: .01em;
  }
  .stage { position: absolute; left: 612px; top: 58px; width: 780px; padding: 0; perspective: 1800px; }
  .ipad, .stage:hover .ipad {
    width: 100%; margin: 0;
    transform: rotateX(8deg) rotateY(-18deg) rotateZ(3deg) !important;
    transition: none !important;
  }
`});
await page.evaluate(() => {
  const note = document.createElement('p');
  note.className = 'og-note';
  note.textContent = 'iPhone · iPad · in your browser';
  document.querySelector('.hero').appendChild(note);

  const ipad = document.getElementById('play-stage');
  const host = document.getElementById('pp-app');
  window.removeEventListener('resize', window.ppSize);
  ipad.style.setProperty('--pp-aspect', '1440 / 900');
  host.style.width = '1440px';
  host.style.height = '900px';
  host.style.setProperty('--pp-scale', String(ipad.querySelector('.ipad-screen').clientWidth / 1440));
});

// Catch the song on a busy step (both its notes on screen) and freeze it
// there: the playback loop runs on rAF, so stop handing it frames.
await page.evaluate(() => {
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => {
    const ph = document.getElementById('pp-app').shadowRoot.querySelector('.inset-y-0.z-10');
    if (ph && /\* 4\)$/.test(ph.style.left)) { window.__ogFrozen = true; return; }
    cb(t);
  });
});
await page.waitForFunction(() => window.__ogFrozen, null, { polling: 20, timeout: 15000 });
await page.evaluate(() => {
  const all = [...document.getAnimations(), ...document.getElementById('pp-app').shadowRoot.getAnimations()];
  all.forEach((a) => { if (a instanceof CSSAnimation) { a.currentTime = 2000; a.pause(); } });
});
await page.waitForTimeout(400);
await page.screenshot({ path: OUT, type: 'jpeg', quality: 90 });
await browser.close();
console.log('wrote', OUT);
