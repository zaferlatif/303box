(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let canvas=null,g=null,mode='scope',sourceMode='synth',lastStep=-1,stepStart=performance.now(),displayHz=0,frame=0;
  let hwStream=null,hwCtx=null,hwSource=null,hwAnalyser=null,hwTime=null,hwFreq=null,hwHz=0;

  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const tune=()=>clamp(Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'))||0,-12,12);
  const knob=(id,fallback=0)=>{const v=Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow'));return Number.isFinite(v)?v:fallback};
  const wave=()=>$('#waveSaw')?.classList.contains('selected')?'saw':'square';

  function readStep(i){
    if(i<0||i>15)return null;
    const sheet=$('#patternSheet');if(!sheet)return null;
    const n=$$('.note-input',sheet)[i];
    return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('.octave-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',expr:$$('.accentSlide-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',gate:$$('.gate-cell',sheet)[i]?.textContent.trim()||''};
  }
  const playable=x=>!!x?.note&&x.gate!=='-';
  function freq(x){
    if(!playable(x))return 0;
    let m=NOTE_MIDI[x.note];if(m==null)return 0;m+=x.base+tune();if(x.oct==='D')m-=12;if(x.oct==='U')m+=12;
    return 440*Math.pow(2,(m-69)/12);
  }
  function activeStep(){const h=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(h?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:-1}
  function currentFrequency(i){
    const cur=readStep(i),to=freq(cur);if(!to)return 0;
    const prev=readStep((i+15)%16),from=freq(prev);
    if(from&&prev?.expr?.includes('S')){
      const dur=(60/bpm())/4,glide=clamp(dur*.52,.04,.09),elapsed=(performance.now()-stepStart)/1000;
      if(elapsed<glide){const p=clamp(elapsed/glide,0,1);return from*Math.pow(to/from,p)}
    }
    return to;
  }
  function noteName(hz){if(!hz||!Number.isFinite(hz))return'--';const m=Math.round(69+12*Math.log2(hz/440));return `${NAMES[(m%12+12)%12]}${Math.floor(m/12)-1}`}

  function installCanvas(){
    const old=$('#bassOnlyScope');
    if(old){old.id='bassOnlyScopeLegacy';old.remove();}
    canvas=$('#bassLiveScope');
    if(!canvas){
      const panel=$('.scope-panel');if(!panel)return false;
      canvas=document.createElement('canvas');canvas.id='bassLiveScope';canvas.setAttribute('aria-label','Live 303 and hardware oscilloscope');
      const tabs=$('.mini-tabs',panel);tabs?.before(canvas);
    }
    if(!g)g=canvas.getContext('2d');
    return !!g;
  }
  function resize(){
    const r=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h};
  }
  function background(w,h){
    const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#090d09');grad.addColorStop(1,'#040704');g.fillStyle=grad;g.fillRect(0,0,w,h);g.lineWidth=1;
    for(let i=1;i<10;i++){g.strokeStyle=i===5?'rgba(217,255,47,.17)':'rgba(217,255,47,.052)';const x=w*i/10;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
    for(let i=1;i<4;i++){g.strokeStyle=i===2?'rgba(217,255,47,.19)':'rgba(217,255,47,.06)';const y=h*i/4;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
  }
  function drawSamples(w,h,samples){
    if(!samples?.length)return;
    let peak=.001;for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
    const scale=Math.min(1.2,.78/peak),amp=h*.43;
    g.save();g.shadowColor='rgba(217,255,47,.62)';g.shadowBlur=Math.max(4,w/150);g.strokeStyle='#d9ff2f';g.lineWidth=Math.max(1.35,w/480);g.beginPath();
    for(let x=0;x<w;x++){
      const i=Math.min(samples.length-1,Math.floor(x*(samples.length-1)/Math.max(1,w-1))),y=h*.5-samples[i]*scale*amp;
      if(x===0)g.moveTo(x,y);else g.lineTo(x,y);
    }
    g.stroke();g.restore();
  }

  function filterGain(f,cut,res){
    const lp=1/Math.sqrt(1+Math.pow(f/Math.max(55,cut),6));
    const dist=Math.abs(Math.log2(Math.max(1,f)/Math.max(1,cut)));
    return clamp(lp*(1+res*3.0*Math.exp(-(dist*dist)/.035)),0,3.2);
  }
  function modeledParams(step){
    const cutoff=clamp(knob('cutoff',38)/100,0,1),res=clamp(knob('resonance',78)/100,0,1),env=clamp(knob('envMod',64)/100,0,1),dec=clamp(knob('decay',34)/100,0,1),acc=clamp(knob('accent',70)/100,0,1),dist=clamp(knob('distortion',0)/100,0,1);
    const elapsed=Math.max(0,(performance.now()-stepStart)/1000),tau=.045+dec*.28,e=Math.exp(-elapsed/tau),accented=readStep(step)?.expr?.includes('A');
    const base=90+Math.pow(cutoff,.82)*2100,cut=base+(260+Math.pow(env,1.15)*3600+(accented?520+acc*1250:0))*e;
    return{cut,res,dist};
  }
  function modeledSamples(hz,type,step,count=900){
    const p=modeledParams(step),windowSec=.014,cycles=hz*windowSec,harms=Math.min(56,Math.max(6,Math.floor(12000/Math.max(35,hz)))),out=new Float32Array(count);
    let norm=0;
    for(let n=1;n<=harms;n++){
      if(type==='square'&&n%2===0)continue;
      const a=(1/n)*filterGain(hz*n,p.cut,p.res);norm+=Math.abs(a);
      const phaseShift=-Math.atan((hz*n)/Math.max(80,p.cut))*1.25;
      for(let i=0;i<count;i++)out[i]+=a*Math.sin(2*Math.PI*n*((i/(count-1))*cycles)+phaseShift)*(type==='saw'?(n%2?-1:1):1);
    }
    norm=Math.max(.001,norm*.72);
    const drive=1+p.dist*6.5,den=Math.tanh(drive);
    for(let i=0;i<count;i++){let v=out[i]/norm;v=Math.tanh(v*drive)/den;out[i]=clamp(v,-1,1)}
    return out;
  }
  function modeledSpectrum(w,h,hz,type,step){
    const p=modeledParams(step),minF=30,maxF=12000,l0=Math.log(minF),span=Math.log(maxF)-l0,harms=Math.min(80,Math.floor(maxF/Math.max(35,hz)));
    g.save();g.shadowColor='rgba(217,255,47,.35)';g.shadowBlur=4;
    for(let n=1;n<=harms;n++){
      if(type==='square'&&n%2===0)continue;
      const f=hz*n,a=clamp((1/n)*filterGain(f,p.cut,p.res)*(1+p.dist*Math.min(2,n/6)),0,1),x=(Math.log(Math.max(minF,f))-l0)/span*w,bar=Math.max(1,a*h*.82);
      g.globalAlpha=.25+a*.75;g.fillStyle='#d9ff2f';g.fillRect(Math.max(0,x-1.5),h-bar,Math.max(2,w/360),bar);
    }
    g.restore();g.globalAlpha=1;
  }

  function estimatePitch(buf,sr){
    let mean=0;for(let i=0;i<buf.length;i++)mean+=buf[i];mean/=buf.length;
    let rms=0;for(let i=0;i<buf.length;i++){const v=buf[i]-mean;rms+=v*v}rms=Math.sqrt(rms/buf.length);if(rms<.006)return 0;
    const minLag=Math.max(2,Math.floor(sr/1600)),maxLag=Math.min(buf.length>>1,Math.floor(sr/35));let best=0,bestCorr=0;
    for(let lag=minLag;lag<=maxLag;lag++){
      let num=0,a2=0,b2=0;const end=buf.length-lag;
      for(let i=0;i<end;i+=2){const a=buf[i]-mean,b=buf[i+lag]-mean;num+=a*b;a2+=a*a;b2+=b*b}
      const corr=num/Math.sqrt(Math.max(1e-12,a2*b2));
      if(corr>bestCorr){bestCorr=corr;best=lag}
    }
    return bestCorr>.42&&best?sr/best:0;
  }
  function hardwareTrace(w,h){
    if(!hwAnalyser||!hwTime)return readout(0,'USB');
    hwAnalyser.getFloatTimeDomainData(hwTime);
    if(frame%6===0)hwHz=estimatePitch(hwTime,hwCtx.sampleRate);
    readout(hwHz,'USB');
    const windowSamples=Math.min(hwTime.length-2,Math.max(256,Math.floor(hwCtx.sampleRate*.014)));let start=32;
    for(let i=32;i<hwTime.length-windowSamples-1;i++){if(hwTime[i]<=0&&hwTime[i+1]>0){start=i;break}}
    drawSamples(w,h,hwTime.subarray(start,start+windowSamples));
  }
  function hardwareSpectrum(w,h){
    if(!hwAnalyser||!hwFreq)return;
    hwAnalyser.getFloatFrequencyData(hwFreq);const min=-105,max=-18;
    g.save();g.fillStyle='#d9ff2f';
    for(let x=0;x<w;x+=Math.max(2,Math.round(w/180))){const i=Math.floor((x/w)*(hwFreq.length*.46)),v=clamp((hwFreq[i]-min)/(max-min),0,1),bar=v*h*.86;g.globalAlpha=.2+v*.8;g.fillRect(x,h-bar,Math.max(2,w/220),bar)}
    g.restore();g.globalAlpha=1;
    if(frame%6===0){hwAnalyser.getFloatTimeDomainData(hwTime);hwHz=estimatePitch(hwTime,hwCtx.sampleRate)}readout(hwHz,'USB');
  }

  function readout(hz,source='SYNTH'){
    const note=$('#scopeNote'),value=$('#scopeHz'),src=$('#scopeSourceState');
    const n=hz?noteName(hz):'--',v=hz?`${Math.round(hz)} Hz`:'-- Hz';if(note)note.textContent=n;if(value)value.textContent=v;if(src)src.textContent=source;
  }
  function status(text,kind=''){const el=$('#scopeInputStatus');if(!el)return;el.textContent=text;el.dataset.kind=kind}
  function stopHardware(){
    try{hwStream?.getTracks().forEach(t=>t.stop())}catch(_){}try{hwSource?.disconnect()}catch(_){}try{hwCtx?.close()}catch(_){}
    hwStream=hwCtx=hwSource=hwAnalyser=hwTime=hwFreq=null;hwHz=0;
  }
  function rawAudioConstraints(deviceId){
    const c={echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:{ideal:2},sampleRate:{ideal:48000}};
    if(deviceId)c.deviceId={exact:deviceId};return c;
  }
  async function acquireHardware(deviceId=''){
    if(!navigator.mediaDevices?.getUserMedia){status('Audio input is not available in this browser.','bad');return false}
    status('Requesting audio input…','');
    try{
      let stream=await navigator.mediaDevices.getUserMedia({audio:rawAudioConstraints(deviceId),video:false});
      const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');
      const select=$('#scopeAudioInput');if(select){select.innerHTML=devices.map(d=>`<option value="${d.deviceId}">${d.label||'Audio input'}</option>`).join('')}
      const t8=devices.find(d=>/\bT-?8\b|AIRA/i.test(d.label));
      const current=stream.getAudioTracks()[0]?.getSettings?.().deviceId||'';
      if(!deviceId&&t8&&t8.deviceId&&t8.deviceId!==current){stream.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({audio:rawAudioConstraints(t8.deviceId),video:false})}
      stopHardware();hwStream=stream;
      const AC=window.AudioContext||window.webkitAudioContext;hwCtx=new AC();if(hwCtx.state==='suspended')await hwCtx.resume();
      hwSource=hwCtx.createMediaStreamSource(stream);hwAnalyser=hwCtx.createAnalyser();hwAnalyser.fftSize=4096;hwAnalyser.smoothingTimeConstant=.18;hwAnalyser.minDecibels=-105;hwAnalyser.maxDecibels=-18;hwSource.connect(hwAnalyser);
      hwTime=new Float32Array(hwAnalyser.fftSize);hwFreq=new Float32Array(hwAnalyser.frequencyBinCount);sourceMode='usb';
      const track=stream.getAudioTracks()[0],label=track?.label||t8?.label||'USB audio';if(select){const id=track?.getSettings?.().deviceId;if(id)select.value=id;select.hidden=devices.length<2}
      updateSourceButtons();status(/\bT-?8\b|AIRA/i.test(label)?`LIVE: ${label}`:`LIVE INPUT: ${label}`,'good');return true;
    }catch(err){stopHardware();sourceMode='synth';updateSourceButtons();status(err?.name==='NotAllowedError'?'Microphone / audio permission was denied.':'T-8 USB audio could not be opened. Set AIRA LINK to OFF and check the USB audio input.','bad');return false}
  }
  function updateSourceButtons(){
    $$('.scope-source-button').forEach(b=>b.classList.toggle('active',b.dataset.source===sourceMode));
  }
  function installControls(){
    const panel=$('.scope-panel');if(!panel||$('#scopeSourceControls'))return;
    const row=document.createElement('div');row.id='scopeSourceControls';row.className='scope-source-controls';row.innerHTML=`<div class="scope-source-buttons"><button type="button" class="scope-source-button active" data-source="synth">SYNTH</button><button type="button" class="scope-source-button" data-source="usb">T-8 USB</button></div><select id="scopeAudioInput" hidden aria-label="Oscilloscope audio input"></select><span id="scopeSourceState">SYNTH</span><small id="scopeInputStatus"></small>`;
    $('.mini-tabs',panel)?.after(row);
    row.addEventListener('click',e=>{const b=e.target.closest('.scope-source-button');if(!b)return;if(b.dataset.source==='synth'){sourceMode='synth';stopHardware();updateSourceButtons();status('Internal synth model','')}else acquireHardware()});
    $('#scopeAudioInput',row)?.addEventListener('change',e=>acquireHardware(e.target.value));
  }

  function render(){
    requestAnimationFrame(render);frame++;if(!installCanvas())return;const{w,h}=resize();background(w,h);
    if(sourceMode==='usb'){
      if(mode==='fft')hardwareSpectrum(w,h);else hardwareTrace(w,h);return;
    }
    const e=window.__303boxUnifiedEngine,step=activeStep();if(step!==lastStep){lastStep=step;stepStart=performance.now()}
    if(!e||e.state!=='playing'||!e.bassOn||step<0){displayHz*=.72;readout(0,'SYNTH');return}
    const hz=currentFrequency(step);if(!hz){readout(0,'SYNTH');return}
    if(!displayHz||Math.abs(hz-displayHz)/hz>.6)displayHz=hz;else displayHz+=(hz-displayHz)*.42;readout(displayHz,'SYNTH');
    if(mode==='fft')modeledSpectrum(w,h,displayHz,wave(),step);else drawSamples(w,h,modeledSamples(displayHz,wave(),step,Math.max(700,Math.floor(w*1.5))));
  }
  function init(){
    if(window.__303boxScopeLive?.version==='1830')return;
    installCanvas();installControls();
    $$('.scope-panel .analyzer-tab').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode==='fft'?'fft':'scope';$$('.scope-panel .analyzer-tab').forEach(x=>x.classList.toggle('active',x===btn))}));
    window.addEventListener('pagehide',stopHardware,{once:true});
    window.__303boxScopeLive={version:'1830',get mode(){return mode},get source(){return sourceMode},connectT8:acquireHardware,disconnectT8(){sourceMode='synth';stopHardware();updateSourceButtons()}};
    requestAnimationFrame(render);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
