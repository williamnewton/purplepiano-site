# Design sources

The site's app mockup and logo are **generated from the real app**
(`nextjs-prototypes/app/prototypes/purple-piano`) rather than eyeballed, so the
marketing site and the app cannot drift apart.

## The player on the iPad

The iPad's screen is a snapshot of the real player — its own markup and its
own CSS, in a declarative shadow root (`#pp-app` in `../index.html`), laid out
at the visitor's window size and scaled onto the screen. It is pixel-identical
to the player (verified at 1440×900, 1024×768, 844×390 and 390×844), plays
the song by replaying per-step changes recorded from the player itself, and
the launch flight collapses it into piano-only mode — the player's opening
frame — before handing over.

`gen-app-snapshot.mjs` captures all of it from a running build of the player.
Re-run it whenever the player's look changes (header, song maker, transport,
keys, colours, default preset or tune):

```
# in nextjs-prototypes
npm run build && npx next start -p 3100
# still in nextjs-prototypes (playwright-core resolves from there)
APP_URL=http://localhost:3100/p/purple-piano node ../purplepiano-site/design/gen-app-snapshot.mjs
```

It rewrites the block between the `pp-app` markers in `../index.html`. Set
`CHROMIUM=/path/to/chrome` if Playwright's own browser isn't installed. The
launch script in `index.html` relies on a few of the player's hooks (`main`,
the `role="separator"` divider, `data-cell`/`data-midi`, the transport's
"Play the song" button, the header's `aria-expanded` song-maker button); if a
player change moves those, update the script too.

## Regenerating the logo

```
node gen-logo.mjs   # -> _favicon.txt, _brand.txt
node apply-logo.mjs # apply logo + favicon to all pages
```

`gen.mjs` builds `Main.dc.html`, the artboard for the Claude Design canvas.

`serve.js` is a local static server for previewing (`.claude/launch.json`).

## Cache busting

`style.css` is linked as `/style.css?v=<hash>` where the hash is the first
8 hex chars of its sha256. Re-run after ANY stylesheet change:

```
node apply-cachebust.mjs
```

Without it a visitor's cached stylesheet can be paired with newer HTML —
which is exactly how the hero logo went missing on prod once: the old CSS
still carried a mobile-only `display: none` for `.hero-mark`.
