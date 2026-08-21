// Adds the hover-lift + prefetch + zoom-to-fullscreen launch script.
import { readFileSync, writeFileSync } from 'node:fs';

const p = new URL('../index.html', import.meta.url);
let s = readFileSync(p, 'utf8');

const CLOSE = '  </script>';
const last = s.lastIndexOf(CLOSE);
if (last === -1) throw new Error('script close not found');

const js = `  </script>

  <script>
    // Play-in-browser launch: lift the iPad while the button is hovered,
    // prefetch the player, then fly the iPad to fullscreen on click before
    // navigating. Entirely progressive — with this script absent (or JS off)
    // the button is a plain link that navigates immediately.
    (function () {
      var btn = document.getElementById('play-web');
      var ipad = document.querySelector('.ipad');
      var stage = document.querySelector('.stage');
      if (!btn || !ipad || !stage) return;

      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
      var url = btn.getAttribute('href');
      var warmed = false;

      // --- Prefetch, once, on first intent (hover or touch) ---
      function warm() {
        if (warmed) return;
        warmed = true;
        var l = document.createElement('link');
        // prefetch, not prerender: cheap, and safe if the player is heavy.
        l.rel = 'prefetch';
        l.href = url;
        l.as = 'document';
        document.head.appendChild(l);
      }

      // --- Hover lift ---
      function lift(on) {
        if (reduce.matches) return;
        ipad.classList.toggle('is-lifted', on);
      }
      btn.addEventListener('pointerenter', function () { warm(); lift(true); });
      btn.addEventListener('pointerleave', function () { lift(false); });
      btn.addEventListener('focus', function () { warm(); lift(true); });
      btn.addEventListener('blur', function () { lift(false); });
      btn.addEventListener('touchstart', warm, { passive: true });

      // --- Launch ---
      var launching = false;
      btn.addEventListener('click', function (e) {
        // Let modified clicks (new tab/window) and non-primary buttons behave
        // normally — never trap a deliberate new-tab open in an animation.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (launching) { e.preventDefault(); return; }
        if (reduce.matches) return; // straight navigation, no flight

        e.preventDefault();
        launching = true;
        warm();

        var r = ipad.getBoundingClientRect();
        var vw = window.innerWidth, vh = window.innerHeight;

        // Pin the iPad exactly where it is, then compute the delta that
        // carries its centre to the viewport centre at cover scale.
        ipad.style.setProperty('--fly-x', r.left + 'px');
        ipad.style.setProperty('--fly-y', r.top + 'px');
        ipad.style.setProperty('--fly-w', r.width + 'px');
        ipad.style.setProperty('--fly-h', r.height + 'px');
        ipad.classList.add('is-flying');

        var veil = document.createElement('div');
        veil.className = 'launch-veil';
        document.body.appendChild(veil);

        var scale = Math.max(vw / r.width, vh / r.height) * 1.06;
        var dx = (vw / 2) - (r.left + r.width / 2);
        var dy = (vh / 2) - (r.top + r.height / 2);

        // Next frame, so the starting position is committed before the
        // transition target is applied.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            document.documentElement.classList.add('is-launching');
            veil.classList.add('on');
            ipad.style.setProperty('--fly-dx', dx + 'px');
            ipad.style.setProperty('--fly-dy', dy + 'px');
            ipad.style.setProperty('--fly-scale', scale.toFixed(3));
            ipad.classList.add('go');
          });
        });

        // Navigate when the flight finishes — with a timer as the backstop
        // so a dropped transitionend can never strand the user here.
        var went = false;
        function go() {
          if (went) return;
          went = true;
          window.location.href = url;
        }
        ipad.addEventListener('transitionend', function (ev) {
          if (ev.propertyName === 'transform') go();
        });
        setTimeout(go, 900);
      });

      // Coming back via the back button restores a cached page mid-flight;
      // clear the launch state so the site is usable again.
      window.addEventListener('pageshow', function (ev) {
        if (!ev.persisted) return;
        launching = false;
        ipad.classList.remove('is-flying', 'go', 'is-lifted');
        document.documentElement.classList.remove('is-launching');
        var v = document.querySelector('.launch-veil');
        if (v) v.remove();
      });
    })();
  </script>`;

s = s.slice(0, last) + js + s.slice(last + CLOSE.length);
writeFileSync(p, s);
console.log('launch script added');
