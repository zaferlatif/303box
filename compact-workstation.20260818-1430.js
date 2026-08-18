(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => Math.round(a + Math.random() * (b - a));
  let ordering = false;
  let observedPanel = null;

  function isTR() { return document.documentElement.lang === 'tr'; }

  function enforceControlOrder() {
    const panel = $('.pattern-control-panel');
    const io = panel?.querySelector('.sheet-io');
    const actions = panel?.querySelector('.pattern-actions');
    if (!panel || !io || !actions || ordering) return false;

    if (panel.firstElementChild !== io || io.nextElementSibling !== actions) {
      ordering = true;
      panel.prepend(io);
      io.insertAdjacentElement('afterend', actions);
      ordering = false;
    }

    if (observedPanel !== panel) {
      observedPanel = panel;
      const observer = new MutationObserver(() => {
        if (!ordering) enforceControlOrder();
      });
      observer.observe(panel, { childList:true });
    }
    return true;
  }

  function patchButtonLabel(button) {
    if (!button) return;
    button.textContent = isTR() ? 'RASTGELE PATCH' : 'RANDOM PATCH';
    button.setAttribute('aria-label', isTR()
      ? '303 synth düğmelerini rastgele ayarla'
      : 'Randomize 303 synth knobs');
  }

  function mountPatchRandom() {
    const grid = $('#knobGrid');
    if (!grid) return false;
    let button = $('#randomPatchButton');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'randomPatchButton';
      button.className = 'random-patch-button';
      grid.prepend(button);
      button.addEventListener('click', randomizePatch);
    }
    patchButtonLabel(button);
    return true;
  }

  function fireKey(control, key) {
    control.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      bubbles:true,
      cancelable:true
    }));
  }

  // Use the knobs' own keyboard handlers so the original state, visual pointer,
  // persistence and the shared audio engine all receive the exact same value.
  function setKnobThroughUi(id, value) {
    const control = $(`[data-knob-id="${id}"]`);
    if (!control) return;
    const target = clamp(Math.round(value), 0, 100);
    if (target <= 50) {
      fireKey(control, 'Home');
      for (let i = 0; i < target; i++) fireKey(control, 'ArrowRight');
    } else {
      fireKey(control, 'End');
      for (let i = 100; i > target; i--) fireKey(control, 'ArrowLeft');
    }
  }

  function randomizePatch() {
    const profile = Math.random();
    const values = profile < .34 ? {
      cutoff: rand(12, 38), resonance: rand(78, 100), envMod: rand(58, 96),
      decay: rand(24, 58), accent: rand(52, 92), delay: rand(0, 22), distortion: rand(4, 28)
    } : profile < .68 ? {
      cutoff: rand(28, 58), resonance: rand(68, 94), envMod: rand(42, 82),
      decay: rand(35, 76), accent: rand(38, 78), delay: rand(8, 34), distortion: rand(8, 38)
    } : {
      cutoff: rand(42, 76), resonance: rand(72, 100), envMod: rand(66, 100),
      decay: rand(18, 54), accent: rand(64, 100), delay: rand(0, 28), distortion: rand(18, 52)
    };

    // Keep ambience optional instead of making every generated patch wet.
    if (Math.random() < .34) values.delay = 0;
    if (Math.random() < .22) values.distortion = 0;

    Object.entries(values).forEach(([id, value]) => setKnobThroughUi(id, value));
    window.dispatchEvent(new CustomEvent('303box:patch-randomized', { detail:values }));
  }

  function updateLanguage() {
    patchButtonLabel($('#randomPatchButton'));
  }

  function settle() {
    [0, 70, 180, 420, 850, 1500, 2400].forEach(ms => setTimeout(() => {
      enforceControlOrder();
      mountPatchRandom();
      updateLanguage();
    }, ms));
  }

  const langObserver = new MutationObserver(updateLanguage);
  langObserver.observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', settle, { once:true });
  } else settle();
  window.addEventListener('load', settle, { once:true });

  window.__303boxCompactWorkstation = {
    version:'1430',
    randomizePatch,
    enforceControlOrder
  };
})();
