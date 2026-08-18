(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const tx = (en, tr) => document.documentElement.lang === 'tr' ? tr : en;
  const STORE = '303box-midi-router-v8';
  const OLD_STORES = ['303box-midi-router-v7','303box-midi-router-v6','303box-midi-router-v5'];
  const NOTE_MIDI = {C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const DRUM_NOTES = {bd:36,sd:38,cp:50,tm:47,ch:42,oh:46};

  const PROFILES = {
    generic:{label:'Generic MIDI',match:null,bass:1,rhythm:10,hasRhythm:true,clock:true,transport:true,recAssist:false},
    t8:{label:'Roland T-8',match:/\bt-8\b/i,bass:2,rhythm:10,hasRhythm:true,clock:true,transport:true,recAssist:true},
    td3mo:{label:'Behringer TD-3-MO',match:/\btd-3[- ]?mo\b/i,bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,recAssist:false},
    td3:{label:'Behringer TD-3',match:/\btd-3\b/i,bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,recAssist:false},
    volcabass:{label:'Korg volca bass',match:/volca\s+bass/i,bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,recAssist:false},
    volcanubass:{label:'Korg volca nubass',match:/volca\s+nu?bass/i,bass:1,rhythm:10,hasRhythm:false,clock:true,transport:true,recAssist:false}
  };

  function loadSaved(){
    for(const key of [STORE, ...OLD_STORES]){
      try{const raw=localStorage.getItem(key);if(raw)return JSON.parse(raw)||{}}catch(_){}
    }
    return {};
  }
  const saved = loadSaved();
  const state = {
    access:null,
    enabled:false,
    blocked:false,
    running:false,
    recActive:false,
    recTimer:0,
    sentStart:false,
    outputId:typeof saved.outputId==='string'?saved.outputId:'',
    outputName:typeof saved.outputName==='string'?saved.outputName:'',
    profileChoice:PROFILES[saved.profileChoice]?saved.profileChoice:'auto',
    effectiveProfile:PROFILES[saved.lastEffectiveProfile]?saved.lastEffectiveProfile:'generic',
    lastEffectiveProfile:PROFILES[saved.lastEffectiveProfile]?saved.lastEffectiveProfile:'generic',
    channelByProfile:saved.channelByProfile&&typeof saved.channelByProfile==='object'?saved.channelByProfile:{},
    bassChannel:clamp(Number(saved.bassChannel)||2,1,16),
    rhythmChannel:clamp(Number(saved.rhythmChannel)||10,1,16),
    mode:['browser','both','midi'].includes(saved.mode)?saved.mode:'browser',
    clock:false,
    transport:false,
    nextAt:0,
    step:0,
    lastSignature:''
  };

  const engine = () => window.__303boxUnifiedEngine;
  const output = () => state.access?.outputs?.get(state.outputId) || null;
  const ready = () => !!(state.enabled && output() && output().state === 'connected' && !state.blocked);
  const shouldSend = () => ready() && state.mode !== 'browser' && !document.hidden;
  const portName = p => `${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();

  function persist(){
    try{
      localStorage.setItem(STORE, JSON.stringify({
        outputId:state.outputId,
        outputName:state.outputName,
        profileChoice:state.profileChoice,
        lastEffectiveProfile:state.lastEffectiveProfile,
        channelByProfile:state.channelByProfile,
        bassChannel:state.bassChannel,
        rhythmChannel:state.rhythmChannel,
        mode:state.mode
      }));
    }catch(_){}
  }

  function detectProfile(p){
    const name = portName(p);
    if(PROFILES.td3mo.match.test(name)) return 'td3mo';
    for(const id of ['t8','td3','volcabass','volcanubass']) if(PROFILES[id].match?.test(name)) return id;
    return 'generic';
  }

  function resolvedProfile(){
    if(state.profileChoice !== 'auto') return state.profileChoice;
    const out = output();
    if(out) return detectProfile(out);
    return state.lastEffectiveProfile || 'generic';
  }

  function profile(){ return PROFILES[state.effectiveProfile] || PROFILES.generic; }

  function loadChannelsForProfile(id, first=false){
    const p=PROFILES[id]||PROFILES.generic;
    const savedChannels=state.channelByProfile[id];
    if(savedChannels){
      state.bassChannel=clamp(Number(savedChannels.bass)||p.bass,1,16);
      state.rhythmChannel=clamp(Number(savedChannels.rhythm)||p.rhythm,1,16);
    }else if(first){
      state.bassChannel=p.bass;
      state.rhythmChannel=p.rhythm;
    }
  }

  function applyProfile({forceDefaults=false}={}){
    const id=resolvedProfile();
    const changed=id!==state.effectiveProfile;
    state.effectiveProfile=id;
    state.lastEffectiveProfile=id;
    if(changed || forceDefaults) loadChannelsForProfile(id, true);
    persist();
  }

  function saveChannels(){
    state.channelByProfile[state.effectiveProfile]={bass:state.bassChannel,rhythm:state.rhythmChannel};
    persist();
  }

  function setText(id,en,tr){const el=$(`#${id}`);if(el)el.textContent=tx(en,tr)}
  function setStatus(text){const el=$('#midiRouterStatus');if(el)el.textContent=text}

  function populateProfiles(){
    const sel=$('#midiDeviceProfile'); if(!sel)return;
    const value=state.profileChoice;
    sel.innerHTML=`<option value="auto">AUTO</option>`+Object.entries(PROFILES).map(([id,p])=>`<option value="${id}">${p.label}</option>`).join('');
    sel.value=value;
  }

  function populatePlayback(){
    const sel=$('#midiRouterMode');if(!sel)return;
    sel.innerHTML=`<option value="browser">${tx('BROWSER','TARAYICI')}</option><option value="both">${tx('BROWSER + MIDI','TARAYICI + MIDI')}</option><option value="midi">${tx('MIDI ONLY','YALNIZ MIDI')}</option>`;
    sel.value=state.mode;
  }

  function populateChannels(){
    const html=selected=>Array.from({length:16},(_,i)=>`<option value="${i+1}"${i+1===selected?' selected':''}>${i+1}</option>`).join('');
    const b=$('#midiBassCh'),r=$('#midiRhythmCh');
    if(b){b.innerHTML=html(state.bassChannel);b.value=String(state.bassChannel)}
    if(r){r.innerHTML=html(state.rhythmChannel);r.value=String(state.rhythmChannel)}
  }

  function renderCopy(){
    setText('midiTitle','MIDI','MIDI');
    setText('midiConnectCopy',state.blocked?'RE-ARM MIDI':state.enabled?'MIDI ENABLED':'ENABLE MIDI',state.blocked?'MIDI’Yİ YENİDEN AÇ':state.enabled?'MIDI AÇIK':'MIDI’Yİ AÇ');
    setText('midiOutputLabel','OUTPUT','ÇIKIŞ');
    setText('midiDeviceLabel','DEVICE','CİHAZ');
    setText('midiPlaybackLabel','PLAYBACK','ÇALMA');
    setText('midiBassLabel','BASS CH','BASS KANAL');
    setText('midiRhythmLabel','RHYTHM CH','RİTİM KANAL');
    setText('midiClockTitle','SEND CLOCK','CLOCK GÖNDER');
    setText('midiClockSub','303box → device','303box → cihaz');
    setText('midiTransportTitle','SEND START / STOP','START / STOP GÖNDER');
    setText('midiTransportSub','Device transport output','Cihaz transport çıkışı');
    setText('midiRecTitle','REC ASSIST','REC YARDIMCISI');
    setText('midiRecBass','BASS → REC','BASS → REC');
    setText('midiRecRhythm','RHYTHM → REC','RİTİM → REC');
    setText('midiRecHint','Arm REC on the T-8 first. Sends one 16-step pass; save with WRITE on the device.','Önce T-8 üzerinde REC’i aç. Bir tur 16 adım gönderir; WRITE işlemini cihazdan yap.');
    populatePlayback();
  }

  function renderCapabilities(){
    const wrap=$('#midiCapability');if(!wrap)return;
    const p=profile();
    const live=p.hasRhythm?tx('LIVE: BASS + RHYTHM','CANLI: BASS + RİTİM'):tx('LIVE: BASS','CANLI: BASS');
    const rec=p.recAssist?tx('REC ASSIST: TESTED','REC YARDIMCISI: TEST EDİLDİ'):tx('REC ASSIST: OFF','REC YARDIMCISI: KAPALI');
    wrap.innerHTML=`<span class="midi-cap-device">${p.label}</span><span>${live}</span><span class="${p.recAssist?'rec-ok':'rec-off'}">${rec}</span>`;
  }

  function renderOutput(){
    const sel=$('#midiRouterOut');if(!sel)return;
    const outs=state.access?[...state.access.outputs.values()].filter(o=>o.state==='connected'):[];
    let chosen='';
    if(outs.some(o=>o.id===state.outputId))chosen=state.outputId;
    else if(state.outputName){const found=outs.find(o=>portName(o)===state.outputName);if(found){state.outputId=found.id;chosen=found.id}}
    if(!chosen&&outs.length===1){state.outputId=outs[0].id;state.outputName=portName(outs[0]);chosen=outs[0].id}
    const items=outs.map(o=>`<option value="${o.id}">${portName(o)}</option>`).join('');
    if(outs.length){sel.innerHTML=`<option value="">—</option>${items}`;sel.disabled=false;sel.value=chosen}
    else if(state.outputName){sel.innerHTML=`<option value="${state.outputId}">${state.outputName}</option>`;sel.value=state.outputId;sel.disabled=true}
    else{sel.innerHTML='<option value="">—</option>';sel.disabled=true}
  }

  function syncAudioMode(){
    const effective=state.mode==='midi'&&ready()?'midi':'browser';
    window.__303boxBrowserOutputMode?.setMode(effective);
  }

  function render(){
    applyProfile();
    renderCopy();
    renderOutput();
    populateProfiles();
    populateChannels();
    const p=profile();
    const rhythmField=$('#midiRhythmField');
    if(rhythmField)rhythmField.classList.toggle('disabled',!p.hasRhythm);
    const rhythm=$('#midiRhythmCh');if(rhythm)rhythm.disabled=!p.hasRhythm;
    const clock=$('#midiRouterClock');if(clock){clock.checked=state.clock;clock.disabled=!p.clock}
    const transport=$('#midiRouterTransport');if(transport){transport.checked=state.transport;transport.disabled=!p.transport}
    const badge=$('#midiRouterBadge');
    if(badge){badge.textContent=state.blocked?'SAFE':ready()?p.label.replace(/^(Roland|Behringer|Korg)\s+/,''):'MIDI';badge.classList.toggle('ready',ready())}
    const connect=$('#midiRouterConnect');if(connect)connect.disabled=state.recActive;
    const recBass=$('#midiRecBass'),recRhythm=$('#midiRecRhythm');
    const recReady=ready()&&p.recAssist&&!state.recActive;
    if(recBass)recBass.disabled=!recReady;
    if(recRhythm)recRhythm.disabled=!recReady||!p.hasRhythm;
    renderCapabilities();
    if(state.recActive)setStatus(tx('REC ASSIST is sending one synchronized pass…','REC YARDIMCISI senkron bir tur gönderiyor…'));
    else if(state.blocked)setStatus(tx('MIDI stopped when the tab lost focus. Re-arm manually to continue.','Sekme odağı kaybolduğu için MIDI durdu. Devam etmek için elle yeniden aç.'));
    else if(!state.enabled)setStatus(tx('Browser audio is active. MIDI is opt-in.','Tarayıcı sesi aktif. MIDI isteğe bağlı.'));
    else if(!output())setStatus(tx('Select a connected MIDI output.','Bağlı bir MIDI çıkışı seç.'));
    else setStatus(tx(`${p.label}: Bass CH ${state.bassChannel}${p.hasRhythm?`, Rhythm CH ${state.rhythmChannel}`:''}.`,`${p.label}: Bass K ${state.bassChannel}${p.hasRhythm?`, Ritim K ${state.rhythmChannel}`:''}.`));
    syncAudioMode();
  }

  function immediate(data){const o=output();if(!o||o.state!=='connected')return;try{o.send(data)}catch(_){} }
  function scheduled(data,when){const o=output();if(!o||o.state!=='connected'||state.blocked||document.hidden)return;try{o.send(data,when)}catch(_){} }

  function panic({stopSite=true,block=false}={}){
    const o=output();
    if(o){
      try{o.clear()}catch(_){}
      for(let ch=1;ch<=16;ch++){
        immediate([0xB0+ch-1,120,0]);
        immediate([0xB0+ch-1,123,0]);
      }
      immediate([0xFC]);
    }
    state.sentStart=false;state.running=false;state.recActive=false;state.nextAt=0;state.lastSignature='';
    if(state.recTimer){clearTimeout(state.recTimer);state.recTimer=0}
    if(block)state.blocked=true;
    if(stopSite){try{engine()?.stopAll?.()}catch(_){}}
    render();
  }

  async function connectMidi(){
    if(state.blocked&&state.access){state.blocked=false;state.enabled=true;ensureWorker();refreshOutputs();render();return}
    if(!navigator.requestMIDIAccess){setStatus(tx('Web MIDI is not supported in this browser.','Bu tarayıcı Web MIDI desteklemiyor.'));return}
    try{
      state.access=await navigator.requestMIDIAccess({sysex:false});
      state.enabled=true;state.blocked=false;
      state.access.onstatechange=()=>{panic({stopSite:false,block:true});refreshOutputs()};
      refreshOutputs();ensureWorker();render();
    }catch(_){state.enabled=false;render()}
  }

  function refreshOutputs(){
    renderOutput();
    const out=output();
    if(out){state.outputName=portName(out);if(state.profileChoice==='auto'){const id=detectProfile(out);if(id!==state.effectiveProfile){state.effectiveProfile=id;state.lastEffectiveProfile=id;loadChannelsForProfile(id,true)}}}
    persist();render();
  }

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const swing=()=>clamp(Number($('#consoleSwing')?.value)||0,0,60)/100;
  const stepDuration=s=>{const base=60000/bpm()/4,amount=swing()*.28;return base*(s%2===0?1+amount:1-amount)};

  function bassStep(i){
    const n=$$('#patternSheet .note-input')[i];
    return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''};
  }
  function midiNote(x){let n=NOTE_MIDI[x.note];if(n==null)return null;n+=x.base;if(x.oct==='D')n-=12;if(x.oct==='U')n+=12;return clamp(n,0,127)}
  function note(ch,n,v,on,off){scheduled([0x90+ch-1,n,clamp(Math.round(v),1,127)],on);scheduled([0x80+ch-1,n,0],off)}
  function drumOn(id,s){return !!$(`#drums .drum-step[data-drum="${id}"][data-step="${s}"]`)?.classList.contains('on')}
  function level(id){const v=Number($(`#drums [data-level="${id}"]`)?.value);return Number.isFinite(v)?clamp(v,0,100):80}

  function scheduleBass(s,at,dur){
    const e=engine();if(!e?.bassOn)return;
    const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;
    const leg=x.gate==='○'||x.expr.includes('S');
    note(state.bassChannel,n,x.expr.includes('A')?127:88,at,at+(leg?dur+Math.max(24,dur*.15):dur*.60));
  }

  function scheduleDrums(s,at){
    const p=profile(),e=engine();if(!p.hasRhythm||!e?.drumsOn)return;
    let offset=0;
    Object.entries(DRUM_NOTES).forEach(([id,n])=>{
      const l=level(id);if(!drumOn(id,s)||l<=0)return;
      const on=at+offset;offset+=2.5;
      note(state.rhythmChannel,n,clamp(28+l,1,127),on,on+(id==='oh'?150:76));
    });
  }

  function scheduleClock(at,dur){if(!state.clock||!profile().clock)return;for(let i=0;i<6;i++)scheduled([0xF8],at+i*dur/6)}
  function activeStep(){const x=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(x?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:0}
  function signature(){const e=engine();return `${e?.state}|${e?.bassOn?'b':'-'}${e?.drumsOn?'d':'-'}|${bpm()}|${Math.round(swing()*100)}|${state.bassChannel}|${state.rhythmChannel}|${state.clock}|${state.effectiveProfile}`}

  function pump(){
    if(!state.running||!shouldSend()||state.recActive)return;
    const now=performance.now(),horizon=220;
    if(state.nextAt<now-250){state.step=activeStep();state.nextAt=now+26}
    while(state.nextAt<now+horizon){
      const s=state.step,d=stepDuration(s),at=state.nextAt;
      scheduleBass(s,at,d);scheduleDrums(s,at);scheduleClock(at,d);
      state.nextAt+=d;state.step=(s+1)%16;
    }
  }

  function startRouter(){
    if(!shouldSend()||state.running||state.recActive)return;
    state.running=true;state.step=activeStep();state.nextAt=performance.now()+26;state.lastSignature=signature();
    if(state.transport&&profile().transport){immediate([0xFA]);state.sentStart=true}
    pump();
  }

  function stopRouter(){
    if(!state.running&&!state.sentStart)return;
    const o=output();try{o?.clear()}catch(_){}
    state.running=false;state.nextAt=0;state.lastSignature='';
    for(const ch of [state.bassChannel,state.rhythmChannel]){immediate([0xB0+ch-1,123,0])}
    if(state.sentStart){immediate([0xFC]);state.sentStart=false}
  }

  function syncTransport(){
    if(state.blocked||document.hidden){if(state.running)panic({stopSite:true,block:true});return}
    const e=engine();
    if(shouldSend()&&e?.state==='playing'){
      if(!state.running)startRouter();
      const sig=signature();
      if(state.lastSignature&&sig!==state.lastSignature){const o=output();try{o?.clear()}catch(_){};state.step=activeStep();state.nextAt=performance.now()+26}
      state.lastSignature=sig;pump();
    }else if(state.running)stopRouter();
    syncAudioMode();
  }

  let worker=null;
  function ensureWorker(){
    if(worker){worker.postMessage('start');return worker}
    const code=`let t=null;onmessage=e=>{if(e.data==='start'){if(t)clearInterval(t);t=setInterval(()=>postMessage('tick'),25)}else if(e.data==='stop'){if(t)clearInterval(t);t=null}}`;
    worker=new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));
    worker.onmessage=syncTransport;worker.postMessage('start');return worker;
  }

  function recBassStep(s,at,dur){
    const x=bassStep(s),n=midiNote(x);if(n==null||x.gate==='-')return;
    const leg=x.gate==='○'||x.expr.includes('S');
    note(state.bassChannel,n,x.expr.includes('A')?126:96,at+7,at+(leg?dur*1.08:dur*.66));
  }

  function recDrumStep(s,at,dur){
    let index=0;
    for(const [id,n] of Object.entries(DRUM_NOTES)){
      if(!drumOn(id,s)||level(id)<=0)continue;
      const on=at+7+(index++*4);
      note(state.rhythmChannel,n,clamp(38+level(id),1,127),on,on+Math.min(dur*.62,id==='oh'?150:92));
    }
  }

  function sendRecPass(kind){
    const p=profile();
    if(!ready()||!p.recAssist||state.recActive||document.hidden)return;
    try{engine()?.stopAll?.()}catch(_){}
    stopRouter();
    const o=output();try{o?.clear()}catch(_){}
    state.recActive=true;state.running=false;render();
    const stepMs=60000/bpm()/4;
    const start=performance.now()+180;
    scheduled([0xFA],start-36);
    for(let s=0;s<16;s++){
      const at=start+s*stepMs;
      for(let pulse=0;pulse<6;pulse++)scheduled([0xF8],at+pulse*stepMs/6);
      if(kind==='bass')recBassStep(s,at,stepMs);else recDrumStep(s,at,stepMs);
    }
    const end=start+16*stepMs;
    scheduled([0xFC],end+12);
    state.recTimer=setTimeout(()=>{
      state.recTimer=0;state.recActive=false;state.sentStart=false;
      for(const ch of [state.bassChannel,state.rhythmChannel])immediate([0xB0+ch-1,123,0]);
      setStatus(tx('REC ASSIST pass finished. Save with WRITE on the device if the pattern looks correct.','REC YARDIMCISI turu bitti. Pattern doğru görünüyorsa WRITE işlemini cihazdan yap.'));
      renderControlsOnly();
    },Math.max(300,end-performance.now()+120));
  }

  function renderControlsOnly(){
    const connect=$('#midiRouterConnect');if(connect)connect.disabled=state.recActive;
    const p=profile(),can=ready()&&p.recAssist&&!state.recActive;
    const rb=$('#midiRecBass'),rr=$('#midiRecRhythm');if(rb)rb.disabled=!can;if(rr)rr.disabled=!can||!p.hasRhythm;
    const badge=$('#midiRouterBadge');if(badge&&state.recActive)badge.textContent='REC';
  }

  function bind(){
    $('#midiRouterConnect')?.addEventListener('click',connectMidi);
    $('#midiRouterOut')?.addEventListener('change',e=>{panic({stopSite:false});state.outputId=e.target.value;const out=output();state.outputName=portName(out);if(state.profileChoice==='auto'){const id=detectProfile(out);state.effectiveProfile=id;state.lastEffectiveProfile=id;loadChannelsForProfile(id,true)}persist();render()});
    $('#midiDeviceProfile')?.addEventListener('change',e=>{panic({stopSite:false});state.profileChoice=e.target.value;const id=resolvedProfile();state.effectiveProfile=id;state.lastEffectiveProfile=id;loadChannelsForProfile(id,true);persist();render()});
    $('#midiRouterMode')?.addEventListener('change',e=>{panic({stopSite:false});state.mode=e.target.value;persist();render()});
    $('#midiBassCh')?.addEventListener('change',e=>{panic({stopSite:false});state.bassChannel=clamp(+e.target.value||1,1,16);saveChannels();render()});
    $('#midiRhythmCh')?.addEventListener('change',e=>{panic({stopSite:false});state.rhythmChannel=clamp(+e.target.value||10,1,16);saveChannels();render()});
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=!!e.target.checked;render()});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=!!e.target.checked;render()});
    $('#midiPanic')?.addEventListener('click',()=>panic({stopSite:true}));
    $('#midiRecBass')?.addEventListener('click',()=>sendRecPass('bass'));
    $('#midiRecRhythm')?.addEventListener('click',()=>sendRecPass('rhythm'));
  }

  function init(){
    if(!$('#midiRouter'))return;
    populateProfiles();populatePlayback();populateChannels();bind();render();ensureWorker();
    new MutationObserver(()=>{renderCopy();renderCapabilities()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)panic({stopSite:true,block:true})});
    window.addEventListener('pagehide',()=>panic({stopSite:true,block:true}));
    window.addEventListener('beforeunload',()=>panic({stopSite:false,block:true}));
    document.addEventListener('freeze',()=>panic({stopSite:true,block:true}));
    window.__303boxMidiRouter={version:'1680',panic,sendRecPass,get state(){return {...state}}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
