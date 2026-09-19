(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var lastMouse = { x: -9999, y: -9999 };

  // ---- kinetic hero type ----
  // Splits on the existing <br> first so the authored two-line break
  // survives the rebuild — textContent alone would collapse it. Runs
  // unconditionally, ahead of the GSAP guard below: the reveal itself is
  // pure CSS (see .word-inner's animation in styles.css), so it doesn't
  // need GSAP loaded and shouldn't be held hostage to the CDN succeeding.
  var heroH1 = document.querySelector(".hero h1");
  if (heroH1) {
    var lines = heroH1.innerHTML.split(/<br\s*\/?>/i);
    var wordIndex = 0;
    heroH1.innerHTML = lines.map(function (line) {
      return line.trim().split(/\s+/).map(function (word) {
        var delay = (0.15 + wordIndex * 0.026).toFixed(3);
        wordIndex++;
        return '<span class="word"><span class="word-inner" style="--word-delay:' + delay + 's">' + word + "</span></span>";
      }).join(" ");
    }).join("<br>");
  }

  // ---- scroll-choreographed stagger: domains + work list ----
  // Plain IntersectionObserver + CSS transition-delay, same mechanism as
  // assets.js's shared .reveal system — deliberately NOT GSAP/
  // ScrollTrigger. The hero reveal above stalled mid-animation under
  // GSAP's rAF ticker when the tab wasn't actively focused (verified with
  // a real wall-clock test, not assumed); a declarative CSS transition
  // can't get stuck the same way, so content visibility doesn't depend on
  // a JS ticker continuing to run. Runs unconditionally — no GSAP needed.
  (function staggerReveal() {
    var items = [];
    document.querySelectorAll(".domains, .work-list").forEach(function (container) {
      Array.prototype.forEach.call(container.children, function (el, i) {
        el.classList.add("stagger-item");
        el.style.setProperty("--stagger-delay", (i * 0.06) + "s");
        items.push(el);
      });
    });
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  })();

  // Everything below is genuinely GSAP-dependent (quickTo-driven cursor
  // follow). If the vendored files fail to load for any reason, the page
  // above this point — hero reveal, section stagger, node network — is
  // already fully rendered and correct without it.
  if (typeof gsap === "undefined") return;

  // ---- custom cursor ----
  if (!coarse) {
    document.documentElement.classList.add("has-custom-cursor");

    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    dot.setAttribute("aria-hidden", "true");
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    var dotX = gsap.quickTo(dot, "x", { duration: 0.01 });
    var dotY = gsap.quickTo(dot, "y", { duration: 0.01 });
    var ringX = gsap.quickTo(ring, "x", { duration: reduced ? 0.01 : 0.45, ease: "power3.out" });
    var ringY = gsap.quickTo(ring, "y", { duration: reduced ? 0.01 : 0.45, ease: "power3.out" });

    window.addEventListener("mousemove", function (e) {
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
      dot.classList.add("is-visible");
      ring.classList.add("is-visible");
    }, { passive: true });

    // Hide on window leave — otherwise the dot/ring sit stranded at the
    // last known point after the pointer leaves the viewport (e.g. onto
    // the browser chrome or another window).
    document.documentElement.addEventListener("mouseleave", function () {
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    });

    document.querySelectorAll("a, button, summary").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("cursor-ring--active"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("cursor-ring--active"); });
    });

    if (!reduced) {
      document.querySelectorAll(".hero-nav a, .theme-toggle").forEach(function (el) {
        var mx = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
        var my = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
        el.addEventListener("mousemove", function (e) {
          var r = el.getBoundingClientRect();
          mx((e.clientX - (r.left + r.width / 2)) * 0.3);
          my((e.clientY - (r.top + r.height / 2)) * 0.3);
        });
        el.addEventListener("mouseleave", function () { mx(0); my(0); });
      });
    }
  }

  // ---- hero node-network canvas ----
  // A quiet stand-in for "the fleet" — the agent/orchestration system
  // this site's Now section already gestures at — without adding a word
  // of new marketing copy. Pauses on tab-hidden; draws one static frame
  // under prefers-reduced-motion instead of animating.
  (function network() {
    var canvas = document.getElementById("netCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, nodes, raf;

    function accentRgb() {
      var hex = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? (parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16)) : "107,138,99";
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(16, Math.min(42, Math.round(w / 28)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12
        });
      }
    }

    function draw(animate) {
      ctx.clearRect(0, 0, w, h);
      var rgb = accentRgb();
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (animate) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
          var dx = lastMouse.x - n.x, dy = lastMouse.y - n.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90 && d > 0.01) { n.x -= (dx / d) * 0.7; n.y -= (dy / d) * 0.7; }
        }
      }
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx2 = a.x - b.x, dy2 = a.y - b.y;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 128) {
            ctx.strokeStyle = "rgba(" + rgb + "," + (0.16 * (1 - d2 / 128)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(" + rgb + ",0.55)";
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    resize();

    // Debounced — a window drag/resize fires this dozens of times a
    // second otherwise, each one reallocating the whole node array.
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }, { passive: true });

    if (reduced) { draw(false); return; }

    var inView = true;
    function loop() {
      if (inView && !document.hidden) draw(true);
      raf = requestAnimationFrame(loop);
    }
    loop();

    // Scrolled past the hero → stop doing the per-frame work, not just
    // stop painting. Tab-hidden is also covered inside loop() itself so
    // the two checks don't fight over who owns cancelAnimationFrame.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(canvas);
    }
  })();
})();
