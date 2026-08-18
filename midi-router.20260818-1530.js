(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const STORE='303box-midi-router-v3';
  const DRUM_NOTES={bd:36,sd:38,cp:50,tm:47,ch:42,oh:46};
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const tr=()=>document.documentElement.lang==='tr';
  const tx=(en,trText)=>tr()?trText:en;

  const state={access:null,outputId:'',bassChannel:2,rhythmChannel:10,clock:false,transport:false,enabled:false,running:false,timer:null,nextAt:0,step:0,profile:'generic',mode:'browser'};
  try{
    const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
    if(typeof saved.outputId==='string')state.outputId=saved.outputId;
    if(Number.isFinite(+saved.bassChannel))state.bassChannel=clamp(+saved.bassChannel,1,16);
    if(Number.isFinite(+saved.rhythmChannel))state.rhythmChannel=clamp(+saved.rhythmChannel,1,16);
    state.clock=!!saved.clock; state.transport=!!saved.transport;
    const old=localStorage.getItem('303-midi-mode');
    state.mode=['browser','both','midi'].includes(saved.mode)?saved.mode:(['browser','both','midi'].includes(old)?old:'browser');
  }catch(_){}

  const persist=()=>localStorage.setItem(STORE,JSON.stringify({outputId:state.outputId,bassChannel:state.bassChannel,rhythmChannel:state.rhythmChannel,clock:state.clock,transport:state.transport,mode:state.mode}));
  const output=()=>state.access?.outputs.get(state.outputId)||null;
  const ready=()=>!!(state.enabled&&output()&&output().state==='connected');
  const shouldSend=()=>ready()&&state.mode!=='browser';
  const isT8=p=>`${p?.manufacturer||''} ${p?.name||''}`.toLowerCase().replace(/\s+/g,' ').includes('t-8');
  const chOpts=s=>Array.from({length:16},(_,i)=>`<option value="${i+1}"${i+1===s?' selected':''}>${i+1}</option>`).join('');

  function syncAudioMode(){ window.__303boxBrowserOutputMode?.setMode(state.mode==='midi'&&ready()?'midi':'browser'); }
  function disarmLegacy(){
    try{const m=$('#midiMode');if(m){m.value='browser';m.dispatchEvent(new Event('change',{bubbles:true}))}const c=$('#midiClock');if(c){c.checked=false;c.dispatchEvent(new Event('change',{bubbles:true}))}}catch(_){}
  }

  function html(){
    return `<div class="midi-compact midi-router-v3" id="midiRouter">
      <div class="midi-compact-head"><strong>MIDI</strong><span class="midi-badge" id="midiRouterBadge">MIDI</span></div>
      <div class="midi-router-grid">
        <button id="midiRouterConnect" class="midi-connect" type="button">${tx('ENABLE MIDI','MIDI’Yİ AÇ')}</button>
        <label class="midi-field midi-output"><span>${tx('OUTPUT','ÇIKIŞ')}</span><select id="midiRouterOut" disabled><option value="">—</option></select></label>
        <label class="midi-field"><span>${tx('PLAYBACK','ÇALMA')}</span><select id="midiRouterMode"><option value="browser">${tx('BROWSER','TARAYICI')}</option><option value="both">${tx('BROWSER + MIDI','TARAYICI + MIDI')}</option><option value="midi">${tx('MIDI ONLY','YALNIZ MIDI')}</option></select></label>
        <label class="midi-field"><span>${tx('BASS CH','BASS KANAL')}</span><select id="midiBassCh">${chOpts(state.bassChannel)}</select></label>
        <label class="midi-field"><span>${tx('RHYTHM CH','RİTİM KANAL')}</span><select id="midiRhythmCh">${chOpts(state.rhythmChannel)}</select></label>
        <label class="midi-toggle"><input id="midiRouterClock" type="checkbox"><span><b>CLOCK</b><small>${tx('Send MIDI clock','MIDI clock gönder')}</small></span></label>
        <label class="midi-toggle"><input id="midiRouterTransport" type="checkbox"><span><b>START/STOP</b><small>${tx('Control device sequencer','Cihaz sequencer’ını kontrol et')}</small></span></label>
        <button id="midiPanic" class="midi-panic" type="button">PANIC</button>
      </div>
      <div class="midi-router-note" id="midiRouterNote"></div>
    </div>`;
  }

  function mount(){
    const old=$('.midi-compact'); if(!old)return false;
    if(old.id==='midiRouter'){render();return true}
    disarmLegacy(); old.outerHTML=html(); bind(); render(); return true;
  }
  function refresh(){
    const sel=$('#midiRouterOut'); if(!sel)return;
    const outs=state.access?[...state.access.outputs.values()].filter(o=>o.state==='connected'):[];
    sel.disabled=false; sel.innerHTML='<option value="">—</option>'+outs.map(o=>`<option value="${o.id}">${[o.manufacturer,o.name].filter(Boolean).join(' — ')}</option>`).join('');
    if(outs.some(o=>o.id===state.outputId))sel.value=state.outputId;
    else if(outs.length===1){state.outputId=outs[0].id;sel.value=state.outputId}else{state.outputId='';sel.value=''}
    if(isT8(output())){state.bassChannel=2;state.rhythmChannel=10;$('#midiBassCh').value='2';$('#midiRhythmCh').value='10'}
    persist();syncAudioMode();render();
  }
  async function connectMidi(){
    if(!navigator.requestMIDIAccess){setNote(tx('Web MIDI is not supported.','Web MIDI desteklenmiyor.'));return}
    try{state.access=await navigator.requestMIDIAccess({sysex:false});state.access.onstatechange=refresh;state.enabled=true;refresh()}catch(_){state.enabled=false;render()}
  }
  function setNote(s){const n=$('#midiRouterNote');if(n)n.textContent=s}
  function render(){
    const o=output(),badge=$('#midiRouterBadge');
    if($('#midiRouterMode'))$('#midiRouterMode').value=state.mode;
    if($('#midiRouterClock'))$('#midiRouterClock').checked=state.clock;
    if($('#midiRouterTransport'))$('#midiRouterTransport').checked=state.transport;
    if(badge){badge.textContent=ready()?(isT8(o)?'T-8':'ON'):'MIDI';badge.classList.toggle('ready',ready())}
    if(!ready())setNote(state.enabled?tx('Choose a connected MIDI output.','Bağlı bir MIDI çıkışı seç.') : tx('Browser audio is active. Enable MIDI to route hardware.','Tarayıcı sesi aktif. Donanıma yönlendirmek için MIDI’yi aç.'));
    else if(isT8(o))setNote(tx('T-8 profile: Bass CH 2, Rhythm CH 10. Clock and Start/Stop are independent.','T-8 profili: Bass Kanal 2, Ritim Kanal 10. Clock ve Start/Stop birbirinden bağımsızdır.'));
    else setNote(tx('Bass and rhythm use separate MIDI channels.','Bass ve ritim ayrı MIDI kanallarını kullanır.'));
    syncAudioMode();
  }
  function bind(){
    $('#midiRouterConnect')?.addEventListener('click',connectMidi);
    $('#midiRouterOut')?.addEventListener('change',e=>{panic(false);state.outputId=e.target.value;refresh()});
    $('#midiRouterMode')?.addEventListener('change',e=>{state.mode=e.target.value;localStorage.setItem('303-midi-mode',state.mode);if(state.mode==='browser')stopRouter(false);persist();syncAudioMode();render()});
    $('#midiBassCh')?.addEventListener('change',e=>{panic(false);state.bassChannel=clamp(+e.target.value||2,1,16);persist()});
    $('#midiRhythmCh')?.addEventListener('change',e=>{panic(false);state.rhythmChannel=clamp(+e.target.value||10,1,16);persist()});
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=e.target.checked;persist()});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=e.target.checked;persist()});
    $('#midiPanic')?.addEventListener('click',()=>panic(true));
  }

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const swing=()=>clamp(Number($('#consoleSwing')?.value)||0,0,60)/100;
  const stepDur=s=>{const b=60000/bpm()/4,a=swing()*.28;return b*(s%2===0?1+a:1-a)};
  function bassStep(i){const n=$$('#patternSheet .note-input')[i];return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||n?.dataset?.topC||0)?12:0,oct:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''}}
  function midiNote(x){let n=NOTE_MIDI[x.note];if(n==null)return null;n+=x.base;if(x.oct==='D')n-=12;if(x.oct==='U')n+=12;return clamp(n,0,127)}
  function send(data,when){const o=output();if(!o||o.state!=='connected')return;try{o.send(data,when)}catch(_){}}
  function sendNote(ch,n,v,on,off){send([0x90+ch-1,n,clamp(Math.round(v),1,127)],on);send([0x80+ch-1,n,0],off)}
  function scheduleBass(s,at,dur){const e=window.__303boxUnifiedEngine;if(!e?.bassOn)return;const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;const leg=x.gate==='○'||x.expr.includes('S');sendNote(state.bassChannel,n,x.expr.includes('A')?127:88,at,at+(leg?dur+Math.max(30,dur*.18):dur*.62))}
  const drumOn=(id,s)=>$(`#drums [data-drum="${id}"][data-step="${s}"]`)?.classList.contains('on');
  const level=id=>{const v=Number($(`[data-level="${id}"]`)?.value);return Number.isFinite(v)?clamp(v,0,100):80};
  function scheduleDrums(s,at){const e=window.__303boxUnifiedEngine;if(!e?.drumsOn)return;Object.entries(DRUM_NOTES).forEach(([id,n])=>{if(!drumOn(id,s)||level(id)<=0)return;sendNote(state.rhythmChannel,n,clamp(Math.round(26+level(id)*1.01),1,127),at,at+(id==='oh'?180:75))})}
  function scheduleClock(at,dur){if(!state.clock)return;for(let i=0;i<6;i++)send([0xF8],at+i*dur/6)}
  function tick(){if(!state.running)return;if(!shouldSend()){stopRouter(false);return}const now=performance.now();while(state.nextAt<now+110){const d=stepDur(state.step),at=state.nextAt;scheduleBass(state.step,at,d);scheduleDrums(state.step,at);scheduleClock(at,d);state.nextAt+=d;state.step=(state.step+1)%16}state.timer=setTimeout(tick,22)}
  function startRouter(){if(!shouldSend()||state.running)return;state.running=true;state.step=0;state.nextAt=performance.now()+35;if(state.transport)send([0xFA]);tick()}
  function panic(sendStop){const o=output();if(!o)return;try{o.clear()}catch(_){};[state.bassChannel,state.rhythmChannel].forEach(ch=>{send([0xB0+ch-1,120,0]);send([0xB0+ch-1,123,0])});if(sendStop&&state.transport)send([0xFC])}
  function stopRouter(sendStop=true){if(state.timer)clearTimeout(state.timer);state.timer=null;state.running=false;panic(sendStop)}
  function syncTransport(){const e=window.__303boxUnifiedEngine;if(shouldSend()&&e?.state==='playing'){if(!state.running)startRouter()}else if(state.running)stopRouter(true);syncAudioMode()}

  function settle(){[0,100,300,700,1400].forEach(ms=>setTimeout(()=>{mount();render()},ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});window.addEventListener('pagehide',()=>stopRouter(true));
  setInterval(syncTransport,24);
  new MutationObserver(()=>{mount();render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxMidiRouter={version:'1530',panic,stop:stopRouter,get state(){return{...state,access:undefined}}};
})();