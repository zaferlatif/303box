<p align="center">
  <a href="https://303box.com"><img src="./readme-hero.svg" alt="303box — browser acid pattern sketchpad" width="100%"></a>
</p>

<p align="center">
  <a href="https://303box.com"><img alt="OPEN 303BOX" src="https://img.shields.io/badge/OPEN_303BOX-LIVE-ddff37?style=for-the-badge&labelColor=080809"></a>
  <img alt="T-8 and TD-3 focus" src="https://img.shields.io/badge/HARDWARE-T--8_%2F_TD--3-ddff37?style=for-the-badge&labelColor=080809">
  <img alt="Pattern sketchpad" src="https://img.shields.io/badge/PATTERN-SKETCHPAD-f4f4ef?style=for-the-badge&labelColor=080809">
  <img alt="Web MIDI" src="https://img.shields.io/badge/WEB_MIDI-HARDWARE-ddff37?style=for-the-badge&labelColor=080809">
  <img alt="No AI composition" src="https://img.shields.io/badge/AI_COMPOSITION-NO-f4f4ef?style=for-the-badge&labelColor=080809">
</p>

<h1 align="center">303box</h1>
<p align="center"><strong>Sketch the pattern here. Perform it on your hardware.</strong></p>
<p align="center">A focused 16-step browser workspace for writing, auditioning and transferring acid bass + rhythm ideas.</p>

---

## What 303box is

**303box is not an AI musician and it is not a replacement for live performance.**

It is closer to a notebook with sound:

- write a 16-step idea on a large, readable screen;
- audition it before committing it to hardware;
- use rule-based Random as a starting sketch, then edit it by hand;
- export the pattern as a visual reference;
- route notes/clock to supported MIDI hardware;
- where a transfer workflow is verified, move the pattern into the device without pretending the browser replaces the instrument.

The musical decisions remain with the musician. Notes can be changed, random results can be rejected, knobs still need to be performed, and the final recording/performance is not automated by 303box.

> Random generation is **rule-based pattern randomization**, not an AI composition model.

## Why it exists

Programming a hardware sequencer one tiny step at a time can be slow when you are still exploring an idea. 303box makes that drafting stage easier without pretending to replace the instrument.

| WRITE | AUDITION | TRANSFER | PERFORM |
|---|---|---|---|
| Readable 16-step grid | Browser Web Audio preview | MIDI notes + clock | Hardware knobs remain yours |
| Note / rest / tie | Bass + rhythm together | Device profiles | Final sound decisions remain yours |
| Accent / slide / octave | Scope + FFT | REC / guarded device transfer | Final performance remains yours |
| Rule-based Random | Shared BPM / Swing | Pattern image export | Live performance remains live |

Playback position uses the same small red transport LED across the 303 and rhythm sequencers; pattern content keeps its authored colors.

## 303 editor

The bass sketchpad supports:

`NOTE` · `REST` · `TIE` · `U/D` · `ACCENT` · `SLIDE` · `SAW/SQR` · `BPM`

The browser preview also exposes the familiar performance controls:

`TUNE` · `CUTOFF` · `RESONANCE` · `ENV MOD` · `DECAY` · `ACCENT` · `DELAY` · `DISTORTION` · `REVERB`

These controls make the sketch easier to evaluate. They do not claim to reproduce or replace the final performance on a physical instrument.

## Rhythm

The six-part rhythm sketchpad shares the same clock:

| Voice | Character |
|---|---|
| BD | 909-inspired bass drum |
| SD | 606-inspired snare |
| CP | 808-inspired clap |
| TM | 808-inspired low tom |
| CH | 606-inspired closed hat |
| OH | 606-inspired open hat |

Every part has an independent level. Random rhythm generation is independent from bass generation.

## MIDI / hardware

Playback modes:

- `BROWSER` — browser preview only
- `BROWSER + MIDI` — browser + connected hardware
- `MIDI ONLY` — hardware output only

The MIDI panel includes a **HARDWARE GUIDE / CİHAZ REHBERİ** button. It separates live MIDI, sequencer capture and direct device-memory writes instead of calling all three things “MIDI support.”

### Hardware transfer matrix

| Device | Live MIDI | Sequencer transfer path | Direct browser memory write | Final save |
|---|---|---|---|---|
| **Roland T-8** | Bass + Rhythm, velocity, clock, transport | **REC capture** — Bass hardware-tested; Rhythm beta | **No** — T-8 does not receive SysEx | Physical T-8 WRITE |
| **Behringer TD-3** | Bass + clock/transport workflow | Live MIDI or direct pattern transfer | **Experimental USB SysEx** — read/backup/write/read-back verification | SysEx write saves target pattern slot |
| **Behringer TD-3-MO** | Bass + clock/transport; MIDI-controllable filter capability | Same family, but compatibility is probed at runtime | **Only after compatible read probe** — never blind-written | Only if TD-3 pattern protocol is positively detected |
| Korg volca bass | 303box: notes, velocity, clock; device also documents synthesis CCs | External-MIDI recording is plausible and has community reports, but needs 303box hardware verification | **No** — official MIDI chart marks System Exclusive TX/RX off | Physical device memory workflow; 8 recording patterns |
| Korg volca nubass | 303box: notes, velocity, clock; device also documents parameter CCs | Realtime REC exists; external MIDI capture still needs 303box hardware verification | **No** — official MIDI chart marks System Exclusive TX/RX off | Physical device memory workflow; 16 patterns |

**303box policy:** live MIDI, REC capture and direct non-volatile memory WRITE are separate capabilities. A memory write is never sent blindly.

Primary hardware focus is currently **Roland T-8 + Behringer TD-3/TD-3-MO**. Korg volca bass and volca nubass remain first-class live-MIDI profiles and capture-workflow research targets.

### Behringer TD-3 direct write — experimental / USB only

A reverse-engineered TD-3 MIDI implementation documents a complete pattern read/write exchange. It is **not manufacturer-published documentation**, so 303box treats it as an experimental hardware workflow rather than an official feature claim.

The documented TD-3 pattern protocol uses USB MIDI SysEx. A pattern is requested from the device first; the returned pattern packet uses command `0x78`, and replaying a pattern-response packet back to the TD-3 stores that pattern.

303box adds several guards around that mechanism:

1. SysEx permission is requested separately from normal live MIDI.
2. A TD-3-family USB MIDI input and output must both be present.
3. The device must answer the product-name query as TD-3 / TD-3-MO.
4. The selected target pattern must successfully return a structurally valid pattern packet before WRITE is enabled.
5. The original raw target pattern is stored in browser local storage before modification.
6. The user must explicitly confirm the exact target group / section / pattern.
7. After WRITE, 303box requests the same target again and compares the pattern payload.
8. `RESTORE LAST BACKUP` can replay the pre-write raw packet and verify it by read-back.

The UI is inside **HARDWARE GUIDE → TD-3 DIRECT WRITE** and exposes Group I–IV, Section A/B and Pattern 1–8.

For **TD-3-MO**, 303box does not assume that the original TD-3 reverse-engineered protocol is identical. It first performs a non-destructive product + pattern-read compatibility probe. If that probe fails, direct WRITE remains unavailable.

### Hardware references

- Roland T-8: [Realtime rhythm recording](https://static.roland.com/manuals/T-8_manual_v102/eng/28312384.html) · [MIDI implementation](https://static.roland.com/manuals/T-8_manual_v102/ptb/31849756.html)
- Behringer TD-3: [Official product / sequencer information](https://www.behringer.com/en/products/0718-ABP)
- Behringer TD-3-MO: [Official product / MIDI-controllable VCF information](https://www.behringer.com/en/products/0718-ACF)
- TD-3 reverse-engineered SysEx reference: [303patterns.com TD-3 MIDI implementation](https://303patterns.com/td3-midi.html) — unofficial, use at your own risk
- Korg volca bass: [Official downloads / MIDI documentation](https://www.korg.com/us/support/download/product/0/140/) · [Specifications](https://www.korg.com/us/products/dj/volca_bass/page_2.php)
- Korg volca nubass: [Official downloads / MIDI documentation](https://www.korg.com/us/support/download/product/0/820/) · [Specifications](https://www.korg.com/us/products/dj/volca_nubass/specifications.php)

### Korg transfer position

Both Korg MIDI implementation charts mark **System Exclusive = No**, so 303box does not offer direct browser memory WRITE for volca bass or volca nubass.

The right research path for these devices is REC capture, not SysEx. volca bass has long-standing user reports of notes entered from an external MIDI keyboard being stored by its sequencer, including velocity differences, but 303box will label that workflow experimental until it is tested directly with the application. volca nubass officially provides realtime recording and MIDI IN, but its documentation does not explicitly promise that an external MIDI stream is captured into the sequencer; that also remains a hardware test item.

### Clock and tempo

When `SEND CLOCK` is enabled, 303box sends continuous 24 PPQN MIDI clock so compatible hardware can follow the current browser BPM even while the web transport is stopped.

This is external synchronization, not necessarily a rewrite of the hardware's stored tempo value. For example, a T-8 can return to its internal tempo when external clock disappears.

### T-8 rhythm velocity

T-8 rhythm notes respond to MIDI velocity. The T-8 profile uses a moderate outgoing velocity curve so live browser-driven drums sit closer to the device sequencer instead of overpowering it.

## Roland T-8 REC helper

Real hardware testing confirmed that a 303box bass pattern can be captured after REC is armed on the T-8.

The MIDI panel exposes:

- `BASS → REC`
- `RHYTHM → REC`

Bass REC uses a single 16-step pass because it has tested reliably.

Rhythm REC is still being tuned with real hardware. The current flow avoids sending MIDI Stop after hardware REC has been armed, sends clock-only lock-in first, then MIDI Start and two identical rhythm loops so a missed hit can be reinforced on the same step.

Recommended test flow:

1. Connect the T-8 and enable MIDI.
2. Use AUTO or select `Roland T-8`.
3. Stop the web transport.
4. Select a disposable/empty 16-step pattern on the T-8.
5. Arm REC on the T-8.
6. Press `BASS → REC` or `RHYTHM → REC`.
7. Inspect the captured steps.
8. Use WRITE on the physical device only after confirming the result.

## MIDI safety

`PANIC` is the emergency stop. It clears queued MIDI where possible, sends All Sound Off / All Notes Off, sends MIDI Stop and stops the 303box transport.

Changing browser tabs does not trigger PANIC. Real page exit still performs MIDI cleanup so the device is not intentionally left running after the page is gone.

The TD-3 experimental direct writer never sends a pattern before it has successfully read the target slot and stored a backup.

## Scope / FFT

The analyzer follows the 303 signal rather than the full drum mix. It is a visual aid for the browser sketch, not a measurement claim about connected analog hardware.

## Development note

The **software development process** has included AI-assisted coding with ChatGPT alongside direct design decisions and physical hardware testing.

That is separate from the musical behavior of the application: **303box does not use an AI composition model to make the user's music.** Pattern Random uses explicit musical/randomization rules, and the user remains responsible for the musical choices and performance.

## Run locally

There is no framework and no build step.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

For Web MIDI hardware testing, the live HTTPS deployment is usually the easiest path because Web MIDI requires a secure browser context. SysEx additionally requires explicit browser permission.

## Current production map

```text
303box/
├── index.html                             # static workstation shell + hardware guide dialog
├── app.js                                 # core sequencer foundation
├── acid-console.20260818-1340.js          # unified Web Audio engine
├── midi-router.20260818-1730.js           # MIDI routing + T-8 REC flow
├── hardware-guide.20260819-0815.js        # transfer guide + guarded TD-3 direct writer
├── hardware-guide.20260819-0815.css       # transfer matrix dialog UI
├── bass-scope.20260818-1680.js            # 303-only Scope / FFT
├── generator-router.20260818-1650.js      # independent rule-based generators
├── playhead-unified.20260818-1720.css     # shared red transport LED
├── positioning.20260818-1740.css          # sketchpad / musician-owned positioning UI
├── seo.20260818-1740.js                   # matching EN/TR product + SEO copy
├── sequencer-engine.20260818-1740.js      # production compatibility loader
├── cache-reset.20260818-1740.js           # compatibility cache epoch
└── README.md
```

## Philosophy

**Make the drafting easier. Keep the music human.**

No account. No installer. No fake promise that a browser replaces the musician.

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
