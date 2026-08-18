(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const NOTE_MIDI={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let mode='scope',canvas=null,g=null,lastStep=-1,stepStart=0,displayHz=0;
  const engine=()=>window.__303boxUnifiedEngine;
  const bpm=()=>clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250);
  const tune=()=>clamp(Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'))||0,-12,12);
  const wave=()=>$('#waveSaw')?.classList.contains('selected')?'saw':'square';
  const knob=(id,fallback=0)=>{const v=Number($(`[data-knob-id="${id}"]`)?.getAttribute('aria-valuenow'));return Number.isFinite(v)?v:fallback};
  function readStep(i){if(i<0||i>15)return null;const sheet=$('#patternSheet');if(!sheet)return null;const n=$$('.note-input',sheet)[i];return{note:n?.value?.trim().toUpperCase()||'',base:Number(n?.dataset?.baseOctave||0)?12:0,oct:$$('.octave-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',expr:$$('.accentSlide-cell',sheet)[i]?.textContent.trim().toUpperCase()||'',gate:$$('.gate-cell',sheet)[i]?.textContent.trim()||''}}
  const playable=x=>!!x?.note&&x.gate!=='-';
  function freq(x){if(!playable(x))return 0;let m=NOTE_MIDI[x.note];if(m==null)return 0;m+=x.base+tune();if(x.oct==='D')m-=12;if(x.oct==='U')m+=12;return 440*Math.pow(2,(m-69)/12)}
  function activeStep(){const h=$('#patternSheet [data-step-header][data-playing="true"]');const n=Number(h?.dataset?.stepHeader);return Number.isInteger(n)&&n>=0&&n<16?n:-1}
  function currentFrequency(i){const cur=readStep(i),to=freq(cur);if(!to)return 0;const prev=readStep((i+15)%16),from=freq(prev);if(from&&prev?.expr?.includes('S')){const dur=(60/bpm())/4,glide=clamp(dur*.52,.04,.09),elapsed=(performance.now()-stepStart)/1000;if(elapsed<glide){const p=clamp(elapsed/glide,0,1);return from*Math.pow(to/from,p)}}return to}
  function noteName(hz){if(!hz)return'--';const m=Math.round(69+12*Math.log2(hz/440));return `${NAMES[(m%12+12)%12]}${Math.floor(m/12)-1}`}
  function ensure(){canvas=$('#bassOnlyScope');if(!canvas)return false;if(!g)g=canvas.getContext('2d');return!!g}
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h}}
  function background(w,h){const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#070a07');grad.addColorStop(1,'#030503');g.fillStyle=grad;g.fillRect(0,0,w,h);g.lineWidth=1;for(let i=1;i<10;i++){g.strokeStyle=i===5?'rgba(217,255,47,.16)':'rgba(217,255,47,.055)';const x=w*i/10;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let i=1;i<4;i++){g.strokeStyle=i===2?'rgba(217,255,47,.19)':'rgba(217,255,47,.06)';const y=h*i/4;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}}
  function trace(w,h,hz,type){const cycles=clamp(hz/105,1.15,7.5),amp=h*.29;g.save();g.shadowColor='rgba(217,255,47,.65)';g.shadowBlur=Math.max(5,w/120);g.strokeStyle='#d9ff2f';g.lineWidth=Math.max(1.5,w/420);g.beginPath();for(let x=0;x<w;x++){const p=(x/Math.max(1,w-1))*cycles+.13,frac=p-Math.floor(p);const yv=type==='square'?(frac<.5?1:-1):(1-2*frac);const y=h*.5-yv*amp;if(x===0)g.moveTo(x,y);else g.lineTo(x,y)}g.stroke();g.restore()}
  function filterGain(f){const cut=90+Math.pow(clamp(knob('cutoff',38)/100,0,1),.82)*2200,res=clamp(knob('resonance',78)/100,0,1);const lp=1/Math.sqrt(1+Math.pow(f/Math.max(90,cut),8));const dist=Math.abs(Math.log2(Math.max(1,f)/Math.max(1,cut)));return clamp(lp*(1+res*2.4*Math.exp(-(dist*dist)/.05)),0,2.6)}
  function spectrum(w,h,hz,type){const minF=30,maxF=12000,l0=Math.log(minF),span=Math.log(maxF)-l0,bins=[];for(let n=1;n<=72;n++){if(type==='square'&&n%2===0)continue;const f=hz*n;if(f>maxF)break;bins.push({f,a:clamp((1/n)*filterGain(f),0,1)})}g.save();g.shadowColor='rgba(217,255,47,.35)';g.shadowBlur=4;for(const b of bins){const x=(Math.log(Math.max(minF,b.f))-l0)/span*w,bar=Math.max(1,b.a*h*.82);g.globalAlpha=.28+b.a*.72;g.fillStyle='#d9ff2f';g.fillRect(Math.max(0,x-1.5),h-bar,Math.max(2,w/320),bar)}g.restore();g.globalAlpha=1}
  function readout(hz){const note=$('#scopeNote'),value=$('#scopeHz'),n=hz?noteName(hz):'--',v=hz?`${Math.round(hz)} Hz`:'-- Hz';if(note&&note.textContent!==n)note.textContent=n;if(value&&value.textContent!==v)value.textContent=v}
  function render(){requestAnimationFrame(render);if(!ensure())return;const{w,h}=resize();background(w,h);const e=engine();if(!e||e.state!=='playing'||!e.bassOn){lastStep=-1;displayHz*=.75;readout(0);return}const step=activeStep();if(step!==lastStep){lastStep=step;stepStart=performance.now()}if(step<0){readout(0);return}const hz=currentFrequency(step);if(!hz){displayHz*=.78;readout(0);return}if(!displayHz||Math.abs(hz-displayHz)/hz>.7)displayHz=hz;else displayHz+=(hz-displayHz)*.34;readout(displayHz);if(mode==='fft')spectrum(w,h,displayHz,wave());else trace(w,h,displayHz,wave())}
  function init(){if(!ensure())return;$$('.scope-panel .analyzer-tab').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode==='fft'?'fft':'scope';$$('.scope-panel .analyzer-tab').forEach(x=>x.classList.toggle('active',x===btn))}));requestAnimationFrame(render);window.__303boxBassScope={version:'1680',get mode(){return mode}}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
