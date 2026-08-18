(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NOTE_MIDI = { C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71 };
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));

  let mode = 'scope';
  let canvas = null;
  let g = null;
  let lastStep = -1;
  let stepStartedAt = 0;
  let lastReadout = { note:'--', hz:'-- Hz' };

  const unified = () => window.__303boxUnifiedEngine;

  function bpm(){
    const v = Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'));
    return clamp(Number.isFinite(v) ? v : 140, 50, 250);
  }

  function tune(){
    const v = Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'));
    const saved = Number(localStorage.getItem('303box-tune-semitones-v1'));
    return clamp(Number.isFinite(v) ? v : (Number.isFinite(saved) ? saved : 0), -12, 12);
  }

  function wave(){
    return $('#waveSaw')?.classList.contains('selected') ? 'saw' : 'square';
  }

  function activeStep(){
    const h = $('#patternSheet [data-step-header][data-playing="true"]');
    if (!h) return -1;
    const n = Number(h.dataset.stepHeader);
    return Number.isInteger(n) && n >= 0 && n < 16 ? n : -1;
  }

  function readStep(i){
    if (i < 0 || i > 15) return null;
    const sheet = $('#patternSheet');
    if (!sheet) return null;
    const notes = $$('.note-input', sheet);
    const gates = $$('.gate-cell', sheet);
    const octaves = $$('.octave-cell', sheet);
    const exprs = $$('.accentSlide-cell', sheet);
    const input = notes[i];
    return {
      note: input?.value?.trim().toUpperCase() || '',
      baseOctave: Number(input?.dataset?.baseOctave || 0) ? 12 : 0,
      octave: octaves[i]?.textContent.trim().toUpperCase() || '',
      gate: gates[i]?.textContent.trim() || '',
      expr: exprs[i]?.textContent.trim().toUpperCase() || ''
    };
  }

  function playable(step){
    return !!step?.note && step.gate !== '-';
  }

  function frequencyFor(step){
    if (!playable(step)) return 0;
    const midi = NOTE_MIDI[step.note];
    if (midi == null) return 0;
    let semitones = step.baseOctave + tune();
    if (step.octave === 'D') semitones -= 12;
    if (step.octave === 'U') semitones += 12;
    return 440 * Math.pow(2, ((midi + semitones) - 69) / 12);
  }

  function nearest(hz){
    if (!hz || hz < 20) return '--';
    const midi = Math.round(69 + 12 * Math.log2(hz / 440));
    const name = NOTE_NAMES[(midi % 12 + 12) % 12];
    return `${name}${Math.floor(midi / 12) - 1}`;
  }

  function currentPitch(index){
    const current = readStep(index);
    if (!playable(current)) return 0;
    const target = frequencyFor(current);
    if (!target) return 0;

    const prevIndex = (index + 15) % 16;
    const prev = readStep(prevIndex);
    const from = frequencyFor(prev);
    const elapsed = Math.max(0, (performance.now() - stepStartedAt) / 1000);

    // The unified 303 engine glides at the beginning of the destination step
    // when the previous step carries S. Mirror that exact exponential motion.
    if (from && playable(prev) && prev.expr.includes('S')) {
      const stepDur = (60 / bpm()) / 4;
      const glide = clamp(stepDur * .52, .04, .085);
      if (elapsed < glide) {
        const p = clamp(elapsed / glide, 0, 1);
        return from * Math.pow(target / from, p);
      }
    }
    return target;
  }

  function mount(){
    const old = $('#fxScope');
    if (!old) return false;
    old.style.setProperty('display','none','important');

    let existing = $('#bassOnlyScope');
    if (existing && existing.tagName !== 'CANVAS') {
      existing.remove();
      existing = null;
    }
    if (!existing) {
      existing = document.createElement('canvas');
      existing.id = 'bassOnlyScope';
      existing.className = 'bass-only-scope';
      existing.setAttribute('aria-label','303 oscillator scope');
      old.insertAdjacentElement('afterend', existing);
    }
    canvas = existing;
    g = canvas.getContext('2d');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '46px';
    canvas.style.border = '1px solid #27272c';
    canvas.style.borderRadius = '6px';
    canvas.style.background = '#070809';
    return true;
  }

  function size(){
    if (!canvas || !g) return null;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return {w,h};
  }

  function drawGrid(w,h){
    g.clearRect(0,0,w,h);
    g.fillStyle = '#070809';
    g.fillRect(0,0,w,h);
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(221,255,55,.07)';
    for (let i=1;i<8;i++) {
      const x = w * i / 8;
      g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke();
    }
    for (let i=1;i<3;i++) {
      const y = h * i / 3;
      g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke();
    }
    g.strokeStyle = 'rgba(221,255,55,.18)';
    g.beginPath(); g.moveTo(0,h/2); g.lineTo(w,h/2); g.stroke();
  }

  function drawOscillator(w,h,hz,type){
    // Fixed 18 ms window gives a stable oscilloscope-like picture instead of
    // changing the visual scale arbitrarily with pitch.
    const windowSeconds = .018;
    const cycles = Math.max(.6, hz * windowSeconds);
    g.strokeStyle = '#ddff37';
    g.lineWidth = Math.max(1.35, w / 620);
    g.beginPath();
    for (let x=0; x<w; x++) {
      const phase = (x / Math.max(1,w-1)) * cycles;
      const frac = phase - Math.floor(phase);
      let normalized;
      if (type === 'square') normalized = frac < .5 ? -1 : 1;
      else normalized = frac * 2 - 1;
      const y = h/2 - normalized * h * .27;
      if (x === 0) g.moveTo(x,y); else g.lineTo(x,y);
    }
    g.stroke();
  }

  function drawSpectrum(w,h,hz,type){
    const maxHz = 6000;
    const maxHarmonic = type === 'square' ? 31 : 24;
    for (let n=1; n<=maxHarmonic; n++) {
      if (type === 'square' && n % 2 === 0) continue;
      const f = hz * n;
      if (f > maxHz) break;
      const amp = 1 / n;
      const x = Math.log(1 + 8 * f / maxHz) / Math.log(9) * w;
      const barH = Math.max(1.5, amp * h * .82);
      g.globalAlpha = clamp(.28 + amp * .8, .28, 1);
      g.fillStyle = '#ddff37';
      g.fillRect(Math.max(0,x-1.5), h-barH, Math.max(2,w/260), barH);
    }
    g.globalAlpha = 1;
  }

  function setReadout(note,hz){
    lastReadout = {note,hz};
    const noteEl = $('#fxNote');
    const hzEl = $('#fxHz');
    if (noteEl && noteEl.textContent !== note) noteEl.textContent = note;
    if (hzEl && hzEl.textContent !== hz) hzEl.textContent = hz;
  }

  function protectReadout(){
    ['#fxNote','#fxHz'].forEach(selector => {
      const el = $(selector);
      if (!el || el.dataset.scopeV2Protected) return;
      el.dataset.scopeV2Protected = '1';
      new MutationObserver(() => {
        const expected = selector === '#fxNote' ? lastReadout.note : lastReadout.hz;
        if (el.textContent !== expected) el.textContent = expected;
      }).observe(el,{childList:true,characterData:true,subtree:true});
    });
  }

  function render(){
    requestAnimationFrame(render);
    if (!mount()) return;
    protectReadout();
    const s = size();
    if (!s) return;
    drawGrid(s.w,s.h);

    const engine = unified();
    if (!engine || engine.state !== 'playing' || !engine.bassOn) {
      lastStep = -1;
      setReadout('--','-- Hz');
      return;
    }

    const index = activeStep();
    if (index !== lastStep) {
      lastStep = index;
      stepStartedAt = performance.now();
    }
    if (index < 0) {
      setReadout('--','-- Hz');
      return;
    }

    const hz = currentPitch(index);
    if (!hz) {
      setReadout('--','-- Hz');
      return;
    }

    const type = wave();
    setReadout(nearest(hz), `${Math.round(hz)} Hz`);
    if (mode === 'spectrum') drawSpectrum(s.w,s.h,hz,type);
    else drawOscillator(s.w,s.h,hz,type);
  }

  document.addEventListener('click', event => {
    const tab = event.target.closest?.('.analyzer-tab');
    if (!tab) return;
    mode = tab.dataset.mode === 'spectrum' ? 'spectrum' : 'scope';
    $$('.analyzer-tab').forEach(b => b.classList.toggle('active', b === tab));
  }, true);

  const settle = () => [0,80,220,600,1200].forEach(ms => setTimeout(() => { mount(); protectReadout(); }, ms));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, {once:true});
  else settle();
  window.addEventListener('load', settle, {once:true});
  requestAnimationFrame(render);

  window.__303boxBassScope = { version:'1500', get mode(){ return mode; } };
})();