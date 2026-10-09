(function () {
  "use strict";

  // The instrument: my own operating system as it stood at the last rebuild, drawn from the snapshot that snapshot.py
  // writes into index.html (#system-data). Two machines, the link between them, hearth's districts, and the counts.
  // One orchestrated moment: it powers up on load, then a single signal crosses the link every few seconds.
  var body = document.getElementById("instBody");
  var stamp = document.getElementById("instStamp");
  var dataEl = document.getElementById("system-data");
  if (!body || !dataEl) return;
  var d;
  try { d = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var m = d.machines || [];
  var a = m[0] || { name: "the overlook", role: "where I work", agent: "vesper" };
  var b = m[1] || { name: "hearth", role: "always on", agent: "wick" };
  var ds = d.districts || [];
  var sv = d.services || { up: 0, n: 0 };

  var plate = function (x, cls) {
    return '<div class="plate ' + cls + '">' +
      '<p class="plate-role">' + esc(x.role) + '</p>' +
      '<p class="plate-name">' + esc(x.name) + '</p>' +
      '<p class="plate-agent"><span class="pip pip-live"></span>run by <b>' + esc(x.agent) + '</b></p>' +
      '</div>';
  };
  var districts = ds.map(function (x, i) {
    var st = x.up >= x.n ? "up" : x.up === 0 ? "down" : "warn";
    return '<li class="district d-' + st + '" style="--i:' + i + '"><span class="pip"></span><span class="d-name">' + esc(x.name) +
      '</span><span class="d-count">' + x.up + (x.up < x.n ? "/" + x.n : "") + '</span></li>';
  }).join("");

  body.innerHTML =
    '<div class="rig">' +
      plate(a, "plate-a") +
      '<div class="link" aria-hidden="true"><span class="link-line"></span><span class="signal"></span><span class="link-label">one board</span></div>' +
      plate(b, "plate-b") +
    '</div>' +
    '<ul class="districts" aria-label="hearth\'s districts">' + districts + '</ul>' +
    '<dl class="readouts">' +
      '<div><dt>services up</dt><dd>' + sv.up + '<small>/' + sv.n + '</small></dd></div>' +
      '<div><dt>board tickets</dt><dd>' + (d.tickets || 0) + '</dd></div>' +
      '<div><dt>agents</dt><dd>' + (2 + (d.crew || 0)) + '</dd></div>' +
    '</dl>';

  if (stamp && d.asOf) stamp.textContent = "snapshot · " + d.asOf;

  var inst = document.getElementById("instrument");
  if (reduced) { inst.classList.add("powered"); return; }
  // power-up: plates, then the link, then each district comes on in turn (css does the sequencing via --i)
  requestAnimationFrame(function () { setTimeout(function () { inst.classList.add("powered"); }, 250); });
  // after that, one signal crosses the link every ~5s, alternating direction: the two halves talking
  var sig = body.querySelector(".signal");
  var dir = 0;
  setInterval(function () {
    if (document.hidden || !sig) return;
    sig.classList.remove("go-a", "go-b");
    void sig.offsetWidth; // restart the animation
    sig.classList.add(dir++ % 2 ? "go-b" : "go-a");
  }, 5200);
})();
