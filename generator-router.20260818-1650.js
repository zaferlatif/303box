(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const rf=()=>{try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch(_){return Math.random()}};
  const pick=a=>a[Math.floor(rf()*a.length)];
  const chance=p=>rf()<p;
  const rnd=(a,b)=>Math.floor(a+rf()*(b-a+1));
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const PITCH=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const HISTORY='303box-random-history-v3';
  const PROFILES=[
    {id:'warehouse',intervals:[0,1,3,5,7,10],density:[8,11],bpm:[134,143],accent:[3,5],slides:[1,3],patch:'bite'},
    {id:'hypnotic',intervals:[0,2,3,5,7,8,10],density:[7,10],bpm:[132,141],accent:[2,4],slides:[2,4],patch:'hollow'},
    {id:'rave',intervals:[0,3,5,6,7,10],density:[10,13],bpm:[142,152],accent:[4,6],slides:[2,4],patch:'hot'},
    {id:'phrygian',intervals:[0,1,3,5,7,8,10],density:[8,12],bpm:[136,146],accent:[3,5],slides:[2,4],patch:'rubber'},
    {id:'jack',intervals:[0,3,5,7,10],density:[7,10],bpm:[132,140],accent:[3,5],slides:[1,3],patch:'dry'},
    {id:'chromatic',intervals:[0,1,2,3,5,6,7,10],density:[9,12],bpm:[138,149],accent:[3,6],slides:[2,5],patch:'corrosive'},
    {id:'rolling',intervals:[0,2,3,5,7,9,10],density:[10,13],bpm:[136,146],accent:[3,5],slides:[2,4],patch:'liquid'},
    {id:'dark',intervals:[0,1,3,4,6,7,10],density:[8,11],bpm:[140,154],accent:[3,6],slides:[1,4],patch:'metal'}
  ];
  const PATCHES={
    bite:{cutoff:[18,42],resonance:[82,100],envMod:[64,96],decay:[20,52],accent:[62,96],delay:[0,16],distortion:[8,28],reverb:[0,12],tune:[-3,4]},
    hollow:{cutoff:[24,54],resonance:[70,92],envMod:[42,76],decay:[48,82],accent:[38,68],delay:[12,34],distortion:[0,18],reverb:[8,28],tune:[-5,5]},
    hot:{cutoff:[38,74],resonance:[84,100],envMod:[70,100],decay:[16,46],accent:[74,100],delay:[0,20],distortion:[24,58],reverb:[0,14],tune:[-2,7]},
    rubber:{cutoff:[22,48],resonance:[76,98],envMod:[50,88],decay:[54,88],accent:[48,82],delay:[4,24],distortion:[4,24],reverb:[0,18],tune:[-7,3]},
    dry:{cutoff:[30,62],resonance:[66,88],envMod:[34,68],decay:[18,42],accent:[42,72],delay:[0,8],distortion:[0,16],reverb:[0,6],tune:[-4,4]},
    corrosive:{cutoff:[46,80],resonance:[88,100],envMod:[76,100],decay:[18,58],accent:[64,100],delay:[0,26],distortion:[28,64],reverb:[0,16],tune:[-6,6]},
    liquid:{cutoff:[26,58],resonance:[74,96],envMod:[58,92],decay:[58,92],accent:[44,82],delay:[16,42],distortion:[2,22],reverb:[10,34],tune:[-4,7]},
    metal:{cutoff:[34,68],resonance:[90,100],envMod:[68,100],decay:[24,64],accent:[56,92],delay:[2,20],distortion:[18,46],reverb:[4,22],tune:[-8,4]}
  };
  let lastProfile=null,startupDone=false;
  const pc=n=>PITCH[(n%12+12)%12];

  function readHistory(){try{return JSON.parse(localStorage.getItem(HISTORY)||'{}')||{}}catch(_){return{}}}
  function pushHistory(type,sig){const h=readHistory(),a=Array.isArray(h[type])?h[type]:[];a.unshift(sig);h[type]=[...new Set(a)].slice(0,18);try{localStorage.setItem(HISTORY,JSON.stringify(h))}catch(_){}}
  function seen(type,sig){return (readHistory()[type]||[]).includes(sig)}
  function currentBpm(){return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||Number($('#tempoInput')?.value)||140,50,250)}
  function setBpm(value){
    const v=clamp(Math.round(value),50,250),input=$('#tempoInput'),form=$('#tempoForm'),submit=$('#tempoApply');
    if(input&&form&&submit){input.value=String(v);try{form.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:submit}))}catch(_){submit.click()}return}
    const knob=$('[data-knob-id="bpm"]');if(knob){knob.setAttribute('aria-valuenow',String(v));knob.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  function fire(c,key){c?.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))}
  function setKnob(id,value){
    const c=$(`[data-knob-id="${id}"]`);if(!c)return;
    const min=Number(c.getAttribute('aria-valuemin')),max=Number(c.getAttribute('aria-valuemax')),lo=Number.isFinite(min)?min:0,hi=Number.isFinite(max)?max:100,target=clamp(Math.round(value),lo,hi);
    if(target-lo<=hi-target){fire(c,'Home');for(let v=lo;v<target;v++)fire(c,'ArrowRight')}else{fire(c,'End');for(let v=hi;v>target;v--)fire(c,'ArrowLeft')}
  }
  function setWaveform(wave){const target=wave==='square'?$('#waveSquare'):$('#waveSaw');if(!target)return;const active=target.classList.contains('selected')||target.getAttribute('aria-pressed')==='true';if(!active)target.click()}
  function setCycle(button,value){if(!button)return;let values=[];try{values=JSON.parse(button.dataset.values||'[]')}catch(_){}if(!values.length){button.textContent=value;return}let guard=0;while(button.textContent.trim()!==value&&guard++<values.length+2)button.click()}
  function setNote(i,note){
    const picker=$$('[data-note-picker]')[i]||$$('.note-picker-v2')[i]||$$('.note-picker')[i],input=$$('.note-input')[i];if(!input)return;
    if(picker){const option=[...picker.options].find(o=>o.value===note);if(option){picker.value=option.value;picker.dispatchEvent(new Event('change',{bubbles:true}));return}}
    input.value=note;input.dataset.baseOctave='0';input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function choosePatch(profile){return PATCHES[profile?.patch]||PATCHES[pick(Object.keys(PATCHES))]}
  function randomizePatch(profile=lastProfile||pick(PROFILES)){
    const p=choosePatch(profile),vals={};
    Object.entries(p).forEach(([id,range])=>vals[id]=rnd(range[0],range[1]));
    if(chance(.28))vals.delay=0;if(chance(.34))vals.reverb=0;if(chance(.18))vals.distortion=0;
    const wave=(profile.id==='hot'||profile.id==='corrosive')?(chance(.62)?'saw':'square'):(chance(.52)?'saw':'square');
    vals.wave=wave;
    let sig=JSON.stringify(vals),tries=0;
    while(seen('patch',sig)&&tries++<12){Object.entries(p).forEach(([id,range])=>vals[id]=rnd(range[0],range[1]));vals.wave=chance(.5)?'saw':'square';sig=JSON.stringify(vals)}
    ['tune','cutoff','resonance','envMod','decay','accent','delay','distortion','reverb'].forEach(id=>setKnob(id,vals[id]));
    setWaveform(vals.wave);pushHistory('patch',sig);window.dispatchEvent(new CustomEvent('303box:patch-randomized',{detail:vals}));return vals;
  }

  function buildMask(profile){
    const target=rnd(profile.density[0],profile.density[1]),a=Array(16).fill(0);
    const weights=[.82,.36,.52,.46,.76,.38,.58,.48,.80,.35,.56,.48,.78,.40,.62,.52];
    for(let i=0;i<16;i++)a[i]=chance(weights[i])?1:0;
    if(!a.some(Boolean))a[0]=1;
    let guard=0;
    while(a.reduce((x,y)=>x+y,0)!==target&&guard++<120){
      const count=a.reduce((x,y)=>x+y,0);
      if(count>target){const candidates=a.map((v,i)=>v&&![0,4,8,12].includes(i)?i:-1).filter(i=>i>=0);if(candidates.length)a[pick(candidates)]=0;else a[pick(a.map((v,i)=>v?i:-1).filter(i=>i>=0))]=0}
      else{const candidates=a.map((v,i)=>!v?i:-1).filter(i=>i>=0);if(candidates.length)a[pick(candidates)]=1}
    }
    for(let q=0;q<4;q++){const s=q*4;if(!a.slice(s,s+4).some(Boolean))a[s+pick([0,1,2,3])]=1}
    if(chance(.35)){const shift=pick([1,2,3,5,7]);return a.map((_,i)=>a[(i-shift+16)%16])}
    return a;
  }
  function weightedScale(scale,root){const bag=[pc(root),pc(root),pc(root+7),pc(root+7),...scale,...scale];return()=>pick(bag)}
  function makeBassCandidate(profile){
    const root=rnd(0,11),scale=profile.intervals.map(x=>pc(root+x)),mask=buildMask(profile),notePick=weightedScale(scale,root);
    const motifLen=pick([3,4,4,5,6]),motif=Array.from({length:motifLen},()=>notePick());if(chance(.55))motif[0]=pc(root);if(chance(.4)&&motifLen>3)motif[motifLen-1]=pc(root+7);
    const notes=Array(16).fill(pc(root)),oct=Array(16).fill(''),expr=Array(16).fill(''),gate=mask.map(v=>v?'●':'-');
    let last=pc(root);
    for(let i=0;i<16;i++){
      if(!mask[i]){notes[i]=last;continue}
      let n=motif[i%motifLen];
      if(i>=8&&chance(.44))n=notePick();
      if(chance(.12))n=last;
      if(chance(.1))n=pc(root+pick(profile.intervals));
      notes[i]=n;last=n;
      if(chance(i>=12?.16:.07))oct[i]='U';else if(chance(.08))oct[i]='D';
    }
    const active=mask.map((v,i)=>v?i:-1).filter(i=>i>=0);
    active.map(i=>({i,score:([0,4,8,12].includes(i)?1.6:0)+(i%4===2?1.4:0)+rf()*2.2})).sort((a,b)=>b.score-a.score).slice(0,rnd(profile.accent[0],profile.accent[1])).forEach(x=>expr[x.i]='A');
    const slideCandidates=active.filter(i=>i<15&&mask[i+1]&&notes[i]!==notes[i+1]).sort(()=>rf()-.5);
    slideCandidates.slice(0,Math.min(slideCandidates.length,rnd(profile.slides[0],profile.slides[1]))).forEach(i=>{expr[i]=expr[i]==='A'?'AS':'S';gate[i]='○'});
    active.filter(i=>i<15&&mask[i+1]&&!expr[i].includes('S')&&chance(.16)).forEach(i=>gate[i]='○');
    const bpm=rnd(profile.bpm[0],profile.bpm[1]),wave=chance(profile.id==='hot'||profile.id==='corrosive'?.62:.5)?'saw':'square';
    return{profile,notes,oct,expr,gate,bpm,wave,sig:[notes.join(','),oct.join(''),expr.join(','),gate.join(''),bpm,wave].join('|')};
  }
  function generateBass(show=true){
    let c,tries=0;do{const p=pick(PROFILES);c=makeBassCandidate(p)}while(seen('bass',c.sig)&&tries++<28);
    lastProfile=c.profile;
    for(let i=0;i<16;i++){setNote(i,c.notes[i]);setCycle($$('.octave-cell')[i],c.oct[i]);setCycle($$('.accentSlide-cell')[i],c.expr[i]);setCycle($$('.gate-cell')[i],c.gate[i])}
    setBpm(c.bpm);randomizePatch(c.profile);pushHistory('bass',c.sig);
    window.dispatchEvent(new CustomEvent('303box:bass-generated',{detail:{profile:c.profile.id,bpm:c.bpm}}));
    return c;
  }

  function blank(){return Object.fromEntries(['bd','sd','cp','tm','ch','oh'].map(id=>[id,Array(16).fill(false)]))}
  const add=(a,steps,p=1)=>steps.forEach(i=>{if(chance(p))a[i]=true});
  function makeDrums(profile=lastProfile||pick(PROFILES)){
    const o=blank(),id=profile.id;
    add(o.bd,[0,4,8,12],id==='rolling'?.82:.96);
    add(o.bd,[2,3,6,7,10,11,14,15],id==='rave'?.24:id==='dark'?.2:.11);
    if(chance(.3)){const miss=pick([4,8,12]);o.bd[miss]=false;o.bd[(miss+pick([1,3]))%16]=true}
    add(o.sd,[4,12],id==='jack'?.52:.72);add(o.cp,[4,12],id==='warehouse'||id==='rave'?.88:.64);
    if(chance(.22))add(o.cp,[3,11],.45);
    const hats=id==='hypnotic'||id==='rolling'?[0,2,4,6,8,10,12,14]:[0,1,3,4,5,7,8,9,11,12,13,15];
    add(o.ch,hats,id==='rave'?.78:id==='dark'?.64:.57);add(o.oh,[2,6,10,14],id==='warehouse'?.8:id==='rave'?.7:.48);
    if(chance(.35)){const p=pick([1,5,9,13]);o.oh[p]=true;o.ch[p]=false}
    add(o.tm,[7,15],id==='rave'||id==='dark'?.5:.24);if(chance(.24))add(o.tm,[10,11,14],.35);
    const sig=Object.entries(o).map(([k,v])=>k+v.map(x=>x?'1':'0').join('')).join('|');return{o,sig,profile};
  }
  function generateDrums(profile=lastProfile||pick(PROFILES)){
    let c,tries=0;do{c=makeDrums(profile)}while(seen('drums',c.sig)&&tries++<20);
    Object.entries(c.o).forEach(([id,row])=>row.forEach((wanted,i)=>{const b=$(`#drums .drum-step[data-drum="${id}"][data-step="${i}"]`);if(b&&b.classList.contains('on')!==wanted)b.click()}));
    pushHistory('drums',c.sig);window.__303boxHatGrid?.capture?.();window.dispatchEvent(new CustomEvent('303box:drums-generated',{detail:{profile:c.profile.id}}));return c;
  }

  function startup(){
    if(startupDone)return;startupDone=true;
    const run=()=>{
      if(!$$('.note-input').length||!$('#drums')){startupDone=false;setTimeout(startup,180);return}
      const bass=generateBass(false);generateDrums(bass.profile);
      try{localStorage.removeItem('303-session')}catch(_){}
    };
    setTimeout(run,1280);
  }

  window.addEventListener('click',e=>{
    if(e.target.closest?.('#generateButton')){e.preventDefault();e.stopImmediatePropagation();generateBass(true);return}
    if(e.target.closest?.('#drumRandom')){e.preventDefault();e.stopImmediatePropagation();generateDrums();return}
    if(e.target.closest?.('#randomPatchButton')){e.preventDefault();e.stopImmediatePropagation();randomizePatch();return}
  },true);
  window.addEventListener('keydown',e=>{
    if(e.key?.toLowerCase()!=='r'||e.ctrlKey||e.metaKey||e.altKey)return;
    const target=document.activeElement;if(target&&(['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable))return;
    e.preventDefault();e.stopImmediatePropagation();generateBass(true);
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startup,{once:true});else startup();
  window.__303boxGeneratorRouter={version:'1920',generateBass,generateDrums,randomizePatch};
})();