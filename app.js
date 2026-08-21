(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const I18N = {
    en: {
      pageTitle: '303box — Free TB-303 & TD-3 Acid Pattern Generator',
      pageDescription: 'Create, hear and export 16-step TB-303 and TD-3 inspired acid bassline patterns in your browser. Free, fast and built for hardware workflows.',
      skip: 'Skip to sequencer', brandTag: 'Acid pattern laboratory', signalLabel: '303box / SIGNAL', liveLabel: 'LIVE', visualAccent: 'ACCENT', visualSlide: 'SLIDE', visualFilter: 'FILTER', visualExport: 'EXPORT', sheetKicker: '303BOX / SEQUENCER SHEET', sheetModel: 'ANALOG BASS LINE / 16 STEP', navSequencer: 'Sequencer', navWorkflow: 'Workflow', navReference: 'Reference', navFaq: 'FAQ', openSequencer: 'Open sequencer',
      heroKicker: 'Free browser acid sequencer', heroTitle: 'Turn sixteen steps into a living acid line.', heroLead: 'Program notes, rests, ties, accents and slides. Shape the classic filter movement, hear the result instantly and export a clean pattern sheet for your hardware session.', heroPrimary: 'Build a pattern', heroSecondary: 'How it works', factSteps: 'steps', factSignup: 'sign-up',
      bandOneTitle: 'Sequence without friction', bandOneText: 'Everything important stays in one focused 16-step view.', bandTwoTitle: 'Perform the tone', bandTwoText: 'The control strip mirrors the decisions you make on real acid hardware.', bandThreeTitle: 'Leave with a usable sheet', bandThreeText: 'Export your pattern, knob positions and notes as one clean image.',
      sequencerEyebrow: 'Pattern workspace', sequencerTitle: 'Build the line. Then perform it.', sequencerIntro: 'The generator is intentionally compact: rhythm, pitch, expression and the core 303 controls stay visible together.',
      generate: 'Generate pattern', download: 'Download sheet', clear: 'Clear', play: 'PLAY', stop: 'STOP', author: 'Author', title: 'Title', step: 'Step', note: 'Note', octave: 'Down / Up', accentSlide: 'Accent / Slide', gate: 'Gate', waveform: 'Waveform', tempo: 'Tempo', notes: 'EFX / Notes', notesPlaceholder: 'Write your patch notes here...',
      cutoff: 'Cutoff', resonance: 'Resonance', envMod: 'Env Mod', decay: 'Decay', accent: 'Accent',
      workflowEyebrow: '303 workflow', workflowTitle: 'A strong acid pattern starts with rhythm, not complexity.', workflowLead: 'The most convincing lines use a small pitch vocabulary and let timing, accent, slide and filter movement create the character.', flowOneTitle: 'Create space', flowOneText: 'Use rests before adding more notes. A good 303 line needs negative space to bounce.', flowTwoTitle: 'Choose the pressure points', flowTwoText: 'Accent only the steps that should punch through. Slide should connect intentional pitch targets.', flowThreeTitle: 'Perform the filter', flowThreeText: 'Keep resonance alive and move cutoff, envelope modulation and decay while the loop repeats.',
      referenceEyebrow: 'Sequencer reference', referenceTitle: 'Six symbols. A lot of movement.', referenceLead: 'The grid stays intentionally simple so the relationship between steps remains readable at a glance.', refTrigger: 'Trigger', refTriggerText: 'Starts a note and its envelope.', refTie: 'Tie', refTieText: 'Extends the gate into the next step.', refRest: 'Rest', refRestText: 'Leaves rhythmic space.', refAccent: 'Accent', refAccentText: 'Adds volume and filter emphasis.', refSlide: 'Slide', refSlideText: 'Glides toward the next pitch.', refOctave: 'Octave', refOctaveText: 'Moves the oscillator down or up one octave.',
      faqEyebrow: 'FAQ', faqTitle: 'Built to get out of the way.', faqLead: '303box is deliberately small: no account, no project setup and no software installation.', faqOneQ: 'What is 303box?', faqOneA: 'A free browser-based 16-step acid bassline pattern generator inspired by classic TB-303 and TD-3 workflows.', faqTwoQ: 'Does it generate audio?', faqTwoA: 'Yes. The preview engine uses the Web Audio API so you can audition a pattern before taking it to hardware.', faqThreeQ: 'Can I export my pattern?', faqThreeA: 'Yes. Download the complete pattern sheet as a JPG including notes, knob positions and session notes.', faqFourQ: 'Where is my pattern stored?', faqFourA: 'Your current session is stored locally in your browser so a refresh does not immediately erase your work.', footerText: 'A focused acid pattern tool for browser and hardware workflows.',
      tempoDialogEyebrow: 'Tempo', tempoDialogTitle: 'Set BPM', cancel: 'Cancel', apply: 'Apply', generated: 'New pattern generated.', cleared: 'Pattern cleared.', exported: 'Pattern sheet downloaded.', invalidBpm: 'BPM must be between 50 and 250.', exportError: 'The pattern sheet could not be exported.'
    },
    tr: {
      pageTitle: '303box — Ücretsiz TB-303 & TD-3 Acid Pattern Üretici',
      pageDescription: 'Tarayıcıda 16 adımlı TB-303 ve TD-3 esintili acid bassline pattern’leri oluştur, dinle ve dışa aktar.',
      skip: 'Sequencer’a geç', brandTag: 'Acid pattern laboratuvarı', signalLabel: '303box / SİNYAL', liveLabel: 'CANLI', visualAccent: 'VURGU', visualSlide: 'KAYDIRMA', visualFilter: 'FİLTRE', visualExport: 'DIŞA AKTAR', sheetKicker: '303BOX / SEQUENCER SAYFASI', sheetModel: 'ANALOG BAS HATTI / 16 ADIM', navSequencer: 'Sequencer', navWorkflow: 'Çalışma Akışı', navReference: 'Referans', navFaq: 'SSS', openSequencer: 'Sequencer’ı aç',
      heroKicker: 'Ücretsiz tarayıcı acid sequencer', heroTitle: 'On altı adımı yaşayan bir acid line’a dönüştür.', heroLead: 'Nota, es, bağ, vurgu ve kaydırmaları programla. Klasik filtre hareketini şekillendir, sonucu anında dinle ve donanım oturumun için temiz bir pattern sayfası dışa aktar.', heroPrimary: 'Pattern oluştur', heroSecondary: 'Nasıl çalışır?', factSteps: 'adım', factSignup: 'kayıt',
      bandOneTitle: 'Akışı bozmadan programla', bandOneText: 'Önemli olan her şey tek ve odaklı 16 adımlı görünümde kalır.', bandTwoTitle: 'Tınıyı performe et', bandTwoText: 'Kontrol şeridi gerçek acid donanımındaki temel kararları aynı yerde toplar.', bandThreeTitle: 'Kullanılabilir bir sayfayla çık', bandThreeText: 'Pattern’i, düğme konumlarını ve notlarını tek bir temiz görsel olarak dışa aktar.',
      sequencerEyebrow: 'Pattern çalışma alanı', sequencerTitle: 'Line’ı kur. Sonra performe et.', sequencerIntro: 'Generator bilinçli olarak kompakt tutuldu: ritim, perde, ifade ve temel 303 kontrolleri aynı anda görünür.',
      generate: 'Pattern üret', download: 'Sayfayı indir', clear: 'Temizle', play: 'ÇAL', stop: 'DUR', author: 'Yazar', title: 'Başlık', step: 'Adım', note: 'Nota', octave: 'Aşağı / Yukarı', accentSlide: 'Vurgu / Kaydırma', gate: 'Gate', waveform: 'Dalga Formu', tempo: 'Tempo', notes: 'EFX / Notlar', notesPlaceholder: 'Patch notlarını buraya yaz...',
      cutoff: 'Cutoff', resonance: 'Rezonans', envMod: 'Env Mod', decay: 'Decay', accent: 'Vurgu',
      workflowEyebrow: '303 çalışma akışı', workflowTitle: 'Güçlü bir acid pattern karmaşıklıkla değil, ritimle başlar.', workflowLead: 'En etkili line’lar az sayıda perde kullanır; karakteri zamanlama, vurgu, kaydırma ve filtre hareketi oluşturur.', flowOneTitle: 'Boşluk yarat', flowOneText: 'Daha fazla nota eklemeden önce es kullan. İyi bir 303 line’ın sekebilmesi için boşluğa ihtiyacı vardır.', flowTwoTitle: 'Baskı noktalarını seç', flowTwoText: 'Yalnızca öne çıkması gereken adımları vurgula. Kaydırma, bilinçli perde hedeflerini birbirine bağlasın.', flowThreeTitle: 'Filtreyi performe et', flowThreeText: 'Rezonansı canlı tut; loop dönerken cutoff, envelope modulation ve decay ile hareket yarat.',
      referenceEyebrow: 'Sequencer referansı', referenceTitle: 'Altı sembol. Büyük hareket alanı.', referenceLead: 'Grid özellikle sade tutulur; böylece adımlar arasındaki ilişki tek bakışta okunur.', refTrigger: 'Tetikleme', refTriggerText: 'Notayı ve zarfını başlatır.', refTie: 'Bağ', refTieText: 'Gate’i sonraki adıma uzatır.', refRest: 'Es', refRestText: 'Ritmik boşluk bırakır.', refAccent: 'Vurgu', refAccentText: 'Ses ve filtre vurgusunu artırır.', refSlide: 'Kaydırma', refSlideText: 'Bir sonraki perdeye yumuşak geçiş yapar.', refOctave: 'Oktav', refOctaveText: 'Osilatörü bir oktav aşağı veya yukarı taşır.',
      faqEyebrow: 'SSS', faqTitle: 'Araya girmemek için tasarlandı.', faqLead: '303box özellikle küçük tutuldu: hesap yok, proje kurulumu yok, yazılım kurulumu yok.', faqOneQ: '303box nedir?', faqOneA: 'Klasik TB-303 ve TD-3 çalışma akışlarından esinlenen, tarayıcıda çalışan ücretsiz 16 adımlı acid bassline pattern üreticisidir.', faqTwoQ: 'Ses üretiyor mu?', faqTwoA: 'Evet. Önizleme motoru Web Audio API kullanır; pattern’i donanıma aktarmadan önce dinleyebilirsin.', faqThreeQ: 'Pattern’i dışa aktarabilir miyim?', faqThreeA: 'Evet. Nota, düğme konumları ve oturum notlarıyla birlikte tüm pattern sayfasını JPG olarak indirebilirsin.', faqFourQ: 'Pattern’im nerede saklanıyor?', faqFourA: 'Mevcut oturum tarayıcında yerel olarak saklanır; sayfayı yenilemek çalışmanı hemen silmez.', footerText: 'Tarayıcı ve donanım çalışma akışları için odaklı bir acid pattern aracı.',
      tempoDialogEyebrow: 'Tempo', tempoDialogTitle: 'BPM Ayarla', cancel: 'İptal', apply: 'Uygula', generated: 'Yeni pattern üretildi.', cleared: 'Pattern temizlendi.', exported: 'Pattern sayfası indirildi.', invalidBpm: 'BPM 50 ile 250 arasında olmalı.', exportError: 'Pattern sayfası dışa aktarılamadı.'
    }
  };

  const SEGMENTS = {
    0: ['a','b','c','d','e','f'], 1: ['b','c'], 2: ['a','b','g','e','d'], 3: ['a','b','c','d','g'],
    4: ['f','g','b','c'], 5: ['a','f','g','c','d'], 6: ['a','f','g','e','c','d'], 7: ['a','b','c'],
    8: ['a','b','c','d','e','f','g'], 9: ['a','b','c','d','f','g']
  };
  const NOTE_BASE = { C:261.63,'C#':277.18,D:293.66,'D#':311.13,E:329.63,F:349.23,'F#':369.99,G:392,'G#':415.30,A:440,'A#':466.16,B:493.88 };
  const KNOBS = [
    { id:'cutoff', key:'cutoff', value:38, default:38 },
    { id:'resonance', key:'resonance', value:78, default:78 },
    { id:'envMod', key:'envMod', value:64, default:64 },
    { id:'decay', key:'decay', value:34, default:34 },
    { id:'accent', key:'accent', value:70, default:70 }
  ];

  const savedLanguage = localStorage.getItem('303-lang');
  const state = {
    language: savedLanguage === 'tr' || savedLanguage === 'en'
      ? savedLanguage
      : (navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en'),
    bpm: 140,
    waveform: 'square',
    knobs: Object.fromEntries(KNOBS.map(k => [k.id, k.value])),
    playing: false,
    audio: null,
    timer: null,
    currentStep: 0,
    nextStepAt: 0,
    activeVoices: new Set()
  };

  function t(key) { return I18N[state.language][key] ?? I18N.en[key] ?? key; }

  function setLanguage(lang) {
    state.language = lang === 'tr' ? 'tr' : 'en';
    document.documentElement.lang = state.language;
    localStorage.setItem('303-lang', state.language);
    updatePlayLabel();
    renderKnobLabels();
    document.dispatchEvent(new CustomEvent('303box:languagechange', {
      detail: { language: state.language }
    }));
  }

  function initPatternGrid() {
    const header = $('#stepHeaderRow');
    for (let step = 0; step < 16; step += 1) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = String(step + 1);
      th.dataset.stepHeader = String(step);
      if ([0,4,8,12].includes(step)) th.classList.add('downbeat');
      header.appendChild(th);
    }

    const rows = [
      { type:'note', key:'note' },
      { type:'octave', key:'octave', values:['','D','U'] },
      { type:'accentSlide', key:'accentSlide', values:['','A','S','AS'] },
      { type:'gate', key:'gate', values:['●','○','-'] }
    ];
    const body = $('#patternGrid');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.className = 'row-label';
      label.dataset.i18n = row.key;
      label.textContent = t(row.key);
      tr.appendChild(label);
      for (let step = 0; step < 16; step += 1) {
        const td = document.createElement('td');
        td.className = 'step-cell';
        if ([4,8,12].includes(step)) td.classList.add('shaded');
        if (row.type === 'note') {
          const input = document.createElement('input');
          input.className = 'cell-control note-input';
          input.maxLength = 2;
          input.autocomplete = 'off';
          input.spellcheck = false;
          input.dataset.step = String(step);
          input.setAttribute('aria-label', `${t('note')} ${step + 1}`);
          input.addEventListener('input', () => { input.value = normalizeNoteInput(input.value); saveSession(); });
          td.appendChild(input);
        } else {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `cell-control ${row.type}-cell`;
          button.dataset.step = String(step);
          button.dataset.values = JSON.stringify(row.values);
          button.addEventListener('click', () => cycleCell(button));
          td.appendChild(button);
        }
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });
  }

  function cycleCell(button) {
    const values = JSON.parse(button.dataset.values);
    const current = button.textContent.trim();
    const index = values.indexOf(current);
    button.textContent = values[(index + 1) % values.length];
    saveSession();
  }

  function normalizeNoteInput(value) {
    const upper = value.toUpperCase().replace(/[^A-G#]/g, '');
    if (upper.length > 1 && upper[1] !== '#') return upper[0];
    return upper.slice(0,2);
  }

  function getStepData(step) {
    return {
      note: $$('.note-input')[step].value.trim().toUpperCase(),
      octave: $$('.octave-cell')[step].textContent.trim(),
      accentSlide: $$('.accentSlide-cell')[step].textContent.trim(),
      gate: $$('.gate-cell')[step].textContent.trim()
    };
  }

  function setStepData(step, data) {
    $$('.note-input')[step].value = data.note || '';
    $$('.octave-cell')[step].textContent = data.octave || '';
    $$('.accentSlide-cell')[step].textContent = data.accentSlide || '';
    $$('.gate-cell')[step].textContent = data.gate || '';
  }

  function generatePattern(showMessage = true) {
    const scale = ['C', 'C', 'C', 'D#', 'F', 'G', 'A#'];
    const octaveChoices = ['', '', '', 'D', 'U'];
    const gateChoices = ['●', '●', '●', '○', '-'];
    const expressionChoices = ['', '', '', 'A', 'S', 'AS'];

    for (let step = 0; step < 16; step += 1) {
      const gate = gateChoices[Math.floor(Math.random() * gateChoices.length)];
      setStepData(step, {
        note: scale[Math.floor(Math.random() * scale.length)],
        octave: octaveChoices[Math.floor(Math.random() * octaveChoices.length)],
        accentSlide: gate === '-' ? '' : expressionChoices[Math.floor(Math.random() * expressionChoices.length)],
        gate
      });
    }

    setStepData(0, { note: 'C', octave: '', accentSlide: 'A', gate: '●' });
    setKnob('resonance', 70 + Math.floor(Math.random() * 25));
    setKnob('cutoff', 20 + Math.floor(Math.random() * 45));
    setKnob('envMod', 45 + Math.floor(Math.random() * 40));
    setKnob('decay', 30 + Math.floor(Math.random() * 50));
    setKnob('accent', 55 + Math.floor(Math.random() * 40));
    setWaveform(Math.random() > 0.5 ? 'saw' : 'square');
    saveSession();
    if (showMessage) showToast(state.language === 'tr' ? 'Yeni pattern üretildi.' : 'New pattern generated.');
  }

  function dialSvg(id) {
    const ticks = Array.from({length: 11}, (_, i) => {
      const angle = -135 + i * 27;
      const major = i === 0 || i === 5 || i === 10 ? ' major' : '';
      return `<line class="dial-tick${major}" x1="50" y1="5" x2="50" y2="11" transform="rotate(${angle} 50 50)"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="knobFace-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#333338"/><stop offset="1" stop-color="#111113"/></linearGradient></defs>${ticks}<circle class="dial-bezel" cx="50" cy="50" r="34"/><circle fill="url(#knobFace-${id})" stroke="#151517" stroke-width="2" cx="50" cy="50" r="29"/><circle class="dial-center" cx="50" cy="50" r="5"/><g class="pointer-group"><line class="dial-pointer" x1="50" y1="50" x2="50" y2="23"/></g></svg>`;
  }

  function createKnob({id, key, tempo = false}) {
    const wrap = document.createElement('div');
    wrap.className = 'knob';
    wrap.dataset.knob = id;
    if (!tempo) {
      const title = document.createElement('span');
      title.className = 'knob-title';
      title.dataset.i18n = key;
      title.textContent = t(key);
      wrap.appendChild(title);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'knob-control';
    button.dataset.knobId = id;
    button.setAttribute('role', 'slider');
    button.innerHTML = dialSvg(id);
    const value = document.createElement('span');
    value.className = 'knob-value';
    value.dataset.knobValue = id;
    wrap.append(button, value);
    attachKnobEvents(button);
    return wrap;
  }

  function initKnobs() {
    const grid = $('#knobGrid');
    KNOBS.forEach(config => grid.appendChild(createKnob(config)));
    $('#tempoKnob').appendChild(createKnob({id:'bpm', key:'tempo', tempo:true}));
    renderAllKnobs();
  }

  function valueToAngle(id, value) {
    const normalized = id === 'bpm' ? (value - 50) / 200 : value / 100;
    return -135 + clamp(normalized, 0, 1) * 270;
  }

  function setKnob(id, value, persist = true) {
    if (id === 'bpm') {
      state.bpm = Math.round(clamp(value, 50, 250));
      updateSevenSegment();
    } else if (id in state.knobs) {
      state.knobs[id] = Math.round(clamp(value, 0, 100));
    }
    renderKnob(id);
    if (persist) saveSession();
  }

  function renderKnob(id) {
    const control = $(`[data-knob-id="${id}"]`);
    if (!control) return;
    const value = id === 'bpm' ? state.bpm : state.knobs[id];
    const angle = valueToAngle(id, value);
    control.querySelector('.pointer-group')?.setAttribute('transform', `rotate(${angle} 50 50)`);
    control.setAttribute('aria-valuemin', id === 'bpm' ? '50' : '0');
    control.setAttribute('aria-valuemax', id === 'bpm' ? '250' : '100');
    control.setAttribute('aria-valuenow', String(value));
    const label = $(`[data-knob-value="${id}"]`);
    if (label) label.textContent = id === 'bpm' ? `${value}` : `${value}%`;
  }

  function renderAllKnobs() { ['bpm', ...KNOBS.map(k => k.id)].forEach(renderKnob); }
  function renderKnobLabels() { $$('.knob-title[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); }); }

  function attachKnobEvents(control) {
    let active = false;
    let startY = 0;
    let startValue = 0;
    const id = control.dataset.knobId;
    const read = () => id === 'bpm' ? state.bpm : state.knobs[id];
    const sensitivity = id === 'bpm' ? 1.1 : .55;
    control.addEventListener('pointerdown', event => {
      active = true; startY = event.clientY; startValue = read(); control.setPointerCapture(event.pointerId); event.preventDefault();
    });
    control.addEventListener('pointermove', event => {
      if (!active) return;
      setKnob(id, startValue + (startY - event.clientY) * sensitivity, false);
    });
    const finish = event => {
      if (!active) return; active = false; try { control.releasePointerCapture(event.pointerId); } catch (_) {} saveSession();
    };
    control.addEventListener('pointerup', finish);
    control.addEventListener('pointercancel', finish);
    control.addEventListener('wheel', event => { event.preventDefault(); const step = id === 'bpm' ? 2 : 1; setKnob(id, read() + (event.deltaY < 0 ? step : -step)); }, {passive:false});
    control.addEventListener('keydown', event => {
      if (!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const min = id === 'bpm' ? 50 : 0, max = id === 'bpm' ? 250 : 100, step = id === 'bpm' ? 1 : 1;
      if (event.key === 'Home') setKnob(id,min); else if (event.key === 'End') setKnob(id,max); else setKnob(id, read() + (['ArrowUp','ArrowRight'].includes(event.key) ? step : -step));
    });
    control.addEventListener('dblclick', () => { const config = KNOBS.find(k => k.id === id); setKnob(id, id === 'bpm' ? 140 : (config?.default ?? 50)); });
  }

  function initSevenSegment() {
    const container = $('#sevenDigits');
    for (let i = 0; i < 3; i += 1) {
      const digit = document.createElement('span'); digit.className = 'seven-digit';
      ['a','b','c','d','e','f','g'].forEach(name => { const seg = document.createElement('i'); seg.className = `seg seg-${name}`; seg.dataset.seg = name; digit.appendChild(seg); });
      container.appendChild(digit);
    }
    updateSevenSegment();
  }

  function updateSevenSegment() {
    const text = String(state.bpm).padStart(3,'0');
    $$('.seven-digit').forEach((digit, index) => {
      const on = SEGMENTS[text[index]] || [];
      $$('.seg', digit).forEach(seg => seg.classList.toggle('on', on.includes(seg.dataset.seg)));
    });
  }

  function setWaveform(type, persist = true) {
    state.waveform = type === 'saw' ? 'saw' : 'square';
    $('#waveSaw').classList.toggle('selected', state.waveform === 'saw');
    $('#waveSquare').classList.toggle('selected', state.waveform === 'square');
    $('#waveSaw').setAttribute('aria-pressed', String(state.waveform === 'saw'));
    $('#waveSquare').setAttribute('aria-pressed', String(state.waveform === 'square'));
    if (persist) saveSession();
  }

  function clearPattern() {
    stopPlayback();
    for (let step = 0; step < 16; step += 1) setStepData(step, {note:'',octave:'',accentSlide:'',gate:''});
    $('#notesArea').value = '';
    saveSession(); showToast(t('cleared'));
  }

  function noteToFrequency(note, octaveMode) {
    const base = NOTE_BASE[note]; if (!base) return null;
    if (octaveMode === 'D') return base / 2;
    if (octaveMode === 'U') return base * 2;
    return base;
  }

  async function togglePlayback() {
    if (state.playing) { stopPlayback(); return; }
    state.audio = new (window.AudioContext || window.webkitAudioContext)();
    await state.audio.resume();
    state.playing = true; state.currentStep = 0; state.nextStepAt = state.audio.currentTime + .06; updatePlayUi(); scheduler();
  }

  function scheduler() {
    if (!state.playing || !state.audio) return;
    while (state.nextStepAt < state.audio.currentTime + .12) {
      const step = state.currentStep;
      scheduleStep(step, state.nextStepAt); scheduleVisual(step, state.nextStepAt);
      state.nextStepAt += (60 / state.bpm) / 4;
      state.currentStep = (state.currentStep + 1) % 16;
    }
    state.timer = window.setTimeout(scheduler, 25);
  }

  function scheduleStep(step, when) {
    const data = getStepData(step); if (!data.note || data.gate === '-') return;
    const freq = noteToFrequency(data.note, data.octave); if (!freq) return;
    const stepDur = (60 / state.bpm) / 4;
    const accented = data.accentSlide.includes('A');
    const sliding = data.accentSlide.includes('S');
    const c = state.knobs.cutoff/100, r = state.knobs.resonance/100, e = state.knobs.envMod/100, d = state.knobs.decay/100, a = state.knobs.accent/100;
    const osc = state.audio.createOscillator(), filter = state.audio.createBiquadFilter(), gain = state.audio.createGain(), shaper = state.audio.createWaveShaper();
    osc.type = state.waveform === 'saw' ? 'sawtooth' : 'square'; osc.frequency.setValueAtTime(freq, when);
    if (sliding) { const next = getStepData((step+1)%16); const nf = noteToFrequency(next.note,next.octave); if (nf && next.gate !== '-') osc.frequency.exponentialRampToValueAtTime(Math.max(20,nf), when + stepDur*.9); }
    filter.type = 'lowpass'; filter.Q.setValueAtTime(2 + r*24, when);
    const base = 95 + c*1750, peak = base + 450 + e*3900 + (accented ? 900 + a*1800 : 0);
    filter.frequency.setValueAtTime(Math.max(95,peak), when); filter.frequency.exponentialRampToValueAtTime(Math.max(95,base), when + .055 + d*.36);
    const volume = .16 + (accented ? .07 + a*.11 : 0), gateLength = data.gate === '○' ? stepDur*1.42 : stepDur*.7;
    gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(volume,when+.008); gain.gain.setValueAtTime(volume,when+Math.max(.012,gateLength*.55)); gain.gain.exponentialRampToValueAtTime(.0001,when+gateLength+.11+d*.2);
    shaper.curve = distortionCurve(7+r*9); shaper.oversample='2x'; osc.connect(filter); filter.connect(shaper); shaper.connect(gain); gain.connect(state.audio.destination); osc.start(when); osc.stop(when+gateLength+.4);
    state.activeVoices.add(osc); osc.addEventListener('ended',()=>state.activeVoices.delete(osc),{once:true});
  }

  function distortionCurve(amount) { const n=256, curve=new Float32Array(n); for(let i=0;i<n;i++){const x=i*2/n-1;curve[i]=((3+amount)*x*20*(Math.PI/180))/(Math.PI+amount*Math.abs(x));} return curve; }

  function scheduleVisual(step, when) {
    const delay = Math.max(0,(when-state.audio.currentTime)*1000);
    window.setTimeout(()=>{ if(!state.playing)return; $$('[data-playing="true"]').forEach(el=>el.removeAttribute('data-playing')); $(`[data-step-header="${step}"]`)?.setAttribute('data-playing','true'); $$(`[data-step="${step}"]`).forEach(el=>el.closest('td')?.setAttribute('data-playing','true')); }, delay);
  }

  function stopPlayback() {
    if(state.timer) clearTimeout(state.timer); state.timer=null; state.playing=false; $$('[data-playing="true"]').forEach(el=>el.removeAttribute('data-playing')); state.activeVoices.forEach(osc=>{try{osc.stop();}catch(_){}}); state.activeVoices.clear(); if(state.audio){state.audio.close().catch(()=>{});state.audio=null;} updatePlayUi();
  }
  function updatePlayLabel(){ $('#playLabel').textContent = state.playing ? t('stop') : t('play'); }
  function updatePlayUi(){ $('#playButton').setAttribute('aria-pressed',String(state.playing)); $('#playLed').classList.toggle('on',state.playing); updatePlayLabel(); }

  async function exportSheet() {
    if(typeof window.html2canvas !== 'function'){showToast(t('exportError'));return;}
    try {
      const canvas = await window.html2canvas($('#patternSheet'), {scale:2.5,backgroundColor:'#f6f3ea',useCORS:true,logging:false});
      const link=document.createElement('a'), name=($('#titleInput').value||'Pattern').trim().replace(/[^a-z0-9-_]+/gi,'_');
      link.download=`303box_${name}_${Date.now().toString().slice(-6)}.jpg`; link.href=canvas.toDataURL('image/jpeg',.95); link.click(); showToast(t('exported'));
    } catch(err){console.error(err);showToast(t('exportError'));}
  }

  function openTempoDialog(){ $('#tempoInput').value=state.bpm; $('#tempoDialog').showModal(); setTimeout(()=>$('#tempoInput').select(),0); }
  function applyTempo(){ const value=Number($('#tempoInput').value); if(!Number.isFinite(value)||value<50||value>250){showToast(t('invalidBpm'));return false;} setKnob('bpm',value); return true; }

  function saveSession() {
    if (!$('#patternGrid')) return;
    const pattern = Array.from({length:16},(_,step)=>getStepData(step));
    const data={pattern,bpm:state.bpm,waveform:state.waveform,knobs:state.knobs,author:$('#authorInput').value,title:$('#titleInput').value,notes:$('#notesArea').value,group:$('#groupSelector .selected')?.dataset.value||'I',bank:$('#bankSelector .selected')?.dataset.value||'A'};
    localStorage.setItem('303box-session',JSON.stringify(data));
  }

  function loadSession() {
    const raw=localStorage.getItem('303box-session') || localStorage.getItem('303-session'); if(!raw){generatePattern(false);return;}
    try { const data=JSON.parse(raw); if(Array.isArray(data.pattern)&&data.pattern.length===16)data.pattern.forEach((step,i)=>setStepData(i,step)); if(data.bpm)setKnob('bpm',Number(data.bpm),false); if(data.knobs)Object.entries(data.knobs).forEach(([id,v])=>{if(id in state.knobs)setKnob(id,Number(v),false);}); if(data.waveform)setWaveform(data.waveform,false); if(typeof data.author==='string')$('#authorInput').value=data.author; if(typeof data.title==='string')$('#titleInput').value=data.title; if(typeof data.notes==='string')$('#notesArea').value=data.notes; selectSegment('#groupSelector',data.group||'I',false); selectSegment('#bankSelector',data.bank||'A',false); } catch(_){generatePattern(false);} renderAllKnobs(); updateSevenSegment();
  }

  function selectSegment(selector,value,persist=true){ $$(selector+' .segment-button').forEach(btn=>btn.classList.toggle('selected',btn.dataset.value===value)); if(persist)saveSession(); }
  let toastTimer; function showToast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }

  function bindEvents() {
    $('#languageButton').addEventListener('click',()=>setLanguage(state.language==='en'?'tr':'en'));
    $('#generateButton').addEventListener('click',()=>generatePattern(true));
    $('#clearButton').addEventListener('click',clearPattern);
    $('#playButton').addEventListener('click',togglePlayback);
    $('#downloadButton').addEventListener('click',exportSheet);
    $('#waveSaw').addEventListener('click',()=>setWaveform('saw'));
    $('#waveSquare').addEventListener('click',()=>setWaveform('square'));
    $('#bpmDisplay').addEventListener('click',openTempoDialog);
    $('#tempoForm').addEventListener('submit',event=>{ if(event.submitter?.id==='tempoApply'&&!applyTempo()){event.preventDefault();} });
    ['authorInput','titleInput','notesArea'].forEach(id=>$('#'+id).addEventListener('input',saveSession));
    ['groupSelector','bankSelector'].forEach(id=>$('#'+id).addEventListener('click',event=>{const btn=event.target.closest('.segment-button');if(btn)selectSegment('#'+id,btn.dataset.value);}));
    document.addEventListener('keydown',event=>{const typing=['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);if(typing)return;if(event.code==='Space'){event.preventDefault();togglePlayback();}if(event.key.toLowerCase()==='r')generatePattern(true);});
  }

  function init(){ initPatternGrid(); initSevenSegment(); initKnobs(); bindEvents(); setLanguage(state.language); loadSession(); updatePlayUi(); }
  window.addEventListener('DOMContentLoaded',init);
})();
