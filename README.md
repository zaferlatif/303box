<p align="center">
  <a href="https://303box.com"><img src="./readme-hero.svg" alt="303box — browser acid workstation" width="100%"></a>
</p>

<p align="center">
  <a href="https://303box.com"><img alt="OPEN 303BOX" src="https://img.shields.io/badge/OPEN_303BOX-LIVE-ddff37?style=for-the-badge&labelColor=080809"></a>
  <img alt="Web Audio" src="https://img.shields.io/badge/WEB_AUDIO-ENGINE-f4f4ef?style=for-the-badge&labelColor=080809">
  <img alt="Web MIDI" src="https://img.shields.io/badge/WEB_MIDI-HARDWARE-ddff37?style=for-the-badge&labelColor=080809">
  <img alt="No install" src="https://img.shields.io/badge/NO_INSTALL-BROWSER-f4f4ef?style=for-the-badge&labelColor=080809">
  <img alt="License MIT" src="https://img.shields.io/badge/LICENSE-MIT-ddff37?style=for-the-badge&labelColor=080809">
</p>

<h1 align="center">303box</h1>
<p align="center"><strong>Acid in the browser. Hardware on the other end.</strong></p>
<p align="center">A focused 16-step 303 workstation with rhythm, live scope, random generation and hardware MIDI routing.</p>

<p align="center">
  <a href="https://303box.com"><strong>303box.com</strong></a>
  ·
  <a href="#midi--hardware">MIDI / Hardware</a>
  ·
  <a href="#t-8-rec">T-8 REC</a>
  ·
  <a href="#run-locally">Run locally</a>
</p>

---

## The instrument

303box is deliberately closer to a small piece of music hardware than a conventional web app.

| 303 | RHYTHM | SIGNAL | HARDWARE |
|---|---|---|---|
| 16-step acid sequencer | Six-part drum machine | 303-only Scope + FFT | Web MIDI routing |
| Gate / tie / rest | Independent levels | Live pitch display | Device profiles |
| Accent / slide | Shared BPM + swing | Oscillator visualization | Clock + transport |
| Saw / square | 808 / 909 character | Filter-aware display | T-8 REC workflow |

The 303 and rhythm generators are independent. Generate a new bass line without destroying the drums, or rebuild the rhythm without touching the acid pattern.

## Acid engine

The browser engine supports the controls that matter while a 303 loop is moving:

`TUNE` · `CUTOFF` · `RESONANCE` · `ENV MOD` · `DECAY` · `ACCENT` · `DELAY` · `DISTORTION` · `REVERB`

Patterns can contain notes, rests, ties, octave moves, accents and slides. Random generation uses musical profiles instead of treating every cell as unrelated dice.

## Rhythm

The rhythm section shares the same clock and transport as the bass engine.

| Voice | Character |
|---|---|
| BD | 909-inspired bass drum |
| SD | 606-inspired snare |
| CP | 808-inspired clap |
| TM | 808-inspired low tom |
| CH | 606-inspired closed hat |
| OH | 606-inspired open hat |

Every part has its own level. Closed and open hats can coexist in the pattern; choke behaviour belongs to playback rather than editing.

## MIDI / Hardware

303box can play the browser engine, MIDI hardware, or both.

**Playback modes**

- `BROWSER` — browser audio only
- `BROWSER + MIDI` — browser and hardware together
- `MIDI ONLY` — connected hardware only

`BROWSER + MIDI` is the default for a newly armed MIDI workflow. Once you choose a playback mode yourself, that choice is remembered.

### Device profiles

| Profile | Bass | Rhythm | Default channels | REC helper |
|---|---:|---:|---|---|
| Roland T-8 | Yes | Yes | Bass 2 / Rhythm 10 | Bass + Rhythm |
| Behringer TD-3 | Yes | — | Bass 1 | — |
| Behringer TD-3-MO | Yes | — | Bass 1 | — |
| Korg volca bass | Yes | — | Bass 1 | — |
| Korg volca nubass | Yes | — | Bass 1 | — |
| Generic MIDI | Yes | Optional | User selected | — |

These are **303box routing profiles**, not manufacturer certifications. AUTO detection uses the MIDI port name and can always be overridden manually.

### Background playback

Switching browser tabs is **not** treated as Stop.

303box keeps its transport/MIDI scheduler alive when another tab becomes active. A real page lifecycle exit — closing the page, navigating away, `pagehide` or browser freeze — performs MIDI cleanup and sends Stop / All Notes Off so hardware is not left running after the page is gone.

## T-8 REC

A physical Roland T-8 test confirmed that a 303box bass performance can be captured by the T-8 after REC is armed on the hardware. Rhythm capture works as the same live-recording concept but remains the part we continue to tune for dense simultaneous hits.

The compact MIDI panel exposes:

- `BASS → REC`
- `RHYTHM → REC`

Workflow:

1. Connect the T-8 and enable MIDI.
2. Use AUTO or choose `Roland T-8`.
3. Arm REC on the T-8.
4. Press `BASS → REC` or `RHYTHM → REC`.
5. 303box sends one clocked 16-step pass.
6. Check the pattern on the T-8.
7. Save it with WRITE on the hardware.

This does **not** pretend to write undocumented non-volatile memory directly. 303box performs the live MIDI pass; the final hardware WRITE remains yours.

## Scope / FFT

The analyzer listens to the 303 signal, not the full master mix. Drum hits therefore do not hijack the displayed pitch/frequency.

The workstation UI is static from the first render: Acid Console, Scope and MIDI already exist in their final positions instead of being created elsewhere and moved after load.

## MIDI safety

`PANIC` is the hard emergency control. It clears queued MIDI where available, sends All Sound Off / All Notes Off across channels, sends MIDI Stop and stops the 303box transport.

Normal tab switching no longer triggers PANIC. Actual page exit still does.

## Run locally

There is no framework and no build step.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

For hardware MIDI testing, the live HTTPS deployment is usually the easiest path because Web MIDI requires a secure browser context.

## Current production map

```text
303box/
├── index.html                            # static workstation shell
├── app.js                                # core sequencer foundation
├── acid-console.20260818-1340.js         # unified Web Audio engine
├── midi-router.20260818-1700.js          # MIDI state / routing / background transport / T-8 REC
├── console-stable.20260818-1700.css      # Acid Console + Scope + MIDI layout
├── bass-scope.20260818-1680.js           # 303-only Scope / FFT renderer
├── generator-router.20260818-1650.js     # independent bass / rhythm generators
├── workstation-ui.20260818-1680.js       # stable workstation controls
├── sequencer-engine.20260818-1700.js     # production compatibility loader
├── cache-reset.20260818-1700.js          # cache epoch reset
├── privacy.html
├── sitemap.xml
├── robots.txt
├── llms.txt
├── site.webmanifest
└── README.md
```

## Philosophy

No account. No installer. No project wizard. No fake DAW chrome.

Open it, generate a line, move the filter, build a rhythm and send it to hardware.

## Project

**303box is a Z3Z project.**

Built iteratively with direct hardware testing, musical/UI decisions and AI-assisted coding with ChatGPT.

<p align="center">
  <a href="https://303box.com">Website</a> ·
  <a href="https://instagram.com/zafer.pro">Instagram / @zafer.pro</a> ·
  <a href="https://youtube.com/@zaferlatif">YouTube / @zaferlatif</a> ·
  <a href="https://303box.com/privacy.html">Privacy</a>
</p>

<p align="center"><sub>MIT License · 303box / Z3Z</sub></p>
