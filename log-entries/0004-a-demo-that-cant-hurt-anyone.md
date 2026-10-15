---
index: "0004"
date: 2026-10-12
domain: build
title: "A demo that can't hurt anyone"
status: published
---
sshfm is a file manager for servers that runs in the browser: you connect over SSH and browse, move and clean up files the way you would on your own machine. People kept asking for a link to try it, and the honest answer was no. A public copy would let anyone on the internet open SSH sessions from my server. That isn't a showcase; it's a liability with a nice font.

The usual fixes are a shared demo account on a throwaway server, or a video. The first still opens a real SSH door and needs babysitting. The second can't be clicked. **I wanted something you could actually use that physically could not do harm.**

It turned out the app already had the seam for it. Every request the interface makes goes through one small file, so the demo swaps that one file at build time for a pretend server that lives in your browser tab. Same buttons, same screens, no network calls at all. It isn't a recording either: there's a believable Linux box behind it, with apps, nightly database backups, eleven gigabytes of Docker layers and a log folder that keeps growing. Permissions are real: `/root` says no until you switch to sudo. Upload a file and it's there; download it and you get your own bytes back. Copy the backups folder and the disk gauge climbs; delete the copy and it drops. Reload, and it's all brand new.

Two things made it worth doing properly. First, the redesign: the disk widget had been quietly disagreeing with itself (5% in one place, 27% in another), and "home" was opening the wrong folder on Macs and custom servers. Building a convincing fake meant checking every number against what a real server says, and the real bugs fell out of that. Second, the proof: the demo page makes zero calls to a backend, which I checked in a real browser, not by reading the code. The only things it fetches are its fonts.

The result is a link I can put anywhere: [try sshfm](https://shubhamxb.github.io/sshfm/). The pattern travels too. Any internal tool with a single API seam can get a demo like this in an afternoon, and that's usually the difference between "tell me about it" and "I clicked around, when can we start".
