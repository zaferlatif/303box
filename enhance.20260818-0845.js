(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lang = () => document.documentElement.lang === 'tr' ? 'tr' : 'en';

  const TEXT = {
    en: {
      navSequencer:'Sequencer', navDrums:'Drums', navGuide:'Guide', navHistory:'History', navFaq:'FAQ',
      how:'How it works', author:'Author',
      midiTitle:'MIDI OUT', midiConnect:'Connect', midiConnected:'Connected', midiUnsupported:'Not supported', midiOutput:'Output', midiChannel:'Channel', midiMode:'Mode', midiClock:'Clock', browser:'Browser', both:'Browser + MIDI', midiOnly:'MIDI only',
      scope:'SCOPE', spectrum:'FFT', waiting:'Waiting',
      drumKicker:'RHYTHM MACHINE', drumTitle:'Acid drum grid', drumLead:'A 16-step drum machine built around classic 808, 909 and 606 character. Click a square to add or remove a hit.', playDrums:'PLAY DRUMS', stopDrums:'STOP DRUMS', random:'RANDOMIZE', clearDrums:'CLEAR DRUMS', density:'Density', sync:'Sync start to 303', syncHelp:'If the bass line is already playing, drums enter on the next step 1.', voice:'Voice', level:'Level', mixer:'MIXER', bass303:'303', drums:'DRUMS',
      bd:'Bass Drum', sd:'Snare', cp:'Clap', tm:'Tom', ch:'Closed Hat', oh:'Open Hat',
      dna:'DRUM DNA', d808:'TR-808', d808p:'All-analog, round and deep. Famous for its long low-end kick, clap and tom character.', d909:'TR-909', d909p:'Harder and punchier. Analog kick/snare/clap/toms with digital cymbal samples; foundational for house and techno.', d606:'TR-606', d606p:'Dry, compact and metallic. Originally designed as a companion to the TB-303, so its hats and percussion sit naturally around acid bass.',
      guideK:'SEQUENCER FIELD GUIDE', guideT:'Complete sequencer guide', guideP:'Build the rhythm first, then pitch and movement. The grid is simple on purpose.', gateT:'Gate / envelope', noteOn:'Note on', noteOnP:'Starts a new note and retriggers the envelope.', tie:'Tie', tieP:'Keeps the gate open into the next step.', rest:'Rest', restP:'No trigger. Silence creates bounce.', pitchT:'Pitch & dynamics', oct:'Octave', octP:'Moves the pitch one octave down or up.', acc:'Accent', accP:'Adds impact and stronger filter movement.', slide:'Slide', slideP:'Glides toward the next pitch.', knobT:'Analog controls', cut:'Cutoff', cutP:'Sets the base filter opening.', res:'Resonance', resP:'Emphasizes the cutoff point and creates the acid edge.', env:'Env Mod / Decay', envP:'Controls how strongly and how long the filter envelope moves.', recipe:'Starting point', recipeP:'Use a small note set, leave rests, keep resonance high, start cutoff low, then place accents and slides where the groove needs pressure.',
      histK:'THE 303 STORY', histT:'A machine that failed forward.', histP:'From an unsuccessful bass replacement to one of electronic music’s defining instruments.', sources:'Sources',
      footer:'303box is a Z3Z project.', follow:'Z3Z / @zafer.pro'
    },
    tr: {
      navSequencer:'Sequencer', navDrums:'Davullar', navGuide:'Rehber', navHistory:'Tarihçe', navFaq:'SSS',
      how:'Nasıl çalışır?', author:'Hazırlayan',
      midiTitle:'MIDI ÇIKIŞI', midiConnect:'Bağla', midiConnected:'Bağlı', midiUnsupported:'Desteklenmiyor', midiOutput:'Çıkış', midiChannel:'Kanal', midiMode:'Mod', midiClock:'Clock', browser:'Tarayıcı', both:'Tarayıcı + MIDI', midiOnly:'Yalnızca MIDI',
      scope:'SCOPE', spectrum:'FFT', waiting:'Bekleniyor',
      drumKicker:'RİTİM MAKİNESİ', drumTitle:'Acid drum grid', drumLead:'Klasik 808, 909 ve 606 karakteri etrafında kurulmuş 16 adımlı drum machine. Bir vuruş eklemek veya kaldırmak için kareye dokun.', playDrums:'DAVULLARI ÇAL', stopDrums:'DAVULLARI DURDUR', random:'RASTGELE ÜRET', clearDrums:'DAVULLARI TEMİZLE', density:'Yoğunluk', sync:'303 başlangıcına senkronla', syncHelp:'Bas hattı zaten çalıyorsa davullar bir sonraki 1. adımda devreye girer.', voice:'Ses', level:'Seviye', mixer:'MİKSER', bass303:'303', drums:'DAVUL',
      bd:'Bas Davul', sd:'Trampet', cp:'Clap', tm:'Tom', ch:'Kapalı Hi-Hat', oh:'Açık Hi-Hat',
      dna:'DRUM DNA', d808:'TR-808', d808p:'Tam analog, yuvarlak ve derin. Uzayan alt frekanslı kick, clap ve tom karakteriyle tanınır.', d909:'TR-909', d909p:'Daha sert ve vurucu. Analog kick/snare/clap/tom ile dijital zil sample’larını birleştirir; house ve techno’nun temel seslerinden biridir.', d606:'TR-606', d606p:'Kuru, kompakt ve metalik. TB-303’e eşlik etmesi için tasarlandığından hi-hat ve perküsyonları acid basın çevresine doğal biçimde oturur.',
      guideK:'SEQUENCER KULLANIM REHBERİ', guideT:'303 sequencer rehberi', guideP:'Önce ritmi, sonra perdeyi ve hareketi kur. Grid bilerek sade tutuldu.', gateT:'Tetik / zarf', noteOn:'Nota tetikle', noteOnP:'Yeni notayı başlatır ve zarfı yeniden tetikler.', tie:'Bağ', tieP:'Tetiği sonraki adıma açık tutar.', rest:'Es', restP:'Tetik yoktur. Sessizlik groove’a hareket verir.', pitchT:'Perde ve dinamik', oct:'Oktav', octP:'Perdeyi bir oktav aşağı veya yukarı taşır.', acc:'Vurgu', accP:'Daha sert vuruş ve daha güçlü filtre hareketi verir.', slide:'Slide', slideP:'Bir sonraki perdeye kayar.', knobT:'Analog kontroller', cut:'Cutoff', cutP:'Filtrenin temel açıklığını belirler.', res:'Rezonans', resP:'Cutoff noktasını vurgular ve acid karakterini oluşturur.', env:'Env Mod / Decay', envP:'Filtre zarfının ne kadar güçlü ve ne kadar uzun hareket edeceğini belirler.', recipe:'Başlangıç noktası', recipeP:'Nota havuzunu küçük tut, es bırak, rezonansı yüksek ve cutoff’u düşük başlat; vurgu ve slide’ı groove’un baskı istediği yerlere koy.',
      histK:'303 TARİHÇESİ', histT:'Başarısız olup geleceği değiştiren makine.', histP:'Başarısız bir bas eşlik cihazından elektronik müziğin en belirleyici enstrümanlarından birine.', sources:'Kaynaklar',
      footer:'303box bir Z3Z projesidir.', follow:'Z3Z / @zafer.pro'
    }
  };

  const HISTORY = {
    en: [
      ['1981','TB-303 and TR-606 arrive','Roland releases the TB-303 Bass Line and TR-606 Drumatix. The 606 is designed as the 303’s rhythm companion.',['Tadao Kikumoto','TB-303','TR-606']],
      ['1983','The commercial run ends','The 303 leaves production and becomes inexpensive on the second-hand market.',['Second-hand era']],
      ['1985','Phuture discovers the squelch','DJ Pierre, Spanky and Herb J experiment with a used 303; Ron Hardy champions the early track at Chicago’s Music Box.',['Phuture','DJ Pierre','Ron Hardy']],
      ['1987','“Acid Tracks”','Phuture’s defining 303 record is officially released on Trax Records.',['Trax Records','“Acid Tracks”']],
      ['1988','Second Summer of Love','Acid crosses the Atlantic and becomes central to UK club and rave culture. A Guy Called Gerald releases “Voodoo Ray.”',['A Guy Called Gerald','“Voodoo Ray”']],
      ['1992','Hardfloor pushes it harder','“Acperience 1” turns layered 303 lines into a blueprint for acid techno and trance.',['Hardfloor','“Acperience 1”']],
      ['1995','Higher State','Josh Wink drives the 303 back into peak-time rave culture with “Higher State of Consciousness.”',['Josh Wink','“Higher State of Consciousness”']],
      ['Today','The language survives','Original units, clones and software keep the 303 vocabulary active across house, techno, trance and experimental music.',['Hardware','Software','Clones']]
    ],
    tr: [
      ['1981','TB-303 ve TR-606 çıkıyor','Roland TB-303 Bass Line ve TR-606 Drumatix’i piyasaya çıkarır. 606, 303’e ritim eşliği verecek cihaz olarak tasarlanır.',['Tadao Kikumoto','TB-303','TR-606']],
      ['1983','Ticari dönem bitiyor','303 üretimden kalkar ve ikinci el piyasasında ucuzlamaya başlar.',['İkinci el dönemi']],
      ['1985','Phuture o sesi buluyor','DJ Pierre, Spanky ve Herb J ikinci el bir 303 ile deney yapar; Ron Hardy erken kaydı Chicago’daki Music Box’ta çalar.',['Phuture','DJ Pierre','Ron Hardy']],
      ['1987','“Acid Tracks”','Phuture’un 303’ü tanımlayan kaydı Trax Records’tan resmen yayımlanır.',['Trax Records','“Acid Tracks”']],
      ['1988','Second Summer of Love','Acid Atlantik’i geçer ve İngiltere kulüp/rave kültürünün merkezine yerleşir. A Guy Called Gerald “Voodoo Ray”i yayımlar.',['A Guy Called Gerald','“Voodoo Ray”']],
      ['1992','Hardfloor sertleştiriyor','“Acperience 1”, katmanlı 303 hatlarını acid techno ve trance için bir şablona dönüştürür.',['Hardfloor','“Acperience 1”']],
      ['1995','Higher State','Josh Wink “Higher State of Consciousness” ile 303’ü yeniden peak-time rave kültürünün merkezine taşır.',['Josh Wink','“Higher State of Consciousness”']],
      ['Bugün','Dil hâlâ yaşıyor','Orijinal cihazlar, klonlar ve yazılım emülasyonları 303 dilini house, techno, trance ve deneysel müzikte canlı tutuyor.',['Donanım','Yazılım','Klonlar']]
    ]
  };

  const DRUMS = [
    {id:'bd', code:'BD', variants:[['808','TR-808'],['909','TR-909']]},
    {id:'sd', code:'SD', variants:[['808','TR-808'],['909','TR-909'],['606','TR-606']]},
    {id:'cp', code:'CP', variants:[['808','TR-808'],['909','TR-909']]},
    {id:'tm', code:'TM', variants:[['808','TR-808'],['606','TR-606']]},
    {id:'ch', code:'CH', variants:[['606','TR-606'],['808','TR-808'],['909','TR-909']]},
    {id:'oh', code:'OH', variants:[['606','TR-606'],['808','TR-808'],['909','TR-909']]}
  ];

  const drumState = {
    pattern:Object.fromEntries(DRUMS.map(v => [v.id, Array(16).fill(false)])),
    levels:Object.fromEntries(DRUMS.map(v => [v.id, 80])),
    variants:{bd:'808',sd:'808',cp:'808',tm:'808',ch:'606',oh:'606'},
    density:55, master:80, sync:true,
    playing:false, armed:false, ctx:null, masterNode:null, noise:null, timer:null, step:0, nextAt:0, armObserver:null
  };
  let bassLevel = clamp(Number(localStorage.getItem('303box-mix-303') ?? 80), 0, 100);

  function t(key){ return TEXT[lang()][key] ?? TEXT.en[key] ?? key; }

  function injectFavicon(){
    if ($('link[data-303-favicon]')) return;
    const l=document.createElement('link'); l.rel='icon'; l.type='image/svg+xml'; l.href='./favicon.svg?v=2'; l.setAttribute('data-303-favicon','1'); document.head.appendChild(l);
  }

  function cleanup(){
    ['#live','#drums','#guide','#history'].forEach(id => $(id)?.remove());
    $('.triangle-logo')?.remove();
    const facts=$$('.hero-facts > div'); if(facts.length>2) facts.slice(2).forEach(x=>x.remove());
    const how=$('.secondary-cta'); if(how){how.href='#guide'; how.textContent=t('how');}
    const author=$('#authorInput'); if(author && (author.value.trim()==='' || author.value.trim()==='DJ Pierre')){author.value='Z3Z'; author.dispatchEvent(new Event('input',{bubbles:true}));}
  }

  function noteSelects(){
    const opts=['','C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C'];
    $$('.note-input').forEach((input, i) => {
      if(input.dataset.selectEnhanced) return;
      input.dataset.selectEnhanced='1'; input.classList.add('note-source-hidden');
      const s=document.createElement('select'); s.className='cell-control note-picker'; s.dataset.notePicker=String(i); s.setAttribute('aria-label',`Note ${i+1}`);
      opts.forEach((n,idx)=>{const o=document.createElement('option');o.value=n;o.textContent=n || '—';if(idx===opts.length-1)o.dataset.topC='1';s.appendChild(o)});
      s.value=input.value || '';
      input.insertAdjacentElement('afterend',s);
      s.addEventListener('change',()=>{input.value=s.value;input.dispatchEvent(new Event('input',{bubbles:true}));});
    });
    const sync=()=>{$$('.note-input').forEach((input,i)=>{const s=$(`[data-note-picker="${i}"]`);if(s&&s.value!==input.value)s.value=input.value||''});requestAnimationFrame(sync)};
    requestAnimationFrame(sync);
  }

  function moveToolbar(){
    const toolbar=$('.workspace-toolbar'), sheet=$('#patternSheet'); if(!toolbar||!sheet)return;
    toolbar.classList.add('sheet-toolbar');
    sheet.appendChild(toolbar);
  }

  function miniIOHtml(){
    return `<section class="sheet-io" data-html2canvas-ignore="true">
      <div class="mini-analyzer">
        <div class="mini-analyzer-head"><span>${t('scope')}</span><strong id="fxNote">--</strong><b id="fxHz">-- Hz</b></div>
        <canvas id="fxScope" aria-label="303 oscilloscope"></canvas>
        <div class="mini-tabs"><button class="analyzer-tab active" data-mode="scope" type="button">${t('scope')}</button><button class="analyzer-tab" data-mode="spectrum" type="button">${t('spectrum')}</button></div>
      </div>
      <div class="midi-compact">
        <div class="midi-compact-head"><strong>${t('midiTitle')}</strong><span class="midi-badge" id="fxMidiBadge">MIDI</span></div>
        <div class="midi-compact-grid">
          <button id="fxMidiConnect" class="midi-connect" type="button">${t('midiConnect')}</button>
          <label><span>${t('midiOutput')}</span><select id="fxMidiOut" disabled><option>—</option></select></label>
          <label><span>${t('midiChannel')}</span><select id="fxMidiCh"></select></label>
          <label><span>${t('midiMode')}</span><select id="fxOutMode"><option value="browser">${t('browser')}</option><option value="both">${t('both')}</option><option value="midi">${t('midiOnly')}</option></select></label>
          <label class="midi-clock"><input id="fxClock" type="checkbox"><span>${t('midiClock')}</span></label>
        </div>
      </div>
    </section>`;
  }

  function mountMiniIO(){
    const sheet=$('#patternSheet'), hw=$('.hardware-strip'); if(!sheet||!hw)return;
    hw.insertAdjacentHTML('afterend',miniIOHtml());
  }

  function guideCol(num,title,items){return `<article class="guide-col"><span class="guide-num">${num}</span><h3>${t(title)}</h3>${items.map(x=>`<div class="guide-item"><span class="gchip ${x[3]||''}">${x[0]}</span><div><strong>${t(x[1])}</strong><p>${t(x[2])}</p></div></div>`).join('')}</article>`}
  function guideHtml(){return `<section class="field-guide" id="guide"><div class="shell"><div class="guide-top"><div><p class="eyebrow">${t('guideK')}</p><h2>${t('guideT')}</h2></div><p class="guide-lead">${t('guideP')}</p></div><div class="guide-board">${guideCol('01','gateT',[['●','noteOn','noteOnP'],['○','tie','tieP'],['–','rest','restP']])}${guideCol('02','pitchT',[['D/U','oct','octP'],['A','acc','accP','acid'],['S','slide','slideP','acid']])}${guideCol('03','knobT',[['CUT','cut','cutP'],['RES','res','resP'],['ENV','env','envP']])}</div><div class="recipe"><b>303</b><div><strong>${t('recipe')}</strong><p>${t('recipeP')}</p></div></div></div></section>`}

  function historyHtml(){return `<section class="history303" id="history"><div class="shell"><div class="history-top"><div><p class="eyebrow">${t('histK')}</p><h2>${t('histT')}</h2></div><p>${t('histP')}</p></div><div class="timeline">${HISTORY[lang()].map((x,i)=>`<article class="era ${i>=2&&i<=6?'key':''}"><time>${x[0]}</time><i></i><div><h3>${x[1]}</h3><p>${x[2]}</p><div class="era-tags">${x[3].map(y=>`<span>${y}</span>`).join('')}</div></div></article>`).join('')}</div><p class="history-sources">${t('sources')}: <a href="https://www.roland.com/global/promos/303day/" target="_blank" rel="noopener">Roland 303 Day</a> · <a href="https://www.roland.com/global/products/rc_tr-606/specifications/" target="_blank" rel="noopener">Roland TR-606</a></p></div></section>`}

  function drumHtml(){
    const heads=Array.from({length:16},(_,i)=>`<span class="drum-step-head ${[0,4,8,12].includes(i)?'downbeat':''}">${i+1}</span>`).join('');
    const rows=DRUMS.map(v=>`<div class="drum-row"><div class="drum-voice"><button type="button" data-drum-preview="${v.id}"><b>${v.code}</b><span>${t(v.id)}</span></button><label><span>${t('voice')}</span><select data-drum-variant="${v.id}">${v.variants.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label><label class="voice-level"><span>${t('level')}</span><input type="range" min="0" max="100" value="80" data-drum-level="${v.id}"></label></div><div class="drum-steps">${Array.from({length:16},(_,i)=>`<button type="button" class="drum-step ${[0,4,8,12].includes(i)?'downbeat':''}" data-drum="${v.id}" data-drum-step="${i}" aria-pressed="false"></button>`).join('')}</div></div>`).join('');
    return `<section class="drum-machine shell" id="drums"><div class="drum-intro"><div><p class="eyebrow">${t('drumKicker')}</p><h2>${t('drumTitle')}</h2></div><p>${t('drumLead')}</p></div><div class="drum-panel"><div class="drum-toolbar"><div class="drum-actions"><button id="drumPlay" class="drum-play" type="button"><i></i><span>${t('playDrums')}</span></button><button id="drumRandom" class="drum-action" type="button">${t('random')}</button><button id="drumClear" class="drum-action danger" type="button">${t('clearDrums')}</button></div><div class="drum-tools"><label class="drum-switch"><input id="drumSync" type="checkbox" checked><span><b>${t('sync')}</b><small>${t('syncHelp')}</small></span></label><label class="density"><span>${t('density')}</span><input id="drumDensity" type="range" min="15" max="100" value="55"><b id="drumDensityValue">55%</b></label><div class="mini-mixer"><strong>${t('mixer')}</strong><label><span>${t('bass303')}</span><input id="mix303" type="range" min="0" max="100" value="80"><b id="mix303Value">80%</b></label><label><span>${t('drums')}</span><input id="mixDrums" type="range" min="0" max="100" value="80"><b id="mixDrumsValue">80%</b></label></div></div></div><div class="drum-grid-scroll"><div class="drum-grid"><div></div><div class="drum-heads">${heads}</div>${rows}</div></div></div><div class="drum-dna"><div class="dna-title"><span>${t('dna')}</span></div><article><b>${t('d808')}</b><p>${t('d808p')}</p></article><article><b>${t('d909')}</b><p>${t('d909p')}</p></article><article><b>${t('d606')}</b><p>${t('d606p')}</p></article></div></section>`;
  }

  function mountContent(){
    const seq=$('#sequencer'); if(seq) seq.insertAdjacentHTML('afterend',drumHtml());
    const wf=$('#workflow'); if(wf) wf.outerHTML=guideHtml(); else $('#drums')?.insertAdjacentHTML('afterend',guideHtml());
    const ref=$('#reference'); if(ref) ref.outerHTML=historyHtml(); else $('#guide')?.insertAdjacentHTML('afterend',historyHtml());
    const nav=$('.nav'); if(nav) nav.innerHTML=`<a href="#sequencer">${t('navSequencer')}</a><a href="#drums">${t('navDrums')}</a><a href="#guide">${t('navGuide')}</a><a href="#history">${t('navHistory')}</a><a href="#faq">${t('navFaq')}</a>`;
  }

  function footer(){
    const f=$('.footer-inner'); if(!f)return;
    f.innerHTML=`<div class="z3z-credit"><span>${t('footer')}</span><a href="https://instagram.com/zafer.pro" target="_blank" rel="me noopener">${t('follow')}</a></div><div class="footer-links"><a href="#sequencer">${t('navSequencer')}</a><a href="#drums">${t('navDrums')}</a><a href="#history">${t('navHistory')}</a></div>`;
  }

  function persistDrums(){localStorage.setItem('303box-drums-v2',JSON.stringify({pattern:drumState.pattern,levels:drumState.levels,variants:drumState.variants,density:drumState.density,master:drumState.master,sync:drumState.sync}))}
  function loadDrums(){
    try{const d=JSON.parse(localStorage.getItem('303box-drums-v2')||'null');if(!d)return;DRUMS.forEach(v=>{if(Array.isArray(d.pattern?.[v.id])&&d.pattern[v.id].length===16)drumState.pattern[v.id]=d.pattern[v.id].map(Boolean);if(Number.isFinite(+d.levels?.[v.id]))drumState.levels[v.id]=clamp(+d.levels[v.id],0,100);if(v.variants.some(x=>x[0]===d.variants?.[v.id]))drumState.variants[v.id]=d.variants[v.id]});if(Number.isFinite(+d.density))drumState.density=clamp(+d.density,15,100);if(Number.isFinite(+d.master))drumState.master=clamp(+d.master,0,100);if(typeof d.sync==='boolean')drumState.sync=d.sync}catch(_){ }
  }
  function renderDrums(){
    DRUMS.forEach(v=>{drumState.pattern[v.id].forEach((on,i)=>{$(`[data-drum="${v.id}"][data-drum-step="${i}"]`)?.classList.toggle('on',on)});const lv=$(`[data-drum-level="${v.id}"]`);if(lv)lv.value=drumState.levels[v.id];const va=$(`[data-drum-variant="${v.id}"]`);if(va)va.value=drumState.variants[v.id]});
    $('#drumDensity').value=drumState.density; $('#drumDensityValue').textContent=`${drumState.density}%`; $('#drumSync').checked=drumState.sync; $('#mix303').value=bassLevel; $('#mix303Value').textContent=`${bassLevel}%`; $('#mixDrums').value=drumState.master; $('#mixDrumsValue').textContent=`${drumState.master}%`; setDrumMaster(); set303Level();
  }
  function randomizeDrums(){const d=drumState.density/100;for(let i=0;i<16;i++){const quarter=[0,4,8,12].includes(i),back=[4,12].includes(i),off=[2,6,10,14].includes(i),fill=i>=12;drumState.pattern.bd[i]=Math.random()<(quarter?.55+.32*d:.05+.2*d);drumState.pattern.sd[i]=Math.random()<(back?.46+.3*d:.015+.08*d);drumState.pattern.cp[i]=Math.random()<(back?.34+.25*d:.005+.04*d);drumState.pattern.tm[i]=Math.random()<(fill?.05+.18*d:.01+.04*d);const op=Math.random()<(off?.06+.25*d:.005+.04*d);drumState.pattern.oh[i]=op;drumState.pattern.ch[i]=!op&&Math.random()<(off?.36+.42*d:.12+.2*d)}if(!drumState.pattern.bd.some(Boolean))drumState.pattern.bd[0]=true;renderDrums();persistDrums()}
  function clearDrums(){DRUMS.forEach(v=>drumState.pattern[v.id].fill(false));renderDrums();persistDrums()}

  function bpm(){return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250)}
  function bassPlaying(){return $('#playButton')?.getAttribute('aria-pressed')==='true'}
  function bassStep(){const x=$('[data-step-header][data-playing="true"]');return x?Number(x.dataset.stepHeader):-1}

  async function ensureDrumAudio(){
    if(drumState.ctx&&drumState.ctx.state!=='closed'){await drumState.ctx.resume();return drumState.ctx}
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;const c=new C();await c.resume();drumState.ctx=c;const master=c.createGain(),comp=c.createDynamicsCompressor();comp.threshold.value=-8;comp.knee.value=10;comp.ratio.value=4;comp.attack.value=.002;comp.release.value=.15;master.connect(comp);comp.connect(c.destination);const noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;drumState.masterNode=master;drumState.noise=noise;setDrumMaster();return c;
  }
  function setDrumMaster(){if(drumState.masterNode&&drumState.ctx)drumState.masterNode.gain.setTargetAtTime((drumState.master/100)*.9,drumState.ctx.currentTime,.015)}
  function out(c,when,level){const g=c.createGain();g.gain.value=level;g.connect(drumState.masterNode);return g}
  function noise(c){const s=c.createBufferSource();s.buffer=drumState.noise;return s}
  function env(g,when,peak,dur){g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.001,peak),when+.002);g.gain.exponentialRampToValueAtTime(.0001,when+dur)}

  function kick(when,l,v){const c=drumState.ctx,o=c.createOscillator(),g=c.createGain(),dst=out(c,when,l);o.type='sine';if(v==='909'){o.frequency.setValueAtTime(175,when);o.frequency.exponentialRampToValueAtTime(52,when+.11);env(g,when,.95,.34)}else{o.frequency.setValueAtTime(105,when);o.frequency.exponentialRampToValueAtTime(43,when+.2);env(g,when,1,.58)}o.connect(g);g.connect(dst);o.start(when);o.stop(when+.65);if(v==='909'){const n=noise(c),hp=c.createBiquadFilter(),ng=c.createGain();hp.type='highpass';hp.frequency.value=2800;ng.gain.setValueAtTime(.14,when);ng.gain.exponentialRampToValueAtTime(.0001,when+.018);n.connect(hp);hp.connect(ng);ng.connect(dst);n.start(when);n.stop(when+.025)}}
  function snare(when,l,v){const c=drumState.ctx,dst=out(c,when,l*.82),n=noise(c),f=c.createBiquadFilter(),ng=c.createGain();f.type=v==='909'?'bandpass':'highpass';f.frequency.value=v==='606'?1800:(v==='909'?1250:850);f.Q.value=v==='909'?.8:.4;env(ng,when,v==='606'?.55:.75,v==='606'?.12:.2);n.connect(f);f.connect(ng);ng.connect(dst);n.start(when);n.stop(when+.24);const freqs=v==='606'?[230]:v==='909'?[195]:[180,330];freqs.forEach((fr,i)=>{const o=c.createOscillator(),g=c.createGain();o.type=v==='808'?'triangle':'sine';o.frequency.value=fr;env(g,when,.32/(i+1),v==='606'?.09:.14);o.connect(g);g.connect(dst);o.start(when);o.stop(when+.17)})}
  function clap(when,l,v){const c=drumState.ctx,dst=out(c,when,l*.74),n=noise(c),bp=c.createBiquadFilter(),hp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=v==='909'?1700:1250;bp.Q.value=.7;hp.type='highpass';hp.frequency.value=v==='909'?750:520;g.gain.setValueAtTime(.0001,when);const bursts=v==='909'?[[0,.95],[.014,.0001],[.024,.8],[.038,.0001],[.048,.66],[.065,.0001],[.074,.35]]:[[0,.88],[.018,.0001],[.029,.7],[.046,.0001],[.058,.56],[.08,.0001],[.09,.42]];bursts.forEach(([d,x])=>g.gain.setValueAtTime(Math.max(.0001,x),when+d));g.gain.exponentialRampToValueAtTime(.0001,when+(v==='909'?.22:.3));n.connect(bp);bp.connect(hp);hp.connect(g);g.connect(dst);n.start(when);n.stop(when+.32)}
  function tom(when,l,v){const c=drumState.ctx,dst=out(c,when,l*.8),o=c.createOscillator(),g=c.createGain();o.type=v==='606'?'triangle':'sine';o.frequency.setValueAtTime(v==='606'?170:135,when);o.frequency.exponentialRampToValueAtTime(v==='606'?105:78,when+.2);env(g,when,.8,v==='606'?.24:.42);o.connect(g);g.connect(dst);o.start(when);o.stop(when+.46)}
  function hat(when,l,open,v){const c=drumState.ctx,dst=out(c,when,l*(open?.48:.36)),g=c.createGain(),hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=v==='909'?6500:(v==='808'?5400:5800);const dur=open?(v==='909'?.5:.42):(v==='606'?.07:.09);env(g,when,.7,dur);if(v==='909'){const n=noise(c);n.connect(hp);hp.connect(g);g.connect(dst);n.start(when);n.stop(when+dur+.02)}else{const mix=c.createGain();mix.connect(hp);hp.connect(g);g.connect(dst);(v==='808'?[205,304,369,522,613,812]:[230,347,419,527,677,823]).forEach(fr=>{const o=c.createOscillator();o.type='square';o.frequency.value=fr;o.connect(mix);o.start(when);o.stop(when+dur+.03)})}}
  function playVoice(id,when){const l=drumState.levels[id]/100;if(l<=.001)return;const v=drumState.variants[id];if(id==='bd')kick(when,l,v);else if(id==='sd')snare(when,l,v);else if(id==='cp')clap(when,l,v);else if(id==='tm')tom(when,l,v);else if(id==='ch')hat(when,l,false,v);else if(id==='oh')hat(when,l,true,v)}

  function scheduleDrumVisual(step,when){const delay=Math.max(0,(when-drumState.ctx.currentTime)*1000);setTimeout(()=>{if(!drumState.playing)return;$$('.drum-step[data-current]').forEach(x=>x.removeAttribute('data-current'));$$(`[data-drum-step="${step}"]`).forEach(x=>x.setAttribute('data-current','true'))},delay)}
  function drumScheduler(){if(!drumState.playing||!drumState.ctx)return;while(drumState.nextAt<drumState.ctx.currentTime+.12){const s=drumState.step;DRUMS.forEach(v=>{if(drumState.pattern[v.id][s])playVoice(v.id,drumState.nextAt)});scheduleDrumVisual(s,drumState.nextAt);drumState.nextAt+=(60/bpm())/4;drumState.step=(drumState.step+1)%16}drumState.timer=setTimeout(drumScheduler,25)}
  async function startDrums(){if(drumState.playing)return;const c=await ensureDrumAudio();if(!c)return;drumState.armed=false;drumState.playing=true;drumState.step=0;drumState.nextAt=c.currentTime+.04;updateDrumButton();drumScheduler()}
  function armDrums(){drumState.armed=true;updateDrumButton();const target=$('#stepHeaderRow');const check=()=>{if(drumState.armed&&bassStep()===0){drumState.armObserver?.disconnect();drumState.armObserver=null;startDrums()}};drumState.armObserver=new MutationObserver(check);if(target)drumState.armObserver.observe(target,{attributes:true,subtree:true,attributeFilter:['data-playing']});check()}
  function stopDrums(){if(drumState.timer)clearTimeout(drumState.timer);drumState.timer=null;drumState.playing=false;drumState.armed=false;drumState.armObserver?.disconnect();drumState.armObserver=null;$$('.drum-step[data-current]').forEach(x=>x.removeAttribute('data-current'));updateDrumButton()}
  function toggleDrums(){if(drumState.playing||drumState.armed){stopDrums();return}if(drumState.sync&&bassPlaying()){armDrums();return}startDrums()}
  function updateDrumButton(){const b=$('#drumPlay');if(!b)return;b.classList.toggle('playing',drumState.playing||drumState.armed);b.querySelector('span').textContent=drumState.playing?t('stopDrums'):(drumState.armed?'SYNC…':t('playDrums'))}

  const nativeConnect=window.AudioNode?.prototype?.connect;
  const taps=new WeakMap(), internal=new WeakSet();
  let mainTap=null, analyzerMode='scope';
  function set303Level(){if(mainTap&&mainTap.ctx.state!=='closed'){const mode=$('#fxOutMode')?.value||'browser';mainTap.mon.gain.setTargetAtTime(mode==='midi'?0:bassLevel/100,mainTap.ctx.currentTime,.015)}}
  if(nativeConnect){window.AudioNode.prototype.connect=function(dest,...args){try{const ctx=this?.context;if(ctx&&dest===ctx.destination&&!internal.has(this)&&ctx!==drumState.ctx){let x=taps.get(ctx);if(!x){const an=ctx.createAnalyser(),mon=ctx.createGain();an.fftSize=1024;an.smoothingTimeConstant=.68;mon.gain.value=bassLevel/100;internal.add(an);internal.add(mon);nativeConnect.call(an,mon);nativeConnect.call(mon,dest);x={ctx,an,mon};taps.set(ctx,x)}mainTap=x;nativeConnect.call(this,x.an);set303Level();return dest}}catch(_){ }return nativeConnect.call(this,dest,...args)}}

  function canvas(){const c=$('#fxScope');if(!c)return null;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h}return[c,c.getContext('2d'),w,h]}
  function nearest(hz){if(!hz||hz<20)return'--';const m=Math.round(69+12*Math.log2(hz/440)),n=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];return n[(m%12+12)%12]+(Math.floor(m/12)-1)}
  function peak(a){if(!mainTap)return;let m=0,ix=0,per=mainTap.ctx.sampleRate/mainTap.an.fftSize;for(let i=1;i<a.length&&i*per<4000;i++)if(a[i]>m){m=a[i];ix=i}const hz=m<16?0:ix*per;$('#fxHz').textContent=hz?`${Math.round(hz)} Hz`:'-- Hz';$('#fxNote').textContent=nearest(hz)}
  function draw(){requestAnimationFrame(draw);const q=canvas();if(!q)return;const[,g,w,h]=q;g.clearRect(0,0,w,h);g.strokeStyle='rgba(221,255,55,.22)';g.lineWidth=1;g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();if(!mainTap||mainTap.ctx.state==='closed')return;if(analyzerMode==='spectrum'){const a=new Uint8Array(mainTap.an.frequencyBinCount);mainTap.an.getByteFrequencyData(a);const n=Math.min(a.length,100),bw=w/n;g.fillStyle='#ddff37';for(let i=0;i<n;i++){const v=a[i]/255,bh=v*h*.86;g.globalAlpha=.18+v*.82;g.fillRect(i*bw,h-bh,Math.max(1,bw*.65),bh)}g.globalAlpha=1;peak(a)}else{const a=new Uint8Array(mainTap.an.fftSize);mainTap.an.getByteTimeDomainData(a);g.strokeStyle='#ddff37';g.lineWidth=2;g.beginPath();a.forEach((v,i)=>{const x=i/(a.length-1)*w,y=v/255*h;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();const f=new Uint8Array(mainTap.an.frequencyBinCount);mainTap.an.getByteFrequencyData(f);peak(f)}}

  let midiAccess=null,midiTimer=null,midiStep=0,midiNext=0;
  let midiOutId=localStorage.getItem('303-midi-output')||'', midiChannel=clamp(Number(localStorage.getItem('303-midi-channel'))||1,1,16), midiClock=localStorage.getItem('303-midi-clock')==='1', outMode=localStorage.getItem('303-out-mode')||'browser';
  const midiOut=()=>midiAccess?.outputs.get(midiOutId)||null;
  function noteNum(n,o){const map={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};let x=map[n];if(x==null)return null;if(o==='D')x-=12;if(o==='U')x+=12;return clamp(x,0,127)}
  function pstep(i){return{note:$$('.note-input')[i]?.value?.trim().toUpperCase()||'',oct:$$('.octave-cell')[i]?.textContent?.trim()||'',as:$$('.accentSlide-cell')[i]?.textContent?.trim()||'',gate:$$('.gate-cell')[i]?.textContent?.trim()||''}}
  function midiSchedule(i,when,dur){const o=midiOut();if(!o)return;const d=pstep(i),n=noteNum(d.note,d.oct);if(n==null||d.gate==='-')return;const on=0x90+(midiChannel-1),off=0x80+(midiChannel-1),vel=d.as.includes('A')?118:88;o.send([on,n,vel],when);o.send([off,n,0],when+(d.gate==='○'||d.as.includes('S')?dur*1.08:dur*.66))}
  function midiTick(){if(!midiTimer)return;const o=midiOut();if(!o){midiStop(false);return}const now=performance.now(),dur=60000/bpm()/4;while(midiNext<now+120){midiSchedule(midiStep,midiNext,dur);if(midiClock){const tick=60000/bpm()/24;for(let j=0;j<6;j++)o.send([0xF8],midiNext+j*tick)}midiNext+=dur;midiStep=(midiStep+1)%16}midiTimer=setTimeout(midiTick,25)}
  function midiStart(){if(outMode==='browser')return;const o=midiOut();if(!o)return;midiStop(false);if(midiClock)o.send([0xFA]);midiStep=0;midiNext=performance.now()+50;midiTimer=setTimeout(midiTick,0)}
  function midiStop(send=true){if(midiTimer)clearTimeout(midiTimer);midiTimer=null;const o=midiOut();if(o){try{o.clear();o.send([0xB0+(midiChannel-1),123,0]);if(send&&midiClock)o.send([0xFC])}catch(_){}}}
  async function connectMidi(){if(!navigator.requestMIDIAccess){$('#fxMidiBadge').textContent=t('midiUnsupported');return}try{midiAccess=await navigator.requestMIDIAccess();midiAccess.onstatechange=refreshMidi;refreshMidi()}catch(_){$('#fxMidiBadge').textContent=t('midiUnsupported')}}
  function refreshMidi(){const s=$('#fxMidiOut'),a=midiAccess?[...midiAccess.outputs.values()].filter(x=>x.state!=='disconnected'):[];s.disabled=false;s.innerHTML='<option value="">—</option>'+a.map(x=>`<option value="${x.id}">${[x.manufacturer,x.name].filter(Boolean).join(' — ')}</option>`).join('');if(a.some(x=>x.id===midiOutId))s.value=midiOutId;else if(a.length===1){midiOutId=a[0].id;s.value=midiOutId}$('#fxMidiBadge').textContent=a.length?t('midiConnected'):'MIDI';$('#fxMidiConnect').textContent=t('midiConnected')}

  function bind(){
    loadDrums();renderDrums();
    $('#drums').addEventListener('click',e=>{const st=e.target.closest('.drum-step');if(st){const id=st.dataset.drum,i=+st.dataset.drumStep;drumState.pattern[id][i]=!drumState.pattern[id][i];if(drumState.pattern[id][i]&&id==='ch')drumState.pattern.oh[i]=false;if(drumState.pattern[id][i]&&id==='oh')drumState.pattern.ch[i]=false;renderDrums();persistDrums()}const pv=e.target.closest('[data-drum-preview]');if(pv)ensureDrumAudio().then(()=>playVoice(pv.dataset.drum,drumState.ctx.currentTime+.015))});
    $('#drumPlay').addEventListener('click',toggleDrums);$('#drumRandom').addEventListener('click',randomizeDrums);$('#drumClear').addEventListener('click',clearDrums);
    $$('#drums [data-drum-variant]').forEach(x=>x.addEventListener('change',e=>{drumState.variants[e.target.dataset.drumVariant]=e.target.value;persistDrums()}));
    $$('#drums [data-drum-level]').forEach(x=>x.addEventListener('input',e=>{drumState.levels[e.target.dataset.drumLevel]=+e.target.value;persistDrums()}));
    $('#drumDensity').addEventListener('input',e=>{drumState.density=+e.target.value;$('#drumDensityValue').textContent=`${drumState.density}%`;persistDrums()});
    $('#drumSync').addEventListener('change',e=>{drumState.sync=e.target.checked;persistDrums()});
    $('#mix303').addEventListener('input',e=>{bassLevel=+e.target.value;$('#mix303Value').textContent=`${bassLevel}%`;localStorage.setItem('303box-mix-303',bassLevel);set303Level()});
    $('#mixDrums').addEventListener('input',e=>{drumState.master=+e.target.value;$('#mixDrumsValue').textContent=`${drumState.master}%`;setDrumMaster();persistDrums()});
    $$('.analyzer-tab').forEach(b=>b.addEventListener('click',()=>{analyzerMode=b.dataset.mode;$$('.analyzer-tab').forEach(x=>x.classList.toggle('active',x===b))}));
    const ch=$('#fxMidiCh');for(let i=1;i<=16;i++)ch.insertAdjacentHTML('beforeend',`<option value="${i}">${i}</option>`);ch.value=midiChannel;$('#fxOutMode').value=outMode;$('#fxClock').checked=midiClock;
    $('#fxMidiConnect').addEventListener('click',connectMidi);$('#fxMidiOut').addEventListener('change',e=>{midiOutId=e.target.value;localStorage.setItem('303-midi-output',midiOutId)});ch.addEventListener('change',e=>{midiChannel=+e.target.value;localStorage.setItem('303-midi-channel',midiChannel)});$('#fxClock').addEventListener('change',e=>{midiClock=e.target.checked;localStorage.setItem('303-midi-clock',midiClock?'1':'0')});$('#fxOutMode').addEventListener('change',e=>{outMode=e.target.value;localStorage.setItem('303-out-mode',outMode);set303Level();if(bassPlaying()){outMode==='browser'?midiStop():midiStart()}});
    const pb=$('#playButton');if(pb)new MutationObserver(()=>{bassPlaying()?midiStart():midiStop()}).observe(pb,{attributes:true,attributeFilter:['aria-pressed']});
    draw();
  }

  function init(){
    injectFavicon(); cleanup(); noteSelects(); moveToolbar(); mountMiniIO(); mountContent(); footer(); bind();
    new MutationObserver(()=>{location.reload()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
