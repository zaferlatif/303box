(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const NOTE_MIDI = { C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71 };
  const STORE = '303box-acid-console-v1';
  const isTR = () => document.documentElement.lang === 'tr';

  const COPY = {
    en:{ console:'ACID CONSOLE', sub:'ONE CLOCK / BASS + RHYTHM', play:'PLAY BASS + RHYTHM', stop:'STOP ALL', master:'MASTER', bass:'303', rhythm:'RHYTHM', swing:'SWING', pump:'PUMP', mute:'MUTE', rhythmLabel:'RHYTHM / 16 STEP', engine:'SHARED AUDIO ENGINE' },
    tr:{ console:'ACID CONSOLE', sub:'TEK CLOCK / BASS + RİTİM', play:'303 + RİTMİ ÇAL', stop:'TÜMÜNÜ DURDUR', master:'MASTER', bass:'303', rhythm:'RİTİM', swing:'SWING', pump:'PUMP', mute:'KIS', rhythmLabel:'RİTİM / 16 ADIM', engine:'ORTAK SES MOTORU' }
  };
  const t = k => COPY[isTR() ? 'tr' : 'en'][k] || COPY.en[k] || k;

  const settings = { master:88, bass:80, rhythm:80, swing:0, pump:28, bassMute:false, rhythmMute:false };
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (_) {}
  ['master','bass','rhythm','swing','pump'].forEach(k => settings[k] = clamp(Number(settings[k]) || 0, 0, 100));
  settings.bassMute = !!settings.bassMute;
  settings.rhythmMute = !!settings.rhythmMute;

  const engine = {
    ctx:null, state:'stopped', timer:null, generation:0,
    step:0, absoluteStep:0, nextAt:0, continuationUntil:-1,
    bassOn:false, drumsOn:false, drumPending:false,
    master:null, bassPart:null, drumPart:null, pumpGain:null, comp:null,
    bassInput:null, bassDry:null, drivePre:null, shaper:null, driveWet:null,
    delaySend:null, delay:null, feedback:null, delayWet:null,
    noise:null, bassSources:new Set(), drumSources:new Set(), openHatGains:new Set()
  };

  function saveSettings(){ localStorage.setItem(STORE, JSON.stringify(settings)); }
  function knob(id, fallback=0){ const v=Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow')); return clamp(Number.isFinite(v)?v:fallback,0,100)/100; }
  function bpm(){ return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow')) || 128, 50, 250); }
  function tune(){ const v=Number($('#tuneKnobControl')?.getAttribute('aria-valuenow')); return clamp(Number.isFinite(v)?v:Number(localStorage.getItem('303box-tune-semitones-v1'))||0,-12,12); }
  function baseStepDur(){ return (60 / bpm()) / 4; }
  function stepDur(step){ const b=baseStepDur(); const amount=(settings.swing/100)*0.28; return b * (step%2===0 ? 1+amount : 1-amount); }

  function readBassStep(i){
    const input=$$('.note-input')[i];
    return {
      note:input?.value?.trim().toUpperCase()||'',
      baseOctave:Number(input?.dataset?.baseOctave||0)?12:0,
      octave:$$('.octave-cell')[i]?.textContent.trim().toUpperCase()||'',
      expr:$$('.accentSlide-cell')[i]?.textContent.trim().toUpperCase()||'',
      gate:$$('.gate-cell')[i]?.textContent.trim()||''
    };
  }
  function playable(x){ return !!x.note && x.gate !== '-'; }
  function freqFor(x){
    const m=NOTE_MIDI[x.note]; if(m==null)return null;
    let semi=x.baseOctave+tune();
    if(x.octave==='D')semi-=12; if(x.octave==='U')semi+=12;
    return 440*Math.pow(2,((m+semi)-69)/12);
  }
  function waveform(){ return $('#waveSaw')?.classList.contains('selected')?'sawtooth':'square'; }
  function connects(current,next){ return playable(current)&&playable(next)&&(current.gate==='○'||current.expr.includes('S')); }
  function legatoSegment(start){
    const out=[start]; let idx=start;
    for(let g=0;g<15;g++){
      const n=(idx+1)%16;
      if(!connects(readBassStep(idx),readBassStep(n)))break;
      out.push(n); idx=n;
    }
    return out;
  }

  function softCurve(drive=2.2){
    const n=1024,a=new Float32Array(n),norm=Math.tanh(drive);
    for(let i=0;i<n;i++){ const x=i*2/(n-1)-1; a[i]=Math.tanh(x*drive)/norm; }
    return a;
  }

  function cleanOsc(ctx,type='sine'){
    const o=ctx.createOscillator(); o.type=type;
    try{o.detune.setValueAtTime(0,ctx.currentTime)}catch(_){try{o.detune.value=0}catch(__){}}
    return o;
  }

  async function ensureAudio(){
    if(engine.ctx && engine.ctx.state!=='closed'){
      if(engine.ctx.state==='suspended')await engine.ctx.resume();
      updateMix(true); updateFx(true); return engine.ctx;
    }
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return null;
    const ctx=new AC();
    if(ctx.state==='suspended')await ctx.resume();

    const master=ctx.createGain(),comp=ctx.createDynamicsCompressor();
    const bassPart=ctx.createGain(),pumpGain=ctx.createGain(),drumPart=ctx.createGain();
    const bassInput=ctx.createGain(),bassDry=ctx.createGain();
    const drivePre=ctx.createGain(),shaper=ctx.createWaveShaper(),driveWet=ctx.createGain();
    const delaySend=ctx.createGain(),delay=ctx.createDelay(2),feedback=ctx.createGain(),delayWet=ctx.createGain();

    shaper.curve=softCurve(2.25); shaper.oversample='2x';
    bassInput.connect(bassDry); bassDry.connect(bassPart);
    bassInput.connect(drivePre); drivePre.connect(shaper); shaper.connect(driveWet); driveWet.connect(bassPart);
    bassInput.connect(delaySend); delaySend.connect(delay); delay.connect(delayWet); delayWet.connect(bassPart); delay.connect(feedback); feedback.connect(delay);
    bassPart.connect(pumpGain); pumpGain.connect(master);
    drumPart.connect(master);
    master.connect(comp);
    comp.threshold.value=-7; comp.knee.value=9; comp.ratio.value=2.8; comp.attack.value=.003; comp.release.value=.16;
    comp.connect(ctx.destination);

    const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const nd=noise.getChannelData(0); for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;

    Object.assign(engine,{ctx,master,comp,bassPart,pumpGain,drumPart,bassInput,bassDry,drivePre,shaper,driveWet,delaySend,delay,feedback,delayWet,noise});
    updateMix(true); updateFx(true);
    return ctx;
  }

  function updateMix(immediate=false){
    if(!engine.ctx)return;
    const now=engine.ctx.currentTime,tc=immediate?.001:.02;
    const set=(p,v)=>{try{p.setTargetAtTime(v,now,tc)}catch(_){p.value=v}};
    set(engine.master.gain,settings.master/100);
    set(engine.bassPart.gain,settings.bassMute?0:settings.bass/100);
    set(engine.drumPart.gain,settings.rhythmMute?0:settings.rhythm/100);
    if(engine.pumpGain.gain.value<.01)engine.pumpGain.gain.value=1;
  }

  function updateFx(immediate=false){
    if(!engine.ctx)return;
    const now=engine.ctx.currentTime,tc=immediate?.001:.025;
    const dist=knob('distortion',0),del=knob('delay',0);
    const set=(p,v)=>{try{p.setTargetAtTime(v,now,tc)}catch(_){p.value=v}};
    set(engine.bassDry.gain,1-dist*.22);
    set(engine.drivePre.gain,1+dist*7.5);
    set(engine.driveWet.gain,dist*.52);
    set(engine.delaySend.gain,del*.48);
    set(engine.delayWet.gain,.66);
    set(engine.feedback.gain,del<.002?0:.12+del*.42);
    try{engine.delay.delayTime.setTargetAtTime(clamp(baseStepDur()*3,.11,.72),now,.02)}catch(_){}
  }

  function filterShape(accented){
    const cutoff=knob('cutoff',38),res=knob('resonance',78),env=knob('envMod',64),dec=knob('decay',34),acc=knob('accent',70);
    const base=90+Math.pow(cutoff,.82)*2100;
    const peak=base+260+Math.pow(env,1.15)*3600+(accented?520+acc*1250:0);
    return{base,peak,res,dec,acc};
  }

  function scheduleBassSegment(start,when){
    const first=readBassStep(start); if(!playable(first))return 1;
    const f0=freqFor(first); if(!f0)return 1;
    const seg=legatoSegment(start),ctx=engine.ctx;
    const osc=cleanOsc(ctx,waveform()),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
    osc.frequency.setValueAtTime(f0,when);
    filter.type='lowpass';
    const fs=filterShape(first.expr.includes('A'));
    filter.Q.setValueAtTime(1.1+fs.res*17.5,when);
    const ny=Math.max(600,ctx.sampleRate*.46);
    filter.frequency.setValueAtTime(Math.min(ny,fs.peak),when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(70,fs.base),when+Math.min(stepDur(start)*.92,.045+fs.dec*.31));
    const normal=.14,startVol=normal+(first.expr.includes('A')?.045+fs.acc*.07:0);
    amp.gain.setValueAtTime(.0001,when); amp.gain.exponentialRampToValueAtTime(startVol,when+.007);
    if(first.expr.includes('A'))amp.gain.setTargetAtTime(normal,when+.05,.022);

    let offset=0;
    for(let pos=0;pos<seg.length;pos++){
      const idx=seg[pos],cur=readBassStep(idx),dur=stepDur(idx),at=when+offset;
      if(pos>0){
        const sh=filterShape(cur.expr.includes('A'));
        if(cur.expr.includes('A')){
          amp.gain.setTargetAtTime(normal+.045+sh.acc*.07,at,.006); amp.gain.setTargetAtTime(normal,at+.055,.024);
          filter.frequency.setValueAtTime(Math.max(70,sh.base),at);
          filter.frequency.exponentialRampToValueAtTime(Math.min(ny,sh.peak),at+.01);
          filter.frequency.exponentialRampToValueAtTime(Math.max(70,sh.base),at+Math.min(dur*.72,.095));
        }
      }
      if(pos<seg.length-1){
        const next=readBassStep(seg[pos+1]),nf=freqFor(next),cf=freqFor(cur),boundary=at+dur;
        if(nf&&cf){
          if(cur.expr.includes('S')){
            const glide=clamp(dur*.52,.04,.085);
            osc.frequency.setValueAtTime(cf,boundary);
            osc.frequency.exponentialRampToValueAtTime(nf,boundary+glide);
          }else osc.frequency.setValueAtTime(nf,boundary);
        }
      }
      offset+=dur;
    }
    const end=when+offset,release=knob('decay',34);
    const detached=seg.length===1;
    const releaseAt=detached?when+stepDur(start)*(first.gate==='○'?.92:.64):end-Math.min(.018,stepDur(seg[seg.length-1])*.1);
    amp.gain.setTargetAtTime(.0001,Math.max(when+.015,releaseAt),.03+release*.085);

    osc.connect(filter); filter.connect(amp); amp.connect(engine.bassInput);
    osc.start(when); osc.stop(Math.max(end,releaseAt)+.32);
    engine.bassSources.add(osc); osc.addEventListener('ended',()=>engine.bassSources.delete(osc),{once:true});
    return seg.length;
  }

  function noiseSource(){ const s=engine.ctx.createBufferSource(); s.buffer=engine.noise; return s; }
  function env(param,when,peak,dur,attack=.0015){ param.setValueAtTime(.0001,when); param.exponentialRampToValueAtTime(Math.max(.001,peak),when+attack); param.exponentialRampToValueAtTime(.0001,when+dur); }
  function drumOut(level){ const g=engine.ctx.createGain(); g.gain.value=level; g.connect(engine.drumPart); return g; }
  function partLevel(id){ return clamp(Number($(`[data-level="${id}"]`)?.value)||80,0,100)/100; }
  function voiceFor(id){ const fixed={bd:'909bd',sd:'606sd',ch:'606ch',oh:'606oh'}; return fixed[id]||$(`[data-variant="${id}"]`)?.value||(id==='cp'?'808clap':'808lowTom'); }

  function kick909(when,level){
    const c=engine.ctx,dst=drumOut(level*.92);
    const body=cleanOsc(c,'sine'),harm=cleanOsc(c,'triangle'),bg=c.createGain(),hg=c.createGain();
    body.frequency.setValueAtTime(168,when); body.frequency.exponentialRampToValueAtTime(54,when+.075); body.frequency.exponentialRampToValueAtTime(46,when+.34);
    harm.frequency.setValueAtTime(92,when); harm.frequency.exponentialRampToValueAtTime(48,when+.12);
    env(bg.gain,when,1,.42,.001); env(hg.gain,when,.15,.14,.001);
    body.connect(bg);harm.connect(hg);bg.connect(dst);hg.connect(dst); body.start(when);harm.start(when);body.stop(when+.46);harm.stop(when+.2);
    const n=noiseSource(),hp=c.createBiquadFilter(),ng=c.createGain(); hp.type='highpass';hp.frequency.value=3000; env(ng.gain,when,.13,.018,.0007);n.connect(hp);hp.connect(ng);ng.connect(dst);n.start(when);n.stop(when+.025);
    duckBass(when);
  }
  function snare606(when,level){
    const c=engine.ctx,dst=drumOut(level*.82);
    const n=noiseSource(),hp=c.createBiquadFilter(),bp=c.createBiquadFilter(),ng=c.createGain(); hp.type='highpass';hp.frequency.value=1700;bp.type='bandpass';bp.frequency.value=4700;bp.Q.value=.58;env(ng.gain,when,.74,.16,.001);n.connect(hp);hp.connect(bp);bp.connect(ng);ng.connect(dst);n.start(when);n.stop(when+.19);
    [[176,.22,.12],[324,.13,.075]].forEach(([f,p,d])=>{const o=cleanOsc(c,'triangle'),g=c.createGain();o.frequency.value=f;env(g.gain,when,p,d,.001);o.connect(g);g.connect(dst);o.start(when);o.stop(when+d+.025)});
  }
  function clap808(when,level){
    const c=engine.ctx,dst=drumOut(level*.78),n=noiseSource(),bp=c.createBiquadFilter(),hp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.value=1450;bp.Q.value=.72;hp.type='highpass';hp.frequency.value=620;g.gain.setValueAtTime(.0001,when);[[0,.9],[.012,.02],[.026,.72],[.042,.02],[.057,.56],[.08,.02],[.095,.36]].forEach(([d,v])=>g.gain.setValueAtTime(v,when+d));g.gain.exponentialRampToValueAtTime(.0001,when+.31);n.connect(bp);bp.connect(hp);hp.connect(g);g.connect(dst);n.start(when);n.stop(when+.34);
  }
  function tom808(when,level){
    const c=engine.ctx,dst=drumOut(level*.78),o=cleanOsc(c,'sine'),g=c.createGain();o.frequency.setValueAtTime(150,when);o.frequency.exponentialRampToValueAtTime(78,when+.19);env(g.gain,when,.88,.39,.0015);o.connect(g);g.connect(dst);o.start(when);o.stop(when+.43);
  }
  function tom606(when,level,high){
    const c=engine.ctx,dst=drumOut(level*.74),o=cleanOsc(c,'triangle'),g=c.createGain(),n=noiseSource(),bp=c.createBiquadFilter(),ng=c.createGain();o.frequency.setValueAtTime(high?275:190,when);o.frequency.exponentialRampToValueAtTime(high?168:110,when+.14);env(g.gain,when,.7,high?.22:.28,.001);o.connect(g);g.connect(dst);o.start(when);o.stop(when+.31);bp.type='bandpass';bp.frequency.value=high?1900:1250;bp.Q.value=1;env(ng.gain,when,.13,.09,.001);n.connect(bp);bp.connect(ng);ng.connect(dst);n.start(when);n.stop(when+.11);
  }
  function noiseTom(when,level){
    const c=engine.ctx,dst=drumOut(level*.72),n=noiseSource(),bp=c.createBiquadFilter(),g=c.createGain();bp.type='bandpass';bp.frequency.setValueAtTime(850,when);bp.frequency.exponentialRampToValueAtTime(390,when+.22);bp.Q.value=2.8;env(g.gain,when,.72,.26,.001);n.connect(bp);bp.connect(g);g.connect(dst);n.start(when);n.stop(when+.3);
  }
  function hat606(when,level,open){
    const c=engine.ctx,dst=drumOut(level*(open?.43:.34)),mix=c.createGain(),hp=c.createBiquadFilter(),bp=c.createBiquadFilter(),g=c.createGain();hp.type='highpass';hp.frequency.value=5600;bp.type='bandpass';bp.frequency.value=9200;bp.Q.value=.72;const dur=open?.31:.052;env(g.gain,when,.74,dur,.0008);mix.connect(hp);hp.connect(bp);bp.connect(g);g.connect(dst);
    if(!open){engine.openHatGains.forEach(og=>{try{og.gain.cancelScheduledValues(when);og.gain.setTargetAtTime(.0001,when,.008)}catch(_){}});engine.openHatGains.clear();}
    else{engine.openHatGains.add(g);setTimeout(()=>engine.openHatGains.delete(g),420)}
    [302,447,612,778,996,1241].forEach(f=>{const o=cleanOsc(c,'square');o.frequency.value=f;o.connect(mix);o.start(when);o.stop(when+dur+.04);engine.drumSources.add(o);o.addEventListener('ended',()=>engine.drumSources.delete(o),{once:true})});
  }
  function playDrum(id,when){
    const level=partLevel(id); if(level<=.001)return;
    const voice=voiceFor(id);
    if(id==='bd')kick909(when,level); else if(id==='sd')snare606(when,level); else if(id==='ch')hat606(when,level,false); else if(id==='oh')hat606(when,level,true);
    else if(id==='cp'){ if(voice==='noiseTom')noiseTom(when,level); else if(voice==='606highTom')tom606(when,level,true); else clap808(when,level); }
    else if(id==='tm'){ if(voice==='606lowTom')tom606(when,level,false); else tom808(when,level); }
  }

  function duckBass(when){
    if(!engine.pumpGain||settings.pump<=0||settings.bassMute)return;
    const depth=(settings.pump/100)*.82,low=Math.max(.12,1-depth),release=clamp(baseStepDur()*1.5,.08,.24),g=engine.pumpGain.gain;
    try{g.cancelScheduledValues(when);g.setValueAtTime(1,when);g.linearRampToValueAtTime(low,when+.006);g.exponentialRampToValueAtTime(1,when+release)}catch(_){}
  }

  function drumActive(id,step){ return $(`[data-drum="${id}"][data-step="${step}"]`)?.classList.contains('on'); }
  function scheduleVisual(step,when,generation){
    const delay=Math.max(0,(when-engine.ctx.currentTime)*1000);
    setTimeout(()=>{
      if(engine.state!=='playing'||generation!==engine.generation)return;
      $$('[data-playing="true"]').forEach(x=>x.removeAttribute('data-playing'));
      $(`[data-step-header="${step}"]`)?.setAttribute('data-playing','true');
      $$(`[data-step="${step}"]`).forEach(x=>x.closest('td')?.setAttribute('data-playing','true'));
      $$('.drum-step[data-current]').forEach(x=>x.removeAttribute('data-current'));
      $$(`#drums [data-step="${step}"]`).forEach(x=>x.setAttribute('data-current','true'));
    },delay);
  }

  function scheduler(generation){
    if(engine.state!=='playing'||!engine.ctx||generation!==engine.generation)return;
    updateFx(false); updateMix(false);
    while(engine.nextAt<engine.ctx.currentTime+.12){
      const step=engine.step,abs=engine.absoluteStep,when=engine.nextAt;
      if(engine.drumPending&&step===0){engine.drumsOn=true;engine.drumPending=false;updateUi()}
      if(engine.bassOn&&abs>engine.continuationUntil){
        const d=readBassStep(step); if(playable(d)){const len=scheduleBassSegment(step,when);engine.continuationUntil=abs+Math.max(1,len)-1;}
      }
      if(engine.drumsOn){['bd','sd','cp','tm','ch','oh'].forEach(id=>{if(drumActive(id,step))playDrum(id,when)});}
      scheduleVisual(step,when,generation);
      engine.nextAt+=stepDur(step); engine.step=(step+1)%16; engine.absoluteStep++;
    }
    engine.timer=setTimeout(()=>scheduler(generation),20);
  }

  async function startClock({bass=true,drums=true}={}){
    if(engine.state==='playing'){
      engine.bassOn=bass||engine.bassOn; engine.drumsOn=drums||engine.drumsOn; updateUi(); return;
    }
    if(engine.state!=='stopped')return;
    const generation=++engine.generation; engine.state='starting';
    const c=await ensureAudio(); if(!c||generation!==engine.generation)return;
    engine.bassOn=bass;engine.drumsOn=drums;engine.drumPending=false;engine.step=0;engine.absoluteStep=0;engine.continuationUntil=-1;engine.nextAt=c.currentTime+.07;engine.state='playing';updateUi();scheduler(generation);
  }
  function stopAll(){
    if(engine.state==='stopped')return;
    ++engine.generation;clearTimeout(engine.timer);engine.timer=null;engine.state='stopped';engine.bassOn=false;engine.drumsOn=false;engine.drumPending=false;engine.continuationUntil=-1;
    engine.bassSources.forEach(s=>{try{s.stop()}catch(_){}});engine.drumSources.forEach(s=>{try{s.stop()}catch(_){}});engine.bassSources.clear();engine.drumSources.clear();engine.openHatGains.clear();
    $$('[data-playing="true"]').forEach(x=>x.removeAttribute('data-playing'));$$('.drum-step[data-current]').forEach(x=>x.removeAttribute('data-current'));updateUi();
  }
  function stopBassVoices(){engine.bassSources.forEach(s=>{try{s.stop()}catch(_){}});engine.bassSources.clear();engine.continuationUntil=-1;}
  function toggleBass(){
    if(engine.state==='playing'){
      engine.bassOn=!engine.bassOn;if(!engine.bassOn)stopBassVoices();if(!engine.bassOn&&!engine.drumsOn&&!engine.drumPending)stopAll();else updateUi();
    }else startClock({bass:true,drums:false});
  }
  function toggleDrums(){
    if(engine.state==='playing'){
      if(engine.drumsOn||engine.drumPending){engine.drumsOn=false;engine.drumPending=false;if(!engine.bassOn)stopAll();else updateUi();return;}
      if($('#drumSync')?.checked&&engine.bassOn&&engine.step!==0){engine.drumPending=true;updateUi();return;}
      engine.drumsOn=true;updateUi();
    }else startClock({bass:false,drums:true});
  }
  function toggleAll(){
    if(engine.state==='playing'&&engine.bassOn&&engine.drumsOn)return stopAll();
    if(engine.state==='playing'){engine.bassOn=true;engine.drumsOn=true;engine.drumPending=false;updateUi();return;}
    startClock({bass:true,drums:true});
  }

  function setRange(id,key){
    const el=$(`#${id}`); if(!el)return;
    el.value=String(settings[key]); const out=el.closest('.acid-console-cell')?.querySelector('output'); if(out)out.textContent=`${settings[key]}%`;
    el.addEventListener('input',()=>{settings[key]=clamp(Number(el.value)||0,0,100);if(out)out.textContent=`${settings[key]}%`;saveSettings();updateMix(false)});
  }
  function setMute(id,key){
    const b=$(`#${id}`);if(!b)return;
    const render=()=>b.setAttribute('aria-pressed',String(settings[key]));render();
    b.addEventListener('click',()=>{settings[key]=!settings[key];render();saveSettings();updateMix(false)});
  }

  function consoleHtml(){
    return `<section class="acid-console" id="acidConsole" data-html2canvas-ignore="true">
      <div class="acid-console-head"><span>${t('console')}</span><small>${t('sub')}</small></div>
      <div class="acid-console-grid">
        <div class="acid-console-cell acid-console-play-cell"><button type="button" class="acid-master-play" id="acidPlayAll">${t('play')}</button></div>
        <div class="acid-console-cell"><label>${t('master')}<output>${settings.master}%</output></label><input id="consoleMaster" type="range" min="0" max="100" value="${settings.master}"></div>
        <div class="acid-console-cell"><label>${t('bass')}<output>${settings.bass}%</output></label><div class="acid-part-row"><input id="consoleBass" type="range" min="0" max="100" value="${settings.bass}"><button class="acid-mute" id="consoleBassMute" type="button">${t('mute')}</button></div></div>
        <div class="acid-console-cell"><label>${t('rhythm')}<output>${settings.rhythm}%</output></label><div class="acid-part-row"><input id="consoleRhythm" type="range" min="0" max="100" value="${settings.rhythm}"><button class="acid-mute" id="consoleRhythmMute" type="button">${t('mute')}</button></div></div>
        <div class="acid-console-cell acid-swing-cell"><label class="acid-console-label">${t('swing')}<output>${settings.swing}%</output></label><input id="consoleSwing" type="range" min="0" max="60" value="${settings.swing}"></div>
        <div class="acid-console-cell acid-pump-cell"><label class="acid-console-label">${t('pump')}<output>${settings.pump}%</output></label><input id="consolePump" type="range" min="0" max="100" value="${settings.pump}"></div>
      </div>
    </section>`;
  }

  function mountConsole(){
    const workspace=$('.workspace.shell');if(!workspace)return false;
    workspace.classList.add('acid-workstation');
    if(!$('#acidConsole'))workspace.insertAdjacentHTML('afterbegin',consoleHtml());
    setRange('consoleMaster','master');setRange('consoleBass','bass');setRange('consoleRhythm','rhythm');setRange('consoleSwing','swing');setRange('consolePump','pump');setMute('consoleBassMute','bassMute');setMute('consoleRhythmMute','rhythmMute');
    $('#acidPlayAll')?.addEventListener('click',toggleAll);
    return true;
  }

  function integrateRhythm(){
    const workspace=$('.workspace.shell'),drums=$('#drums');if(!workspace||!drums)return false;
    drums.classList.add('integrated-rhythm');drums.classList.remove('shell');
    const controls=$('.pattern-control-panel');
    if(drums.parentElement!==workspace){(controls||workspace.lastElementChild)?.insertAdjacentElement('afterend',drums)}
    if(!drums.querySelector('.integrated-rhythm-label')){
      const label=document.createElement('div');label.className='integrated-rhythm-label';label.innerHTML=`<strong>${t('rhythmLabel')}</strong><span>${t('engine')}</span>`;
      drums.querySelector('.drum-export-card')?.insertAdjacentElement('beforebegin',label);
    }
    // Existing mixer stays as a backend for legacy layers; set it neutral so the shared engine owns gain staging.
    ['mixBass','mixDrum'].forEach(id=>{const el=$(`#${id}`);if(el){el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}))}});
    return true;
  }

  function installNotePickers(){
    const inputs=$$('.note-input');if(!inputs.length)return false;
    $$('.note-picker,.note-picker-v2').forEach(x=>x.remove());
    let saved=[];try{const x=JSON.parse(localStorage.getItem('303box-note-base-octaves-v2')||'[]');if(Array.isArray(x))saved=x}catch(_){}
    const opts=[['','—'],['C','C'],['C#','C#'],['D','D'],['D#','D#'],['E','E'],['F','F'],['F#','F#'],['G','G'],['G#','G#'],['A','A'],['A#','A#'],['B','B'],['C+','C']];
    const persist=()=>localStorage.setItem('303box-note-base-octaves-v2',JSON.stringify($$('.note-input').map(x=>Number(x.dataset.baseOctave||0)?1:0)));
    inputs.forEach((input,i)=>{
      input.type='hidden';input.tabIndex=-1;input.classList.add('note-source-hidden');input.setAttribute('aria-hidden','true');
      if(saved[i]!=null)input.dataset.baseOctave=saved[i]?'1':'0';else if(!input.dataset.baseOctave)input.dataset.baseOctave='0';
      const s=document.createElement('select');s.className='cell-control note-picker-v2';s.setAttribute('aria-label',`${isTR()?'Nota':'Note'} ${i+1}`);opts.forEach(([v,l])=>s.appendChild(new Option(l,v)));s.value=input.dataset.baseOctave==='1'&&input.value==='C'?'C+':(input.value||'');input.after(s);
      s.addEventListener('change',()=>{if(s.value==='C+'){input.value='C';input.dataset.baseOctave='1'}else{input.value=s.value;input.dataset.baseOctave='0'}input.dispatchEvent(new Event('input',{bubbles:true}));persist()});
    });return true;
  }

  function updateUi(){
    const bass=$('#playButton'),drum=$('#drumPlay'),all=$('#acidPlayAll');
    if(bass){bass.setAttribute('aria-pressed',String(engine.bassOn));$('#playLed')?.classList.toggle('on',engine.bassOn);const l=$('#playLabel');if(l)l.textContent=engine.bassOn?(isTR()?'DUR':'STOP'):(isTR()?'ÇAL':'PLAY')}
    if(drum){drum.classList.toggle('playing',engine.drumsOn);drum.classList.toggle('armed',engine.drumPending);const l=drum.querySelector('span');if(l)l.textContent=engine.drumPending?(isTR()?'1. ADIM BEKLENİYOR':'WAITING FOR STEP 1'):engine.drumsOn?(isTR()?'DUR':'STOP'):(isTR()?'ÇAL':'PLAY')}
    if(all){const on=engine.state==='playing'&&engine.bassOn&&engine.drumsOn;all.dataset.playing=String(on);all.textContent=on?t('stop'):t('play')}
  }

  function previewDrum(button){ ensureAudio().then(c=>{if(c)playDrum(button.dataset.preview,c.currentTime+.012)}); }

  function installOwnership(){
    // Window capture runs before the older document-level preview engines.
    window.addEventListener('click',e=>{
      const bass=e.target.closest?.('#playButton');if(bass){e.preventDefault();e.stopImmediatePropagation();toggleBass();return}
      const drum=e.target.closest?.('#drumPlay');if(drum){e.preventDefault();e.stopImmediatePropagation();toggleDrums();return}
      const preview=e.target.closest?.('#drums [data-preview]');if(preview){e.preventDefault();e.stopImmediatePropagation();previewDrum(preview);return}
    },true);
    window.addEventListener('keydown',e=>{
      if(e.code!=='Space')return;
      if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
      if(e.shiftKey)toggleDrums();else toggleAll();
    },true);
    document.addEventListener('click',e=>{if(e.target.closest?.('#clearButton')&&engine.bassOn){engine.bassOn=false;stopBassVoices();if(!engine.drumsOn)stopAll();else updateUi()}if(e.target.closest?.('#drumClear')&&engine.drumsOn){/* grid clears while clock may keep running */}},true);
    window.addEventListener('303box:fxchange',()=>updateFx(false));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&engine.ctx?.state==='suspended')engine.ctx.resume().catch(()=>{})});
  }

  function rewriteShortcutCopy(){
    const observer=new MutationObserver(()=>{
      $$('#shortcutDialog li, #shortcutDialog [class*="shortcut"], [data-shortcut-row]').forEach(el=>{
        const text=el.textContent||'';
        if(/Play \/ stop 303$/i.test(text))el.textContent=text.replace(/Play \/ stop 303/i,'Play / stop 303 + rhythm');
        if(/303 çal \/ durdur$/i.test(text))el.textContent=text.replace(/303 çal \/ durdur/i,'303 + ritmi çal / durdur');
      });
    });observer.observe(document.body,{childList:true,subtree:true});
  }

  function settle(){
    mountConsole();integrateRhythm();installNotePickers();updateUi();
    [250,600,1100,1800].forEach(ms=>setTimeout(()=>{mountConsole();integrateRhythm();updateUi()},ms));
  }

  function init(){
    if(window.__303boxUnifiedEngine?.version==='1340')return;
    installOwnership();rewriteShortcutCopy();
    window.__303boxUnifiedEngine={version:'1340',toggleAll,toggleBass,toggleDrums,stopAll,get state(){return engine.state},get bassOn(){return engine.bassOn},get drumsOn(){return engine.drumsOn}};
    if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
    window.addEventListener('load',()=>setTimeout(settle,180));
  }
  init();
})();
