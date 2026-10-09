# shubhamxb.github.io

My site: **[shubhamxb.github.io](https://shubhamxb.github.io)**. I build systems that run themselves.

Plain HTML, CSS and a little JavaScript. No framework, no build step to serve it, nothing to install.

## How it's put together

| path | what it is |
|---|---|
| `index.html` | the home page. Hand-written, except between the `<!-- …:START -->` / `<!-- …:END -->` markers |
| `styles.css` | every page's styles: ink + brass, Big Shoulders Display / Schibsted Grotesk / Martian Mono |
| `home.js` | draws the hero instrument from the snapshot embedded in `index.html` |
| `assets.js` | theme toggle, the time in Pune, reveal on scroll (content is never hidden from crawlers or print) |
| `log-entries/*.md` | the case log, one markdown file per entry, `status: draft` until it's ready |
| `work-items/*.md` | selected work, same idea |
| `build.py` | renders `/log/` and `/work/`, and the latest-entry teasers on the home page. Python 3, standard library only |
| `snapshot.py` | refreshes the hero instrument's numbers from my own system. Only aggregate counts and district names go public |
| `about/` | background, hand-written |

## Publishing

```sh
python3 snapshot.py   # fresh numbers for the instrument (optional)
python3 build.py      # regenerate /log/, /work/ and the teasers
git commit -am "…" && git push   # GitHub Pages serves master
```

Running `build.py` twice in a row changes nothing the second time.
