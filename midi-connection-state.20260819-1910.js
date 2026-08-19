(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  let changing=false,headObserver=null;

  function removeLegacyGrid(){
    document.getElementById('midiGridAuthority2110')?.remove();
  }

  function ensureLayoutRepair(){
    removeLegacyGrid();
    const href='./midi-layout-fix.20260819-2150.css?v=20260820-2201';
    const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>(x.getAttribute('href')||'').includes('midi-layout-fix.20260819-2150.css'));
    if(existing){
      if(!(existing.getAttribute('href')||'').includes('20260820-2201'))existing.href=href;
      existing.dataset.midiLayoutAuthority='2201';
      return;
    }
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.dataset.midiLayoutAuthority='2201';
    document.head.appendChild(link);
  }

  function watchLegacyGrid(){
    if(headObserver||!document.head)return;
    headObserver=new MutationObserver(()=>{
      if(document.getElementById('midiGridAuthority2110')){
        removeLegacyGrid();
        ensureLayoutRepair();
      }
    });
    headObserver.observe(document.head,{childList:true});
  }

  function routerState(){
    try{return window.__303boxMidiRouter?.state||null}catch(_){return null}
  }
  function isReady(){return !!$('#midiRouterBadge')?.classList.contains('ready')}

  function dispatchChange(el,value){
    if(!el||el.value===value)return false;
    el.value=value;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function updateRecVisibility(){
    const row=$('#midiRecAssist');if(!row)return;
    const st=routerState();
    const realT8=!!(isReady()&&st?.effective==='t8');
    row.hidden=!realT8;
    row.setAttribute('aria-hidden',String(!realT8));
  }

  function neutralizeDisconnectedHardware(){
    if(changing)return;
    const root=$('#midiRouter');if(!root)return;
    const ready=isReady();

    if(!ready){
      changing=true;
      try{
        dispatchChange($('#midiDeviceProfile'),'auto');
        dispatchChange($('#midiRouterOut'),'');
      }finally{changing=false}
    }
    updateRecVisibility();
  }

  function init(){
    ensureLayoutRepair();
    watchLegacyGrid();
    const root=$('#midiRouter');if(!root)return;
    neutralizeDisconnectedHardware();
    const observer=new MutationObserver(neutralizeDisconnectedHardware);
    observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled','value']});
    root.addEventListener('change',()=>queueMicrotask(neutralizeDisconnectedHardware));
    root.addEventListener('click',()=>setTimeout(neutralizeDisconnectedHardware,0));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){ensureLayoutRepair();neutralizeDisconnectedHardware()}});
    window.__303boxMidiConnectionState={version:'2201',refresh(){ensureLayoutRepair();neutralizeDisconnectedHardware()}};
  }

  ensureLayoutRepair();
  watchLegacyGrid();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
