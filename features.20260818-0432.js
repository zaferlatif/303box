(() => {
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

const BASE={
  en:{
    brandTag:'Acid pattern laboratory',navSequencer:'Sequencer',navFaq:'FAQ',openSequencer:'Open sequencer',heroKicker:'Free browser acid sequencer',heroTitle:'Turn sixteen steps into a living acid line.',heroLead:'Program notes, rests, ties, accents and slides. Shape the filter, hear the result instantly and send the same pattern to MIDI hardware.',heroPrimary:'Build a pattern',heroSecondary:'How it works',factSteps:'steps',bandOneTitle:'Sequence without friction',bandOneText:'Everything important stays in one focused 16-step view.',bandTwoTitle:'Perform the tone',bandTwoText:'The control strip mirrors the decisions you make on real acid hardware.',bandThreeTitle:'Leave with a usable sheet',bandThreeText:'Export your pattern, knob positions and notes as one clean image.',sequencerEyebrow:'Pattern workspace',sequencerTitle:'Build the line. Then perform it.',sequencerIntro:'Rhythm, pitch, expression and the core 303 controls stay visible together.',generate:'Generate pattern',download:'Download sheet',clear:'Clear',author:'Author',title:'Title',step:'Step',note:'Note',octave:'Down / Up',accentSlide:'Accent / Slide',gate:'Gate',waveform:'Waveform',tempo:'Tempo',notes:'EFX / Notes',notesPlaceholder:'Write your patch notes here...',faqEyebrow:'FAQ',faqTitle:'Built to get out of the way.',faqLead:'No account, no installation. Your current session stays in this browser.',faqOneQ:'What is 303box?',faqOneA:'A free browser-based 16-step acid bassline pattern tool inspired by TB-303 and TD-3 workflows.',faqTwoQ:'Does it generate audio?',faqTwoA:'Yes. Web Audio powers the preview engine, live oscilloscope, spectrum analyzer and drum machine.',faqThreeQ:'Can it send MIDI?',faqThreeA:'Yes on browsers with Web MIDI support. Choose an output and channel, then play the pattern with optional MIDI clock.',faqFourQ:'Where is my pattern stored?',faqFourA:'The current session is stored locally in your browser.',footerText:'A focused acid pattern tool for browser and hardware workflows.',tempoDialogEyebrow:'Tempo',tempoDialogTitle:'Set BPM',cancel:'Cancel',apply:'Apply'
  },
  tr:{
    brandTag:'Acid pattern laboratuvarı',navSequencer:'Sequencer',navFaq:'SSS',openSequencer:'Sequencer’ı aç',heroKicker:'Tarayıcıda ücretsiz acid sequencer',heroTitle:'On altı adımdan yaşayan bir acid bas hattı çıkar.',heroLead:'Nota, es, bağ, vurgu ve slide adımlarını programla. Filtreyi şekillendir, sonucu anında dinle ve aynı pattern’i MIDI donanımına gönder.',heroPrimary:'Pattern oluştur',heroSecondary:'Nasıl çalışır?',factSteps:'adım',bandOneTitle:'Hızlı programla',bandOneText:'Önemli olan her şey tek bir 16 adımlı görünümde kalır.',bandTwoTitle:'Tınıyı canlı şekillendir',bandTwoText:'Kontrol şeridi gerçek acid donanımındaki temel kararları aynı yerde toplar.',bandThreeTitle:'Kullanılabilir bir sayfayla çık',bandThreeText:'Pattern’i, pot konumlarını ve notlarını tek bir temiz görsel olarak dışa aktar.',sequencerEyebrow:'Pattern çalışma alanı',sequencerTitle:'Bas hattını kur. Sonra canlı şekillendir.',sequencerIntro:'Ritim, perde, ifade ve temel 303 kontrolleri aynı anda görünür kalır.',generate:'Pattern üret',download:'Görseli indir',clear:'Temizle',author:'Hazırlayan',title:'Başlık',step:'Adım',note:'Nota',octave:'Oktav ↓ / ↑',accentSlide:'Vurgu / Slide',gate:'Tetik',waveform:'Dalga formu',tempo:'Tempo',notes:'EFX / Notlar',notesPlaceholder:'Patch veya performans notlarını buraya yaz...',faqEyebrow:'SSS',faqTitle:'Araya girmeden işini yapsın.',faqLead:'Hesap ve kurulum yok. Mevcut oturum tarayıcıda yerel olarak saklanır.',faqOneQ:'303box nedir?',faqOneA:'TB-303 ve TD-3 çalışma biçiminden esinlenen, tarayıcıda çalışan ücretsiz 16 adımlı acid bassline pattern aracıdır.',faqTwoQ:'Ses üretiyor mu?',faqTwoA:'Evet. Web Audio önizleme motorunu, canlı osiloskobu, spektrum analizini ve drum machine’i çalıştırır.',faqThreeQ:'MIDI gönderebilir mi?',faqThreeA:'Web MIDI destekleyen tarayıcılarda evet. Çıkış ve kanal seçip pattern’i isteğe bağlı MIDI clock ile çaldırabilirsin.',faqFourQ:'Pattern nerede saklanıyor?',faqFourA:'Mevcut oturum tarayıcıda yerel olarak saklanır.',footerText:'Tarayıcı ve donanım için odaklı bir acid pattern aracı.',tempoDialogEyebrow:'Tempo',tempoDialogTitle:'BPM ayarla',cancel:'İptal',apply:'Uygula'
  }
};

const UI={
  en:{
    navDrums:'Drums',navLive:'Live I/O',navGuide:'Guide',navHistory:'History',
    liveK:'LIVE SIGNAL & MIDI',liveT:'See the signal. Send the pattern to hardware.',liveP:'Inspect the browser synth in real time, or route the same 16-step sequence to a USB MIDI device.',sig:'SIGNAL ANALYZER',scope:'Scope',spectrum:'Spectrum',waiting:'Waiting for audio',active:'Signal active',hint:'Play the pattern to inspect waveform and dominant frequency.',
    midi:'HARDWARE OUTPUT',connect:'Connect MIDI',connected:'MIDI connected',available:'MIDI available',unsupported:'Not supported',noOutput:'No MIDI output found',denied:'MIDI permission was not granted.',choose:'Select a MIDI output first.',midiP:'Send notes, accent velocity and optional MIDI clock to a connected synth, groovebox or interface.',out:'MIDI output',channel:'Channel',playout:'Playback output',browser:'Browser',both:'Browser + MIDI',midiOnly:'MIDI only',clock:'Send MIDI clock',clockHelp:'Start, Stop and 24 PPQN clock for external sync.',browserHelp:'Web MIDI requires browser support and user permission.',
    drumK:'RHYTHM MACHINE',drumT:'Six drum voices. One shared clock.',drumP:'A compact 16-step rhythm machine based on the six drum parts found on the Roland T-8. The sounds are synthesized in your browser; no Roland samples are copied.',drumPlay:'PLAY DRUMS',drumStop:'STOP DRUMS',drumArmed:'ARMED',drumRandom:'Randomize',drumClear:'Clear drums',drumSync:'Sync start to 303',drumSyncHelp:'If the 303 is already playing, drums wait for the next step 1. After starting, they follow the same BPM.',drumDensity:'Random density',drumMaster:'Master',drumVoice:'Voice',drumLevel:'Level',drumSource:'T-8 voice map',drumSourceText:'T-8 rhythm parts: BD, SD, Clap, Tom, Closed HH and Open HH. Browser-synthesized approximations.',
    bd:'Bass Drum',sd:'Snare Drum',cp:'Hand Clap',tm:'Tom',ch:'Closed Hi-Hat',oh:'Open Hi-Hat',
    guideK:'SEQUENCER FIELD GUIDE',guideT:'Complete sequencer guide',guideP:'First decide when a note exists, then where it sits, then how hard it moves.',gateT:'Gate / Envelope trigger',noteOn:'Note on',noteOnP:'Starts a new note and retriggers the amplitude/filter envelope.',tie:'Tie',tieP:'Keeps the gate open into the next step for longer notes and legato.',rest:'Rest',restP:'No trigger. Silence is part of the groove.',pitchT:'Pitch & dynamics',oct:'Octave',octP:'Moves the programmed pitch one octave down or up.',acc:'Accent',accP:'Hits harder and pushes the filter envelope for the classic acid bite.',slide:'Slide',slideP:'Glides toward the next pitch. MIDI mode overlaps notes to encourage portamento.',knobT:'Analog controls',cut:'Cutoff',cutP:'Sets the base filter opening. Start low to leave room for movement.',res:'Resonance',resP:'Emphasizes the cutoff point and creates the liquid acid edge.',env:'Env Mod / Decay',envP:'Controls how strongly and how long the filter envelope reshapes each step.',recipe:'A useful starting recipe',recipeP:'Use a small note set, leave rests, raise resonance, begin with low cutoff, then add accents and slides where the rhythm needs pressure.',
    histK:'THE 303 STORY',histT:'A machine that failed forward.',histP:'A practice bass machine left the catalogue, resurfaced in Chicago, and changed dance music permanently.',sources:'History references'
  },
  tr:{
    navDrums:'Davullar',navLive:'Canlı I/O',navGuide:'Rehber',navHistory:'Tarihçe',
    liveK:'CANLI SİNYAL VE MIDI',liveT:'Sinyali gör. Pattern’i donanıma gönder.',liveP:'Tarayıcı sentezleyicisini gerçek zamanlı izle veya aynı 16 adımlı sekansı USB MIDI cihazına gönder.',sig:'SİNYAL ANALİZÖRÜ',scope:'Scope',spectrum:'Spektrum',waiting:'Ses bekleniyor',active:'Sinyal aktif',hint:'Dalga biçimini ve baskın frekansı görmek için pattern’i çal.',
    midi:'DONANIM ÇIKIŞI',connect:'MIDI bağla',connected:'MIDI bağlı',available:'MIDI kullanılabilir',unsupported:'Desteklenmiyor',noOutput:'MIDI çıkışı bulunamadı',denied:'MIDI izni verilmedi.',choose:'Önce bir MIDI çıkışı seç.',midiP:'Notaları, accent velocity değerini ve isteğe bağlı MIDI clock’u bağlı synth, groovebox veya MIDI arayüzüne gönder.',out:'MIDI çıkışı',channel:'Kanal',playout:'Çalma çıkışı',browser:'Tarayıcı',both:'Tarayıcı + MIDI',midiOnly:'Yalnızca MIDI',clock:'MIDI clock gönder',clockHelp:'Harici senkron için Start, Stop ve 24 PPQN clock gönderir.',browserHelp:'Web MIDI için tarayıcı desteği ve kullanıcı izni gerekir.',
    drumK:'RİTİM MAKİNESİ',drumT:'Altı drum voice. Tek ortak tempo.',drumP:'Roland T-8’de bulunan altı ritim partına dayalı kompakt 16 adımlı drum machine. Sesler tarayıcıda sentezlenir; Roland sample’ları kopyalanmaz.',drumPlay:'DAVULLARI ÇAL',drumStop:'DAVULLARI DURDUR',drumArmed:'SENKRON BEKLİYOR',drumRandom:'Rastgele üret',drumClear:'Davulları temizle',drumSync:'303 başlangıcına senkronla',drumSyncHelp:'303 zaten çalıyorsa davullar bir sonraki 1. adımı bekler. Başladıktan sonra aynı BPM’i takip eder.',drumDensity:'Rastgele yoğunluk',drumMaster:'Master',drumVoice:'Ses',drumLevel:'Seviye',drumSource:'T-8 ses haritası',drumSourceText:'T-8 ritim partları: BD, SD, Clap, Tom, Closed HH ve Open HH. Tarayıcıda sentezlenen yaklaşık karakterler.',
    bd:'Bas Davul',sd:'Trampet',cp:'El Çırpma',tm:'Tom',ch:'Kapalı Hi-Hat',oh:'Açık Hi-Hat',
    guideK:'SEQUENCER KULLANIM REHBERİ',guideT:'303 sequencer rehberi',guideP:'Önce notanın hangi adımda var olacağını, sonra perdesini, en son nasıl hareket edeceğini belirle.',gateT:'Tetik / Zarf',noteOn:'Nota tetikle',noteOnP:'Yeni notayı başlatır; ses ve filtre zarfını yeniden tetikler.',tie:'Bağ',tieP:'Tetiği sonraki adıma açık tutar; uzun notalar ve legato için kullanılır.',rest:'Es',restP:'Tetik yoktur. Sessizlik groove’un bir parçasıdır.',pitchT:'Perde ve dinamik',oct:'Oktav',octP:'Programlanan perdeyi bir oktav aşağı veya yukarı taşır.',acc:'Vurgu',accP:'Notayı daha sert çalar ve filtre zarfını iterek klasik acid ısırığını oluşturur.',slide:'Slide',slideP:'Bir sonraki perdeye kayar. MIDI modunda notalar portamento için kısa süre üst üste bindirilir.',knobT:'Analog kontroller',cut:'Cutoff',cutP:'Filtrenin temel açıklığını belirler. Hareket alanı için düşükten başla.',res:'Rezonans',resP:'Cutoff noktasını belirginleştirir ve o sıvı acid karakterini ortaya çıkarır.',env:'Env Mod / Decay',envP:'Filtre zarfının her adımı ne kadar güçlü ve ne kadar uzun şekillendireceğini belirler.',recipe:'İyi bir başlangıç ayarı',recipeP:'Nota havuzunu küçük tut, birkaç es bırak, rezonansı yükselt, cutoff’u düşükten başlat; sonra vurgu ve slide’ı ritmin baskı istediği yerlere koy.',
    histK:'303 TARİHÇESİ',histT:'Başarısız olup geleceği değiştiren makine.',histP:'Bir pratik bas makinesi katalogdan çıktı, Chicago’da yeniden keşfedildi ve dans müziğinin yönünü değiştirdi.',sources:'Tarihçe kaynakları'
  }
};

const HISTORY={
  en:[
    ['1981','The TB-303 arrives','Roland releases Tadao Kikumoto’s TB-303 Bass Line alongside the TR-606, designed to imitate an electric bass for practice and performance.',['Tadao Kikumoto','Roland TB-303','TR-606']],
    ['1983','A commercial ending','Production ends after roughly ten thousand units. Low used prices put the machine into the hands of experimenters.',['~10,000 units','Second-hand era']],
    ['1985','Phuture finds the squelch','Spanky, DJ Pierre and Herb J experiment with a cheap 303. Pierre twists cutoff and resonance while the pattern runs; Ron Hardy champions the early tape at Chicago’s Music Box.',['Phuture','DJ Pierre','Ron Hardy','Music Box']],
    ['1987','“Acid Tracks” is released','Phuture’s long 303 experiment is re-recorded with Marshall Jefferson and officially released by Trax Records.',['Phuture','Marshall Jefferson','Trax Records','“Acid Tracks”']],
    ['1988','The Second Summer of Love','Acid house crosses the Atlantic and explodes through UK club and rave culture. A Guy Called Gerald releases “Voodoo Ray.”',['A Guy Called Gerald','“Voodoo Ray”','UK rave']],
    ['1992','Acid becomes harder','Hardfloor push multiple 303s into hypnotic acid techno and trance territory with “Acperience 1.”',['Hardfloor','“Acperience 1”']],
    ['1995','Another peak','Josh Wink’s “Higher State of Consciousness” turns two stock TB-303s into an aggressive rave anthem.',['Josh Wink','“Higher State of Consciousness”']],
    ['2016','Roland revisits the Bass Line','Roland launches the Boutique TB-03 with MIDI, USB and CV/Gate connectivity.',['Roland TB-03','MIDI','USB','CV/Gate']],
    ['Now','The pattern is still alive','Original machines, clones and software emulations keep the 303 vocabulary active across electronic music.',['Hardware revival','Software','Clones']]
  ],
  tr:[
    ['1981','TB-303 sahneye çıkıyor','Roland, Tadao Kikumoto tasarımı TB-303 Bass Line’ı TR-606 ile birlikte piyasaya çıkarır. Amaç elektrik basını taklit etmektir.',['Tadao Kikumoto','Roland TB-303','TR-606']],
    ['1983','Ticari son, kültürel başlangıç','Yaklaşık on bin adet üretildikten sonra üretim sona erer. Ucuz ikinci el fiyatları cihazı deneysel müzisyenlerin eline taşır.',['~10.000 adet','İkinci el dönemi']],
    ['1985','Phuture o sesi buluyor','Spanky, DJ Pierre ve Herb J ucuz bir 303 ile deney yapar. Pierre pattern dönerken cutoff ve rezonansı çevirir; Ron Hardy erken kaydı Chicago’daki Music Box’ta çalar.',['Phuture','DJ Pierre','Ron Hardy','Music Box']],
    ['1987','“Acid Tracks” yayımlanıyor','Phuture’un uzun 303 deneyi Marshall Jefferson ile yeniden kaydedilir ve Trax Records’tan resmen yayımlanır.',['Phuture','Marshall Jefferson','Trax Records','“Acid Tracks”']],
    ['1988','Second Summer of Love','Acid house İngiltere rave sahnesinde patlar. A Guy Called Gerald “Voodoo Ray”i yayımlar.',['A Guy Called Gerald','“Voodoo Ray”','UK rave']],
    ['1992','Acid sertleşiyor','Hardfloor, “Acperience 1” ile birden fazla 303’ü acid techno ve trance bölgesine taşır.',['Hardfloor','“Acperience 1”']],
    ['1995','303 yeniden zirvede','Josh Wink, “Higher State of Consciousness”ta iki TB-303 ile saldırgan bir rave klasiği yaratır.',['Josh Wink','“Higher State of Consciousness”']],
    ['2016','Roland Bass Line’a geri dönüyor','Roland, MIDI, USB ve CV/Gate bağlantıları sunan Boutique TB-03’ü çıkarır.',['Roland TB-03','MIDI','USB','CV/Gate']],
    ['Bugün','Pattern hâlâ yaşıyor','Orijinal cihazlar, klonlar ve yazılım emülasyonları 303 dilini elektronik müzikte canlı tutuyor.',['Donanım geri dönüşü','Yazılım','Klonlar']]
  ]
};

const lang=()=>document.documentElement.lang==='tr'?'tr':'en';

function applyLang(){
  const l=lang(),b=BASE[l],u=UI[l];
  $$('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(b[k]!=null)el.textContent=b[k]});
  $$('[data-i18n-placeholder]').forEach(el=>{const k=el.dataset.i18nPlaceholder;if(b[k]!=null)el.placeholder=b[k]});
  $$('[data-fx]').forEach(el=>{const k=el.dataset.fx;if(u[k]!=null)el.textContent=u[k]});
  renderHistory();
  renderDrumLabels();
  updateSignalStatus();
  updateMidiUi();
  updateDrumPlayUi();
}

function guideCol(num,title,items){
  return `<article class="guide-col"><span class="guide-num">${num}</span><h3 data-fx="${title}"></h3>${items.map(x=>`<div class="guide-item"><span class="gchip ${x[3]}">${x[0]}</span><div><strong data-fx="${x[1]}"></strong><p data-fx="${x[2]}"></p></div></div>`).join('')}</article>`;
}
function guideHTML(){return `<section class="field-guide" id="guide"><div class="shell"><div class="guide-top"><div><p class="eyebrow" data-fx="guideK"></p><h2 data-fx="guideT"></h2></div><p class="guide-lead" data-fx="guideP"></p></div><div class="guide-board">${guideCol('01','gateT',[['●','noteOn','noteOnP',''],['○','tie','tieP',''],['–','rest','restP','']])}${guideCol('02','pitchT',[['D/U','oct','octP',''],['A','acc','accP','acid'],['S','slide','slideP','acid']])}${guideCol('03','knobT',[['CUT','cut','cutP',''],['RES','res','resP',''],['ENV','env','envP','']])}</div><div class="recipe"><div class="recipe-mark">303</div><div><strong data-fx="recipe"></strong><p data-fx="recipeP"></p></div></div></div></section>`}

function liveHTML(){return `<section class="live-io shell" id="live"><div class="live-head"><div><p class="eyebrow" data-fx="liveK"></p><h2 data-fx="liveT"></h2></div><p data-fx="liveP"></p></div><div class="live-grid"><article class="signal-panel"><div class="panel-head"><div><span class="micro" data-fx="sig"></span><strong>OSCILLOSCOPE / FFT</strong></div><div class="analyzer-tabs"><button class="analyzer-tab active" data-mode="scope" type="button" data-fx="scope"></button><button class="analyzer-tab" data-mode="spectrum" type="button" data-fx="spectrum"></button></div></div><div class="scope-stage"><canvas id="fxScope" aria-label="Live audio analyzer"></canvas><div class="signal-readout"><span id="fxNote">--</span><b id="fxHz">-- Hz</b></div></div><div class="signal-foot"><span class="live-state"><i class="live-dot" id="fxDot"></i><b id="fxSignal" data-fx="waiting"></b></span><small data-fx="hint"></small></div></article><article class="midi-panel"><div class="panel-head"><div><span class="micro" data-fx="midi"></span><strong>WEB MIDI OUT</strong></div><span class="midi-badge" id="fxMidiBadge">MIDI</span></div><p class="midi-copy" data-fx="midiP"></p><button id="fxMidiConnect" class="midi-connect" type="button" data-fx="connect"></button><div class="midi-fields"><label class="wide"><span data-fx="out"></span><select id="fxMidiOut" disabled><option>—</option></select></label><label><span data-fx="channel"></span><select id="fxMidiCh"></select></label><label><span data-fx="playout"></span><select id="fxOutMode"><option value="browser" data-fx="browser"></option><option value="both" data-fx="both"></option><option value="midi" data-fx="midiOnly"></option></select></label></div><label class="clock-row"><input id="fxClock" type="checkbox"><span><strong data-fx="clock"></strong><small data-fx="clockHelp"></small></span></label><p class="midi-help" id="fxMidiHelp" data-fx="browserHelp"></p></article></div></section>`}

function historyHTML(){return `<section class="history303" id="history"><div class="shell"><div class="history-top"><div><p class="eyebrow" data-fx="histK"></p><h2 data-fx="histT"></h2></div><p class="history-lead" data-fx="histP"></p></div><div class="timeline" id="fxTimeline"></div><p class="history-sources"><span data-fx="sources"></span> <a href="https://www.roland.com/global/promos/303day/" target="_blank" rel="noopener">Roland 303 Day</a> · <a href="https://articles.roland.com/dj-pierre-and-the-rise-of-acid-house/" target="_blank" rel="noopener">Roland / DJ Pierre</a> · <a href="https://articles.roland.com/beyond-acid-the-enduring-legacy-of-the-tb-303/" target="_blank" rel="noopener">Roland / Beyond Acid</a></p></div></section>`}

function renderHistory(){
  const el=$('#fxTimeline');if(!el)return;
  el.innerHTML=HISTORY[lang()].map((x,i)=>`<article class="era ${[2,3,4,5,6].includes(i)?'key':''}"><time>${x[0]}</time><span class="era-dot"></span><div class="era-copy"><h3>${x[1]}</h3><p>${x[2]}</p><div class="era-tags">${x[3].map((t,j)=>`<span class="${j===x[3].length-1&&/[“”]/.test(t)?'track':''}">${t}</span>`).join('')}</div></div></article>`).join('');
}

const DRUMS=[
  {id:'bd',code:'BD',fixed:'909 BD',variants:[['909','TR-909 BD']]},
  {id:'sd',code:'SD',fixed:'606 SD',variants:[['606','TR-606 SD']]},
  {id:'cp',code:'CP',variants:[['808clap','TR-808 Clap'],['noiseTom','Noise Tom'],['606tom','TR-606 Tom']]},
  {id:'tm',code:'TM',variants:[['808lt','TR-808 LT'],['606lt','TR-606 LT']]},
  {id:'ch',code:'CH',fixed:'606 CH',variants:[['606','TR-606 CH']]},
  {id:'oh',code:'OH',fixed:'606 OH',variants:[['606','TR-606 OH']]}
];
const drumState={
  pattern:Object.fromEntries(DRUMS.map(v=>[v.id,Array(16).fill(false)])),
  levels:Object.fromEntries(DRUMS.map(v=>[v.id,78])),
  variants:{bd:'909',sd:'606',cp:'808clap',tm:'808lt',ch:'606',oh:'606'},
  density:58,master:78,sync:true,playing:false,armed:false,ctx:null,masterNode:null,compressor:null,noise:null,timer:null,step:0,nextAt:0,armObserver:null
};

function drumsHTML(){
  const head=Array.from({length:16},(_,i)=>`<span class="drum-step-head ${[0,4,8,12].includes(i)?'downbeat':''}">${i+1}</span>`).join('');
  const rows=DRUMS.map(v=>`<div class="drum-row" data-drum-row="${v.id}"><div class="drum-voice-cell"><button class="drum-preview" type="button" data-drum-preview="${v.id}"><b>${v.code}</b><span data-drum-name="${v.id}"></span></button><div class="drum-voice-controls"><label><span data-fx="drumVoice"></span><select data-drum-variant="${v.id}">${v.variants.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label><label class="drum-level"><span data-fx="drumLevel"></span><input type="range" min="0" max="100" value="78" data-drum-level="${v.id}"></label></div></div><div class="drum-steps">${Array.from({length:16},(_,i)=>`<button type="button" class="drum-step ${[0,4,8,12].includes(i)?'downbeat':''}" data-drum="${v.id}" data-drum-step="${i}" aria-pressed="false"><span>${i+1}</span></button>`).join('')}</div></div>`).join('');
  return `<section class="drum-machine shell" id="drums"><div class="drum-intro"><div><p class="eyebrow" data-fx="drumK"></p><h2 data-fx="drumT"></h2></div><p data-fx="drumP"></p></div><div class="drum-panel"><div class="drum-toolbar"><div class="drum-actions"><button class="drum-play" id="drumPlay" type="button"><i></i><span data-fx="drumPlay"></span></button><button class="drum-action" id="drumRandom" type="button" data-fx="drumRandom"></button><button class="drum-action danger" id="drumClear" type="button" data-fx="drumClear"></button></div><div class="drum-global"><label class="drum-switch"><input id="drumSync" type="checkbox" checked><span><b data-fx="drumSync"></b><small data-fx="drumSyncHelp"></small></span></label><label class="drum-knobline"><span data-fx="drumDensity"></span><input id="drumDensity" type="range" min="15" max="100" value="58"><b id="drumDensityValue">58%</b></label><label class="drum-knobline"><span data-fx="drumMaster"></span><input id="drumMaster" type="range" min="0" max="100" value="78"><b id="drumMasterValue">78%</b></label></div></div><div class="drum-grid-scroll"><div class="drum-grid"><div class="drum-head-spacer"></div><div class="drum-step-heads">${head}</div>${rows}</div></div><div class="drum-footer"><span><b data-fx="drumSource"></b> <small data-fx="drumSourceText"></small></span><a href="https://www.roland.com/global/products/t-8/" target="_blank" rel="noopener">Roland T-8 specs</a></div></div></section>`;
}

function renderDrumLabels(){
  const n=UI[lang()];
  DRUMS.forEach(v=>{const el=$(`[data-drum-name="${v.id}"]`);if(el)el.textContent=n[v.id]||v.id});
  $$('#drums [data-fx]').forEach(el=>{const k=el.dataset.fx;if(n[k]!=null)el.textContent=n[k]});
  updateDrumPlayUi();
}

function saveDrums(){
  const data={pattern:drumState.pattern,levels:drumState.levels,variants:drumState.variants,density:drumState.density,master:drumState.master,sync:drumState.sync};
  localStorage.setItem('303box-drums',JSON.stringify(data));
}
function loadDrums(){
  try{
    const raw=localStorage.getItem('303box-drums');if(!raw)return;
    const d=JSON.parse(raw);
    DRUMS.forEach(v=>{if(Array.isArray(d.pattern?.[v.id])&&d.pattern[v.id].length===16)drumState.pattern[v.id]=d.pattern[v.id].map(Boolean);if(Number.isFinite(+d.levels?.[v.id]))drumState.levels[v.id]=clamp(+d.levels[v.id],0,100);if(v.variants.some(o=>o[0]===d.variants?.[v.id]))drumState.variants[v.id]=d.variants[v.id]});
    if(Number.isFinite(+d.density))drumState.density=clamp(+d.density,15,100);
    if(Number.isFinite(+d.master))drumState.master=clamp(+d.master,0,100);
    if(typeof d.sync==='boolean')drumState.sync=d.sync;
  }catch(_){ }
}
function renderDrums(){
  DRUMS.forEach(v=>{
    drumState.pattern[v.id].forEach((on,i)=>{const b=$(`[data-drum="${v.id}"][data-drum-step="${i}"]`);if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}});
    const lv=$(`[data-drum-level="${v.id}"]`);if(lv)lv.value=drumState.levels[v.id];
    const va=$(`[data-drum-variant="${v.id}"]`);if(va)va.value=drumState.variants[v.id];
  });
  if($('#drumDensity'))$('#drumDensity').value=drumState.density;
  if($('#drumDensityValue'))$('#drumDensityValue').textContent=`${drumState.density}%`;
  if($('#drumMaster'))$('#drumMaster').value=drumState.master;
  if($('#drumMasterValue'))$('#drumMasterValue').textContent=`${drumState.master}%`;
  if($('#drumSync'))$('#drumSync').checked=drumState.sync;
  setDrumMasterGain();
}
function toggleDrumStep(id,step){
  drumState.pattern[id][step]=!drumState.pattern[id][step];
  if(drumState.pattern[id][step]&&id==='ch')drumState.pattern.oh[step]=false;
  if(drumState.pattern[id][step]&&id==='oh')drumState.pattern.ch[step]=false;
  renderDrums();saveDrums();
}
function randomizeDrums(){
  const d=drumState.density/100;
  for(let i=0;i<16;i++){
    const beat=[0,4,8,12].includes(i), back=[4,12].includes(i), off=[2,6,10,14].includes(i), fill=i>=12;
    drumState.pattern.bd[i]=Math.random()<(beat?.58+.32*d:.04+.18*d);
    drumState.pattern.sd[i]=Math.random()<(back?.58+.28*d:.015+.07*d);
    drumState.pattern.cp[i]=Math.random()<(back?.28+.32*d:.01+.035*d);
    drumState.pattern.tm[i]=Math.random()<(fill?.04+.18*d:.01+.05*d);
    const open=Math.random()<(off?.08+.34*d:.01+.05*d);
    drumState.pattern.oh[i]=open;
    drumState.pattern.ch[i]=!open&&Math.random()<(off?.34+.46*d:.08+.22*d);
  }
  if(!drumState.pattern.bd.some(Boolean))drumState.pattern.bd[0]=true;
  renderDrums();saveDrums();
}
function clearDrums(){DRUMS.forEach(v=>drumState.pattern[v.id].fill(false));renderDrums();saveDrums()}

function getBpm(){return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||Number($('#tempoInput')?.value)||140,50,250)}
function mainPlaying(){return $('#playButton')?.getAttribute('aria-pressed')==='true'}
function mainStep(){const el=$('[data-step-header][data-playing="true"]');return el?Number(el.dataset.stepHeader):-1}

async function ensureDrumAudio(){
  if(drumState.ctx&&drumState.ctx.state!=='closed'){await drumState.ctx.resume();return drumState.ctx}
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;
  const ctx=new Ctx();await ctx.resume();
  const master=ctx.createGain();const comp=ctx.createDynamicsCompressor();
  comp.threshold.value=-10;comp.knee.value=16;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.18;
  master.connect(comp);comp.connect(ctx.destination);
  const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  drumState.ctx=ctx;drumState.masterNode=master;drumState.compressor=comp;drumState.noise=noise;setDrumMasterGain();
  return ctx;
}
function setDrumMasterGain(){if(drumState.masterNode&&drumState.ctx)drumState.masterNode.gain.setTargetAtTime((drumState.master/100)*.78,drumState.ctx.currentTime,.015)}
function voiceLevel(id){return (drumState.levels[id]/100)}
function outGain(ctx,when,level=1){const g=ctx.createGain();g.gain.setValueAtTime(level,when);g.connect(drumState.masterNode);return g}
function noiseSource(ctx){const s=ctx.createBufferSource();s.buffer=drumState.noise;return s}

function hitKick(when,level){
  const c=drumState.ctx,o=c.createOscillator(),g=c.createGain(),out=outGain(c,when,level*.9);
  o.type='sine';o.frequency.setValueAtTime(155,when);o.frequency.exponentialRampToValueAtTime(48,when+.16);
  g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(1,when+.002);g.gain.exponentialRampToValueAtTime(.0001,when+.42);
  o.connect(g);g.connect(out);o.start(when);o.stop(when+.5);
  const n=noiseSource(c),hp=c.createBiquadFilter(),ng=c.createGain();hp.type='highpass';hp.frequency.value=2400;ng.gain.setValueAtTime(.16,when);ng.gain.exponentialRampToValueAtTime(.0001,when+.018);n.connect(hp);hp.connect(ng);ng.connect(out);n.start(when);n.stop(when+.025);
}
function hitSnare(when,level){
  const c=drumState.ctx,out=outGain(c,when,level*.78),n=noiseSource(c),hp=c.createBiquadFilter(),ng=c.createGain();hp.type='highpass';hp.frequency.value=900;ng.gain.setValueAtTime(.68,when);ng.gain.exponentialRampToValueAtTime(.0001,when+.19);n.connect(hp);hp.connect(ng);ng.connect(out);n.start(when);n.stop(when+.22);
  [185,335].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(f,when);g.gain.setValueAtTime(.28/(i+1),when);g.gain.exponentialRampToValueAtTime(.0001,when+.12);o.connect(g);g.connect(out);o.start(when);o.stop(when+.15)});
}
function hitClap(when,level){
  const c=drumState.ctx,out=outGain(c,when,level*.72),n=noiseSource(c),bp=c.createBiquadFilter(),hp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=1250;bp.Q.value=.65;hp.type='highpass';hp.frequency.value=550;
  g.gain.setValueAtTime(.0001,when);[[0,.92],[.018,.0001],[.028,.72],[.045,.0001],[.055,.58],[.074,.0001],[.082,.44]].forEach(([t,v])=>g.gain.setValueAtTime(Math.max(.0001,v),when+t));g.gain.exponentialRampToValueAtTime(.0001,when+.28);
  n.connect(bp);bp.connect(hp);hp.connect(g);g.connect(out);n.start(when);n.stop(when+.32);
}
function hitTom(when,level,variant='808lt'){
  const c=drumState.ctx,out=outGain(c,when,level*.82),o=c.createOscillator(),g=c.createGain();
  const is606=variant==='606lt'||variant==='606tom';const start=is606?170:135,end=is606?105:78; o.type=is606?'triangle':'sine';o.frequency.setValueAtTime(start,when);o.frequency.exponentialRampToValueAtTime(end,when+.2);g.gain.setValueAtTime(.75,when);g.gain.exponentialRampToValueAtTime(.0001,when+(is606?.24:.38));o.connect(g);g.connect(out);o.start(when);o.stop(when+.44);
}
function hitNoiseTom(when,level){
  hitTom(when,level*.7,'606tom');const c=drumState.ctx,out=outGain(c,when,level*.38),n=noiseSource(c),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=520;bp.Q.value=1.2;g.gain.setValueAtTime(.5,when);g.gain.exponentialRampToValueAtTime(.0001,when+.22);n.connect(bp);bp.connect(g);g.connect(out);n.start(when);n.stop(when+.25);
}
function hitHat(when,level,open=false){
  const c=drumState.ctx,out=outGain(c,when,level*(open?.44:.34)),mix=c.createGain(),hp=c.createBiquadFilter(),bp=c.createBiquadFilter(),g=c.createGain();hp.type='highpass';hp.frequency.value=5600;bp.type='bandpass';bp.frequency.value=8900;bp.Q.value=.75;const dur=open?.42:.075;g.gain.setValueAtTime(.72,when);g.gain.exponentialRampToValueAtTime(.0001,when+dur);mix.connect(hp);hp.connect(bp);bp.connect(g);g.connect(out);[205,304,369,522,613,812].forEach(f=>{const o=c.createOscillator();o.type='square';o.frequency.value=f;o.connect(mix);o.start(when);o.stop(when+dur+.03)});
}
function playVoice(id,when){const l=voiceLevel(id);if(l<=.001)return;switch(id){case'bd':hitKick(when,l);break;case'sd':hitSnare(when,l);break;case'cp':{const v=drumState.variants.cp;if(v==='808clap')hitClap(when,l);else if(v==='noiseTom')hitNoiseTom(when,l);else hitTom(when,l,'606tom');break}case'tm':hitTom(when,l,drumState.variants.tm);break;case'ch':hitHat(when,l,false);break;case'oh':hitHat(when,l,true);break}}

function scheduleDrumVisual(step,when){const c=drumState.ctx;const delay=Math.max(0,(when-c.currentTime)*1000);setTimeout(()=>{if(!drumState.playing)return;$$('.drum-step[data-current="true"]').forEach(x=>x.removeAttribute('data-current'));$$(`.drum-step[data-drum-step="${step}"]`).forEach(x=>x.setAttribute('data-current','true'))},delay)}
function drumScheduler(){
  if(!drumState.playing||!drumState.ctx)return;
  while(drumState.nextAt<drumState.ctx.currentTime+.12){const s=drumState.step;DRUMS.forEach(v=>{if(drumState.pattern[v.id][s])playVoice(v.id,drumState.nextAt)});scheduleDrumVisual(s,drumState.nextAt);drumState.nextAt+=(60/getBpm())/4;drumState.step=(drumState.step+1)%16}
  drumState.timer=setTimeout(drumScheduler,25);
}
async function startDrumsNow(){
  if(drumState.playing)return;const c=await ensureDrumAudio();if(!c)return;drumState.armed=false;drumState.playing=true;drumState.step=0;drumState.nextAt=c.currentTime+.045;updateDrumPlayUi();updateSignalStatus();drumScheduler();
}
function armDrums(){
  if(drumState.armObserver){drumState.armObserver.disconnect();drumState.armObserver=null}
  drumState.armed=true;updateDrumPlayUi();const target=$('#stepHeaderRow');if(!target){startDrumsNow();return}
  const check=()=>{if(!drumState.armed)return;const s=mainStep();if(s===0){drumState.armObserver?.disconnect();drumState.armObserver=null;startDrumsNow()}};
  drumState.armObserver=new MutationObserver(check);drumState.armObserver.observe(target,{attributes:true,subtree:true,attributeFilter:['data-playing']});check();
}
async function toggleDrums(){
  if(drumState.playing||drumState.armed){stopDrums();return}
  if(drumState.sync&&mainPlaying()){armDrums();return}
  await startDrumsNow();
}
function stopDrums(){
  if(drumState.timer)clearTimeout(drumState.timer);drumState.timer=null;drumState.playing=false;drumState.armed=false;drumState.armObserver?.disconnect();drumState.armObserver=null;$$('.drum-step[data-current="true"]').forEach(x=>x.removeAttribute('data-current'));updateDrumPlayUi();updateSignalStatus();
}
function updateDrumPlayUi(){
  const b=$('#drumPlay');if(!b)return;const n=UI[lang()];b.classList.toggle('playing',drumState.playing);b.classList.toggle('armed',drumState.armed);b.querySelector('span').textContent=drumState.armed?n.drumArmed:(drumState.playing?n.drumStop:n.drumPlay);
}

function bindDrums(){
  loadDrums();renderDrums();renderDrumLabels();
  $('#drumPlay')?.addEventListener('click',toggleDrums);
  $('#drumRandom')?.addEventListener('click',randomizeDrums);
  $('#drumClear')?.addEventListener('click',clearDrums);
  $('#drums')?.addEventListener('click',e=>{const s=e.target.closest('.drum-step');if(s)toggleDrumStep(s.dataset.drum,Number(s.dataset.drumStep));const p=e.target.closest('[data-drum-preview]');if(p)ensureDrumAudio().then(()=>playVoice(p.dataset.drum,drumState.ctx.currentTime+.015))});
  $$('#drums [data-drum-level]').forEach(el=>el.addEventListener('input',e=>{const id=e.target.dataset.drumLevel;drumState.levels[id]=+e.target.value;saveDrums()}));
  $$('#drums [data-drum-variant]').forEach(el=>el.addEventListener('change',e=>{drumState.variants[e.target.dataset.drumVariant]=e.target.value;saveDrums()}));
  $('#drumDensity')?.addEventListener('input',e=>{drumState.density=+e.target.value;$('#drumDensityValue').textContent=`${drumState.density}%`;saveDrums()});
  $('#drumMaster')?.addEventListener('input',e=>{drumState.master=+e.target.value;$('#drumMasterValue').textContent=`${drumState.master}%`;setDrumMasterGain();saveDrums()});
  $('#drumSync')?.addEventListener('change',e=>{drumState.sync=e.target.checked;saveDrums()});
}

const nativeConnect=window.AudioNode?.prototype?.connect;
const taps=new WeakMap();
const internal=new WeakSet();
let tap=null,anMode='scope';
if(nativeConnect){
  window.AudioNode.prototype.connect=function(dest,...args){
    try{
      const ctx=this?.context;
      if(ctx&&dest===ctx.destination&&!internal.has(this)){
        let t=taps.get(ctx);
        if(!t){
          const an=ctx.createAnalyser(),mon=ctx.createGain();an.fftSize=2048;an.smoothingTimeConstant=.72;mon.gain.value=1;internal.add(an);internal.add(mon);nativeConnect.call(an,mon);nativeConnect.call(mon,dest);t={ctx,an,mon};taps.set(ctx,t);
        }
        tap=t;nativeConnect.call(this,t.an);return dest;
      }
    }catch(e){console.warn('303box analyzer tap:',e)}
    return nativeConnect.call(this,dest,...args);
  };
}
function canvasMetrics(){const c=$('#fxScope');if(!c)return null;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h}return[c,c.getContext('2d'),w,h]}
function nearest(hz){if(!hz||hz<20)return'--';const m=Math.round(69+12*Math.log2(hz/440)),n=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];return n[(m%12+12)%12]+(Math.floor(m/12)-1)}
function updatePeak(arr,t){let m=0,ix=0,per=t.ctx.sampleRate/t.an.fftSize,max=Math.min(arr.length-1,Math.floor(5000/per));for(let i=1;i<=max;i++)if(arr[i]>m){m=arr[i];ix=i}const hz=m<18?0:ix*per;if($('#fxHz'))$('#fxHz').textContent=hz?Math.round(hz)+' Hz':'-- Hz';if($('#fxNote'))$('#fxNote').textContent=nearest(hz)}
function drawAnalyzer(){requestAnimationFrame(drawAnalyzer);const q=canvasMetrics();if(!q)return;const[,g,w,h]=q;g.clearRect(0,0,w,h);if(!tap||tap.ctx.state==='closed'){g.strokeStyle='rgba(221,255,55,.22)';g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();return}if(anMode==='spectrum'){const a=new Uint8Array(tap.an.frequencyBinCount);tap.an.getByteFrequencyData(a);const per=tap.ctx.sampleRate/tap.an.fftSize,n=Math.min(a.length,Math.floor(6000/per)),bw=w/n;g.fillStyle='#ddff37';for(let i=0;i<n;i++){const v=a[i]/255,bh=Math.pow(v,1.45)*h*.9;g.globalAlpha=.18+v*.82;g.fillRect(i*bw,h-bh,Math.max(1,bw*.7),bh)}g.globalAlpha=1;updatePeak(a,tap)}else{const a=new Uint8Array(tap.an.fftSize);tap.an.getByteTimeDomainData(a);g.strokeStyle='#ddff37';g.lineWidth=Math.max(1.5,w/650);g.beginPath();a.forEach((v,i)=>{const x=i/(a.length-1)*w,y=v/255*h;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();const f=new Uint8Array(tap.an.frequencyBinCount);tap.an.getByteFrequencyData(f);updatePeak(f,tap)}}
function updateSignalStatus(){const on=mainPlaying()||drumState.playing,n=UI[lang()];if($('#fxSignal'))$('#fxSignal').textContent=n[on?'active':'waiting'];$('#fxDot')?.classList.toggle('on',on)}

let midiAccess=null,midiTimer=null,midiStep=0,midiNext=0;
let midiOutId=localStorage.getItem('303-midi-output')||'',midiChannel=clamp(Number(localStorage.getItem('303-midi-channel'))||1,1,16),midiClock=localStorage.getItem('303-midi-clock')==='1',outMode=localStorage.getItem('303-out-mode')||'browser';
const midiOut=()=>midiAccess?.outputs.get(midiOutId)||null;
function noteNumber(note,oct){const map={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};let n=map[note];if(n==null)return null;if(oct==='D')n-=12;if(oct==='U')n+=12;return clamp(n,0,127)}
function readPatternStep(i){return{note:$(`[data-row="note"][data-step="${i}"]`)?.value?.trim().toUpperCase()||'',octave:$(`[data-row="octave"][data-step="${i}"]`)?.textContent?.trim()||'',as:$(`[data-row="accentSlide"][data-step="${i}"]`)?.textContent?.trim()||'',gate:$(`[data-row="gate"][data-step="${i}"]`)?.textContent?.trim()||''}}
function midiScheduleStep(i,whenMs,stepDurMs){const o=midiOut();if(!o)return;const d=readPatternStep(i),n=noteNumber(d.note,d.octave);if(n==null||d.gate==='-')return;const status=0x90+(midiChannel-1),off=0x80+(midiChannel-1),vel=d.as.includes('A')?118:88;o.send([status,n,vel],whenMs);const slide=d.as.includes('S'),dur=d.gate==='○'||slide?stepDurMs*1.08:stepDurMs*.66;o.send([off,n,0],whenMs+Math.max(20,dur))}
function midiTick(){if(!midiTimer)return;const o=midiOut();if(!o){midiStop(false);return}const now=performance.now(),bpm=getBpm(),stepDur=60000/bpm/4;while(midiNext<now+120){midiScheduleStep(midiStep,midiNext,stepDur);if(midiClock){const tick=60000/bpm/24;for(let j=0;j<6;j++)o.send([0xF8],midiNext+j*tick)}midiNext+=stepDur;midiStep=(midiStep+1)%16}midiTimer=setTimeout(midiTick,25)}
function midiStart(){if(outMode==='browser')return;const o=midiOut();if(!o){midiStatus('choose');return}midiStop(false);if(midiClock)o.send([0xFA]);midiStep=0;midiNext=performance.now()+55;midiTimer=setTimeout(midiTick,0)}
function midiStop(stopMsg=true){if(midiTimer)clearTimeout(midiTimer);midiTimer=null;const o=midiOut();if(o){try{o.clear();o.send([0xB0+(midiChannel-1),123,0]);if(stopMsg&&midiClock)o.send([0xFC])}catch(_){}}}
async function connectMidi(){if(!navigator.requestMIDIAccess){midiStatus('unsupported');return}try{midiAccess=await navigator.requestMIDIAccess();midiAccess.onstatechange=refreshOutputs;refreshOutputs()}catch(_){midiStatus('denied')}}
function refreshOutputs(){const s=$('#fxMidiOut'),a=midiAccess?[...midiAccess.outputs.values()].filter(x=>x.state!=='disconnected'):[];if(!s)return;s.disabled=false;s.innerHTML='<option value="">—</option>'+a.map(x=>`<option value="${x.id}">${[x.manufacturer,x.name].filter(Boolean).join(' — ')}</option>`).join('');if(a.some(x=>x.id===midiOutId))s.value=midiOutId;else if(a.length===1){midiOutId=a[0].id;s.value=midiOutId;localStorage.setItem('303-midi-output',midiOutId)}midiStatus(a.length?'ready':'empty')}
function midiStatus(kind){const n=UI[lang()],b=$('#fxMidiBadge'),h=$('#fxMidiHelp'),bt=$('#fxMidiConnect');if(!b||!h||!bt)return;b.classList.remove('ready');if(!navigator.requestMIDIAccess||kind==='unsupported'){b.textContent=n.unsupported;bt.disabled=true;h.textContent=n.browserHelp;return}bt.disabled=false;if(kind==='denied'){b.textContent=n.unsupported;h.textContent=n.denied;return}if(kind==='choose'){b.textContent='MIDI';h.textContent=n.choose;return}if(kind==='empty'){b.textContent=n.noOutput;h.textContent=n.browserHelp;return}b.textContent=n.available;b.classList.add('ready');bt.textContent=midiAccess?n.connected:n.connect;bt.classList.toggle('connected',!!midiAccess);h.textContent=n.browserHelp}
function updateMidiUi(){midiStatus(midiAccess?'ready':undefined)}

function mount(){
  const seq=$('#sequencer');
  if(seq&&!$('#live'))seq.insertAdjacentHTML('afterend',liveHTML());
  if(seq&&!$('#drums'))seq.insertAdjacentHTML('afterend',drumsHTML());
  const wf=$('#workflow');if(wf)wf.outerHTML=guideHTML();
  const ref=$('#reference');if(ref)ref.outerHTML=historyHTML();
  const nav=$('.nav');if(nav)nav.innerHTML='<a href="#sequencer" data-i18n="navSequencer"></a><a href="#drums" data-fx="navDrums"></a><a href="#live" data-fx="navLive"></a><a href="#guide" data-fx="navGuide"></a><a href="#history" data-fx="navHistory"></a><a href="#faq" data-i18n="navFaq"></a>';
  $('.triangle-logo')?.remove();
  const facts=$$('.hero-facts > div');if(facts.length>2)facts.slice(2).forEach(x=>x.remove());
  const author=$('#authorInput');if(author&&(author.value.trim()===''||author.value.trim()==='DJ Pierre')){author.value='Z3Z';author.dispatchEvent(new Event('input',{bubbles:true}))}
  applyLang();
}

function bind(){
  const sc=$('#fxMidiCh');for(let i=1;i<=16;i++)sc?.insertAdjacentHTML('beforeend',`<option value="${i}">${i}</option>`);if(sc)sc.value=midiChannel;if($('#fxOutMode'))$('#fxOutMode').value=outMode;if($('#fxClock'))$('#fxClock').checked=midiClock;
  $('#fxMidiConnect')?.addEventListener('click',connectMidi);
  $('#fxMidiOut')?.addEventListener('change',e=>{midiOutId=e.target.value;localStorage.setItem('303-midi-output',midiOutId);midiStatus('ready')});
  sc?.addEventListener('change',e=>{midiChannel=clamp(+e.target.value||1,1,16);localStorage.setItem('303-midi-channel',midiChannel)});
  $('#fxClock')?.addEventListener('change',e=>{midiClock=e.target.checked;localStorage.setItem('303-midi-clock',midiClock?'1':'0')});
  $('#fxOutMode')?.addEventListener('change',e=>{outMode=e.target.value;localStorage.setItem('303-out-mode',outMode);if($('#playButton')?.getAttribute('aria-pressed')==='true'){outMode==='browser'?midiStop():midiStart()}});
  $$('.analyzer-tab').forEach(b=>b.addEventListener('click',()=>{anMode=b.dataset.mode;$$('.analyzer-tab').forEach(x=>x.classList.toggle('active',x===b))}));
  const p=$('#playButton');if(p)new MutationObserver(()=>{const on=mainPlaying();updateSignalStatus();on?midiStart():midiStop()}).observe(p,{attributes:true,attributeFilter:['aria-pressed']});
  bindDrums();midiStatus();updateSignalStatus();drawAnalyzer();
}

new MutationObserver(applyLang).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.addEventListener('DOMContentLoaded',()=>{mount();bind()});
})();
