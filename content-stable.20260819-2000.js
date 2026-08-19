(() => {
  'use strict';

  const lang = () => document.documentElement.lang === 'tr' ? 'tr' : 'en';
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];

  const COPY = {
    en: {
      pageTitle:'303box — 303 Pattern Sketchpad for Hardware',
      pageDescription:'A browser sketchpad for writing, previewing and transferring 303 and rhythm patterns to hardware. Rule-based random starts, not AI composition and not a replacement for live performance.',
      skip:'Skip to sequencer', brandTag:'Acid pattern laboratory', openSequencer:'Open sequencer',
      heroKicker:'PATTERN SKETCHPAD / HARDWARE WORKFLOW',
      heroTitle:'Sketch the pattern here. Perform it on your hardware.',
      heroLead:'303box is a faster way to write down, edit and audition 16-step ideas before taking them to real hardware. It does not make music for you: you choose the notes, keep or reject the random starting points, move the controls and perform the final result.',
      heroPrimary:'Build a pattern', heroSecondary:'What this tool is', factSteps:'steps',
      bandOneTitle:'Write the idea faster', bandOneText:'Use the browser as a readable pattern notebook.',
      bandTwoTitle:'Audition the sketch', bandTwoText:'Listen before committing the pattern to hardware.',
      bandThreeTitle:'Take it to the machine', bandThreeText:'Transfer the useful idea, then perform and save it on the device.',
      sequencerEyebrow:'Pattern workspace', sequencerTitle:'Write the pattern clearly. Then take it to the instrument.',
      sequencerIntro:'The grid is a practical notation and audition surface for 16-step ideas. Random is only a rule-based starting point; every musical decision can be edited by hand.',
      generate:'GENERATE', download:'DOWNLOAD', clear:'CLEAR', play:'PLAY', stop:'STOP',
      author:'Author', title:'Title', step:'Step', note:'Note', octave:'Down / Up', accentSlide:'Accent / Slide', gate:'Gate', waveform:'Waveform', tempo:'Tempo', notes:'EFX / Notes', notesPlaceholder:'Write your patch notes here...',
      cutoff:'Cutoff', resonance:'Resonance', envMod:'Env Mod', decay:'Decay', accent:'Accent',
      workflowEyebrow:'303 workflow', workflowTitle:'A strong acid pattern starts with rhythm, not complexity.',
      workflowLead:'Use a small pitch vocabulary and let timing, accent, slide and filter movement create the character.',
      flowOneTitle:'Create space', flowOneText:'Use rests before adding more notes. A good 303 line needs negative space to bounce.',
      flowTwoTitle:'Choose the pressure points', flowTwoText:'Accent only the steps that should punch through. Slide should connect intentional pitch targets.',
      flowThreeTitle:'Perform the filter', flowThreeText:'Keep resonance alive and move cutoff, envelope modulation and decay while the loop repeats.',
      referenceEyebrow:'Sequencer reference', referenceTitle:'Six symbols. A lot of movement.', referenceLead:'The grid stays intentionally simple so the relationship between steps remains readable at a glance.',
      refTrigger:'Trigger', refTriggerText:'Starts a note and its envelope.', refTie:'Tie', refTieText:'Extends the gate into the next step.', refRest:'Rest', refRestText:'Leaves rhythmic space.', refAccent:'Accent', refAccentText:'Adds volume and filter emphasis.', refSlide:'Slide', refSlideText:'Glides toward the next pitch.', refOctave:'Octave', refOctaveText:'Moves the oscillator down or up one octave.',
      faqEyebrow:'FAQ', faqTitle:'Built to get out of the way.', faqLead:'No account, no project setup and no software installation.',
      faqOneQ:'What is 303box?', faqOneA:'A browser-based 16-step acid pattern sketchpad for writing, previewing and transferring bass and rhythm ideas to hardware.',
      faqTwoQ:'Does 303box make music for me?', faqTwoA:'No. Random generation is rule-based and only supplies a starting point. You make the musical decisions and the performance.',
      faqThreeQ:'Can I export my pattern?', faqThreeA:'Yes. Download the pattern sheet as a visual reference for your hardware session.',
      faqFourQ:'Where is my pattern stored?', faqFourA:'Session settings are stored locally in your browser. Fresh page loads can start with a new rule-based sketch.',
      footerText:'A focused acid pattern tool for browser and hardware workflows.'
    },
    tr: {
      pageTitle:'303box — Donanım için 303 Pattern Çalışma Alanı',
      pageDescription:'303 ve ritim pattern’lerini tarayıcıda yazmak, önizlemek ve donanıma taşımak için çalışma alanı. Rastgele başlangıçlar kural tabanlıdır; yapay zekâ bestecisi veya canlı performansın yerine geçen bir araç değildir.',
      skip:'Sequencer’a geç', brandTag:'Acid pattern laboratuvarı', openSequencer:'Sequencer’ı aç',
      heroKicker:'PATTERN ÇALIŞMA ALANI / DONANIM AKIŞI',
      heroTitle:'Pattern’i burada tasarla. Donanımında performe et.',
      heroLead:'303box, 16 adımlı fikirleri gerçek donanıma taşımadan önce daha rahat yazmak, düzenlemek ve dinlemek için oluşturulmuş bir çalışma alanıdır. Müziği senin yerine yapmaz: notaları sen seçersin, rastgele başlangıçları kabul eder veya değiştirirsin, kontrolleri sen hareket ettirir ve son performansı sen yaparsın.',
      heroPrimary:'Pattern oluştur', heroSecondary:'Bu araç nedir?', factSteps:'adım',
      bandOneTitle:'Fikri daha hızlı yaz', bandOneText:'Tarayıcıyı okunaklı bir pattern defteri gibi kullan.',
      bandTwoTitle:'Taslağı dinle', bandTwoText:'Pattern’i donanıma almadan önce nasıl aktığını kontrol et.',
      bandThreeTitle:'Makineye taşı', bandThreeText:'İşe yarayan fikri cihaza aktar; performansı ve kaydı donanımda tamamla.',
      sequencerEyebrow:'Pattern çalışma alanı', sequencerTitle:'Pattern’i net yaz. Sonra enstrümana taşı.',
      sequencerIntro:'Grid, 16 adımlı fikirleri yazmak ve dinlemek için pratik bir yüzeydir. Rastgele üretim yalnızca kural tabanlı bir başlangıçtır; bütün müzikal kararlar elle değiştirilebilir.',
      generate:'ÜRET', download:'İNDİR', clear:'TEMİZLE', play:'ÇAL', stop:'DUR',
      author:'Yazar', title:'Başlık', step:'Adım', note:'Nota', octave:'Aşağı / Yukarı', accentSlide:'Vurgu / Kaydırma', gate:'Gate', waveform:'Dalga formu', tempo:'Tempo', notes:'EFX / Notlar', notesPlaceholder:'Patch notlarını buraya yaz...',
      cutoff:'Cutoff', resonance:'Rezonans', envMod:'Env Mod', decay:'Decay', accent:'Vurgu',
      workflowEyebrow:'303 çalışma akışı', workflowTitle:'Güçlü bir acid pattern karmaşıklıkla değil, ritimle başlar.',
      workflowLead:'Az sayıda perde kullan; karakteri zamanlama, vurgu, kaydırma ve filtre hareketi oluştursun.',
      flowOneTitle:'Boşluk yarat', flowOneText:'Daha fazla nota eklemeden önce es kullan. İyi bir 303 line’ın sekebilmesi için boşluğa ihtiyacı vardır.',
      flowTwoTitle:'Baskı noktalarını seç', flowTwoText:'Yalnızca öne çıkması gereken adımları vurgula. Kaydırma, bilinçli perde hedeflerini birbirine bağlasın.',
      flowThreeTitle:'Filtreyi performe et', flowThreeText:'Loop dönerken rezonans, cutoff, envelope modulation ve decay ile hareket yarat.',
      referenceEyebrow:'Sequencer referansı', referenceTitle:'Altı sembol. Büyük hareket alanı.', referenceLead:'Grid özellikle sade tutulur; böylece adımlar arasındaki ilişki tek bakışta okunur.',
      refTrigger:'Tetikleme', refTriggerText:'Notayı ve zarfını başlatır.', refTie:'Bağ', refTieText:'Gate’i sonraki adıma uzatır.', refRest:'Es', refRestText:'Ritmik boşluk bırakır.', refAccent:'Vurgu', refAccentText:'Ses ve filtre vurgusunu artırır.', refSlide:'Kaydırma', refSlideText:'Bir sonraki perdeye yumuşak geçiş yapar.', refOctave:'Oktav', refOctaveText:'Osilatörü bir oktav aşağı veya yukarı taşır.',
      faqEyebrow:'SSS', faqTitle:'Araya girmemek için tasarlandı.', faqLead:'Hesap yok, proje kurulumu yok, yazılım kurulumu yok.',
      faqOneQ:'303box nedir?', faqOneA:'Acid bass ve ritim fikirlerini yazmak, dinlemek ve donanıma taşımak için tarayıcıda çalışan 16 adımlı bir pattern çalışma alanıdır.',
      faqTwoQ:'303box müziği benim yerime mi yapıyor?', faqTwoA:'Hayır. Rastgele üretim yalnızca kural tabanlı bir başlangıç sağlar. Müzikal kararlar ve performans kullanıcıya aittir.',
      faqThreeQ:'Pattern’i dışa aktarabilir miyim?', faqThreeA:'Evet. Donanım oturumunda referans olarak kullanmak için pattern sayfasını indirebilirsin.',
      faqFourQ:'Pattern’im nerede saklanıyor?', faqFourA:'Oturum ayarları tarayıcıda yerel olarak saklanır. Yeni sayfa yüklemeleri yeni bir kural tabanlı taslakla başlayabilir.',
      footerText:'Tarayıcı ve donanım çalışma akışları için odaklı bir acid pattern aracı.'
    }
  };

  const STATIC = {
    en:{
      nav:['Sequencer','Guide','FAQ'],
      intent:['WHAT 303BOX IS','A notebook with sound — not a replacement for the musician.','The random buttons use simple musical rules to create a starting point; they are not an AI composition model. 303box exists to make tiny-step editing easier, let you hear the sketch, and help you move that idea onto hardware. The musical decisions and the performance remain yours.'],
      cards:[['Sketch faster','Type and edit a 16-step idea on a large screen instead of entering every step through a small hardware interface.'],['Preview, do not outsource','Hear the pattern, change it, reject it, rebuild it. The preview is a workspace for decisions, not a finished performance.'],['Finish on hardware','Send or record the pattern into supported gear, then shape, perform and save it on the device itself.']]
    },
    tr:{
      nav:['Sequencer','Rehber','SSS'],
      intent:['303BOX NEDİR','Sesli bir pattern defteri — müzisyenin yerine geçen bir araç değil.','Rastgele düğmeleri yalnızca basit müzikal kurallarla bir başlangıç noktası üretir; bir yapay zekâ beste modeli değildir. 303box küçük adımları daha rahat düzenlemek, taslağı duymak ve fikri donanıma taşımak için vardır. Müzikal kararlar ve performans sana aittir.'],
      cards:[['Daha hızlı tasarla','16 adımlı fikri küçük bir donanım ekranından tek tek girmek yerine büyük ekranda yaz ve düzenle.'],['Önizle, devretme','Pattern’i dinle, değiştir, reddet veya yeniden kur. Önizleme karar vermek içindir; bitmiş performans değildir.'],['Donanımda tamamla','Pattern’i desteklenen cihaza taşı; tınıyı, performansı ve son kaydı donanım üzerinde tamamla.']]
    }
  };

  function setText(selector,value){const el=$(selector);if(el&&el.textContent!==value)el.textContent=value}

  function apply(){
    const l=lang(), c=COPY[l], s=STATIC[l];
    $$('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(c[key]!=null&&el.textContent!==c[key])el.textContent=c[key]});
    $$('[data-i18n-placeholder]').forEach(el=>{const key=el.dataset.i18nPlaceholder;if(c[key]!=null)el.placeholder=c[key]});

    document.title=c.pageTitle;
    $('meta[name="description"]')?.setAttribute('content',c.pageDescription);
    setText('#heroTitle',c.heroTitle);
    setText('.hero .hero-lead',c.heroLead);
    setText('.hero .secondary-cta',c.heroSecondary);

    $$('.site-header .nav a').forEach((el,i)=>{if(s.nav[i])el.textContent=s.nav[i]});
    setText('.intent-kicker',s.intent[0]);
    setText('.intent-title',s.intent[1]);
    setText('.intent-lead',s.intent[2]);
    $$('.intent-grid article').forEach((article,i)=>{
      const pair=s.cards[i];if(!pair)return;
      const b=article.querySelector('b'),p=article.querySelector('p');
      if(b)b.textContent=pair[0];if(p)p.textContent=pair[1];
    });

    // Keep the visible app labels aligned with the single language state.
    setText('#midiConnectCopy',l==='tr'?'MIDI’Yİ AÇ':'ENABLE MIDI');
    setText('#midiOutputLabel',l==='tr'?'ÇIKIŞ':'OUTPUT');
    setText('#midiDeviceLabel',l==='tr'?'CİHAZ':'DEVICE');
    setText('#midiPlaybackLabel',l==='tr'?'ÇALMA':'PLAYBACK');
    setText('#midiBassLabel',l==='tr'?'BASS KANAL':'BASS CH');
    setText('#midiRhythmLabel',l==='tr'?'RİTİM KANAL':'RHYTHM CH');
    setText('#midiClockTitle',l==='tr'?'CLOCK GÖNDER':'SEND CLOCK');
    setText('#midiTransportTitle',l==='tr'?'START / STOP GÖNDER':'SEND START / STOP');

    const current=$('#languageCurrent'), next=$('#languageNext');
    if(current)current.textContent=l.toUpperCase();
    if(next)next.textContent=l==='en'?'TR':'EN';
  }

  let queued=false;
  function queueApply(){
    if(queued)return;queued=true;
    queueMicrotask(()=>{queued=false;apply()});
  }

  new MutationObserver(queueApply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('303box:content-refresh',queueApply);
  window.__303boxContentStable={version:'2000',apply,queueApply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
