// Version the stylesheet link with a content hash, so a cached copy can
// never be served against newer HTML. The file itself stays style.css
// (no build step, no renamed assets) — the query string is what changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const css = readFileSync(new URL('./style.css', root));
const hash = createHash('sha256').update(css).digest('hex').slice(0, 8);

for (const file of ['index.html', 'support.html', 'privacy.html']) {
  const p = new URL('./' + file, root);
  let s = readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/href="\/style\.css(?:\?v=[a-f0-9]+)?"/g, `href="/style.css?v=${hash}"`);
  if (s === before) throw new Error('stylesheet link not found in ' + file);
  writeFileSync(p, s);
}

console.log('stylesheet versioned: v=' + hash);
