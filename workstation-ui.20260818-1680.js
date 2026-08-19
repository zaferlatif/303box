(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const rand=(a,b)=>Math.round(a+Math.random()*(b-a));
  const KNOB_ORDER=['tune','cutoff','resonance','envMod','decay','accent','delay','distortion','reverb'];
  let busy=false,attempts=0;
  const tr=()=>document.documentElement.lang==='tr';
  const fire=(control,key)=>control?.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));

  function setKnob(id,value){
    const c=$(`[data-knob-id="${id}"]`);if(!c)return;
    const min=Number(c.getAttribute('aria-valuemin')),max=Number(c.getAttribute('aria-valuemax')),lo=Number.isFinite(min)?min:0,hi=Number.isFinite(max)?max:100,target=clamp(Math.round(value),lo,hi);
    if(target-lo<=hi-target){fire(c,'Home');for(let v=lo;v<target;v++)fire(c,'ArrowRight')}
    else{fire(c,'End');for(let v=hi;v>target;v--)fire(c,'ArrowLeft')}
  }

  function fallbackRandomizePatch(){
    const v={cutoff:rand(18,72),resonance:rand(68,100),envMod:rand(40,100),decay:rand(18,84),accent:rand(38,100),delay:rand(0,34),distortion:rand(0,48),reverb:rand(0,28)};
    if(Math.random()<.3)v.delay=0;if(Math.random()<.28)v.distortion=0;if(Math.random()<.38)v.reverb=0;
    Object.entries(v).forEach(([id,val])=>setKnob(id,val));
    window.dispatchEvent(new CustomEvent('303box:patch-randomized',{detail:v}));
    return v;
  }
  function randomizePatch(){return window.__303boxGeneratorRouter?.randomizePatch?.()||fallbackRandomizePatch()}

  function patchButton(){
    const tempo=$('#patternSheet .tempo-module');if(!tempo)return false;
    let b=$('#randomPatchButton');
    if(!b){b=document.createElement('button');b.type='button';b.id='randomPatchButton';b.className='random-patch-button tempo-random-patch';b.addEventListener('click',randomizePatch)}
    b.textContent=tr()?'RASTGELE PATCH':'RANDOM PATCH';
    b.setAttribute('aria-label',tr()?'303 synth düğmelerini rastgele ayarla':'Randomize 303 synth knobs');
    if(b.parentElement!==tempo)tempo.appendChild(b);
    return true;
  }

  function normalizeKnobs(){
    const grid=$('#knobGrid');if(!grid)return false;
    const nodes=KNOB_ORDER.map(id=>grid.querySelector(`[data-knob-id="${id}"]`)?.closest('.knob')).filter(Boolean);
    if(nodes.length<KNOB_ORDER.length)return false;
    nodes.forEach(n=>grid.appendChild(n));
    return true;
  }
  function normalizeActions(){
    const p=$('.pattern-actions .pattern-action-grid,.pattern-actions .toolbar-group');
    const pb=['#generateButton','#playButton','#downloadButton','#clearButton'].map(x=>$(x));
    if(p&&pb.every(Boolean))pb.forEach(b=>p.appendChild(b));
    const d=$('#drums .drum-actions'),db=['#drumRandom','#drumPlay','#drumDownload','#drumClear'].map(x=>$(x));
    if(d&&db.every(Boolean))db.forEach(b=>d.appendChild(b));
    return !!(p&&d&&pb.every(Boolean)&&db.every(Boolean));
  }
  function simplifyRhythm(){const drums=$('#drums');if(!drums)return false;drums.querySelectorAll('.drum-switch,.density').forEach(x=>x.remove());const tools=drums.querySelector('.drum-tools');if(tools&&!tools.children.length)tools.remove();return true}
  function removeLegacyIo(){$$('.sheet-io').forEach(io=>{if(!io.closest('#acidConsole'))io.remove()})}

  function apply(){
    if(busy)return false;busy=true;
    try{removeLegacyIo();const a=patchButton(),b=normalizeKnobs(),c=normalizeActions(),d=simplifyRhythm();return a&&b&&c&&d}
    finally{busy=false}
  }
  function bootSettle(){attempts+=1;if(!apply()&&attempts<28)setTimeout(bootSettle,40)}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootSettle,{once:true});else bootSettle();
  new MutationObserver(()=>patchButton()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxWorkstationUi={version:'2000',apply,randomizePatch};
})();
