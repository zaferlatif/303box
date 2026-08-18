(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => Math.round(a + Math.random() * (b - a));
  let ordering = false;
  let observerInstalled = false;
  let enforceQueued = false;

  function isTR() { return document.documentElement.lang === 'tr'; }

  function queueEnforce() {
    if (ordering || enforceQueued) return;
    enforceQueued = true;
    requestAnimationFrame(() => {
      enforceQueued = false;
      enforceControlOrder();
      unifyRhythmControls();
    });
  }

  function enforceControlOrder() {
    const workspace = $('.workspace.shell');
    const consoleEl = $('#acidConsole');
    const panel = $('.pattern-control-panel');
    const io = $('.sheet-io');
    const actions = $('.pattern-actions');
    if (!workspace || !consoleEl || !io || !actions || ordering) return false;

    ordering = true;
    try {
      if (io.parentElement !== consoleEl) consoleEl.appendChild(io);
      io.classList.add('acid-console-io');
      if (panel && actions.parentElement !== panel) panel.appendChild(actions);
    } finally {
      ordering = false;
    }

    if (!observerInstalled) {
      observerInstalled = true;
      const observer = new MutationObserver(queueEnforce);
      observer.observe(workspace, { childList:true, subtree:true });
    }
    return true;
  }

  function syncRhythmLed() {
    const play = $('#drumPlay');
    const led = play?.querySelector('.rhythm-status-led');
    if (!play || !led) return;
    led.classList.toggle('on', play.classList.contains('playing') || play.classList.contains('armed'));
  }

  function unifyRhythmControls() {
    const drums = $('#drums');
    const toolbar = drums?.querySelector('.drum-toolbar');
    const actions = drums?.querySelector('.drum-actions');
    if (!drums || !toolbar || !actions) return false;

    // Shared clock makes these historical controls redundant and confusing.
    drums.querySelectorAll('.drum-switch, .density').forEach(el => el.remove());
    const tools = drums.querySelector('.drum-tools');
    if (tools && !tools.children.length) tools.remove();

    const generate = $('#drumRandom');
    const play = $('#drumPlay');
    const download = $('#drumDownload');
    const clear = $('#drumClear');
    [generate, play, download, clear].forEach(button => {
      if (button && button.parentElement !== actions) actions.appendChild(button);
      button?.classList.add('rhythm-action-unified');
    });

    generate?.classList.add('tool-button-acid');
    play?.classList.add('tool-button-play');
    clear?.classList.add('tool-button-clear');

    if (play && !play.querySelector('.rhythm-status-led')) {
      const led = document.createElement('span');
      led.className = 'status-led rhythm-status-led';
      led.setAttribute('aria-hidden', 'true');
      play.appendChild(led);
      new MutationObserver(syncRhythmLed).observe(play, { attributes:true, attributeFilter:['class'] });
    }
    syncRhythmLed();
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
    control.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles:true, cancelable:true }));
  }

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
      cutoff: rand(12,38), resonance: rand(78,100), envMod: rand(58,96),
      decay: rand(24,58), accent: rand(52,92), delay: rand(0,22), distortion: rand(4,28)
    } : profile < .68 ? {
      cutoff: rand(28,58), resonance: rand(68,94), envMod: rand(42,82),
      decay: rand(35,76), accent: rand(38,78), delay: rand(8,34), distortion: rand(8,38)
    } : {
      cutoff: rand(42,76), resonance: rand(72,100), envMod: rand(66,100),
      decay: rand(18,54), accent: rand(64,100), delay: rand(0,28), distortion: rand(18,52)
    };

    if (Math.random() < .34) values.delay = 0;
    if (Math.random() < .22) values.distortion = 0;

    Object.entries(values).forEach(([id, value]) => setKnobThroughUi(id, value));
    window.dispatchEvent(new CustomEvent('303box:patch-randomized', { detail:values }));
  }

  function updateLanguage() {
    patchButtonLabel($('#randomPatchButton'));
    unifyRhythmControls();
  }

  function settle() {
    [0,70,180,420,850,1500,2400].forEach(ms => setTimeout(() => {
      enforceControlOrder();
      unifyRhythmControls();
      mountPatchRandom();
      updateLanguage();
    }, ms));
  }

  new MutationObserver(updateLanguage).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, { once:true });
  else settle();
  window.addEventListener('load', settle, { once:true });

  window.__303boxCompactWorkstation = {
    version:'1450',
    randomizePatch,
    enforceControlOrder,
    unifyRhythmControls
  };
})();