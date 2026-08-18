(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let mode='scope',canvas=null,g=null,lastStep=-1,stepStarted=0,phase=0,lastFrame=performance.now();
  let last={note:'--',hz:'-- Hz'};
  const engine=()=>window.__303boxUnifiedEngine;
  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const tune=()=>clamp(Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'))||0,-12,12);
  const wave=()=>$('#waveSaw')?.classList.contains('selected')?'saw':'square';
  const knob=(id,fallback=0)=>{const v=Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow'));return Number.isFinite(v)?v:fallback};
  function activeStep(){const h=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(h?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:-1}
  function readStep(i){
    if(i<0||i>15)return null;const sheet=$('#patternSheet'),input=$$('.note-input',sheet)[i];
    return{note:input?.value?.trim().toUpperCase()||'',base:Number(input?.dataset?.baseOctave||0)?12:0,oct:$$('.octave-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',expr:$$('.accentSlide-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',gate:$$('.gate-cell',sheet)[i]?.textContent.trim()||''}
  }
  const playable=x=>!!x?.note&&x.gate!=='-';
  function frequency(x){
    if(!playable(x))return 0;let m=NOTE_MIDI[x.note];if(m==null)return 0;m+=x.base+tune();if(x.oct==='D')m-=12;if(x.oct==='U')m+=12;return 440*Math.pow(2,(m-69)/12)
  }
  function currentHz(i){
    const cur=readStep(i),target=frequency(cur);if(!target)return 0;
    const prev=readStep((i+15)%16),from=frequency(prev);
    if(from&&playable(prev)&&prev.expr.includes('S')){
      const dur=(60/bpm())/4,glide=clamp(dur*.52,.04,.085),elapsed=(performance.now()-stepStarted)/1000;
      if(elapsed<glide){const p=clamp(elapsed/glide,0,1);return from*Math.pow(target/from,p)}
    }
    return target;
  }
  function noteName(hz){if(!hz)return'--';const m=Math.round(69+12*Math.log2(hz/440));return `${NAMES[(m%12+12)%12]}${Math.floor(m/12)-1}`}
  function mount(){
    const old=$('#fxScope');if(!old)return false;old.style.setProperty('display','none','important');
    let c=$('#bassOnlyScope');if(c&&c.tagName!=='CANVAS'){c.remove();c=null}
    if(!c){c=document.createElement('canvas');c.id='bassOnlyScope';c.className='bass-only-scope';c.setAttribute('aria-label','303 oscillator scope and FFT');old.insertAdjacentElement('afterend',c)}
    canvas=c;g=c.getContext('2d');c.style.cssText='display:block;width:100%;height:48px;border:1px solid #27272c;border-radius:6px;background:#070809';return true;
  }
  function size(){if(!canvas||!g)return null;const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h}}
  function grid(w,h){g.clearRect(0,0,w,h);g.fillStyle='#070809';g.fillRect(0,0,w,h);g.lineWidth=1;g.strokeStyle='rgba(221,255,55,.07)';for(let i=1;i<8;i++){const x=w*i/8;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let i=1;i<3;i++){const y=h*i/3;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}g.strokeStyle='rgba(221,255,55,.17)';g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke()}
  function drawScope(w,h,hz,type,dt){
    phase=(phase+hz*dt)%1;const seconds=.018,cycles=Math.max(.6,hz*seconds);g.strokeStyle='#ddff37';g.lineWidth=Math.max(1.35,w/650);g.beginPath();
    for(let x=0;x<w;x++){const p=phase+(x/Math.max(1,w-1))*cycles,frac=p-Math.floor(p);const yv=type==='square'?(frac<.5?1:-1):(1-2*frac);const y=h/2-yv*h*.27;if(x===0)g.moveTo(x,y);else g.lineTo(x,y)}g.stroke();
  }
  function filterGain(f){
    const cut=90+Math.pow(clamp(knob('cutoff',38)/100,0,1),.82)*2100,res=clamp(knob('resonance',78)/100,0,1);
    const lp=1/Math.sqrt(1+Math.pow(f/Math.max(90,cut),8));const dist=Math.abs(Math.log2(Math.max(1,f)/Math.max(1,cut)));const bump=1+res*2.2*Math.exp(-dist*dist/0.045);return clamp(lp*bump,0,2.8)
  }
  function drawFFT(w,h,hz,type){
    const maxHz=12000,minHz=30,logMin=Math.log(minHz),logSpan=Math.log(maxHz)-logMin;
    for(let n=1;n<=64;n++){
      if(type==='square'&&n%2===0)continue;const f=hz*n;if(f>maxHz)break;let amp=(1/n)*filterGain(f);amp=clamp(amp,0,1);const x=(Math.log(Math.max(minHz,f))-logMin)/logSpan*w,bar=Math.max(1.5,amp*h*.88);g.globalAlpha=clamp(.25+amp*.8,.25,1);g.fillStyle='#ddff37';g.fillRect(Math.max(0,x-1.5),h-bar,Math.max(2,w/280),bar)
    }g.globalAlpha=1;
  }
  function setReadout(note,hz){last={note,hz};const ne=$('#fxNote'),he=$('#fxHz');if(ne&&ne.textContent!==note)ne.textContent=note;if(he&&he.textContent!==hz)he.textContent=hz}
  function render(now){
    requestAnimationFrame(render);if(!mount())return;const s=size();if(!s)return;grid(s.w,s.h);const e=engine();
    if(!e||e.state!=='playing'||!e.bassOn){lastStep=-1;setReadout('--','-- Hz');lastFrame=now;return}
    const i=activeStep();if(i!==lastStep){lastStep=i;stepStarted=performance.now()}if(i<0){setReadout('--','-- Hz');lastFrame=now;return}
    const hz=currentHz(i);if(!hz){setReadout('--','-- Hz');lastFrame=now;return}const type=wave();setReadout(noteName(hz),`${Math.round(hz)} Hz`);const dt=Math.min(.05,Math.max(0,(now-lastFrame)/1000));lastFrame=now;if(mode==='fft')drawFFT(s.w,s.h,hz,type);else drawScope(s.w,s.h,hz,type,dt)
  }
  document.addEventListener('click',e=>{const tab=e.target.closest?.('.analyzer-tab');if(!tab)return;mode=tab.dataset.mode==='fft'?'fft':'scope';$$('.analyzer-tab').forEach(b=>b.classList.toggle('active',b===tab))},true);
  function protect(){['#fxNote','#fxHz'].forEach(sel=>{const el=$(sel);if(!el||el.dataset.scope1600)return;el.dataset.scope1600='1';new MutationObserver(()=>{const v=sel==='#fxNote'?last.note:last.hz;if(el.textContent!==v)el.textContent=v}).observe(el,{childList:true,subtree:true,characterData:true})})}
  const settle=()=>[0,100,300,800].forEach(ms=>setTimeout(()=>{mount();protect()},ms));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();window.addEventListener('load',settle,{once:true});requestAnimationFrame(render);
  window.__303boxBassScope={version:'1600',get mode(){return mode}};
})();