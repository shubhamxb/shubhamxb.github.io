(function () {
  "use strict";

  // ---- theme toggle ----
  var root = document.documentElement;
  var btn = document.getElementById("themeToggle");
  var label = document.getElementById("themeLabel");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit) return explicit;
    // Read the actually-resolved scheme rather than re-deriving it via
    // matchMedia separately from what the CSS cascade applied — the two
    // can drift out of sync. color-scheme is set alongside every token
    // block, so this always matches what's really on screen.
    var resolved = getComputedStyle(root).colorScheme;
    return resolved.indexOf("dark") !== -1 ? "dark" : "light";
  }
  function paint() {
    label.textContent = currentTheme();
  }
  btn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    paint();
  });
  mq.addEventListener("change", paint);
  paint();

  // ---- live local clock, Pune (IST) ----
  var clockEl = document.getElementById("liveClock");
  function tick() {
    var now = new Date();
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).formatToParts(now);
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    clockEl.textContent = "local · " + map.hour + ":" + map.minute + ":" + map.second + " IST";
  }
  tick();
  setInterval(tick, 1000);

  // ---- scroll reveal ----
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }
})();
