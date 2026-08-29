#!/usr/bin/env python3
"""Build the log archive, the work gallery, and refresh both home-page teasers.

Reads log-entries/*.md and work-items/*.md (small frontmatter + prose
files), renders the full published archives to log/index.html and
work/index.html, and rewrites the marker-delimited teaser spans inside
index.html to match.

No dependencies beyond the standard library. No watch process — run by hand
after flipping a draft's status to "published":

    python3 build.py
"""
import html
import re
import sys
from datetime import date as _date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENTRIES_DIR = ROOT / "log-entries"
LOG_DIR = ROOT / "log"
WORK_ITEMS_DIR = ROOT / "work-items"
WORK_DIR = ROOT / "work"
INDEX_HTML = ROOT / "index.html"

REQUIRED_KEYS = ("index", "date", "domain", "title", "status")
VALID_STATUS = ("draft", "published")
VALID_DOMAINS = ("systems", "marketing", "real-estate", "build")

WORK_REQUIRED_KEYS = ("index", "title", "status")
WORK_TEASER_CAP = 3  # how many show on Home; the rest only live at /work/

TEASER_START = "<!-- LOG-TEASER:START -->"
TEASER_END = "<!-- LOG-TEASER:END -->"
WORK_TEASER_START = "<!-- WORK-TEASER:START -->"
WORK_TEASER_END = "<!-- WORK-TEASER:END -->"


class BuildError(Exception):
    pass


# ---------- frontmatter ----------

def parse_frontmatter(text, source_path):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise BuildError(f"{source_path}: missing frontmatter opening '---'")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if end is None:
        raise BuildError(f"{source_path}: missing frontmatter closing '---'")
    fm = {}
    for line in lines[1:end]:
        line = line.strip()
        if not line:
            continue
        if ":" not in line:
            raise BuildError(f"{source_path}: malformed frontmatter line: {line!r}")
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        fm[key] = value
    body = "\n".join(lines[end + 1:]).strip()
    return fm, body


def validate_entry(fm, source_path):
    missing = [k for k in REQUIRED_KEYS if k not in fm]
    if missing:
        raise BuildError(f"{source_path}: missing frontmatter keys: {missing}")
    if fm["status"] not in VALID_STATUS:
        raise BuildError(f"{source_path}: invalid status {fm['status']!r}")
    if fm["domain"] not in VALID_DOMAINS:
        raise BuildError(f"{source_path}: unknown domain {fm['domain']!r}")
    try:
        _date.fromisoformat(fm["date"])
    except ValueError:
        raise BuildError(f"{source_path}: invalid date {fm['date']!r}, expected YYYY-MM-DD")


def load_entries():
    entries, seen = [], {}
    if not ENTRIES_DIR.is_dir():
        raise BuildError(f"missing directory: {ENTRIES_DIR}")
    for path in sorted(ENTRIES_DIR.glob("*.md")):
        fm, body = parse_frontmatter(path.read_text(encoding="utf-8"), path)
        validate_entry(fm, path)
        if fm["index"] in seen:
            raise BuildError(f"duplicate index {fm['index']!r}: {seen[fm['index']]} and {path}")
        seen[fm["index"]] = path
        entries.append({**fm, "body_raw": body, "source": path})
    return entries


def published_sorted(entries):
    # index is a zero-padded string ("0001"), so lexical sort == numeric sort.
    return sorted((e for e in entries if e["status"] == "published"),
                  key=lambda e: e["index"], reverse=True)


# ---------- work items ----------

def validate_work_item(fm, source_path):
    missing = [k for k in WORK_REQUIRED_KEYS if k not in fm]
    if missing:
        raise BuildError(f"{source_path}: missing frontmatter keys: {missing}")
    if fm["status"] not in VALID_STATUS:
        raise BuildError(f"{source_path}: invalid status {fm['status']!r}")


def load_work_items():
    items, seen = [], {}
    if not WORK_ITEMS_DIR.is_dir():
        raise BuildError(f"missing directory: {WORK_ITEMS_DIR}")
    for path in sorted(WORK_ITEMS_DIR.glob("*.md")):
        fm, body = parse_frontmatter(path.read_text(encoding="utf-8"), path)
        validate_work_item(fm, path)
        if fm["index"] in seen:
            raise BuildError(f"duplicate index {fm['index']!r}: {seen[fm['index']]} and {path}")
        seen[fm["index"]] = path
        items.append({**fm, "body_raw": body, "source": path})
    return items


def published_sorted_work(items):
    # Ascending, not reversed: work items are a curated list (order chosen
    # by index), not a chronological log — unlike log-entries, "newest"
    # isn't the natural default here.
    return sorted((i for i in items if i["status"] == "published"),
                  key=lambda i: i["index"])


# ---------- markdown-lite ----------

def render_inline(text):
    # quote=False: this text always lands inside element content, never an
    # attribute value, so escaping quotes is unnecessary and just makes the
    # output uglier (Conway's -> Conway&#x27;s) for no safety benefit.
    text = html.escape(text, quote=False)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    return text


def render_body(raw_body):
    paras = re.split(r"\n\s*\n", raw_body.strip())
    lines = []
    for p in paras:
        text = re.sub(r"\s+", " ", p.strip())
        lines.append(f"          <p>{render_inline(text)}</p>")
    return "\n".join(lines)


def first_line_hook(raw_body):
    """First sentence of the first paragraph, markup stripped, HTML-escaped."""
    first_para = re.sub(r"\s+", " ", re.split(r"\n\s*\n", raw_body.strip())[0].strip())
    plain = re.sub(r"`([^`]+)`", r"\1", first_para)
    plain = re.sub(r"\*\*([^*]+)\*\*", r"\1", plain)
    m = re.match(r"(.+?[.!?])(\s|$)", plain)
    return html.escape(m.group(1) if m else plain, quote=False)


# ---------- rendering ----------

def render_log_entry(e, is_first):
    open_attr = " open" if is_first else ""
    return f'''      <details class="log"{open_attr}>
        <summary>
          <span class="log-idx">LOG · {html.escape(e["index"], quote=False)}</span>
          <span class="log-date">{html.escape(e["date"], quote=False)}</span>
          <h3>{html.escape(e["title"], quote=False)}</h3>
          <span class="log-caret" aria-hidden="true">＋</span>
        </summary>
        <div class="log-body">
{render_body(e["body_raw"])}
        </div>
      </details>'''


LOG_PAGE_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log — Shubham Bhagwat</title>
  <meta name="description" content="The full case log — real diagnostic work, narrated as it happened.">
  <link rel="icon" type="image/png" href="../favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <script>
    (function () {{
      try {{
        var saved = localStorage.getItem("theme");
        if (saved) document.documentElement.setAttribute("data-theme", saved);
      }} catch (e) {{}}
    }})();
  </script>
</head>
<body>
  <div class="wrap">
    <header class="hero reveal">
      <div class="hero-top">
        <p class="eyebrow"><a href="/">← shubham bhagwat</a></p>
        <button type="button" id="themeToggle" class="theme-toggle" aria-label="Switch between light and dark">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label" id="themeLabel">dark</span>
        </button>
      </div>
      <h1>The log.</h1>
      <div class="hero-foot">
        <nav class="hero-nav"><a href="/">home</a> <a href="/about/">about</a></nav>
        <p class="live-clock" id="liveClock" aria-live="off">local · —:—:—</p>
      </div>
    </header>

    <section class="block casefile reveal">
      <h2><span class="idx">01</span> Every entry, newest first</h2>
      <p class="lede">The full archive. Real diagnostic work, narrated as it happened, not cleaned up after.</p>

{entries}
    </section>

    <footer class="reveal">
      <p>Shubham Bhagwat — <a href="mailto:shubham.bhagwat37@gmail.com">shubham.bhagwat37@gmail.com</a></p>
    </footer>
  </div>

  <script src="../assets.js"></script>
</body>
</html>
'''


def render_log_archive(entries):
    blocks = "\n".join(render_log_entry(e, i == 0) for i, e in enumerate(entries))
    return LOG_PAGE_TEMPLATE.format(entries=blocks)


def render_teaser(latest):
    return f'''{TEASER_START}
      <div class="log log-teaser">
        <div class="log-teaser-head">
          <span class="log-idx">LOG · {html.escape(latest["index"], quote=False)}</span>
          <span class="log-date">{html.escape(latest["date"], quote=False)}</span>
        </div>
        <h3 class="log-teaser-title">{html.escape(latest["title"], quote=False)}</h3>
        <p class="log-teaser-hook">{first_line_hook(latest["body_raw"])}</p>
        <a class="log-teaser-link" href="/log/">read the full log →</a>
      </div>
      {TEASER_END}'''


def update_index_teaser(latest):
    text = INDEX_HTML.read_text(encoding="utf-8")
    pattern = re.compile(re.escape(TEASER_START) + r".*?" + re.escape(TEASER_END), re.DOTALL)
    if not pattern.search(text):
        raise BuildError(
            f"markers {TEASER_START} / {TEASER_END} not found in {INDEX_HTML} — "
            "add them once by hand before running build.py"
        )
    new_text = pattern.sub(lambda m: render_teaser(latest), text)
    if new_text != text:
        INDEX_HTML.write_text(new_text, encoding="utf-8")
        print(f"updated {INDEX_HTML}")
    else:
        print(f"{INDEX_HTML} already up to date")


# ---------- work rendering ----------

def render_work_item(item, idx_label):
    return f'''        <li>
          <p class="work-idx">{idx_label}</p>
          <h3>{html.escape(item["title"], quote=False)}</h3>
          <p>{render_inline_multiline(item["body_raw"])}</p>
        </li>'''


def render_inline_multiline(raw_body):
    # Work-item bodies are one short paragraph, not multiple — join any
    # accidental blank lines rather than treating them as separate <p>s.
    text = re.sub(r"\s+", " ", raw_body.strip())
    return render_inline(text)


WORK_PAGE_TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Work — Shubham Bhagwat</title>
  <meta name="description" content="Selected work, plainly presented.">
  <link rel="icon" type="image/png" href="../favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <script>
    (function () {{
      try {{
        var saved = localStorage.getItem("theme");
        if (saved) document.documentElement.setAttribute("data-theme", saved);
      }} catch (e) {{}}
    }})();
  </script>
</head>
<body>
  <div class="wrap">
    <header class="hero reveal">
      <div class="hero-top">
        <p class="eyebrow"><a href="/">← shubham bhagwat</a></p>
        <button type="button" id="themeToggle" class="theme-toggle" aria-label="Switch between light and dark">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label" id="themeLabel">dark</span>
        </button>
      </div>
      <h1>Selected work.</h1>
      <div class="hero-foot">
        <nav class="hero-nav"><a href="/">home</a> <a href="/about/">about</a></nav>
        <p class="live-clock" id="liveClock" aria-live="off">local · —:—:—</p>
      </div>
    </header>

    <section class="block reveal">
      <h2><span class="idx">01</span> Everything, in order</h2>
      <ul class="work-list">
{items}
      </ul>
      <p class="note">Repo links pending — some of this lives in a private sandbox right now; deciding what's worth making public.</p>
    </section>

    <footer class="reveal">
      <p>Shubham Bhagwat — <a href="mailto:shubham.bhagwat37@gmail.com">shubham.bhagwat37@gmail.com</a></p>
    </footer>
  </div>

  <script src="../assets.js"></script>
</body>
</html>
'''


def render_work_archive(items):
    blocks = "\n".join(render_work_item(it, f"W·{it['index']}") for it in items)
    return WORK_PAGE_TEMPLATE.format(items=blocks)


def render_work_teaser(items):
    shown = items[:WORK_TEASER_CAP]
    blocks = "\n".join(render_work_item(it, f"W·{it['index']}") for it in shown)
    more = len(items) - len(shown)
    tail = (f'\n      <p class="note">and {more} more — '
            f'<a href="/work/">see the full list →</a></p>') if more > 0 else \
           '\n      <p class="note"><a href="/work/">see the full list →</a></p>'
    return f'''{WORK_TEASER_START}
      <ul class="work-list">
{blocks}
      </ul>{tail}
      {WORK_TEASER_END}'''


def update_index_work_teaser(items):
    text = INDEX_HTML.read_text(encoding="utf-8")
    pattern = re.compile(re.escape(WORK_TEASER_START) + r".*?" + re.escape(WORK_TEASER_END), re.DOTALL)
    if not pattern.search(text):
        raise BuildError(
            f"markers {WORK_TEASER_START} / {WORK_TEASER_END} not found in {INDEX_HTML} — "
            "add them once by hand before running build.py"
        )
    new_text = pattern.sub(lambda m: render_work_teaser(items), text)
    if new_text != text:
        INDEX_HTML.write_text(new_text, encoding="utf-8")
        print(f"updated {INDEX_HTML} (work teaser)")
    else:
        print(f"{INDEX_HTML} work teaser already up to date")


def main():
    entries = load_entries()
    published = published_sorted(entries)
    if published:
        LOG_DIR.mkdir(exist_ok=True)
        (LOG_DIR / "index.html").write_text(render_log_archive(published), encoding="utf-8")
        print(f"wrote {LOG_DIR / 'index.html'} ({len(published)} published entries)")
        update_index_teaser(published[0])
    else:
        print("no published log entries — skipping /log/", file=sys.stderr)

    work_items = load_work_items()
    published_work = published_sorted_work(work_items)
    if published_work:
        WORK_DIR.mkdir(exist_ok=True)
        (WORK_DIR / "index.html").write_text(render_work_archive(published_work), encoding="utf-8")
        print(f"wrote {WORK_DIR / 'index.html'} ({len(published_work)} published items)")
        update_index_work_teaser(published_work)
    else:
        print("no published work items — skipping /work/", file=sys.stderr)


if __name__ == "__main__":
    try:
        main()
    except BuildError as e:
        print(f"build.py: {e}", file=sys.stderr)
        sys.exit(1)
