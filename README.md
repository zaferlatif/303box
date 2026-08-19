<p align="center">
  <a href="https://303box.com"><img src="./readme-hero.svg" alt="303box — browser acid pattern sketchpad" width="100%"></a>
</p>

<p align="center">
  <a href="https://303box.com"><img alt="OPEN 303BOX" src="https://img.shields.io/badge/OPEN_303BOX-LIVE-ddff37?style=for-the-badge&labelColor=181a1e"></a>
  <img alt="Hardware workflow" src="https://img.shields.io/badge/HARDWARE-T--8_%2F_TD--3-ddff37?style=for-the-badge&labelColor=181a1e">
  <img alt="Pattern sketchpad" src="https://img.shields.io/badge/PATTERN-SKETCHPAD-f4f4ef?style=for-the-badge&labelColor=181a1e">
  <img alt="Web MIDI" src="https://img.shields.io/badge/WEB_MIDI-HARDWARE-ddff37?style=for-the-badge&labelColor=181a1e">
</p>

<h1 align="center">303box</h1>
<p align="center"><strong>Sketch the pattern here. Perform it on your hardware.</strong></p>
<p align="center">A focused 16-step browser workspace for writing, auditioning and transferring acid bass + rhythm ideas.</p>

---

## What 303box is

**303box is not an AI musician and it is not a replacement for live performance.**

It is closer to a notebook with sound:

- write a readable 16-step idea;
- audition it before committing it to hardware;
- use rule-based Random as a starting sketch, then edit it by hand;
- export the pattern as a visual reference;
- route notes and clock to supported MIDI hardware;
- finish the sound, performance and final save on the instrument itself.

Random generation is **rule-based pattern randomization**, not an AI composition model.

## Core workspace

The 303 sketchpad supports:

`NOTE` · `REST` · `TIE` · `U/D` · `ACCENT` · `SLIDE` · `SAW/SQR` · `BPM`

Browser preview controls:

`TUNE` · `CUTOFF` · `RESONANCE` · `ENV MOD` · `DECAY` · `ACCENT` · `DELAY` · `DISTORTION` · `REVERB`

The six-part rhythm sketchpad shares the same clock:

| Voice | Character |
|---|---|
| BD | 909-inspired bass drum |
| SD | 606-inspired snare |
| CP | 808-inspired clap |
| TM | 808-inspired low tom |
| CH | 606-inspired closed hat |
| OH | 606-inspired open hat |

Playback position uses the same small red playhead LED across the 303 and rhythm sequencers.

## Random engine

The 1920 random engine deliberately avoids the old small pool of repeating masks.

- every page load starts with a new acid bass + rhythm sketch;
- startup BPM is drawn from a high-energy acid range of roughly **132–154 BPM**;
- eight different bass characters vary scale vocabulary, density, accent pressure, slide count and rhythm shape;
- patch randomization also changes waveform and the complete synth-control set rather than leaving every generated pattern on the same sound;
- recent bass, rhythm and patch fingerprints are remembered locally so exact recent repeats are rejected;
- randomness uses `crypto.getRandomValues()` when available rather than depending only on `Math.random()`.

The result is still rule-based and editable by hand; it is not an AI composition model.

## Transport model

The transport uses one shared clock with two independent part switches:

- **303 PLAY** toggles the bass section without stopping rhythm.
- **RHYTHM PLAY** toggles the rhythm section without stopping bass.
- Starting the second section while the first is already running joins the same shared transport instead of restarting it.
- **ACID CONSOLE PLAY** starts whichever part is missing; if both parts are running it stops both.
- **Space always controls the shared bass + rhythm transport.** The legacy early shortcut currently calls `playButton.click()`; the transport fuse identifies that synthetic click and routes it to the shared transport instead of treating it as a bass-only pointer click.
- **Shift + Space** remains rhythm-only.

Legacy browser audio engines remain muted so only the shared Acid Console engine owns audible playback.

## Scope / USB audio

The oscilloscope lives inside the Acid Console rather than expanding the 303 pattern panel.

Two sources are available:

- **SYNTH** — a modeled view of the browser 303 signal that responds to pitch, waveform, filter, resonance, envelope, accent and distortion controls.
- **T-8 USB** — a real audio-input view. The browser reads the T-8 USB audio stream, applies visual-only adaptive gain and triggering, and displays the captured waveform or FFT without routing it back to the speakers.

MIDI itself does not contain audio samples, so real hardware waveform display uses USB Audio rather than MIDI data.

## MIDI / hardware

Playback modes:

- `BROWSER` — browser preview only
- `BROWSER + MIDI` — browser + connected hardware
- `MIDI ONLY` — hardware output only

### Hardware transfer matrix

| Device | Live MIDI | Sequencer transfer | Direct memory write |
|---|---|---|---|
| **Roland T-8** | Bass + rhythm + velocity + clock/transport | Bass REC hardware-tested; external Rhythm Note capture tested at **0/16** | No documented SysEx write; official USB backup/restore route under research |
| **Behringer TD-3** | Bass + clock/transport | Live MIDI / experimental direct pattern path | Experimental USB SysEx with verification |
| **Behringer TD-3-MO** | Bass + clock/transport | Compatibility probed at runtime | Only after positive read probe |
| Korg volca bass | Notes + velocity + clock | Research / hardware verification target | No SysEx |
| Korg volca nubass | Notes + velocity + clock | Research / hardware verification target | No SysEx |

303box treats **live MIDI**, **REC capture**, **backup/restore data** and **direct non-volatile memory write** as separate capabilities.

## Roland T-8 REC helper

Real hardware testing confirmed that a 303box bass pattern can be captured after REC is armed on the T-8.

### Bass REC

Bass note transfer is the reliable reference workflow.

Physical T-8 testing also shows that **Accent and Slide can be captured during this workflow**. 303box keeps sending both expression cues during `BASS → REC`:

- `A` is expressed with higher incoming MIDI velocity;
- `S` / legato is expressed with overlapping note timing.

A captured T-8 pattern can still sound less dramatic than the same line played live from 303box. This does **not** mean A/S failed to record. Live MIDI uses explicit velocity and note-overlap timing while the T-8 internal sequencer uses its own stored playback behavior. The T-8 also has a separate Bass Accent strength setting (`b.ACC`, 1–255).

### Rhythm REC: hardware result

The live rhythm MIDI path is working: incoming rhythm Note On messages trigger the T-8 drum voices correctly.

However, a controlled hardware test used a disposable rhythm pattern with all 16 steps filled with BD in 303box. The T-8 was armed manually with physical `REC → PLAY`, while 303box sent normal rhythm playback on the rhythm MIDI channel with browser clock/transport sending disabled. Result: **0/16 BD steps were written into the T-8 rhythm sequencer**.

This matches the distinction visible in Roland's documentation: rhythm Note On/Off is recognized for MIDI playback, while rhythm real-time recording is documented as physical instrument-button input. The T-8 MIDI chart also documents no received Control Change or System Exclusive path that could act as a virtual front-panel instrument press.

For that reason, continued MIDI timing tweaks are no longer the primary Rhythm REC strategy. Normal live rhythm MIDI remains supported and should not be degraded by recording experiments.

## T-8 backup-file research

There is a more promising official path that does not depend on pretending MIDI notes are front-panel button presses.

The T-8 exposes a USB mass-storage **Backup / Restore** mode. Roland's documented backup structure contains separate `BACKUP/BASS` and `BACKUP/RHYTHM` folders, and the device can restore corresponding data through its `RESTORE` workflow.

The `.PRM` files are readable structured text rather than opaque binary blobs. A controlled one-change-at-a-time hardware diff now confirms the first useful pieces of the rhythm format.

### Controlled rhythm PRM findings — 2026-08-19

A normal rhythm row has fields such as:

```text
STEP 1 = AC=00000 BD=170AA SD=00000 LT=00000 HT=00000 CY=00000 CH=00000 OH=00000
```

For the five-character per-part code, the controlled files currently confirm:

| Position | Meaning | Confirmed examples |
|---|---|---|
| 1 | step state | `0` = off, `1` = on |
| 2 | velocity value | default step = `7`, hardware `v.10` = `A` |
| 3 | sub-step mode | `0` = off, `1` = `1_2` |
| 4 | main probability encoding | default/full value observed as `A` |
| 5 | sub-step probability encoding | default/full value observed as `A` |

Examples from physical T-8 backups:

```text
BD default active  = 170AA
BD velocity v.10   = 1A0AA
BD sub-step 1_2    = 171AA
Rhythm accent step = AC=170AA
Hand Clap step     = HT=170AA
```

An important detail is that an **off** step can retain its parameter payload. For example `070AA` means the state character is off even though the previous/default velocity and probability characters remain. Therefore export code must treat the first character as the actual trigger state rather than assuming every non-zero five-character token sounds a note.

The separate `AC` field matches the T-8's global rhythm-accent model: an accent step applies to the rhythm instruments sounding on that step.

The controlled Hand Clap file proves that the T-8's Hand Clap part is stored in the `HT` field. The likely Tom mapping is `LT`, but the uploaded `R6_TOM` sample was actually a **BASS-format PRM** (`TRIPLET`, `STATE`, `NOTE`, `ACCENT`, `SLIDE`) rather than a RHYTHM-format file, so Tom is intentionally left unconfirmed until one corrected rhythm backup is supplied.

The exact encodings for probability values below 100 and the remaining sub-step states (`1_3`, `1_4`, `FLAN`) are not guessed in production code yet. The first exporter will preserve/default those values safely rather than invent undocumented encodings.

### Next transfer architecture

The preferred route is template-based and conservative:

1. Read a real T-8 rhythm `.PRM` template from the selected pattern slot.
2. Preserve its header and slot/file identity.
3. Replace only the understood step fields for the six 303box rhythm parts and global accent.
4. Write the generated file into the official `RESTORE/RHYTHM` workflow.
5. Eject the T-8 drive and let the hardware perform the official restore.

On Chromium desktop, this can later use the File System Access API after the user explicitly grants access to the T-8 drive/folder. Other browsers can fall back to downloading the generated `.PRM` file for manual copying.

No firmware/update image is modified in this research path. Restore tests should only be attempted after keeping an untouched full backup.

### T-8 rhythm velocity

The T-8 rhythm engine responds to incoming MIDI velocity during live playback. 303box uses a moderate T-8-specific velocity curve so browser-driven drums sit closer to the device sequencer instead of overpowering it.

### Clock and tempo

When `SEND CLOCK` is enabled, 303box sends 24 PPQN MIDI clock so compatible hardware can follow the current browser BPM.

This is external synchronization. It does not rewrite the T-8's stored internal tempo value. If external clock disappears, the device may return to its own internal tempo.

## UI direction

The current pass uses a lighter **anthracite studio surface** instead of near-black page chrome, while the sequencer itself stays dark enough for the acid-green controls to retain contrast.

The synth knob panel is deliberately compact. Reverb uses the same knob face, pointer, tick and sizing rules as the other synth controls.

The Acid Console reserves the oscilloscope's final geometry before the runtime analyzer mounts, so the legacy canvas and live canvas occupy the same fixed box instead of producing a load-time resize jump.

The MIDI layout constrains Playback inside the console with a dedicated minimum-width column and safe select padding. The redundant floating `T-8 REC` caption is visually removed; the two self-explanatory REC actions remain side by side.

`CLEAR` clears both the underlying note state and the visible note pickers, together with U/D, A/S and Gate cells, so stale notes cannot remain on screen after the pattern has been cleared.

The Z3Z creator follow card appears on every fresh page load after roughly 5.2 seconds. It slides upward from below the viewport with a short acid-green arrival glow. Closing it dismisses only the current page instance; it is not stored as a permanent/session preference.

Footer and creator-popup Instagram/YouTube links carry distinct UTM placement values and also emit a GA4 `social_click` event so outbound traffic can be separated by platform and placement.

## Hardware references

- Roland T-8: [Bass sequencer](https://static.roland.com/manuals/T-8_manual_v102/eng/28312362.html) · [Rhythm sequencer](https://static.roland.com/manuals/T-8_manual_v102/eng/28312384.html) · [MIDI implementation](https://static.roland.com/manuals/T-8_manual_v102/ptb/31849756.html) · [Backup / Restore](https://static.roland.com/manuals/T-8_manual_v102/eng/28312320.html)
- Behringer TD-3: [Official product information](https://www.behringer.com/en/products/0718-ABP)
- Behringer TD-3-MO: [Official product information](https://www.behringer.com/en/products/0718-ACF)
- Korg volca bass: [Official MIDI/downloads](https://www.korg.com/us/support/download/product/0/140/)
- Korg volca nubass: [Official MIDI/downloads](https://www.korg.com/us/support/download/product/0/820/)

## MIDI safety

`PANIC` is the emergency stop. It clears queued MIDI where possible, sends All Sound Off / All Notes Off, sends MIDI Stop and stops the 303box transport.

Changing browser tabs does not intentionally trigger PANIC. Real page exit still performs MIDI cleanup.

## Development note

The **software development process** has included AI-assisted coding with ChatGPT alongside direct design decisions and physical hardware testing.

That is separate from the musical behavior of the application: **303box does not use an AI composition model to make the user's music.**

## Run locally

There is no framework and no build step.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Current production map

```text
303box/
├── index.html
├── app.js
├── acid-console.20260818-1340.js
├── midi-router.20260818-1730.js
├── transport-fuse.20260819-1750.js       # 1950 shared transport + Space ownership fix
├── shortcut-sync.20260819-1950.js        # shortcut copy matches shared Space transport
├── scope-live.20260819-1830.js           # modeled synth + live USB audio scope/FFT
├── generator-router.20260818-1650.js     # acid random engine + fresh startup patterns
├── behavior-fixes.20260819-1920.js       # robust Clear + MIDI DOM normalization
├── ui-fixes.20260819-1920.css            # stable scope + MIDI fit + REC layout
├── layout-compact.20260819-1940.css       # compact sequencer transition/action layout
├── social-tracking.20260819-1940.js       # UTM + GA4 social source tracking
├── ui-refresh.20260819-1750.css           # anthracite + creator entrance
├── ui-refresh.20260819-1750.js            # creator reveal + scope placement + knob normalization
├── hardware-guide.20260819-0815.js
├── playhead-unified.20260818-1720.css
├── positioning.20260818-1740.css
├── seo.20260818-1740.js
├── sequencer-engine.20260818-1740.js      # production runtime / hero lock / cache version 1950
└── README.md
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