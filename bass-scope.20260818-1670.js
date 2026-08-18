(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,'F':65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let mode='scope',canvas=null,g=null,lastStep=-1,stepStarted=0,lastHz=0,displayHz=0,lastFrame=performance.now();
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
  function frequency(x){if(!playable(x))return 0;let m=NOTE_MIDI[x.note];if(m==null)return 0;m+=x.base+tune();if(x.oct==='D')m-=12;if(x.oct==='U')m+=12;return 440*Math.pow(2,(m-69)/12)}
  function currentHz(i){
    const cur=readStep(i),target=frequency(cur);if(!target)return 0;
    const prev=readStep((i+15)%16),from=frequency(prev);
    if(from&&playable(prev)&&prev.expr.includes('S')){
      const dur=(60/bpm())/4,glide=clamp(dur*.52,.04,.09),elapsed=(performance.now()-stepStarted)/1000;
      if(elapsed<glide){const p=clamp(elapsed/glide,0,1);return from*Math.pow(target/from,p)}
    }
    return target;
  }
  function noteName(hz){if(!hz)return'--';const m=Math.round(69+12*Math.log2(hz/440));return `${NAMES[(m%12+12)%12]}${Math.floor(m/12)-1}`}
  function mount(){
    const old=$('#fxScope');if(!old)return false;old.style.setProperty('display','none','important');
    let c=$('#bassOnlyScope');if(c&&c.tagName!=='CANVAS'){c.remove();c=null}
    if(!c){c=document.createElement('canvas');c.id='bassOnlyScope';c.className='bass-only-scope';c.setAttribute('aria-label','303 oscillator scope and FFT');old.insertAdjacentElement('afterend',c)}
    canvas=c;g=c.getContext('2d');c.style.cssText='display:block;width:100%;height:62px;border:1px solid #282c25;border-radius:9px;background:#050705';return true;
  }
  function size(){if(!canvas||!g)return null;const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h,d}}
  function backdrop(w,h){
    g.clearRect(0,0,w,h);g.fillStyle='#050705';g.fillRect(0,0,w,h);
    const glow=g.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.62);glow.addColorStop(0,'rgba(217,255,47,.025)');glow.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=glow;g.fillRect(0,0,w,h);
    g.lineWidth=1;for(let i=1;i<10;i++){g.strokeStyle=i===5?'rgba(217,255,47,.13)':'rgba(217,255,47,.055)';const x=Math.round(w*i/10)+.5;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
    for(let i=1;i<4;i++){g.strokeStyle=i===2?'rgba(217,255,47,.15)':'rgba(217,255,47,.055)';const y=Math.round(h*i/4)+.5;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
  }
  function waveValue(frac,type){if(type==='square')return frac<.5?1:-1;return 1-2*frac}
  function drawScope(w,h,hz,type){
    if(!hz)return;
    const log=clamp((Math.log2(hz)-Math.log2(55))/(Math.log2(1760)-Math.log2(55)),0,1);
    const cycles=1.25+log*4.2,amp=h*.285;
    g.save();g.lineJoin='round';g.lineCap='round';g.shadowColor='rgba(217,255,47,.65)';g.shadowBlur=Math.max(5,h*.07);g.strokeStyle='rgba(217,255,47,.42)';g.lineWidth=Math.max(4,w/420);g.beginPath();
    for(let x=0;x<w;x++){const frac=((x/Math.max(1,w-1))*cycles)%1;const y=h*.5-waveValue(frac,type)*amp;if(x===0)g.moveTo(x,y);else g.lineTo(x,y)}g.stroke();
    g.shadowBlur=Math.max(2,h*.035);g.strokeStyle='#ddff37';g.lineWidth=Math.max(1.4,w/900);g.beginPath();
    for(let x=0;x<w;x++){const frac=((x/Math.max(1,w-1))*cycles)%1;const y=h*.5-waveValue(frac,type)*amp;if(x===0)g.moveTo(x,y);else g.lineTo(x,y)}g.stroke();g.restore();
  }
  function filterGain(f){const cut=90+Math.pow(clamp(knob('cutoff',38)/100,0,1),.82)*2100,res=clamp(knob('resonance',78)/100,0,1);const lp=1/Math.sqrt(1+Math.pow(f/Math.max(90,cut),8));const dist=Math.abs(Math.log2(Math.max(1,f)/Math.max(1,cut)));const bump=1+res*2.5*Math.exp(-dist*dist/.05);return clamp(lp*bump,0,3)}
  function drawFFT(w,h,hz,type){
    if(!hz)return;const minHz=35,maxHz=14000,lo=Math.log(minHz),span=Math.log(maxHz)-lo;g.save();g.shadowColor='rgba(217,255,47,.5)';g.shadowBlur=6;
    for(let n=1;n<=72;n++){if(type==='square'&&n%2===0)continue;const f=hz*n;if(f>maxHz)break;const amp=clamp((1/n)*filterGain(f),0,1);const x=(Math.log(Math.max(minHz,f))-lo)/span*w;const bh=Math.max(2,amp*h*.78);const bw=Math.max(2,w/210);g.globalAlpha=.35+amp*.65;g.fillStyle='#ddff37';g.fillRect(Math.max(0,x-bw*.5),h-bh,bw,bh)}g.restore();g.globalAlpha=1;
  }
  function setReadout(note,hz){last={note,hz};const ne=$('#fxNote'),he=$('#fxHz');if(ne&&ne.textContent!==note)ne.textContent=note;if(he&&he.textContent!==hz)he.textContent=hz}
  function render(now){
    requestAnimationFrame(render);if(!mount())return;const s=size();if(!s)return;backdrop(s.w,s.h);const e=engine();
    if(!e||e.state!=='playing'||!e.bassOn){lastStep=-1;lastHz=displayHz=0;setReadout('--','-- Hz');lastFrame=now;return}
    const i=activeStep();if(i!==lastStep){lastStep=i;stepStarted=performance.now()}if(i<0){setReadout('--','-- Hz');return}
    const target=currentHz(i);if(!target){lastHz=displayHz=0;setReadout('--','-- Hz');return}
    const dt=Math.min(.05,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;const alpha=1-Math.exp(-dt*20);displayHz=displayHz?displayHz+(target-displayHz)*alpha:target;lastHz=target;
    setReadout(noteName(displayHz),`${Math.round(displayHz)} Hz`);const type=wave();if(mode==='fft')drawFFT(s.w,s.h,displayHz,type);else drawScope(s.w,s.h,displayHz,type)
  }
  document.addEventListener('click',e=>{const tab=e.target.closest?.('.analyzer-tab');if(!tab)return;mode=tab.dataset.mode==='fft'?'fft':'scope';$$('.analyzer-tab').forEach(b=>b.classList.toggle('active',b===tab))},true);
  function protect(){['#fxNote','#fxHz'].forEach(sel=>{const el=$(sel);if(!el||el.dataset.scope1670)return;el.dataset.scope1670='1';new MutationObserver(()=>{const v=sel==='#fxNote'?last.note:last.hz;if(el.textContent!==v)el.textContent=v}).observe(el,{childList:true,subtree:true,characterData:true})})}
  const settle=()=>[0,80,240,700].forEach(ms=>setTimeout(()=>{mount();protect()},ms));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();window.addEventListener('load',settle,{once:true});requestAnimationFrame(render);
  window.__303boxBassScope={version:'1670',get mode(){return mode}};
})();