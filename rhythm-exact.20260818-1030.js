(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isTR = () => document.documentElement.lang === 'tr';

  const VOICES = {
    bd: { fixed: true, value: '909bd', label: 'TR-909 BD' },
    sd: { fixed: true, value: '606sd', label: 'TR-606 SD' },
    cp: {
      fixed: false,
      options: [
        ['808clap', 'TR-808 Clap'],
        ['noiseTom', 'Noise Tom'],
        ['606highTom', 'TR-606 High Tom']
      ],
      def: '808clap'
    },
    tm: {
      fixed: false,
      options: [
        ['808lowTom', 'TR-808 Low Tom'],
        ['606lowTom', 'TR-606 Low Tom']
      ],
      def: '808lowTom'
    },
    ch: { fixed: true, value: '606ch', label: 'TR-606 CH' },
    oh: { fixed: true, value: '606oh', label: 'TR-606 OH' }
  };

  const STORE = '303box-rhythm-exact-voices-v1';
  let choices = { cp: '808clap', tm: '808lowTom' };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (VOICES.cp.options.some(x => x[0] === saved?.cp)) choices.cp = saved.cp;
    if (VOICES.tm.options.some(x => x[0] === saved?.tm)) choices.tm = saved.tm;
  } catch (_) {}

  function saveChoices() {
    localStorage.setItem(STORE, JSON.stringify(choices));
  }

  function configureVoiceSelectors() {
    if (!$('#drums')) return;
    Object.entries(VOICES).forEach(([id, spec]) => {
      const select = $(`[data-variant="${id}"]`);
      if (!select) return;
      select.innerHTML = '';
      if (spec.fixed) {
        const option = new Option(spec.label, spec.value, true, true);
        select.appendChild(option);
        select.value = spec.value;
        select.disabled = true;
        select.classList.add('voice-fixed');
        select.setAttribute('aria-label', `${id.toUpperCase()} ${spec.label}`);
      } else {
        spec.options.forEach(([value, label]) => select.appendChild(new Option(label, value)));
        select.disabled = false;
        select.classList.remove('voice-fixed');
        select.value = choices[id] || spec.def;
        select.onchange = () => {
          choices[id] = select.value;
          saveChoices();
        };
      }
    });
  }

  function updatePaletteCopy() {
    const intro = $('.drum-intro > p');
    if (intro) {
      intro.textContent = isTR()
        ? '303 ile aynı BPM’de çalışan altı kanallı ritim bölümü. Ses haritası sabittir: 909 bas davul, 606 trampet ve hi-hat’ler; clap ve tom bölümlerinde yalnız donanımda bulunan gerçek alternatifler seçilebilir.'
        : 'A synchronized six-part rhythm section. Its voice map is fixed: 909 bass drum, 606 snare and hi-hats, with only the real clap and tom alternatives available.';
    }
    const dna = $('.drum-dna');
    if (dna) {
      dna.innerHTML = isTR() ? `
        <div class="dna-title"><span>RİTİM SES HARİTASI</span><small>Her satırda rastgele 808/909 seçimi yok. Yalnız gerçekten değiştirilebilen Clap ve Tom bölümleri seçim sunar.</small></div>
        <article><b>TR-909 BD</b><p>Bas davul sabittir.</p></article>
        <article><b>TR-606 SD / CH / OH</b><p>Trampet ve iki hi-hat sabittir.</p></article>
        <article><b>CLAP</b><p>TR-808 Clap / Noise Tom / TR-606 High Tom.</p></article>
        <article><b>TOM</b><p>TR-808 Low Tom / TR-606 Low Tom.</p></article>` : `
        <div class="dna-title"><span>RHYTHM VOICE MAP</span><small>There is no arbitrary 808/909 switch on every row. Only Clap and Tom expose the alternatives that actually exist in the source architecture.</small></div>
        <article><b>TR-909 BD</b><p>The bass drum is fixed.</p></article>
        <article><b>TR-606 SD / CH / OH</b><p>Snare and both hi-hats are fixed.</p></article>
        <article><b>CLAP</b><p>TR-808 Clap / Noise Tom / TR-606 High Tom.</p></article>
        <article><b>TOM</b><p>TR-808 Low Tom / TR-606 Low Tom.</p></article>`;
    }
  }

  // Dedicated rhythm preview engine. The pattern grid remains owned by the main studio layer;
  // this engine only replaces the previous generic 808/909 timbre switch with the exact voice map.
  const engine = {
    ctx: null,
    master: null,
    comp: null,
    noise: null,
    playing: false,
    armed: false,
    step: 0,
    next: 0,
    timer: null,
    armTimer: null
  };

  function bpm() {
    return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow')) || 140, 50, 250);
  }
  function bassPlaying() {
    return $('#playButton')?.getAttribute('aria-pressed') === 'true';
  }
  function bassStep() {
    const x = $('[data-step-header][data-playing="true"]');
    return x ? Number(x.dataset.stepHeader) : -1;
  }
  function masterLevel() {
    return clamp(Number($('#mixDrum')?.value) || 80, 0, 100) / 100;
  }
  function partLevel(id) {
    return clamp(Number($(`[data-level="${id}"]`)?.value) || 80, 0, 100) / 100;
  }
  function voiceFor(id) {
    if (VOICES[id]?.fixed) return VOICES[id].value;
    const select = $(`[data-variant="${id}"]`);
    const value = select?.value || choices[id] || VOICES[id]?.def;
    if (id === 'cp' && VOICES.cp.options.some(x => x[0] === value)) return value;
    if (id === 'tm' && VOICES.tm.options.some(x => x[0] === value)) return value;
    return VOICES[id]?.def;
  }

  async function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!engine.ctx || engine.ctx.state === 'closed') {
      const ctx = new AC();
      const master = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      master.gain.value = masterLevel();
      comp.threshold.value = -8;
      comp.knee.value = 10;
      comp.ratio.value = 3.2;
      comp.attack.value = .003;
      comp.release.value = .14;
      master.connect(comp);
      comp.connect(ctx.destination);
      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      engine.ctx = ctx;
      engine.master = master;
      engine.comp = comp;
      engine.noise = noise;
    }
    if (engine.ctx.state === 'suspended') await engine.ctx.resume();
    engine.master.gain.setTargetAtTime(masterLevel(), engine.ctx.currentTime, .015);
    return engine.ctx;
  }

  function outlet(level) {
    const g = engine.ctx.createGain();
    g.gain.value = level;
    g.connect(engine.master);
    return g;
  }
  function noiseSource() {
    const s = engine.ctx.createBufferSource();
    s.buffer = engine.noise;
    return s;
  }
  function expEnv(param, when, peak, duration, attack = .002) {
    param.setValueAtTime(.0001, when);
    param.exponentialRampToValueAtTime(Math.max(.001, peak), when + attack);
    param.exponentialRampToValueAtTime(.0001, when + duration);
  }

  function bassDrum909(when, level) {
    const c = engine.ctx;
    const dst = outlet(level * .98);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(175, when);
    osc.frequency.exponentialRampToValueAtTime(52, when + .085);
    osc.frequency.exponentialRampToValueAtTime(45, when + .31);
    expEnv(gain.gain, when, 1, .42, .0015);
    osc.connect(gain); gain.connect(dst);
    osc.start(when); osc.stop(when + .46);

    const click = noiseSource();
    const hp = c.createBiquadFilter();
    const cg = c.createGain();
    hp.type = 'highpass'; hp.frequency.value = 3200;
    cg.gain.setValueAtTime(.20, when);
    cg.gain.exponentialRampToValueAtTime(.0001, when + .018);
    click.connect(hp); hp.connect(cg); cg.connect(dst);
    click.start(when); click.stop(when + .022);
  }

  function snare606(when, level) {
    const c = engine.ctx;
    const dst = outlet(level * .82);
    const n = noiseSource();
    const hp = c.createBiquadFilter();
    const ng = c.createGain();
    hp.type = 'highpass'; hp.frequency.value = 2600;
    hp.Q.value = .5;
    expEnv(ng.gain, when, .72, .145, .001);
    n.connect(hp); hp.connect(ng); ng.connect(dst);
    n.start(when); n.stop(when + .18);
    [185, 330].forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      expEnv(g.gain, when, i ? .12 : .19, i ? .085 : .11, .001);
      o.connect(g); g.connect(dst);
      o.start(when); o.stop(when + .13);
    });
  }

  function clap808(when, level) {
    const c = engine.ctx;
    const dst = outlet(level * .78);
    const n = noiseSource();
    const bp = c.createBiquadFilter();
    const hp = c.createBiquadFilter();
    const g = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1350; bp.Q.value = .72;
    hp.type = 'highpass'; hp.frequency.value = 650;
    g.gain.setValueAtTime(.0001, when);
    [[0,.95],[.016,.001],[.031,.78],[.048,.001],[.063,.62],[.088,.001],[.098,.42]].forEach(([d,v]) => g.gain.setValueAtTime(v, when + d));
    g.gain.exponentialRampToValueAtTime(.0001, when + .34);
    n.connect(bp); bp.connect(hp); hp.connect(g); g.connect(dst);
    n.start(when); n.stop(when + .37);
  }

  function noiseTom(when, level) {
    const c = engine.ctx;
    const dst = outlet(level * .74);
    const n = noiseSource();
    const bp = c.createBiquadFilter();
    const ng = c.createGain();
    bp.type = 'bandpass'; bp.frequency.setValueAtTime(820, when); bp.Q.value = 2.7;
    bp.frequency.exponentialRampToValueAtTime(390, when + .22);
    expEnv(ng.gain, when, .75, .27, .001);
    n.connect(bp); bp.connect(ng); ng.connect(dst);
    n.start(when); n.stop(when + .3);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(205, when); o.frequency.exponentialRampToValueAtTime(125, when + .18);
    expEnv(g.gain, when, .22, .22, .001);
    o.connect(g); g.connect(dst); o.start(when); o.stop(when + .25);
  }

  function tom808Low(when, level) {
    const c = engine.ctx;
    const dst = outlet(level * .82);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(145, when);
    o.frequency.exponentialRampToValueAtTime(76, when + .2);
    expEnv(g.gain, when, .88, .42, .0015);
    o.connect(g); g.connect(dst); o.start(when); o.stop(when + .46);
    const n = noiseSource(); const bp = c.createBiquadFilter(); const ng = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = .8;
    expEnv(ng.gain, when, .10, .11, .001);
    n.connect(bp); bp.connect(ng); ng.connect(dst); n.start(when); n.stop(when + .13);
  }

  function tom606(when, level, high = false) {
    const c = engine.ctx;
    const dst = outlet(level * .78);
    const o = c.createOscillator();
    const g = c.createGain();
    const start = high ? 270 : 185;
    const end = high ? 165 : 108;
    o.type = 'triangle';
    o.frequency.setValueAtTime(start, when);
    o.frequency.exponentialRampToValueAtTime(end, when + .14);
    expEnv(g.gain, when, .72, high ? .22 : .28, .001);
    o.connect(g); g.connect(dst); o.start(when); o.stop(when + .31);
    const n = noiseSource(); const bp = c.createBiquadFilter(); const ng = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = high ? 1800 : 1200; bp.Q.value = 1.1;
    expEnv(ng.gain, when, .15, .09, .001);
    n.connect(bp); bp.connect(ng); ng.connect(dst); n.start(when); n.stop(when + .11);
  }

  function hat606(when, level, open) {
    const c = engine.ctx;
    const dst = outlet(level * (open ? .48 : .36));
    const mix = c.createGain();
    const hp = c.createBiquadFilter();
    const bp = c.createBiquadFilter();
    const g = c.createGain();
    hp.type = 'highpass'; hp.frequency.value = 6500;
    bp.type = 'bandpass'; bp.frequency.value = 10100; bp.Q.value = .75;
    const duration = open ? .33 : .058;
    expEnv(g.gain, when, .72, duration, .001);
    mix.connect(hp); hp.connect(bp); bp.connect(g); g.connect(dst);
    [310,451,603,787,991,1237].forEach(freq => {
      const o = c.createOscillator();
      o.type = 'square'; o.frequency.value = freq;
      o.connect(mix); o.start(when); o.stop(when + duration + .035);
    });
  }

  function playVoice(id, when) {
    const level = partLevel(id);
    if (level <= .001) return;
    const voice = voiceFor(id);
    if (id === 'bd') bassDrum909(when, level);
    else if (id === 'sd') snare606(when, level);
    else if (id === 'ch') hat606(when, level, false);
    else if (id === 'oh') hat606(when, level, true);
    else if (id === 'cp') {
      if (voice === 'noiseTom') noiseTom(when, level);
      else if (voice === '606highTom') tom606(when, level, true);
      else clap808(when, level);
    } else if (id === 'tm') {
      if (voice === '606lowTom') tom606(when, level, false);
      else tom808Low(when, level);
    }
  }

  function updatePlayButton() {
    const b = $('#drumPlay');
    if (!b) return;
    b.classList.toggle('playing', engine.playing);
    b.classList.toggle('armed', engine.armed);
    const label = b.querySelector('span');
    if (label) label.textContent = engine.armed
      ? (isTR() ? '1. ADIM BEKLENİYOR' : 'WAITING FOR STEP 1')
      : engine.playing
        ? (isTR() ? 'RİTMİ DURDUR' : 'STOP RHYTHM')
        : (isTR() ? 'RİTMİ ÇAL' : 'PLAY RHYTHM');
  }

  function scheduler() {
    if (!engine.playing || !engine.ctx) return;
    while (engine.next < engine.ctx.currentTime + .12) {
      const step = engine.step;
      ['bd','sd','cp','tm','ch','oh'].forEach(id => {
        if ($(`[data-drum="${id}"][data-step="${step}"]`)?.classList.contains('on')) playVoice(id, engine.next);
      });
      const delay = Math.max(0, (engine.next - engine.ctx.currentTime) * 1000);
      setTimeout(() => {
        if (!engine.playing) return;
        $$('.drum-step[data-current]').forEach(x => x.removeAttribute('data-current'));
        $$(`[data-step="${step}"]`).forEach(x => x.setAttribute('data-current','true'));
      }, delay);
      engine.next += (60 / bpm()) / 4;
      engine.step = (engine.step + 1) % 16;
    }
    engine.timer = setTimeout(scheduler, 25);
  }

  async function start() {
    if (engine.playing) return;
    const c = await ensureAudio();
    if (!c) return;
    engine.armed = false;
    engine.playing = true;
    engine.step = 0;
    engine.next = c.currentTime + .05;
    updatePlayButton();
    scheduler();
  }

  function arm() {
    engine.armed = true;
    updatePlayButton();
    clearInterval(engine.armTimer);
    engine.armTimer = setInterval(() => {
      if (!engine.armed) return clearInterval(engine.armTimer);
      if (bassStep() === 0) {
        clearInterval(engine.armTimer);
        engine.armTimer = null;
        start();
      }
    }, 12);
  }

  function stop() {
    clearTimeout(engine.timer);
    clearInterval(engine.armTimer);
    engine.timer = null;
    engine.armTimer = null;
    engine.playing = false;
    engine.armed = false;
    $$('.drum-step[data-current]').forEach(x => x.removeAttribute('data-current'));
    updatePlayButton();
  }

  function toggle() {
    if (engine.playing || engine.armed) return stop();
    if ($('#drumSync')?.checked && bassPlaying()) return arm();
    start();
  }

  // Capture before the older rhythm preview handlers so only this exact-map engine sounds.
  document.addEventListener('click', e => {
    const play = e.target.closest('#drumPlay');
    if (play) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggle();
      return;
    }
    const preview = e.target.closest('[data-preview]');
    if (preview && preview.closest('#drums')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      ensureAudio().then(c => { if (c) playVoice(preview.dataset.preview, c.currentTime + .015); });
    }
  }, true);

  document.addEventListener('input', e => {
    if (e.target?.id === 'mixDrum' && engine.ctx && engine.master) {
      engine.master.gain.setTargetAtTime(masterLevel(), engine.ctx.currentTime, .015);
    }
  });

  document.addEventListener('click', e => {
    if (e.target.closest('#drums')) setTimeout(configureVoiceSelectors, 0);
  });

  function init() {
    if (!$('#drums')) return setTimeout(init, 40);
    configureVoiceSelectors();
    updatePaletteCopy();
    updatePlayButton();
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(init, 80));
})();