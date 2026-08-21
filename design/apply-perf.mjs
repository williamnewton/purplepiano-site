// Performance pass: remove scroll-repaint triggers and pin the expensive
// blurred layers so they rasterise once instead of per scroll frame.
import { readFileSync, writeFileSync } from 'node:fs';

const p = new URL('../style.css', import.meta.url);
let s = readFileSync(p, 'utf8');

// 1. `background-attachment: fixed` repaints the whole viewport on every
//    scroll frame (and is a well-known source of mobile scroll jank). The
//    .cosmos layer is already position:fixed and paints the same wash, so
//    the body gradient only needs to cover the page behind it.
const before1 = s;
s = s.replace('  background-attachment: fixed;\n', '');
if (s === before1) throw new Error('background-attachment not found');

// 2. The blurred orbs are static, but a blur that big is expensive to
//    rasterise. Promote the cosmos layer to its own compositor layer once,
//    and isolate its paint so nothing outside it can invalidate the blur.
s = s.replace(
  '.cosmos { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }',
  `.cosmos {
  position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
  /* The orbs carry blur(70px) over ~830k px². Isolating this subtree keeps
     that rasterisation off the scroll path — it is painted once, then only
     composited. */
  contain: strict;
  transform: translateZ(0);
}`,
);

// 3. The orbs inherited `transition: all` from the button rule, so the
//    browser watches every animatable property on a blurred layer.
s = s.replace(
  '.orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; }',
  '.orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; transition: none; }',
);
s = s.replace(
  `  transform: rotate(-11deg);
  filter: blur(46px);`,
  `  transform: rotate(-11deg);
  filter: blur(46px);
  transition: none;`,
);

// 4. Same isolation for the star layer: 48 elements animating opacity is
//    cheap, but containment stops them invalidating anything else.
s = s.replace(
  `.stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}`,
  `.stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  contain: strict;
}`,
);

// 5. `will-change: transform` on the h1 is permanent, which keeps a layer
//    alive for the whole session. Scope it to the hover interaction so the
//    layer exists only while the effect can actually run.
s = s.replace(
  `  transition: transform .25s cubic-bezier(.22,.61,.36,1);
  will-change: transform;
}`,
  `  transition: transform .25s cubic-bezier(.22,.61,.36,1);
}
/* will-change is set only while a pointer is actually driving the effect —
   left on permanently it holds a compositor layer for the whole session. */
.hero:hover h1.magnetic { will-change: transform; }`,
);

writeFileSync(p, s);
console.log('perf pass applied');
