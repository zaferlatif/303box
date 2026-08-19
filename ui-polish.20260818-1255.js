(() => {
  'use strict';

  const MIGRATION='303box-acid-gnome-default-v3';
  let attempts=0;

  function currentBpm(){
    const value=Number(document.querySelector('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'));
    return Number.isFinite(value)?value:140;
  }

  function setTempo(value){
    const input=document.querySelector('#tempoInput');
    const form=document.querySelector('#tempoForm');
    const submit=document.querySelector('#tempoApply');
    if(!input||!form||!submit)return;
    input.value=String(Math.max(50,Math.min(250,Math.round(value))));
    try{form.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:submit}))}catch(_){submit.click()}
  }

  // Rhythm randomization never changes the bass/shared tempo.
  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#drumRandom'))return;
    const before=currentBpm();
    queueMicrotask(()=>setTempo(before));
  },true);

  function installTempoEnter(){
    const input=document.querySelector('#tempoInput');
    const apply=document.querySelector('#tempoApply');
    if(!input||!apply)return false;
    if(input.dataset.enterFixed==='1')return true;
    input.dataset.enterFixed='1';
    input.addEventListener('keydown',event=>{
      if(event.key!=='Enter')return;
      event.preventDefault();
      event.stopImmediatePropagation();
      apply.click();
    },true);
    return true;
  }

  function centerTempoCluster(){
    const module=document.querySelector('#patternSheet .tempo-module');
    const display=document.querySelector('#bpmDisplay');
    const knob=document.querySelector('#tempoKnob');
    if(!module||!display||!knob)return false;
    let cluster=module.querySelector('.tempo-cluster');
    if(!cluster){
      cluster=document.createElement('div');
      cluster.className='tempo-cluster';
      display.insertAdjacentElement('beforebegin',cluster);
    }
    if(display.parentElement!==cluster)cluster.appendChild(display);
    if(knob.parentElement!==cluster)cluster.appendChild(knob);
    return true;
  }

  function normalizeMeta(){
    const author=document.querySelector('#authorInput');
    const title=document.querySelector('#titleInput');
    if(!author||!title)return false;
    if(author.value.trim()==='DJ Pierre'||author.value.trim()==='New Order / The Pump Panel'||!author.value.trim())author.value='Z3Z';
    if(title.value.trim()==='Acig Gnome'||title.value.trim()==='Acid Tracks'||title.value.trim()==='Confusion / Blade Theme'||!title.value.trim())title.value='Acid Gnome';
    try{localStorage.setItem(MIGRATION,'1');localStorage.setItem('303box-reference-default-v1','1')}catch(_){}
    return true;
  }

  function settle(){
    attempts+=1;
    const ok=centerTempoCluster()&&installTempoEnter()&&normalizeMeta();
    if(!ok&&attempts<20)setTimeout(settle,40);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});
  else settle();

  window.__303boxUiPolish={version:'2000',settle};
})();
