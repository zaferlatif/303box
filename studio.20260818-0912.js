(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isTR=()=>document.documentElement.lang==='tr';
  const PARTS=[
    {id:'bd',code:'BD-909',en:'Bass Drum',tr:'Bas Davul'},
    {id:'sd',code:'SD-606',en:'Snare Drum',tr:'Trampet'},
    {id:'cp',code:'CP-808',en:'Hand Clap',tr:'Clap'},
    {id:'tm',code:'TM-808',en:'Low Tom',tr:'Low Tom'},
    {id:'ch',code:'CH-606',en:'Closed Hi-Hat',tr:'Kapalı Hi-Hat'},
    {id:'oh',code:'OH-606',en:'Open Hi-Hat',tr:'Açık Hi-Hat'}
  ];
  const NOTES=[['','—'],['C','C'],['C#','C#'],['D','D'],['D#','D#'],['E','E'],['F','F'],['F#','F#'],['G','G'],['G#','G#'],['A','A'],['A#','A#'],['B','B'],['C+','C']];
  let noteGridBound=false,drumGridBound=false;

  function syncNotePicker(step){
    const input=$$('.note-input')[step],select=$(`[data-note-picker="${step}"]`);
    if(!input||!select)return;
    const wanted=input.dataset.baseOctave==='1'&&input.value==='C'?'C+':input.value||'';
    if(select.value!==wanted)select.value=wanted;
  }

  function installNoteSelectors(){
    const inputs=$$('.note-input');if(inputs.length!==16)return false;
    $$('.note-picker,.note-picker-v2').forEach(x=>x.remove());
    let saved=[];try{const v=JSON.parse(localStorage.getItem('303box-note-base-octaves-v2')||'[]');if(Array.isArray(v))saved=v}catch(_){}
    inputs.forEach((input,step)=>{
      input.type='hidden';input.tabIndex=-1;input.classList.add('note-source-hidden');input.setAttribute('aria-hidden','true');
      if(saved[step]!=null)input.dataset.baseOctave=saved[step]?'1':'0';else if(!input.dataset.baseOctave)input.dataset.baseOctave='0';
      const select=document.createElement('select');select.className='cell-control note-picker-v2';select.dataset.notePicker=String(step);select.setAttribute('aria-label',`${isTR()?'Nota':'Note'} ${step+1}`);
      NOTES.forEach(([value,label])=>select.appendChild(new Option(label,value)));input.after(select);syncNotePicker(step);
      select.addEventListener('change',()=>{
        if(select.value==='C+'){input.value='C';input.dataset.baseOctave='1'}else{input.value=select.value;input.dataset.baseOctave='0'}
        input.dispatchEvent(new Event('input',{bubbles:true}));
        try{localStorage.setItem('303box-note-base-octaves-v2',JSON.stringify($$('.note-input').map(x=>Number(x.dataset.baseOctave||0)?1:0)))}catch(_){}
      });
    });
    if(!noteGridBound){
      noteGridBound=true;
      $('#patternGrid')?.addEventListener('click',e=>{if(e.target.closest('.octave-cell'))queueMicrotask(()=>$$('.note-input').forEach((_,i)=>syncNotePicker(i)))})
    }
    return true;
  }

  function drumHtml(){
    const tr=isTR();
    const heads=Array.from({length:16},(_,i)=>`<span class="drum-step-head ${[0,4,8,12].includes(i)?'downbeat':''}">${i+1}</span>`).join('');
    const rows=PARTS.map(p=>`<div class="drum-row">
      <div class="drum-voice">
        <button type="button" data-preview="${p.id}"><b>${p.code}</b><span>${tr?p.tr:p.en}</span></button>
        <label class="voice-selector-hidden"><span>VOICE</span><select data-variant="${p.id}"><option value="">—</option></select></label>
        <label class="voice-level"><span data-i18n="level">${tr?'SEVİYE':'LEVEL'}</span><input type="range" min="0" max="100" value="80" data-level="${p.id}"></label>
      </div>
      <div class="drum-steps">${Array.from({length:16},(_,i)=>`<button type="button" class="drum-step ${[0,4,8,12].includes(i)?'downbeat':''}" data-drum="${p.id}" data-step="${i}" aria-pressed="false"></button>`).join('')}</div>
    </div>`).join('');
    return `<section class="drum-machine shell" id="drums">
      <div class="drum-intro"><div><p class="eyebrow" data-i18n="rhythmEyebrow">${tr?'303 EŞLİK RİTMİ':'303 COMPANION RHYTHM'}</p><h2 data-i18n="rhythmTitle">${tr?'Acid hattının yanına ritmi kur.':'Build the rhythm beside the acid line.'}</h2></div><p data-i18n="rhythmLead">${tr?'303 ile aynı clock üzerinde çalışan altı kanallı 16 adımlı ritim bölümü.':'A six-part 16-step rhythm section running on the same clock as the 303.'}</p></div>
      <div class="drum-export-card" id="drumExportCard">
        <div class="drum-panel">
          <div class="drum-toolbar" data-html2canvas-ignore="true"><div class="drum-actions">
            <button class="drum-action acid" id="drumRandom" type="button" data-i18n="generate">${tr?'ÜRET':'GENERATE'}</button>
            <button class="drum-play" id="drumPlay" type="button"><i></i><span>${tr?'ÇAL':'PLAY'}</span></button>
            <button class="drum-action" id="drumDownload" type="button" data-i18n="download">${tr?'İNDİR':'DOWNLOAD'}</button>
            <button class="drum-action danger" id="drumClear" type="button" data-i18n="clear">${tr?'TEMİZLE':'CLEAR'}</button>
          </div></div>
          <div class="drum-grid-scroll"><div class="drum-grid"><div></div><div class="drum-heads">${heads}</div>${rows}</div></div>
        </div>
        <div class="drum-dna"><div class="dna-title"><span data-i18n="rhythmVoiceMap">${tr?'RİTİM SES HARİTASI':'RHYTHM VOICE MAP'}</span><small data-i18n="rhythmVoiceMapLead">${tr?'Ses karakterleri donanım mimarisine göre sabitlenir.':'Voice characters follow the hardware-inspired architecture.'}</small></div>
          <article><b>TR-909 BD</b><p data-i18n="rhythmVoiceBd">${tr?'Bas davul.':'Bass drum.'}</p></article>
          <article><b>TR-606 SD / CH / OH</b><p data-i18n="rhythmVoice606">${tr?'Trampet ve iki hi-hat.':'Snare and both hi-hats.'}</p></article>
          <article><b>TR-808 CP</b><p data-i18n="rhythmVoiceCp">${tr?'El çırpma karakteri.':'Hand-clap character.'}</p></article>
          <article><b>TR-808 TM</b><p data-i18n="rhythmVoiceTm">${tr?'Pes tom karakteri.':'Low-tom character.'}</p></article>
        </div>
      </div>
    </section>`;
  }

  function saveRhythmPattern(){
    const pattern={};PARTS.forEach(p=>pattern[p.id]=Array.from({length:16},(_,i)=>$(`[data-drum="${p.id}"][data-step="${i}"]`)?.classList.contains('on')||false));
    try{const old=JSON.parse(localStorage.getItem('303box-rhythm-v6')||'{}');localStorage.setItem('303box-rhythm-v6',JSON.stringify({...old,pattern}))}catch(_){}
  }
  function setDrumStep(button,on){button.classList.toggle('on',on);button.setAttribute('aria-pressed',String(on))}
  function clearDrums(){
    $$('#drums .drum-step').forEach(b=>setDrumStep(b,false));saveRhythmPattern();window.__303boxHatGrid?.capture?.();
  }
  async function downloadDrums(){
    if(typeof html2canvas!=='function')return;const card=$('#drumExportCard');if(!card)return;
    const clone=card.cloneNode(true);clone.querySelectorAll('[data-html2canvas-ignore="true"]').forEach(x=>x.remove());clone.style.cssText='position:fixed;left:-12000px;top:0;width:1080px;background:#181a1e;z-index:-1';document.body.appendChild(clone);
    const sc=clone.querySelector('.drum-grid-scroll'),gr=clone.querySelector('.drum-grid');if(sc)sc.style.overflow='visible';if(gr){gr.style.minWidth='0';gr.style.width='100%'}
    try{const canvas=await html2canvas(clone,{scale:2,backgroundColor:'#181a1e',logging:false});const a=document.createElement('a');a.download=`303box_rhythm_${Date.now().toString().slice(-6)}.jpg`;a.href=canvas.toDataURL('image/jpeg',.95);a.click()}finally{clone.remove()}
  }

  function bindDrumGrid(){
    if(drumGridBound)return;drumGridBound=true;
    document.addEventListener('click',e=>{
      const step=e.target.closest?.('#drums .drum-step');
      if(step){
        const next=!step.classList.contains('on'),id=step.dataset.drum,index=step.dataset.step;
        if(next&&id==='ch'){const other=$(`#drums .drum-step[data-drum="oh"][data-step="${index}"]`);if(other)setDrumStep(other,false)}
        if(next&&id==='oh'){const other=$(`#drums .drum-step[data-drum="ch"][data-step="${index}"]`);if(other)setDrumStep(other,false)}
        setDrumStep(step,next);saveRhythmPattern();window.__303boxHatGrid?.capture?.();return;
      }
      if(e.target.closest?.('#drumClear')){e.preventDefault();clearDrums();return}
      if(e.target.closest?.('#drumDownload')){e.preventDefault();downloadDrums();return}
    });
  }

  function mountDrums(){
    if($('#drums'))return true;
    const sequencer=$('#sequencer');if(!sequencer)return false;
    sequencer.insertAdjacentHTML('afterend',drumHtml());bindDrumGrid();return true;
  }

  const HISTORY={
    en:[['1981','TB-303 arrives','Roland releases the TB-303 Bass Line, designed by Tadao Kikumoto as an automatic bass accompaniment instrument.'],['1983','Production ends','The machine leaves production and becomes cheap on the second-hand market.'],['1985','Phuture finds the squelch','DJ Pierre, Spanky and Herb J push cutoff and resonance while a pattern runs; Ron Hardy champions the sound at Music Box.'],['1987','Acid Tracks','Phuture’s “Acid Tracks” receives its official release and becomes the defining reference for the new sound.'],['1988','Acid crosses the Atlantic','UK club and rave culture accelerates the movement; A Guy Called Gerald releases “Voodoo Ray.”'],['1992','Acid gets harder','Hardfloor’s “Acperience 1” pushes interlocking 303 lines into techno and trance territory.'],['1995','Another rave peak','Josh Wink’s “Higher State of Consciousness” brings the 303 sound to another generation.'],['Today','Still alive','Original machines, modern hardware and software keep the 303 sequencing language active.']],
    tr:[['1981','TB-303 ortaya çıkıyor','Roland, Tadao Kikumoto tasarımı TB-303 Bass Line’ı otomatik bas eşlik cihazı olarak çıkarır.'],['1983','Üretim sona eriyor','Cihaz üretimden kalkar ve ikinci el piyasasında ucuzlamaya başlar.'],['1985','Phuture o sesi buluyor','DJ Pierre, Spanky ve Herb J pattern dönerken cutoff ve rezonansı zorlar; Ron Hardy bu sesi Music Box’ta sahiplenir.'],['1987','Acid Tracks','Phuture’un “Acid Tracks” kaydı resmen yayımlanır ve yeni sesin temel referansına dönüşür.'],['1988','Acid Atlantik’i geçiyor','İngiltere kulüp ve rave kültürü hareketi hızlandırır; A Guy Called Gerald “Voodoo Ray”i yayımlar.'],['1992','Acid sertleşiyor','Hardfloor’un “Acperience 1”i birbirine geçen 303 hatlarını techno ve trance alanına taşır.'],['1995','Yeni bir rave zirvesi','Josh Wink’in “Higher State of Consciousness”ı 303 sesini yeni bir kuşağa taşır.'],['Bugün','Hâlâ yaşıyor','Orijinal cihazlar, modern donanımlar ve yazılımlar 303 sequencer dilini canlı tutuyor.']]
  };

  function guideHtml(){
    const tr=isTR();return `<section class="field-guide" id="guide"><div class="shell"><div class="guide-top"><div><p class="eyebrow">${tr?'303 KULLANIM REHBERİ':'303 FIELD GUIDE'}</p><h2>${tr?'Pattern’i tek bakışta oku.':'Read the pattern at a glance.'}</h2></div><p class="guide-lead">${tr?'Gate olayı belirler, perde notayı yerleştirir; vurgu ve kaydırma hareketi yaratır.':'Gate controls the event, pitch sets the note, and accent/slide create the movement.'}</p></div><div class="guide-board">
      <article class="guide-col"><span class="guide-num">01</span><h3>${tr?'GATE / ZARF':'GATE / ENVELOPE'}</h3><div class="guide-item"><span class="gchip">●</span><div><strong>${tr?'Nota Açık':'Note On'}</strong><p>${tr?'Notayı ve zarfı tetikler.':'Starts the note and retriggers the envelope.'}</p></div></div><div class="guide-item"><span class="gchip">○</span><div><strong>${tr?'Bağ':'Tie'}</strong><p>${tr?'Gate’i sonraki adıma taşır.':'Holds the gate into the following step.'}</p></div></div><div class="guide-item"><span class="gchip">–</span><div><strong>${tr?'Es':'Rest'}</strong><p>${tr?'Ritmik boşluk bırakır.':'Leaves rhythmic space.'}</p></div></div></article>
      <article class="guide-col"><span class="guide-num">02</span><h3>${tr?'PERDE / DİNAMİK':'PITCH / DYNAMICS'}</h3><div class="guide-item"><span class="gchip">D/U</span><div><strong>${tr?'Oktav':'Octave'}</strong><p>${tr?'Perdeyi bir oktav aşağı veya yukarı taşır.':'Moves the oscillator one octave down or up.'}</p></div></div><div class="guide-item"><span class="gchip acid">A</span><div><strong>${tr?'Vurgu':'Accent'}</strong><p>${tr?'Ses ve filtre hareketini vurgular.':'Pushes volume and filter movement.'}</p></div></div><div class="guide-item"><span class="gchip acid">S</span><div><strong>${tr?'Kaydırma':'Slide'}</strong><p>${tr?'Sonraki perdeye kaydırır.':'Glides toward the next pitch.'}</p></div></div></article>
      <article class="guide-col"><span class="guide-num">03</span><h3>${tr?'303 KONTROLLERİ':'303 CONTROLS'}</h3><div class="guide-item"><span class="gchip">CUT</span><div><strong>Cutoff</strong><p>${tr?'Filtrenin temel açıklığını belirler.':'Sets the base filter opening.'}</p></div></div><div class="guide-item"><span class="gchip">RES</span><div><strong>${tr?'Rezonans':'Resonance'}</strong><p>${tr?'Acid karakterini belirginleştirir.':'Emphasizes the acid edge.'}</p></div></div><div class="guide-item"><span class="gchip">ENV</span><div><strong>${tr?'Zarf Mod / Sönüm':'Env Mod / Decay'}</strong><p>${tr?'Filtre hareketinin gücünü ve süresini şekillendirir.':'Shapes how strongly and how long the filter moves.'}</p></div></div></article>
    </div></div></section>`;
  }
  function historyHtml(){const tr=isTR();return `<section class="history303" id="history"><div class="shell"><div class="history-top"><div><p class="eyebrow">${tr?'303 TARİHÇESİ':'303 HISTORY'}</p><h2>${tr?'Dans müziğini değiştiren makine.':'The machine that changed dance music.'}</h2></div><p>${tr?'Başarısız bir eşlik cihazı, acid house’un belirleyici sesine ve elektronik müziğin kalıcı diline dönüştü.':'A failed accompaniment box became the defining squelch of acid house and a permanent part of electronic music.'}</p></div><div class="timeline">${HISTORY[tr?'tr':'en'].map((x,i)=>`<article class="era ${i>=2&&i<=6?'key':''}"><time>${x[0]}</time><i></i><div><h3>${x[1]}</h3><p>${x[2]}</p></div></article>`).join('')}</div></div></section>`}

  function mountContent(){
    const workflow=$('#workflow');if(workflow){const x=document.createElement('div');x.innerHTML=guideHtml();workflow.replaceWith(x.firstElementChild)}else if($('#guide')){$('#guide').outerHTML=guideHtml()}
    const reference=$('#reference');if(reference){const x=document.createElement('div');x.innerHTML=historyHtml();reference.replaceWith(x.firstElementChild)}else if($('#history')){$('#history').outerHTML=historyHtml()}
    const faq=$('#faq .faq-grid');if(faq){const tr=isTR();faq.innerHTML=tr?`<details open><summary>303box nedir?</summary><p>Tarayıcıda çalışan 16 adımlı bir acid pattern ve ritim çalışma alanıdır.</p></details><details><summary>Müziği benim yerime mi yapıyor?</summary><p>Hayır. Rastgele üretim yalnızca kural tabanlı bir başlangıç sağlar; müzikal kararlar ve performans sana aittir.</p></details><details><summary>MIDI çalışıyor mu?</summary><p>Web MIDI destekleyen tarayıcılarda ve gerçek bir MIDI çıkışı bağlıyken çalışır.</p></details><details><summary>Veriler nerede tutuluyor?</summary><p>Pattern ve arayüz tercihleri tarayıcıda yerel olarak saklanır. Analiz ve reklam bilgileri için Gizlilik sayfasına bak.</p></details>`:`<details open><summary>What is 303box?</summary><p>A browser-based 16-step acid pattern and rhythm workspace.</p></details><details><summary>Does it make the music for me?</summary><p>No. Random generation supplies a rule-based starting point; the musical decisions and performance stay yours.</p></details><details><summary>Does MIDI work?</summary><p>Yes, in browsers with Web MIDI support when a real MIDI output is connected.</p></details><details><summary>Where is data stored?</summary><p>Pattern and interface preferences are stored locally in your browser. See Privacy for analytics and advertising details.</p></details>`}
    window.__303boxSiteShell?.render?.();
  }
  function mountFooter(){
    // The shared site shell owns this markup on every page. Keeping the existing
    // nodes intact also preserves the consent and keyboard-shortcut listeners.
    window.__303boxSiteShell?.render?.();
  }

  function applyLanguage(){mountContent();mountFooter();$$('[data-note-picker]').forEach((s,i)=>s.setAttribute('aria-label',`${isTR()?'Nota':'Note'} ${i+1}`))}
  function init(){
    installNoteSelectors();mountDrums();mountContent();mountFooter();bindDrumGrid();
    document.addEventListener('303box:languagechange',applyLanguage);
    window.__303boxStudioUi={version:'2000',installNoteSelectors,mountDrums,clearDrums,applyLanguage};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
