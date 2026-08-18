(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const STORE = '303box-fx-controls-v1';

  let fx = { delay: 0, distortion: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (Number.isFinite(+saved.delay)) fx.delay = clamp(Math.round(+saved.delay), 0, 100);
    if (Number.isFinite(+saved.distortion)) fx.distortion = clamp(Math.round(+saved.distortion), 0, 100);
  } catch (_) {}

  function lang() { return document.documentElement.lang === 'tr' ? 'tr' : 'en'; }
  function label(id) {
    if (id === 'delay') return 'DELAY';
    return lang() === 'tr' ? 'DISTORTION' : 'DISTORTION';
  }

  function dialSvg(id) {
    const ticks = Array.from({length:11}, (_, i) => {
      const angle = -135 + i * 27;
      return `<line class="dial-tick${i === 0 || i === 5 || i === 10 ? ' major' : ''}" x1="50" y1="5" x2="50" y2="11" transform="rotate(${angle} 50 50)"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="knobFace-${id}-fx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#333338"/><stop offset="1" stop-color="#111113"/></linearGradient></defs>${ticks}<circle class="dial-bezel" cx="50" cy="50" r="34"/><circle fill="url(#knobFace-${id}-fx)" stroke="#151517" stroke-width="2" cx="50" cy="50" r="29"/><circle class="dial-center" cx="50" cy="50" r="5"/><g class="pointer-group"><line class="dial-pointer" x1="50" y1="50" x2="50" y2="23"/></g></svg>`;
  }

  function persist() {
    localStorage.setItem(STORE, JSON.stringify(fx));
  }

  function render(id) {
    const control = $(`[data-knob-id="${id}"]`);
    if (!control) return;
    const value = fx[id] || 0;
    const angle = -135 + value / 100 * 270;
    control.querySelector('.pointer-group')?.setAttribute('transform', `rotate(${angle} 50 50)`);
    control.setAttribute('aria-valuemin', '0');
    control.setAttribute('aria-valuemax', '100');
    control.setAttribute('aria-valuenow', String(value));
    const out = $(`[data-fx-value="${id}"]`);
    if (out) out.textContent = `${value}%`;
  }

  function setFx(id, value) {
    fx[id] = clamp(Math.round(value), 0, 100);
    persist();
    render(id);
    window.dispatchEvent(new CustomEvent('303box:fxchange', { detail:{...fx} }));
  }

  function makeKnob(id) {
    const wrap = document.createElement('div');
    wrap.className = `knob fx-knob fx-${id}`;
    wrap.dataset.fxKnob = id;
    wrap.innerHTML = `<span class="knob-title">${label(id)}</span><button type="button" class="knob-control" data-knob-id="${id}" role="slider" aria-label="${label(id)}">${dialSvg(id)}</button><span class="knob-value" data-fx-value="${id}"></span>`;
    const control = wrap.querySelector('.knob-control');
    let active = false, startY = 0, startValue = 0;
    control.addEventListener('pointerdown', e => {
      active = true; startY = e.clientY; startValue = fx[id];
      try { control.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    control.addEventListener('pointermove', e => {
      if (!active) return;
      setFx(id, startValue + (startY - e.clientY) * .55);
    });
    const finish = e => {
      if (!active) return;
      active = false;
      try { control.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    control.addEventListener('pointerup', finish);
    control.addEventListener('pointercancel', finish);
    control.addEventListener('wheel', e => { e.preventDefault(); setFx(id, fx[id] + (e.deltaY < 0 ? 2 : -2)); }, {passive:false});
    control.addEventListener('keydown', e => {
      if (!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home') setFx(id, 0);
      else if (e.key === 'End') setFx(id, 100);
      else setFx(id, fx[id] + (['ArrowUp','ArrowRight'].includes(e.key) ? 1 : -1));
    });
    control.addEventListener('dblclick', () => setFx(id, 0));
    return wrap;
  }

  function mountFxKnobs() {
    const grid = $('#knobGrid');
    if (!grid || !grid.querySelector('[data-knob-id="cutoff"]')) return false;
    ['delay','distortion'].forEach(id => {
      if (!grid.querySelector(`[data-fx-knob="${id}"]`)) grid.appendChild(makeKnob(id));
      render(id);
    });
    return true;
  }

  function patchRhythmInfo() {
    const drums = $('#drums');
    if (!drums) return false;
    const tr = lang() === 'tr';
    const intro = drums.querySelector('.drum-intro > p');
    if (intro) intro.textContent = tr
      ? '303 ile aynı BPM’de çalışan altı kanallı 16-step ritim makinesi: 909 bass drum, 606 snare ve hi-hat’ler, 808 clap ve low tom karakteri.'
      : 'A synchronized six-part 16-step rhythm machine: 909 bass drum, 606 snare and hi-hats, with 808 clap and low-tom character.';

    const dna = drums.querySelector('.drum-dna');
    if (!dna) return false;
    dna.innerHTML = tr ? `
      <div class="dna-title"><span>RHYTHM VOICE MAP</span><small>Her partın kaynak karakteri sabittir; arayüz gereksiz model seçimleriyle kalabalıklaşmaz.</small></div>
      <article><b>TR-909 BD</b><p>Bass drum sabittir; kısa, sert transient ve güçlü gövde groove’un temelini kurar.</p></article>
      <article><b>TR-606 SD / CH / OH</b><p>Snare ve iki hi-hat 606 karakterini kullanır.</p></article>
      <article><b>CLAP</b><p>TR-808 Clap karakteri; backbeat ve geçişlerde geniş bir vurgu sağlar.</p></article>
      <article><b>TOM</b><p>TR-808 Low Tom karakteri; fill ve ritmik cevaplar için kullanılır.</p></article>
      <article><b>SYNC / CLOCK</b><p>Ritim 303 ile ortak BPM’i paylaşır ve istenirse bir sonraki 1. step’te senkron başlar.</p></article>` : `
      <div class="dna-title"><span>RHYTHM VOICE MAP</span><small>Each part keeps its source character fixed, without unnecessary model switches in the interface.</small></div>
      <article><b>TR-909 BD</b><p>The bass drum is fixed: a tight transient and solid body anchor the groove.</p></article>
      <article><b>TR-606 SD / CH / OH</b><p>Snare and both hi-hats use the 606 character.</p></article>
      <article><b>CLAP</b><p>TR-808 Clap character gives the backbeat and transitions a wide accent.</p></article>
      <article><b>TOM</b><p>TR-808 Low Tom character is used for fills and rhythmic answers.</p></article>
      <article><b>SYNC / CLOCK</b><p>Rhythm shares the 303 BPM and can optionally start on the next step 1.</p></article>`;
    return true;
  }

  function settle() {
    [0,40,120,260,600,1200].forEach(ms => setTimeout(() => {
      mountFxKnobs();
      patchRhythmInfo();
    }, ms));
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();