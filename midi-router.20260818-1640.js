(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const STORE='303box-midi-router-v6';
  const OLD=['303box-midi-router-v5','303box-midi-router-v4','303box-midi-router-v3'];
  const DRUM_NOTES={bd:36,sd:38,cp:50,tm:47,ch:42,oh:46};
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const tr=()=>document.documentElement.lang==='tr';
  const tx=(en,trText)=>tr()?trText:en;
  let saved={};
  try{
    const raw=localStorage.getItem(STORE)||OLD.map(k=>localStorage.getItem(k)).find(Boolean)||'{}';
    saved=JSON.parse(raw)||{};
  }catch(_){}

  const state={
    access:null,
    outputId:typeof saved.outputId==='string'?saved.outputId:'',
    bassChannel:Number.isFinite(+saved.bassChannel)?clamp(+saved.bassChannel,1,16):2,
    rhythmChannel:Number.isFinite(+saved.rhythmChannel)?clamp(+saved.rhythmChannel,1,16):10,
    clock:false,
    transport:false,
    mode:['browser','both','midi'].includes(saved.mode)?saved.mode:'browser',
    enabled:false,
    running:false,
    blocked:false,
    sentStart:false,
    nextAt:0,
    step:0,
    lastSignature:'',
    profile:'generic'
  };

  const persist=()=>localStorage.setItem(STORE,JSON.stringify({
    outputId:state.outputId,bassChannel:state.bassChannel,rhythmChannel:state.rhythmChannel,
    clock:state.clock,transport:state.transport,mode:state.mode
  }));
  const output=()=>state.access?.outputs.get(state.outputId)||null;
  const ready=()=>!!(state.enabled&&output()&&output().state==='connected');
  const shouldSend=()=>ready()&&state.mode!=='browser'&&!state.blocked&&!document.hidden;
  const isT8=p=>`${p?.manufacturer||''} ${p?.name||''}`.toLowerCase().replace(/\s+/g,' ').includes('t-8');
  const engine=()=>window.__303boxUnifiedEngine;
  const channelOptions=selected=>Array.from({length:16},(_,i)=>`<option value="${i+1}"${i+1===selected?' selected':''}>${i+1}</option>`).join('');

  let worker=null;
  function ensureWorker(){
    if(worker){worker.postMessage('start');return worker}
    const src=`let t=null;onmessage=e=>{if(e.data==='start'){if(t)clearInterval(t);t=setInterval(()=>postMessage('tick'),25)}else if(e.data==='stop'){if(t)clearInterval(t);t=null}}`;
    worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
    worker.onmessage=()=>syncTransport();
    worker.postMessage('start');
    return worker;
  }

  function html(){return `<div class="midi-compact midi-router-v4" id="midiRouter">
    <div class="midi-compact-head"><strong>MIDI</strong><span class="midi-badge" id="midiRouterBadge">MIDI</span></div>
    <div class="midi-router-primary">
      <button id="midiRouterConnect" class="midi-connect" type="button">${tx('ENABLE MIDI','MIDI’Yİ AÇ')}</button>
      <label class="midi-field midi-output"><span>${tx('OUTPUT','ÇIKIŞ')}</span><select id="midiRouterOut" disabled><option value="">—</option></select></label>
      <label class="midi-field midi-playback"><span>${tx('PLAYBACK','ÇALMA')}</span><select id="midiRouterMode"><option value="browser">${tx('BROWSER','TARAYICI')}</option><option value="both">${tx('BROWSER + MIDI','TARAYICI + MIDI')}</option><option value="midi">${tx('MIDI ONLY','YALNIZ MIDI')}</option></select></label>
    </div>
    <div class="midi-router-secondary">
      <label class="midi-field"><span>${tx('BASS CH','BASS KANAL')}</span><select id="midiBassCh">${channelOptions(state.bassChannel)}</select></label>
      <label class="midi-field"><span>${tx('RHYTHM CH','RİTİM KANAL')}</span><select id="midiRhythmCh">${channelOptions(state.rhythmChannel)}</select></label>
      <label class="midi-toggle"><input id="midiRouterClock" type="checkbox"><span><b>${tx('SEND CLOCK','CLOCK GÖNDER')}</b><small>${tx('303box → device only','Yalnız 303box → cihaz')}</small></span></label>
      <label class="midi-toggle"><input id="midiRouterTransport" type="checkbox"><span><b>${tx('SEND START / STOP','START / STOP GÖNDER')}</b><small>${tx('Device transport output','Cihaz transport çıkışı')}</small></span></label>
      <button id="midiPanic" class="midi-panic" type="button">PANIC</button>
    </div>
    <div class="midi-router-note" id="midiRouterNote"></div>
  </div>`}

  function mount(){
    const old=$('.midi-compact');if(!old)return false;
    if(old.id==='midiRouter'){render();return true}
    try{const legacy=$('#midiMode');if(legacy){legacy.value='browser';legacy.dispatchEvent(new Event('change',{bubbles:true}))}}catch(_){}
    old.outerHTML=html();bind();render();return true;
  }
  function setNote(text){const n=$('#midiRouterNote');if(n)n.textContent=text}
  function syncAudioMode(){window.__303boxBrowserOutputMode?.setMode(state.mode==='midi'&&ready()&&!state.blocked?'midi':'browser')}

  function render(){
    const o=output(),badge=$('#midiRouterBadge');
    if(badge){badge.textContent=state.blocked?'SAFE':(ready()?(isT8(o)?'T-8':'ON'):'MIDI');badge.classList.toggle('ready',ready()&&!state.blocked)}
    if($('#midiRouterMode'))$('#midiRouterMode').value=state.mode;
    if($('#midiBassCh'))$('#midiBassCh').value=String(state.bassChannel);
    if($('#midiRhythmCh'))$('#midiRhythmCh').value=String(state.rhythmChannel);
    if($('#midiRouterClock'))$('#midiRouterClock').checked=state.clock;
    if($('#midiRouterTransport'))$('#midiRouterTransport').checked=state.transport;
    const c=$('#midiRouterConnect');if(c)c.textContent=state.blocked?tx('RE-ARM MIDI','MIDI’Yİ YENİDEN AÇ'):(state.enabled?tx('MIDI ENABLED','MIDI AÇIK'):tx('ENABLE MIDI','MIDI’Yİ AÇ'));
    if(state.blocked)setNote(tx('MIDI was stopped because the tab lost visibility. Re-arm MIDI manually to continue.','Sekme görünürlüğünü kaybettiği için MIDI durduruldu. Devam etmek için MIDI’yi elle yeniden aç.'));
    else if(!ready())setNote(state.enabled?tx('Select a connected MIDI output.','Bağlı bir MIDI çıkışı seç.'):tx('Browser audio is active. MIDI is opt-in for this session.','Tarayıcı sesi aktif. MIDI bu oturum için elle açılır.'));
    else if(isT8(o))setNote(tx(`T-8: Bass CH ${state.bassChannel}, Rhythm CH ${state.rhythmChannel}. MIDI is output-only and stops on tab change.`,`T-8: Bass K ${state.bassChannel}, Ritim K ${state.rhythmChannel}. MIDI yalnız çıkış yönünde ve sekme değişince durur.`));
    else setNote(tx('MIDI output is active only while this tab is visible.','MIDI çıkışı yalnız bu sekme görünürken aktiftir.'));
    syncAudioMode();
  }

  function refreshOutputs(){
    const sel=$('#midiRouterOut');if(!sel)return;
    const outs=state.access?[...state.access.outputs.values()].filter(o=>o.state==='connected'):[];
    sel.disabled=false;sel.innerHTML='<option value="">—</option>'+outs.map(o=>`<option value="${o.id}">${[o.manufacturer,o.name].filter(Boolean).join(' — ')}</option>`).join('');
    if(outs.some(o=>o.id===state.outputId))sel.value=state.outputId;
    else if(outs.length===1){state.outputId=outs[0].id;sel.value=state.outputId}else{state.outputId='';sel.value=''}
    state.profile=isT8(output())?'t8':'generic';persist();render();
  }

  function immediate(data){const o=output();if(!o||o.state!=='connected')return;try{o.send(data)}catch(_){} }
  function scheduled(data,when){const o=output();if(!o||o.state!=='connected'||state.blocked||document.hidden)return;try{o.send(data,when)}catch(_){} }
  function allNotesOff(){
    const o=output();if(!o)return;try{o.clear()}catch(_){}
    const channels=[state.bassChannel,state.rhythmChannel];
    channels.forEach(ch=>{
      for(let n=0;n<128;n++)immediate([0x80+ch-1,n,0]);
      immediate([0xB0+ch-1,120,0]);immediate([0xB0+ch-1,123,0]);
    });
    if(state.sentStart){immediate([0xFC]);state.sentStart=false}
  }
  function hardStop(reason='manual',stopSite=false){
    state.running=false;state.nextAt=0;state.lastSignature='';
    allNotesOff();
    if(reason!=='manual')state.blocked=true;
    if(stopSite){try{engine()?.stopAll?.()}catch(_){}}
    render();
  }

  async function connectMidi(){
    if(state.blocked&&state.access){state.blocked=false;state.enabled=true;ensureWorker();render();return}
    if(!navigator.requestMIDIAccess){setNote(tx('Web MIDI is not supported in this browser.','Bu tarayıcı Web MIDI desteklemiyor.'));return}
    try{
      state.access=await navigator.requestMIDIAccess({sysex:false});state.enabled=true;state.blocked=false;
      state.access.onstatechange=()=>{hardStop('port-change',false);refreshOutputs()};
      refreshOutputs();ensureWorker();render();
    }catch(_){state.enabled=false;render()}
  }

  function bind(){
    $('#midiRouterConnect')?.addEventListener('click',connectMidi);
    $('#midiRouterOut')?.addEventListener('change',e=>{hardStop('manual',false);state.outputId=e.target.value;persist();state.profile=isT8(output())?'t8':'generic';render()});
    $('#midiRouterMode')?.addEventListener('change',e=>{hardStop('manual',false);state.mode=e.target.value;localStorage.setItem('303-midi-mode',state.mode);persist();render()});
    $('#midiBassCh')?.addEventListener('change',e=>{hardStop('manual',false);state.bassChannel=clamp(+e.target.value||2,1,16);persist();render()});
    $('#midiRhythmCh')?.addEventListener('change',e=>{hardStop('manual',false);state.rhythmChannel=clamp(+e.target.value||10,1,16);persist();render()});
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=e.target.checked;persist();render()});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=e.target.checked;persist();render()});
    $('#midiPanic')?.addEventListener('click',()=>hardStop('manual',true));
  }

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const swing=()=>clamp(Number($('#consoleSwing')?.value)||0,0,60)/100;
  const stepDuration=s=>{const base=60000/bpm()/4,amount=swing()*.28;return base*(s%2===0?1+amount:1-amount)};
  function bassStep(i){const n=$$('#patternSheet .note-input')[i];return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''}}
  function midiNote(x){let n=NOTE_MIDI[x.note];if(n==null)return null;n+=x.base;if(x.oct==='D')n-=12;if(x.oct==='U')n+=12;return clamp(n,0,127)}
  function note(ch,n,v,on,off){scheduled([0x90+ch-1,n,clamp(Math.round(v),1,127)],on);scheduled([0x80+ch-1,n,0],off)}
  function scheduleBass(s,at,dur){const e=engine();if(!e?.bassOn)return;const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;const leg=x.gate==='○'||x.expr.includes('S');note(state.bassChannel,n,x.expr.includes('A')?127:88,at,at+(leg?dur+Math.max(24,dur*.15):dur*.60))}
  const drumOn=(id,s)=>$(`#drums .drum-step[data-drum="${id}"][data-step="${s}"]`)?.classList.contains('on');
  const level=id=>{const v=Number($(`#drums [data-level="${id}"]`)?.value);return Number.isFinite(v)?clamp(v,0,100):80};
  function scheduleDrums(s,at){const e=engine();if(!e?.drumsOn)return;Object.entries(DRUM_NOTES).forEach(([id,n])=>{const l=level(id);if(!drumOn(id,s)||l<=0)return;note(state.rhythmChannel,n,clamp(28+l,1,127),at,at+(id==='oh'?170:70))})}
  function scheduleClock(at,dur){if(!state.clock)return;for(let i=0;i<6;i++)scheduled([0xF8],at+i*dur/6)}
  function activeStep(){const x=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(x?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:0}
  function signature(){const e=engine();return `${e?.state}|${e?.bassOn?'b':'-'}${e?.drumsOn?'d':'-'}|${bpm()}|${Math.round(swing()*100)}|${state.bassChannel}|${state.rhythmChannel}|${state.clock}`}

  function pump(){
    if(!state.running||!shouldSend())return;
    const now=performance.now(),horizon=220;
    if(state.nextAt<now-250){state.step=activeStep();state.nextAt=now+24}
    while(state.nextAt<now+horizon){const s=state.step,d=stepDuration(s),at=state.nextAt;scheduleBass(s,at,d);scheduleDrums(s,at);scheduleClock(at,d);state.nextAt+=d;state.step=(s+1)%16}
  }
  function startRouter(){
    if(!shouldSend()||state.running)return;
    state.running=true;state.step=activeStep();state.nextAt=performance.now()+24;state.lastSignature=signature();
    if(state.transport){immediate([0xFA]);state.sentStart=true}
    pump();
  }
  function stopRouter(sendStop=true){
    if(!state.running&&!state.sentStart)return;
    state.running=false;allNotesOff();state.lastSignature='';
    if(sendStop&&state.sentStart){immediate([0xFC]);state.sentStart=false}
  }
  function syncTransport(){
    const e=engine();
    if(state.blocked||document.hidden){if(state.running)hardStop('hidden',true);return}
    if(shouldSend()&&e?.state==='playing'){
      if(!state.running)startRouter();
      const sig=signature();if(state.lastSignature&&sig!==state.lastSignature){allNotesOff();state.step=activeStep();state.nextAt=performance.now()+24}state.lastSignature=sig;pump();
    }else if(state.running)stopRouter(true);
    syncAudioMode();
  }

  document.addEventListener('visibilitychange',()=>{if(document.hidden)hardStop('hidden',true)});
  window.addEventListener('pagehide',()=>hardStop('pagehide',true));
  window.addEventListener('beforeunload',()=>hardStop('unload',false));
  document.addEventListener('freeze',()=>hardStop('freeze',true));

  function settle(){[0,120,360,900].forEach(ms=>setTimeout(()=>{mount();render()},ms));ensureWorker()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});
  new MutationObserver(()=>{mount();render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxMidiRouter={version:'1640',panic:()=>hardStop('manual',true),stop:stopRouter,get state(){return{...state,access:undefined}}};
})();