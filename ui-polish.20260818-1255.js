(() => {
  'use strict';

  const MIGRATION = '303box-acig-gnome-default-v2';

  function currentBpm() {
    const value = Number(document.querySelector('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'));
    return Number.isFinite(value) ? value : 120;
  }

  function setTempo(value) {
    const input = document.querySelector('#tempoInput');
    const form = document.querySelector('#tempoForm');
    const submit = document.querySelector('#tempoApply');
    if (!input || !form || !submit) return;
    input.value = String(Math.max(50, Math.min(250, Math.round(value))));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles:true, cancelable:true, submitter:submit }));
  }

  // Rhythm generation changes only rhythm. Keep the shared 303 tempo exactly as it was.
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#drumRandom')) return;
    const before = currentBpm();
    queueMicrotask(() => setTempo(before));
  }, true);

  function centerTempoCluster() {
    const module = document.querySelector('#patternSheet .tempo-module');
    const display = document.querySelector('#bpmDisplay');
    const knob = document.querySelector('#tempoKnob');
    if (!module || !display || !knob) return false;

    let cluster = module.querySelector('.tempo-cluster');
    if (!cluster) {
      cluster = document.createElement('div');
      cluster.className = 'tempo-cluster';
      display.insertAdjacentElement('beforebegin', cluster);
    }
    if (display.parentElement !== cluster) cluster.appendChild(display);
    if (knob.parentElement !== cluster) cluster.appendChild(knob);
    return true;
  }

  function setMeta(authorText, titleText) {
    const author = document.querySelector('#authorInput');
    const title = document.querySelector('#titleInput');
    if (author) {
      author.value = authorText;
      author.dispatchEvent(new Event('input', { bubbles:true }));
      author.dispatchEvent(new Event('change', { bubbles:true }));
    }
    if (title) {
      title.value = titleText;
      title.dispatchEvent(new Event('input', { bubbles:true }));
      title.dispatchEvent(new Event('change', { bubbles:true }));
    }
  }

  function migrateDefaultPattern() {
    if (localStorage.getItem(MIGRATION)) return;
    const author = document.querySelector('#authorInput');
    const title = document.querySelector('#titleInput');
    if (!author || !title) return;

    const a = author.value.trim();
    const t = title.value.trim();
    const isBladeDefault = a === 'New Order / The Pump Panel' || t === 'Confusion / Blade Theme';
    const isStockDefault = (a === 'Z3Z' || a === 'DJ Pierre' || a === '') && (t === 'Acid Pattern' || t === 'Acid Tracks' || t === 'Acid Gnome' || t === '');

    if (isBladeDefault || isStockDefault) {
      document.querySelector('#generateButton')?.click();
      setTimeout(() => setMeta('Z3Z', 'Acig Gnome'), 20);
    }
    localStorage.setItem(MIGRATION, '1');
    localStorage.setItem('303box-reference-default-v1', '1');
  }

  function settle() {
    [250, 650, 1100, 1500, 2200].forEach(ms => setTimeout(() => {
      centerTempoCluster();
      migrateDefaultPattern();
    }, ms));
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
