(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const NOTE_MIDI = { C:60, 'C#':61, D:62, 'D#':63, E:64, F:65, 'F#':66, G:67, 'G#':68, A:69, 'A#':70, B:71 };

  const engine = {
    ctx: null,
    input: null,
    master: null,
    fx: null,
    state: 'stopped',
    playing: false,
    timer: null,
    step: 0,
    absoluteStep: 0,
    nextAt: 0,
    continuationUntil: -1,
    sources: new Set(),
    generation: 0
  };

  let syntheticSpaceLock = false;

  function bpm() {
    return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow')) || 133, 50, 250);
  }

  function knob(id, fallback = 0) {
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
    const input = $$('.note-input')[i];
    return {
      note: input?.value?.trim().toUpperCase() || '',
      baseOctave: Number(input?.dataset?.baseOctave || 0) ? 12 : 0,
      octave: $$('.octave-cell')[i]?.textContent.trim().toUpperCase() || '',
      expr: $$('.accentSlide-cell')[i]?.textContent.trim().toUpperCase() || '',
      gate: $$('.gate-cell')[i]?.textContent.trim() || ''
    };
  }

  function playable(step) { return !!step.note && step.gate !== '-'; }

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

  function stepDuration() { return (60 / bpm()) / 4; }

  function connectsToNext(current, next) {
    if (!playable(current) || !playable(next)) return false;
    return current.gate === '○' || current.expr.includes('S');
  }

  function collectLegatoSegment(startStep) {
    const segment = [startStep];
    let currentIndex = startStep;
    for (let guard = 0; guard < 15; guard += 1) {
      const current = readStep(currentIndex);
      const nextIndex = (currentIndex + 1) % 16;
      const next = readStep(nextIndex);
      if (!connectsToNext(current, next)) break;
      segment.push(nextIndex);
      currentIndex = nextIndex;
    }
    return segment;
  }

  function softClipCurve(drive = 2.3) {
    const n = 1024;
    const curve = new Float32Array(n);
    const norm = Math.tanh(drive);
    for (let i = 0; i < n; i += 1) {
      const x = i * 2 / (n - 1) - 1;
      curve[i] = Math.tanh(x * drive) / norm;
    }
    return curve;
  }

  function setupFxGraph(ctx) {
    const input = ctx.createGain();
    const master = ctx.createGain();
    const dry = ctx.createGain();
    const drivePre = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const driveWet = ctx.createGain();
    const delaySend = ctx.createGain();
    const delay = ctx.createDelay(2.0);
    const feedback = ctx.createGain();
    const delayWet = ctx.createGain();

    shaper.curve = softClipCurve(2.35);
    shaper.oversample = '2x';

    input.connect(dry); dry.connect(master);
    input.connect(drivePre); drivePre.connect(shaper); shaper.connect(driveWet); driveWet.connect(master);
    input.connect(delaySend); delaySend.connect(delay); delay.connect(delayWet); delayWet.connect(master); delay.connect(feedback); feedback.connect(delay);
    master.gain.value = 0.92;
    master.connect(ctx.destination);

    engine.input = input;
    engine.master = master;
    engine.fx = { dry, drivePre, driveWet, delaySend, delay, feedback, delayWet };
    updateEffects(true);
  }

  function updateEffects(immediate = false) {
    if (!engine.ctx || !engine.fx || engine.ctx.state === 'closed') return;
    const now = engine.ctx.currentTime;
    const dist = knob('distortion', 0);
    const del = knob('delay', 0);
    const tc = immediate ? 0.001 : 0.025;
    const set = (param, value) => {
      try { param.setTargetAtTime(value, now, tc); } catch (_) { try { param.value = value; } catch (_) {} }
    };
    set(engine.fx.dry.gain, 1 - dist * 0.28);
    set(engine.fx.drivePre.gain, 1 + dist * 8.5);
    set(engine.fx.driveWet.gain, dist * 0.58);
    set(engine.fx.delaySend.gain, del * 0.55);
    set(engine.fx.delayWet.gain, 0.72);
    set(engine.fx.feedback.gain, del <= 0.001 ? 0 : 0.16 + del * 0.48);
    try { engine.fx.delay.delayTime.setTargetAtTime(clamp(stepDuration() * 3, 0.12, 0.72), now, 0.02); } catch (_) {}
  }

  function filterValues(accented) {
    const cutoff = knob('cutoff', 38);
    const resonance = knob('resonance', 78);
    const envMod = knob('envMod', 64);
    const decay = knob('decay', 34);
    const accent = knob('accent', 70);
    const base = 95 + cutoff * 1650;
    const peak = base + 320 + envMod * 3300 + (accented ? 650 + accent * 1250 : 0);
    return { base, peak, resonance, decay, accent };
  }

  function triggerFilter(filter, when, accented, dur) {
    const f = filterValues(accented);
    const decayTime = Math.min(dur * 0.92, 0.05 + f.decay * 0.31);
    filter.frequency.setValueAtTime(Math.max(90, f.peak), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, f.base), when + decayTime);
    return f;
  }

  function accentConnectedStep(filter, gain, when, accented, dur) {
    const normal = 0.145;
    if (!accented) {
      gain.gain.setTargetAtTime(normal, when, 0.012);
      return;
    }
    const f = filterValues(true);
    const boosted = normal + 0.055 + f.accent * 0.075;
    gain.gain.setTargetAtTime(boosted, when, 0.006);
    gain.gain.setTargetAtTime(normal, when + Math.min(dur * 0.46, 0.072), 0.026);
    filter.frequency.setValueAtTime(Math.max(90, f.base), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(100, f.peak), when + 0.009);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, f.base), when + Math.min(dur * 0.7, 0.095));
  }

  function schedulePitchTransition(osc, current, next, boundary, dur) {
    const currentFreq = frequencyFor(current);
    const nextFreq = frequencyFor(next);
    if (!currentFreq || !nextFreq) return;
    if (current.expr.includes('S')) {
      const slideTime = clamp(dur * 0.48, 0.038, 0.072);
      osc.frequency.setValueAtTime(Math.max(20, currentFreq), boundary);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, nextFreq), boundary + slideTime);
    } else {
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
    if (!ctx || ctx.state === 'closed') return 1;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    osc.type = waveform();
    osc.frequency.setValueAtTime(firstFreq, when);

    const firstAccent = first.expr.includes('A');
    const fv = triggerFilter(filter, when, firstAccent, dur);
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.5 + fv.resonance * 18.5, when);

    const normal = 0.145;
    const startVolume = normal + (firstAccent ? 0.055 + fv.accent * 0.075 : 0);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.001, startVolume), when + 0.008);
    if (firstAccent) amp.gain.setTargetAtTime(normal, when + Math.min(dur * 0.42, 0.07), 0.024);

    for (let pos = 0; pos < segment.length; pos += 1) {
      const current = readStep(segment[pos]);
      const stepAt = when + pos * dur;
      if (pos > 0) accentConnectedStep(filter, amp, stepAt, current.expr.includes('A'), dur);
      if (pos < segment.length - 1) schedulePitchTransition(osc, current, readStep(segment[pos + 1]), when + (pos + 1) * dur, dur);
    }

    const end = when + segment.length * dur;
    const decay = knob('decay', 34);
    const releaseAt = segment.length === 1 ? when + dur * (first.gate === '○' ? 0.92 : 0.64) : end - Math.min(0.018, dur * 0.1);
    amp.gain.setTargetAtTime(0.0001, Math.max(when + 0.015, releaseAt), 0.035 + decay * 0.085);

    osc.connect(filter); filter.connect(amp); amp.connect(engine.input);
    osc.start(when);
    osc.stop(Math.max(end, releaseAt) + 0.32);
    engine.sources.add(osc);
    osc.addEventListener('ended', () => engine.sources.delete(osc), { once:true });
    return segment.length;
  }

  function scheduleVisual(step, when, generation) {
    const ctx = engine.ctx;
    if (!ctx) return;
    const delay = Math.max(0, (when - ctx.currentTime) * 1000);
    setTimeout(() => {
      if (!engine.playing || generation !== engine.generation) return;
      $$('[data-playing="true"]').forEach(el => el.removeAttribute('data-playing'));
      $(`[data-step-header="${step}"]`)?.setAttribute('data-playing', 'true');
      $$(`[data-step="${step}"]`).forEach(el => el.closest('td')?.setAttribute('data-playing', 'true'));
    }, delay);
  }

  function scheduler(generation) {
    if (!engine.playing || engine.state !== 'playing' || !engine.ctx || generation !== engine.generation) return;
    updateEffects(false);
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
      scheduleVisual(step, engine.nextAt, generation);
      engine.nextAt += stepDuration();
      engine.step = (engine.step + 1) % 16;
      engine.absoluteStep += 1;
    }
    engine.timer = setTimeout(() => scheduler(generation), 25);
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
    if (engine.state !== 'stopped') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const generation = ++engine.generation;
    engine.state = 'starting';
    updateUi(true);

    const ctx = new AC();
    engine.ctx = ctx;
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      if (engine.state !== 'starting' || generation !== engine.generation || engine.ctx !== ctx) {
        if (ctx.state !== 'closed') ctx.close().catch(() => {});
        return;
      }
      setupFxGraph(ctx);
      engine.playing = true;
      engine.state = 'playing';
      engine.step = 0;
      engine.absoluteStep = 0;
      engine.continuationUntil = -1;
      engine.nextAt = ctx.currentTime + 0.055;
      updateUi(true);
      scheduler(generation);
    } catch (_) {
      if (engine.ctx === ctx) engine.ctx = null;
      engine.playing = false;
      engine.state = 'stopped';
      updateUi(false);
      try { if (ctx.state !== 'closed') await ctx.close(); } catch (_) {}
    }
  }

  function stop() {
    if (engine.state === 'stopped') return;
    ++engine.generation;
    engine.state = 'stopping';
    clearTimeout(engine.timer);
    engine.timer = null;
    engine.playing = false;
    engine.sources.forEach(source => { try { source.stop(); } catch (_) {} });
    engine.sources.clear();
    $$('[data-playing="true"]').forEach(el => el.removeAttribute('data-playing'));
    const ctx = engine.ctx;
    engine.ctx = null;
    engine.input = null;
    engine.master = null;
    engine.fx = null;
    updateUi(false);
    engine.state = 'stopped';
    if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
  }

  function toggle() {
    if (engine.state === 'playing' || engine.state === 'starting') stop();
    else if (engine.state === 'stopped') start();
  }

  function installPlaybackOwnership() {
    window.addEventListener('keyup', event => {
      if (event.code === 'Space') syntheticSpaceLock = false;
    }, true);
    window.addEventListener('blur', () => { syntheticSpaceLock = false; });

    window.addEventListener('click', event => {
      if (!event.target.closest?.('#playButton')) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      // HTMLElement.click() from the Space shortcut has detail=0. Accept only one
      // synthetic click until Space is released, so key-repeat cannot spawn/restart audio.
      if (event.detail === 0) {
        if (syntheticSpaceLock) return;
        syntheticSpaceLock = true;
      }
      toggle();
    }, true);

    document.addEventListener('click', event => {
      if (event.target.closest?.('#clearButton')) stop();
    }, true);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && engine.ctx?.state === 'suspended') engine.ctx.resume().catch(() => {});
    });
    window.addEventListener('303box:fxchange', () => updateEffects(false));
  }

  function installIndependentNotePickers() {
    const inputs = $$('.note-input');
    if (!inputs.length) return false;
    $$('.note-picker, .note-picker-v2').forEach(x => x.remove());

    let savedBase = [];
    try {
      const data = JSON.parse(localStorage.getItem('303box-note-base-octaves-v2') || '[]');
      if (Array.isArray(data)) savedBase = data;
    } catch (_) {}

    const options = [['','—'],['C','C'],['C#','C#'],['D','D'],['D#','D#'],['E','E'],['F','F'],['F#','F#'],['G','G'],['G#','G#'],['A','A'],['A#','A#'],['B','B'],['C+','C']];
    const persistBase = () => localStorage.setItem('303box-note-base-octaves-v2', JSON.stringify($$('.note-input').map(input => Number(input.dataset.baseOctave || 0) ? 1 : 0)));

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
      } else if (savedBase[index] != null) input.dataset.baseOctave = savedBase[index] ? '1' : '0';
      else if (!input.dataset.baseOctave) input.dataset.baseOctave = '0';

      const select = document.createElement('select');
      select.className = 'cell-control note-picker-v2';
      select.setAttribute('aria-label', `${document.documentElement.lang === 'tr' ? 'Nota' : 'Note'} ${index + 1}`);
      options.forEach(([value, label]) => select.appendChild(new Option(label, value)));
      select.value = input.dataset.baseOctave === '1' && input.value === 'C' ? 'C+' : (input.value || '');
      input.after(select);

      select.addEventListener('change', () => {
        if (select.value === 'C+') { input.value = 'C'; input.dataset.baseOctave = '1'; }
        else { input.value = select.value; input.dataset.baseOctave = '0'; }
        input.dispatchEvent(new Event('input', { bubbles:true }));
        persistBase();
      });
    });

    document.addEventListener('click', event => {
      if (!event.target.closest?.('#generateButton, #clearButton')) return;
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
    if (!$('#patternGrid') || !$('#playButton')) return setTimeout(init, 50);
    if (window.__303boxPlaybackEngine?.version === '1300') return;
    installPlaybackOwnership();
    installIndependentNotePickers();
    updateUi(false);
    window.__303boxPlaybackEngine = { version:'1300', start, stop, toggle, readStep, frequencyFor, updateEffects, get state(){ return engine.state; } };
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(init, 80));
  window.addEventListener('load', () => setTimeout(init, 140));
})();
