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

**303box** is a browser-based acid pattern laboratory for building, hearing, randomizing and exporting 16-step 303 lines together with a synchronized rhythm section.

No account. No install. Open the page and start sequencing.

## What it does

- 16-step 303-style note sequencer
- Note, octave, gate, accent and slide programming
- Acid-aware random pattern generation
- BPM generation matched to the musical profile
- Saw / square browser synth preview
- Cutoff, resonance, envelope modulation, decay and accent controls
- Synchronized six-part rhythm machine
- Hardware-faithful companion rhythm voice map
- Independent 303 / rhythm mixer
- Live mini oscilloscope and FFT view
- Browser MIDI output and MIDI clock where Web MIDI is supported
- JPG export for both the 303 pattern sheet and rhythm pattern
- EN / TR interface
- Local browser persistence — current work stays on the device
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
- and a matching drum-groove family.

That means a generated bass line and rhythm section are designed to belong to the same idea rather than two independent random patterns.

## Rhythm section

The rhythm machine is intentionally compact and built to sit beside a 303 line. The source voice map follows the compact companion architecture rather than offering arbitrary 808/909 switching on every row.

| Part | Voice |
|---|---|
| Bass Drum | TR-909 BD |
| Snare Drum | TR-606 SD |
| Hand Clap | TR-808 Clap / Noise Tom / TR-606 High Tom |
| Tom | TR-808 Low Tom / TR-606 Low Tom |
| Closed Hi-Hat | TR-606 CH |
| Open Hi-Hat | TR-606 OH |

Only the Hand Clap and Tom rows expose voice choices; the other rhythm parts are fixed. Each part has its own level control. The rhythm section can run independently or start in sync with the 303 sequence.

The browser audio engine recreates the character of these source voices with Web Audio synthesis; it does not contain Roland sample ROMs or proprietary DSP code.

## MIDI

On browsers with Web MIDI support, 303box can send the programmed line to an available MIDI output.

Available controls include:

- MIDI output selection
- MIDI channel
- Browser / Browser + MIDI / MIDI-only playback
- MIDI clock

MIDI access is always requested by the browser and requires explicit user permission. If no physical or virtual MIDI output exists, 303box keeps browser audio active rather than pretending a device is connected.

## Run locally

There is no build step.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Web MIDI requires a secure context in normal production use, so the live HTTPS deployment is recommended for hardware testing.

## Project structure

```text
303box/
├── index.html                         # production page
├── app.js                             # core 303 sequencer / audio engine
├── styles.css                         # base interface
├── studio.20260818-0912.js            # rhythm, MIDI, analyzer and studio layer
├── studio.20260818-0912.css           # studio layout and responsive styling
├── studio-dark.20260818-0912.css      # dark pattern-sheet styling
├── rhythm-exact.20260818-1030.js      # exact rhythm voice map + preview engine
├── privacy.html                       # EN/TR privacy policy
├── ads.txt                            # Google AdSense publisher declaration
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

The MIDI feature does not upload MIDI performances to a 303box user account or project database.

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