(() => {
  'use strict';
  const STORE='303box-master-reverb-v1';
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const $=(s,r=document)=>r.querySelector(s);
  let value=clamp(Number(localStorage.getItem(STORE))||0,0,100);

  const proto=window.AudioNode?.prototype;
  const previousConnect=proto?.connect;
  const networks=new WeakMap();
  const internal=new WeakSet();

  function impulse(ctx,seconds=1.7,decay=2.7){
    const len=Math.max(1,Math.floor(ctx.sampleRate*seconds));
    const b=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const d=b.getChannelData(ch);
      for(let i=0;i<len;i++){
        const t=i/len;
        d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(0.82+Math.random()*.18);
      }
    }
    return b;
  }

  function createNetwork(ctx,dest){
    const dry=ctx.createGain(),pre=ctx.createDelay(.12),conv=ctx.createConvolver(),wet=ctx.createGain();
    [dry,pre,conv,wet].forEach(n=>internal.add(n));
    dry.gain.value=1; pre.delayTime.value=.018; conv.buffer=impulse(ctx);
    wet.gain.value=(value/100)*.42;
    previousConnect.call(pre,conv); previousConnect.call(conv,wet);
    previousConnect.call(dry,dest); previousConnect.call(wet,dest);
    const net={ctx,dest,dry,pre,conv,wet}; networks.set(ctx,net); return net;
  }

  if(proto&&previousConnect){
    proto.connect=function(dest,...args){
      const ctx=this?.context;
      if(ctx?.__303boxUnifiedContext&&dest===ctx.destination&&!internal.has(this)){
        const net=networks.get(ctx)||createNetwork(ctx,dest);
        previousConnect.call(this,net.dry,...args);
        previousConnect.call(this,net.pre,...args);
        return dest;
      }
      return previousConnect.call(this,dest,...args);
    };
  }

  function updateNetworks(){
    networks.forEach?.(()=>{});
    // WeakMap is intentionally not iterable; current context is updated by the
    // knob through the exposed transport context marker below when available.
    document.dispatchEvent(new CustomEvent('303box:reverb-change',{detail:{value}}));
  }

  // Track networks explicitly as well, because WeakMap cannot be iterated.
  const live=[];
  const originalCreate=createNetwork;
  createNetwork=function(ctx,dest){
    const net=originalCreate(ctx,dest); live.push(net);
    ctx.addEventListener?.('statechange',()=>{if(ctx.state==='closed'){const i=live.indexOf(net);if(i>=0)live.splice(i,1)}},{once:false});
    return net;
  };

  function setValue(v){
    value=clamp(Math.round(v),0,100); localStorage.setItem(STORE,String(value));
    live.forEach(net=>{if(net.ctx.state!=='closed'){try{net.wet.gain.setTargetAtTime((value/100)*.42,net.ctx.currentTime,.025)}catch(_){net.wet.gain.value=(value/100)*.42}}});
    render(); updateNetworks();
  }

  function dialSvg(){
    const ticks=Array.from({length:11},(_,i)=>{const a=-135+i*27;return `<line class="dial-tick${i===0||i===5||i===10?' major':''}" x1="50" y1="5" x2="50" y2="11" transform="rotate(${a} 50 50)"/>`}).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${ticks}<circle class="dial-bezel" cx="50" cy="50" r="34"/><circle fill="#1b1b1f" stroke="#151517" stroke-width="2" cx="50" cy="50" r="29"/><circle class="dial-center" cx="50" cy="50" r="5"/><g class="pointer-group"><line class="dial-pointer" x1="50" y1="50" x2="50" y2="23"/></g></svg>`;
  }

  function mount(){
    const grid=$('#knobGrid'); if(!grid)return false;
    let wrap=grid.querySelector('[data-fx-knob="reverb"]');
    if(!wrap){
      wrap=document.createElement('div');wrap.className='knob fx-knob fx-reverb';wrap.dataset.fxKnob='reverb';
      wrap.innerHTML=`<span class="knob-title">REVERB</span><button type="button" class="knob-control" data-knob-id="reverb" role="slider" aria-label="REVERB">${dialSvg()}</button><span class="knob-value" data-fx-value="reverb"></span>`;
      grid.appendChild(wrap);
      const c=wrap.querySelector('.knob-control');let active=false,startY=0,startValue=0;
      c.addEventListener('pointerdown',e=>{active=true;startY=e.clientY;startValue=value;try{c.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
      c.addEventListener('pointermove',e=>{if(active)setValue(startValue+(startY-e.clientY)*.55)});
      const done=e=>{if(!active)return;active=false;try{c.releasePointerCapture(e.pointerId)}catch(_){}};
      c.addEventListener('pointerup',done);c.addEventListener('pointercancel',done);
      c.addEventListener('wheel',e=>{e.preventDefault();setValue(value+(e.deltaY<0?2:-2))},{passive:false});
      c.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();if(e.key==='Home')setValue(0);else if(e.key==='End')setValue(100);else setValue(value+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1))});
      c.addEventListener('dblclick',()=>setValue(0));
    }
    render();return true;
  }

  function render(){
    const c=$('[data-knob-id="reverb"]');if(!c)return;
    const angle=-135+(value/100)*270;c.querySelector('.pointer-group')?.setAttribute('transform',`rotate(${angle} 50 50)`);
    c.setAttribute('aria-valuemin','0');c.setAttribute('aria-valuemax','100');c.setAttribute('aria-valuenow',String(value));
    const out=$('[data-fx-value="reverb"]');if(out)out.textContent=`${value}%`;
  }

  window.addEventListener('303box:patch-randomized',()=>setValue(Math.random()<.42?0:Math.round(6+Math.random()*28)));
  function settle(){[0,80,220,600,1200,2200].forEach(ms=>setTimeout(mount,ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});
  window.__303boxMasterReverb={version:'1510',setValue,get value(){return value}};
})();