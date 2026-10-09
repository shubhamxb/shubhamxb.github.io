---
index: "0003"
date: 2026-10-09
domain: build
title: "Two machines, one mind"
status: published
---
I run two machines. The Mac is where I work; it sleeps, closes, travels. Hearth is an old laptop in a cupboard that never turns off and runs about fifty services. Each has its own AI agent: vesper on the Mac, wick on hearth. For a while they worked like two contractors who'd never met. I was the one carrying messages between them, which is exactly the job I'd built them to take off my hands.

So the first fix wasn't a feature, it was a rule: **every kind of thing gets exactly one home, and every device is only a door to it.** Tasks live on one board on hearth, because hearth is always awake. Both agents write to it; neither keeps a private copy. The two of them talk through a single shared log, and each session ends with three lines — did, changed, open — so either can pick up cold.

The part I actually use every day is the docket. Everything waiting on me, from both machines, shows up as plain yes-or-no questions in a terminal: one key, no AI in the loop. The first real run taught me something. I don't answer y/n prompts with y or n — I answer in sentences. "You don't already have it? prompt me again." The first version read the leading "y" as a yes and closed four tickets that weren't done. The fix was a stricter rule, not a smarter guess: only an exact `y` is a yes; anything else is kept, word for word, as my answer, and goes back to whoever owns the task.

Then a second way in, for when yes-or-no is too narrow: a **burst**. I write everything on my mind at once — "75 yes but keep lofi; zippg is dead; the battery thing, later; remind me to call the bank" — and it gets routed to the right tickets by number or by name, with new thoughts filed for the agents to sort. Nothing is applied until I see how it was read and say yes. Same rule as the docket, same board underneath, reachable from either machine.

The small stuff mattered more than I expected. Both machines now look different at a glance — different colours, a different typeface, the agent's name in the status bar — because the most common failure was simply not knowing which one I was typing into. And one rule got written down in capitals after a single misplaced glyph broke a status line: nothing ever runs past the edge of the window. The bar measures characters the way the terminal does, not the way the code assumes.

None of this is clever on its own. What makes it work is that it's one system with one source of truth and very boring rules, and that I can still see all of it at a glance. The panel at the top of this site is that system, as it stood when I last published.
