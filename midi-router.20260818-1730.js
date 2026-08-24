(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const isTR=()=>document.documentElement.lang==='tr';
  const t=(en,tr)=>isTR()?tr:en;

  const STORE='303box-midi-router-v16';
  const LEGACY=['303box-midi-router-v15','303box-midi-router-v14','303box-midi-router-v13','303box-midi-router-v12'];
  const NOTE={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const DRUM={bd:36,sd:38,cp:50,tm:47,ch:42,oh:46};
  const PROFILES={
    t8:{label:'Roland T-8',bass:2,rhythm:10,hasRhythm:true,clock:true,transport:true,rec:true},
    td3:{label:'Behringer TD-3',bass:1,rhythm:10,hasRhythm:false,clock:true,transport:false,rec:false}
  };
  const ALLOWED=new Set(['auto','t8','td3']);
  const TD3_NORMAL_VELOCITY=80;
  const TD3_ACCENT_VELOCITY=112;
  const TD3_SLIDE_OVERLAP_MS=12;

  function loadSaved(){
    for(const key of [STORE,...LEGACY]){
      try{const raw=localStorage.getItem(key);if(raw)return JSON.parse(raw)||{}}catch(_){}
    }
    return {};
  }
  const saved=loadSaved();
  const savedChoice=ALLOWED.has(saved.profileChoice)?saved.profileChoice:'auto';
  const savedEffective=PROFILES[saved.lastEffectiveProfile]?saved.lastEffectiveProfile:null;
  const savedMode=['browser','both','midi'].includes(saved.mode)?saved.mode:'both';

  const state={
    access:null,enabled:false,blocked:false,exclusive:false,running:false,rec:false,recTimer:0,sentStart:false,
    outputId:typeof saved.outputId==='string'?saved.outputId:'',outputName:typeof saved.outputName==='string'?saved.outputName:'',
    choice:savedChoice,effective:savedEffective,channels:saved.channelByProfile&&typeof saved.channelByProfile==='object'?saved.channelByProfile:{},
    bass:clamp(Number(saved.bassChannel)||2,1,16),rhythm:clamp(Number(saved.rhythmChannel)||10,1,16),mode:savedMode,
    clock:!!saved.clock,transport:!!saved.transport,clockNextAt:0,clockBpm:0,playbackGeneration:0,lastAbsoluteStep:-1,
    heldBassNote:null,noteKeys:new Set()
  };

  const engine=()=>window.__303boxUnifiedEngine;
  const out=()=>state.access?.outputs?.get(state.outputId)||null;
  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const detect=name=>/\bt-8\b/i.test(String(name||''))?'t8':/\btd\s*-?\s*3\b/i.test(String(name||''))?'td3':null;
  const ready=()=>!!(state.enabled&&!state.blocked&&!state.exclusive&&out()?.state==='connected'&&state.effective);
  const sendEnabled=()=>ready()&&state.mode!=='browser';
  const profile=()=>state.effective?PROFILES[state.effective]:null;

  function normalizeUi(){
    const select=$('#midiDeviceProfile');
    if(select){
      [...select.options].forEach(option=>{if(!ALLOWED.has(option.value))option.remove()});
      const labels={auto:'AUTO — T-8 / TD-3',t8:'Roland T-8',td3:'Behringer TD-3'};
      [...select.options].forEach(option=>{if(labels[option.value])option.textContent=labels[option.value]});
    }
    $$('.hardware-device-card').forEach(card=>{
      const ids=(card.dataset.device||'').split(/\s+/).filter(Boolean);
      if(ids.length&&!ids.some(id=>id==='t8'||id==='td3'))card.remove();
    });
  }

  function effectiveId(){
    if(state.choice==='t8'||state.choice==='td3')return state.choice;
    const name=out()?portName(out()):state.outputName;
    return detect(name);
  }
  function applyProfile({defaults=false}={}){
    const id=effectiveId(),changed=id!==state.effective;
    state.effective=id;
    const p=profile();
    if(!p)return;
    const memory=state.channels[id];
    if(memory){state.bass=clamp(Number(memory.bass)||p.bass,1,16);state.rhythm=clamp(Number(memory.rhythm)||p.rhythm,1,16)}
    else if(changed||defaults){state.bass=p.bass;state.rhythm=p.rhythm}
  }
  function rememberChannels(){if(state.effective)state.channels[state.effective]={bass:state.bass,rhythm:state.rhythm}}
  function persist(){
    try{localStorage.setItem(STORE,JSON.stringify({outputId:state.outputId,outputName:state.outputName,profileChoice:state.choice,lastEffectiveProfile:state.effective,channelByProfile:state.channels,bassChannel:state.bass,rhythmChannel:state.rhythm,mode:state.mode,clock:state.clock,transport:state.transport}));localStorage.setItem('303-midi-mode',state.mode)}catch(_){}
  }

  function immediate(msg){const o=out();if(!o||o.state!=='connected')return;try{o.send(msg)}catch(_){}}
  function scheduled(msg,at){const o=out();if(!o||o.state!=='connected'||state.blocked||state.exclusive)return;try{o.send(msg,Math.max(performance.now(),Number(at)||0))}catch(_){}}
  function clearQueue(){try{out()?.clear()}catch(_){}state.clockNextAt=0}
  function noteOn(ch,n,vel,at){state.noteKeys.add(`${ch}:${n}`);scheduled([0x90+ch-1,n,clamp(Math.round(vel),1,127)],at)}
  function noteOff(ch,n,at){state.noteKeys.delete(`${ch}:${n}`);scheduled([0x80+ch-1,n,0],at)}
  function releaseKnownNotes(at=performance.now()){
    for(const key of [...state.noteKeys]){const[ch,n]=key.split(':').map(Number);if(ch>=1&&ch<=16&&n>=0&&n<=127)scheduled([0x80+ch-1,n,0],at)}
    state.noteKeys.clear();state.heldBassNote=null;
  }
  function hardCleanup(){
    releaseKnownNotes();
    if(state.bass>=1)immediate([0xB0+state.bass-1,123,0]);
    if(profile()?.hasRhythm&&state.rhythm>=1)immediate([0xB0+state.rhythm-1,123,0]);
  }
  function stopRouter({clear=true}={}){
    if(clear)clearQueue();releaseKnownNotes();
    state.running=false;state.playbackGeneration=0;state.lastAbsoluteStep=-1;state.clockNextAt=0;state.clockBpm=0;
    if(state.sentStart){immediate([0xFC]);state.sentStart=false}
  }
  function emergencyStop({block=false,stopSite=true}={}){
    clearQueue();hardCleanup();
    if(state.sentStart){immediate([0xFC]);state.sentStart=false}
    state.running=false;state.rec=false;state.playbackGeneration=0;state.lastAbsoluteStep=-1;
    if(state.recTimer){clearTimeout(state.recTimer);state.recTimer=0}
    if(block)state.blocked=true;
    if(stopSite){try{engine()?.stopAll?.()}catch(_){}}
    render();
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
    if(outputs.some(x=>x.id===state.outputId)){state.outputName=portName(outputs.find(x=>x.id===state.outputId))}
    else if(state.outputName){const match=outputs.find(x=>portName(x)===state.outputName);if(match)state.outputId=match.id}
    if(!state.outputId&&outputs.length===1){state.outputId=outputs[0].id;state.outputName=portName(outputs[0])}
    sel.disabled=!outputs.length;
    sel.innerHTML='<option value="">—</option>'+outputs.map(x=>`<option value="${x.id}">${portName(x)}</option>`).join('');
    sel.value=outputs.some(x=>x.id===state.outputId)?state.outputId:'';
  }
  function render(){
    normalizeUi();applyProfile();const p=profile();
    text('midiConnectCopy',state.blocked?'RE-ARM MIDI':state.enabled?'MIDI ENABLED':'ENABLE MIDI',state.blocked?'MIDI’Yİ YENİDEN AÇ':state.enabled?'MIDI AÇIK':'MIDI’Yİ AÇ');
    text('midiOutputLabel','OUTPUT','ÇIKIŞ');text('midiDeviceLabel','DEVICE','CİHAZ');text('midiPlaybackLabel','PLAYBACK','ÇALMA');
    text('midiBassLabel','BASS CH','BASS KANAL');text('midiRhythmLabel','RHYTHM CH','RİTİM KANAL');
    text('midiClockTitle','SEND CLOCK','CLOCK GÖNDER');text('midiTransportTitle','SEND START / STOP','START / STOP GÖNDER');
    renderOutputs();syncModeLabels();
    const prof=$('#midiDeviceProfile');if(prof)prof.value=state.choice;
    const mode=$('#midiRouterMode');if(mode)mode.value=state.mode;
    const bass=$('#midiBassCh');if(bass)bass.value=String(state.bass);
    const rhythm=$('#midiRhythmCh');if(rhythm){rhythm.value=String(state.rhythm);rhythm.disabled=!p?.hasRhythm}
    $('#midiRhythmField')?.classList.toggle('disabled',!p?.hasRhythm);
    const clock=$('#midiRouterClock');if(clock){clock.checked=state.clock;clock.disabled=!p?.clock}
    const transport=$('#midiRouterTransport');if(transport){transport.checked=state.transport;transport.disabled=!p?.transport}
    const badge=$('#midiRouterBadge');
    if(badge){badge.textContent=state.rec?'REC':state.blocked?'SAFE':ready()?p.label.replace(/^(Roland|Behringer)\s+/,''):state.effective?'MIDI':'SELECT';badge.classList.toggle('ready',ready())}
    const assist=$('#midiRecAssist');if(assist)assist.hidden=!(ready()&&state.effective==='t8');
    const recOkay=ready()&&p?.rec&&!state.rec;
    const rb=$('#midiRecBass'),rr=$('#midiRecRhythm');if(rb)rb.disabled=!recOkay;if(rr)rr.disabled=!recOkay||!p?.hasRhythm;
    if(state.rec)status(t('T-8 REC transfer in progress…','T-8 REC aktarımı sürüyor…'));
    else if(state.exclusive)status(t('TD-3 direct write has exclusive MIDI access.','TD-3 doğrudan yazma MIDI erişimini kullanıyor.'));
    else if(state.enabled&&state.choice==='auto'&&out()&&!state.effective)status(t('This MIDI output is not supported. Choose a Roland T-8 or Behringer TD-3.','Bu MIDI çıkışı desteklenmiyor. Roland T-8 veya Behringer TD-3 seçin.'));
    else if(state.blocked)status(t('MIDI safety stop. Re-arm to continue.','MIDI güvenlik nedeniyle durdu. Devam etmek için yeniden aç.'));
    else status('');
    window.__303boxBrowserOutputMode?.setMode(state.mode==='midi'&&ready()?'midi':'browser');persist();
  }

  async function connect(){
    if(state.blocked&&state.access){state.blocked=false;state.enabled=true;render();return}
    if(!navigator.requestMIDIAccess){status(t('Web MIDI is not supported in this browser.','Bu tarayıcı Web MIDI desteklemiyor.'));return}
    try{
      state.access=await navigator.requestMIDIAccess({sysex:false});state.enabled=true;state.blocked=false;
      state.access.onstatechange=e=>{if(e?.port?.id===state.outputId&&e.port.state!=='connected')emergencyStop({block:true,stopSite:false});else render()};
      renderOutputs();applyProfile({defaults:true});render();
    }catch(_){state.enabled=false;render()}
  }

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  function bassStep(i){
    const n=$$('#patternSheet .note-input')[i];
    return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''};
  }
  function midiNote(x){let n=NOTE[x.note];if(n==null)return null;n+=x.base;if(x.oct==='D')n-=12;if(x.oct==='U')n+=12;return clamp(n,0,127)}
  const playable=x=>!!x.note&&x.gate!=='-';
  const connects=(a,b)=>playable(a)&&playable(b)&&(a.gate==='○'||a.expr.includes('S'));
  const drumOn=(id,s)=>!!$(`#drums .drum-step[data-drum="${id}"][data-step="${s}"]`)?.classList.contains('on');
  const level=id=>{const v=Number($(`#drums [data-level="${id}"]`)?.value);return Number.isFinite(v)?clamp(v,0,100):80};
  function drumVelocity(l,{record=false}={}){if(l<=0)return 0;return clamp(Math.round((record?44:36)+l*.52),1,96)}

  function liveBass(s,at,d,bassOn){
    const now=performance.now();
    if(!bassOn){if(state.heldBassNote!=null)noteOff(state.bass,state.heldBassNote,Math.max(at,now));state.heldBassNote=null;return}
    const current=bassStep(s),n=midiNote(current),previous=bassStep((s+15)%16),next=bassStep((s+1)%16);
    const transitionAt=Math.max(Number(at)||now,now+2);
    const incoming=state.heldBassNote!=null&&connects(previous,current);
    if(n==null||!playable(current)){
      if(state.heldBassNote!=null)noteOff(state.bass,state.heldBassNote,transitionAt);
      state.heldBassNote=null;return;
    }
    const vel=state.effective==='td3'?(current.expr.includes('A')?TD3_ACCENT_VELOCITY:TD3_NORMAL_VELOCITY):(current.expr.includes('A')?126:92);
    if(incoming){
      const old=state.heldBassNote;
      if(old!==n){
        noteOn(state.bass,n,vel,transitionAt);
        noteOff(state.bass,old,transitionAt+(state.effective==='td3'?TD3_SLIDE_OVERLAP_MS:8));
      }
    }else{
      if(state.heldBassNote!=null)noteOff(state.bass,state.heldBassNote,transitionAt);
      noteOn(state.bass,n,vel,transitionAt);
    }
    if(connects(current,next))state.heldBassNote=n;
    else{
      const offAt=transitionAt+d*(current.gate==='○'?.92:.64);
      noteOff(state.bass,n,offAt);state.heldBassNote=null;
    }
  }

  function liveDrums(s,at,d,drumsOn){
    if(!drumsOn||!profile()?.hasRhythm)return;
    let k=0;for(const[id,n]of Object.entries(DRUM)){if(!drumOn(id,s))continue;const l=level(id);if(l<=0)continue;const on=Math.max(at,performance.now()+2)+(k++*1.8),off=on+(id==='oh'?Math.min(150,d*.82):Math.min(78,d*.52));noteOn(state.rhythm,n,drumVelocity(l),on);noteOff(state.rhythm,n,off)}
  }

  function clockWanted(){return state.running&&sendEnabled()&&state.clock&&profile()?.clock&&!state.rec}
  function scheduleLiveClock(at,d,currentBpm){
    if(!clockWanted())return;
    const period=60000/currentBpm/24,end=at+d;
    if(!state.clockNextAt||state.clockNextAt<at-period*1.5)state.clockNextAt=at;
    while(state.clockNextAt<end-.01){scheduled([0xF8],state.clockNextAt);state.clockNextAt+=period}
    state.clockBpm=currentBpm;
  }
  function startRouter(detail={}){
    if(state.running||state.rec||!sendEnabled())return;
    state.running=true;state.playbackGeneration=Number(detail.generation)||0;state.lastAbsoluteStep=-1;state.clockNextAt=0;state.clockBpm=0;
    if(state.effective==='t8'&&state.transport&&profile()?.transport){const first=Number(detail.performanceTime);scheduled([0xFA],Number.isFinite(first)?Math.max(performance.now(),first-12):performance.now());state.sentStart=true}
  }
  function onPlaybackStep(event){
    const d=event?.detail||{},absolute=Number(d.absoluteStep),generation=Number(d.generation),at=Number(d.performanceTime),duration=Number(d.durationMs);
    if(state.rec||!sendEnabled()||d.state!=='playing'||!Number.isFinite(absolute)||!Number.isFinite(at)||!Number.isFinite(duration))return;
    if(state.running&&state.playbackGeneration&&generation&&generation!==state.playbackGeneration)stopRouter();
    if(!state.running)startRouter(d);if(!state.running)return;
    if(absolute<=state.lastAbsoluteStep)return;
    if(state.lastAbsoluteStep>=0&&absolute>state.lastAbsoluteStep+1){
      if(state.heldBassNote!=null)noteOff(state.bass,state.heldBassNote,Math.max(performance.now()+2,at));
      state.heldBassNote=null;
    }
    const dur=Math.max(12,duration),step=((Number(d.step)%16)+16)%16;
    scheduleLiveClock(at,dur,bpm());liveBass(step,at,dur,!!d.bassOn);liveDrums(step,at,dur,!!d.drumsOn);state.lastAbsoluteStep=absolute;
  }
  function onPlaybackState(event){
    const d=event?.detail||{};
    if(d.state==='playing'){if(sendEnabled())startRouter(d)}else if(state.running||state.sentStart)stopRouter();
  }
  function onPlaybackResync(){
    if(state.heldBassNote!=null)noteOff(state.bass,state.heldBassNote,performance.now()+2);
    state.heldBassNote=null;state.lastAbsoluteStep=-1;state.clockNextAt=0;
  }

  function scheduleClockedStep(at,d){for(let c=0;c<6;c++)scheduled([0xF8],at+c*d/6)}
  function recBass(s,at,d){
    const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;
    const leg=x.gate==='○'||x.expr.includes('S');noteOn(state.bass,n,x.expr.includes('A')?126:92,at+10);noteOff(state.bass,n,at+(leg?d*1.10:d*.68));
  }
  function recDrums(s,at,d){let k=0;for(const[id,n]of Object.entries(DRUM)){if(!drumOn(id,s))continue;const l=level(id);if(l<=0)continue;const on=at+28+(k++*2.2);noteOn(state.rhythm,n,drumVelocity(l,{record:true}),on);noteOff(state.rhythm,n,on+(id==='oh'?Math.min(150,d*.8):76))}}
  function finishRec(end,kind){
    state.recTimer=setTimeout(()=>{immediate([0xFC]);releaseKnownNotes();state.rec=false;state.recTimer=0;render();status(kind==='rhythm'?t('Rhythm REC finished. Check the T-8 pattern, then WRITE on the device.','Ritim REC bitti. T-8 patternini kontrol et, sonra cihazda WRITE yap.'):t('Bass REC finished. Accent/Slide capture remains enabled; check the T-8 pattern, then WRITE on the device.','Bass REC bitti. Accent/Slide aktarımı korunuyor; T-8 patternini kontrol et, sonra cihazda WRITE yap.'))},Math.max(300,end-performance.now()+180));
  }
  function recPass(kind){
    const p=profile();if(!ready()||state.effective!=='t8'||!p?.rec||state.rec)return;
    if(engine()?.state==='playing'){status(t('Stop 303box playback first, then arm REC on the T-8 and try again.','Önce 303box çalmasını durdur, sonra T-8 üzerinde REC’i açıp tekrar dene.'));return}
    state.clock=true;clearQueue();state.running=false;state.sentStart=false;state.rec=true;render();
    const d=60000/bpm()/4,now=performance.now();
    if(kind==='bass'){
      const lockStart=now+120,start=lockStart+2*d;for(let i=0;i<2;i++)scheduleClockedStep(lockStart+i*d,d);scheduled([0xFA],start-12);
      for(let s=0;s<16;s++){const at=start+s*d;scheduleClockedStep(at,d);recBass(s,at,d)}finishRec(start+16*d,kind);return;
    }
    const start=now+160;scheduled([0xFA],start-45);for(let loop=0;loop<2;loop++)for(let s=0;s<16;s++){const at=start+(loop*16+s)*d;scheduleClockedStep(at,d);recDrums(s,at,d)}finishRec(start+32*d,kind);
  }

  function beginExclusive(reason='external'){
    if(state.exclusive)return()=>{};
    clearQueue();releaseKnownNotes();state.running=false;state.sentStart=false;state.exclusive=true;render();
    let released=false;
    return()=>{if(released)return;released=true;state.exclusive=false;render()};
  }

  function bind(){
    $('#midiRouterConnect')?.addEventListener('click',connect);
    $('#midiRouterOut')?.addEventListener('change',e=>{stopRouter();state.outputId=e.target.value;state.outputName=portName(out());applyProfile({defaults:true});render()});
    $('#midiDeviceProfile')?.addEventListener('change',e=>{stopRouter();state.choice=ALLOWED.has(e.target.value)?e.target.value:'auto';applyProfile({defaults:true});render()});
    $('#midiRouterMode')?.addEventListener('change',e=>{const v=e.target.value;if(['browser','both','midi'].includes(v)){if(v==='browser')stopRouter();state.mode=v;render()}});
    $('#midiBassCh')?.addEventListener('change',e=>{state.bass=clamp(Number(e.target.value)||1,1,16);rememberChannels();render()});
    $('#midiRhythmCh')?.addEventListener('change',e=>{state.rhythm=clamp(Number(e.target.value)||10,1,16);rememberChannels();render()});
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=!!e.target.checked;if(!state.clock)state.clockNextAt=0;render()});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=!!e.target.checked;render()});
    $('#midiPanic')?.addEventListener('click',()=>emergencyStop({stopSite:true}));
    $('#midiRecBass')?.addEventListener('click',()=>recPass('bass'));$('#midiRecRhythm')?.addEventListener('click',()=>recPass('rhythm'));
  }
  function init(){
    if(!$('#midiRouter'))return;normalizeUi();applyProfile();bind();render();
    window.addEventListener('303box:playback-step',onPlaybackStep);window.addEventListener('303box:playback-state',onPlaybackState);window.addEventListener('303box:playback-start',onPlaybackState);window.addEventListener('303box:playback-stop',onPlaybackState);window.addEventListener('303box:playback-resync',onPlaybackResync);
    document.addEventListener('303box:languagechange',render);document.addEventListener('visibilitychange',()=>{if(document.hidden)emergencyStop({stopSite:true})});window.addEventListener('pagehide',()=>emergencyStop({block:true,stopSite:true}));
    window.__303boxMidiRouter={version:'2401',panic:()=>emergencyStop({stopSite:true}),sendRecPass:recPass,beginExclusive,get state(){return{...state,noteKeys:new Set(state.noteKeys)}}};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
