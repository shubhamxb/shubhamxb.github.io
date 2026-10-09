---
index: "0002"
date: 2026-08-29
domain: build
title: "The case log stopped being hand-written"
status: draft
---
LOG 0001 lived directly inside `index.html` — written by hand, in the page itself. That works for one entry. It doesn't work for ten, because every new one means a longer homepage, and a longer homepage means more to write comprehensively before anything ships. That's the exact trap that's stalled other projects here for years. I didn't want the case log to inherit it.

So instead of adding a second entry to the page, I rebuilt how entries get onto the page at all. Moved the existing one out to `log-entries/0001-a-slow-laptop.md`, unchanged except for a small YAML frontmatter block on top — index, date, domain, title, status. Then wrote `build.py`: Python 3, standard library only, nothing to install. It reads that frontmatter with a two-rule regex, not a YAML parser — the schema's flat, a real parser would be solving a problem I don't have. It turns a small markdown-lite (backtick code, `**bold**`) into HTML, writes the full archive to `log/index.html`, and touches `index.html` itself only between two markers — `<!-- LOG-TEASER:START -->` and `<!-- LOG-TEASER:END -->` — to show the latest entry as a teaser with a link out.

I didn't just assume the regeneration was safe to re-run. Ran `build.py`, then ran it again immediately with nothing changed in between, and checked for a diff. **Zero further changes on the second pass** — it's actually idempotent, not idempotent because I said so.

While I was in there, I pulled the site's shared JavaScript — theme toggle, the live IST clock, scroll-reveal — out of `index.html` into its own `assets.js`. Reason was narrow: `index.html` is hand-authored and `log/index.html` is machine-generated, and if the same script lived inline in both, they'd drift the first time either one got edited without the other.

Once the pipeline existed for one content type, extending it to a second was cheap. `work-items/*.md` now generates a `/work/` gallery the same way. One real difference: work items sort in curated order, ascending, not newest-first — a portfolio isn't a timeline the way the case log is, and forcing it into one would've been wrong, not just inconsistent.

Not everything needed the machinery. `/about` is a plain static page — employment history, education, facts that don't change on their own and don't need frontmatter or a build step to show up correctly.

Two actual bugs turned up, both caught by opening the pages in a browser, not by reading the code back. `html.escape()`'s default was turning every apostrophe into `&#x27;` in the rendered text — harmless, but wrong to look at, and easy to fix once I noticed: escape without quote mode, since none of this text ever ends up inside an HTML attribute. On `/about`, employment labels like "2023–24" were wide enough to run into the title column next to them — that column was sized for the short two-character index labels used everywhere else on the site. Fixed it by using the same short-index convention there too, with the real dates left in the paragraph text below where they'd been all along.

Everything's committed locally. Nothing's pushed — same as every other change to this site tonight.
