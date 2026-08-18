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
- JPG export for both the 303 pattern sheet and rhythm pattern
- EN / TR interface
- Local browser persistence
- Responsive GitHub Pages deployment

## Acid-aware generation

303box does not treat every sequencer cell as an unrelated dice roll.

The generator works with musical profiles that combine:

- a BPM range,
- a pitch vocabulary,
- a rhythmic density,
- motif repetition and mutation,
- accents,
- ties and slides,
- and a matching groove language.

The 303 and rhythm generators can also be used independently: generating a new bass pattern does not overwrite the rhythm grid, and generating a new rhythm does not overwrite the 303 line.

## Rhythm section

The rhythm machine is intentionally compact and built to sit beside a 303 line.

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

The profile selector changes channel defaults and prevents incompatible data from being sent to synth-only devices.

| 303box profile | Live bass | Live rhythm | Default routing | Direct pattern-memory write |
|---|---:|---:|---|---|
| Roland T-8 | Yes | Yes | Bass CH 2 / Rhythm CH 10 | Not exposed; no documented browser-safe pattern write protocol |
| Behringer TD-3 | Yes | No | Bass CH 1 | Not exposed; no documented public pattern dump/write protocol used by 303box |
| Behringer TD-3-MO | Yes | No | Bass CH 1 | Not exposed; no documented public pattern dump/write protocol used by 303box |
| Korg volca bass | Yes | No | Bass CH 1 | Not exposed; no documented direct memory-write workflow used by 303box |
| Korg volca nubass | Yes | No | Bass CH 1 | Not exposed; no documented direct memory-write workflow used by 303box |
| Generic MIDI | Yes | Optional | User-selectable | Never assumed |

These are **303box MIDI profiles**, not manufacturer certifications. Auto-detection is based on the connected MIDI port name and can be overridden manually.

### Live MIDI vs writing device memory

Live MIDI playback and writing a pattern into a hardware sequencer's non-volatile memory are different operations.

303box currently supports the first one: it can send notes, velocities and — where appropriate — timing/transport messages while the browser sequencer is running.

It intentionally does **not** show a `WRITE BASS` or `WRITE RHYTHM` button unless a device exposes a documented, safe pattern-write protocol that can be implemented without guessing proprietary messages. For hardware such as the T-8, saving a pattern remains a device-side operation.

### MIDI safety

Hardware MIDI is opt-in and fail-safe:

- MIDI permission must be explicitly granted by the browser.
- MIDI output stops if the 303box tab loses visibility.
- Scheduled MIDI data is cleared where the browser/device API allows it.
- Note Off / All Notes Off / All Sound Off cleanup is sent when the router stops.
- MIDI does not silently re-arm after a tab change; the user must enable it again.
- `PANIC` is available for emergency note cleanup.
- Clock and Start / Stop are separate opt-in controls.

This behavior is intentional: a hardware sequencer should not continue receiving a long queued pattern after the user leaves or closes the page.

## Scope and FFT

The analyzer is intentionally scoped to the 303 line rather than the full master output. Drum hits do not change the displayed 303 note/frequency. Scope and FFT controls are moved into the Acid Console before they become visible, avoiding the startup layout jump that previously showed the panel below the pattern before moving it upward.

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
├── index.html                          # production page
├── app.js                              # core sequencer / browser synth foundation
├── styles.css                          # base interface
├── studio.20260818-0912.js             # studio composition layer
├── rhythm-exact.20260818-1030.js       # rhythm voice/grid foundation
├── sequencer-engine.20260818-1660.js   # current production layer loader
├── midi-router.20260818-1660.js        # safe Web MIDI router + device profiles
├── midi-router.20260818-1660.css       # device-profile MIDI UI
├── generator-router.20260818-1650.js   # independent bass / rhythm generators
├── bass-scope.20260818-1600.js         # 303-only scope / FFT layer
├── cache-reset.20260818-1660.js        # runtime asset-cache epoch reset
├── privacy.html                        # EN/TR privacy policy
├── ads.txt                             # Google AdSense publisher declaration
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

The project has been developed iteratively with **AI-assisted coding using ChatGPT**, alongside direct product direction, testing and musical/UI decisions by the project owner.

## Links

- Website: [303box.com](https://303box.com)
- Instagram: [@zafer.pro](https://instagram.com/zafer.pro)
- YouTube: [@zaferlatif](https://youtube.com/@zaferlatif)
- Privacy: [303box.com/privacy.html](https://303box.com/privacy.html)

## License

MIT License. See [`LICENSE`](./LICENSE).
