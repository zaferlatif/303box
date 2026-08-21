(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const isTR=()=>document.documentElement.lang==='tr';
  const t=(en,tr)=>isTR()?tr:en;

  const STORE='303box-midi-router-v15';
  const LEGACY=['303box-midi-router-v14','303box-midi-router-v13','303box-midi-router-v12','303box-midi-router-v11','303box-midi-router-v10','303box-midi-router-v9','303box-midi-router-v8'];
  const NOTE={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const DRUM={bd:36,sd:38,cp:50,tm:47,ch:42,oh:46};

  const PROFILES={
    generic:{label:'Generic MIDI',bass:1,rhythm:10,hasRhythm:true,clock:true,transport:true,rec:false},
    t8:{label:'Roland T-8',bass:2,rhythm:10,hasRhythm:true,clock:true,transport:true,rec:true},
    td3:{label:'Behringer TD-3',bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,rec:false},
    td3mo:{label:'Behringer TD-3-MO',bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,rec:false},
    volcabass:{label:'Korg volca bass',bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,rec:false},
    volcanubass:{label:'Korg volca nubass',bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,rec:false}
  };

  function loadSaved(){
    for(const key of [STORE,...LEGACY]){
      try{const raw=localStorage.getItem(key);if(raw)return JSON.parse(raw)||{}}catch(_){}
    }
    return {};
  }

  const saved=loadSaved();
  const validChoice=x=>x==='auto'||!!PROFILES[x];
  const legacyMode=['browser','both','midi'].includes(saved.mode)?saved.mode:'browser';
  const explicitMode=saved.modeExplicit===true||legacyMode==='both'||legacyMode==='midi';

  const state={
    access:null,
    enabled:false,
    blocked:false,
    running:false,
    rec:false,
    recTimer:0,
    sentStart:false,
    outputId:typeof saved.outputId==='string'?saved.outputId:'',
    outputName:typeof saved.outputName==='string'?saved.outputName:'',
    choice:validChoice(saved.profileChoice)?saved.profileChoice:'auto',
    effective:PROFILES[saved.lastEffectiveProfile]?saved.lastEffectiveProfile:'generic',
    channels:saved.channelByProfile&&typeof saved.channelByProfile==='object'?saved.channelByProfile:{},
    bass:clamp(Number(saved.bassChannel)||2,1,16),
    rhythm:clamp(Number(saved.rhythmChannel)||10,1,16),
    mode:explicitMode?legacyMode:'both',
    modeExplicit:explicitMode,
    clock:!!saved.clock,
    transport:!!saved.transport,
    nextAt:0,
    step:0,
    signature:'',
    clockNextAt:0,
    clockBpm:0,
    playbackGeneration:0,
    lastAbsoluteStep:-1,
    heldBassNote:null,
    noteKeys:new Set()
  };

  const engine=()=>window.__303boxUnifiedEngine;
  const out=()=>state.access?.outputs?.get(state.outputId)||null;
  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const ready=()=>!!(state.enabled&&!state.blocked&&out()?.state==='connected');
  const sendEnabled=()=>ready()&&state.mode!=='browser';

  function detect(name=''){
    const s=String(name);
    if(/\btd-3[- ]?mo\b/i.test(s))return'td3mo';
    if(/\bt-8\b/i.test(s))return't8';
    if(/\btd-3\b/i.test(s))return'td3';
    if(/volca\s+nu?bass/i.test(s))return'volcanubass';
    if(/volca\s+bass/i.test(s))return'volcabass';
    return'generic';
  }

  function effectiveId(){
    if(state.choice!=='auto')return state.choice;
    const name=out()?portName(out()):state.outputName;
    return name?detect(name):(PROFILES[state.effective]?state.effective:'generic');
  }
  function profile(){return PROFILES[state.effective]||PROFILES.generic}

  function applyProfile({defaults=false}={}){
    const id=effectiveId(),changed=id!==state.effective;
    state.effective=id;
    const p=profile(),memory=state.channels[id];
    if(memory){
      state.bass=clamp(Number(memory.bass)||p.bass,1,16);
      state.rhythm=clamp(Number(memory.rhythm)||p.rhythm,1,16);
    }else if(changed||defaults){
      state.bass=p.bass;
      state.rhythm=p.rhythm;
    }
  }

  function rememberChannels(){state.channels[state.effective]={bass:state.bass,rhythm:state.rhythm}}
  function persist(){
    try{
      localStorage.setItem(STORE,JSON.stringify({
        outputId:state.outputId,outputName:state.outputName,profileChoice:state.choice,
        lastEffectiveProfile:state.effective,channelByProfile:state.channels,
        bassChannel:state.bass,rhythmChannel:state.rhythm,mode:state.mode,
        modeExplicit:state.modeExplicit,clock:state.clock,transport:state.transport
      }));
      localStorage.setItem('303-midi-mode',state.mode);
    }catch(_){}
  }

  function immediate(msg){const o=out();if(!o||o.state!=='connected')return;try{o.send(msg)}catch(_){}}
  function scheduled(msg,at){const o=out();if(!o||o.state!=='connected'||state.blocked)return;try{o.send(msg,Math.max(performance.now(),Number(at)||0))}catch(_){}}
  function clearQueue(){try{out()?.clear()}catch(_){}state.clockNextAt=0}
  function releaseKnownNotes(){
    state.noteKeys.forEach(key=>{const[ch,n]=key.split(':').map(Number);if(ch>=1&&ch<=16&&n>=0&&n<=127)immediate([0x80+ch-1,n,0])});
    state.noteKeys.clear();
  }
  function cleanupChannels(){releaseKnownNotes();for(let ch=1;ch<=16;ch++){immediate([0xB0+ch-1,120,0]);immediate([0xB0+ch-1,123,0])}}

  function emergencyStop({block=false,stopSite=true,renderAfter=true}={}){
    clearQueue();cleanupChannels();immediate([0xFC]);
    state.running=false;state.sentStart=false;state.nextAt=0;state.signature='';state.playbackGeneration=0;state.lastAbsoluteStep=-1;state.heldBassNote=null;
    state.rec=false;state.clockNextAt=0;
    if(state.recTimer){clearTimeout(state.recTimer);state.recTimer=0}
    if(block)state.blocked=true;
    if(stopSite){try{engine()?.stopAll?.()}catch(_){}}
    if(renderAfter)render();
  }

  function status(message=''){const el=$('#midiRouterStatus');if(el)el.textContent=message}
  function text(id,en,tr){const el=$(`#${id}`);if(el)el.textContent=t(en,tr)}

  function syncModeLabels(){
    const mode=$('#midiRouterMode');if(!mode)return;
    const labels={browser:t('BROWSER','TARAYICI'),both:t('BROWSER + MIDI','TARAYICI + MIDI'),midi:t('MIDI ONLY','YALNIZ MIDI')};
    [...mode.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  }

  function renderOutputs(){
    const sel=$('#midiRouterOut');if(!sel)return;
    const outputs=state.access?[...state.access.outputs.values()].filter(x=>x.state==='connected'):[];
    if(outputs.some(x=>x.id===state.outputId)){
      const o=outputs.find(x=>x.id===state.outputId);state.outputName=portName(o);
    }else if(state.outputName){
      const match=outputs.find(x=>portName(x)===state.outputName);if(match)state.outputId=match.id;
    }
    if(!state.outputId&&outputs.length===1){state.outputId=outputs[0].id;state.outputName=portName(outputs[0])}
    if(outputs.length){
      sel.disabled=false;
      sel.innerHTML='<option value="">—</option>'+outputs.map(x=>`<option value="${x.id}">${portName(x)}</option>`).join('');
      sel.value=outputs.some(x=>x.id===state.outputId)?state.outputId:'';
    }else if(state.outputName){
      sel.disabled=true;sel.innerHTML=`<option value="${state.outputId}">${state.outputName}</option>`;sel.value=state.outputId;
    }else{
      sel.disabled=true;sel.innerHTML='<option value="">—</option>';
    }
  }

  function render(){
    applyProfile();
    const p=profile();
    text('midiConnectCopy',state.blocked?'RE-ARM MIDI':state.enabled?'MIDI ENABLED':'ENABLE MIDI',state.blocked?'MIDI’Yİ YENİDEN AÇ':state.enabled?'MIDI AÇIK':'MIDI’Yİ AÇ');
    text('midiOutputLabel','OUTPUT','ÇIKIŞ');text('midiDeviceLabel','DEVICE','CİHAZ');text('midiPlaybackLabel','PLAYBACK','ÇALMA');
    text('midiBassLabel','BASS CH','BASS KANAL');text('midiRhythmLabel','RHYTHM CH','RİTİM KANAL');
    text('midiClockTitle','SEND CLOCK','CLOCK GÖNDER');text('midiTransportTitle','SEND START / STOP','START / STOP GÖNDER');
    text('midiRecTitle','T-8 REC','T-8 REC');text('midiRecBass','BASS → REC','BASS → REC');text('midiRecRhythm','RHYTHM → REC','RİTİM → REC');

    renderOutputs();syncModeLabels();
    const prof=$('#midiDeviceProfile');if(prof)prof.value=state.choice;
    const mode=$('#midiRouterMode');if(mode)mode.value=state.mode;
    const bass=$('#midiBassCh');if(bass)bass.value=String(state.bass);
    const rhythm=$('#midiRhythmCh');if(rhythm){rhythm.value=String(state.rhythm);rhythm.disabled=!p.hasRhythm}
    $('#midiRhythmField')?.classList.toggle('disabled',!p.hasRhythm);
    const clock=$('#midiRouterClock');if(clock){clock.checked=state.clock;clock.disabled=!p.clock}
    const transport=$('#midiRouterTransport');if(transport){transport.checked=state.transport;transport.disabled=!p.transport}

    const badge=$('#midiRouterBadge');
    if(badge){badge.textContent=state.rec?'REC':state.blocked?'SAFE':ready()?p.label.replace(/^(Roland|Behringer|Korg)\s+/,''):'MIDI';badge.classList.toggle('ready',ready()&&!state.blocked)}
    const connect=$('#midiRouterConnect');if(connect)connect.disabled=state.rec;
    const recOkay=ready()&&p.rec&&!state.rec;
    const rb=$('#midiRecBass'),rr=$('#midiRecRhythm');if(rb)rb.disabled=!recOkay;if(rr)rr.disabled=!recOkay||!p.hasRhythm;

    if(state.rec)status(t('REC transfer in progress…','REC aktarımı sürüyor…'));
    else if(state.blocked)status(t('MIDI safety stop. Re-arm to continue.','MIDI güvenlik nedeniyle durdu. Devam etmek için yeniden aç.'));
    else status('');

    window.__303boxBrowserOutputMode?.setMode(state.mode==='midi'&&ready()?'midi':'browser');
    persist();
  }

  async function connect(){
    if(state.blocked&&state.access){
      state.blocked=false;state.enabled=true;
      if(!state.modeExplicit){state.mode='both';state.modeExplicit=true}
      render();ensureWorker();return;
    }
    if(!navigator.requestMIDIAccess){status(t('Web MIDI is not supported in this browser.','Bu tarayıcı Web MIDI desteklemiyor.'));return}
    try{
      state.access=await navigator.requestMIDIAccess({sysex:false});
      state.enabled=true;state.blocked=false;
      if(!state.modeExplicit){state.mode='both';state.modeExplicit=true}
      state.access.onstatechange=e=>{
        const port=e?.port;
        if(port?.id===state.outputId&&port.state!=='connected')emergencyStop({block:true,stopSite:false});
        else render();
      };
      renderOutputs();applyProfile({defaults:true});render();ensureWorker();
    }catch(_){state.enabled=false;render()}
  }

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);

  function bassStep(i){
    const n=$$('#patternSheet .note-input')[i];
    return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,
      oct:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',
      expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',
      gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''};
  }

  function midiNote(x){let n=NOTE[x.note];if(n==null)return null;n+=x.base;if(x.oct==='D')n-=12;if(x.oct==='U')n+=12;return clamp(n,0,127)}
  function note(ch,n,vel,on,off){state.noteKeys.add(`${ch}:${n}`);scheduled([0x90+ch-1,n,clamp(Math.round(vel),1,127)],on);scheduled([0x80+ch-1,n,0],off)}
  const drumOn=(id,s)=>!!$(`#drums .drum-step[data-drum="${id}"][data-step="${s}"]`)?.classList.contains('on');
  const level=id=>{const v=Number($(`#drums [data-level="${id}"]`)?.value);return Number.isFinite(v)?clamp(v,0,100):80};
  const playable=x=>!!x.note&&x.gate!=='-';
  const connects=(a,b)=>playable(a)&&playable(b)&&(a.gate==='○'||a.expr.includes('S'));

  function drumVelocity(l,{record=false}={}){
    if(l<=0)return 0;
    if(state.effective==='t8'){
      return record
        ? clamp(Math.round(44+l*.52),1,96)
        : clamp(Math.round(36+l*.52),1,88);
    }
    return clamp(Math.round((record?34:26)+l*.68),1,110);
  }

  function liveBass(s,at,d,bassOn){
    if(!bassOn){state.heldBassNote=null;return}
    const current=bassStep(s),n=midiNote(current);
    if(n==null||!playable(current)){
      if(state.heldBassNote!=null){scheduled([0x80+state.bass-1,state.heldBassNote,0],at);state.heldBassNote=null}
      return;
    }
    const previous=bassStep((s+15)%16),next=bassStep((s+1)%16);
    const previousNote=midiNote(previous),nextNote=midiNote(next);
    const heldFromPrevious=connects(previous,current)&&previousNote===n&&state.heldBassNote===n;
    const heldIntoNext=connects(current,next)&&nextNote===n;
    if(!heldFromPrevious){state.noteKeys.add(`${state.bass}:${n}`);scheduled([0x90+state.bass-1,n,current.expr.includes('A')?127:90],at);state.heldBassNote=n}
    if(heldIntoNext)return;
    const overlap=connects(current,next)?clamp(d*.1,6,14):0;
    const off=connects(current,next)?at+d+overlap:at+d*(current.gate==='○'?.92:.62);
    state.noteKeys.add(`${state.bass}:${n}`);scheduled([0x80+state.bass-1,n,0],off);state.heldBassNote=null;
  }

  function liveDrums(s,at,drumsOn){
    const p=profile();if(!drumsOn||!p.hasRhythm)return;
    let k=0;
    for(const[id,n]of Object.entries(DRUM)){
      const l=level(id);if(!drumOn(id,s)||l<=0)continue;
      const on=at+(k++*2.5),vel=drumVelocity(l);
      note(state.rhythm,n,vel,on,on+(id==='oh'?150:76));
    }
  }

  function signature(){const e=engine();return `${e?.state}|${e?.bassOn?'b':'-'}${e?.drumsOn?'d':'-'}|${state.bass}|${state.rhythm}|${state.effective}`}
  function clockWanted(){return state.running&&sendEnabled()&&state.clock&&profile().clock&&!state.rec}
  function liveTransportConflict(){return ['td3','td3mo','volcabass','volcanubass'].includes(state.effective)}
  function transportWanted(){return state.transport&&profile().transport&&!liveTransportConflict()}

  function startRouter(detail={}){
    if(state.running||state.rec||!sendEnabled())return;
    state.running=true;state.playbackGeneration=Number(detail.generation)||0;state.lastAbsoluteStep=-1;state.signature=signature();state.clockNextAt=0;state.clockBpm=0;
    if(transportWanted()){
      const firstAt=Number(detail.performanceTime),startAt=Number.isFinite(firstAt)?firstAt-12:performance.now();
      scheduled([0xFA],startAt);state.sentStart=true;
    }
  }

  function stopRouter(){
    if(!state.running&&!state.sentStart)return;
    clearQueue();releaseKnownNotes();state.running=false;state.nextAt=0;state.signature='';state.playbackGeneration=0;state.lastAbsoluteStep=-1;state.heldBassNote=null;
    immediate([0xB0+state.bass-1,123,0]);
    if(profile().hasRhythm)immediate([0xB0+state.rhythm-1,123,0]);
    if(state.sentStart){immediate([0xFC]);state.sentStart=false}
    state.clockNextAt=0;
  }

  function scheduleLiveClock(at,durationMs,eventBpm){
    if(!clockWanted()){state.clockNextAt=0;state.clockBpm=0;return}
    const currentBpm=clamp(Number(eventBpm)||bpm(),50,250),period=60000/currentBpm/24,end=at+durationMs;
    if(!state.clockNextAt||state.clockNextAt<at-period){state.clockNextAt=at}
    state.clockBpm=currentBpm;
    while(state.clockNextAt<end-.001){scheduled([0xF8],state.clockNextAt);state.clockNextAt+=period}
  }

  function onPlaybackStep(event){
    const d=event?.detail||{},step=Number(d.step),absoluteStep=Number(d.absoluteStep),at=Number(d.performanceTime),dur=Number(d.durationMs);
    if(state.rec||!sendEnabled()||d.state!=='playing'||!Number.isInteger(step)||step<0||step>15||!Number.isFinite(absoluteStep)||!Number.isFinite(at)||!Number.isFinite(dur)||dur<=0)return;
    if(state.running&&state.playbackGeneration!==Number(d.generation))stopRouter();
    if(!state.running)startRouter(d);
    if(!state.running)return;
    if(absoluteStep<=state.lastAbsoluteStep)return;
    if(state.lastAbsoluteStep>=0&&absoluteStep!==state.lastAbsoluteStep+1){stopRouter();startRouter(d)}
    scheduleLiveClock(at,dur,d.bpm);
    liveBass(step,at,dur,!!d.bassOn);liveDrums(step,at,!!d.drumsOn);
    state.lastAbsoluteStep=absoluteStep;
  }

  function onPlaybackState(event){
    const d=event?.detail||{};
    if(d.state!=='playing'){if(state.running||state.sentStart)stopRouter();return}
    if(!d.bassOn&&state.heldBassNote!=null){immediate([0x80+state.bass-1,state.heldBassNote,0]);state.heldBassNote=null}
    if(state.sentStart&&liveTransportConflict()){immediate([0xFC]);state.sentStart=false}
  }

  function onPlaybackResync(){if(state.running||state.sentStart)stopRouter()}

  function sync(){
    const e=engine();
    if((!sendEnabled()||e?.state!=='playing'||state.rec)&&state.running)stopRouter();
  }

  let worker=null;
  function ensureWorker(){
    if(worker){worker.postMessage('start');return}
    const code=`let i=null;onmessage=e=>{if(e.data==='start'){if(i)clearInterval(i);i=setInterval(()=>postMessage(1),25)}else if(e.data==='stop'){clearInterval(i);i=null}}`;
    worker=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));
    worker.onmessage=sync;worker.postMessage('start');
  }

  function recBass(s,at,d){
    const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;
    const leg=x.gate==='○'||x.expr.includes('S');
    note(state.bass,n,x.expr.includes('A')?126:98,at+10,at+(leg?d*1.08:d*.68));
  }

  function recDrums(s,at,d){
    let k=0;
    for(const[id,n]of Object.entries(DRUM)){
      const l=level(id);if(!drumOn(id,s)||l<=0)continue;
      const on=at+30+(k++*2.5),vel=drumVelocity(l);
      note(state.rhythm,n,vel,on,on+(id==='oh'?150:76));
    }
  }

  function scheduleClockedStep(at,d){for(let c=0;c<6;c++)scheduled([0xF8],at+c*d/6)}

  function recPass(kind){
    const p=profile();if(!ready()||!p.rec||state.rec)return;
    if(engine()?.state==='playing'){
      status(t('Stop 303box playback first, then arm REC on the T-8 and try again.','Önce 303box çalmasını durdur, sonra T-8 üzerinde REC’i açıp tekrar dene.'));
      return;
    }
    if(state.effective==='t8')state.clock=true;

    clearQueue();
    state.running=false;state.sentStart=false;state.nextAt=0;state.signature='';state.clockNextAt=0;
    state.rec=true;persist();render();

    const d=60000/bpm()/4;
    const now=performance.now();

    if(kind==='bass'){
      const lockSteps=2;
      const lockStart=now+120;
      const start=lockStart+lockSteps*d;
      for(let i=0;i<lockSteps;i++)scheduleClockedStep(lockStart+i*d,d);
      scheduled([0xFA],start-12);
      for(let s=0;s<16;s++){
        const at=start+s*d;
        scheduleClockedStep(at,d);
        recBass(s,at,d);
      }
      finishRec(start+16*d,kind);
      return;
    }

    const start=now+260;
    scheduled([0xFA],start-45);
    const loops=2;
    for(let loop=0;loop<loops;loop++){
      for(let s=0;s<16;s++){
        const at=start+(loop*16+s)*d;
        scheduleClockedStep(at,d);
        recDrums(s,at,d);
      }
    }
    finishRec(start+loops*16*d,kind);
  }

  function finishRec(end,kind){
    scheduled([0xFC],end+16);
    state.recTimer=setTimeout(()=>{
      state.recTimer=0;state.rec=false;state.sentStart=false;cleanupChannels();state.clockNextAt=0;
      render();
      status(kind==='rhythm'
        ? t('Rhythm REC finished. Check the T-8 pattern, then WRITE on the device.','Ritim REC bitti. T-8 patternini kontrol et, sonra cihazda WRITE yap.')
        : t('Bass REC finished. Accent/Slide capture remains enabled; check the recorded T-8 pattern, then WRITE on the device.','Bass REC bitti. Accent/Slide aktarımı korunuyor; T-8 patternini kontrol et, sonra cihazda WRITE yap.'));
    },Math.max(300,end-performance.now()+180));
  }

  function bind(){
    $('#midiRouterConnect')?.addEventListener('click',connect);
    $('#midiRouterOut')?.addEventListener('change',e=>{
      const value=e.target.value;emergencyStop({stopSite:false,renderAfter:false});
      state.outputId=value;const o=out();state.outputName=portName(o);
      if(state.choice==='auto'){state.effective=detect(state.outputName);applyProfile({defaults:true})}
      if(!state.modeExplicit&&value){state.mode='both';state.modeExplicit=true}
      persist();render();
    });
    $('#midiDeviceProfile')?.addEventListener('change',e=>{
      emergencyStop({stopSite:false,renderAfter:false});state.choice=e.target.value;state.effective=effectiveId();applyProfile({defaults:true});persist();render();
    });
    $('#midiRouterMode')?.addEventListener('change',e=>{
      emergencyStop({stopSite:false,renderAfter:false});state.mode=e.target.value;state.modeExplicit=true;persist();render();
    });
    $('#midiBassCh')?.addEventListener('change',e=>{
      emergencyStop({stopSite:false,renderAfter:false});state.bass=clamp(+e.target.value||1,1,16);rememberChannels();persist();render();
    });
    $('#midiRhythmCh')?.addEventListener('change',e=>{
      emergencyStop({stopSite:false,renderAfter:false});state.rhythm=clamp(+e.target.value||10,1,16);rememberChannels();persist();render();
    });
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=!!e.target.checked;state.clockNextAt=0;persist()});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=!!e.target.checked;if(!state.transport&&state.sentStart){immediate([0xFC]);state.sentStart=false}persist()});
    $('#midiPanic')?.addEventListener('click',()=>emergencyStop({stopSite:true}));
    $('#midiRecBass')?.addEventListener('click',()=>recPass('bass'));
    $('#midiRecRhythm')?.addEventListener('click',()=>recPass('rhythm'));
  }

  function init(){
    if(!$('#midiRouter'))return;
    applyProfile();bind();render();ensureWorker();
    window.addEventListener('303box:playback-step',onPlaybackStep);
    window.addEventListener('303box:playback-state',onPlaybackState);
    window.addEventListener('303box:playback-start',onPlaybackState);
    window.addEventListener('303box:playback-stop',onPlaybackState);
    window.addEventListener('303box:playback-resync',onPlaybackResync);
    document.addEventListener('303box:languagechange',()=>{syncModeLabels();render()});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)emergencyStop({stopSite:true,renderAfter:false})});
    window.addEventListener('pagehide',()=>emergencyStop({block:true,stopSite:true,renderAfter:false}));
    window.addEventListener('beforeunload',()=>emergencyStop({block:true,stopSite:false,renderAfter:false}));
    document.addEventListener('freeze',()=>emergencyStop({block:true,stopSite:true,renderAfter:false}));
    window.__303boxMidiRouter={version:'2205',panic:()=>emergencyStop({stopSite:true}),sendRecPass:recPass,get state(){return{...state,noteKeys:new Set(state.noteKeys)}}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
