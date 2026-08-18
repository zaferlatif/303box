(() => {
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  let applying = false;
  let queued = false;

  const KNOB_ORDER = ['tune','cutoff','resonance','envMod','decay','accent','delay','distortion','reverb'];
  const CONTROL_SELECTOR = '#knobGrid,#randomPatchButton,#generateButton,#playButton,#downloadButton,#clearButton,#drumRandom,#drumPlay,#drumDownload,#drumClear,.pattern-action-grid,.drum-actions,.tempo-module';

  function sequenceIsCorrect(parent, nodes) {
    if (!parent || nodes.some(node => !node || node.parentElement !== parent)) return false;
    const children = [...parent.children];
    let last = -1;
    for (const node of nodes) {
      const index = children.indexOf(node);
      if (index < 0 || index <= last) return false;
      last = index;
    }
    return true;
  }

  function moveRandomPatch() {
    const button = $('#randomPatchButton');
    const tempo = $('#patternSheet .tempo-module');
    if (!button || !tempo) return false;

    const cluster = tempo.querySelector('.tempo-cluster');
    let changed = false;
    if (button.parentElement !== tempo) {
      tempo.appendChild(button);
      changed = true;
    }
    if (!button.classList.contains('tempo-random-patch')) button.classList.add('tempo-random-patch');
    if (cluster && button.previousElementSibling !== cluster) {
      cluster.insertAdjacentElement('afterend', button);
      changed = true;
    }
    return changed;
  }

  function normalizeKnobs() {
    const grid = $('#knobGrid');
    if (!grid) return false;

    const knobs = [];
    KNOB_ORDER.forEach((id, index) => {
      const control = grid.querySelector(`[data-knob-id="${id}"]`);
      const knob = control?.closest('.knob');
      if (!knob) return;
      const wanted = String(index + 1);
      if (knob.dataset.knobOrder !== wanted) knob.dataset.knobOrder = wanted;
      knobs.push(knob);
    });

    // Crucial: do NOT append already ordered controls. Reparenting a knob while
    // pointer capture is active cancels dragging and can also suppress clicks.
    if (knobs.length && !sequenceIsCorrect(grid, knobs)) {
      knobs.forEach(knob => grid.appendChild(knob));
      return true;
    }
    return false;
  }

  function normalizeActions() {
    let changed = false;

    const pattern = $('.pattern-actions');
    const patternGrid = pattern?.querySelector('.pattern-action-grid, .toolbar-group');
    const patternButtons = ['#generateButton','#playButton','#downloadButton','#clearButton'].map(id => $(id));
    if (patternGrid && patternButtons.every(Boolean) && !sequenceIsCorrect(patternGrid, patternButtons)) {
      patternButtons.forEach(el => patternGrid.appendChild(el));
      changed = true;
    }

    const drumGrid = $('#drums .drum-actions');
    const drumButtons = ['#drumRandom','#drumPlay','#drumDownload','#drumClear'].map(id => $(id));
    if (drumGrid && drumButtons.every(Boolean) && !sequenceIsCorrect(drumGrid, drumButtons)) {
      drumButtons.forEach(el => drumGrid.appendChild(el));
      changed = true;
    }
    return changed;
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
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  function isRelevantMutation(mutation) {
    const target = mutation.target?.nodeType === 1 ? mutation.target : mutation.target?.parentElement;
    if (target?.matches?.('#knobGrid,.pattern-action-grid,.toolbar-group,.drum-actions,.tempo-module')) return true;

    // Text/value rendering inside a knob must never trigger layout work.
    if (target?.closest?.('.knob-value,.seven-segment,#scopeCanvas,#fftCanvas,.midi-compact')) return false;

    return [...mutation.addedNodes, ...mutation.removedNodes].some(node => {
      if (node.nodeType !== 1) return false;
      return node.matches?.(CONTROL_SELECTOR) || !!node.querySelector?.(CONTROL_SELECTOR);
    });
  }

  function settle() {
    [0,80,220,520,1100].forEach(ms => setTimeout(apply, ms));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, {once:true});
  else settle();
  window.addEventListener('load', settle, {once:true});

  new MutationObserver(mutations => {
    if (mutations.some(isRelevantMutation)) queue();
  }).observe(document.documentElement, {childList:true, subtree:true});

  window.__303boxWorkstationLayout = {version:'1540', apply};
})();