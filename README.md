<p align="center">
  <a href="https://303box.com"><img src="./readme-hero.svg" alt="303box — browser acid pattern sketchpad" width="100%"></a>
</p>

<p align="center">
  <a href="https://303box.com"><img alt="OPEN 303BOX" src="https://img.shields.io/badge/OPEN_303BOX-LIVE-ddff37?style=for-the-badge&labelColor=1f2126"></a>
  <img alt="Pattern sketchpad" src="https://img.shields.io/badge/PATTERN-SKETCHPAD-f4f4ef?style=for-the-badge&labelColor=1f2126">
  <img alt="Web MIDI" src="https://img.shields.io/badge/WEB_MIDI-HARDWARE-ddff37?style=for-the-badge&labelColor=1f2126">
  <img alt="Runtime" src="https://img.shields.io/badge/RUNTIME-2000-ddff37?style=for-the-badge&labelColor=1f2126">
</p>

<h1 align="center">303box</h1>
<p align="center"><strong>Sketch the pattern here. Perform it on your hardware.</strong></p>
<p align="center">A focused 16-step browser workspace for writing, auditioning and transferring acid bass + rhythm ideas.</p>

---

## What 303box is

**303box is a sketchpad with sound, not an AI musician and not a replacement for live performance.**

The browser makes small-step editing easier. You write or randomize a starting pattern, edit the decisions, audition it, then take the useful idea to hardware. The musical choices, knob movement, arrangement, recording and final performance remain yours.

Random generation is rule-based rather than model-generated composition.

## Workspace

303 pattern language:

`NOTE` · `REST` · `TIE` · `U/D` · `ACCENT` · `SLIDE` · `SAW/SQR` · `BPM`

Browser synth controls:

`TUNE` · `CUTOFF` · `RESONANCE` · `ENV MOD` · `DECAY` · `ACCENT` · `DELAY` · `DISTORTION` · `REVERB`

Rhythm voices:

| Voice | Character |
|---|---|
| BD | 909 bass drum |
| SD | 606 snare |
| CP | 808 hand clap |
| TM | 808 low tom |
| CH | 606 closed hi-hat |
| OH | 606 open hi-hat |

## Runtime 2000

The current production pass removes the old progressive-render behavior where multiple historical modules visibly rewrote the page after load.

### Atomic first paint

The document stays behind a small `303BOX / INITIALIZING` boot surface until the workstation reaches its final state. Before the page becomes visible, the runtime waits for:

- final CSS cascade;
- the full nine-knob synth panel;
- the final scope canvas;
- all 96 rhythm step buttons;
- MIDI controls;
- startup randomization;
- font readiness;
- legacy `window.load` settling that still exists inside the shared audio engine.

The visible page should therefore appear once in its final geometry instead of showing one page and morphing into another.

### Single ownership rules

The 2000 cleanup establishes clear owners:

- **Visible copy:** `content-stable.20260819-2000.js`
- **SEO metadata/schema:** `seo.20260818-1740.js` — head only, never visible DOM
- **Shared transport:** `transport-fuse.20260819-1750.js`
- **Bass + rhythm browser audio:** `acid-console.20260818-1340.js`
- **MIDI routing:** `midi-router.20260818-1730.js`
- **Scope / USB audio analysis:** `scope-live.20260819-1830.js`
- **Rule-based generation:** `generator-router.20260818-1650.js`
- **Final visual cascade:** `ui-fixes.20260819-1920.css`
- **Atomic boot:** `sequencer-engine.20260818-1740.js`

Historical modules that used to rewrite layout or content seconds after load were reduced or removed from the production path. In particular, the old delayed Blade/Confusion reference seed, repeated tempo relocation, repeated FX/reverb mounting, saved hi-hat overlay reapplication, visible SEO rewriting and duplicate legacy rhythm/scope engines are no longer part of the visible production flow.

## Transport contract

There is one shared clock and two independent parts.

- **303 PLAY** toggles only bass.
- **RHYTHM PLAY** toggles only rhythm.
- Starting the second part while the first is already playing joins the same shared clock.
- **ACID CONSOLE PLAY** and **Space** use one deterministic rule:
  - if nothing is playing: start bass + rhythm;
  - if either part is playing: stop everything.
- **Shift + Space** toggles rhythm only.
- Ctrl/Cmd + R remains the browser refresh shortcut and is never repurposed as Random.

Legacy browser audio contexts remain muted so old preview engines cannot stack on top of the shared engine.

## Random engine

Each fresh page load starts with a new rule-based acid sketch rather than a fixed reference pattern.

The generator varies:

- note vocabulary and motif shape;
- rests, ties, accent and slide pressure;
- octave movement;
- rhythm density and voice placement;
- waveform;
- BPM, typically in an energetic acid range;
- synth patch controls.

Recent result fingerprints are remembered locally to reduce exact repeats.

## Scope / USB audio

Two analysis sources are available:

- **SYNTH** — modeled browser 303 signal;
- **T-8 USB** — real PCM captured from the hardware USB Audio input when the browser and operating system expose it.

MIDI itself carries control data, not audio samples. Real hardware waveform/FFT display therefore uses USB Audio.

## MIDI / hardware

Playback modes:

- `BROWSER`
- `BROWSER + MIDI`
- `MIDI ONLY`

A disconnected page does not pretend a previously used T-8 is still connected. T-8-specific REC controls are visible only when a real ready T-8 MIDI output is detected.

`PANIC` clears queued MIDI where possible, sends sound/note-off cleanup and stops the site transport.

## Roland T-8 research

### Bass REC

Physical testing confirmed that bass notes can be captured by the T-8 after REC is armed. Accent and Slide information can also be captured during that workflow.

A stored sequence can sound different from the same line performed live over MIDI because live velocity/legato timing and the T-8 internal sequencer playback are separate behaviors. The T-8 also exposes a bass Accent strength parameter.

### Rhythm REC

A controlled hardware test armed the T-8 physically with `REC → PLAY`, disabled browser clock/transport output, and sent all sixteen BD steps over normal rhythm MIDI. Result: **0/16 rhythm steps were written.**

Incoming rhythm MIDI correctly triggers T-8 drum sounds, but the device recorder did not treat those MIDI note messages as front-panel rhythm-entry presses. Timing tweaks are therefore no longer the primary rhythm-write strategy.

### USB backup / restore path

Roland officially exposes separate `BACKUP/BASS` and `BACKUP/RHYTHM` pattern files in USB backup mode. Initial controlled samples show readable `.PRM` text rather than opaque binary data.

Current rhythm findings from real T-8 backup files:

- empty step: first character `0` = voice inactive;
- default BD on step 1: `BD=170AA`;
- BD velocity `v10`: `BD=1A0AA`;
- BD substep `1_2`: `BD=171AA`;
- rhythm Accent uses the separate `AC` field;
- Hand Clap maps to the `HT` field in the backup format;
- inactive fields can retain parameter tails such as `070AA`, so nonzero text does not imply an active hit.

The intended safe workflow is:

1. decode controlled one-change-at-a-time `.PRM` samples;
2. generate valid T-8 BASS/RHYTHM PRM files in 303box;
3. offer direct folder writing through the browser File System Access API where supported;
4. otherwise download the PRM for manual placement in the T-8 RESTORE structure;
5. keep the final restore/write action on the hardware.

No firmware image is modified.

## Development

There is no framework and no build step.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

The development process includes AI-assisted coding with ChatGPT together with direct design decisions and physical hardware testing. That is separate from the musical behavior of 303box: the app does not use an AI composition model to make the user's music.

## Production map

```text
303box/
├── index.html                              # 2000 entrypoint + critical boot curtain
├── app.js                                 # base 303 grid / legacy browser preview kept muted
├── studio.20260818-0912.js                # deterministic UI scaffold: notes, rhythm, guide/history/footer
├── pattern-shell.20260818-1045.js          # stable pattern shell, tune and keyboard UI
├── workstation-ui.20260818-1680.js         # one-shot knob/action normalization
├── acid-console.20260818-1340.js           # shared audible bass + rhythm engine
├── transport-fuse.20260819-1750.js         # single transport authority
├── midi-router.20260818-1730.js            # Web MIDI router
├── scope-live.20260819-1830.js             # synth + real USB Audio scope/FFT
├── generator-router.20260818-1650.js        # rule-based startup/random engine
├── content-stable.20260819-2000.js          # single visible-copy authority
├── entry-normalize.20260819-2000.js         # safe initial control normalization
├── behavior-fixes.20260819-1920.js          # deterministic Clear behavior
├── console-stable.20260818-1700.css         # first-paint contract + console geometry
├── ui-fixes.20260819-1920.css               # final cascade authority
└── sequencer-engine.20260818-1740.js         # atomic 2000 boot coordinator
```

## Philosophy

**Make the drafting easier. Keep the music human.**

Write the idea, hear it, change it, take it to the machine — then perform it.

## Project

**303box is a Z3Z project.**

<p align="center">
  <a href="https://303box.com">Website</a> ·
  <a href="https://instagram.com/zafer.pro">Instagram / @zafer.pro</a> ·
  <a href="https://youtube.com/@zaferlatif">YouTube / @zaferlatif</a> ·
  <a href="https://303box.com/privacy.html">Privacy</a>
</p>

<p align="center"><sub>MIT License · 303box / Z3Z</sub></p>
