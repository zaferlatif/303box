(() => {
  'use strict';

  const lang = () => document.documentElement.lang === 'tr' ? 'tr' : 'en';
  const STORAGE_KEY = '303box-shortcuts-dismissed-v1';
  const RHYTHM_STORE = '303box-rhythm-v6';
  const RHYTHM_VOICE_STORE = '303box-rhythm-exact-voices-v1';
  const DEFAULT_DRUM_LEVEL = 80;
  const TUNE_STORE = '303box-tune-semitones-v1';
  const REFERENCE_MIGRATION = '303box-reference-default-v1';

  const bootSessionRaw = localStorage.getItem('303box-session') || localStorage.getItem('303-session');
  let shouldSeedReference = false;
  if (!localStorage.getItem(REFERENCE_MIGRATION)) {
    if (!bootSessionRaw) {
      shouldSeedReference = true;
    } else {
      try {
        const boot = JSON.parse(bootSessionRaw);
        const title = String(boot?.title || '').trim();
        const author = String(boot?.author || '').trim();
        const stockTitles = ['', 'Acid Pattern', 'Acid Tracks'];
        const stockAuthors = ['', 'Z3Z', 'DJ Pierre'];
        shouldSeedReference = stockTitles.includes(title) && stockAuthors.includes(author);
      } catch (_) {
        shouldSeedReference = true;
      }
    }
  }

  let tuneSemitones = Number(localStorage.getItem(TUNE_STORE));
  if (!Number.isFinite(tuneSemitones)) tuneSemitones = shouldSeedReference ? 1 : 0;
  tuneSemitones = Math.max(-12, Math.min(12, Math.round(tuneSemitones)));

  const COPY = {
    en: {
      generate: 'GENERATE', play: 'PLAY', stop: 'STOP', wait: 'WAIT', download: 'DOWNLOAD', clear: 'CLEAR',
      shortcuts: 'Shortcuts', title: 'Keyboard shortcuts',
      intro: 'Fast controls for the sequencer. Browser shortcuts such as Ctrl/Cmd + R are never overridden.',
      space: 'Play / stop 303', shiftSpace: 'Play / stop rhythm', g: 'Generate 303 + rhythm + BPM', question: 'Show shortcuts', esc: 'Close this panel',
      close: 'Got it', tune: 'TUNE'
    },
    tr: {
      generate: 'ÜRET', play: 'ÇAL', stop: 'DUR', wait: 'BEKLE', download: 'İNDİR', clear: 'TEMİZLE',
      shortcuts: 'Kısayollar', title: 'Klavye kısayolları',
      intro: 'Sequencer için hızlı kontroller. Ctrl/Cmd + R gibi tarayıcı kısayollarına dokunulmaz.',
      space: '303 çal / durdur', shiftSpace: 'Ritmi çal / durdur', g: '303 + ritim + BPM üret', question: 'Kısayolları göster', esc: 'Bu paneli kapat',
      close: 'Tamam', tune: 'TUNE'
    }
  };
  const t = key => COPY[lang()][key] || COPY.en[key] || key;

  const DRUM_LABELS = {
    bd: { code: 'BD-909', name: { en: 'Bass Drum', tr: 'Bas Davul' }, value: '909bd' },
    sd: { code: 'SD-606', name: { en: 'Snare Drum', tr: 'Trampet' }, value: '606sd' },
    cp: { code: 'CP-808', name: { en: 'Hand Clap', tr: 'Clap' }, value: '808clap' },
    tm: { code: 'TM-808', name: { en: 'Low Tom', tr: 'Low Tom' }, value: '808lowTom' },
    ch: { code: 'CH-606', name: { en: 'Closed Hi-Hat', tr: 'Kapalı Hi-Hat' }, value: '606ch' },
    oh: { code: 'OH-606', name: { en: 'Open Hi-Hat', tr: 'Açık Hi-Hat' }, value: '606oh' }
  };

  /* Tune only the 303 AudioContext. Rhythm contexts are deliberately excluded. */
  (() => {
    const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
    if (!NativeAudioContext || NativeAudioContext.__303boxTuneWrapped) return;

    let pendingRole = null;
    document.addEventListener('click', e => {
      if (e.target.closest?.('#playButton')) pendingRole = 'bass';
      else if (e.target.closest?.('#drumPlay')) pendingRole = 'drums';
      if (pendingRole) setTimeout(() => { pendingRole = null; }, 180);
    }, true);

    const WrappedAudioContext = new Proxy(NativeAudioContext, {
      construct(target, args) {
        const ctx = Reflect.construct(target, args, target);
        const isBass = pendingRole === 'bass';
        pendingRole = null;
        if (isBass) {
          const nativeCreateOscillator = ctx.createOscillator.bind(ctx);
          ctx.createOscillator = function() {
            const osc = nativeCreateOscillator();
            try { osc.detune.setValueAtTime(tuneSemitones * 100, ctx.currentTime); } catch (_) {}
            return osc;
          };
        }
        return ctx;
      }
    });
    WrappedAudioContext.__303boxTuneWrapped = true;
    try { WrappedAudioContext.prototype = NativeAudioContext.prototype; } catch (_) {}
    window.AudioContext = WrappedAudioContext;
    if (window.webkitAudioContext === NativeAudioContext) window.webkitAudioContext = WrappedAudioContext;
  })();

  function sanitizeStoredRhythm() {
    try {
      const raw = localStorage.getItem(RHYTHM_STORE);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          delete data.levels;
          delete data.variants;
          localStorage.setItem(RHYTHM_STORE, JSON.stringify(data));
        }
      }
      localStorage.removeItem(RHYTHM_VOICE_STORE);
    } catch (_) {}
  }

  function resetDrumChannelLevels() {
    document.querySelectorAll('#drums [data-level]').forEach(input => {
      input.value = String(DEFAULT_DRUM_LEVEL);
      const label = input.closest('label');
      const out = label?.querySelector('b, output, [data-level-value]');
      if (out) out.textContent = `${DEFAULT_DRUM_LEVEL}%`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    setTimeout(sanitizeStoredRhythm, 0);
  }

  function normalizeDrumVoices() {
    const drums = document.querySelector('#drums');
    if (!drums) return;

    Object.entries(DRUM_LABELS).forEach(([id, spec]) => {
      const select = drums.querySelector(`[data-variant="${id}"]`);
      if (select) {
        select.value = spec.value;
        const voiceLabel = select.closest('label');
        if (voiceLabel) voiceLabel.classList.add('voice-selector-hidden');
      }

      const preview = drums.querySelector(`[data-preview="${id}"]`);
      if (preview) {
        preview.classList.add('drum-voice-id');
        const strong = preview.querySelector('b');
        const small = preview.querySelector('span');
        if (strong) strong.textContent = spec.code;
        if (small) small.textContent = spec.name[lang()] || spec.name.en;
      }
    });

    drums.querySelectorAll('.drum-voice').forEach(row => row.classList.add('drum-voice-compact'));
    sanitizeStoredRhythm();
  }

  function arrange303() {
    const workspace = document.querySelector('.workspace.shell');
    const shellWrap = workspace?.querySelector('.sheet-scroll');
    const sheet = document.querySelector('#patternSheet');
    const toolbar = document.querySelector('.sheet-toolbar') || document.querySelector('.workspace-toolbar');
    if (!workspace || !shellWrap || !sheet || !toolbar) return false;

    const workbench = workspace.querySelector('.pattern-workbench');
    if (workbench && workbench.contains(shellWrap)) {
      workbench.parentNode.insertBefore(shellWrap, workbench);
      workbench.remove();
    }
    const oldPanel = workspace.querySelector('.pattern-sheet-panel');
    if (oldPanel && oldPanel !== shellWrap && oldPanel.contains(shellWrap)) {
      oldPanel.parentNode.insertBefore(shellWrap, oldPanel);
      oldPanel.remove();
    }

    shellWrap.className = 'sheet-scroll pattern-card-wrap';

    let controls = workspace.querySelector('.pattern-control-panel');
    if (!controls) {
      controls = document.createElement('section');
      controls.className = 'pattern-control-panel';
      controls.setAttribute('data-html2canvas-ignore', 'true');
      shellWrap.insertAdjacentElement('afterend', controls);
    }

    toolbar.classList.add('pattern-actions');
    let group = toolbar.querySelector('.toolbar-group');
    if (!group) {
      group = document.createElement('div');
      group.className = 'toolbar-group';
      toolbar.appendChild(group);
    }
    group.classList.add('pattern-action-grid');
    ['generateButton', 'playButton', 'downloadButton', 'clearButton'].forEach(id => {
      const button = document.getElementById(id);
      if (button) group.appendChild(button);
    });

    controls.appendChild(toolbar);
    const liveIo = document.querySelector('.sheet-io');
    if (liveIo) controls.appendChild(liveIo);
    if (controls.firstElementChild !== toolbar) controls.prepend(toolbar);
    if (liveIo && toolbar.nextElementSibling !== liveIo) toolbar.insertAdjacentElement('afterend', liveIo);

    syncActionLabels();
    installActionObservers();
    installFooterShortcutLink();
    normalizeDrumVoices();
    mountTuneKnob();
    return true;
  }

  function setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  function syncActionLabels() {
    setText(document.querySelector('#generateButton span'), t('generate'));
    setText(document.querySelector('#downloadButton span'), t('download'));
    setText(document.querySelector('#clearButton'), t('clear'));

    const bass = document.querySelector('#playButton');
    const bassLabel = document.querySelector('#playLabel');
    if (bass && bassLabel) setText(bassLabel, bass.getAttribute('aria-pressed') === 'true' ? t('stop') : t('play'));

    setText(document.querySelector('#drumRandom'), t('generate'));
    setText(document.querySelector('#drumDownload'), t('download'));
    setText(document.querySelector('#drumClear'), t('clear'));
    const drum = document.querySelector('#drumPlay');
    const drumLabel = drum?.querySelector('span');
    if (drum && drumLabel) {
      setText(drumLabel, drum.classList.contains('armed') ? t('wait') : (drum.classList.contains('playing') ? t('stop') : t('play')));
    }
    setText(document.querySelector('#tuneKnobWrap .knob-title'), t('tune'));
  }

  let observersInstalled = false;
  function installActionObservers() {
    if (observersInstalled) return;
    const bass = document.querySelector('#playButton');
    const drum = document.querySelector('#drumPlay');
    if (!bass && !drum) return;
    observersInstalled = true;
    if (bass) new MutationObserver(syncActionLabels).observe(bass, {attributes:true, attributeFilter:['aria-pressed']});
    if (drum) new MutationObserver(syncActionLabels).observe(drum, {attributes:true, attributeFilter:['class']});
  }

  function tuneDialSvg() {
    const ticks = Array.from({length: 11}, (_, i) => {
      const angle = -135 + i * 27;
      return `<line class="dial-tick${i === 0 || i === 5 || i === 10 ? ' major' : ''}" x1="50" y1="5" x2="50" y2="11" transform="rotate(${angle} 50 50)"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="knobFace-tune" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#333338"/><stop offset="1" stop-color="#111113"/></linearGradient></defs>${ticks}<circle class="dial-bezel" cx="50" cy="50" r="34"/><circle fill="url(#knobFace-tune)" stroke="#151517" stroke-width="2" cx="50" cy="50" r="29"/><circle class="dial-center" cx="50" cy="50" r="5"/><g class="pointer-group"><line class="dial-pointer" x1="50" y1="50" x2="50" y2="23"/></g></svg>`;
  }

  function renderTuneKnob() {
    const control = document.querySelector('#tuneKnobControl');
    const value = document.querySelector('#tuneKnobValue');
    if (!control) return;
    const angle = -135 + ((tuneSemitones + 12) / 24) * 270;
    control.querySelector('.pointer-group')?.setAttribute('transform', `rotate(${angle} 50 50)`);
    control.setAttribute('aria-valuenow', String(tuneSemitones));
    if (value) value.textContent = `${tuneSemitones > 0 ? '+' : ''}${tuneSemitones} ST`;
  }

  function setTune(value) {
    tuneSemitones = Math.max(-12, Math.min(12, Math.round(value)));
    localStorage.setItem(TUNE_STORE, String(tuneSemitones));
    renderTuneKnob();
  }

  function mountTuneKnob() {
    const grid = document.querySelector('#knobGrid');
    if (!grid) return false;
    if (document.querySelector('#tuneKnobWrap')) {
      renderTuneKnob();
      return true;
    }

    const wrap = document.createElement('div');
    wrap.className = 'knob tune-knob';
    wrap.id = 'tuneKnobWrap';
    wrap.innerHTML = `<span class="knob-title">${t('tune')}</span><button type="button" class="knob-control" id="tuneKnobControl" role="slider" aria-label="Tune" aria-valuemin="-12" aria-valuemax="12">${tuneDialSvg()}</button><span class="knob-value" id="tuneKnobValue"></span>`;
    grid.prepend(wrap);

    const control = wrap.querySelector('#tuneKnobControl');
    let active = false;
    let startY = 0;
    let startValue = tuneSemitones;
    control.addEventListener('pointerdown', e => {
      active = true; startY = e.clientY; startValue = tuneSemitones;
      try { control.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    control.addEventListener('pointermove', e => {
      if (!active) return;
      setTune(startValue + (startY - e.clientY) * .08);
    });
    const finish = e => {
      if (!active) return;
      active = false;
      try { control.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    control.addEventListener('pointerup', finish);
    control.addEventListener('pointercancel', finish);
    control.addEventListener('wheel', e => { e.preventDefault(); setTune(tuneSemitones + (e.deltaY < 0 ? 1 : -1)); }, {passive:false});
    control.addEventListener('keydown', e => {
      if (!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home') setTune(-12);
      else if (e.key === 'End') setTune(12);
      else setTune(tuneSemitones + (['ArrowUp','ArrowRight'].includes(e.key) ? 1 : -1));
    });
    control.addEventListener('dblclick', () => setTune(0));
    renderTuneKnob();
    return true;
  }

  function editableTarget(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    return ['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(el.tagName);
  }

  function openShortcuts({automatic=false} = {}) {
    let overlay = document.querySelector('#shortcutOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'shortcutOverlay';
      overlay.className = 'shortcut-overlay';
      overlay.innerHTML = `
        <section class="shortcut-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcutTitle">
          <div class="shortcut-head"><div><span>303box / KEYS</span><h2 id="shortcutTitle"></h2></div><button type="button" class="shortcut-x" id="shortcutX" aria-label="Close">×</button></div>
          <p class="shortcut-intro" id="shortcutIntro"></p>
          <div class="shortcut-list">
            <div><kbd>SPACE</kbd><span id="shortcutSpace"></span></div>
            <div><kbd>SHIFT</kbd><b>+</b><kbd>SPACE</kbd><span id="shortcutShiftSpace"></span></div>
            <div><kbd>G</kbd><span id="shortcutG"></span></div>
            <div><kbd>?</kbd><span id="shortcutQuestion"></span></div>
            <div><kbd>ESC</kbd><span id="shortcutEsc"></span></div>
          </div>
          <button type="button" class="shortcut-done" id="shortcutDone"></button>
        </section>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) closeShortcuts(true); });
      overlay.querySelector('#shortcutX')?.addEventListener('click', () => closeShortcuts(true));
      overlay.querySelector('#shortcutDone')?.addEventListener('click', () => closeShortcuts(true));
    }

    setText(overlay.querySelector('#shortcutTitle'), t('title'));
    setText(overlay.querySelector('#shortcutIntro'), t('intro'));
    setText(overlay.querySelector('#shortcutSpace'), t('space'));
    setText(overlay.querySelector('#shortcutShiftSpace'), t('shiftSpace'));
    setText(overlay.querySelector('#shortcutG'), t('g'));
    setText(overlay.querySelector('#shortcutQuestion'), t('question'));
    setText(overlay.querySelector('#shortcutEsc'), t('esc'));
    setText(overlay.querySelector('#shortcutDone'), t('close'));
    overlay.dataset.automatic = automatic ? 'true' : 'false';
    overlay.classList.add('open');
    document.body.classList.add('shortcuts-open');
    setTimeout(() => overlay.querySelector('#shortcutDone')?.focus(), 20);
  }

  function closeShortcuts(remember=true) {
    const overlay = document.querySelector('#shortcutOverlay');
    if (!overlay?.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.body.classList.remove('shortcuts-open');
    if (remember) localStorage.setItem(STORAGE_KEY, '1');
  }

  function installFooterShortcutLink() {
    const links = document.querySelector('.footer-links');
    if (!links || links.querySelector('[data-shortcuts-link]')) return;
    const a = document.createElement('a');
    a.href = '#shortcuts';
    a.dataset.shortcutsLink = 'true';
    a.textContent = t('shortcuts');
    a.addEventListener('click', e => { e.preventDefault(); openShortcuts(); });
    links.prepend(a);
  }

  function setTempo(value) {
    const input = document.querySelector('#tempoInput');
    const form = document.querySelector('#tempoForm');
    const submit = document.querySelector('#tempoApply');
    if (!input || !form || !submit) return;
    input.value = String(value);
    form.dispatchEvent(new SubmitEvent('submit', { bubbles:true, cancelable:true, submitter:submit }));
  }

  function seedReferencePattern() {
    if (!shouldSeedReference) {
      localStorage.setItem(REFERENCE_MIGRATION, '1');
      return;
    }
    const notes = ['G','G','G','G','A#','A#','A#','A#','A#','A#','A#','A#','A#','A#','A#','A#'];
    const octaves = ['','','D','','','D','D','','D','','','','','','',''];
    const accents = ['A','','','','','','','','','','','','','','',''];
    const gates = ['●','○','○','●','-','●','●','-','●','-','●','○','●','●','-','●'];
    const noteInputs = [...document.querySelectorAll('.note-input')];
    const octaveCells = [...document.querySelectorAll('.octave-cell')];
    const accentCells = [...document.querySelectorAll('.accentSlide-cell')];
    const gateCells = [...document.querySelectorAll('.gate-cell')];
    if (noteInputs.length !== 16 || octaveCells.length !== 16 || accentCells.length !== 16 || gateCells.length !== 16) return;

    notes.forEach((note, i) => {
      noteInputs[i].value = note;
      octaveCells[i].textContent = octaves[i];
      accentCells[i].textContent = accents[i];
      gateCells[i].textContent = gates[i];
      const picker = document.querySelector(`[data-note-picker="${i}"]`);
      if (picker) picker.value = note;
    });

    const author = document.querySelector('#authorInput');
    const title = document.querySelector('#titleInput');
    if (author) author.value = 'New Order / The Pump Panel';
    if (title) title.value = 'Confusion / Blade Theme';
    document.querySelector('#waveSquare')?.click();
    setTempo(133);
    setTune(1);
    author?.dispatchEvent(new Event('input', { bubbles:true }));
    localStorage.setItem(REFERENCE_MIGRATION, '1');
    shouldSeedReference = false;
  }

  // Capture before legacy document handlers. Browser shortcuts keep their native defaults.
  window.addEventListener('keydown', e => {
    const key = (e.key || '').toLowerCase();

    if (key === 'r') {
      e.stopImmediatePropagation();
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      return;
    }

    if (e.key === 'Escape' && document.querySelector('#shortcutOverlay.open')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeShortcuts(true);
      return;
    }

    if (editableTarget(e.target) || editableTarget(document.activeElement)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.code === 'Space') {
      e.preventDefault();
      e.stopImmediatePropagation();
      const target = e.shiftKey ? document.querySelector('#drumPlay') : document.querySelector('#playButton');
      target?.click();
      return;
    }

    if (key === 'g') {
      e.preventDefault();
      e.stopImmediatePropagation();
      document.querySelector('#generateButton')?.click();
      return;
    }

    if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openShortcuts();
    }
  }, true);

  document.addEventListener('click', e => {
    if (e.target.closest('#drumRandom, #generateButton')) {
      setTimeout(resetDrumChannelLevels, 0);
    }
    if (e.target.closest('#drums')) {
      setTimeout(normalizeDrumVoices, 1);
    }
  }, true);

  document.addEventListener('input', e => {
    if (e.target.matches?.('#drums [data-level]')) setTimeout(sanitizeStoredRhythm, 0);
  }, true);
  window.addEventListener('pagehide', sanitizeStoredRhythm);

  function settle() {
    sanitizeStoredRhythm();
    [0, 30, 90, 180, 360, 700, 1300].forEach(ms => setTimeout(() => {
      arrange303();
      syncActionLabels();
      installFooterShortcutLink();
      normalizeDrumVoices();
      mountTuneKnob();
    }, ms));

    setTimeout(() => {
      seedReferencePattern();
      resetDrumChannelLevels();
      normalizeDrumVoices();
      mountTuneKnob();
      if (!localStorage.getItem(STORAGE_KEY)) openShortcuts({automatic:true});
    }, 900);
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
