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
    absoluteStep: 0,
    nextAt: 0,
    continuationUntil: -1,
    sources: new Set()
  };

  function bpm() {
    return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow')) || 133, 50, 250);
  }

  function knob(id, fallback = 50) {
    const value = Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow'));
    return clamp(Number.isFinite(value) ? value : fallback, 0, 100) / 100;
  }

  function tuneSemitones() {
    const aria = Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'));
    if (Number.isFinite(aria)) return clamp(aria, -12, 12);
    const stored = Number(localStorage.getItem('303box-tune-semitones-v1'));
    return Number.isFinite(stored) ? clamp(stored, -12, 12) : 0;
  }

  function readStep(i) {
    const noteInput = $$('.note-input')[i];
    return {
      note: noteInput?.value?.trim().toUpperCase() || '',
      baseOctave: Number(noteInput?.dataset?.baseOctave || 0) ? 12 : 0,
      octave: $$('.octave-cell')[i]?.textContent.trim().toUpperCase() || '',
      expr: $$('.accentSlide-cell')[i]?.textContent.trim().toUpperCase() || '',
      gate: $$('.gate-cell')[i]?.textContent.trim() || ''
    };
  }

  function playable(step) {
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

  /*
   * 303box gate semantics:
   *   ● = trigger this step
   *   ○ = tie THIS step into the following step
   *   - = rest
   *   S = slide THIS step into the following step
   *
   * The previous engine incorrectly looked at next.gate === '○'.
   */
  function connectsToNext(current, next) {
    if (!playable(current) || !playable(next)) return false;
    return current.gate === '○' || current.expr.includes('S');
  }

  function collectLegatoSegment(startStep) {
    const out = [startStep];
    let currentIndex = startStep;
    for (let guard = 0; guard < 15; guard += 1) {
      const current = readStep(currentIndex);
      const nextIndex = (currentIndex + 1) % 16;
      const next = readStep(nextIndex);
      if (!connectsToNext(current, next)) break;
      out.push(nextIndex);
      currentIndex = nextIndex;
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

  function scheduleFilterStart(filter, when, accented, dur) {
    const cutoff = knob('cutoff', 38);
    const envMod = knob('envMod', 64);
    const decay = knob('decay', 34);
    const accent = knob('accent', 70);
    const base = 90 + cutoff * 1800;
    const peak = base + 500 + envMod * 3900 + (accented ? 900 + accent * 1900 : 0);
    const decayTime = Math.min(dur * 0.92, 0.055 + decay * 0.38);
    filter.frequency.setValueAtTime(Math.max(90, peak), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, base), when + decayTime);
    return { base, accent };
  }

  function scheduleConnectedAccent(filter, gain, when, accented, base, accent, dur) {
    const normal = 0.155;
    const boosted = normal + 0.075 + accent * 0.11;
    if (!accented) {
      gain.gain.setTargetAtTime(normal, when, 0.012);
      return;
    }

    const envMod = knob('envMod', 64);
    const peak = base + 700 + envMod * 2400 + 850 + accent * 1500;
    gain.gain.setTargetAtTime(boosted, when, 0.006);
    gain.gain.setTargetAtTime(normal, when + Math.min(dur * 0.42, 0.07), 0.025);
    filter.frequency.setValueAtTime(Math.max(90, base), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(100, peak), when + 0.009);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, base), when + Math.min(dur * 0.66, 0.09));
  }

  function schedulePitchTransition(osc, current, next, boundary, dur) {
    const currentFreq = frequencyFor(current);
    const nextFreq = frequencyFor(next);
    if (!currentFreq || !nextFreq) return;

    if (current.expr.includes('S')) {
      /*
       * A real 303-style slide happens when the pitch CV changes at the NEXT
       * step boundary while the gate stays open.  Start at the boundary, then
       * slew toward the new pitch for roughly 40–75 ms depending on tempo.
       */
      const slideTime = clamp(dur * 0.52, 0.04, 0.075);
      osc.frequency.setValueAtTime(Math.max(20, currentFreq), boundary);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, nextFreq), boundary + slideTime);
    } else {
      /* Tie without slide: gate remains open but pitch jumps at the boundary. */
      osc.frequency.setValueAtTime(Math.max(20, nextFreq), boundary);
    }
  }

  function scheduleSegment(startStep, when) {
    const first = readStep(startStep);
    if (!playable(first)) return 1;
    const firstFreq = frequencyFor(first);
    if (!firstFreq) return 1;

    const segment = collectLegatoSegment(startStep);
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

    const firstAccent = first.expr.includes('A');
    const accentAmount = knob('accent', 70);
    const startVolume = 0.155 + (firstAccent ? 0.075 + accentAmount * 0.11 : 0);
    const filterState = scheduleFilterStart(filter, when, firstAccent, dur);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, startVolume), when + 0.008);

    for (let pos = 0; pos < segment.length; pos += 1) {
      const stepIndex = segment[pos];
      const current = readStep(stepIndex);
      const stepAt = when + pos * dur;

      if (pos > 0) {
        scheduleConnectedAccent(
          filter,
          gain,
          stepAt,
          current.expr.includes('A'),
          filterState.base,
          filterState.accent,
          dur
        );
      }

      if (pos < segment.length - 1) {
        const next = readStep(segment[pos + 1]);
        const boundary = when + (pos + 1) * dur;
        schedulePitchTransition(osc, current, next, boundary, dur);
      }
    }

    const end = when + segment.length * dur;
    const decay = knob('decay', 34);
    const releaseStart = Math.max(when + 0.012, end - Math.min(0.025, dur * 0.14));
    gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value || 0.155), releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, end + 0.075 + decay * 0.15);

    osc.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    gain.connect(engine.master);

    osc.start(when);
    osc.stop(end + 0.34);
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
      const absoluteStep = engine.absoluteStep;

      if (absoluteStep > engine.continuationUntil) {
        const data = readStep(step);
        if (playable(data)) {
          const length = scheduleSegment(step, engine.nextAt);
          engine.continuationUntil = absoluteStep + Math.max(1, length) - 1;
        }
      }

      scheduleVisual(step, engine.nextAt);
      engine.nextAt += stepDuration();
      engine.step = (engine.step + 1) % 16;
      engine.absoluteStep += 1;
    }

    engine.timer = setTimeout(scheduler, 25);
  }

  function updateUi(playing) {
    const button = $('#playButton');
    if (!button) return;
    button.setAttribute('aria-pressed', String(playing));
    $('#playLed')?.classList.toggle('on', playing);
    const label = $('#playLabel');
    if (label) {
      label.textContent = playing
        ? (document.documentElement.lang === 'tr' ? 'DUR' : 'STOP')
        : (document.documentElement.lang === 'tr' ? 'ÇAL' : 'PLAY');
    }
  }

  async function start() {
    if (engine.playing) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    engine.ctx = new AudioContextClass();
    if (engine.ctx.state === 'suspended') await engine.ctx.resume();
    engine.master = engine.ctx.createGain();
    engine.master.gain.value = 1;
    engine.master.connect(engine.ctx.destination);

    engine.playing = true;
    engine.step = 0;
    engine.absoluteStep = 0;
    engine.continuationUntil = -1;
    engine.nextAt = engine.ctx.currentTime + 0.055;
    updateUi(true);
    scheduler();
  }

  function stop() {
    clearTimeout(engine.timer);
    engine.timer = null;
    engine.playing = false;

    engine.sources.forEach(source => {
      try { source.stop(); } catch (_) {}
    });
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
      if (!document.hidden && engine.ctx?.state === 'suspended') {
        engine.ctx.resume().catch(() => {});
      }
    });
  }

  /* Keep the last C in the picker independent from the U/D row. */
  function installIndependentNotePickers() {
    const inputs = $$('.note-input');
    if (!inputs.length) return false;

    $$('.note-picker, .note-picker-v2').forEach(x => x.remove());

    const savedBase = (() => {
      try {
        const data = JSON.parse(localStorage.getItem('303box-note-base-octaves-v2') || '[]');
        return Array.isArray(data) ? data : [];
      } catch (_) {
        return [];
      }
    })();

    const notes = [
      ['','—'],['C','C'],['C#','C#'],['D','D'],['D#','D#'],['E','E'],['F','F'],
      ['F#','F#'],['G','G'],['G#','G#'],['A','A'],['A#','A#'],['B','B'],['C+','C']
    ];

    const persistBase = () => {
      const values = $$('.note-input').map(input => Number(input.dataset.baseOctave || 0) ? 1 : 0);
      localStorage.setItem('303box-note-base-octaves-v2', JSON.stringify(values));
    };

    const syncPickers = () => {
      $$('.note-input').forEach((input, index) => {
        const picker = $$('.note-picker-v2')[index];
        if (!picker) return;
        picker.value = input.dataset.baseOctave === '1' && input.value === 'C' ? 'C+' : (input.value || '');
      });
    };

    inputs.forEach((input, index) => {
      input.type = 'hidden';
      input.tabIndex = -1;
      input.classList.add('note-source-hidden');
      input.setAttribute('aria-hidden', 'true');

      if (input.dataset.topC === '1') {
        input.dataset.baseOctave = '1';
        input.dataset.topC = '0';
        const octaveCell = $$('.octave-cell')[index];
        if (octaveCell?.textContent.trim() === 'U') octaveCell.textContent = '';
      } else if (savedBase[index] != null) {
        input.dataset.baseOctave = savedBase[index] ? '1' : '0';
      } else if (!input.dataset.baseOctave) {
        input.dataset.baseOctave = '0';
      }

      const select = document.createElement('select');
      select.className = 'cell-control note-picker-v2';
      select.setAttribute('aria-label', `${document.documentElement.lang === 'tr' ? 'Nota' : 'Note'} ${index + 1}`);
      notes.forEach(([value, label]) => select.appendChild(new Option(label, value)));
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

    syncPickers();

    document.addEventListener('click', event => {
      const generated = event.target.closest?.('#generateButton');
      const cleared = event.target.closest?.('#clearButton');
      if (!generated && !cleared) return;
      setTimeout(() => {
        $$('.note-input').forEach(input => { input.dataset.baseOctave = '0'; });
        persistBase();
        syncPickers();
      }, 0);
    });

    return true;
  }

  function debugPattern() {
    return Array.from({ length: 16 }, (_, i) => {
      const step = readStep(i);
      return {
        step: i + 1,
        ...step,
        midi: midiFor(step),
        hz: frequencyFor(step),
        connectsToNext: connectsToNext(step, readStep((i + 1) % 16))
      };
    });
  }

  function init() {
    if (!$('#patternGrid') || !$('#playButton')) {
      setTimeout(init, 40);
      return;
    }
    installPlaybackOwnership();
    installIndependentNotePickers();
    updateUi(false);
    window.__303boxPlaybackEngine = {
      start,
      stop,
      toggle,
      readStep,
      frequencyFor,
      debugPattern
    };
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(init, 80));
  window.addEventListener('load', () => setTimeout(() => {
    if (!window.__303boxPlaybackEngine) init();
  }, 120));
})();