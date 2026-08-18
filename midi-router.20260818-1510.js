(() => {
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const STORE = '303box-midi-router-v2';
  const DRUM_NOTES = { bd:36, sd:38, cp:50, tm:47, ch:42, oh:46 };
  const NOTE_MIDI = { C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71 };

  const state = {
    access:null, outputId:'', bassChannel:2, rhythmChannel:10,
    clock:false, transport:false, enabled:false,
    running:false, timer:null, nextAt:0, step:0, active:new Set(),
    profile:'generic', output:null
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    if (typeof saved.outputId === 'string') state.outputId = saved.outputId;
    if (Number.isFinite(+saved.bassChannel)) state.bassChannel = clamp(+saved.bassChannel,1,16);
    if (Number.isFinite(+saved.rhythmChannel)) state.rhythmChannel = clamp(+saved.rhythmChannel,1,16);
    state.clock = !!saved.clock;
    state.transport = !!saved.transport;
  } catch (_) {}

  const tr = () => document.documentElement.lang === 'tr';
  const tx = (en,trText) => tr() ? trText : en;
  function persist(){
    localStorage.setItem(STORE, JSON.stringify({
      outputId:state.outputId,bassChannel:state.bassChannel,rhythmChannel:state.rhythmChannel,
      clock:state.clock,transport:state.transport
    }));
  }

  function disarmLegacyMidi(){
    try {
      const mode=$('#midiMode');
      if(mode){mode.value='browser';mode.dispatchEvent(new Event('change',{bubbles:true}));}
      const clock=$('#midiClock');
      if(clock){clock.checked=false;clock.dispatchEvent(new Event('change',{bubbles:true}));}
      localStorage.setItem('303-midi-mode','browser');
      localStorage.setItem('303-midi-clock','0');
    } catch (_) {}
  }

  function isT8(port){
    const text=`${port?.manufacturer||''} ${port?.name||''}`.toLowerCase();
    return text.includes('t-8') || (text.includes('roland') && text.includes('t8'));
  }

  function channelOptions(selected){
    return Array.from({length:16},(_,i)=>`<option value="${i+1}"${i+1===selected?' selected':''}>${i+1}</option>`).join('');
  }

  function uiHtml(){
    return `<div class="midi-compact midi-router" id="midiRouter">
      <div class="midi-compact-head"><strong>MIDI</strong><span class="midi-badge" id="midiRouterBadge">MIDI</span></div>
      <div class="midi-router-grid">
        <button id="midiRouterConnect" class="midi-connect" type="button">${tx('ENABLE MIDI','MIDI’Yİ AÇ')}</button>
        <label class="midi-output-label"><span>${tx('OUTPUT','ÇIKIŞ')}</span><select id="midiRouterOut" disabled><option value="">—</option></select></label>
        <label><span>${tx('BASS CH','BASS KANAL')}</span><select id="midiBassCh">${channelOptions(state.bassChannel)}</select></label>
        <label><span>${tx('RHYTHM CH','RİTİM KANAL')}</span><select id="midiRhythmCh">${channelOptions(state.rhythmChannel)}</select></label>
        <label class="midi-check"><input id="midiRouterClock" type="checkbox"${state.clock?' checked':''}><span>CLOCK</span></label>
        <label class="midi-check"><input id="midiRouterTransport" type="checkbox"${state.transport?' checked':''}><span>START/STOP</span></label>
        <button id="midiPanic" class="midi-panic" type="button">PANIC</button>
      </div>
      <div class="midi-router-note" id="midiRouterNote">${tx('Notes only until MIDI is enabled.','MIDI açılana kadar yalnız tarayıcı çalar.')}</div>
    </div>`;
  }

  function mount(){
    const old=$('.midi-compact');
    if(!old)return false;
    if(old.id==='midiRouter')return true;
    disarmLegacyMidi();
    old.outerHTML=uiHtml();
    bindUi();
    render();
    return true;
  }

  function selectedOutput(){
    return state.access?.outputs.get(state.outputId) || null;
  }

  function refreshOutputs(){
    const sel=$('#midiRouterOut'); if(!sel)return;
    const outs=state.access?[...state.access.outputs.values()].filter(o=>o.state==='connected'):[];
    sel.disabled=false;
    sel.innerHTML='<option value="">—</option>'+outs.map(o=>`<option value="${o.id}">${[o.manufacturer,o.name].filter(Boolean).join(' — ')}</option>`).join('');
    if(outs.some(o=>o.id===state.outputId)) sel.value=state.outputId;
    else if(outs.length===1){ state.outputId=outs[0].id; sel.value=state.outputId; }
    else { state.outputId=''; sel.value=''; }
    state.output=selectedOutput();
    applyProfile(false);
    persist(); render();
  }

  function applyProfile(force){
    const o=selectedOutput();
    state.profile=isT8(o)?'t8':'generic';
    if(state.profile==='t8' && (force || !localStorage.getItem('303box-midi-t8-profile-applied'))){
      state.bassChannel=2; state.rhythmChannel=10;
      localStorage.setItem('303box-midi-t8-profile-applied','1');
      const b=$('#midiBassCh'),r=$('#midiRhythmCh'); if(b)b.value='2'; if(r)r.value='10';
      persist();
    }
  }

  async function connectMidi(){
    if(!navigator.requestMIDIAccess){ setNote(tx('Web MIDI is not supported in this browser.','Bu tarayıcı Web MIDI desteklemiyor.')); return; }
    try{
      state.access=await navigator.requestMIDIAccess({sysex:false});
      state.access.onstatechange=refreshOutputs;
      state.enabled=true;
      refreshOutputs();
    }catch(_){
      state.enabled=false;
      setNote(tx('MIDI permission was not granted.','MIDI izni verilmedi.'));
      render();
    }
  }

  function setNote(text){ const n=$('#midiRouterNote'); if(n)n.textContent=text; }

  function render(){
    const badge=$('#midiRouterBadge');
    const o=selectedOutput();
    const ready=!!(state.enabled&&o&&o.state==='connected');
    if(badge){badge.textContent=ready?(state.profile==='t8'?'T-8':'ON'):'MIDI';badge.classList.toggle('ready',ready);}
    if(!ready){
      setNote(state.enabled?tx('Choose a connected MIDI output.','Bağlı bir MIDI çıkışı seç.') : tx('Notes only until MIDI is enabled.','MIDI açılana kadar yalnız tarayıcı çalar.'));
      return;
    }
    if(state.profile==='t8'){
      setNote(tx('T-8 profile: Bass CH 2, Rhythm CH 10. Accent uses velocity. Slide is legato approximation. T-8 does not accept MIDI CC, pitch bend or SysEx.','T-8 profili: Bass Kanal 2, Ritim Kanal 10. Accent velocity ile gönderilir. Slide legato yaklaşımıdır. T-8 MIDI CC, pitch bend veya SysEx kabul etmez.'));
    }else{
      setNote(tx('Bass and rhythm are sent on separate MIDI channels. Clock and Start/Stop are optional.','Bass ve ritim ayrı MIDI kanallarından gönderilir. Clock ve Start/Stop isteğe bağlıdır.'));
    }
  }

  function bindUi(){
    $('#midiRouterConnect')?.addEventListener('click',connectMidi);
    $('#midiRouterOut')?.addEventListener('change',e=>{
      panic(false); state.outputId=e.target.value; state.output=selectedOutput(); applyProfile(true); persist(); render();
    });
    $('#midiBassCh')?.addEventListener('change',e=>{panic(false);state.bassChannel=clamp(+e.target.value||2,1,16);persist();});
    $('#midiRhythmCh')?.addEventListener('change',e=>{panic(false);state.rhythmChannel=clamp(+e.target.value||10,1,16);persist();});
    $('#midiRouterClock')?.addEventListener('change',e=>{state.clock=e.target.checked;persist();});
    $('#midiRouterTransport')?.addEventListener('change',e=>{state.transport=e.target.checked;persist();});
    $('#midiPanic')?.addEventListener('click',()=>panic(true));
  }

  function bpm(){ return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250); }
  function swing(){ return clamp(Number($('#consoleSwing')?.value)||0,0,60)/100; }
  function stepDur(step){
    const base=60000/bpm()/4, amount=swing()*.28;
    return base*(step%2===0?1+amount:1-amount);
  }

  function bassStep(i){
    const input=$$('#patternSheet .note-input')[i];
    return {
      note:input?.value?.trim().toUpperCase()||'',
      baseOctave:Number(input?.dataset?.baseOctave||input?.dataset?.topC||0)?12:0,
      octave:$$('#patternSheet .octave-cell')[i]?.textContent.trim().toUpperCase()||'',
      expr:$$('#patternSheet .accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',
      gate:$$('#patternSheet .gate-cell')[i]?.textContent.trim()||''
    };
  }

  function midiNote(x){
    let n=NOTE_MIDI[x.note]; if(n==null)return null;
    n+=x.baseOctave;
    if(x.octave==='D')n-=12;
    if(x.octave==='U')n+=12;
    return clamp(n,0,127);
  }

  function send(data,when){
    const o=selectedOutput(); if(!o||o.state!=='connected')return;
    try{o.send(data,when);}catch(_){}
  }

  function activeKey(ch,n){return `${ch}:${n}`;}
  function sendNote(ch,n,vel,onAt,offAt){
    const status=0x90+(ch-1),off=0x80+(ch-1),key=activeKey(ch,n);
    send([status,n,clamp(Math.round(vel),1,127)],onAt);
    state.active.add(key);
    send([off,n,0],offAt);
    setTimeout(()=>state.active.delete(key),Math.max(0,offAt-performance.now()+80));
  }

  function scheduleBass(step,at,dur){
    const e=window.__303boxUnifiedEngine;
    if(!e?.bassOn)return;
    const x=bassStep(step),n=midiNote(x);
    if(n==null||!x.note||x.gate==='-')return;
    const accented=x.expr.includes('A');
    const legato=x.gate==='○'||x.expr.includes('S');
    const velocity=accented?127:88;
    const overlap=legato?Math.max(32,dur*.18):0;
    const length=legato?dur+overlap:dur*.62;
    sendNote(state.bassChannel,n,velocity,at,at+length);
  }

  function drumLevel(id){
    const el=$(`[data-level="${id}"]`); if(!el)return 80;
    const v=Number(el.value); return Number.isFinite(v)?clamp(v,0,100):80;
  }
  function drumOn(id,step){return $(`#drums [data-drum="${id}"][data-step="${step}"]`)?.classList.contains('on');}
  function scheduleDrums(step,at){
    const e=window.__303boxUnifiedEngine; if(!e?.drumsOn)return;
    Object.entries(DRUM_NOTES).forEach(([id,n])=>{
      if(!drumOn(id,step))return;
      const level=drumLevel(id); if(level<=.001)return;
      const velocity=clamp(Math.round(26+level*1.01),1,127);
      const len=id==='oh'?180:75;
      sendNote(state.rhythmChannel,n,velocity,at,at+len);
    });
  }

  function scheduleClock(at,dur){
    if(!state.clock)return;
    const tick=dur/6;
    for(let i=0;i<6;i++)send([0xF8],at+i*tick);
  }

  function tick(){
    if(!state.running)return;
    const o=selectedOutput();
    if(!o||o.state!=='connected'){stopRouter(false);return;}
    const now=performance.now();
    while(state.nextAt<now+110){
      const d=stepDur(state.step),at=state.nextAt;
      scheduleBass(state.step,at,d);
      scheduleDrums(state.step,at);
      scheduleClock(at,d);
      state.nextAt+=d; state.step=(state.step+1)%16;
    }
    state.timer=setTimeout(tick,22);
  }

  function startRouter(){
    const o=selectedOutput(); if(!state.enabled||!o||o.state!=='connected'||state.running)return;
    state.running=true;
    const h=$('#patternSheet [data-step-header][data-playing="true"]');
    const current=h?Number(h.dataset.stepHeader):-1;
    state.step=Number.isInteger(current)&&current>=0?current:0;
    state.nextAt=performance.now()+35;
    if(state.transport)send([0xFA]);
    tick();
  }

  function panic(sendStop){
    const o=selectedOutput(); if(!o)return;
    try{o.clear();}catch(_){}
    state.active.forEach(key=>{
      const [ch,n]=key.split(':').map(Number); send([0x80+(ch-1),n,0]);
    });
    state.active.clear();
    [state.bassChannel,state.rhythmChannel].forEach(ch=>{
      send([0xB0+(ch-1),120,0]);
      send([0xB0+(ch-1),123,0]);
    });
    if(sendStop&&state.transport)send([0xFC]);
  }

  function stopRouter(sendStop=true){
    if(state.timer)clearTimeout(state.timer);
    state.timer=null; state.running=false;
    panic(sendStop);
  }

  function syncTransport(){
    const e=window.__303boxUnifiedEngine;
    const ready=state.enabled&&!!selectedOutput();
    if(ready&&e?.state==='playing'){
      if(!state.running)startRouter();
    }else if(state.running){
      stopRouter(true);
    }
  }

  function settle(){
    [0,80,220,600,1200].forEach(ms=>setTimeout(()=>{mount();render();},ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});
  window.addEventListener('pagehide',()=>stopRouter(true));
  setInterval(syncTransport,24);
  new MutationObserver(()=>{mount();render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  window.__303boxMidiRouter={version:'1510',panic,stop:stopRouter,get state(){return {...state,access:undefined,output:undefined}}};
})();