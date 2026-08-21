// Converts the Paper wordmark's oklab gradient stops to hex, so the logo has
// a correct fallback where `linear-gradient(in oklab ...)` is unsupported.
// Values lifted verbatim from the Paper file's LOGO artboard (nodes UJ-0/UK-0).

// oklab(L% a b) as authored in Paper.
const STOPS = [
  { pos: 0,   L: 0.691, a:  0.194, b: -0.011 },
  { pos: 20,  L: 0.776, a:  0.082, b:  0.136 },
  { pos: 40,  L: 0.880, a: -0.028, b:  0.165 },
  { pos: 60,  L: 0.818, a: -0.136, b:  0.043 },
  { pos: 80,  L: 0.779, a: -0.091, b: -0.084 },
  { pos: 100, L: 0.652, a:  0.049, b: -0.162 },
];

function oklabToHex(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gam = (x) => {
    x = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, x)) * 255);
  };
  return '#' + [gam(r), gam(g), gam(bl)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const hexStops = STOPS.map((s) => ({ pos: s.pos, hex: oklabToHex(s.L, s.a, s.b) }));
console.log('gradient stops:');
hexStops.forEach((s) => console.log(`  ${String(s.pos).padStart(3)}%  ${s.hex}`));
console.log('\nsRGB fallback:');
console.log('  linear-gradient(90deg, ' + hexStops.map((s) => `${s.hex} ${s.pos}%`).join(', ') + ')');
