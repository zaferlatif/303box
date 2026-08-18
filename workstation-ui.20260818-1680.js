(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const rand=(a,b)=>Math.round(a+Math.random()*(b-a));
  const KNOB_ORDER=['tune','cutoff','resonance','envMod','decay','accent','delay','distortion','reverb'];
  let busy=false;
  function tr(){return document.documentElement.lang==='tr'}
  function fire(control,key){control?.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))}
  function setKnob(id,value){const c=$(`[data-knob-id="${id}"]`);if(!c)return;const min=Number(c.getAttribute('aria-valuemin')),max=Number(c.getAttribute('aria-valuemax')),lo=Number.isFinite(min)?min:0,hi=Number.isFinite(max)?max:100,target=clamp(Math.round(value),lo,hi);if(target-lo<=hi-target){fire(c,'Home');for(let v=lo;v<target;v++)fire(c,'ArrowRight')}else{fire(c,'End');for(let v=hi;v>target;v--)fire(c,'ArrowLeft')}}
  function randomizePatch(){const p=Math.random();const v=p<.34?{cutoff:rand(12,38),resonance:rand(78,100),envMod:rand(58,96),decay:rand(24,58),accent:rand(52,92),delay:rand(0,22),distortion:rand(4,28),reverb:rand(0,22)}:p<.68?{cutoff:rand(28,58),resonance:rand(68,94),envMod:rand(42,82),decay:rand(35,76),accent:rand(38,78),delay:rand(8,34),distortion:rand(8,38),reverb:rand(4,28)}:{cutoff:rand(42,76),resonance:rand(72,100),envMod:rand(66,100),decay:rand(18,54),accent:rand(64,100),delay:rand(0,28),distortion:rand(18,52),reverb:rand(0,24)};if(Math.random()<.34)v.delay=0;if(Math.random()<.25)v.distortion=0;if(Math.random()<.4)v.reverb=0;Object.entries(v).forEach(([id,val])=>setKnob(id,val));window.dispatchEvent(new CustomEvent('303box:patch-randomized',{detail:v}))}
  function patchButton(){const tempo=$('#patternSheet .tempo-module');if(!tempo)return;let b=$('#randomPatchButton');if(!b){b=document.createElement('button');b.type='button';b.id='randomPatchButton';b.className='random-patch-button tempo-random-patch';b.addEventListener('click',randomizePatch)}b.textContent=tr()?'RASTGELE PATCH':'RANDOM PATCH';b.setAttribute('aria-label',tr()?'303 synth düğmelerini rastgele ayarla':'Randomize 303 synth knobs');if(b.parentElement!==tempo)tempo.appendChild(b)}
  function normalizeKnobs(){const grid=$('#knobGrid');if(!grid)return;const nodes=KNOB_ORDER.map(id=>grid.querySelector(`[data-knob-id="${id}"]`)?.closest('.knob')).filter(Boolean);const current=nodes.map(n=>[...grid.children].indexOf(n));const ordered=current.every((x,i)=>i===0||x>current[i-1]);if(!ordered)nodes.forEach(n=>grid.appendChild(n))}
  function normalizeActions(){const p=$('.pattern-actions .pattern-action-grid,.pattern-actions .toolbar-group');const pb=['#generateButton','#playButton','#downloadButton','#clearButton'].map(x=>$(x));if(p&&pb.every(Boolean))pb.forEach((b,i)=>{if(p.children[i]!==b)p.appendChild(b)});const d=$('#drums .drum-actions');const db=['#drumRandom','#drumPlay','#drumDownload','#drumClear'].map(x=>$(x));if(d&&db.every(Boolean))db.forEach((b,i)=>{if(d.children[i]!==b)d.appendChild(b)})}
  function simplifyRhythm(){const drums=$('#drums');if(!drums)return;drums.querySelectorAll('.drum-switch,.density').forEach(x=>x.remove());const tools=drums.querySelector('.drum-tools');if(tools&&!tools.children.length)tools.remove()}
  function removeLegacyIo(){$$('.sheet-io').forEach(io=>{if(!io.closest('#acidConsole'))io.remove()})}
  function apply(){if(busy)return;busy=true;try{removeLegacyIo();patchButton();normalizeKnobs();normalizeActions();simplifyRhythm()}finally{busy=false}}
  function settle(){[0,80,220,520,1100,1800].forEach(ms=>setTimeout(apply,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();window.addEventListener('load',settle,{once:true});new MutationObserver(()=>patchButton()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});window.__303boxWorkstationUi={version:'1680',apply,randomizePatch};
})();
