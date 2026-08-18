(() => {
  'use strict';

  const lang = () => document.documentElement.lang === 'tr' ? 'tr' : 'en';
  const STORAGE_KEY = '303box-shortcuts-dismissed-v1';

  const COPY = {
    en: {
      generate: 'GENERATE', play: 'PLAY', stop: 'STOP', wait: 'WAIT', download: 'DOWNLOAD', clear: 'CLEAR',
      shortcuts: 'Shortcuts', title: 'Keyboard shortcuts',
      intro: 'Fast controls for the sequencer. Browser shortcuts such as Ctrl/Cmd + R are never overridden.',
      space: 'Play / stop 303', shiftSpace: 'Play / stop rhythm', g: 'Generate 303 + rhythm + BPM', question: 'Show shortcuts', esc: 'Close this panel',
      close: 'Got it'
    },
    tr: {
      generate: 'ÜRET', play: 'ÇAL', stop: 'DUR', wait: 'BEKLE', download: 'İNDİR', clear: 'TEMİZLE',
      shortcuts: 'Kısayollar', title: 'Klavye kısayolları',
      intro: 'Sequencer için hızlı kontroller. Ctrl/Cmd + R gibi tarayıcı kısayollarına dokunulmaz.',
      space: '303 çal / durdur', shiftSpace: 'Ritmi çal / durdur', g: '303 + ritim + BPM üret', question: 'Kısayolları göster', esc: 'Bu paneli kapat',
      close: 'Tamam'
    }
  };
  const t = key => COPY[lang()][key] || COPY.en[key] || key;

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

  // Capture before legacy document handlers. Browser shortcuts keep their native defaults.
  window.addEventListener('keydown', e => {
    const key = (e.key || '').toLowerCase();

    // Neutralize the old R handlers without blocking browser refresh.
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

  function settle() {
    [0, 30, 90, 180, 360, 700, 1300].forEach(ms => setTimeout(() => {
      arrange303();
      syncActionLabels();
      installFooterShortcutLink();
    }, ms));

    setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) openShortcuts({automatic:true});
    }, 900);
  }

  window.addEventListener('DOMContentLoaded', settle);
  window.addEventListener('load', settle);
})();
