// Splices the generated iPad markup + starfield into index.html.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const ipad = readFileSync(new URL('./_ipad.html', import.meta.url), 'utf8');
const stars = readFileSync(new URL('./_stars.html', import.meta.url), 'utf8');

const p = new URL('./index.html', root);
let s = readFileSync(p, 'utf8');

// 1. Replace everything between the .ipad opening tag and its closing pair.
const OPEN = '        <div class="ipad-screen">';
const CLOSE = '        </div>\n      </div>\n    </div>\n  </main>';
const start = s.indexOf(OPEN);
const close = s.indexOf(CLOSE, start);
if (start === -1 || close === -1) throw new Error('ipad-screen bounds not found');
// Keep the trailing "</div></div></main>" that closes .ipad / .stage / main.
s = s.slice(0, start) + ipad + '\n' + s.slice(close + '        </div>\n'.length);

// 2. Swap the CSS-gradient starfield for the app's deterministic star spans.
const sf = '  <div class="stars" aria-hidden="true"></div>';
if (!s.includes(sf)) throw new Error('starfield not found');
s = s.replace(sf, `  <div class="stars" aria-hidden="true">\n${stars}\n  </div>`);

writeFileSync(p, s);
console.log('index.html updated');
