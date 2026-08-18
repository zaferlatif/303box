(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const chance = p => Math.random() < p;

  const NOTE_OPTIONS = [
    {v:'', l:'—'}, {v:'C',l:'C'}, {v:'C#',l:'C#'}, {v:'D',l:'D'}, {v:'D#',l:'D#'},
    {v:'E',l:'E'}, {v:'F',l:'F'}, {v:'F#',l:'F#'}, {v:'G',l:'G'}, {v:'G#',l:'G#'},
    {v:'A',l:'A'}, {v:'A#',l:'A#'}, {v:'B',l:'B'}, {v:'C_TOP',l:'C'}
  ];

  function installNotePickers() {
    $$('#patternGrid .note-input').forEach((input, step) => {
      input.type = 'hidden';
      input.tabIndex = -1;
      input.setAttribute('aria-hidden', 'true');
      input.classList.add('note-source-hidden');
      const td = input.closest('td');
      td?.querySelectorAll('.note-picker').forEach(x => x.remove());

      const select = document.createElement('select');
      select.className = 'cell-control note-picker';
      select.dataset.notePicker = String(step);
      select.setAttribute('aria-label', `${document.documentElement.lang === 'tr' ? 'Nota' : 'Note'} ${step + 1}`);
      NOTE_OPTIONS.forEach(o => {
        const option = document.createElement('option');
        option.value = o.v;
        option.textContent = o.l;
        select.appendChild(option);
      });
      const oct = $$('.octave-cell')[step]?.textContent.trim();
      select.value = input.value === 'C' && oct === 'U' ? 'C_TOP' : (input.value || '');
      input.after(select);

      select.addEventListener('change', () => {
        const wasTop = select.value === 'C_TOP';
        input.value = wasTop ? 'C' : select.value;
        if (wasTop && $$('.octave-cell')[step]) $$('.octave-cell')[step].textContent = 'U';
        input.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
  }

  function syncNotePickers() {
    $$('#patternGrid .note-input').forEach((input, step) => {
      const s = $(`[data-note-picker="${step}"]`);
      if (!s) return;
      const oct = $$('.octave-cell')[step]?.textContent.trim();
      const wanted = input.value === 'C' && oct === 'U' ? 'C_TOP' : (input.value || '');
      if (s.value !== wanted) s.value = wanted;
    });
  }

  function weighted(items, weights) {
    let n = Math.random() * weights.reduce((a,b)=>a+b,0);
    for (let i=0;i<items.length;i++) { n -= weights[i]; if (n <= 0) return items[i]; }
    return items[items.length-1];
  }

  const ACID_SCALES = [
    {notes:['C','D#','F','G','A#'], weights:[4.8,2.1,1.5,2.8,1.5]},
    {notes:['C','C#','D#','F','G','G#','A#'], weights:[4.5,1.7,2.1,1.2,2.5,1.1,1.5]},
    {notes:['C','D','D#','F','G','G#','A#'], weights:[4.5,1.1,2.2,1.3,2.7,1.0,1.5]},
    {notes:['C','C#','D#','E','F#','G','A#'], weights:[4.2,1.4,2.0,.7,.8,2.6,1.5]}
  ];

  const ACID_RHYTHMS = [
    '1011010010110101','1101011010010110','1010110110100101','1110100110101100',
    '1001101110010110','1010011011010011','1100101011011010','1011011010100101'
  ];

  function mutateMask(mask) {
    const target = rnd(9,13);
    const out = [...mask];
    let guard = 0;
    while (out.reduce((a,b)=>a+b,0) !== target && guard++ < 80) {
      const count = out.reduce((a,b)=>a+b,0);
      if (count > target) {
        const candidates = out.map((v,i)=>v && ![0,4,8,12].includes(i) ? i : -1).filter(i=>i>=0);
        if (candidates.length) out[pick(candidates)] = 0; else out[pick(out.map((v,i)=>v?i:-1).filter(i=>i>=0))] = 0;
      } else {
        const candidates = out.map((v,i)=>!v ? i : -1).filter(i=>i>=0);
        if (candidates.length) out[pick(candidates)] = 1;
      }
    }
    for (let q=0;q<4;q++) {
      const s=q*4, slice=out.slice(s,s+4);
      if (!slice.some(Boolean)) out[s + pick([0,2,3])] = 1;
    }
    if (chance(.28)) out[0] = 0;
    return out;
  }

  function setPatternStep(step, note, octave, expression, gate) {
    const input = $$('.note-input')[step];
    const oct = $$('.octave-cell')[step];
    const exp = $$('.accentSlide-cell')[step];
    const gat = $$('.gate-cell')[step];
    if (!input || !oct || !exp || !gat) return;
    input.value = note;
    oct.textContent = octave;
    exp.textContent = expression;
    gat.textContent = gate;
  }

  function generateAcidPattern() {
    const scale = pick(ACID_SCALES);
    const mask = mutateMask(pick(ACID_RHYTHMS).split('').map(Number));
    const motif = Array.from({length:4}, () => weighted(scale.notes, scale.weights));
    if (chance(.7)) motif[2] = motif[0];
    const notes = Array(16).fill('C');
    const octaves = Array(16).fill('');
    const gates = mask.map(v => v ? '●' : '-');
    const expressions = Array(16).fill('');

    let last = 'C';
    for (let i=0;i<16;i++) {
      if (!mask[i]) { notes[i] = last; continue; }
      let note = motif[i % 4];
      if (chance(i >= 8 ? .34 : .20)) note = weighted(scale.notes, scale.weights);
      if (chance(.23)) note = last;
      notes[i] = note;
      last = note;
      if (chance(i >= 12 ? .16 : .08)) octaves[i] = 'U';
      else if (chance(.11)) octaves[i] = 'D';
    }

    const active = mask.map((v,i)=>v?i:-1).filter(i=>i>=0);
    const accentScores = active.map(i => ({i,score:(i%4===2?2.1:0)+(i%4===3?1.8:0)+([0,4,8,12].includes(i)?.7:0)+Math.random()*2.2}));
    accentScores.sort((a,b)=>b.score-a.score).slice(0,rnd(3,5)).forEach(x => expressions[x.i] = 'A');

    let slideCandidates = active.filter(i => mask[(i+1)%16] && notes[i] !== notes[(i+1)%16]);
    slideCandidates = slideCandidates.sort(()=>Math.random()-.5).slice(0, Math.min(rnd(1,3), slideCandidates.length));
    slideCandidates.forEach(i => {
      expressions[i] = expressions[i].includes('A') ? 'AS' : 'S';
      gates[i] = '○';
    });

    const tieCandidates = active.filter(i => mask[(i+1)%16] && !expressions[i].includes('S'));
    tieCandidates.sort(()=>Math.random()-.5).slice(0,rnd(0,2)).forEach(i => gates[i] = '○');

    for (let i=0;i<16;i++) setPatternStep(i, notes[i], octaves[i], expressions[i], gates[i]);
    syncNotePickers();
    $('#authorInput')?.dispatchEvent(new Event('input',{bubbles:true}));
  }

  const DRUM_PROFILES = ['jack','warehouse','rolling','sparse','late-night'];

  function emptyDrums() { return Object.fromEntries(['bd','sd','cp','tm','ch','oh'].map(id=>[id,Array(16).fill(false)])); }
  function add(arr, steps, p=1) { steps.forEach(i=>{ if(chance(p)) arr[i]=true; }); }

  function buildDrumPattern() {
    const out = emptyDrums();
    const density = Math.max(.15, Math.min(1, (Number($('#drumDensity')?.value) || 55)/100));
    const profile = pick(DRUM_PROFILES);

    if (profile === 'jack') {
      add(out.bd,[0,4,8,12],.96); add(out.bd,[3,7,10,14],.12+.24*density);
      add(out.sd,[4,12],.78); add(out.cp,[4,12],.55+.25*density);
      add(out.oh,[2,6,10,14],.36+.35*density); add(out.ch,[0,2,4,6,8,10,12,14],.55+.35*density);
    } else if (profile === 'warehouse') {
      add(out.bd,[0,4,8,12],.99); add(out.bd,[7,11,14],.08+.18*density);
      add(out.cp,[4,12],.82); add(out.sd,[4,12],.35+.25*density);
      add(out.oh,[2,6,10,14],.72); add(out.ch,[0,1,3,4,5,7,8,9,11,12,13,15],.18+.38*density);
    } else if (profile === 'rolling') {
      add(out.bd,[0,3,4,7,8,10,12,14],.46+.34*density);
      add(out.sd,[4,12],.68); add(out.cp,[4,12],.36+.24*density);
      add(out.ch,[0,2,4,6,8,10,12,14],.72); add(out.oh,[6,14],.48+.28*density);
      add(out.tm,[11,13,15],.08+.24*density);
    } else if (profile === 'sparse') {
      add(out.bd,[0,4,8,12],.78); add(out.bd,[6,14],.08+.16*density);
      add(out.cp,[4,12],.58); add(out.sd,[12],.55); add(out.ch,[2,6,10,14],.42+.32*density); add(out.oh,[6,14],.28+.28*density);
    } else {
      add(out.bd,[0,4,8,12],.92); add(out.bd,[2,10,15],.08+.20*density);
      add(out.sd,[4,12],.52); add(out.cp,[4,12],.46+.25*density);
      add(out.ch,[0,2,4,6,8,10,12,14],.46+.38*density); add(out.oh,[2,10,14],.28+.30*density);
      add(out.tm,[13,15],.08+.22*density);
    }

    for (let i=0;i<16;i++) {
      if (out.oh[i]) out.ch[i]=false;
      if (!out.bd[i] && chance(.018+.055*density) && ![4,12].includes(i)) out.bd[i]=true;
    }
    if (chance(.48)) {
      const fills = pick([[13,15],[12,14,15],[11,14],[14,15]]);
      fills.forEach(i=>{ if(chance(.25+.35*density)) out.tm[i]=true; });
    }
    if (!out.bd.some(Boolean)) out.bd[0]=true;
    return out;
  }

  function applyDrumPattern(target) {
    Object.entries(target).forEach(([id, steps]) => {
      steps.forEach((wanted, i) => {
        const btn = $(`[data-drum="${id}"][data-drum-step="${i}"]`);
        if (!btn) return;
        const current = btn.classList.contains('on');
        if (current !== wanted) btn.click();
      });
    });
  }

  function advancedDrumRandom() { applyDrumPattern(buildDrumPattern()); }

  function hookRandomizers() {
    $('#generateButton')?.addEventListener('click', () => setTimeout(generateAcidPattern, 0));
    $('#drumRandom')?.addEventListener('click', () => setTimeout(advancedDrumRandom, 0));
    $('#clearButton')?.addEventListener('click', () => setTimeout(syncNotePickers, 0));
    document.addEventListener('keydown', e => {
      const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
      if (!typing && e.key?.toLowerCase() === 'r') setTimeout(generateAcidPattern, 0);
    });
  }

  function init() {
    installNotePickers();
    hookRandomizers();
    setTimeout(syncNotePickers, 30);
  }

  window.addEventListener('DOMContentLoaded', init);
})();