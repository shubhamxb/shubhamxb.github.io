(function () {
  "use strict";

  // ---- theme: dark ink by default, light on request; remembered per visitor ----
  var root = document.documentElement;
  var btn = document.getElementById("themeToggle");
  var label = document.getElementById("themeLabel");
  function current() {
    var explicit = root.getAttribute("data-theme");
    if (explicit) return explicit;
    return getComputedStyle(root).colorScheme.indexOf("light") === 0 ? "light" : "dark";
  }
  function paint() { if (label) label.textContent = current() === "dark" ? "light" : "dark"; }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paint();
    });
    paint();
  }

  // ---- the time in Pune, so a visitor knows when I'm awake ----
  var clock = document.getElementById("liveClock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
    var tick = function () { clock.textContent = "Pune · " + fmt.format(new Date()) + " IST"; };
    tick();
    setInterval(tick, 15000);
  }

  // ---- reveal on scroll ----
  // content is visible by default (crawlers, link previews, print, a stalled observer all see the page). only things
  // still below the fold get a gentle fade-in, and a fallback timer shows everything regardless.
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;
  var below = Array.prototype.filter.call(document.querySelectorAll(".band, .log, .work-list > li"), function (el) {
    return el.getBoundingClientRect().top > window.innerHeight * 0.9;
  });
  below.forEach(function (el) { el.classList.add("will-reveal"); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -30px 0px" });
  below.forEach(function (el) { io.observe(el); });
  setTimeout(function () { below.forEach(function (el) { el.classList.add("in"); }); }, 2500);
})();
