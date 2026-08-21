(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const say=(en,tr)=>document.documentElement.lang==='tr'?tr:en;
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let canvas=null,g=null,mode='scope',sourceMode='synth',lastStep=-1,stepStart=performance.now(),displayHz=0,frame=0;
  let hwStream=null,hwCtx=null,hwSource=null,hwAnalyser=null,hwTime=null,hwFreq=null,hwHz=0,displayGain=1;

  const engine=()=>window.__303boxUnifiedEngine;
  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const tune=()=>clamp(Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'))||0,-12,12);
  const knob=(id,fallback=0)=>{const v=Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow'));return Number.isFinite(v)?v:fallback};
  const wave=()=>$('#waveSaw')?.classList.contains('selected')?'saw':'square';

  function readStep(i){
    if(i<0||i>15)return null;const sheet=$('#patternSheet');if(!sheet)return null;const n=$$('.note-input',sheet)[i];
    return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('.octave-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',expr:$$('.accentSlide-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',gate:$$('.gate-cell',sheet)[i]?.textContent.trim()||''};
  }
  const playable=x=>!!x?.note&&x.gate!=='-';
  function freq(x){if(!playable(x))return 0;let m=NOTE_MIDI[x.note];if(m==null)return 0;m+=x.base+tune();if(x.oct==='D')m-=12;if(x.oct==='U')m+=12;return 440*Math.pow(2,(m-69)/12)}
  function activeStep(){const h=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(h?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:-1}
  function currentFrequency(i){
    const cur=readStep(i),to=freq(cur);if(!to)return 0;const prev=readStep((i+15)%16),from=freq(prev);
    if(from&&prev?.expr?.includes('S')){const dur=(60/bpm())/4,glide=clamp(dur*.52,.04,.09),elapsed=(performance.now()-stepStart)/1000;if(elapsed<glide){const p=clamp(elapsed/glide,0,1);return from*Math.pow(to/from,p)}}
    return to;
  }
  function expectedFrequency(){const e=engine(),s=activeStep();return e?.state==='playing'&&e?.bassOn&&s>=0?currentFrequency(s):0}
  function noteName(hz){if(!hz||!Number.isFinite(hz))return'--';const m=Math.round(69+12*Math.log2(hz/440));return `${NAMES[(m%12+12)%12]}${Math.floor(m/12)-1}`}

  function installCanvas(){
    const legacy=$('#bassOnlyScope');if(legacy)legacy.remove();
    canvas=$('#bassLiveScope');
    if(!canvas){const panel=$('.scope-panel');if(!panel)return false;canvas=document.createElement('canvas');canvas.id='bassLiveScope';canvas.setAttribute('aria-label',say('Live 303 and hardware oscilloscope','Canlı 303 ve donanım osiloskobu'));$('.mini-tabs',panel)?.before(canvas)}
    if(!g)g=canvas.getContext('2d');return!!g;
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h}}
  function background(w,h){
    const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#0a0e0a');grad.addColorStop(1,'#050805');g.fillStyle=grad;g.fillRect(0,0,w,h);g.lineWidth=1;
    for(let i=1;i<10;i++){g.strokeStyle=i===5?'rgba(217,255,47,.18)':'rgba(217,255,47,.055)';const x=w*i/10;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
    for(let i=1;i<4;i++){g.strokeStyle=i===2?'rgba(217,255,47,.21)':'rgba(217,255,47,.065)';const y=h*i/4;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
  }

  function centeredStats(samples){
    let mean=0;for(let i=0;i<samples.length;i++)mean+=samples[i];mean/=Math.max(1,samples.length);
    let peak=.0001,rms=0;for(let i=0;i<samples.length;i++){const v=samples[i]-mean;peak=Math.max(peak,Math.abs(v));rms+=v*v}rms=Math.sqrt(rms/Math.max(1,samples.length));
    return{mean,peak,rms};
  }
  function drawSamples(w,h,samples){
    if(!samples?.length)return;const st=centeredStats(samples);const target=clamp(.78/Math.max(st.peak,st.rms*2.7,.004),.55,34);
    if(!Number.isFinite(displayGain)||displayGain<=0)displayGain=target;else displayGain=displayGain*.78+target*.22;
    const amp=h*.44;
    g.save();g.shadowColor='rgba(217,255,47,.72)';g.shadowBlur=Math.max(5,w/135);g.strokeStyle='#d9ff2f';g.lineWidth=Math.max(1.45,w/470);g.beginPath();
    for(let x=0;x<w;x++){const i=Math.min(samples.length-1,Math.floor(x*(samples.length-1)/Math.max(1,w-1))),v=clamp((samples[i]-st.mean)*displayGain,-1,1),y=h*.5-v*amp;if(x===0)g.moveTo(x,y);else g.lineTo(x,y)}
    g.stroke();g.restore();
  }

  function filterGain(f,cut,res){const lp=1/Math.sqrt(1+Math.pow(f/Math.max(55,cut),6));const dist=Math.abs(Math.log2(Math.max(1,f)/Math.max(1,cut)));return clamp(lp*(1+res*3*Math.exp(-(dist*dist)/.035)),0,3.2)}
  function modeledParams(step){
    const cutoff=clamp(knob('cutoff',38)/100,0,1),res=clamp(knob('resonance',78)/100,0,1),env=clamp(knob('envMod',64)/100,0,1),dec=clamp(knob('decay',34)/100,0,1),acc=clamp(knob('accent',70)/100,0,1),dist=clamp(knob('distortion',0)/100,0,1);
    const elapsed=Math.max(0,(performance.now()-stepStart)/1000),tau=.045+dec*.28,e=Math.exp(-elapsed/tau),accented=readStep(step)?.expr?.includes('A');
    const base=90+Math.pow(cutoff,.82)*2100,cut=base+(260+Math.pow(env,1.15)*3600+(accented?520+acc*1250:0))*e;return{cut,res,dist};
  }
  function modeledSamples(hz,type,step,count=1000){
    const p=modeledParams(step),windowSec=clamp(2.8/Math.max(45,hz),.006,.026),cycles=hz*windowSec,harms=Math.min(64,Math.max(6,Math.floor(12000/Math.max(35,hz)))),out=new Float32Array(count);let norm=0;
    for(let n=1;n<=harms;n++){if(type==='square'&&n%2===0)continue;const a=(1/n)*filterGain(hz*n,p.cut,p.res);norm+=Math.abs(a);const phase=-Math.atan((hz*n)/Math.max(80,p.cut))*1.15;for(let i=0;i<count;i++)out[i]+=a*Math.sin(2*Math.PI*n*((i/(count-1))*cycles)+phase)*(type==='saw'?(n%2?-1:1):1)}
    norm=Math.max(.001,norm*.72);const drive=1+p.dist*6.5,den=Math.tanh(drive);for(let i=0;i<count;i++){let v=out[i]/norm;v=Math.tanh(v*drive)/den;out[i]=clamp(v,-1,1)}return out;
  }
  function modeledSpectrum(w,h,hz,type,step){
    const p=modeledParams(step),minF=30,maxF=12000,l0=Math.log(minF),span=Math.log(maxF)-l0,harms=Math.min(90,Math.floor(maxF/Math.max(35,hz)));g.save();g.shadowColor='rgba(217,255,47,.36)';g.shadowBlur=4;
    for(let n=1;n<=harms;n++){if(type==='square'&&n%2===0)continue;const f=hz*n,a=clamp((1/n)*filterGain(f,p.cut,p.res)*(1+p.dist*Math.min(2,n/6)),0,1),x=(Math.log(Math.max(minF,f))-l0)/span*w,bar=Math.max(1,a*h*.84);g.globalAlpha=.25+a*.75;g.fillStyle='#d9ff2f';g.fillRect(Math.max(0,x-1.5),h-bar,Math.max(2,w/360),bar)}g.restore();g.globalAlpha=1;
  }

  function estimatePitch(buf,sr,expected=0){
    const st=centeredStats(buf);if(st.rms<.003)return 0;
    const minHz=38,maxHz=1800,minLag=Math.max(2,Math.floor(sr/maxHz)),maxLag=Math.min(buf.length>>1,Math.floor(sr/minHz));let bestLag=0,best=-1;
    for(let lag=minLag;lag<=maxLag;lag++){
      let num=0,a2=0,b2=0;const end=buf.length-lag;
      for(let i=0;i<end;i+=3){const a=buf[i]-st.mean,b=buf[i+lag]-st.mean;num+=a*b;a2+=a*a;b2+=b*b}
      const corr=num/Math.sqrt(Math.max(1e-12,a2*b2));if(corr>best){best=corr;bestLag=lag}
    }
    if(best<.34||!bestLag)return 0;let hz=sr/bestLag;
    if(expected>35){
      const candidates=[hz/4,hz/2,hz,hz*2,hz*4].filter(x=>x>=minHz&&x<=maxHz);let pick=hz,err=Infinity;
      for(const c of candidates){const e=Math.abs(Math.log2(c/expected));if(e<err){err=e;pick=c}}
      if(err<.46)hz=pick;
    }
    return hz;
  }
  function findTrigger(buf,start,end,mean){
    let best=start;for(let i=start+1;i<end;i++){if(buf[i-1]<=mean&&buf[i]>mean){const slope=buf[i]-buf[i-1];if(slope>.0004)return i;best=i}}return best;
  }
  function hardwareTrace(w,h){
    if(!hwAnalyser||!hwTime)return readout(0,'USB');hwAnalyser.getFloatTimeDomainData(hwTime);const expected=expectedFrequency();
    if(frame%5===0){const measured=estimatePitch(hwTime,hwCtx.sampleRate,expected);if(measured)hwHz=!hwHz?measured:hwHz*.72+measured*.28}
    readout(hwHz,'USB');const hz=hwHz||expected||140,windowSec=clamp(3.2/Math.max(45,hz),.006,.035),windowSamples=Math.min(hwTime.length-64,Math.max(300,Math.floor(hwCtx.sampleRate*windowSec))),st=centeredStats(hwTime);
    const searchEnd=Math.max(64,hwTime.length-windowSamples-2),start=findTrigger(hwTime,24,searchEnd,st.mean);drawSamples(w,h,hwTime.subarray(start,Math.min(hwTime.length,start+windowSamples)));
  }
  function hardwareSpectrum(w,h){
    if(!hwAnalyser||!hwFreq)return;hwAnalyser.getFloatFrequencyData(hwFreq);let frameMax=-120;for(let i=1;i<hwFreq.length*.48;i++)frameMax=Math.max(frameMax,hwFreq[i]);const floor=Math.max(-115,frameMax-72),span=Math.max(24,frameMax-floor);g.save();g.fillStyle='#d9ff2f';
    const step=Math.max(2,Math.round(w/190));for(let x=0;x<w;x+=step){const i=Math.floor((x/w)*(hwFreq.length*.48)),v=clamp((hwFreq[i]-floor)/span,0,1),bar=v*h*.88;g.globalAlpha=.18+v*.82;g.fillRect(x,h-bar,Math.max(2,w/230),bar)}g.restore();g.globalAlpha=1;
    if(frame%5===0){hwAnalyser.getFloatTimeDomainData(hwTime);const measured=estimatePitch(hwTime,hwCtx.sampleRate,expectedFrequency());if(measured)hwHz=!hwHz?measured:hwHz*.72+measured*.28}readout(hwHz,'USB');
  }

  function readout(hz,source='SYNTH'){const note=$('#scopeNote'),value=$('#scopeHz'),src=$('#scopeSourceState');if(note)note.textContent=hz?noteName(hz):'--';if(value)value.textContent=hz?`${Math.round(hz)} Hz`:'-- Hz';if(src)src.textContent=source}
  function status(text,kind=''){const el=$('#scopeInputStatus');if(!el)return;el.textContent=text;el.dataset.kind=kind}
  function stopHardware(){try{hwStream?.getTracks().forEach(t=>t.stop())}catch(_){}try{hwSource?.disconnect()}catch(_){}try{hwCtx?.close()}catch(_){}hwStream=hwCtx=hwSource=hwAnalyser=hwTime=hwFreq=null;hwHz=0;displayGain=1}
  function rawAudioConstraints(deviceId){const c={echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:{ideal:2},sampleRate:{ideal:48000}};if(deviceId)c.deviceId={exact:deviceId};return c}
  async function acquireHardware(deviceId=''){
    if(!navigator.mediaDevices?.getUserMedia){status(say('Audio input is not available in this browser.','Bu tarayıcıda ses girişi kullanılamıyor.'),'bad');return false}status(say('Requesting audio input…','Ses girişi izni isteniyor…'),'');
    try{
      let stream=await navigator.mediaDevices.getUserMedia({audio:rawAudioConstraints(deviceId),video:false});const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');const select=$('#scopeAudioInput');if(select)select.innerHTML=devices.map(d=>`<option value="${d.deviceId}">${d.label||say('Audio input','Ses girişi')}</option>`).join('');
      const t8=devices.find(d=>/\bT-?8\b|AIRA/i.test(d.label)),current=stream.getAudioTracks()[0]?.getSettings?.().deviceId||'';
      if(!deviceId&&t8?.deviceId&&t8.deviceId!==current){stream.getTracks().forEach(t=>t.stop());stream=await navigator.mediaDevices.getUserMedia({audio:rawAudioConstraints(t8.deviceId),video:false})}
      stopHardware();hwStream=stream;const AC=window.AudioContext||window.webkitAudioContext;hwCtx=new AC();if(hwCtx.state==='suspended')await hwCtx.resume();hwSource=hwCtx.createMediaStreamSource(stream);hwAnalyser=hwCtx.createAnalyser();hwAnalyser.fftSize=8192;hwAnalyser.smoothingTimeConstant=.08;hwAnalyser.minDecibels=-120;hwAnalyser.maxDecibels=-12;hwSource.connect(hwAnalyser);hwTime=new Float32Array(hwAnalyser.fftSize);hwFreq=new Float32Array(hwAnalyser.frequencyBinCount);sourceMode='usb';displayGain=1;
      const track=stream.getAudioTracks()[0],label=track?.label||t8?.label||say('USB audio','USB sesi');if(select){const id=track?.getSettings?.().deviceId;if(id)select.value=id;select.hidden=devices.length<2}updateSourceButtons();status(/\bT-?8\b|AIRA/i.test(label)?`${say('LIVE','CANLI')}: ${label}`:`${say('LIVE INPUT','CANLI GİRİŞ')}: ${label}`,'good');return true;
    }catch(err){stopHardware();sourceMode='synth';updateSourceButtons();status(err?.name==='NotAllowedError'?say('Microphone / audio permission was denied.','Mikrofon / ses izni reddedildi.'):say('T-8 USB audio could not be opened. Check the USB audio input.','T-8 USB sesi açılamadı. USB ses girişini kontrol et.'),'bad');return false}
  }
  function updateSourceButtons(){$$('.scope-source-button').forEach(b=>b.classList.toggle('active',b.dataset.source===sourceMode))}
  function installControls(){
    const panel=$('.scope-panel');if(!panel||$('#scopeSourceControls'))return;const row=document.createElement('div');row.id='scopeSourceControls';row.className='scope-source-controls';row.innerHTML=`<div class="scope-source-buttons"><button type="button" class="scope-source-button active" data-source="synth">SYNTH</button><button type="button" class="scope-source-button" data-source="usb">T-8 USB</button></div><select id="scopeAudioInput" hidden data-i18n-aria-label="scopeInputLabel" aria-label="Oscilloscope audio input"></select><span id="scopeSourceState">SYNTH</span><small id="scopeInputStatus"></small>`;$('.mini-tabs',panel)?.after(row);
    row.addEventListener('click',async e=>{const b=e.target.closest('.scope-source-button');if(!b)return;if(b.dataset.source==='synth'){sourceMode='synth';stopHardware();updateSourceButtons();status('')}else await acquireHardware($('#scopeAudioInput')?.value||'')});
    $('#scopeAudioInput')?.addEventListener('change',e=>acquireHardware(e.target.value));
  }

  function render(){
    requestAnimationFrame(render);frame++;if(!installCanvas())return;const{w,h}=resize();background(w,h);
    if(sourceMode==='usb'&&hwAnalyser){if(mode==='fft')hardwareSpectrum(w,h);else hardwareTrace(w,h);return}
    const e=engine(),step=activeStep();if(!e||e.state!=='playing'||!e.bassOn||step<0){lastStep=-1;displayHz*=.75;readout(0,'SYNTH');return}
    if(step!==lastStep){lastStep=step;stepStart=performance.now()}const hz=currentFrequency(step);if(!hz){readout(0,'SYNTH');return}displayHz=!displayHz||Math.abs(hz-displayHz)/hz>.7?hz:displayHz+(hz-displayHz)*.34;readout(displayHz,'SYNTH');if(mode==='fft')modeledSpectrum(w,h,displayHz,wave(),step);else drawSamples(w,h,modeledSamples(displayHz,wave(),step));
  }
  function init(){
    if(!installCanvas())return;installControls();$$('.scope-panel .analyzer-tab').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode==='fft'?'fft':'scope';$$('.scope-panel .analyzer-tab').forEach(x=>x.classList.toggle('active',x===btn))}));document.addEventListener('303box:languagechange',()=>status(''));requestAnimationFrame(render);window.__303boxLiveScope={version:'1845',acquireHardware,stopHardware,get source(){return sourceMode},get mode(){return mode}};
  }
  window.addEventListener('pagehide',stopHardware);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
