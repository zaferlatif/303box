(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const NOTE_MIDI = { C:60, 'C#':61, D:62, 'D#':63, E:64, F:65, 'F#':66, G:67, 'G#':68, A:69, 'A#':70, B:71 };
  const engine = {
    ctx: null,
    master: null,
    playing: false,
    timer: null,
    step: 0,
    absStep: 0,
    nextAt: 0,
    continuationUntil: -1,
    sources: new Set()
  };

  function bpm() {
    return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow')) || 133, 50, 250);
  }

  function knob(id, fallback = 50) {
    return clamp(Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow')) || fallback, 0, 100) / 100;
  }

  function tuneSemitones() {
    const aria = Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'));
    if (Number.isFinite(aria)) return clamp(aria, -12, 12);
    const stored = Number(localStorage.getItem('303box-tune-semitones-v1'));
    return Number.isFinite(stored) ? clamp(stored, -12, 12) : 0;
  }

  function readStep(i) {
    const noteInput = $$('.note-input')[i];
    const note = noteInput?.value?.trim().toUpperCase() || '';
    const baseOctave = Number(noteInput?.dataset?.baseOctave || 0) ? 12 : 0;
    return {
      note,
      baseOctave,
      octave: $$('.octave-cell')[i]?.textContent.trim() || '',
      expr: $$('.accentSlide-cell')[i]?.textContent.trim() || '',
      gate: $$('.gate-cell')[i]?.textContent.trim() || ''
    };
  }

  function isActive(step) {
    return !!step.note && step.gate !== '-';
  }

  function midiFor(step) {
    const base = NOTE_MIDI[step.note];
    if (base == null) return null;
    let semitones = step.baseOctave + tuneSemitones();
    if (step.octave === 'D') semitones -= 12;
    if (step.octave === 'U') semitones += 12;
    return base + semitones;
  }

  function frequencyFor(step) {
    const midi = midiFor(step);
    if (midi == null) return null;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function waveform() {
    return $('#waveSaw')?.classList.contains('selected') ? 'sawtooth' : 'square';
  }

  function stepDuration() {
    return (60 / bpm()) / 4;
  }

  function connectsToNext(current, next) {
    if (!isActive(next)) return false;
    if (current.expr.includes('S')) return true;
    if (next.gate === '○') return true;
    return false;
  }

  function collectSegment(startStep) {
    const out = [startStep];
    let step = startStep;
    for (let guard = 0; guard < 15; guard += 1) {
      const current = readStep(step);
      const nextStep = (step + 1) % 16;
      const next = readStep(nextStep);
      if (!connectsToNext(current, next)) break;
      out.push(nextStep);
      step = nextStep;
    }
    return out;
  }

  function distortionCurve(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const x = i * 2 / n - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function scheduleSegment(startStep, when) {
    const first = readStep(startStep);
    if (!isActive(first)) return 1;
    const firstFreq = frequencyFor(first);
    if (!firstFreq) return 1;

    const segment = collectSegment(startStep);
    const dur = stepDuration();
    const ctx = engine.ctx;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const shaper = ctx.createWaveShaper();
    const gain = ctx.createGain();

    osc.type = waveform();
    osc.frequency.setValueAtTime(firstFreq, when);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2 + knob('resonance', 78) * 24, when);
    shaper.curve = distortionCurve(7 + knob('resonance', 78) * 9);
    shaper.oversample = '2x';

    const accentAmount = knob('accent', 70);
    const cutoff = knob('cutoff', 38);
    const envMod = knob('envMod', 64);
    const decay = knob('decay', 34);

    gain.gain.setValueAtTime(0.0001, when);

    segment.forEach((stepIndex, pos) => {
      const data = readStep(stepIndex);
      const t = when + pos * dur;
      const accented = data.expr.includes('A');
      const vol = 0.15 + (accented ? 0.075 + accentAmount * 0.11 : 0);
      const baseCutoff = 95 + cutoff * 1750;
      const peak = baseCutoff + 450 + envMod * 3900 + (accented ? 900 + accentAmount * 1800 : 0);

      if (pos === 0) gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t + 0.008);
      else gain.gain.linearRampToValueAtTime(Math.max(0.001, vol), t + 0.012);

      filter.frequency.setValueAtTime(Math.max(95, peak), t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(95, baseCutoff), t + Math.min(dur * 0.88, 0.055 + decay * 0.36));

      if (pos < segment.length - 1) {
        const next = readStep(segment[pos + 1]);
        const nextFreq = frequencyFor(next);
        if (nextFreq) {
          if (data.expr.includes('S')) {
            const slideStart = t + dur * 0.48;
            const slideEnd = t + dur * 0.98;
            const currentFreq = frequencyFor(data) || firstFreq;
            osc.frequency.setValueAtTime(Math.max(20, currentFreq), slideStart);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, nextFreq), slideEnd);
          } else {
            osc.frequency.setValueAtTime(Math.max(20, nextFreq), t + dur);
          }
        }
      }
    });

    const end = when + segment.length * dur;
    const lastData = readStep(segment[segment.length - 1]);
    const lastAccent = lastData.expr.includes('A');
    const finalVol = 0.15 + (lastAccent ? 0.075 + accentAmount * 0.11 : 0);
    try { gain.gain.setValueAtTime(Math.max(0.001, finalVol), Math.max(when + 0.01, end - Math.min(0.035, dur * 0.16))); } catch (_) {}
    gain.gain.exponentialRampToValueAtTime(0.0001, end + 0.09 + decay * 0.16);

    osc.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    gain.connect(engine.master);

    osc.start(when);
    osc.stop(end + 0.36);
    engine.sources.add(osc);
    osc.addEventListener('ended', () => engine.sources.delete(osc), { once: true });

    return segment.length;
  }

  function scheduleVisual(step, when) {
    const delay = Math.max(0, (when - engine.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (!engine.playing) return;
      $$('[data-playing="true"]').forEach(el => el.removeAttribute('data-playing'));
      $(`[data-step-header="${step}"]`)?.setAttribute('data-playing', 'true');
      $$(`[data-step="${step}"]`).forEach(el => el.closest('td')?.setAttribute('data-playing', 'true'));
    }, delay);
  }

  function scheduler() {
    if (!engine.playing || !engine.ctx) return;
    while (engine.nextAt < engine.ctx.currentTime + 0.12) {
      const step = engine.step;
      const abs = engine.absStep;
      if (abs > engine.continuationUntil) {
        const data = readStep(step);
        if (isActive(data)) {
          const len = scheduleSegment(step, engine.nextAt);
          engine.continuationUntil = abs + Math.max(1, len) - 1;
        }
      }
      scheduleVisual(step, engine.nextAt);
      engine.nextAt += stepDuration();
      engine.step = (engine.step + 1) % 16;
      engine.absStep += 1;
    }
    engine.timer = setTimeout(scheduler, 25);
  }

  function updateUi(playing) {
    const button = $('#playButton');
    if (!button) return;
    button.setAttribute('aria-pressed', String(playing));
    $('#playLed')?.classList.toggle('on', playing);
    const label = $('#playLabel');
    if (label) label.textContent = playing ? (document.documentElement.lang === 'tr' ? 'DUR' : 'STOP') : (document.documentElement.lang === 'tr' ? 'ÇAL' : 'PLAY');
  }

  async function start() {
    if (engine.playing) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    engine.ctx = new AC();
    if (engine.ctx.state === 'suspended') await engine.ctx.resume();
    engine.master = engine.ctx.createGain();
    engine.master.gain.value = 1;
    engine.master.connect(engine.ctx.destination);
    engine.playing = true;
    engine.step = 0;
    engine.absStep = 0;
    engine.continuationUntil = -1;
    engine.nextAt = engine.ctx.currentTime + 0.055;
    updateUi(true);
    scheduler();
  }

  function stop() {
    clearTimeout(engine.timer);
    engine.timer = null;
    engine.playing = false;
    engine.sources.forEach(src => { try { src.stop(); } catch (_) {} });
    engine.sources.clear();
    $$('[data-playing="true"]').forEach(el => el.removeAttribute('data-playing'));
    const ctx = engine.ctx;
    engine.ctx = null;
    engine.master = null;
    if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
    updateUi(false);
  }

  function toggle() {
    if (engine.playing) stop();
    else start();
  }

  function installPlaybackOwnership() {
    window.addEventListener('click', event => {
      if (!event.target.closest?.('#playButton')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle();
    }, true);

    document.addEventListener('click', event => {
      if (event.target.closest?.('#clearButton') && engine.playing) stop();
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && engine.ctx?.state === 'suspended') engine.ctx.resume().catch(() => {});
    });
  }

  function installIndependentNotePickers() {
    const inputs = $$('.note-input');
    if (!inputs.length) return false;

    $$('.note-picker, .note-picker-v2').forEach(x => x.remove());
    const savedBase = (() => {
      try {
        const data = JSON.parse(localStorage.getItem('303box-note-base-octaves-v2') || '[]');
        return Array.isArray(data) ? data : [];
      } catch (_) { return []; }
    })();

    const notes = [
      ['','—'],['C','C'],['C#','C#'],['D','D'],['D#','D#'],['E','E'],['F','F'],['F#','F#'],['G','G'],['G#','G#'],['A','A'],['A#','A#'],['B','B'],['C+','C']
    ];

    const persistBase = () => {
      const values = $$('.note-input').map(input => Number(input.dataset.baseOctave || 0) ? 1 : 0);
      localStorage.setItem('303box-note-base-octaves-v2', JSON.stringify(values));
    };

    inputs.forEach((input, index) => {
      input.type = 'hidden';
      input.tabIndex = -1;
      input.classList.add('note-source-hidden');
      input.setAttribute('aria-hidden', 'true');

      if (input.dataset.topC === '1') {
        input.dataset.baseOctave = '1';
        const oct = $$('.octave-cell')[index];
        if (oct?.textContent.trim() === 'U') oct.textContent = '';
        input.dataset.topC = '0';
      } else if (savedBase[index] != null) {
        input.dataset.baseOctave = savedBase[index] ? '1' : '0';
      } else if (!input.dataset.baseOctave) {
        input.dataset.baseOctave = '0';
      }

      const select = document.createElement('select');
      select.className = 'cell-control note-picker-v2';
      select.setAttribute('aria-label', `${document.documentElement.lang === 'tr' ? 'Nota' : 'Note'} ${index + 1}`);
      notes.forEach(([value, label]) => select.appendChild(new Option(label, value)));
      const isTop = input.dataset.baseOctave === '1' && input.value === 'C';
      select.value = isTop ? 'C+' : (input.value || '');
      input.after(select);

      select.addEventListener('change', () => {
        if (select.value === 'C+') {
          input.value = 'C';
          input.dataset.baseOctave = '1';
        } else {
          input.value = select.value;
          input.dataset.baseOctave = '0';
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        persistBase();
      });
    });

    document.addEventListener('click', event => {
      const generated = event.target.closest?.('#generateButton');
      const cleared = event.target.closest?.('#clearButton');
      if (!generated && !cleared) return;
      setTimeout(() => {
        $$('.note-input').forEach((input, index) => {
          input.dataset.baseOctave = '0';
          const picker = $$('.note-picker-v2')[index];
          if (picker) picker.value = input.value || '';
        });
        persistBase();
      }, 0);
    });

    return true;
  }

  function init() {
    if (!$('#patternGrid') || !$('#playButton')) return setTimeout(init, 40);
    installPlaybackOwnership();
    installIndependentNotePickers();
    updateUi(false);
    window.__303boxPlaybackEngine = { start, stop, toggle, readStep, frequencyFor };
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(init, 80));
  window.addEventListener('load', () => setTimeout(() => {
    if (!window.__303boxPlaybackEngine) init();
  }, 120));
})();
