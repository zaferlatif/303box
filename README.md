<p align="center">
  <img src="./readme-hero.svg" alt="303box — browser acid sequencer" width="100%">
</p>

<p align="center">
  <a href="https://303box.com"><img alt="Live" src="https://img.shields.io/badge/LIVE-303box.com-ddff37?style=for-the-badge&labelColor=09090b"></a>
  <img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub-Pages-f4f4ef?style=for-the-badge&logo=github&logoColor=09090b&labelColor=09090b">
  <img alt="Web Audio" src="https://img.shields.io/badge/Web-Audio-ddff37?style=for-the-badge&labelColor=09090b">
  <img alt="Web MIDI" src="https://img.shields.io/badge/Web-MIDI-ddff37?style=for-the-badge&labelColor=09090b">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-f4f4ef?style=for-the-badge&labelColor=09090b">
</p>

# 303box

**303box** is a browser-based acid pattern laboratory for building, hearing, randomizing and exporting 16-step 303 lines together with a synchronized rhythm section and optional hardware MIDI output.

No account. No install. Open the page and start sequencing.

## What it does

- 16-step 303-style note sequencer
- Note, octave, gate, accent and slide programming
- Acid-aware random pattern generation
- BPM generation matched to the musical profile
- Saw / square browser synth preview
- Tune, cutoff, resonance, envelope modulation, decay and accent controls
- Delay, distortion and reverb in the browser audio engine
- Synchronized six-part rhythm machine
- Independent 303 / rhythm level control
- Live 303-only oscilloscope and FFT view
- Web MIDI output with device profiles
- Separate bass and rhythm MIDI routing where the selected hardware supports it
- Optional MIDI clock and Start / Stop output
- T-8 REC Assist Beta for transferring one live 16-step bass or rhythm pass into the device recorder
- JPG export for both the 303 pattern sheet and rhythm pattern
- EN / TR interface
- Local browser persistence
- Responsive GitHub Pages deployment

## Acid-aware generation

303box does not treat every sequencer cell as an unrelated dice roll. The generator works with musical profiles combining BPM range, pitch vocabulary, rhythmic density, motif repetition/mutation, accents, ties, slides and a matching groove language.

The 303 and rhythm generators are independent: generating a new bass pattern does not overwrite the rhythm grid, and generating a new rhythm does not overwrite the 303 line.

## Rhythm section

| Part | Browser voice / hardware note role |
|---|---|
| Bass Drum | TR-909-inspired BD |
| Snare Drum | TR-606-inspired SD |
| Hand Clap | TR-808-inspired clap |
| Tom | TR-808-inspired low tom |
| Closed Hi-Hat | TR-606-inspired CH |
| Open Hi-Hat | TR-606-inspired OH |

Each part has its own level control. Closed and open hi-hat steps can coexist in the grid; choke behavior belongs to playback rather than pattern editing.

The browser audio engine synthesizes these voices with Web Audio. It does not contain Roland sample ROMs, Behringer firmware, Korg firmware, or proprietary DSP code.

## MIDI

303box uses the Web MIDI API to route the sequencer to supported hardware profiles or a generic MIDI output.

### Playback modes

- **Browser** — browser audio only
- **Browser + MIDI** — browser audio and connected hardware together
- **MIDI only** — hardware output only when a valid MIDI connection is active

### Device profiles

| 303box profile | Live bass | Live rhythm | Default routing | REC Assist |
|---|---:|---:|---|---|
| Roland T-8 | Yes | Yes | Bass CH 2 / Rhythm CH 10 | Bass capture validated; rhythm capture Beta |
| Behringer TD-3 | Yes | No | Bass CH 1 | Not enabled |
| Behringer TD-3-MO | Yes | No | Bass CH 1 | Not enabled |
| Korg volca bass | Yes | No | Bass CH 1 | Not enabled |
| Korg volca nubass | Yes | No | Bass CH 1 | Not enabled |
| Generic MIDI | Yes | Optional | User-selectable | Never assumed |

These are **303box MIDI profiles**, not manufacturer certifications. Auto-detection is based on the connected MIDI port name and can be overridden manually.

Channel choices are remembered per device profile. The 1690 router also remembers the last hardware name/profile so the UI does not fall back to `Generic MIDI` simply because MIDI permission has not yet been re-armed after a safety stop.

### T-8 REC Assist Beta

Directly writing non-volatile device memory and feeding a pattern into a device's active recorder are different operations.

Real-hardware testing confirmed that a 303box bass MIDI performance can be captured after the user manually arms recording on a Roland T-8. Rhythm recording also captured data, but dense steps could miss some simultaneous hits. The current Beta therefore uses a dedicated clocked transfer pass rather than ordinary live playback.

- **BASS → REC** — sends one clocked 16-step bass pass
- **RHYTHM → REC** — sends one clocked 16-step rhythm pass

Workflow:

1. Connect and enable the T-8 MIDI output.
2. Select the T-8 device profile or use AUTO detection.
3. Arm REC on the T-8 itself.
4. Press `BASS → REC` or `RHYTHM → REC` in 303box.
5. 303box stops normal playback and sends exactly one controlled 16-step pass with MIDI clock.
6. Inspect the captured pattern on the device.
7. If it is correct, perform the final WRITE/save operation on the hardware itself.

REC Assist **does not write the T-8's non-volatile pattern memory directly**. The final memory write remains a physical device operation.

For the rhythm Beta, note-ons that share one step are staggered by a few milliseconds after the step clock edge while remaining inside the same 16th-note window. This is intended to reduce missed simultaneous hits seen during the first real-device recording test. The improved rhythm transfer still requires another real-hardware validation pass.

### MIDI safety

Hardware MIDI is opt-in and fail-safe:

- MIDI permission must be explicitly granted by the browser.
- MIDI output stops if the 303box tab loses visibility/focus according to the safety router.
- Scheduled MIDI data is cleared where the browser/device API allows it.
- All Sound Off / All Notes Off cleanup is sent during emergency cleanup.
- MIDI does not silently re-arm after a safety stop; the user explicitly enables it again.
- `PANIC` clears queued MIDI, sends emergency cleanup across all MIDI channels, sends MIDI Stop and stops the 303box transport.
- Clock and Start / Stop are separate opt-in controls.

This behavior is intentional: hardware should not keep receiving a long queued performance after the user leaves the page.

## Scope and FFT

The analyzer is intentionally scoped to the 303 line rather than the master output. Drum hits do not change the displayed 303 note/frequency.

As of the 1680/1690 UI cleanup, **Acid Console, Scope and MIDI exist in their final HTML positions from the first render**. They are no longer created below the pattern and moved upward later by runtime layout scripts. This removes the startup jump and dramatically reduces DOM re-parenting around interactive controls.

The current scope renderer uses a hardware-style grid/trace, smooth slide-frequency interpolation and a logarithmic FFT representation of the 303 oscillator/filter state.

## UI architecture

The workstation previously accumulated multiple runtime layout authorities: the Acid Console was inserted dynamically, Scope/MIDI were created under the hardware strip, another layer moved them into the console, and the MIDI router replaced the legacy panel after mounting.

The current architecture removes that chain:

- Acid Console is static in `index.html`.
- Scope is static in the Acid Console.
- MIDI controls are static in the Acid Console.
- The MIDI router binds to existing controls instead of replacing their DOM.
- Legacy `.sheet-io` output from the older studio layer is hidden/removed.
- Broad layout observers that repeatedly re-parented controls are no longer part of the production loader.
- Random Patch stays in the Tempo module without using the old absolute-positioned compact-workstation layer.

## Run locally

There is no build step.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Web MIDI normally requires a secure context in production, so the live HTTPS deployment is recommended for hardware testing.

## Project structure

```text
303box/
├── index.html                           # production page; static Acid Console / Scope / MIDI
├── app.js                               # core sequencer / browser synth foundation
├── styles.css                           # base interface
├── studio.20260818-0912.js              # studio/rhythm composition foundation
├── rhythm-exact.20260818-1030.js        # rhythm voice/grid foundation
├── sequencer-engine.20260818-1690.js    # current production compatibility/audio loader
├── midi-router.20260818-1690.js         # stable MIDI state, device profiles, safety + T-8 REC Beta
├── console-stable.20260818-1680.css     # static responsive Acid Console / Scope / MIDI layout
├── workstation-ui.20260818-1680.js      # stable control ordering + Random Patch
├── workstation-ui.20260818-1680.css     # stable Tempo / Random Patch styling
├── generator-router.20260818-1650.js    # independent bass / rhythm generators
├── bass-scope.20260818-1680.js          # static 303-only scope / FFT renderer
├── cache-reset.20260818-1690.js         # runtime asset-cache epoch reset
├── privacy.html                         # EN/TR privacy policy
├── ads.txt                              # Google AdSense publisher declaration
├── sitemap.xml
├── robots.txt
├── llms.txt
├── site.webmanifest
├── favicon.svg
├── CNAME
└── README.md
```

## Privacy & advertising

303box uses local browser storage for session state and can use Google Analytics and Google AdSense on the live site. Consent requirements are handled through the configured Google consent flow where applicable.

Privacy policy: **https://303box.com/privacy.html**

MIDI performances are not uploaded to a 303box user account or project database.

## Deployment

Production is deployed from the `main` branch through GitHub Pages with the custom domain:

**https://303box.com**

The project intentionally stays framework-free so deployment remains transparent and lightweight.

## Development note

303box is a **Z3Z project** by [@zafer.pro](https://instagram.com/zafer.pro).

The project has been developed iteratively with **AI-assisted coding using ChatGPT**, alongside direct product direction, real hardware testing and musical/UI decisions by the project owner.

## Links

- Website: [303box.com](https://303box.com)
- Instagram: [@zafer.pro](https://instagram.com/zafer.pro)
- YouTube: [@zaferlatif](https://youtube.com/@zaferlatif)
- Privacy: [303box.com/privacy.html](https://303box.com/privacy.html)

## License

MIT License. See [`LICENSE`](./LICENSE).
