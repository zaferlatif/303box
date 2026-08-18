(() => {
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const NOTE_MIDI = {C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let mode = 'scope';
  let canvas = null;
  let ctx2d = null;
  let lastReadout = { note:'--', hz:'-- Hz' };

  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }
  function unified(){ return window.__303boxUnifiedEngine; }
  function tune(){
    const v=Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'));
    return clamp(Number.isFinite(v)?v:Number(localStorage.getItem('303box-tune-semitones-v1'))||0,-12,12);
  }
  function waveform(){ return $('#waveSaw')?.classList.contains('selected') ? 'saw' : 'square'; }

  function activeStep(){
    const h=$('[data-step-header][data-playing="true"]');
    if(!h)return -1;
    const n=Number(h.dataset.stepHeader);
    return Number.isInteger(n)?n:-1;
  }

  function readStep(i){
    if(i<0||i>15)return null;
    const input=$$('.note-input')[i];
    const note=input?.value?.trim().toUpperCase()||'';
    const gate=$$('.gate-cell')[i]?.textContent.trim()||'';
    const octave=$$('.octave-cell')[i]?.textContent.trim().toUpperCase()||'';
    const baseOctave=Number(input?.dataset?.baseOctave||0)?12:0;
    return {note,gate,octave,baseOctave};
  }

  function frequencyFor(step){
    if(!step||!step.note||step.gate==='-')return 0;
    const midi=NOTE_MIDI[step.note];
    if(midi==null)return 0;
    let semi=step.baseOctave+tune();
    if(step.octave==='D')semi-=12;
    if(step.octave==='U')semi+=12;
    return 440*Math.pow(2,((midi+semi)-69)/12);
  }

  function nearest(hz){
    if(!hz||hz<20)return '--';
    const midi=Math.round(69+12*Math.log2(hz/440));
    return NOTE_NAMES[(midi%12+12)%12]+(Math.floor(midi/12)-1);
  }

  function mount(){
    const old=$('#fxScope');
    if(!old)return false;
    if(!canvas){
      old.style.setProperty('display','none','important');
      canvas=document.createElement('canvas');
      canvas.id='bassOnlyScope';
      canvas.className='bass-only-scope';
      canvas.setAttribute('aria-label','303 oscillator monitor');
      old.insertAdjacentElement('afterend',canvas);
      const style=document.createElement('style');
      style.textContent=`
        #bassOnlyScope{display:block;width:100%;height:62px;border:1px solid #27272c;border-radius:6px;background-color:#070809;background-image:linear-gradient(rgba(221,255,55,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(221,255,55,.045) 1px,transparent 1px);background-size:22px 22px}
      `;
      document.head.appendChild(style);
      ctx2d=canvas.getContext('2d');
    }
    return true;
  }

  function sizeCanvas(){
    if(!canvas||!ctx2d)return null;
    const r=canvas.getBoundingClientRect();
    const d=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(r.width*d));
    const h=Math.max(1,Math.round(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    return {w,h,d};
  }

  function grid(g,w,h){
    g.clearRect(0,0,w,h);
    g.strokeStyle='rgba(221,255,55,.08)';g.lineWidth=1;
    for(let x=0;x<=w;x+=w/8){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
    for(let y=0;y<=h;y+=h/3){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
    g.strokeStyle='rgba(221,255,55,.2)';g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();
  }

  function drawScope(g,w,h,hz,type){
    const cycles=clamp(hz/75,1.6,6.2);
    g.strokeStyle='#ddff37';g.lineWidth=Math.max(1.4,w/500);g.beginPath();
    for(let x=0;x<w;x++){
      const phase=(x/w)*cycles;
      const frac=phase-Math.floor(phase);
      let y;
      if(type==='square')y=frac<.5?h*.32:h*.68;
      else y=h*(.25+.5*frac);
      if(x===0)g.moveTo(x,y);else g.lineTo(x,y);
    }
    g.stroke();
  }

  function drawSpectrum(g,w,h,hz,type){
    const maxHz=2200;
    const harmonics=type==='square'?[1,3,5,7,9,11,13,15]:[1,2,3,4,5,6,7,8,9,10,11,12];
    harmonics.forEach((n,idx)=>{
      const f=hz*n;if(f>maxHz)return;
      const amp=type==='square'?1/n:1/n;
      const x=(f/maxHz)*w;
      const bh=clamp(amp*h*.82,2,h*.82);
      g.globalAlpha=clamp(.22+amp*.85,.25,1);
      g.fillStyle='#ddff37';
      g.fillRect(Math.max(0,x-1.5),h-bh,Math.max(2,w/220),bh);
    });
    g.globalAlpha=1;
  }

  function setReadout(note,hzText){
    lastReadout={note,hz:hzText};
    const n=$('#fxNote'),h=$('#fxHz');
    if(n&&n.textContent!==note)n.textContent=note;
    if(h&&h.textContent!==hzText)h.textContent=hzText;
  }

  function render(){
    requestAnimationFrame(render);
    if(!mount())return;
    const s=sizeCanvas();if(!s)return;
    const {w,h}=s,g=ctx2d;grid(g,w,h);
    const e=unified();
    if(!e||e.state!=='playing'||!e.bassOn){setReadout('--','-- Hz');return;}
    const i=activeStep(),step=readStep(i),hz=frequencyFor(step);
    if(!hz){setReadout('--','-- Hz');return;}
    const rounded=Math.round(hz),type=waveform();
    setReadout(nearest(hz),`${rounded} Hz`);
    if(mode==='spectrum')drawSpectrum(g,w,h,hz,type);else drawScope(g,w,h,hz,type);
  }

  // The historical analyser still updates the same labels from the master bus.
  // Restore the bass-only readout immediately after any such mutation.
  function protectReadout(){
    ['#fxNote','#fxHz'].forEach(sel=>{
      const el=$(sel);if(!el||el.dataset.bassScopeProtected)return;
      el.dataset.bassScopeProtected='1';
      new MutationObserver(()=>{
        const expected=sel==='#fxNote'?lastReadout.note:lastReadout.hz;
        if(el.textContent!==expected)el.textContent=expected;
      }).observe(el,{childList:true,characterData:true,subtree:true});
    });
  }

  document.addEventListener('click',event=>{
    const tab=event.target.closest?.('.analyzer-tab');if(!tab)return;
    mode=tab.dataset.mode==='spectrum'?'spectrum':'scope';
    $$('.analyzer-tab').forEach(b=>b.classList.toggle('active',b===tab));
  },true);

  function settle(){
    [0,80,220,600,1200].forEach(ms=>setTimeout(()=>{mount();protectReadout();},ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});
  requestAnimationFrame(render);

  window.__303boxBassScope={version:'1410',get mode(){return mode}};
})();
