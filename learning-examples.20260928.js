(() => {
  'use strict';
  const BACKUP = '303box-learning-backup-v1';
  const SESSION = '303box-session';
  const notes = new Set(['', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);
  function pattern(pitches, accents = [], slides = [], up = [], down = []) {
    return pitches.map((note, i) => ({note, octave:String(2 + Number(up.includes(i + 1)) - Number(down.includes(i + 1))),
      accentSlide:(accents.includes(i + 1) ? 'A' : '') + (slides.includes(i + 1) ? 'S' : ''), gate:note ? '●' : '-'}));
  }
  const examples = {
    space: {en:'Hear what a rest does', tr:'Bir esin etkisini duy', steps:pattern(['C','','','','C','','','','C','','','','C','','',''])},
    accent: {en:'Move the emphasis', tr:'Vurgunun yerini değiştir', steps:pattern(['C','','','','C','','','','C','','','','C','','',''], [5])},
    slide: {en:'Give slide a destination', tr:'Slide için hedef belirle', steps:pattern(['C','G','','','','','','','','','','','','','',''], [], [1])},
    'sparse-a': {en:'Sparse A minor groove', tr:'Seyrek A minör groove', steps:pattern(['A','','A','C','','E','','A','G','','E','','C','','E',''], [1,9,15], [3,8], [8,15])},
    'one-note': {en:'One-note C rhythm', tr:'Tek notalı C ritmi', steps:pattern(['C','','C','','C','C','','C','','C','','C','C','','C',''], [5,10,13], [12], [5,12], [13])},
    'slide-tension': {en:'E slide tension', tr:'E slide gerilimi', steps:pattern(['E','','G','G#','','E','','B','A','','G','','E','G','G#',''], [4,9,15], [3,14], [8,15])},
    offbeat: {en:'Offbeat D minor', tr:'Offbeat D minör', steps:pattern(['','D','','F','','A','','C','','D','F','','','A','C',''], [4,10,15], [14], [8,15])},
    'accent-map': {en:'A accent map', tr:'A accent haritası', steps:pattern(['A','A','','E','A','','G','A','A','','E','A','','G','A',''], [1,5,9,14], [14], [14], [7])}
  };
  function valid(snapshot) {
    return snapshot && Number.isInteger(snapshot.baseOctave) && snapshot.baseOctave >= 1 && snapshot.baseOctave <= 5 &&
      typeof snapshot.title === 'string' && snapshot.steps?.length === 16 && snapshot.steps.every(s =>
        notes.has(s.note) && /^[1-5]$/.test(s.octave) && ['', 'A','S','AS'].includes(s.accentSlide) && ['','●','○','-'].includes(s.gate));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {examples, valid};
  if (typeof document === 'undefined') return;

  const copy = {
    en: {loading:'The sequencer is loading. You can read the guides while it starts.', failed:'The sequencer could not finish loading. Reload the page or continue with the guides.', guide:'Read the guide', reload:'Reload',
      heading:'Load a learning pattern', prompt:'Loading replaces the 16 bass steps and pattern title. Your current bass pattern is saved for Undo. Tempo, sound controls and rhythm stay as they are. Playback stops; press PLAY when you are ready.',
      load:'Load this pattern', cancel:'Cancel', undo:'Undo last example load', loaded:'Pattern loaded. Press PLAY to listen; use Undo to return to your previous bass pattern.', restored:'Previous bass pattern restored.',
      error:'The pattern could not be saved safely. Your existing pattern has been kept. Check that browser storage is available before trying again.'},
    tr: {loading:'Sequencer yükleniyor. Bu sırada rehberleri okuyabilirsin.', failed:'Sequencer yüklenemedi. Sayfayı yenileyebilir veya rehberleri okumaya devam edebilirsin.', guide:'Rehberi oku', reload:'Yenile',
      heading:'Öğretici pattern yükle', prompt:'Yükleme, 16 bas adımını ve pattern başlığını değiştirir. Mevcut bas pattern’in geri almak için saklanır. Tempo, ses kontrolleri ve ritim korunur. Çalma durur; hazır olduğunda ÇAL’a bas.',
      load:'Bu pattern’i yükle', cancel:'Vazgeç', undo:'Son örnek yüklemesini geri al', loaded:'Pattern yüklendi. Dinlemek için ÇAL’a bas; önceki bas pattern’in için Geri al’ı kullan.', restored:'Önceki bas pattern’in geri yüklendi.',
      error:'Pattern güvenli biçimde kaydedilemedi. Mevcut pattern’in korundu. Yeniden denemeden önce tarayıcı depolamasının kullanılabildiğini kontrol et.'}
  };
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const lang = () => document.documentElement.lang === 'tr' ? 'tr' : 'en';
  let pending = null, ready = false, failed = false, message = '', backup = null;
  function readBackup() { try { const value = JSON.parse(localStorage.getItem(BACKUP)); return valid(value) ? value : null; } catch (_) { return null; } }
  function snapshot() {
    return {baseOctave:window.__303boxPitchModel.baseOctave, title:$('#titleInput').value,
      steps:$$('#patternSheet .note-input').map((input, i) => ({note:input.value.trim().toUpperCase(),
        octave:$$('#patternSheet .octave-cell')[i].textContent.trim(),
        accentSlide:$$('#patternSheet .accentSlide-cell')[i].textContent.trim(), gate:$$('#patternSheet .gate-cell')[i].textContent.trim()}))};
  }
  function paint(value) {
    window.__303boxPitchModel.setBaseOctave(value.baseOctave);
    value.steps.forEach((s, i) => {
      const input = $$('#patternSheet .note-input')[i]; input.value = s.note; input.dataset.baseOctave = '0';
      const picker = $(`[data-note-picker="${i}"]`); if (picker) picker.value = s.note;
      for (const [key, cls] of [['octave','octave'], ['accentSlide','accentSlide'], ['gate','gate']]) {
        const cell = $$(`#patternSheet .${cls}-cell`)[i]; cell.textContent = s[key]; cell.dataset.value = s[key];
      }
    });
    $('#titleInput').value = value.title;
    window.__303boxPitchModel.setBaseOctave(value.baseOctave);
  }
  function commit(value) {
    const before = snapshot(), raw = localStorage.getItem(SESSION);
    if (!valid(value) || !valid(before)) throw new Error('Invalid pattern');
    // Check storage before changing the grid. Preserve the rest of the saved session.
    const session = JSON.parse(raw || '{}');
    localStorage.setItem(SESSION, JSON.stringify({...session, pattern:value.steps, title:value.title}));
    try {
      window.__303boxTransportFuse.run('panic');
      paint(value);
      $('#patternSheet .note-input').dispatchEvent(new Event('input', {bubbles:true}));
      const saved = JSON.parse(localStorage.getItem(SESSION));
      if (JSON.stringify(saved.pattern) !== JSON.stringify(value.steps) || saved.title !== value.title) throw new Error('Save failed');
    } catch (error) {
      paint(before);
      if (raw === null) localStorage.removeItem(SESSION); else localStorage.setItem(SESSION, raw);
      throw error;
    }
  }
  function clearQuery() {
    const url = new URL(location.href); url.searchParams.delete('example'); url.searchParams.delete('lang');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
  function render() {
    const c = copy[lang()];
    $('#sequencerLoadStatus').hidden = ready;
    $('#sequencerLoadMessage').textContent = failed ? c.failed : c.loading;
    $('#sequencerReload').textContent = c.reload; $('#sequencerReload').hidden = !failed;
    $('#sequencerGuide').textContent = c.guide; $('#sequencerGuide').href = lang() === 'tr' ? '/tr/303-pattern-rehberi.html' : '/303-pattern-guide.html';
    $('#exampleLoader').hidden = !pending && !backup && !message;
    $('#exampleHeading').textContent = pending ? `${c.heading}: ${examples[pending][lang()]}` : c.heading;
    $('#exampleDescription').textContent = c.prompt; $('#exampleDescription').hidden = !pending;
    $('#exampleLoad').textContent = c.load; $('#exampleLoad').hidden = !pending; $('#exampleLoad').disabled = !ready;
    $('#exampleCancel').textContent = c.cancel; $('#exampleCancel').hidden = !pending;
    $('#exampleUndo').textContent = c.undo; $('#exampleUndo').hidden = !backup; $('#exampleUndo').disabled = !ready;
    $('#exampleMessage').textContent = message ? c[message] : '';
  }
  function checkReady() {
    const wasReady = ready;
    if (!ready && document.documentElement.classList.contains('app-ready') &&
      window.__303boxUnifiedEngine && window.__303boxPitchModel && window.__303boxTransportFuse &&
      window.__303boxContentStable && $$('#patternSheet .note-input').length === 16) {
      ready = true; $('#sequencer').removeAttribute('inert'); $('#sequencer').removeAttribute('aria-busy');
    }
    render();
    if (!wasReady && ready && pending) { $('#exampleLoader').scrollIntoView({block:'center'}); $('#exampleHeading').focus(); }
  }
  function init() {
    if (!$('#exampleLoader')) return;
    backup = readBackup();
    const id = new URL(location.href).searchParams.get('example');
    pending = Object.hasOwn(examples, id) ? id : null;
    document.addEventListener('click', e => {
      const link = e.target.closest?.('a[data-learning-example]');
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      const id = link.dataset.learningExample; if (!Object.hasOwn(examples, id)) return;
      e.preventDefault(); pending = id; message = ''; render();
      $('#exampleLoader').scrollIntoView({block:'center'}); $('#exampleHeading').focus();
    });
    $('#exampleLoad').addEventListener('click', () => {
      if (!ready || !pending) return;
      try {
        const before = snapshot(); if (!valid(before)) throw new Error('Invalid backup');
        localStorage.setItem(BACKUP, JSON.stringify(before));
        backup = before;
        commit({baseOctave:2, title:examples[pending][lang()], steps:examples[pending].steps});
        pending = null; message = 'loaded'; clearQuery();
      } catch (_) { message = 'error'; }
      render();
    });
    $('#exampleCancel').addEventListener('click', () => { pending = null; message = ''; clearQuery(); render(); });
    $('#exampleUndo').addEventListener('click', () => {
      if (!ready || !backup) return;
      try { commit(backup); localStorage.removeItem(BACKUP); backup = null; pending = null; message = 'restored'; clearQuery(); }
      catch (_) { message = 'error'; }
      render();
    });
    $('#sequencerReload').addEventListener('click', () => location.reload());
    document.addEventListener('303box:languagechange', render);
    document.addEventListener('303box:ready', checkReady);
    document.addEventListener('303box:runtime-settled', checkReady);
    // Pitch model loads independently through the shared shell.
    document.addEventListener('303box:pitchchange', checkReady);
    setTimeout(() => { if (!ready) { failed = true; checkReady(); } }, 12000);
    checkReady();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
