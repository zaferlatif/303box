(() => {
  'use strict';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const language=()=>document.documentElement.lang==='tr'?'tr':'en';

  // Final authority for persistent, visible copy. Feature modules may own
  // transient status messages, but labels pass through this dictionary.
  const COPY={
    en:{
      pageTitle:'303box — 303 Pattern Sketchpad for Hardware',
      pageDescription:'A browser sketchpad for writing, previewing and transferring 303 and rhythm patterns to hardware. Rule-based random starts, not AI composition and not a replacement for live performance.',
      skip:'Skip to sequencer',brandTag:'Acid pattern laboratory',changeLanguage:'Change language',openSequencer:'Open sequencer',signalLabel:'303box / SIGNAL',liveLabel:'LIVE',visualAccent:'ACCENT',visualSlide:'SLIDE',visualRhythm:'RHYTHM',acidConsoleTitle:'ACID CONSOLE',consoleMaster:'MASTER',
      heroKicker:'PATTERN SKETCHPAD / HARDWARE WORKFLOW',heroTitle:'Sketch the pattern here. Perform it on your hardware.',heroLead:'303box is a faster way to write down, edit and audition 16-step ideas before taking them to real hardware. It does not make music for you: you choose the notes, keep or reject the random starting points, move the controls and perform the final result.',heroPrimary:'Build a pattern',heroSecondary:'What this tool is',factSteps:'steps',
      bandOneTitle:'Write the idea faster',bandOneText:'Use the browser as a readable pattern notebook.',bandTwoTitle:'Audition the sketch',bandTwoText:'Listen before committing the pattern to hardware.',bandThreeTitle:'Take it to the machine',bandThreeText:'Transfer the useful idea, then perform and save it on the device.',
      intentKicker:'WHAT 303BOX IS',intentTitle:'A notebook with sound — not a replacement for the musician.',intentLead:'The random buttons use simple musical rules to create a starting point; they are not an AI composition model. 303box exists to make tiny-step editing easier, let you hear the sketch, and help you move that idea onto hardware. The musical decisions and the performance remain yours.',intentOneTitle:'Sketch faster',intentOneText:'Type and edit a 16-step idea on a large screen instead of entering every step through a small hardware interface.',intentTwoTitle:'Preview, do not outsource',intentTwoText:'Hear the pattern, change it, reject it, rebuild it. The preview is a workspace for decisions, not a finished performance.',intentThreeTitle:'Finish on hardware',intentThreeText:'Send or record the pattern into supported gear, then shape, perform and save it on the device itself.',
      sequencerEyebrow:'Pattern workspace',sequencerTitle:'Write the pattern clearly. Then take it to the instrument.',sequencerIntro:'The grid is a practical notation and audition surface for 16-step ideas. Random is only a rule-based starting point; every musical decision can be edited by hand.',
      generate:'GENERATE',download:'DOWNLOAD',clear:'CLEAR',play:'PLAY',stop:'STOP',waitForStep:'WAITING FOR STEP 1',playAll:'PLAY BASS + RHYTHM',stopAll:'STOP BASS + RHYTHM',author:'Author',title:'Title',step:'Step',note:'Note',octave:'Down / Up',accentSlide:'Accent / Slide',gate:'Gate',waveform:'Waveform',tempo:'Tempo',notes:'EFX / Notes',notesPlaceholder:'Write your patch notes here...',cutoff:'Cutoff',resonance:'Resonance',envMod:'Env Mod',decay:'Decay',accent:'Accent',randomPatch:'RANDOM PATCH',knobTune:'TUNE',knobDelay:'DELAY',knobDistortion:'DISTORTION',knobReverb:'REVERB',knobFeedback:'FEEDBACK',shortcutKicker:'303box / KEYS',shortcutClose:'Close keyboard shortcuts',
      tempoDialogEyebrow:'Tempo',tempoDialogTitle:'Set BPM',cancel:'Cancel',apply:'Apply',sheetKicker:'303BOX / SEQUENCER SHEET',sheetModel:'ANALOG BASS LINE / 16 STEPS',patternSheetLabel:'303 pattern sheet',acidConsoleLabel:'Acid console',scopeLabel:'303 oscillator scope and FFT',scopeInputLabel:'Oscilloscope audio input',
      rhythmEyebrow:'303 COMPANION RHYTHM',rhythmTitle:'Build the rhythm beside the acid line.',rhythmLead:'A six-part 16-step rhythm section running on the same clock as the 303.',level:'LEVEL',voiceClap:'Clap',voiceLowTom:'Low Tom',rhythmVoiceMap:'RHYTHM VOICE MAP',rhythmVoiceMapLead:'Voice characters follow the hardware-inspired architecture.',rhythmVoiceBd:'Bass drum.',rhythmVoice606:'Snare and both hi-hats.',rhythmVoiceCp:'Hand-clap character.',rhythmVoiceTm:'Low-tom character.',
      midiEnable:'ENABLE MIDI',midiEnabled:'MIDI ENABLED',midiRearm:'RE-ARM MIDI',midiOutput:'OUTPUT',midiDevice:'DEVICE',midiPlayback:'PLAYBACK',midiBassChannel:'BASS CH',midiRhythmChannel:'RHYTHM CH',midiSendClock:'SEND CLOCK',midiSendTransport:'SEND START / STOP',midiPanic:'PANIC',midiAuto:'AUTO',midiBrowser:'BROWSER',midiBrowserAndMidi:'BROWSER + MIDI',midiOnly:'MIDI ONLY',midiGeneric:'Generic MIDI',midiHardwareGuide:'HARDWARE GUIDE',
      hardwareKicker:'HARDWARE TRANSFER / VERIFIED METHODS',hardwareTitle:'How 303box reaches each device',hardwareClose:'Close hardware guide',hardwarePrimaryBassRhythm:'PRIMARY / BASS + RHYTHM',hardwarePrimaryBass:'PRIMARY / BASS',hardwareLiveMidi:'LIVE MIDI',hardwareNotesClock:'Notes + velocity + clock',hardwareT8Notes:'Notes, velocity, clock and transport',hardwareBassTransfer:'BASS TRANSFER',hardwareBassTransferValue:'REC capture — hardware tested',hardwareRhythmTransfer:'RHYTHM TRANSFER',hardwareRhythmTransferValue:'USB PRM restore research',hardwareDirectMemory:'DIRECT MIDI MEMORY',hardwareDirectMemoryValue:'No documented MIDI write',hardwareBackupRestore:'BACKUP / RESTORE',hardwareBackupRestoreValue:'Official USB storage workflow',hardwareMemory:'MEMORY',hardwareMemoryValue:'On-device patterns',hardwareDirectSysex:'DIRECT SYSEX',hardwareTd3DirectValue:'TD-3: experimental direct pattern write over USB SysEx. TD-3-MO: enabled only after a compatible read probe succeeds.',hardwareTransfer:'TRANSFER',hardwareTd3TransferValue:'303box can read, back up, write and verify a TD-3 pattern slot over USB. The protocol is reverse-engineered, not manufacturer-published.',td3MoLabel:'TD-3-MO',hardwareTd3MoValue:'TD-3-MO also has a MIDI-controllable filter; 303box does not map that CC yet.',hardwareVolcaValue:'303box currently sends notes, velocity and clock. The device also documents synthesis controls for future mapping.',
      td3DirectTitle:'TD-3 DIRECT WRITE',td3DirectUsbOnly:'EXPERIMENTAL / USB ONLY',td3Group:'GROUP',td3Section:'SECTION',td3Pattern:'PATTERN',td3Verify:'VERIFY USB / SYSEX',td3BackupWrite:'BACKUP + WRITE',td3Restore:'RESTORE LAST BACKUP',td3ReadOnly:'TEST READ (NO WRITE)',
      t8PrmTitle:'T-8 RHYTHM PRM',t8PrmLead:'Current 16-step rhythm → decoded T-8 backup/restore format.',t8PrmDownload:'DOWNLOAD PRM',t8PrmWrite:'WRITE / REPLACE PRM',t8PrmWarning:'Test only on a disposable copied rhythm slot. Make a T-8 backup first.',
      faqEyebrow:'FAQ',faqTitle:'Built to get out of the way.',faqLead:'No account, no project setup and no software installation.',footerProject:'303box is an independent music tool built by Z3Z.',footerPrivacy:'Privacy',footerDisclaimer:'Disclaimer',footerShortcuts:'Shortcuts'
    },
    tr:{
      pageTitle:'303box — Donanım için 303 Pattern Çalışma Alanı',
      pageDescription:'303 ve ritim pattern’lerini tarayıcıda yazmak, önizlemek ve donanıma taşımak için çalışma alanı. Rastgele başlangıçlar kural tabanlıdır; yapay zekâ bestecisi veya canlı performansın yerine geçen bir araç değildir.',
      skip:'Sequencer’a geç',brandTag:'Acid pattern laboratuvarı',changeLanguage:'Dili değiştir',openSequencer:'Sequencer’ı aç',signalLabel:'303box / SİNYAL',liveLabel:'CANLI',visualAccent:'VURGU',visualSlide:'KAYDIRMA',visualRhythm:'RİTİM',acidConsoleTitle:'ACID KONSOLU',consoleMaster:'ANA',
      heroKicker:'PATTERN ÇALIŞMA ALANI / DONANIM AKIŞI',heroTitle:'Pattern’i burada tasarla. Donanımında performe et.',heroLead:'303box, 16 adımlı fikirleri gerçek donanıma taşımadan önce daha rahat yazmak, düzenlemek ve dinlemek için oluşturulmuş bir çalışma alanıdır. Müziği senin yerine yapmaz: notaları sen seçersin, rastgele başlangıçları kabul eder veya değiştirirsin, kontrolleri sen hareket ettirir ve son performansı sen yaparsın.',heroPrimary:'Pattern oluştur',heroSecondary:'Bu araç nedir?',factSteps:'adım',
      bandOneTitle:'Fikri daha hızlı yaz',bandOneText:'Tarayıcıyı okunaklı bir pattern defteri gibi kullan.',bandTwoTitle:'Taslağı dinle',bandTwoText:'Pattern’i donanıma almadan önce nasıl aktığını kontrol et.',bandThreeTitle:'Makineye taşı',bandThreeText:'İşe yarayan fikri cihaza aktar; performansı ve kaydı donanımda tamamla.',
      intentKicker:'303BOX NEDİR',intentTitle:'Sesli bir pattern defteri — müzisyenin yerine geçen bir araç değil.',intentLead:'Rastgele düğmeleri yalnızca basit müzikal kurallarla bir başlangıç noktası üretir; bir yapay zekâ beste modeli değildir. 303box küçük adımları daha rahat düzenlemek, taslağı duymak ve fikri donanıma taşımak için vardır. Müzikal kararlar ve performans sana aittir.',intentOneTitle:'Daha hızlı tasarla',intentOneText:'16 adımlı fikri küçük bir donanım ekranından tek tek girmek yerine büyük ekranda yaz ve düzenle.',intentTwoTitle:'Önizle, devretme',intentTwoText:'Pattern’i dinle, değiştir, reddet veya yeniden kur. Önizleme karar vermek içindir; bitmiş performans değildir.',intentThreeTitle:'Donanımda tamamla',intentThreeText:'Pattern’i desteklenen cihaza taşı; tınıyı, performansı ve son kaydı donanım üzerinde tamamla.',
      sequencerEyebrow:'Pattern çalışma alanı',sequencerTitle:'Pattern’i net yaz. Sonra enstrümana taşı.',sequencerIntro:'Grid, 16 adımlı fikirleri yazmak ve dinlemek için pratik bir yüzeydir. Rastgele üretim yalnızca kural tabanlı bir başlangıçtır; bütün müzikal kararlar elle değiştirilebilir.',
      generate:'ÜRET',download:'İNDİR',clear:'TEMİZLE',play:'ÇAL',stop:'DUR',waitForStep:'1. ADIM BEKLENİYOR',playAll:'BASS + RİTİM ÇAL',stopAll:'BASS + RİTİMİ DURDUR',author:'Yazar',title:'Başlık',step:'Adım',note:'Nota',octave:'Aşağı / Yukarı',accentSlide:'Vurgu / Kaydırma',gate:'Gate',waveform:'Dalga formu',tempo:'Tempo',notes:'EFX / Notlar',notesPlaceholder:'Patch notlarını buraya yaz...',cutoff:'Cutoff',resonance:'Rezonans',envMod:'Zarf Mod',decay:'Sönüm',accent:'Vurgu',randomPatch:'RASTGELE PATCH',knobTune:'AKORT',knobDelay:'GECİKME',knobDistortion:'DİSTORSİYON',knobReverb:'YANKI',knobFeedback:'GERİ BESLEME',shortcutKicker:'303box / TUŞLAR',shortcutClose:'Klavye kısayollarını kapat',
      tempoDialogEyebrow:'Tempo',tempoDialogTitle:'BPM ayarla',cancel:'İptal',apply:'Uygula',sheetKicker:'303BOX / SEQUENCER SAYFASI',sheetModel:'ANALOG BASS HATTI / 16 ADIM',patternSheetLabel:'303 pattern sayfası',acidConsoleLabel:'Acid konsolu',scopeLabel:'303 osilatör scope ve FFT görünümü',scopeInputLabel:'Osiloskop ses girişi',
      rhythmEyebrow:'303 EŞLİK RİTMİ',rhythmTitle:'Acid hattının yanına ritmi kur.',rhythmLead:'303 ile aynı clock üzerinde çalışan altı kanallı, 16 adımlı ritim bölümü.',level:'SEVİYE',voiceClap:'El Çırpma',voiceLowTom:'Pes Tom',rhythmVoiceMap:'RİTİM SES HARİTASI',rhythmVoiceMapLead:'Ses karakterleri donanım esintili mimariye göre sabitlenir.',rhythmVoiceBd:'Bas davul.',rhythmVoice606:'Trampet ve iki hi-hat.',rhythmVoiceCp:'El çırpma karakteri.',rhythmVoiceTm:'Pes tom karakteri.',
      midiEnable:'MIDI’Yİ AÇ',midiEnabled:'MIDI AÇIK',midiRearm:'MIDI’Yİ YENİDEN AÇ',midiOutput:'ÇIKIŞ',midiDevice:'CİHAZ',midiPlayback:'ÇALMA',midiBassChannel:'BASS KANALI',midiRhythmChannel:'RİTİM KANALI',midiSendClock:'CLOCK GÖNDER',midiSendTransport:'START / STOP GÖNDER',midiPanic:'PANİK',midiAuto:'OTOMATİK',midiBrowser:'TARAYICI',midiBrowserAndMidi:'TARAYICI + MIDI',midiOnly:'YALNIZ MIDI',midiGeneric:'Genel MIDI',midiHardwareGuide:'CİHAZ REHBERİ',
      hardwareKicker:'DONANIM AKTARIMI / DOĞRULANMIŞ YÖNTEMLER',hardwareTitle:'303box her cihaza nasıl aktarım yapıyor?',hardwareClose:'Donanım rehberini kapat',hardwarePrimaryBassRhythm:'ANA CİHAZ / BASS + RİTİM',hardwarePrimaryBass:'ANA CİHAZ / BASS',hardwareLiveMidi:'CANLI MIDI',hardwareNotesClock:'Nota + vuruş şiddeti + clock',hardwareT8Notes:'Nota, vuruş şiddeti, clock ve transport',hardwareBassTransfer:'BASS AKTARIMI',hardwareBassTransferValue:'REC kaydı — donanımda test edildi',hardwareRhythmTransfer:'RİTİM AKTARIMI',hardwareRhythmTransferValue:'USB PRM geri yükleme araştırması',hardwareDirectMemory:'DOĞRUDAN MIDI HAFIZASI',hardwareDirectMemoryValue:'Belgelenmiş MIDI yazma yöntemi yok',hardwareBackupRestore:'YEDEKLEME / GERİ YÜKLEME',hardwareBackupRestoreValue:'Resmî USB depolama akışı',hardwareMemory:'HAFIZA',hardwareMemoryValue:'Cihaz üzerindeki pattern’ler',hardwareDirectSysex:'DOĞRUDAN SYSEX',hardwareTd3DirectValue:'TD-3: USB SysEx üzerinden deneysel doğrudan pattern yazma. TD-3-MO: yalnız uyumlu okuma testi başarılı olursa etkinleşir.',hardwareTransfer:'AKTARIM',hardwareTd3TransferValue:'303box USB üzerinden bir TD-3 pattern slotunu okuyabilir, yedekleyebilir, yazabilir ve doğrulayabilir. Protokol tersine mühendisliktir; üretici tarafından yayımlanmamıştır.',td3MoLabel:'TD-3-MO',hardwareTd3MoValue:'TD-3-MO ayrıca MIDI ile kontrol edilebilen bir filtre sunar; 303box bu CC’yi henüz eşlemiyor.',hardwareVolcaValue:'303box şu anda nota, vuruş şiddeti ve clock gönderir. Cihaz, ileride eşlenebilecek sentez kontrollerini de belgeliyor.',
      td3DirectTitle:'TD-3 DOĞRUDAN YAZMA',td3DirectUsbOnly:'DENEYSEL / YALNIZ USB',td3Group:'GRUP',td3Section:'BÖLÜM',td3Pattern:'PATTERN',td3Verify:'USB / SYSEX DOĞRULA',td3BackupWrite:'YEDEKLE + YAZ',td3Restore:'SON YEDEĞİ GERİ YÜKLE',td3ReadOnly:'TEST OKU (YAZMAZ)',
      t8PrmTitle:'T-8 RİTİM PRM',t8PrmLead:'Mevcut 16 adımlı ritim → çözümlenmiş T-8 yedekleme/geri yükleme biçimi.',t8PrmDownload:'PRM İNDİR',t8PrmWrite:'PRM YAZ / DEĞİŞTİR',t8PrmWarning:'Yalnızca kopyalanmış, önemsiz bir ritim slotunda test et. Önce T-8 yedeği al.',
      faqEyebrow:'SSS',faqTitle:'Araya girmemek için tasarlandı.',faqLead:'Hesap yok, proje kurulumu yok, yazılım kurulumu yok.',footerProject:'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.',footerPrivacy:'Gizlilik',footerDisclaimer:'Sorumluluk',footerShortcuts:'Kısayollar'
    }
  };

  const NAV={en:['303','Rhythm','Guide','History','FAQ'],tr:['303','Ritim','Rehber','Tarihçe','SSS']};
  const key=keyName=>COPY[language()][keyName]??COPY.en[keyName]??keyName;
  const put=(selector,keyName)=>{const el=$(selector);const value=key(keyName);if(el&&el.textContent!==value)el.textContent=value};
  const putAttr=(selector,attribute,keyName)=>{const el=$(selector);const value=key(keyName);if(el&&el.getAttribute(attribute)!==value)el.setAttribute(attribute,value)};

  function translateDataAttributes(){
    $$('[data-i18n]').forEach(el=>{const value=key(el.dataset.i18n);if(el.textContent!==value)el.textContent=value});
    $$('[data-i18n-placeholder]').forEach(el=>{const value=key(el.dataset.i18nPlaceholder);if(el.placeholder!==value)el.placeholder=value});
    $$('[data-i18n-aria-label]').forEach(el=>{const value=key(el.dataset.i18nAriaLabel);if(el.getAttribute('aria-label')!==value)el.setAttribute('aria-label',value)});
  }

  function translateMainPage(){
    const l=language();
    document.title=key('pageTitle');
    $('meta[name="description"]')?.setAttribute('content',key('pageDescription'));
    put('.hero .hero-lead','heroLead');put('.hero .secondary-cta','heroSecondary');
    put('.intent-kicker','intentKicker');put('.intent-title','intentTitle');put('.intent-lead','intentLead');
    const intentKeys=[['intentOneTitle','intentOneText'],['intentTwoTitle','intentTwoText'],['intentThreeTitle','intentThreeText']];
    $$('.intent-grid article').forEach((article,index)=>{const pair=intentKeys[index];if(!pair)return;const title=$('b',article),body=$('p',article);if(title)title.textContent=key(pair[0]);if(body)body.textContent=key(pair[1])});
    $$('.site-header .nav a').forEach((el,index)=>{const value=NAV[l][index];if(value&&el.textContent!==value)el.textContent=value});
    put('.sheet-kicker','sheetKicker');put('.sheet-model','sheetModel');
    putAttr('#languageButton','aria-label','changeLanguage');putAttr('#patternSheet','aria-label','patternSheetLabel');putAttr('#acidConsole','aria-label','acidConsoleLabel');putAttr('#bassOnlyScope','aria-label','scopeLabel');putAttr('#bassLiveScope','aria-label','scopeLabel');
    const current=$('#languageCurrent'),next=$('#languageNext');if(current)current.textContent=l.toUpperCase();if(next)next.textContent=l==='en'?'TR':'EN';
  }

  function translateTransport(){
    const bass=$('#playButton'),bassLabel=$('#playLabel');
    if(bassLabel)bassLabel.textContent=bass?.getAttribute('aria-pressed')==='true'?key('stop'):key('play');
    const drum=$('#drumPlay'),drumLabel=drum?.querySelector('span');
    if(drumLabel)drumLabel.textContent=drum.classList.contains('armed')?key('waitForStep'):(drum.classList.contains('playing')?key('stop'):key('play'));
    const all=$('#acidPlayAll');if(all)all.textContent=all.dataset.playing==='true'?key('stopAll'):key('playAll');
    put('#randomPatchButton','randomPatch');
  }

  function translateMidi(){
    let state={};try{state=window.__303boxMidiRouter?.state||{}}catch(_){}
    put('#midiConnectCopy',state.blocked?'midiRearm':(state.enabled?'midiEnabled':'midiEnable'));
    put('#midiOutputLabel','midiOutput');put('#midiDeviceLabel','midiDevice');put('#midiPlaybackLabel','midiPlayback');put('#midiBassLabel','midiBassChannel');put('#midiRhythmLabel','midiRhythmChannel');put('#midiClockTitle','midiSendClock');put('#midiTransportTitle','midiSendTransport');
    const panic=$('#midiPanic');if(panic&&!panic.classList.contains('panic-fired'))panic.textContent=key('midiPanic');
    const profile=$('#midiDeviceProfile');if(profile){const auto=profile.querySelector('option[value="auto"]'),generic=profile.querySelector('option[value="generic"]');if(auto)auto.textContent=key('midiAuto');if(generic)generic.textContent=key('midiGeneric')}
    const modes={browser:'midiBrowser',both:'midiBrowserAndMidi',midi:'midiOnly'};$$('#midiRouterMode option').forEach(option=>{const copyKey=modes[option.value];if(copyKey)option.textContent=key(copyKey)});
  }

  function translateHardwareGuide(){
    putAttr('#hardwareGuideClose','aria-label','hardwareClose');
    const cards=$$('.hardware-device-card');
    const t8=cards.find(card=>(card.dataset.device||'').split(/\s+/).includes('t8'));
    const td3=cards.find(card=>(card.dataset.device||'').split(/\s+/).includes('td3'));
    const volcaBass=cards.find(card=>card.dataset.device==='volcabass');
    const volcaNubass=cards.find(card=>card.dataset.device==='volcanubass');
    const setCard=(card,subtitle,rows)=>{
      if(!card)return;const small=$('.hardware-device-title small',card);if(small)small.textContent=key(subtitle);
      $$('.hardware-capability',card).forEach((row,index)=>{const pair=rows[index];if(!pair)return;const label=$('span',row),value=$('strong',row);if(label)label.textContent=key(pair[0]);if(value)value.textContent=key(pair[1])});
    };
    setCard(t8,'hardwarePrimaryBassRhythm',[
      ['hardwareLiveMidi','hardwareT8Notes'],['hardwareBassTransfer','hardwareBassTransferValue'],['hardwareRhythmTransfer','hardwareRhythmTransferValue'],['hardwareDirectMemory','hardwareDirectMemoryValue'],['hardwareBackupRestore','hardwareBackupRestoreValue']
    ]);
    setCard(td3,'hardwarePrimaryBass',[
      ['hardwareLiveMidi','hardwareNotesClock'],['hardwareMemory','hardwareMemoryValue'],['hardwareDirectSysex','hardwareTd3DirectValue'],['hardwareTransfer','hardwareTd3TransferValue'],['td3MoLabel','hardwareTd3MoValue']
    ]);
    setCard(volcaBass,'hardwareLiveMidi',[['hardwareLiveMidi','hardwareVolcaValue']]);
    setCard(volcaNubass,'hardwareLiveMidi',[['hardwareLiveMidi','hardwareVolcaValue']]);
    put('.td3-direct-head strong','td3DirectTitle');put('.td3-direct-head small','td3DirectUsbOnly');
    const td3Targets=['td3Group','td3Section','td3Pattern'];$$('.td3-direct-target label > span').forEach((el,index)=>{if(td3Targets[index])el.textContent=key(td3Targets[index])});
    const td3Actions=['td3Verify','td3BackupWrite','td3Restore','td3ReadOnly'];$$('.td3-direct-actions button').forEach((el,index)=>{if(td3Actions[index]&&el.dataset.dynamicCopy!=='true')el.textContent=key(td3Actions[index])});
  }

  function translateLateModules(){
    put('#t8PrmExportAction > strong','t8PrmTitle');put('#t8PrmExportAction > p','t8PrmLead');put('#t8PrmExportAction [data-prm-download]','t8PrmDownload');put('#t8PrmExportAction [data-prm-write]','t8PrmWrite');put('#t8PrmExportAction > small','t8PrmWarning');
    putAttr('#scopeAudioInput','aria-label','scopeInputLabel');
    put('#tuneKnobWrap .knob-title','knobTune');put('[data-fx-knob="delay"] .knob-title','knobDelay');put('[data-fx-knob="distortion"] .knob-title','knobDistortion');put('[data-fx-knob="reverb"] .knob-title','knobReverb');put('[data-fx-knob="feedback"] .knob-title','knobFeedback');
    put('[data-preview="cp"] span','voiceClap');put('[data-preview="tm"] span','voiceLowTom');
    put('#shortcutOverlay .shortcut-head span','shortcutKicker');putAttr('#shortcutX','aria-label','shortcutClose');
    put('.z3z-credit > span','footerProject');
    $$('.footer-links a').forEach(link=>{if(link.matches('[data-disclaimer-link]'))link.textContent=key('footerDisclaimer');else if(link.matches('[data-shortcuts-link]'))link.textContent=key('footerShortcuts');else if((link.getAttribute('href')||'').includes('privacy.html'))link.textContent=key('footerPrivacy')});
  }

  function apply(){translateDataAttributes();translateMainPage();translateTransport();translateMidi();translateHardwareGuide();translateLateModules()}

  let queued=false;
  function queueApply(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply()})}
  function watchLateContent(){
    if(!document.body||watchLateContent.observer)return;
    watchLateContent.observer=new MutationObserver(records=>{
      const addedElement=records.some(record=>[...record.addedNodes].some(node=>node.nodeType===Node.ELEMENT_NODE));
      if(addedElement)queueApply();
    });
    watchLateContent.observer.observe(document.body,{childList:true,subtree:true});
  }
  function init(){apply();watchLateContent()}

  document.addEventListener('303box:languagechange',queueApply);
  document.addEventListener('303box:content-refresh',queueApply);
  document.addEventListener('303box:ready',queueApply);
  window.__303boxContentStable={version:'2300',apply,queueApply,t:key,get language(){return language()},copy:COPY};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
