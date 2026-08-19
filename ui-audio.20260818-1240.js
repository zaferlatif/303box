(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const STORE='303box-fx-controls-v1';
  let fx={delay:0,distortion:0},attempts=0;
  try{
    const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
    if(Number.isFinite(+saved.delay))fx.delay=clamp(Math.round(+saved.delay),0,100);
    if(Number.isFinite(+saved.distortion))fx.distortion=clamp(Math.round(+saved.distortion),0,100);
  }catch(_){}

  function dialSvg(id){
    const ticks=Array.from({length:11},(_,i)=>{const a=-135+i*27;return `<line class="dial-tick${i===0||i===5||i===10?' major':''}" x1="50" y1="5" x2="50" y2="11" transform="rotate(${a} 50 50)"/>`}).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="knobFace-${id}-fx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#333338"/><stop offset="1" stop-color="#111113"/></linearGradient></defs>${ticks}<circle class="dial-bezel" cx="50" cy="50" r="34"/><circle fill="url(#knobFace-${id}-fx)" stroke="#151517" stroke-width="2" cx="50" cy="50" r="29"/><circle class="dial-center" cx="50" cy="50" r="5"/><g class="pointer-group"><line class="dial-pointer" x1="50" y1="50" x2="50" y2="23"/></g></svg>`;
  }

  function persist(){try{localStorage.setItem(STORE,JSON.stringify(fx))}catch(_){}}
  function render(id){
    const c=$(`[data-knob-id="${id}"]`);if(!c)return;
    const value=fx[id]||0,angle=-135+value/100*270;
    c.querySelector('.pointer-group')?.setAttribute('transform',`rotate(${angle} 50 50)`);
    c.setAttribute('aria-valuemin','0');c.setAttribute('aria-valuemax','100');c.setAttribute('aria-valuenow',String(value));
    const out=$(`[data-fx-value="${id}"]`);if(out)out.textContent=`${value}%`;
  }
  function setFx(id,value){
    fx[id]=clamp(Math.round(value),0,100);persist();render(id);
    window.dispatchEvent(new CustomEvent('303box:fxchange',{detail:{...fx}}));
  }

  function makeKnob(id){
    const wrap=document.createElement('div');
    wrap.className=`knob fx-knob fx-${id}`;wrap.dataset.fxKnob=id;
    wrap.innerHTML=`<span class="knob-title">${id==='delay'?'DELAY':'DISTORTION'}</span><button type="button" class="knob-control" data-knob-id="${id}" role="slider" aria-label="${id}">${dialSvg(id)}</button><span class="knob-value" data-fx-value="${id}"></span>`;
    const c=wrap.querySelector('.knob-control');let active=false,startY=0,startValue=0;
    c.addEventListener('pointerdown',e=>{active=true;startY=e.clientY;startValue=fx[id];try{c.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
    c.addEventListener('pointermove',e=>{if(active)setFx(id,startValue+(startY-e.clientY)*.55)});
    const done=e=>{if(!active)return;active=false;try{c.releasePointerCapture(e.pointerId)}catch(_){}};
    c.addEventListener('pointerup',done);c.addEventListener('pointercancel',done);
    c.addEventListener('wheel',e=>{e.preventDefault();setFx(id,fx[id]+(e.deltaY<0?2:-2))},{passive:false});
    c.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();if(e.key==='Home')setFx(id,0);else if(e.key==='End')setFx(id,100);else setFx(id,fx[id]+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1))});
    c.addEventListener('dblclick',()=>setFx(id,0));
    return wrap;
  }

  function mount(){
    const grid=$('#knobGrid');
    if(!grid||!grid.querySelector('[data-knob-id="cutoff"]'))return false;
    ['delay','distortion'].forEach(id=>{
      if(!grid.querySelector(`[data-fx-knob="${id}"]`))grid.appendChild(makeKnob(id));
      render(id);
    });
    return true;
  }

  function bootMount(){
    attempts+=1;
    if(!mount()&&attempts<25)setTimeout(bootMount,40);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootMount,{once:true});else bootMount();
  window.__303boxFxControls={version:'2000',setFx,get values(){return{...fx}}};
})();
