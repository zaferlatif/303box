(() => {
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  let applying = false;
  let queued = false;

  const KNOB_ORDER = ['tune','cutoff','resonance','envMod','decay','accent','delay','distortion','reverb'];

  function moveRandomPatch() {
    const button = $('#randomPatchButton');
    const tempo = $('#patternSheet .tempo-module');
    if (!button || !tempo) return false;

    // ui-polish owns the LED + tempo-knob cluster. Random Patch belongs below
    // that cluster so it never competes with synth controls for grid space.
    const cluster = tempo.querySelector('.tempo-cluster');
    if (button.parentElement !== tempo) tempo.appendChild(button);
    button.classList.add('tempo-random-patch');
    if (cluster && button.previousElementSibling !== cluster) cluster.insertAdjacentElement('afterend', button);
    return true;
  }

  function normalizeKnobs() {
    const grid = $('#knobGrid');
    if (!grid) return false;
    KNOB_ORDER.forEach((id, index) => {
      const control = grid.querySelector(`[data-knob-id="${id}"]`);
      const knob = control?.closest('.knob');
      if (!knob) return;
      knob.dataset.knobOrder = String(index + 1);
      grid.appendChild(knob);
    });
    return true;
  }

  function normalizeActions() {
    const pattern = $('.pattern-actions');
    const patternGrid = pattern?.querySelector('.pattern-action-grid, .toolbar-group');
    const p = ['#generateButton','#playButton','#downloadButton','#clearButton'].map(id => $(id));
    if (patternGrid && p.every(Boolean)) p.forEach(el => patternGrid.appendChild(el));

    const drumGrid = $('#drums .drum-actions');
    const d = ['#drumRandom','#drumPlay','#drumDownload','#drumClear'].map(id => $(id));
    if (drumGrid && d.every(Boolean)) d.forEach(el => drumGrid.appendChild(el));
    return true;
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      moveRandomPatch();
      normalizeKnobs();
      normalizeActions();
    } finally {
      applying = false;
    }
  }

  function queue() {
    if (applying || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }

  function settle() {
    [0,60,160,360,760,1400,2400].forEach(ms => setTimeout(apply, ms));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, {once:true});
  else settle();
  window.addEventListener('load', settle, {once:true});

  new MutationObserver(queue).observe(document.documentElement, {childList:true, subtree:true});
  window.__303boxWorkstationLayout = {version:'1520', apply};
})();