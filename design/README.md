# Design sources

The site's app mockup and logo are **generated from the real app source**
(`nextjs-prototypes/app/prototypes/purple-piano`) rather than eyeballed, so the
marketing site and the app cannot drift apart on colour or geometry.

Values lifted verbatim: the 12-stop `PITCH_HUES` oklch wheel, `noteColor()`
recipes for keys and roll cells, black-key geometry (62% height, 60% width,
centred on the seams), the 13-dot knob ring over a -140°..140° sweep, the
royal-purple chrome tint `oklch(0.55 0.21 300)`, and the deterministic
48-star field hash.

## Regenerating

```
node gen-site.mjs   # -> _ipad.html, _stars.html
node apply.mjs      # splice markup into ../index.html
node apply-css.mjs  # replace the iPad CSS block in ../style.css
node gen-logo.mjs   # -> _favicon.txt, _brand.txt
node apply-logo.mjs # apply logo + favicon to all pages
```

`gen.mjs` builds `Main.dc.html`, the artboard for the Claude Design canvas.

`serve.js` is a local static server for previewing (`.claude/launch.json`).
