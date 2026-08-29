---
index: "0001"
date: 2026-08-28
domain: systems
title: "A slow laptop"
status: published
---
Machine felt sluggish. The easy read is "too many browser tabs open." I don't take the easy read.

Directed a diagnostic pass through the actual memory subsystem — `vm_stat`, `sysctl`, per-process RSS. First pass looked damning: the system's own process monitor showed several processes over 900MB each. Didn't trust it. That tool's memory ranking double-counts shared framework memory across processes — a known, easy-to-miss quirk that makes ordinary background processes look like the culprit. Re-ran the numbers against real per-process memory instead. The actual picture was smaller, and different.

The real signal was somewhere else entirely: **8 days, 21 hours of uptime**, and over **1.3 billion memory-compression cycles** since boot. Not one bad app — sustained pressure with no relief, the kind a tab count doesn't explain and a restart fixes in one step, for free.

Shipped a standing fix, not just a one-time answer: a single terminal command that surfaces this exact picture — real numbers, categorized by process, root cause included — so next time it's a read, not a guess.
