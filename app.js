(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NOTE_BASE={'C':261.63,'C#':277.18,'D':293.66,'D#':311.13,'E':329.63,'F':349.23,'F#':369.99,'G':392,'G#':415.3,'A':440,'A#':466.16,'B':493.88};
  const state={bpm:140,waveform:'square',playing:false,audio:null,timer:null,nextStepAt:0,currentStep:0,knobs:{cutoff:40,resonance:78,envMod:62,decay:38,accent:72},language:'en'};
  const tr={
    en:{generate:'Generate Pattern',download:'Download Sheet',clear:'Clear',author:'Author',title:'Title',step:'Step',note:'Note',octave:'Down / Up',accentSlide:'Accent / Slide',gate:'Gate',waveform:'Waveform',tempo:'Tempo',notes:'EFX / Notes',notesPlaceholder:'Write your patch notes here...',heroTitle:'Build acid basslines that move.',heroCopy:'Create, audition and export 16-step 303-style bassline patterns directly in your browser.',heroCta:'Open Sequencer',features:'Built for fast acid ideas',guide:'A focused 303 workflow',faq:'Frequently asked questions'},
    tr:{generate:'Pattern Üret',download:'Sayfayı İndir',clear:'Temizle',author:'Yazar',title:'Başlık',step:'Adım',note:'Nota',octave:'Aşağı / Yukarı',accentSlide:'Vurgu / Kaydırma',gate:'Gate',waveform:'Dalga Formu',tempo:'Tempo',notes:'EFX / Notlar',notesPlaceholder:'Patch notlarını buraya yaz...',heroTitle:'Hareket eden acid bassline’lar üret.',heroCopy:'16 adımlı 303 tarzı bassline pattern’lerini doğrudan tarayıcıda üret, dinle ve dışa aktar.',heroCta:'Sequencer’ı Aç',features:'Hızlı acid fikirleri için',guide:'Odaklı bir 303 çalışma akışı',faq:'Sık sorulan sorular'}
  };
  function t(k){return tr[state.language][k]||k}
  function init(){buildGrid();bind();initKnobs();load();applyLanguage();if(!localStorage.getItem('303-session'))generatePattern(false);updateBpm();}
  function buildGrid(){const head=$('#stepHead');for(let i=1;i<=16;i++)head.insertAdjacentHTML('beforeend',`<th data-step-header="${i-1}">${i}</th>`);const rows=[['note','input'],['octave','cycle'],['accentSlide','cycle'],['gate','cycle']];const body=$('#patternGrid');rows.forEach(([id,type])=>{let label={note:'note',octave:'octave',accentSlide:'accentSlide',gate:'gate'}[id];let html=`<tr><th scope="row" data-i18n="${label}"></th>`;for(let s=0;s<16;s++){if(type==='input')html+=`<td><input aria-label="Step ${s+1} note" class="note-input" data-step="${s}" maxlength="2" autocomplete="off"></td>`;else html+=`<td><button type="button" class="cell ${id}-cell" data-step="${s}" data-type="${id}"></button></td>`;}body.insertAdjacentHTML('beforeend',html+'</tr>');});}
  function bind(){
    $('#generateButton').onclick=()=>generatePattern(true);$('#clearButton').onclick=clearPattern;$('#playButton').onclick=togglePlayback;$('#downloadButton').onclick=exportSheet;$('#languageButton').onclick=()=>{state.language=state.language==='en'?'tr':'en';applyLanguage()};
    $('#bpmRange').oninput=e=>setBpm(+e.target.value);$('#bpmDisplay').onclick=()=>{const v=prompt('BPM (50–250)',state.bpm);if(v!==null)setBpm(+v)};
    $$('.cell').forEach(el=>el.onclick=()=>cycleCell(el));$$('.wave-btn').forEach(el=>el.onclick=()=>setWaveform(el.dataset.wave));
    ['authorInput','titleInput','notesArea'].forEach(id=>$('#'+id).addEventListener('input',save));document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();togglePlayback()}if(e.key.toLowerCase()==='r')generatePattern(true)});
  }
  function applyLanguage(){$$('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});$('#notesArea').placeholder=t('notesPlaceholder');$('#languageButton').textContent=state.language==='en'?'EN / TR':'TR / EN';}
  function cycleCell(el){const m={octave:['','D','U'],accentSlide:['','A','S','AS'],gate:['','●','○','-']};const a=m[el.dataset.type],i=a.indexOf(el.textContent.trim());el.textContent=a[(i+1)%a.length];save();}
  function getStepData(s){return{note:$$('.note-input')[s].value.trim().toUpperCase(),octave:$$('.octave-cell')[s].textContent.trim(),accentSlide:$$('.accentSlide-cell')[s].textContent.trim(),gate:$$('.gate-cell')[s].textContent.trim()}}
  function setStepData(s,d){$$('.note-input')[s].value=d.note||'';$$('.octave-cell')[s].textContent=d.octave||'';$$('.accentSlide-cell')[s].textContent=d.accentSlide||'';$$('.gate-cell')[s].textContent=d.gate||''}
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
  function clearPattern(){stopPlayback();for(let s=0;s<16;s++)setStepData(s,{note:'',octave:'',accentSlide:'',gate:''});$('#notesArea').value='';save();showToast(state.language==='tr'?'Pattern temizlendi.':'Pattern cleared.')}
  function setWaveform(w){state.waveform=w;$$('.wave-btn').forEach(b=>b.classList.toggle('active',b.dataset.wave===w));save()}
  function initKnobs(){$$('.knob').forEach(k=>{const id=k.dataset.knob;setKnob(id,state.knobs[id]);let down=false,lastY=0;k.onpointerdown=e=>{down=true;lastY=e.clientY;k.setPointerCapture(e.pointerId)};k.onpointermove=e=>{if(!down)return;const d=lastY-e.clientY;lastY=e.clientY;setKnob(id,state.knobs[id]+d*.8);save()};k.onpointerup=()=>down=false;k.onwheel=e=>{e.preventDefault();setKnob(id,state.knobs[id]+(e.deltaY<0?3:-3));save()}})}
  function setKnob(id,v){v=clamp(Math.round(v),0,100);state.knobs[id]=v;const el=$(`[data-knob="${id}"]`);if(el){el.style.setProperty('--angle',`${-135+v*2.7}deg`);el.querySelector('output').textContent=v}}
  function setBpm(v){if(!Number.isFinite(v))return;state.bpm=clamp(Math.round(v),50,250);updateBpm();save()}
  function updateBpm(){$('#bpmRange').value=state.bpm;$('#bpmDisplay').textContent=state.bpm}
  function noteFreq(note,oct){let f=NOTE_BASE[note];if(!f)return null;if(oct==='D')f/=2;if(oct==='U')f*=2;return f}
  async function togglePlayback(){if(state.playing){stopPlayback();return}state.audio=new(window.AudioContext||window.webkitAudioContext)();await state.audio.resume();state.playing=true;state.currentStep=0;state.nextStepAt=state.audio.currentTime+.06;$('#playButton').classList.add('playing');$('#playLabel').textContent='STOP';scheduler()}
  function scheduler(){if(!state.playing||!state.audio)return;while(state.nextStepAt<state.audio.currentTime+.12){playStep(state.currentStep,state.nextStepAt);visualStep(state.currentStep,state.nextStepAt);state.nextStepAt+=(60/state.bpm)/4;state.currentStep=(state.currentStep+1)%16}state.timer=setTimeout(scheduler,25)}
  function playStep(s,when){const d=getStepData(s);if(!d.note||d.gate==='-')return;const f=noteFreq(d.note,d.octave);if(!f)return;const dur=(60/state.bpm)/4,accent=d.accentSlide.includes('A'),slide=d.accentSlide.includes('S');const o=state.audio.createOscillator(),filter=state.audio.createBiquadFilter(),g=state.audio.createGain();o.type=state.waveform==='saw'?'sawtooth':'square';o.frequency.setValueAtTime(f,when);if(slide){const n=getStepData((s+1)%16),nf=noteFreq(n.note,n.octave);if(nf&&n.gate!=='-')o.frequency.exponentialRampToValueAtTime(nf,when+dur*.88)}filter.type='lowpass';filter.Q.value=2+state.knobs.resonance/4;const base=90+state.knobs.cutoff*16,peak=base+450+state.knobs.envMod*39+(accent?1800:0);filter.frequency.setValueAtTime(peak,when);filter.frequency.exponentialRampToValueAtTime(base,when+.06+state.knobs.decay*.0035);const vol=.14+(accent?.08+state.knobs.accent*.0012:0),len=d.gate==='○'?dur*1.4:dur*.7;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+.008);g.gain.exponentialRampToValueAtTime(.0001,when+len+.15);o.connect(filter);filter.connect(g);g.connect(state.audio.destination);o.start(when);o.stop(when+len+.3)}
  function visualStep(s,when){setTimeout(()=>{if(!state.playing)return;$$('[data-playing]').forEach(x=>x.removeAttribute('data-playing'));$(`[data-step-header="${s}"]`)?.setAttribute('data-playing','');$$(`[data-step="${s}"]`).forEach(x=>x.closest('td')?.setAttribute('data-playing',''))},Math.max(0,(when-state.audio.currentTime)*1000))}
  function stopPlayback(){clearTimeout(state.timer);state.playing=false;$$('[data-playing]').forEach(x=>x.removeAttribute('data-playing'));$('#playButton').classList.remove('playing');$('#playLabel').textContent='PLAY';if(state.audio){state.audio.close().catch(()=>{});state.audio=null}}
  async function exportSheet(){if(typeof html2canvas!=='function'){showToast('Export unavailable');return}const c=await html2canvas($('#patternSheet'),{scale:2,backgroundColor:'#fff'});const a=document.createElement('a');a.download=`303_${Date.now()}.jpg`;a.href=c.toDataURL('image/jpeg',.94);a.click()}
  function save(){saveSession()}
  function saveSession(){const data={pattern:Array.from({length:16},(_,s)=>getStepData(s)),knobs:state.knobs,waveform:state.waveform,bpm:state.bpm,author:$('#authorInput').value,title:$('#titleInput').value,notes:$('#notesArea').value};localStorage.setItem('303-session',JSON.stringify(data))}
  function load(){try{const d=JSON.parse(localStorage.getItem('303-session'));if(!d)return;if(d.pattern?.length===16)d.pattern.forEach((x,s)=>setStepData(s,x));if(d.knobs)Object.entries(d.knobs).forEach(([k,v])=>setKnob(k,v));if(d.waveform)setWaveform(d.waveform);if(d.bpm)setBpm(d.bpm);$('#authorInput').value=d.author||'DJ Pierre';$('#titleInput').value=d.title||'Acid Tracks';$('#notesArea').value=d.notes||''}catch{}}
  function showToast(m){const x=$('#toast');x.textContent=m;x.classList.add('show');clearTimeout(x._t);x._t=setTimeout(()=>x.classList.remove('show'),1800)}
  document.addEventListener('DOMContentLoaded',init);
})();
