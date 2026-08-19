(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const STORE='303box-delay-feedback-v1';
  const ORDER=['tune','cutoff','resonance','envMod','decay','accent','delay','feedback','reverb','distortion'];
  let value=32,node=null,attempts=0;
  try{const saved=Number(localStorage.getItem(STORE));if(Number.isFinite(saved))value=clamp(Math.round(saved),0,100)}catch(_){}

  function dialSvg(){
    const ticks=Array.from({length:11},(_,i)=>{const a=-135+i*27;return `<line class="dial-tick${i===0||i===5||i===10?' major':''}" x1="50" y1="5" x2="50" y2="11" transform="rotate(${a} 50 50)"/>`}).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="knobFace-feedback-fx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#333338"/><stop offset="1" stop-color="#111113"/></linearGradient></defs>${ticks}<circle class="dial-bezel" cx="50" cy="50" r="34"/><circle fill="url(#knobFace-feedback-fx)" stroke="#151517" stroke-width="2" cx="50" cy="50" r="29"/><circle class="dial-center" cx="50" cy="50" r="5"/><g class="pointer-group"><line class="dial-pointer" x1="50" y1="50" x2="50" y2="23"/></g></svg>`;
  }

  function feedbackGain(){return value<=0?0:clamp((value/100)*.78,0,.78)}
  function applyNode(immediate=false){
    if(!node?.gain)return;
    const v=feedbackGain(),ctx=node.context,now=ctx?.currentTime||0;
    try{immediate?node.gain.setValueAtTime(v,now):node.gain.setTargetAtTime(v,now,.018)}catch(_){try{node.gain.value=v}catch(__){}}
  }
  function captureNode(gain){node=gain;window.__303boxDelayFeedbackNode=gain;applyNode(true);queueMicrotask(()=>applyNode(true))}

  function patchWebAudio(){
    const ctors=[window.AudioContext,window.webkitAudioContext].filter(Boolean);
    ctors.forEach(Ctor=>{
      const p=Ctor.prototype;if(!p||p.__303boxFeedbackCapture)return;p.__303boxFeedbackCapture=true;
      const originalDelay=p.createDelay,originalGain=p.createGain;
      if(typeof originalDelay!=='function'||typeof originalGain!=='function')return;
      p.createDelay=function(...args){const out=originalDelay.apply(this,args);if(Number(args[0]||0)>=1.5)this.__303boxFeedbackCaptureNext=true;return out};
      p.createGain=function(...args){const out=originalGain.apply(this,args);if(this.__303boxFeedbackCaptureNext){this.__303boxFeedbackCaptureNext=false;captureNode(out)}return out};
    });
  }

  function persist(){try{localStorage.setItem(STORE,String(value))}catch(_){}}
  function render(){
    const c=$('[data-knob-id="feedback"]');if(!c)return;
    const a=-135+value/100*270;
    c.querySelector('.pointer-group')?.setAttribute('transform',`rotate(${a} 50 50)`);
    c.setAttribute('aria-valuemin','0');c.setAttribute('aria-valuemax','100');c.setAttribute('aria-valuenow',String(value));
    const out=$('[data-fx-value="feedback"]');if(out)out.textContent=`${value}%`;
  }
  function setValue(v,{emit=true}={}){
    value=clamp(Math.round(v),0,100);persist();render();applyNode();
    if(emit)window.dispatchEvent(new CustomEvent('303box:feedbackchange',{detail:{feedback:value}}));
  }
  function makeKnob(){
    const wrap=document.createElement('div');wrap.className='knob fx-knob fx-feedback';wrap.dataset.fxKnob='feedback';
    wrap.innerHTML=`<span class="knob-title">FEEDBACK</span><button type="button" class="knob-control" data-knob-id="feedback" role="slider" aria-label="Delay feedback">${dialSvg()}</button><span class="knob-value" data-fx-value="feedback"></span>`;
    const c=wrap.querySelector('.knob-control');let active=false,startY=0,startValue=0;
    c.addEventListener('pointerdown',e=>{active=true;startY=e.clientY;startValue=value;try{c.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
    c.addEventListener('pointermove',e=>{if(active)setValue(startValue+(startY-e.clientY)*.55)});
    const done=e=>{if(!active)return;active=false;try{c.releasePointerCapture(e.pointerId)}catch(_){}};
    c.addEventListener('pointerup',done);c.addEventListener('pointercancel',done);
    c.addEventListener('wheel',e=>{e.preventDefault();setValue(value+(e.deltaY<0?2:-2))},{passive:false});
    c.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();if(e.key==='Home')setValue(0);else if(e.key==='End')setValue(100);else setValue(value+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1))});
    c.addEventListener('dblclick',()=>setValue(0));
    return wrap;
  }

  function normalizeGrid(){
    const grid=$('#knobGrid');if(!grid)return false;
    if(!grid.querySelector('[data-knob-id="feedback"]'))grid.appendChild(makeKnob());
    const nodes=ORDER.map(id=>grid.querySelector(`[data-knob-id="${id}"]`)?.closest('.knob')).filter(Boolean);
    if(nodes.length!==ORDER.length)return false;
    const current=[...grid.children].filter(el=>el.classList.contains('knob'));
    if(nodes.some((n,i)=>current[i]!==n))nodes.forEach(n=>grid.appendChild(n));
    render();return true;
  }

  function installStyle(){
    if($('#feedbackKnobAuthority2120'))return;
    const s=document.createElement('style');s.id='feedbackKnobAuthority2120';s.textContent=`
      #patternSheet #knobGrid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      #patternSheet #knobGrid .knob-title{color:#aeb0b7!important}
      #patternSheet #knobGrid .knob{min-width:0!important}
      @media(max-width:760px){#patternSheet #knobGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `;document.head.appendChild(s);
  }

  function randomizeFeedback(){setValue(Math.random()<.22?0:Math.round(16+Math.random()*48),{emit:false})}
  window.addEventListener('303box:fxchange',()=>applyNode());
  window.addEventListener('303box:patch-randomized',e=>{if(!Number.isFinite(+e.detail?.feedback))randomizeFeedback()});

  function boot(){attempts++;installStyle();if(!normalizeGrid()&&attempts<35)setTimeout(boot,40)}
  patchWebAudio();
  setInterval(()=>applyNode(false),320);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  document.addEventListener('303box:ready',()=>{normalizeGrid();applyNode(true)});
  window.__303boxFeedback={version:'2120',set:setValue,get value(){return value},get node(){return node}};
})();