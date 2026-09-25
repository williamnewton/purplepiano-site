// Snapshot the real Purple Piano player into index.html, so the iPad on the
// home page IS the player — its own markup and its own CSS — rather than a
// hand-drawn look-alike. Re-run whenever the player's look changes.
//
//   # in the nextjs-prototypes repo: npm run build && npx next start -p 3100
//   # then, from that repo's root (playwright-core resolves from there):
//   APP_URL=http://localhost:3100/p/purple-piano \
//     node ../purplepiano-site/design/gen-app-snapshot.mjs
//
// It captures, from a fresh visitor's session:
//   - `open`   — the player with the song maker open, stopped. This is what
//                the iPad shows at rest, in a declarative shadow root.
//   - `closed` — piano-only mode, the player's opening frame. The launch
//                flight collapses `open` into this and swaps it in on landing.
//   - `steps`  — per-step patches recorded while the song plays (playhead,
//                hit cells, glowing keys), replayed on the home page.
//   - the CSS: every rule of the player's stylesheets that matches any of
//                those states (interaction states like :hover dropped), with
//                :root mapped to :host. @property rules can't register from a
//                shadow root, so they are emitted at document level.
// and writes them between the pp-app markers in index.html.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const APP_URL = process.env.APP_URL || 'http://localhost:3100/p/purple-piano';
const require = createRequire(join(process.cwd(), 'noop.js'));
const { chromium } = require('playwright-core');

const browser = await chromium.launch({
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}),
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(APP_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// The app root: the chrome-mix wrapper around the 100dvh column.
const ROOT = `document.querySelector('.h-\\\\[100dvh\\\\]').parentElement`;

/** Markup of the current state, minus the folded synth panel's contents
    (zero height and inert either way — they are only weight here). */
async function markup() {
  return page.evaluate(`(() => {
    const root = ${ROOT}.cloneNode(true);
    const panel = root.querySelector('#pp-synth-panel');
    if (panel) panel.querySelector('.origin-top').replaceChildren();
    return root.outerHTML;
  })()`);
}

const closed = await markup();
await page.click('button[aria-expanded][aria-label*="song maker"]');
await page.waitForTimeout(400);
const open = await markup();

// What the transport's play button holds when stopped / playing.
const PLAY = `${ROOT}.querySelector('main ~ div button:is([aria-label="Play the song"],[aria-label="Stop the song"])')`;
const tStopped = await page.evaluate(`${PLAY}.innerHTML`);

// Neutral (stopped) look of every cell and key.
const keyed = `(el) => el.dataset.cell ? 'c' + el.dataset.cell : 'k' + el.dataset.midi`;
const neutralAll = await page.evaluate(`(() => {
  const k = ${keyed};
  return [...${ROOT}.querySelectorAll('[data-cell],[data-midi]')]
    .map((el) => [k(el), el.className, el.getAttribute('style') || '']);
})()`);

await page.click(`main ~ div button[aria-label="Play the song"]`);
// Record one state per step: the playhead's position, then every cell and
// key, a beat after the step lands.
const recorded = await page.evaluate(`new Promise((resolve) => {
  const k = ${keyed};
  const root = ${ROOT};
  const steps = {};
  let playhead = null, tPlaying = null;
  const read = () => {
    const ph = root.querySelector('.inset-y-0.z-10');
    if (!ph) return;
    const step = Number(ph.style.left.match(/\\* (\\d+)\\)$/)[1]);
    if (steps[step]) return;
    playhead = playhead || ph.outerHTML;
    tPlaying = tPlaying || ${PLAY}.innerHTML;
    steps[step] = {
      p: ph.getAttribute('style'),
      els: [...root.querySelectorAll('[data-cell],[data-midi]')]
        .map((el) => [k(el), el.className, el.getAttribute('style') || '']),
    };
    if (Object.keys(steps).length === 16) { clearInterval(id); resolve({ steps, playhead, tPlaying }); }
  };
  const id = setInterval(read, 45);
})`);

// Keep only what changes: per step, the elements that differ from stopped.
const neutralBy = new Map(neutralAll.map((e) => [e[0], e]));
const changed = new Set();
const steps = [];
for (let s = 0; s < 16; s++) {
  const st = recorded.steps[s];
  const diff = st.els.filter((e) => {
    const n = neutralBy.get(e[0]);
    return n[1] !== e[1] || n[2] !== e[2];
  });
  diff.forEach((e) => changed.add(e[0]));
  steps.push({ p: st.p, els: diff });
}
const neutral = neutralAll.filter((e) => changed.has(e[0]));

// String table: most patches repeat the same class and style strings.
const strings = [];
const sid = new Map();
const S = (s) => {
  if (!sid.has(s)) { sid.set(s, strings.length); strings.push(s); }
  return sid.get(s);
};
const pack = (e) => [e[0], S(e[1]), S(e[2])];
const data = {
  strings,
  neutral: neutral.map(pack),
  steps: steps.map((st) => ({ p: st.p, els: st.els.map(pack) })),
  playhead: recorded.playhead.replace(/ style="[^"]*"/, ''),
  tPlaying: recorded.tPlaying,
  tStopped,
  closed,
};

// ---- CSS: every rule that matches a state we render ----
const css = await page.evaluate(({ open, closed, playhead, steps, strings, tPlaying }) => {
  const test = document.createElement('div');
  test.className = 'dark font-sans antialiased';
  test.style.display = 'none';
  document.body.appendChild(test);
  const add = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html;
    test.appendChild(t.content);
    return test.lastElementChild;
  };
  add(closed);
  add(open);
  const playing = add(open);
  playing.querySelector('.min-w-\\[38rem\\]').insertAdjacentHTML('afterbegin', playhead);
  playing.querySelector('main ~ div button[aria-label="Play the song"]').innerHTML = tPlaying;
  for (const st of steps) {
    const clone = playing.cloneNode(true);
    for (const [key, c, s] of st.els) {
      const el = clone.querySelector(key[0] === 'c' ? `[data-cell="${key.slice(1)}"]` : `[data-midi="${key.slice(1)}"]`);
      el.className = strings[c];
      el.setAttribute('style', strings[s]);
    }
    test.appendChild(clone);
  }

  const INTERACTIVE = /:(hover|focus|focus-visible|focus-within|active|visited|target|checked|disabled|enabled|placeholder-shown|autofill|invalid|open|popover-open)\b/;
  const PSEUDO_EL = /::?(before|after|placeholder|selection|marker|file-selector-button|backdrop|first-line|first-letter|-webkit-[a-z-]+|-moz-[a-z-]+)(\([^)]*\))?/g;
  function splitList(sel) {
    const out = []; let depth = 0, cur = '';
    for (const ch of sel) {
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }
  function keepSelector(sel) {
    const parts = splitList(sel).map((s) => s.replace(/:root\b/g, ':host'))
      .filter((s) => s !== 'html' && s !== 'body')
      .filter((s) => {
        if (INTERACTIVE.test(s)) return false;
        const bare = s.replace(PSEUDO_EL, '').trim();
        if (!bare || /^(:host|\*)$/.test(bare)) return true;
        try { return test.matches(bare) || !!test.querySelector(bare); } catch { return false; }
      });
    return parts.length ? parts.join(', ') : null;
  }

  const props = [];
  const keyframes = new Map();
  function walk(rules) {
    let out = '';
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        const sel = keepSelector(rule.selectorText);
        if (sel) out += `${sel}{${rule.style.cssText}}`;
      } else if (rule instanceof CSSPropertyRule) {
        props.push(rule.cssText);
      } else if (rule instanceof CSSKeyframesRule) {
        keyframes.set(rule.name, rule.cssText);
      } else if (rule instanceof CSSLayerStatementRule) {
        out += rule.cssText;
      } else if (rule instanceof CSSLayerBlockRule) {
        const inner = walk(rule.cssRules);
        if (inner) out += `@layer ${rule.name}{${inner}}`;
      } else if (rule instanceof CSSMediaRule) {
        const inner = walk(rule.cssRules);
        if (inner) out += `@media ${rule.conditionText}{${inner}}`;
      } else if (rule instanceof CSSSupportsRule) {
        const inner = walk(rule.cssRules);
        if (inner) out += `@supports ${rule.conditionText}{${inner}}`;
      } else if (rule instanceof CSSContainerRule) {
        const inner = walk(rule.cssRules);
        if (inner) out += `@container ${rule.conditionText}{${inner}}`;
      }
      // @font-face and @starting-style: not needed (no web fonts, no entry
      // transitions in these states).
    }
    return out;
  }
  let body = '';
  for (const sheet of document.styleSheets) {
    try { body += walk(sheet.cssRules); } catch { /* cross-origin sheet */ }
  }
  for (const [name, text] of keyframes) if (body.includes(name)) body += text;
  test.remove();
  return { body, props: props.join('') };
}, { open, closed, playhead: data.playhead, steps: data.steps, strings, tPlaying: data.tPlaying });

await browser.close();

// The snapshot fills its host (the page sizes the host to the window) in
// place of the player's own 100dvh root, on the dark theme the player uses.
const HOST_CSS = ':host{display:block}' +
  '.pp-app-theme{height:100%;color-scheme:dark}' +
  '.pp-app-theme .h-\\[100dvh\\]{height:100%}';

// ---- Write into index.html ----
const esc = (s) => s.replace(/<\/(script|style|template)/gi, '<\\/$1');
const block = `<!-- pp-app:start — generated by design/gen-app-snapshot.mjs; do not edit by hand -->
        <style>${css.props}</style>
        <div class="pp-app" id="pp-app" inert>
          <template shadowrootmode="open"><style>${css.body}${HOST_CSS}</style><div class="pp-app-theme dark font-sans antialiased">${open}</div></template>
        </div>
        <script type="application/json" id="pp-app-data">${esc(JSON.stringify(data))}</script>
        <!-- pp-app:end -->`;

const file = new URL('../index.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const re = /<!-- pp-app:start[\s\S]*?<!-- pp-app:end -->/;
if (!re.test(html)) throw new Error('pp-app markers not found in index.html');
writeFileSync(file, html.replace(re, () => block));
console.log(`snapshot written: css ${(css.body.length / 1024).toFixed(1)}KB, ` +
  `@property ${(css.props.length / 1024).toFixed(1)}KB, open ${(open.length / 1024).toFixed(1)}KB, ` +
  `data ${(JSON.stringify(data).length / 1024).toFixed(1)}KB`);
