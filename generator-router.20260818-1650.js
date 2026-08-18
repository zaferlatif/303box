(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const chance=p=>Math.random()<p;
  const rnd=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const PITCH=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const PROFILES=[
    {intervals:[0,3,5,7,10],active:[8,11],kind:'jack',bpm:[118,126]},
    {intervals:[0,1,3,5,7,10],active:[9,12],kind:'warehouse',bpm:[124,132]},
    {intervals:[0,2,3,5,7,8,10],active:[8,12],kind:'hypnotic',bpm:[126,136]},
    {intervals:[0,1,3,5,6,7,10],active:[10,13],kind:'techno',bpm:[132,142]},
    {intervals:[0,3,5,6,7,10],active:[10,13],kind:'rave',bpm:[138,148]}
  ];
  const MASKS=[
    '1011010010110101','1101011010010110','1010110110100101','1110100110101100',
    '1001101110010110','1010011011010011','1100101011011010','1011011010100101',
    '1101101010011010','1011010110101001','1001110110011010','1110011010101100'
  ];
  const pc=n=>PITCH[(n%12+12)%12];

  function currentBpm(){
    return clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||Number($('#tempoInput')?.value)||140,50,250);
  }
  function setBpm(value){
    const v=clamp(Math.round(value),50,250);
    const input=$('#tempoInput'),form=$('#tempoForm'),submit=$('#tempoApply');
    if(input&&form&&submit){
      input.value=String(v);
      try{form.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:submit}))}
      catch(_){submit.click()}
      return;
    }
    const knob=$('[data-knob-id="bpm"]');
    if(knob){knob.setAttribute('aria-valuenow',String(v));knob.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  function chooseBpm(range){
    const cur=Math.round(currentBpm());
    let next=rnd(range[0],range[1]);
    for(let i=0;i<6&&next===cur;i++)next=rnd(range[0],range[1]);
    if(next===cur&&range[1]>range[0]) next=cur===range[1]?cur-1:cur+1;
    return clamp(next,range[0],range[1]);
  }
  function setWaveform(wave){
    const target=wave==='square'?$('#waveSquare'):$('#waveSaw');
    if(!target)return;
    const active=target.classList.contains('selected')||target.getAttribute('aria-pressed')==='true';
    if(!active)target.click();
  }

  function setCycle(button,value){
    if(!button)return;
    let values=[];try{values=JSON.parse(button.dataset.values||'[]')}catch(_){}
    if(!values.length){button.textContent=value;return}
    let guard=0;
    while(button.textContent.trim()!==value&&guard++<values.length+1)button.click();
  }
  function setNote(i,note){
    const picker=$$('.note-picker-v2')[i]||$$('.note-picker')[i];
    const input=$$('.note-input')[i];
    if(!input)return;
    if(picker){
      const wanted=note==='C+'?'C+':note;
      const option=[...picker.options].find(o=>o.value===wanted)||[...picker.options].find(o=>o.value===note);
      if(option){picker.value=option.value;picker.dispatchEvent(new Event('change',{bubbles:true}));return}
    }
    input.value=note==='C+'?'C':note;
    input.dataset.baseOctave=note==='C+'?'1':'0';
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function mutateMask(mask,target){
    const a=[...mask].map(Number);let guard=0;
    while(a.reduce((x,y)=>x+y,0)!==target&&guard++<100){
      const count=a.reduce((x,y)=>x+y,0);
      if(count>target){const c=a.map((v,i)=>v&&![0,4,8,12].includes(i)?i:-1).filter(i=>i>=0);if(c.length)a[pick(c)]=0}
      else{const c=a.map((v,i)=>!v?i:-1).filter(i=>i>=0);if(c.length)a[pick(c)]=1}
    }
    for(let q=0;q<4;q++){const s=q*4;if(!a.slice(s,s+4).some(Boolean))a[s+pick([0,2,3])]=1}
    return a;
  }
  function generateBass(){
    const profile=pick(PROFILES),root=rnd(0,11),scale=profile.intervals.map(x=>pc(root+x));
    const mask=mutateMask(pick(MASKS),rnd(profile.active[0],profile.active[1]));
    const motif=[pick(scale),pick(scale),pick(scale),pick(scale)];if(chance(.66))motif[2]=motif[0];
    const notes=Array(16).fill(pc(root)),oct=Array(16).fill(''),expr=Array(16).fill(''),gate=mask.map(v=>v?'●':'-');
    let last=pc(root);
    for(let i=0;i<16;i++){
      if(!mask[i]){notes[i]=last;continue}
      let n=motif[i%4];if(chance(i>=8?.35:.2))n=pick(scale);if(chance(.16))n=last;notes[i]=n;last=n;
      if(chance(i>=12?.13:.06))oct[i]='U';else if(chance(.09))oct[i]='D';
    }
    const active=mask.map((v,i)=>v?i:-1).filter(i=>i>=0);
    active.map(i=>({i,s:(i%4===2?2.1:0)+(i%4===3?1.4:0)+Math.random()*2})).sort((a,b)=>b.s-a.s).slice(0,rnd(3,5)).forEach(x=>expr[x.i]='A');
    active.filter(i=>i<15&&mask[i+1]&&notes[i]!==notes[i+1]).sort(()=>Math.random()-.5).slice(0,rnd(1,3)).forEach(i=>{expr[i]=expr[i]==='A'?'AS':'S';gate[i]='○'});
    active.filter(i=>i<15&&mask[i+1]&&!expr[i].includes('S')).sort(()=>Math.random()-.5).slice(0,rnd(0,2)).forEach(i=>gate[i]='○');
    for(let i=0;i<16;i++){
      setNote(i,notes[i]);
      setCycle($$('.octave-cell')[i],oct[i]);
      setCycle($$('.accentSlide-cell')[i],expr[i]);
      setCycle($$('.gate-cell')[i],gate[i]);
    }
    setBpm(chooseBpm(profile.bpm));
    setWaveform(chance(.5)?'saw':'square');
    window.dispatchEvent(new CustomEvent('303box:bass-generated',{detail:{profile:profile.kind,bpm:currentBpm()}}));
  }

  function blank(){return Object.fromEntries(['bd','sd','cp','tm','ch','oh'].map(id=>[id,Array(16).fill(false)]))}
  const add=(a,steps,p=1)=>steps.forEach(i=>{if(chance(p))a[i]=true});
  function drumPattern(){
    const kind=pick(PROFILES).kind,o=blank();
    add(o.bd,[0,4,8,12],.99);
    if(kind==='techno'||kind==='rave')add(o.bd,[3,7,11,14],kind==='rave'?.28:.18);
    else add(o.bd,[3,7,10,14],.1);
    add(o.sd,[4,12],kind==='jack'?.55:.72);add(o.cp,[4,12],kind==='warehouse'?.9:.72);
    const chBase=kind==='hypnotic'?[0,2,4,6,8,10,12,14]:[0,1,3,4,5,7,8,9,11,12,13,15];
    add(o.ch,chBase,kind==='rave'?.72:.58);add(o.oh,[2,6,10,14],kind==='warehouse'?.78:.52);
    if(kind==='rave'||kind==='techno')add(o.tm,[7,15],.4);else add(o.tm,[11,15],.22);
    return o;
  }
  function generateDrums(){
    const p=drumPattern();
    Object.entries(p).forEach(([id,row])=>row.forEach((wanted,i)=>{
      const b=$(`#drums .drum-step[data-drum="${id}"][data-step="${i}"]`);
      if(b&&b.classList.contains('on')!==wanted)b.click();
    }));
    window.__303boxHatGrid?.capture?.();
    window.dispatchEvent(new CustomEvent('303box:drums-generated'));
  }

  window.addEventListener('click',e=>{
    if(e.target.closest?.('#generateButton')){e.preventDefault();e.stopImmediatePropagation();generateBass();return}
    if(e.target.closest?.('#drumRandom')){e.preventDefault();e.stopImmediatePropagation();generateDrums()}
  },true);
  window.addEventListener('keydown',e=>{
    if(e.key?.toLowerCase()!=='r'||e.ctrlKey||e.metaKey||e.altKey)return;
    const t=document.activeElement;if(t&&(['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||t.isContentEditable))return;
    e.preventDefault();e.stopImmediatePropagation();generateBass();
  },true);
  window.__303boxGeneratorRouter={version:'1650',generateBass,generateDrums};
})();