// Applies the app-matched favicon + wordmark to every page.
import { readFileSync, writeFileSync } from 'node:fs';

const favicon = readFileSync(new URL('./_favicon.txt', import.meta.url), 'utf8').trim();
const brand = readFileSync(new URL('./_brand.txt', import.meta.url), 'utf8').trim();
const root = new URL('../', import.meta.url);

for (const file of ['index.html', 'support.html', 'privacy.html']) {
  const p = new URL('./' + file, root);
  let s = readFileSync(p, 'utf8');

  // Favicon: replace the whole existing <link rel="icon" ...> line.
  const before = s;
  s = s.replace(/<link rel="icon"[^>]*>/, favicon);
  if (s === before) throw new Error('favicon link not found in ' + file);

  // Wordmark: replace the inline <svg ...>...</svg> inside the brand anchor.
  s = s.replace(/(<a class="brand" href="\/">)<svg[\s\S]*?<\/svg>/, `$1${brand}`);

  writeFileSync(p, s);
  console.log('updated', file);
}
