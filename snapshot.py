#!/usr/bin/env python3
"""snapshot.py: refresh the hero instrument's numbers from my own system, then rebuild nothing else.

Writes one JSON blob between <!-- SYSTEM:START --> / <!-- SYSTEM:END --> in index.html. Only aggregates go public:
district names + up/total counts, total services, the board's ticket count, crew size. Never hostnames, addresses,
ports, container or service names.

Sources (all optional; the last published value is kept for anything that can't be read):
  ~/.overlook/state/live.json     the mac's `live` snapshot (hearth's districts, grouped the way hearth's bar groups them)
  ssh hearth board-cache.json     how many tickets the shared board has carried
Run: python3 snapshot.py  (then commit; the site stays static)
"""
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
START, END = "<!-- SYSTEM:START -->", "<!-- SYSTEM:END -->"
LIVE = Path.home() / ".overlook/state/live.json"


def current():
    m = re.search(r'id="system-data">(.*?)</script>', INDEX.read_text(), re.S)
    return json.loads(m.group(1)) if m else {}


def districts():
    try:
        items = json.loads(LIVE.read_text()).get("items", [])
    except Exception:
        return None
    out = {}
    for x in items:
        if x.get("where") != "charlie":
            continue
        g = out.setdefault(x["group"], {"name": x["group"], "up": 0, "n": 0})
        g["n"] += 1
        g["up"] += x.get("state") == "up"
    return list(out.values()) or None


def tickets():
    try:
        r = subprocess.run(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=6", "-o", "ControlMaster=no", "-o", "ClearAllForwardings=yes",
                            "sentinel", "python3 -c 'import json;print(len(json.load(open(\"/home/zero/warden/state/board-cache.json\"))[\"tickets\"]))'"],
                           stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=20)
        return int(r.stdout.strip())
    except Exception:
        return None


def main():
    d = current()
    ds = districts()
    if ds:
        d["districts"] = ds
        d["services"] = {"up": sum(x["up"] for x in ds), "n": sum(x["n"] for x in ds)}
    t = tickets()
    if t:
        d["tickets"] = t
    d.setdefault("crew", 8)
    d["asOf"] = time.strftime("%Y-%m-%d")
    blob = json.dumps(d, separators=(",", ":"))
    html = INDEX.read_text()
    new = re.sub(re.escape(START) + r".*?" + re.escape(END),
                 f'{START}\n      <script type="application/json" id="system-data">{blob}</script>\n      {END}', html, flags=re.S)
    INDEX.write_text(new)
    print(f"snapshot {d['asOf']}: {d.get('services')} · {len(d.get('districts', []))} districts · {d.get('tickets')} tickets")


if __name__ == "__main__":
    main()
