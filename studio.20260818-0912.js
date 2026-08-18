(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lang = () => document.documentElement.lang === 'tr' ? 'tr' : 'en';

  const T = {
    en: {
      how:'How it works', navSequencer:'Sequencer', navDrums:'Rhythm', navGuide:'Guide', navHistory:'History', navFaq:'FAQ',
      pageTitle:'303box — 303 Acid Pattern & Rhythm Sequencer',
      pageDescription:'Build, hear, randomize and export 303 acid patterns with a synchronized 16-step rhythm machine, live scope and browser MIDI output.',
      heroLead:'Program notes, rests, ties, accents and slides. Shape the filter, build a synchronized rhythm, hear the result instantly and route the pattern to MIDI hardware.',
      faqOneA:'A free browser-based 16-step acid bassline and rhythm tool built around the classic 303 sequencing language.',
      scope:'SCOPE', spectrum:'FFT', midi:'MIDI', midiAccess:'Enable MIDI', midiGranted:'MIDI access granted', midiConnected:'MIDI connected', midiNoOutput:'No MIDI output', midiChoose:'Choose an output', midiUnsupported:'Web MIDI unsupported', midiDenied:'MIDI permission denied',
      midiOutput:'Output', midiChannel:'Channel', midiMode:'Playback', midiClock:'Clock', browser:'Browser', both:'Browser + MIDI', midiOnly:'MIDI only',
      drumKicker:'303 COMPANION RHYTHM', drumTitle:'A synchronized six-part rhythm machine.', drumLead:'A compact 16-step rhythm section tuned to sit beside a 303 line. It follows the same BPM, can start independently, and uses the same core drum palette found in a classic 303 companion workflow.',
      playDrums:'PLAY RHYTHM', stopDrums:'STOP RHYTHM', armed:'WAITING FOR STEP 1', random:'Randomize', clearDrums:'Clear', downloadDrums:'Download rhythm', sync:'Sync start to 303', syncHelp:'When the 303 is already playing, rhythm waits for the next step 1.', density:'Random density', mixer:'MIXER', bass303:'303', drums:'RHYTHM', voice:'Voice', level:'Level',
      bd:'Bass Drum', sd:'Snare Drum', cp:'Hand Clap', tm:'Tom', ch:'Closed Hi-Hat', oh:'Open Hi-Hat',
      kit:'RHYTHM DNA', kitLead:'Default palette: punchy 909 bass drum, dry 606 snare and hats, with 808 clap and low tom. Clap and tom keep the alternate voices available in the compact rhythm workflow.',
      d909:'909 — Bass Drum', d909p:'Shorter, punchier low-end with a defined attack. Used here as the default kick.', d606:'606 — Snare & Hi-Hats', d606p:'Dry, metallic and compact. The hats leave plenty of room for a resonant 303 line.', d808:'808 — Clap & Tom', d808p:'Broad hand clap and rounded low tom add body without crowding the bass line.',
      guideK:'303 FIELD GUIDE', guideT:'Read the pattern at a glance.', guideP:'Gate decides whether a note exists, pitch places it, and accent/slide create the movement.', gateT:'Gate / Envelope', noteOn:'Note On', noteOnP:'Starts a note and retriggers the envelope.', tie:'Tie', tieP:'Keeps the gate open into the next step.', rest:'Rest', restP:'Leaves silence and rhythmic space.', pitchT:'Pitch & Dynamics', oct:'Octave', octP:'Moves the note one octave down or up.', acc:'Accent', accP:'Hits harder and drives the filter envelope.', slide:'Slide', slideP:'Glides toward the following pitch.', knobT:'303 Controls', cut:'Cutoff', cutP:'Sets the base filter opening.', res:'Resonance', resP:'Emphasizes the cutoff point and acid edge.', env:'Env Mod / Decay', envP:'Shapes how strongly and how long the filter moves.', recipe:'Starting point', recipeP:'Use few notes, leave rests, keep resonance alive, then add accent and slide only where the groove needs pressure.',
      histK:'303 HISTORY', histT:'The machine that changed the language of dance music.', histP:'From a failed bass accompaniment box to the defining squelch of acid house and beyond.', sources:'References',
      footer:'303box is a Z3Z project.', follow:'Z3Z / @zafer.pro'
    },
    tr: {
      how:'Nasıl çalışır?', navSequencer:'Sequencer', navDrums:'Ritim', navGuide:'Rehber', navHistory:'Tarihçe', navFaq:'SSS',
      pageTitle:'303box — 303 Acid Pattern ve Ritim Sequencer',
      pageDescription:'303 acid pattern oluştur, dinle, rastgele üret ve dışa aktar; senkron 16 adımlı ritim makinesi, canlı scope ve tarayıcı MIDI çıkışı kullan.',
      heroLead:'Nota, es, bağ, vurgu ve slide adımlarını programla. Filtreyi şekillendir, senkron ritmi kur, sonucu anında dinle ve pattern’i MIDI donanımına gönder.',
      faqOneA:'Klasik 303 sequencer dilini temel alan, tarayıcıda çalışan ücretsiz 16 adımlı acid bas ve ritim aracıdır.',
      scope:'SCOPE', spectrum:'FFT', midi:'MIDI', midiAccess:'MIDI erişimini aç', midiGranted:'MIDI erişimi açık', midiConnected:'MIDI bağlı', midiNoOutput:'MIDI çıkışı yok', midiChoose:'Çıkış seç', midiUnsupported:'Web MIDI desteklenmiyor', midiDenied:'MIDI izni verilmedi',
      midiOutput:'Çıkış', midiChannel:'Kanal', midiMode:'Çalma', midiClock:'Clock', browser:'Tarayıcı', both:'Tarayıcı + MIDI', midiOnly:'Yalnızca MIDI',
      drumKicker:'303 EŞLİK RİTMİ', drumTitle:'Senkron altı kanallı ritim makinesi.', drumLead:'303 bas hattının yanında çalışacak şekilde kurulmuş kompakt 16 adımlı ritim bölümü. Aynı BPM’i takip eder, tek başına da başlayabilir ve klasik 303 eşlik akışındaki temel davul paletini kullanır.',
      playDrums:'RİTMİ ÇAL', stopDrums:'RİTMİ DURDUR', armed:'1. ADIM BEKLENİYOR', random:'Rastgele üret', clearDrums:'Temizle', downloadDrums:'Ritmi indir', sync:'303 başlangıcına senkronla', syncHelp:'303 zaten çalıyorsa ritim bir sonraki 1. adımı bekler.', density:'Rastgele yoğunluk', mixer:'MİKSER', bass303:'303', drums:'RİTİM', voice:'Ses', level:'Seviye',
      bd:'Bas Davul', sd:'Trampet', cp:'El Çırpma', tm:'Tom', ch:'Kapalı Hi-Hat', oh:'Açık Hi-Hat',
      kit:'RİTİM DNA', kitLead:'Varsayılan palet: tok 909 bas davul, kuru 606 trampet ve hi-hat’ler; 808 clap ve low tom. Clap ve tom için kompakt ritim akışındaki alternatif sesler de korunur.',
      d909:'909 — Bas Davul', d909p:'Daha kısa, tok ve belirgin ataklı alt frekans. Varsayılan kick olarak kullanılır.', d606:'606 — Trampet ve Hi-Hat', d606p:'Kuru, metalik ve kompakt. Rezonanslı 303 bas hattına geniş alan bırakır.', d808:'808 — Clap ve Tom', d808p:'Geniş clap ve yuvarlak low tom, bas hattını boğmadan gövde ekler.',
      guideK:'303 KULLANIM REHBERİ', guideT:'Pattern’i tek bakışta oku.', guideP:'Gate notanın var olup olmadığını belirler, perde yerini seçer, accent ve slide ise hareketi yaratır.', gateT:'Tetik / Zarf', noteOn:'Nota Açık', noteOnP:'Notayı başlatır ve zarfı yeniden tetikler.', tie:'Bağ', tieP:'Tetiği sonraki adıma açık tutar.', rest:'Es', restP:'Sessizlik ve ritmik boşluk bırakır.', pitchT:'Perde ve Dinamik', oct:'Oktav', octP:'Notayı bir oktav aşağı veya yukarı taşır.', acc:'Vurgu', accP:'Notayı sertleştirir ve filtre zarfını iter.', slide:'Slide', slideP:'Bir sonraki perdeye kaydırır.', knobT:'303 Kontrolleri', cut:'Cutoff', cutP:'Filtrenin temel açıklığını belirler.', res:'Rezonans', resP:'Cutoff noktasını ve acid karakterini belirginleştirir.', env:'Env Mod / Decay', envP:'Filtrenin ne kadar güçlü ve ne kadar uzun hareket edeceğini belirler.', recipe:'Başlangıç ayarı', recipeP:'Az nota kullan, es bırak, rezonansı canlı tut; vurgu ve slide’ı yalnız groove’un baskı istediği yerlere ekle.',
      histK:'303 TARİHÇESİ', histT:'Dans müziğinin dilini değiştiren makine.', histP:'Başarısız bir bas eşlik cihazından acid house’un belirleyici sesine ve ötesine uzanan yolculuk.', sources:'Kaynaklar',
      footer:'303box bir Z3Z projesidir.', follow:'Z3Z / @zafer.pro'
    }
  };
  const t = k => T[lang()][k] ?? T.en[k] ?? k;

  const HISTORY = {
    en:[['1981','TB-303 arrives','Roland releases Tadao Kikumoto’s TB-303 Bass Line, conceived as an automatic bass accompaniment instrument.',['Tadao Kikumoto','TB-303']],['1983','Production ends','The machine leaves production and becomes inexpensive on the second-hand market.',['Second-hand era']],['1985','Phuture finds the squelch','DJ Pierre, Spanky and Herb J push cutoff and resonance while a 303 pattern runs; Ron Hardy champions the sound at Music Box.',['Phuture','DJ Pierre','Ron Hardy']],['1987','“Acid Tracks”','Phuture’s “Acid Tracks” receives its official release and gives the emerging style its defining reference point.',['Phuture','“Acid Tracks”']],['1988','Acid crosses the Atlantic','The sound explodes through UK club and rave culture; A Guy Called Gerald releases “Voodoo Ray.”',['A Guy Called Gerald','“Voodoo Ray”']],['1992','Acid gets harder','Hardfloor’s “Acperience 1” pushes interlocking 303 lines into acid techno and trance territory.',['Hardfloor','“Acperience 1”']],['1995','Rave peak','Josh Wink’s “Higher State of Consciousness” drives the 303 sound into another generation of clubs and raves.',['Josh Wink','“Higher State of Consciousness”']],['Today','Still alive','Original units, modern hardware and software keep the 303 sequencing language active across electronic music.',['Hardware','Software','Acid']]],
    tr:[['1981','TB-303 ortaya çıkıyor','Roland, Tadao Kikumoto tasarımı TB-303 Bass Line’ı otomatik bas eşlik cihazı olarak piyasaya çıkarır.',['Tadao Kikumoto','TB-303']],['1983','Üretim sona eriyor','Cihaz üretimden kalkar ve ikinci el piyasasında ucuzlamaya başlar.',['İkinci el dönemi']],['1985','Phuture o sesi buluyor','DJ Pierre, Spanky ve Herb J pattern dönerken cutoff ve rezonansı zorlar; Ron Hardy bu sesi Music Box’ta sahiplenir.',['Phuture','DJ Pierre','Ron Hardy']],['1987','“Acid Tracks”','Phuture’un “Acid Tracks” kaydı resmen yayımlanır ve yeni stilin temel referanslarından biri olur.',['Phuture','“Acid Tracks”']],['1988','Acid Atlantik’i geçiyor','Ses İngiltere kulüp ve rave kültüründe patlar; A Guy Called Gerald “Voodoo Ray”i yayımlar.',['A Guy Called Gerald','“Voodoo Ray”']],['1992','Acid sertleşiyor','Hardfloor’un “Acperience 1”i birbirine geçen 303 hatlarını acid techno ve trance alanına taşır.',['Hardfloor','“Acperience 1”']],['1995','Rave zirvesi','Josh Wink’in “Higher State of Consciousness”ı 303 karakterini yeni bir kulüp ve rave kuşağına taşır.',['Josh Wink','“Higher State of Consciousness”']],['Bugün','Hâlâ yaşıyor','Orijinal cihazlar, modern donanımlar ve yazılımlar 303 sequencer dilini elektronik müzikte canlı tutuyor.',['Donanım','Yazılım','Acid']]]
  };

  const DRUMS = [
    {id:'bd',code:'BD',variants:[['909','909 BD']],def:'909'},
    {id:'sd',code:'SD',variants:[['606','606 SD']],def:'606'},
    {id:'cp',code:'CP',variants:[['808clap','808 Clap'],['noiseTom','Noise Tom'],['606tom','606 High Tom']],def:'808clap'},
    {id:'tm',code:'TM',variants:[['808lt','808 Low Tom'],['606lt','606 Low Tom']],def:'808lt'},
    {id:'ch',code:'CH',variants:[['606','606 CH']],def:'606'},
    {id:'oh',code:'OH',variants:[['606','606 OH']],def:'606'}
  ];

  const drumState = {
    pattern:Object.fromEntries(DRUMS.map(v=>[v.id,Array(16).fill(false)])),
    levels:Object.fromEntries(DRUMS.map(v=>[v.id,80])),
    variants:Object.fromEntries(DRUMS.map(v=>[v.id,v.def])),
    density:55, master:80, sync:true, playing:false, armed:false,
    ctx:null, masterNode:null, noise:null, timer:null, step:0, nextAt:0, observer:null
  };
  let bassLevel = clamp(Number(localStorage.getItem('303box-bass-level')) || 80, 0, 100);

  const nativeConnect = window.AudioNode?.prototype?.connect;
  const internal = new WeakSet();
  const bassBuses = new Map();
  let activeBus = null;
  let drumContext = null;
  let analyzerMode = 'scope';
  if (nativeConnect) {
    window.AudioNode.prototype.connect = function(dest, ...args) {
      try {
        const ctx = this?.context;
        if (ctx && dest === ctx.destination && ctx !== drumContext && !internal.has(this)) {
          let bus = bassBuses.get(ctx);
          if (!bus) {
            const gain = ctx.createGain();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048; analyser.smoothingTimeConstant = .72;
            internal.add(gain); internal.add(analyser);
            nativeConnect.call(gain, analyser); nativeConnect.call(analyser, dest);
            bus = {ctx,gain,analyser}; bassBuses.set(ctx,bus);
          }
          activeBus = bus;
          applyBassGain();
          nativeConnect.call(this,bus.gain);
          return dest;
        }
      } catch (e) { console.warn('303box audio bus', e); }
      return nativeConnect.call(this,dest,...args);
    };
  }
  function applyBassGain(){
    const mode = localStorage.getItem('303-midi-mode') || 'browser';
    const target = mode === 'midi' ? 0 : (bassLevel/100);
    bassBuses.forEach(b=>{try{b.gain.gain.setTargetAtTime(target,b.ctx.currentTime,.012)}catch(_){}});
  }

  function headSetup(){
    document.title=t('pageTitle');
    $('meta[name="description"]')?.setAttribute('content',t('pageDescription'));
    $('meta[name="twitter:description"]')?.setAttribute('content',t('pageDescription'));
    $('meta[property="og:description"]')?.setAttribute('content',t('pageDescription'));
  }

  function cleanup(){
    ['#drums','#guide','#history'].forEach(id=>$(id)?.remove());
    $('.triangle-logo')?.remove();
    const facts=$$('.hero-facts > div'); if(facts.length>2) facts.slice(2).forEach(x=>x.remove());
    const how=$('.secondary-cta'); if(how){how.href='#guide';how.textContent=t('how')}
    const heroLead=$('.hero-lead'); if(heroLead)heroLead.textContent=t('heroLead');
    const faq=$('[data-i18n="faqOneA"]'); if(faq)faq.textContent=t('faqOneA');
    const author=$('#authorInput'); if(author && (author.value.trim()==='' || author.value.trim()==='DJ Pierre')){author.value='Z3Z';author.dispatchEvent(new Event('input',{bubbles:true}))}
  }

  function noteSelects(){
    const notes=[['','—'],['C','C'],['C#','C#'],['D','D'],['D#','D#'],['E','E'],['F','F'],['F#','F#'],['G','G'],['G#','G#'],['A','A'],['A#','A#'],['B','B'],['C_HIGH','C']];
    $$('.note-input').forEach((input,i)=>{
      input.classList.add('note-source-hidden');
      const s=document.createElement('select');s.className='cell-control note-picker';s.dataset.notePicker=i;s.setAttribute('aria-label',`Note ${i+1}`);
      notes.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;s.appendChild(o)});
      input.insertAdjacentElement('afterend',s);
      s.addEventListener('change',()=>{
        const oct=$$('.octave-cell')[i];
        if(s.value==='C_HIGH'){input.value='C';if(oct)oct.textContent='U'}
        else {input.value=s.value;if(oct&&oct.textContent.trim()==='U')oct.textContent=''}
        input.dispatchEvent(new Event('input',{bubbles:true}));
      });
    });
    const sync=()=>{
      $$('.note-input').forEach((input,i)=>{const s=$(`[data-note-picker="${i}"]`),oct=$$('.octave-cell')[i]?.textContent.trim();if(s){const v=input.value==='C'&&oct==='U'?'C_HIGH':input.value;s.value=[...s.options].some(o=>o.value===v)?v:''}});
      requestAnimationFrame(sync);
    };requestAnimationFrame(sync);
  }

  function moveToolbar(){
    const toolbar=$('.workspace-toolbar'),sheet=$('#patternSheet');if(!toolbar||!sheet)return;
    toolbar.classList.add('sheet-toolbar');sheet.appendChild(toolbar);
  }

  function miniIOHtml(){return `<section class="sheet-io" data-html2canvas-ignore="true">
    <div class="mini-analyzer"><div class="mini-analyzer-head"><span>${t('scope')}</span><strong id="fxNote">--</strong><b id="fxHz">-- Hz</b></div><canvas id="fxScope"></canvas><div class="mini-tabs"><button class="analyzer-tab active" data-mode="scope" type="button">${t('scope')}</button><button class="analyzer-tab" data-mode="spectrum" type="button">${t('spectrum')}</button></div></div>
    <div class="midi-compact"><div class="midi-compact-head"><strong>${t('midi')}</strong><span class="midi-badge" id="midiBadge">MIDI</span></div><div class="midi-compact-grid"><button id="midiConnect" class="midi-connect" type="button">${t('midiAccess')}</button><label><span>${t('midiOutput')}</span><select id="midiOut" disabled><option value="">—</option></select></label><label><span>${t('midiChannel')}</span><select id="midiCh"></select></label><label><span>${t('midiMode')}</span><select id="midiMode"><option value="browser">${t('browser')}</option><option value="both">${t('both')}</option><option value="midi">${t('midiOnly')}</option></select></label><label class="midi-clock"><input id="midiClock" type="checkbox"><span>${t('midiClock')}</span></label></div><small id="midiStatus"></small></div>
  </section>`}
  function mountMiniIO(){const hw=$('.hardware-strip');if(hw)hw.insertAdjacentHTML('afterend',miniIOHtml())}

  function guideCol(num,title,items){return `<article class="guide-col"><span class="guide-num">${num}</span><h3>${t(title)}</h3>${items.map(x=>`<div class="guide-item"><span class="gchip ${x[3]||''}">${x[0]}</span><div><strong>${t(x[1])}</strong><p>${t(x[2])}</p></div></div>`).join('')}</article>`}
  function guideHtml(){return `<section class="field-guide" id="guide"><div class="shell"><div class="guide-top"><div><p class="eyebrow">${t('guideK')}</p><h2>${t('guideT')}</h2></div><p class="guide-lead">${t('guideP')}</p></div><div class="guide-board">${guideCol('01','gateT',[['●','noteOn','noteOnP'],['○','tie','tieP'],['–','rest','restP']])}${guideCol('02','pitchT',[['D/U','oct','octP'],['A','acc','accP','acid'],['S','slide','slideP','acid']])}${guideCol('03','knobT',[['CUT','cut','cutP'],['RES','res','resP'],['ENV','env','envP']])}</div><div class="recipe"><b>303</b><div><strong>${t('recipe')}</strong><p>${t('recipeP')}</p></div></div></div></section>`}
  function historyHtml(){return `<section class="history303" id="history"><div class="shell"><div class="history-top"><div><p class="eyebrow">${t('histK')}</p><h2>${t('histT')}</h2></div><p>${t('histP')}</p></div><div class="timeline">${HISTORY[lang()].map((x,i)=>`<article class="era ${i>=2&&i<=6?'key':''}"><time>${x[0]}</time><i></i><div><h3>${x[1]}</h3><p>${x[2]}</p><div class="era-tags">${x[3].map(y=>`<span>${y}</span>`).join('')}</div></div></article>`).join('')}</div><p class="history-sources">${t('sources')}: <a href="https://www.roland.com/global/promos/303day/" target="_blank" rel="noopener">Roland 303 Day</a></p></div></section>`}

  function drumHtml(){
    const heads=Array.from({length:16},(_,i)=>`<span class="drum-step-head ${[0,4,8,12].includes(i)?'downbeat':''}">${i+1}</span>`).join('');
    const rows=DRUMS.map(v=>`<div class="drum-row"><div class="drum-voice"><button type="button" data-drum-preview="${v.id}"><b>${v.code}</b><span>${t(v.id)}</span></button><label><span>${t('voice')}</span><select data-drum-variant="${v.id}" ${v.variants.length===1?'disabled':''}>${v.variants.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label><label class="voice-level"><span>${t('level')}</span><input type="range" min="0" max="100" value="80" data-drum-level="${v.id}"></label></div><div class="drum-steps">${Array.from({length:16},(_,i)=>`<button type="button" class="drum-step ${[0,4,8,12].includes(i)?'downbeat':''}" data-drum="${v.id}" data-drum-step="${i}" aria-pressed="false"></button>`).join('')}</div></div>`).join('');
    return `<section class="drum-machine shell" id="drums"><div class="drum-intro"><div><p class="eyebrow">${t('drumKicker')}</p><h2>${t('drumTitle')}</h2></div><p>${t('drumLead')}</p></div><div class="drum-export-card" id="drumExportCard"><div class="drum-panel"><div class="drum-toolbar" data-html2canvas-ignore="true"><div class="drum-actions"><button id="drumPlay" class="drum-play" type="button"><i></i><span>${t('playDrums')}</span></button><button id="drumRandom" class="drum-action" type="button">${t('random')}</button><button id="drumDownload" class="drum-action" type="button">${t('downloadDrums')}</button><button id="drumClear" class="drum-action danger" type="button">${t('clearDrums')}</button></div><div class="drum-tools"><label class="drum-switch"><input id="drumSync" type="checkbox" checked><span><b>${t('sync')}</b><small>${t('syncHelp')}</small></span></label><label class="density"><span>${t('density')}</span><input id="drumDensity" type="range" min="15" max="100" value="55"><b id="drumDensityValue">55%</b></label><div class="mini-mixer"><strong>${t('mixer')}</strong><label><span>${t('bass303')}</span><input id="mix303" type="range" min="0" max="100" value="80"><b id="mix303Value">80%</b></label><label><span>${t('drums')}</span><input id="mixDrums" type="range" min="0" max="100" value="80"><b id="mixDrumsValue">80%</b></label></div></div></div><div class="drum-grid-scroll"><div class="drum-grid"><div></div><div class="drum-heads">${heads}</div>${rows}</div></div></div><div class="drum-dna"><div class="dna-title"><span>${t('kit')}</span><small>${t('kitLead')}</small></div><article><b>${t('d909')}</b><p>${t('d909p')}</p></article><article><b>${t('d606')}</b><p>${t('d606p')}</p></article><article><b>${t('d808')}</b><p>${t('d808p')}</p></article></div></div></section>`;
  }

  function mountContent(){
    const seq=$('#sequencer');if(seq)seq.insertAdjacentHTML('afterend',drumHtml());
    const wf=$('#workflow');if(wf)wf.outerHTML=guideHtml();else $('#drums')?.insertAdjacentHTML('afterend',guideHtml());
    const ref=$('#reference');if(ref)ref.outerHTML=historyHtml();else $('#guide')?.insertAdjacentHTML('afterend',historyHtml());
    const nav=$('.nav');if(nav)nav.innerHTML=`<a href="#sequencer">${t('navSequencer')}</a><a href="#drums">${t('navDrums')}</a><a href="#guide">${t('navGuide')}</a><a href="#history">${t('navHistory')}</a><a href="#faq">${t('navFaq')}</a>`;
  }
  function footer(){const f=$('.footer-inner');if(f)f.innerHTML=`<div class="z3z-credit"><span>${t('footer')}</span><a href="https://instagram.com/zafer.pro" target="_blank" rel="me noopener">${t('follow')}</a></div><div class="footer-links"><a href="#sequencer">${t('navSequencer')}</a><a href="#drums">${t('navDrums')}</a><a href="#history">${t('navHistory')}</a></div>`}

  function saveDrums(){localStorage.setItem('303box-rhythm-v3',JSON.stringify({pattern:drumState.pattern,levels:drumState.levels,variants:drumState.variants,density:drumState.density,master:drumState.master,sync:drumState.sync}))}
  function loadDrums(){
    try{const d=JSON.parse(localStorage.getItem('303box-rhythm-v3')||'null');if(!d)return false;DRUMS.forEach(v=>{if(Array.isArray(d.pattern?.[v.id])&&d.pattern[v.id].length===16)drumState.pattern[v.id]=d.pattern[v.id].map(Boolean);if(Number.isFinite(+d.levels?.[v.id]))drumState.levels[v.id]=clamp(+d.levels[v.id],0,100);if(v.variants.some(x=>x[0]===d.variants?.[v.id]))drumState.variants[v.id]=d.variants[v.id]});if(Number.isFinite(+d.density))drumState.density=clamp(+d.density,15,100);if(Number.isFinite(+d.master))drumState.master=clamp(+d.master,0,100);if(typeof d.sync==='boolean')drumState.sync=d.sync;return true}catch(_){return false}
  }
  function renderDrums(){
    DRUMS.forEach(v=>{drumState.pattern[v.id].forEach((on,i)=>{const b=$(`[data-drum="${v.id}"][data-drum-step="${i}"]`);if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}});const lv=$(`[data-drum-level="${v.id}"]`);if(lv)lv.value=drumState.levels[v.id];const va=$(`[data-drum-variant="${v.id}"]`);if(va)va.value=drumState.variants[v.id]});
    $('#drumDensity').value=drumState.density;$('#drumDensityValue').textContent=`${drumState.density}%`;$('#drumSync').checked=drumState.sync;$('#mix303').value=bassLevel;$('#mix303Value').textContent=`${bassLevel}%`;$('#mixDrums').value=drumState.master;$('#mixDrumsValue').textContent=`${drumState.master}%`;setDrumMaster();applyBassGain();
  }
  function toggleDrum(id,i){drumState.pattern[id][i]=!drumState.pattern[id][i];if(drumState.pattern[id][i]&&id==='ch')drumState.pattern.oh[i]=false;if(drumState.pattern[id][i]&&id==='oh')drumState.pattern.ch[i]=false;renderDrums();saveDrums()}
  function randomizeDrums(){const d=drumState.density/100;for(let i=0;i<16;i++){const q=[0,4,8,12].includes(i),back=[4,12].includes(i),off=[2,6,10,14].includes(i),fill=i>=12;drumState.pattern.bd[i]=Math.random()<(q?.62+.28*d:.04+.16*d);drumState.pattern.sd[i]=Math.random()<(back?.58+.24*d:.01+.05*d);drumState.pattern.cp[i]=Math.random()<(back?.28+.28*d:.005+.025*d);drumState.pattern.tm[i]=Math.random()<(fill?.04+.18*d:.005+.035*d);const op=Math.random()<(off?.08+.24*d:.005+.035*d);drumState.pattern.oh[i]=op;drumState.pattern.ch[i]=!op&&Math.random()<(off?.42+.38*d:.12+.2*d)}if(!drumState.pattern.bd.some(Boolean))drumState.pattern.bd[0]=true;renderDrums();saveDrums()}
  function clearDrums(){DRUMS.forEach(v=>drumState.pattern[v.id].fill(false));renderDrums();saveDrums()}
  function bpm(){return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250)}
  function bassPlaying(){return $('#playButton')?.getAttribute('aria-pressed')==='true'}
  function bassStep(){const x=$('[data-step-header][data-playing="true"]');return x?Number(x.dataset.stepHeader):-1}

  async function ensureDrumAudio(){
    if(drumState.ctx&&drumState.ctx.state!=='closed'){await drumState.ctx.resume();return drumState.ctx}
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;const c=new C();drumContext=c;await c.resume();const master=c.createGain(),comp=c.createDynamicsCompressor();comp.threshold.value=-10;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.002;comp.release.value=.16;master.connect(comp);comp.connect(c.destination);const noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;drumState.ctx=c;drumState.masterNode=master;drumState.noise=noise;setDrumMaster();return c
  }
  function setDrumMaster(){if(drumState.masterNode&&drumState.ctx)drumState.masterNode.gain.setTargetAtTime((drumState.master/100)*.9,drumState.ctx.currentTime,.012)}
  function out(c,level){const g=c.createGain();g.gain.value=level;g.connect(drumState.masterNode);return g}
  function noise(c){const s=c.createBufferSource();s.buffer=drumState.noise;return s}
  function env(g,w,p,d){g.gain.setValueAtTime(.0001,w);g.gain.exponentialRampToValueAtTime(Math.max(.001,p),w+.002);g.gain.exponentialRampToValueAtTime(.0001,w+d)}
  function kick909(w,l){const c=drumState.ctx,o=c.createOscillator(),g=c.createGain(),dst=out(c,l*.95);o.type='sine';o.frequency.setValueAtTime(175,w);o.frequency.exponentialRampToValueAtTime(52,w+.11);env(g,w,1,.34);o.connect(g);g.connect(dst);o.start(w);o.stop(w+.42);const n=noise(c),hp=c.createBiquadFilter(),ng=c.createGain();hp.type='highpass';hp.frequency.value=2800;ng.gain.setValueAtTime(.15,w);ng.gain.exponentialRampToValueAtTime(.0001,w+.018);n.connect(hp);hp.connect(ng);ng.connect(dst);n.start(w);n.stop(w+.025)}
  function snare606(w,l){const c=drumState.ctx,dst=out(c,l*.78),n=noise(c),hp=c.createBiquadFilter(),ng=c.createGain();hp.type='highpass';hp.frequency.value=1850;env(ng,w,.58,.12);n.connect(hp);hp.connect(ng);ng.connect(dst);n.start(w);n.stop(w+.14);const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=230;env(g,w,.28,.09);o.connect(g);g.connect(dst);o.start(w);o.stop(w+.12)}
  function clap808(w,l){const c=drumState.ctx,dst=out(c,l*.72),n=noise(c),bp=c.createBiquadFilter(),hp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=1250;bp.Q.value=.65;hp.type='highpass';hp.frequency.value=550;g.gain.setValueAtTime(.0001,w);[[0,.9],[.018,.0001],[.029,.7],[.046,.0001],[.058,.56],[.08,.0001],[.09,.42]].forEach(([d,v])=>g.gain.setValueAtTime(Math.max(.0001,v),w+d));g.gain.exponentialRampToValueAtTime(.0001,w+.3);n.connect(bp);bp.connect(hp);hp.connect(g);g.connect(dst);n.start(w);n.stop(w+.32)}
  function tom(w,l,v,high=false){const c=drumState.ctx,dst=out(c,l*.82),o=c.createOscillator(),g=c.createGain(),is606=v.includes('606');o.type=is606?'triangle':'sine';const st=high?(is606?260:230):(is606?170:135),en=high?(is606?165:145):(is606?105:78);o.frequency.setValueAtTime(st,w);o.frequency.exponentialRampToValueAtTime(en,w+.18);env(g,w,.78,is606?.24:.4);o.connect(g);g.connect(dst);o.start(w);o.stop(w+.44)}
  function noiseTom(w,l){tom(w,l*.68,'606lt',true);const c=drumState.ctx,dst=out(c,l*.36),n=noise(c),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=520;bp.Q.value=1.2;env(g,w,.45,.22);n.connect(bp);bp.connect(g);g.connect(dst);n.start(w);n.stop(w+.24)}
  function hat606(w,l,open){const c=drumState.ctx,dst=out(c,l*(open?.46:.34)),mix=c.createGain(),hp=c.createBiquadFilter(),bp=c.createBiquadFilter(),g=c.createGain();hp.type='highpass';hp.frequency.value=5600;bp.type='bandpass';bp.frequency.value=8900;bp.Q.value=.75;const dur=open?.42:.07;env(g,w,.72,dur);mix.connect(hp);hp.connect(bp);bp.connect(g);g.connect(dst);[230,347,419,527,677,823].forEach(f=>{const o=c.createOscillator();o.type='square';o.frequency.value=f;o.connect(mix);o.start(w);o.stop(w+dur+.03)})}
  function playVoice(id,w){const l=drumState.levels[id]/100;if(l<=.001)return;const v=drumState.variants[id];if(id==='bd')kick909(w,l);else if(id==='sd')snare606(w,l);else if(id==='cp'){if(v==='808clap')clap808(w,l);else if(v==='noiseTom')noiseTom(w,l);else tom(w,l,'606lt',true)}else if(id==='tm')tom(w,l,v,false);else if(id==='ch')hat606(w,l,false);else if(id==='oh')hat606(w,l,true)}
  function scheduleDrumVisual(step,w){const delay=Math.max(0,(w-drumState.ctx.currentTime)*1000);setTimeout(()=>{if(!drumState.playing)return;$$('.drum-step[data-current]').forEach(x=>x.removeAttribute('data-current'));$$(`[data-drum-step="${step}"]`).forEach(x=>x.setAttribute('data-current','true'))},delay)}
  function drumScheduler(){if(!drumState.playing||!drumState.ctx)return;while(drumState.nextAt<drumState.ctx.currentTime+.12){const s=drumState.step;DRUMS.forEach(v=>{if(drumState.pattern[v.id][s])playVoice(v.id,drumState.nextAt)});scheduleDrumVisual(s,drumState.nextAt);drumState.nextAt+=(60/bpm())/4;drumState.step=(drumState.step+1)%16}drumState.timer=setTimeout(drumScheduler,25)}
  async function startDrums(){if(drumState.playing)return;const c=await ensureDrumAudio();if(!c)return;drumState.armed=false;drumState.playing=true;drumState.step=0;drumState.nextAt=c.currentTime+.045;updateDrumButton();drumScheduler()}
  function armDrums(){drumState.armed=true;updateDrumButton();const target=$('#stepHeaderRow');if(!target){startDrums();return}const check=()=>{if(drumState.armed&&bassStep()===0){drumState.observer?.disconnect();drumState.observer=null;startDrums()}};drumState.observer=new MutationObserver(check);drumState.observer.observe(target,{attributes:true,subtree:true,attributeFilter:['data-playing']});check()}
  function stopDrums(){if(drumState.timer)clearTimeout(drumState.timer);drumState.timer=null;drumState.playing=false;drumState.armed=false;drumState.observer?.disconnect();drumState.observer=null;$$('.drum-step[data-current]').forEach(x=>x.removeAttribute('data-current'));updateDrumButton()}
  async function toggleDrums(){if(drumState.playing||drumState.armed){stopDrums();return}if(drumState.sync&&bassPlaying()){armDrums();return}await startDrums()}
  function updateDrumButton(){const b=$('#drumPlay');if(!b)return;b.classList.toggle('playing',drumState.playing);b.classList.toggle('armed',drumState.armed);b.querySelector('span').textContent=drumState.armed?t('armed'):(drumState.playing?t('stopDrums'):t('playDrums'))}

  async function downloadDrums(){
    if(typeof window.html2canvas!=='function')return;
    const src=$('#drumExportCard');if(!src)return;const clone=src.cloneNode(true);clone.classList.add('drum-export-clone');clone.querySelectorAll('[data-html2canvas-ignore="true"]').forEach(x=>x.remove());clone.style.position='fixed';clone.style.left='-12000px';clone.style.top='0';clone.style.width='1000px';clone.style.zIndex='-1';document.body.appendChild(clone);const scroll=clone.querySelector('.drum-grid-scroll');const grid=clone.querySelector('.drum-grid');if(scroll)scroll.style.overflow='visible';if(grid){grid.style.minWidth='0';grid.style.width='100%'};try{const canvas=await window.html2canvas(clone,{scale:2,backgroundColor:'#0b0b0d',logging:false});const a=document.createElement('a');a.download=`303box_rhythm_${Date.now().toString().slice(-6)}.jpg`;a.href=canvas.toDataURL('image/jpeg',.95);a.click()}finally{clone.remove()}
  }

  function bindDrums(){
    const had=loadDrums();renderDrums();if(!had)randomizeDrums();
    $('#drumPlay')?.addEventListener('click',toggleDrums);$('#drumRandom')?.addEventListener('click',randomizeDrums);$('#drumClear')?.addEventListener('click',clearDrums);$('#drumDownload')?.addEventListener('click',downloadDrums);
    $('#drums')?.addEventListener('click',e=>{const s=e.target.closest('.drum-step');if(s)toggleDrum(s.dataset.drum,+s.dataset.drumStep);const p=e.target.closest('[data-drum-preview]');if(p)ensureDrumAudio().then(()=>playVoice(p.dataset.drum,drumState.ctx.currentTime+.015))});
    $$('#drums [data-drum-level]').forEach(el=>el.addEventListener('input',e=>{drumState.levels[e.target.dataset.drumLevel]=+e.target.value;saveDrums()}));
    $$('#drums [data-drum-variant]').forEach(el=>el.addEventListener('change',e=>{drumState.variants[e.target.dataset.drumVariant]=e.target.value;saveDrums()}));
    $('#drumDensity')?.addEventListener('input',e=>{drumState.density=+e.target.value;$('#drumDensityValue').textContent=`${drumState.density}%`;saveDrums()});
    $('#drumSync')?.addEventListener('change',e=>{drumState.sync=e.target.checked;saveDrums()});
    $('#mix303')?.addEventListener('input',e=>{bassLevel=+e.target.value;localStorage.setItem('303box-bass-level',bassLevel);$('#mix303Value').textContent=`${bassLevel}%`;applyBassGain()});
    $('#mixDrums')?.addEventListener('input',e=>{drumState.master=+e.target.value;$('#mixDrumsValue').textContent=`${drumState.master}%`;setDrumMaster();saveDrums()});
  }

  function drawAnalyzer(){requestAnimationFrame(drawAnalyzer);const c=$('#fxScope');if(!c)return;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h}const g=c.getContext('2d');g.clearRect(0,0,w,h);const bus=activeBus;if(!bus||bus.ctx.state==='closed'){g.strokeStyle='rgba(221,255,55,.22)';g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();return}if(analyzerMode==='spectrum'){const a=new Uint8Array(bus.analyser.frequencyBinCount);bus.analyser.getByteFrequencyData(a);const per=bus.ctx.sampleRate/bus.analyser.fftSize,n=Math.min(a.length,Math.floor(5000/per)),bw=w/n;g.fillStyle='#ddff37';for(let i=0;i<n;i++){const v=a[i]/255,bh=Math.pow(v,1.4)*h*.9;g.globalAlpha=.15+v*.85;g.fillRect(i*bw,h-bh,Math.max(1,bw*.7),bh)}g.globalAlpha=1;updatePeak(a,bus)}else{const a=new Uint8Array(bus.analyser.fftSize);bus.analyser.getByteTimeDomainData(a);g.strokeStyle='#ddff37';g.lineWidth=Math.max(1.2,w/650);g.beginPath();a.forEach((v,i)=>{const x=i/(a.length-1)*w,y=v/255*h;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();const f=new Uint8Array(bus.analyser.frequencyBinCount);bus.analyser.getByteFrequencyData(f);updatePeak(f,bus)}}
  function updatePeak(arr,bus){let m=0,ix=0,per=bus.ctx.sampleRate/bus.analyser.fftSize,max=Math.min(arr.length-1,Math.floor(5000/per));for(let i=1;i<=max;i++)if(arr[i]>m){m=arr[i];ix=i}const hz=m<18?0:ix*per;$('#fxHz').textContent=hz?`${Math.round(hz)} Hz`:'-- Hz';$('#fxNote').textContent=hz?nearest(hz):'--'}
  function nearest(hz){const m=Math.round(69+12*Math.log2(hz/440)),n=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];return n[(m%12+12)%12]+(Math.floor(m/12)-1)}

  let midiAccess=null,midiTimer=null,midiStep=0,midiNext=0;
  let midiOutId=localStorage.getItem('303-midi-output')||'',midiChannel=clamp(+localStorage.getItem('303-midi-channel')||1,1,16),midiClock=localStorage.getItem('303-midi-clock')==='1',midiMode=localStorage.getItem('303-midi-mode')||'browser';
  const midiOut=()=>midiAccess?.outputs.get(midiOutId)||null;
  function midiStatus(kind){const b=$('#midiBadge'),s=$('#midiStatus'),bt=$('#midiConnect');if(!b||!s||!bt)return;b.classList.remove('ready');if(kind==='unsupported'){b.textContent='OFF';s.textContent=t('midiUnsupported');bt.disabled=true;return}if(kind==='denied'){b.textContent='OFF';s.textContent=t('midiDenied');return}if(kind==='none'){b.textContent='0 OUT';s.textContent=t('midiNoOutput');bt.textContent=t('midiGranted');return}if(kind==='connected'){b.textContent='ON';b.classList.add('ready');s.textContent=t('midiConnected');bt.textContent=t('midiGranted');return}if(kind==='choose'){b.textContent='READY';s.textContent=t('midiChoose');bt.textContent=t('midiGranted');return}b.textContent='MIDI';s.textContent='';bt.textContent=t('midiAccess')}
  async function connectMidi(){if(!navigator.requestMIDIAccess){midiStatus('unsupported');return}try{midiAccess=await navigator.requestMIDIAccess();midiAccess.onstatechange=refreshMidi;refreshMidi()}catch(_){midiStatus('denied')}}
  function refreshMidi(){const s=$('#midiOut'),outs=midiAccess?[...midiAccess.outputs.values()].filter(o=>o.state!=='disconnected'):[];if(!s)return;s.disabled=false;s.innerHTML='<option value="">—</option>'+outs.map(o=>`<option value="${o.id}">${[o.manufacturer,o.name].filter(Boolean).join(' — ')}</option>`).join('');if(outs.some(o=>o.id===midiOutId))s.value=midiOutId;else if(outs.length===1){midiOutId=outs[0].id;s.value=midiOutId;localStorage.setItem('303-midi-output',midiOutId)}else{midiOutId='';localStorage.removeItem('303-midi-output')}midiStatus(outs.length===0?'none':(midiOut()?'connected':'choose'))}
  function noteNum(note,oct){const map={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};let n=map[note];if(n==null)return null;if(oct==='D')n-=12;if(oct==='U')n+=12;return clamp(n,0,127)}
  function readStep(i){return{note:$$('.note-input')[i]?.value.trim().toUpperCase()||'',oct:$$('.octave-cell')[i]?.textContent.trim()||'',as:$$('.accentSlide-cell')[i]?.textContent.trim()||'',gate:$$('.gate-cell')[i]?.textContent.trim()||''}}
  function midiSchedule(i,w,dur){const o=midiOut();if(!o)return;const x=readStep(i),n=noteNum(x.note,x.oct);if(n==null||x.gate==='-')return;const on=0x90+(midiChannel-1),off=0x80+(midiChannel-1),vel=x.as.includes('A')?118:88;o.send([on,n,vel],w);o.send([off,n,0],w+(x.gate==='○'||x.as.includes('S')?dur*1.08:dur*.66))}
  function midiTick(){if(!midiTimer)return;const o=midiOut();if(!o){stopMidi(false);return}const now=performance.now(),dur=60000/bpm()/4;while(midiNext<now+120){midiSchedule(midiStep,midiNext,dur);if(midiClock){const tick=60000/bpm()/24;for(let j=0;j<6;j++)o.send([0xF8],midiNext+j*tick)}midiNext+=dur;midiStep=(midiStep+1)%16}midiTimer=setTimeout(midiTick,25)}
  function startMidi(){if(midiMode==='browser')return;const o=midiOut();if(!o){midiStatus(midiAccess && [...midiAccess.outputs.values()].length ? 'choose' : 'none');return}stopMidi(false);if(midiClock)o.send([0xFA]);midiStep=0;midiNext=performance.now()+55;midiTimer=setTimeout(midiTick,0)}
  function stopMidi(sendStop=true){if(midiTimer)clearTimeout(midiTimer);midiTimer=null;const o=midiOut();if(o){try{o.clear();o.send([0xB0+(midiChannel-1),123,0]);if(sendStop&&midiClock)o.send([0xFC])}catch(_){}}}
  function bindMidi(){const ch=$('#midiCh');for(let i=1;i<=16;i++)ch.insertAdjacentHTML('beforeend',`<option value="${i}">${i}</option>`);ch.value=midiChannel;$('#midiMode').value=midiMode;$('#midiClock').checked=midiClock;$('#midiConnect').addEventListener('click',connectMidi);$('#midiOut').addEventListener('change',e=>{midiOutId=e.target.value;if(midiOutId)localStorage.setItem('303-midi-output',midiOutId);else localStorage.removeItem('303-midi-output');midiStatus(midiOut()?'connected':'choose')});ch.addEventListener('change',e=>{midiChannel=clamp(+e.target.value||1,1,16);localStorage.setItem('303-midi-channel',midiChannel)});$('#midiClock').addEventListener('change',e=>{midiClock=e.target.checked;localStorage.setItem('303-midi-clock',midiClock?'1':'0')});$('#midiMode').addEventListener('change',e=>{midiMode=e.target.value;localStorage.setItem('303-midi-mode',midiMode);applyBassGain();if(bassPlaying()){midiMode==='browser'?stopMidi():startMidi()}});if(!navigator.requestMIDIAccess)midiStatus('unsupported');else midiStatus();const p=$('#playButton');if(p)new MutationObserver(()=>bassPlaying()?startMidi():stopMidi()).observe(p,{attributes:true,attributeFilter:['aria-pressed']})}

  function bindAnalyzer(){$$('.analyzer-tab').forEach(b=>b.addEventListener('click',()=>{analyzerMode=b.dataset.mode;$$('.analyzer-tab').forEach(x=>x.classList.toggle('active',x===b))}));drawAnalyzer()}
  function bindLanguage(){let last=lang();new MutationObserver(()=>{const now=lang();if(now!==last){last=now;location.reload()}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})}

  function init(){
    headSetup();cleanup();noteSelects();moveToolbar();mountMiniIO();mountContent();footer();bindDrums();bindAnalyzer();bindMidi();bindLanguage();
  }
  window.addEventListener('DOMContentLoaded',init);
})();
