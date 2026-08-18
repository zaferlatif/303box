(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const STORE='303box-midi-router-v5';
  const OLD_STORE='303box-midi-router-v4';
  const DRUM_NOTES={bd:36,sd:38,cp:50,tm:47,ch:42,oh:46};
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const tr=()=>document.documentElement.lang==='tr';
  const tx=(en,trText)=>tr()?trText:en;
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORE)||localStorage.getItem(OLD_STORE)||localStorage.getItem('303box-midi-router-v3')||'{}')||{}}catch(_){}

  const state={
    access:null,
    outputId:typeof saved.outputId==='string'?saved.outputId:'',
    inputId:typeof saved.inputId==='string'?saved.inputId:'',
    bassChannel:Number.isFinite(+saved.bassChannel)?clamp(+saved.bassChannel,1,16):2,
    rhythmChannel:Number.isFinite(+saved.rhythmChannel)?clamp(+saved.rhythmChannel,1,16):10,
    clock:!!saved.clock,
    transport:!!saved.transport,
    mode:['browser','both','midi'].includes(saved.mode)?saved.mode:(['browser','both','midi'].includes(localStorage.getItem('303-midi-mode'))?localStorage.getItem('303-midi-mode'):'browser'),
    enabled:false,running:false,nextAt:0,step:0,lastSignature:'',profile:'generic',
    deviceRunning:false,clockCount:0,lastClockAt:0,clockSamples:[],lastClockBpm:0,
    ignoreInputUntil:0
  };

  const persist=()=>localStorage.setItem(STORE,JSON.stringify({
    outputId:state.outputId,inputId:state.inputId,bassChannel:state.bassChannel,rhythmChannel:state.rhythmChannel,
    clock:state.clock,transport:state.transport,mode:state.mode
  }));
  const output=()=>state.access?.outputs.get(state.outputId)||null;
  const input=()=>state.access?.inputs.get(state.inputId)||null;
  const ready=()=>!!(state.enabled&&output()&&output().state==='connected');
  const shouldSend=()=>ready()&&state.mode!=='browser';
  const isT8=p=>`${p?.manufacturer||''} ${p?.name||''}`.toLowerCase().replace(/\s+/g,' ').includes('t-8');
  const engine=()=>window.__303boxUnifiedEngine;
  const channelOptions=selected=>Array.from({length:16},(_,i)=>`<option value="${i+1}"${i+1===selected?' selected':''}>${i+1}</option>`).join('');

  let worker=null;
  function ensureWorker(){
    if(worker)return worker;
    const src=`let timer=null;onmessage=e=>{if(e.data==='start'){if(timer)clearInterval(timer);timer=setInterval(()=>postMessage('tick'),25)}else if(e.data==='stop'){if(timer)clearInterval(timer);timer=null}else if(e.data==='tick')postMessage('tick')}`;
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
      <label class="midi-toggle"><input id="midiRouterClock" type="checkbox"><span><b>CLOCK</b><small>${tx('Send / follow MIDI clock','MIDI clock gönder / takip et')}</small></span></label>
      <label class="midi-toggle"><input id="midiRouterTransport" type="checkbox"><span><b>START / STOP</b><small>${tx('Bidirectional transport','Çift yönlü transport')}</small></span></label>
      <button id="midiPanic" class="midi-panic" type="button">PANIC</button>
    </div>
    <div class="midi-router-note" id="midiRouterNote"></div>
  </div>`}

  function mount(){
    const old=$('.midi-compact');if(!old)return false;
    if(old.id==='midiRouter'){render();return true}
    try{const legacyMode=$('#midiMode');if(legacyMode){legacyMode.value='browser';legacyMode.dispatchEvent(new Event('change',{bubbles:true}))}}catch(_){}
    old.outerHTML=html();bind();render();return true;
  }
  function setNote(text){const n=$('#midiRouterNote');if(n)n.textContent=text}
  function syncAudioMode(){window.__303boxBrowserOutputMode?.setMode(state.mode==='midi'&&ready()?'midi':'browser')}

  function sameDevice(a,b){
    if(!a||!b)return false;
    const norm=x=>`${x.manufacturer||''} ${x.name||''}`.toLowerCase().replace(/\b(midi|in|out|input|output|port)\b/g,' ').replace(/\s+/g,' ').trim();
    const na=norm(a),nb=norm(b);return !!na&&!!nb&&(na===nb||na.includes(nb)||nb.includes(na));
  }
  function bindInput(){
    if(!state.access)return;
    [...state.access.inputs.values()].forEach(p=>{if(p.onmidimessage===handleMidi)p.onmidimessage=null});
    let p=input();
    const out=output();
    if(!p||p.state!=='connected'){
      const inputs=[...state.access.inputs.values()].filter(x=>x.state==='connected');
      p=inputs.find(x=>sameDevice(x,out)) || (isT8(out)?inputs.find(isT8):null) || (inputs.length===1?inputs[0]:null);
      state.inputId=p?.id||'';
    }
    if(p)p.onmidimessage=handleMidi;
    persist();
  }

  function render(){
    const o=output();
    const badge=$('#midiRouterBadge');if(badge){badge.textContent=ready()?(isT8(o)?'T-8':'ON'):'MIDI';badge.classList.toggle('ready',ready())}
    if($('#midiRouterMode'))$('#midiRouterMode').value=state.mode;
    if($('#midiBassCh'))$('#midiBassCh').value=String(state.bassChannel);
    if($('#midiRhythmCh'))$('#midiRhythmCh').value=String(state.rhythmChannel);
    if($('#midiRouterClock'))$('#midiRouterClock').checked=state.clock;
    if($('#midiRouterTransport'))$('#midiRouterTransport').checked=state.transport;
    const connect=$('#midiRouterConnect');if(connect)connect.textContent=state.enabled?tx('MIDI ENABLED','MIDI AÇIK'):tx('ENABLE MIDI','MIDI’Yİ AÇ');
    if(!ready())setNote(state.enabled?tx('Select a connected MIDI output.','Bağlı bir MIDI çıkışı seç.') : tx('Browser audio is active. Enable MIDI when you want hardware output.','Tarayıcı sesi aktif. Donanım çıkışı için MIDI’yi aç.'));
    else if(isT8(o)){
      const inReady=!!input();
      setNote(tx(
        `T-8: Bass CH ${state.bassChannel}, Rhythm CH ${state.rhythmChannel}. CLOCK and START/STOP are bidirectional${inReady?' (MIDI IN linked)':''}.`,
        `T-8: Bass K ${state.bassChannel}, Ritim K ${state.rhythmChannel}. CLOCK ve START/STOP çift yönlü${inReady?' (MIDI IN bağlı)':''}.`
      ));
    } else setNote(tx('Bass and rhythm are routed on separate MIDI channels.','Bass ve ritim ayrı MIDI kanallarına yönlendirilir.'));
    syncAudioMode();
  }

  function refreshPorts(){
    const sel=$('#midiRouterOut');if(!sel)return;
    const outs=state.access?[...state.access.outputs.values()].filter(o=>o.state==='connected'):[];
    sel.disabled=false;sel.innerHTML='<option value="">—</option>'+outs.map(o=>`<option value="${o.id}">${[o.manufacturer,o.name].filter(Boolean).join(' — ')}</option>`).join('');
    if(outs.some(o=>o.id===state.outputId))sel.value=state.outputId;
    else if(outs.length===1){state.outputId=outs[0].id;sel.value=state.outputId}else{state.outputId='';sel.value=''}
    state.profile=isT8(output())?'t8':'generic';bindInput();persist();render();
  }

  async function connectMidi(){
    if(!navigator.requestMIDIAccess){setNote(tx('Web MIDI is not supported in this browser.','Bu tarayıcı Web MIDI desteklemiyor.'));return}
    try{
      state.access=await navigator.requestMIDIAccess({sysex:false});state.enabled=true;
      state.access.onstatechange=()=>{refreshPorts();resync(true)};
      refreshPorts();ensureWorker();
    }catch(_){state.enabled=false;render()}
  }

  function bind(){
    $('#midiRouterConnect')?.addEventListener('click',connectMidi);
    $('#midiRouterOut')?.addEventListener('change',e=>{panic(false);state.outputId=e.target.value;persist();state.profile=isT8(output())?'t8':'generic';bindInput();resync(true);render()});
    $('#midiRouterMode')?.addEventListener('change',e=>{state.mode=e.target.value;localStorage.setItem('303-midi-mode',state.mode);persist();if(state.mode==='browser')stopRouter(false);else resync(true);render()});
    $('#midiBassCh')?.addEventListener('change',e=>{panic(false);state.bassChannel=clamp(+e.target.value||2,1,16);persist();resync(true)});
    $('#midiRhythmCh')?.addEventListener('change',e=>{panic(false);state.rhythmChannel=clamp(+e.target.value||10,1,16);persist();resync(true)});
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=e.target.checked;state.clockSamples=[];state.lastClockAt=0;persist();resync(true);render()});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=e.target.checked;persist();render()});
    $('#midiPanic')?.addEventListener('click',()=>panic(true));
  }

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const swing=()=>clamp(Number($('#consoleSwing')?.value)||0,0,60)/100;
  const stepDuration=s=>{const base=60000/bpm()/4,amount=swing()*.28;return base*(s%2===0?1+amount:1-amount)};
  function setBpm(value){
    const v=clamp(Math.round(value),50,250),inputEl=$('#tempoInput'),form=$('#tempoForm'),submit=$('#tempoApply');
    if(!inputEl||!form||!submit)return;
    inputEl.value=String(v);
    try{form.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:submit}))}
    catch(_){submit.click()}
  }
  function bassStep(i){
    const n=$$('#patternSheet .note-input')[i];return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''}
  }
  function midiNote(x){let n=NOTE_MIDI[x.note];if(n==null)return null;n+=x.base;if(x.oct==='D')n-=12;if(x.oct==='U')n+=12;return clamp(n,0,127)}
  function send(data,when){const o=output();if(!o||o.state!=='connected')return;try{o.send(data,when)}catch(_){} }
  function sendRealtime(byte,when){state.ignoreInputUntil=performance.now()+45;send([byte],when)}
  function note(ch,n,v,on,off){send([0x90+ch-1,n,clamp(Math.round(v),1,127)],on);send([0x80+ch-1,n,0],off)}
  function scheduleBass(s,at,dur){
    const e=engine();if(!e?.bassOn)return;const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;
    const leg=x.gate==='○'||x.expr.includes('S');note(state.bassChannel,n,x.expr.includes('A')?127:88,at,at+(leg?dur+Math.max(28,dur*.18):dur*.62));
  }
  const drumOn=(id,s)=>$(`#drums .drum-step[data-drum="${id}"][data-step="${s}"]`)?.classList.contains('on');
  const level=id=>{const v=Number($(`#drums [data-level="${id}"]`)?.value);return Number.isFinite(v)?clamp(v,0,100):80};
  function scheduleDrums(s,at){
    const e=engine();if(!e?.drumsOn)return;Object.entries(DRUM_NOTES).forEach(([id,n])=>{const l=level(id);if(!drumOn(id,s)||l<=0)return;note(state.rhythmChannel,n,clamp(28+l,1,127),at,at+(id==='oh'?190:80))});
  }
  function scheduleClock(at,dur){if(!state.clock||state.deviceRunning)return;for(let i=0;i<6;i++)sendRealtime(0xF8,at+i*dur/6)}
  function activeStep(){const x=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(x?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:0}

  function pump(horizon){
    if(!state.running||!shouldSend())return;
    const now=performance.now();
    if(state.nextAt<now-500){state.step=activeStep();state.nextAt=now+25}
    while(state.nextAt<now+horizon){const s=state.step,d=stepDuration(s),at=state.nextAt;scheduleBass(s,at,d);scheduleDrums(s,at);scheduleClock(at,d);state.nextAt+=d;state.step=(s+1)%16}
  }
  function panic(sendStop=false){
    const o=output();if(!o)return;try{o.clear()}catch(_){}
    [state.bassChannel,state.rhythmChannel].forEach(ch=>{send([0xB0+ch-1,120,0]);send([0xB0+ch-1,123,0])});
    if(sendStop&&state.transport&&!state.deviceRunning)sendRealtime(0xFC);
  }
  function startRouter(){
    if(!shouldSend()||state.running)return;state.running=true;state.step=activeStep();state.nextAt=performance.now()+28;state.lastSignature='';
    if(state.transport&&!state.deviceRunning)sendRealtime(0xFA);
    pump(document.hidden?20000:1800);
  }
  function stopRouter(sendStop=true){
    if(!state.running&&!shouldSend())return;state.running=false;panic(false);state.lastSignature='';
    if(sendStop&&state.transport&&!state.deviceRunning)sendRealtime(0xFC);
  }
  function signature(){const e=engine();return `${e?.state}|${e?.bassOn?'b':'-'}${e?.drumsOn?'d':'-'}|${bpm()}|${Math.round(swing()*100)}|${state.bassChannel}|${state.rhythmChannel}|${state.clock}|${state.deviceRunning}`}
  function resync(clear=true){
    if(!state.running)return;if(clear)panic(false);state.step=activeStep();state.nextAt=performance.now()+28;state.lastSignature=signature();pump(document.hidden?20000:1800);
  }
  function syncTransport(){
    const e=engine();
    if(shouldSend()&&e?.state==='playing'){
      if(!state.running)startRouter();
      const sig=signature();if(state.lastSignature&&sig!==state.lastSignature)resync(true);state.lastSignature=sig;
      pump(document.hidden?20000:1800);
    }else if(state.running)stopRouter(true);
    syncAudioMode();
  }

  function startSiteFromDevice(){
    const e=engine();
    state.deviceRunning=true;state.clockCount=0;state.clockSamples=[];state.lastClockAt=0;
    if(state.transport&&e?.state!=='playing'){
      try{e?.toggleAll?.()}catch(_){}
    }
    state.step=0;state.nextAt=performance.now()+28;state.lastSignature='';
  }
  function stopSiteFromDevice(){
    state.deviceRunning=false;state.clockCount=0;state.clockSamples=[];state.lastClockAt=0;
    if(state.transport){try{engine()?.stopAll?.()}catch(_){}}
  }
  function clockFromDevice(ts){
    if(!state.clock)return;
    const now=Number.isFinite(ts)&&ts>0?ts:performance.now();
    if(state.lastClockAt>0){
      const delta=now-state.lastClockAt;
      if(delta>2&&delta<200){state.clockSamples.push(delta);if(state.clockSamples.length>48)state.clockSamples.shift()}
    }
    state.lastClockAt=now;state.clockCount=(state.clockCount+1)%384;
    if(state.clockSamples.length>=12&&state.clockCount%6===0){
      const sorted=[...state.clockSamples].sort((a,b)=>a-b),trim=Math.max(1,Math.floor(sorted.length*.15)),core=sorted.slice(trim,-trim||undefined);
      const avg=core.reduce((a,b)=>a+b,0)/Math.max(1,core.length),next=60000/(avg*24);
      if(Number.isFinite(next)&&next>=50&&next<=250){
        state.lastClockBpm=next;
        if(Math.abs(next-bpm())>=1)setBpm(next);
      }
    }
  }
  function handleMidi(ev){
    const data=ev?.data;if(!data?.length)return;
    const status=data[0];
    if(performance.now()<state.ignoreInputUntil&&[0xF8,0xFA,0xFB,0xFC].includes(status))return;
    if(status===0xFA){startSiteFromDevice();render();return}
    if(status===0xFB){if(state.transport&&engine()?.state!=='playing'){try{engine()?.toggleAll?.()}catch(_){}}state.deviceRunning=true;return}
    if(status===0xFC){stopSiteFromDevice();render();return}
    if(status===0xF8){state.deviceRunning=true;clockFromDevice(ev.timeStamp);return}
  }

  document.addEventListener('visibilitychange',()=>{if(state.running)resync(true)});
  window.addEventListener('pagehide',()=>stopRouter(true));
  function settle(){[0,120,360,900].forEach(ms=>setTimeout(()=>{mount();render()},ms));ensureWorker()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});
  new MutationObserver(()=>{mount();render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxMidiRouter={version:'1630',panic,stop:stopRouter,resync,get state(){return{...state,access:undefined}}};
})();