<p align="center">
  <a href="https://303box.com"><img src="./readme-hero.svg" alt="303box — browser acid pattern sketchpad" width="100%"></a>
</p>

<p align="center">
  <a href="https://303box.com"><img alt="OPEN 303BOX" src="https://img.shields.io/badge/OPEN_303BOX-LIVE-ddff37?style=for-the-badge&labelColor=1f2126"></a>
  <img alt="Pattern sketchpad" src="https://img.shields.io/badge/PATTERN-SKETCHPAD-f4f4ef?style=for-the-badge&labelColor=1f2126">
  <img alt="Web MIDI" src="https://img.shields.io/badge/WEB_MIDI-HARDWARE-ddff37?style=for-the-badge&labelColor=1f2126">
  <img alt="Runtime" src="https://img.shields.io/badge/RUNTIME-2200-ddff37?style=for-the-badge&labelColor=1f2126">
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

`TUNE` · `CUTOFF` · `RESONANCE` · `ENV MOD` · `DECAY` · `ACCENT` · `DELAY` · `FEEDBACK` · `REVERB` · `DISTORTION`

The final control bank is a 5 + 5 desktop layout. `FEEDBACK` independently controls the delay regeneration path, while `DISTORTION` stays at the end of the signal-shaping control order. On narrow mobile layouts the controls reflow inside the component rather than increasing the page width.

Rhythm voices:

| Voice | Character | T-8 PRM field |
|---|---|---|
| BD | 909 bass drum | `BD` |
| SD | 606 snare | `SD` |
| CP | 808 hand clap | `HT` |
| TM | 808 low tom | `LT` |
| CH | 606 closed hi-hat | `CH` |
| OH | 606 open hi-hat | `OH` |

## Runtime 2200

The workstation stays behind a small animated `303BOX / INITIALIZING` surface until the final UI is ready, instead of visibly rewriting text, knobs, scope and layout after first paint.

Runtime 2200 also adds a final narrow-screen authority. The 303 control strip no longer inherits the old 550 px minimum-width desktop grid on phones. Waveform + tempo remain together, the ten synth controls reflow inside the viewport, and MIDI uses an explicit mobile order rather than desktop columns leaking off-screen.

### Single ownership rules

- **Visible copy:** `content-stable.20260819-2000.js`
- **SEO metadata/schema:** `seo.20260818-1740.js`
- **Shared transport:** `transport-fuse.20260819-1750.js`
- **Bass + rhythm browser audio:** `acid-console.20260818-1340.js`
- **MIDI routing:** `midi-router.20260818-1730.js`
- **Scope / USB audio analysis:** `scope-live.20260819-1830.js`
- **Rule-based generation:** `generator-router.20260818-1650.js`
- **Feedback control:** `fx-feedback.20260819-2120.js`
- **T-8 PRM export:** `t8-prm-export.20260819-2120.js`
- **Final workstation authority:** `ui-system.20260819-2100.js`
- **Final desktop/mobile MIDI + narrow workstation layout:** `midi-layout-fix.20260819-2150.css` (`v=20260820-2200`)
- **Atomic boot:** `sequencer-engine.20260818-1740.js`

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

## Random engine

Each fresh page load starts with a new rule-based acid sketch rather than a fixed reference pattern.

The generator varies note vocabulary, motif shape, rests, ties, accent/slide pressure, octave movement, rhythm density, waveform, BPM and patch controls. Recent result fingerprints are remembered locally to reduce exact repeats. The independent delay feedback control also participates in patch variation.

## Scope / USB audio

Two analysis sources are available:

- **SYNTH** — modeled browser 303 signal;
- **T-8 USB** — real PCM captured from hardware USB Audio when the browser and operating system expose it.

MIDI carries control data, not audio samples. Real hardware waveform/FFT display therefore uses USB Audio.

## MIDI / hardware

Playback modes:

- `BROWSER`
- `BROWSER + MIDI`
- `MIDI ONLY`

A disconnected page does not intentionally present a previously used T-8 as connected. `PANIC` clears queued MIDI where possible, sends note-off cleanup and stops the site transport.

On mobile the MIDI control order is explicit:

1. Enable MIDI + Playback;
2. Output;
3. Device;
4. Bass channel + Rhythm channel;
5. Send Clock + Send Start/Stop;
6. Panic.

## Roland T-8 research

### Bass REC

Physical testing confirmed that bass notes can be captured by the T-8 after REC is armed. Accent and Slide information can also be captured during that workflow.

### Rhythm REC

Normal incoming rhythm MIDI triggers T-8 drum sounds but did not behave like front-panel rhythm-entry presses during controlled REC testing. The rhythm-write strategy therefore moved to the documented USB backup/restore file path.

### Decoded Rhythm PRM format

Controlled one-change-at-a-time T-8 backups confirmed that Rhythm `.PRM` files are readable text. The current decoded core is:

```text
LENGTH = 16
SCALE   = 1
SHUFFLE = 0
FLAM    = 36
STEP n  = AC=..... BD=..... SD=..... LT=..... HT=..... CY=..... CH=..... OH=.....
```

Confirmed values and mappings:

- empty field: `00000`;
- normal active hit: `170AA`;
- BD velocity `v10`: `1A0AA`;
- BD substep `1_2`: `171AA`;
- Accent is stored in the separate `AC` field;
- Bass Drum → `BD`;
- Snare → `SD`;
- Tom → `LT`;
- Hand Clap → `HT`;
- Closed Hi-Hat → `CH`;
- Open Hi-Hat → `OH`;
- inactive fields can retain tails such as `070AA`, so nonzero text does not by itself mean the voice is active.

`R6_TOM` closed the remaining voice-mapping gap by confirming `LT=170AA` for a single default Tom hit on step 1.

### PRM generator — first restore-test build

Runtime 2200 contains a conservative T-8 Rhythm PRM writer. It intentionally exports only information that has been directly confirmed by controlled hardware backups:

- the current 16-step six-voice rhythm grid;
- default active-hit encoding `170AA`;
- clean `00000` inactive fields;
- 32 PRM step rows with steps 17–32 inactive;
- the confirmed `BD / SD / LT / HT / CH / OH` mapping.

The Hardware Guide exposes:

- **DOWNLOAD PRM** — generate a `.PRM` file for manual restore placement;
- **WRITE / REPLACE PRM** — where the File System Access API is available, explicitly choose the target PRM file/folder and write it from the browser.

The first restore test must use a disposable/copied T-8 Rhythm pattern slot after making a full device backup. The browser never silently writes to hardware storage without an explicit user file/folder selection.

Velocity, substeps, probability and rhythm Accent can be added to the exporter after their editor-side controls are intentionally exposed and tested; the first writer does not invent unverified values.

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
├── index.html                               # consent-aware entrypoint + boot curtain
├── app.js                                   # base 303 grid / legacy preview kept muted
├── studio.20260818-0912.js                  # deterministic UI scaffold
├── pattern-shell.20260818-1045.js           # pattern shell / tune / keyboard UI
├── workstation-ui.20260818-1680.js          # ten-knob + action normalization
├── acid-console.20260818-1340.js             # shared audible bass + rhythm engine
├── transport-fuse.20260819-1750.js           # single transport authority
├── midi-router.20260818-1730.js              # Web MIDI router
├── scope-live.20260819-1830.js               # synth + real USB Audio scope/FFT
├── generator-router.20260818-1650.js          # rule-based startup/random engine
├── fx-feedback.20260819-2120.js              # independent delay feedback control
├── t8-prm-export.20260819-2120.js             # decoded T-8 Rhythm PRM generator
├── content-stable.20260819-2000.js            # visible-copy authority
├── ui-system.20260819-2100.js                 # final machine ownership
├── midi-layout-fix.20260819-2150.css          # Runtime 2200 responsive final authority
└── sequencer-engine.20260818-1740.js          # boot coordinator
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
